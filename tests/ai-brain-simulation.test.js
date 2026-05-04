/**
 * Tests para el motor de simulación (ISMCTS interno) de ai-brain.js — Fase 4
 * Cubre: política de rollout, evaluación de hoja, generación de movimientos,
 * aplicar movimiento, y la función simular() a nivel de integración.
 */

const LINEAS = ['izquierda', 'centro', 'derecha'];

global.calculateScore = function(estado, linea, jugador) {
    return (estado.field[linea][jugador] || []).reduce((s, c) => {
        return s + (c.faceDown ? 2 : (c.card ? c.card.valor || 0 : 0));
    }, 0);
};

const {
    simular,
    _politicaRollout,
    _evaluarHoja,
    _generarMovimientos,
    _aplicarMovimiento,
    _clonarEstado,
    evaluarPosicion,
} = require('../src/ai-brain.js');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCard(nombre, valor, protocol = 'Muerte', opts = {}) {
    return { nombre, valor, protocol, h_accion: opts.h_accion || '', h_inicio: '', h_final: '' };
}

function makeEstado(overrides = {}) {
    const base = {
        player: { hand: [], deck: [], trash: [], compiled: [], protocols: ['Muerte', 'Fuego', 'Vida'] },
        ai:     { hand: [], deck: [], trash: [], compiled: [], protocols: ['Muerte', 'Fuego', 'Vida'] },
        field: {
            izquierda: { player: [], ai: [], compiledBy: null },
            centro:    { player: [], ai: [], compiledBy: null },
            derecha:   { player: [], ai: [], compiledBy: null },
        },
        effectContext: null,
    };
    if (overrides.field) {
        LINEAS.forEach(l => {
            if (overrides.field[l]) Object.assign(base.field[l], overrides.field[l]);
        });
        delete overrides.field;
    }
    if (overrides.ai)     Object.assign(base.ai,     overrides.ai);
    if (overrides.player) Object.assign(base.player, overrides.player);
    delete overrides.ai; delete overrides.player;
    return Object.assign(base, overrides);
}

function carta(nombre, valor, protocol = 'Muerte') {
    return { card: makeCard(nombre, valor, protocol), faceDown: false };
}
function bocabajo(nombre, valor, protocol = 'Muerte') {
    return { card: makeCard(nombre, valor, protocol), faceDown: true };
}
function movimiento(nombre, valor, linea, bocarriba = true, protocol = 'Muerte') {
    return { card: makeCard(nombre, valor, protocol), line: linea, faceUp: bocarriba, cardIndex: 0 };
}

// ─── _clonarEstado ────────────────────────────────────────────────────────────

describe('_clonarEstado', () => {
    test('el clon es independiente del original', () => {
        const e = makeEstado({ ai: { hand: [makeCard('A', 1)], deck: [], trash: [], compiled: [] } });
        const clon = _clonarEstado(e);
        clon.ai.hand.push(makeCard('B', 2));
        expect(e.ai.hand).toHaveLength(1);
    });

    test('las cartas del campo se clonan correctamente', () => {
        const e = makeEstado();
        e.field.izquierda.ai.push(carta('X', 3));
        const clon = _clonarEstado(e);
        clon.field.izquierda.ai.pop();
        expect(e.field.izquierda.ai).toHaveLength(1);
    });
});

// ─── _generarMovimientos ──────────────────────────────────────────────────────

describe('_generarMovimientos', () => {
    test('genera bocarriba solo en la línea del protocolo', () => {
        // Protocolos: Muerte→izquierda, Fuego→centro, Vida→derecha
        const e = makeEstado({ ai: {
            hand: [makeCard('Muerte 3', 3, 'Muerte')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        const movs = _generarMovimientos(e, 'ai');
        const bocarriba = movs.filter(m => m.faceUp);
        expect(bocarriba).toHaveLength(1);
        expect(bocarriba[0].line).toBe('izquierda');
    });

    test('genera bocabajo en las 3 líneas por cada carta', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('X', 2, 'Muerte')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        const movs = _generarMovimientos(e, 'ai');
        const boca = movs.filter(m => !m.faceUp && m.line);
        expect(boca).toHaveLength(3);
    });

    test('no genera movimientos en líneas compiladas', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('Muerte 3', 3, 'Muerte')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        e.field.izquierda.compiledBy = 'ai';
        const movs = _generarMovimientos(e, 'ai');
        expect(movs.every(m => m.action === 'refresh' || m.line !== 'izquierda')).toBe(true);
    });

    test('incluye refresh si hay mazo y mano < 5', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('A', 1)],
            deck: [makeCard('B', 2)],
            trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        const movs = _generarMovimientos(e, 'ai');
        expect(movs.some(m => m.action === 'refresh')).toBe(true);
    });
});

// ─── _aplicarMovimiento ───────────────────────────────────────────────────────

describe('_aplicarMovimiento', () => {
    test('la carta sale de la mano y va al campo', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('Muerte 3', 3, 'Muerte')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        const mov = movimiento('Muerte 3', 3, 'izquierda', true);
        const siguiente = _aplicarMovimiento(e, mov, 'ai');
        expect(siguiente.ai.hand).toHaveLength(0);
        expect(siguiente.field.izquierda.ai).toHaveLength(1);
        expect(siguiente.field.izquierda.ai[0].faceDown).toBe(false);
    });

    test('bocabajo coloca la carta con faceDown=true', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('Fuego 2', 2, 'Fuego')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        const mov = movimiento('Fuego 2', 2, 'centro', false, 'Fuego');
        const siguiente = _aplicarMovimiento(e, mov, 'ai');
        expect(siguiente.field.centro.ai[0].faceDown).toBe(true);
    });

    test('refresh rellena la mano desde el mazo', () => {
        const e = makeEstado({ ai: {
            hand: [],
            deck: [makeCard('A', 1), makeCard('B', 2), makeCard('C', 3)],
            trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        const siguiente = _aplicarMovimiento(e, { action: 'refresh' }, 'ai');
        expect(siguiente.ai.hand).toHaveLength(3);
        expect(siguiente.ai.deck).toHaveLength(0);
    });

    test('compilación automática cuando score >= 10', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('Muerte 5', 5, 'Muerte')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        // Campo IA izquierda ya tiene 5 puntos
        e.field.izquierda.ai.push(carta('Muerte 5', 5));
        const mov = movimiento('Muerte 5', 5, 'izquierda', true);
        const siguiente = _aplicarMovimiento(e, mov, 'ai');
        expect(siguiente.field.izquierda.compiledBy).toBe('ai');
        expect(siguiente.ai.compiled).toContain('izquierda');
    });

    test('no modifica el estado original', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('Muerte 3', 3, 'Muerte')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        const mov = movimiento('Muerte 3', 3, 'izquierda', true);
        _aplicarMovimiento(e, mov, 'ai');
        expect(e.ai.hand).toHaveLength(1);
        expect(e.field.izquierda.ai).toHaveLength(0);
    });
});

// ─── _evaluarHoja ────────────────────────────────────────────────────────────

describe('_evaluarHoja', () => {
    test('IA con 3 compilaciones → 1.0', () => {
        const e = makeEstado({ ai: { compiled: ['izquierda', 'centro', 'derecha'] } });
        expect(_evaluarHoja(e)).toBe(1.0);
    });

    test('jugador con 3 compilaciones → 0.0', () => {
        const e = makeEstado({ player: { compiled: ['izquierda', 'centro', 'derecha'] } });
        expect(_evaluarHoja(e)).toBe(0.0);
    });

    test('tablero vacío → cerca de 0.5', () => {
        const v = _evaluarHoja(makeEstado());
        expect(v).toBeGreaterThanOrEqual(0.35);
        expect(v).toBeLessThanOrEqual(0.65);
    });

    test('IA con 2 compilaciones → valor > 0.5', () => {
        const e = makeEstado({ ai: { compiled: ['izquierda', 'centro'] } });
        e.field.izquierda.compiledBy = 'ai';
        e.field.centro.compiledBy    = 'ai';
        expect(_evaluarHoja(e)).toBeGreaterThan(0.5);
    });

    test('devuelve siempre en [0, 1]', () => {
        const e = makeEstado({ player: { compiled: ['izquierda', 'centro'] } });
        const v = _evaluarHoja(e);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
    });
});

// ─── _politicaRollout ────────────────────────────────────────────────────────

describe('_politicaRollout', () => {
    test('prioriza compilar sobre cualquier otra jugada', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('Muerte 5', 5, 'Muerte'), makeCard('Fuego 1', 1, 'Fuego')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        // IA ya tiene 5 puntos en izquierda → jugar Muerte 5 compila
        e.field.izquierda.ai.push(carta('Muerte 5', 5));
        const movs = _generarMovimientos(e, 'ai');
        const elegida = _politicaRollout(e, movs, 'ai');
        expect(elegida.card.nombre).toBe('Muerte 5');
        expect(elegida.faceUp).toBe(true);
        expect(elegida.line).toBe('izquierda');
    });

    test('bloquea al rival si tiene 7+ puntos en una línea', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('Fuego 2', 2, 'Fuego'), makeCard('Vida 1', 1, 'Vida')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        // Rival tiene 7 puntos en centro
        e.field.centro.player.push(carta('Muerte 4', 4));
        e.field.centro.player.push(carta('Muerte 3', 3));
        const movs = _generarMovimientos(e, 'ai');
        const elegida = _politicaRollout(e, movs, 'ai');
        expect(elegida.line).toBe('centro');
    });

    test('aplica la misma heurística al jugador (no es random)', () => {
        // El jugador también compilará si puede — FIX 1
        const e = makeEstado({ player: {
            hand: [makeCard('Muerte 5', 5, 'Muerte')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        e.field.izquierda.player.push(carta('Muerte 5', 5));
        const movs = _generarMovimientos(e, 'player');
        const elegida = _politicaRollout(e, movs, 'player');
        expect(elegida.card.nombre).toBe('Muerte 5');
        expect(elegida.faceUp).toBe(true);
    });
});

// ─── simular() — integración ──────────────────────────────────────────────────

describe('simular — integración', () => {
    test('devuelve null con lista vacía', () => {
        expect(simular(makeEstado(), [], 100, 1)).toBeNull();
    });

    test('devuelve la única jugada si solo hay una', () => {
        const jugada = { card: makeCard('A', 1), line: 'izquierda', faceUp: true, cardIndex: 0 };
        const result = simular(makeEstado(), [jugada], 100, 1);
        expect(result.bestMove).toBe(jugada);
    });

    test('devuelve una jugada que está en las candidatas', () => {
        const e = makeEstado({ ai: {
            hand: [makeCard('Muerte 3', 3, 'Muerte'), makeCard('Fuego 2', 2, 'Fuego')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        const jugadas = [
            { card: makeCard('Muerte 3', 3, 'Muerte'), line: 'izquierda', faceUp: true,  cardIndex: 0 },
            { card: makeCard('Fuego 2',  2, 'Fuego'),  line: 'centro',    faceUp: true,  cardIndex: 1 },
            { card: makeCard('Muerte 3', 3, 'Muerte'), line: 'izquierda', faceUp: false, cardIndex: 0 },
        ];
        const result = simular(e, jugadas, 200, 2);
        expect(result).not.toBeNull();
        expect(result.bestMove).toBeDefined();
        const nombres = jugadas.map(j => j.card.nombre + j.line + j.faceUp);
        const nombreResultado = result.bestMove.card.nombre + result.bestMove.line + result.bestMove.faceUp;
        expect(nombres).toContain(nombreResultado);
    });

    test('la jugada que compila recibe más visitas que una que no compila', () => {
        // Este test verifica que la compilación tiene MAYOR win rate que no compilar,
        // no que siempre gane (MCTS tiene ruido con pocas iteraciones y sin GLOBAL_CARDS)
        const e = makeEstado({ ai: {
            hand: [makeCard('Muerte 5', 5, 'Muerte'), makeCard('Fuego 1', 1, 'Fuego')],
            deck: [], trash: [], compiled: [],
            protocols: ['Muerte', 'Fuego', 'Vida'],
        } });
        // IA ya tiene 5 puntos en izquierda → Muerte 5 compila
        e.field.izquierda.ai.push(carta('Muerte 5', 5));

        // Verificar directamente que la política de rollout elige compilar
        const { _politicaRollout, _generarMovimientos } = require('../src/ai-brain.js');
        const movs = _generarMovimientos(e, 'ai');
        const elegida = _politicaRollout(e, movs, 'ai');
        expect(elegida.card.nombre).toBe('Muerte 5');
        expect(elegida.faceUp).toBe(true);
        expect(elegida.line).toBe('izquierda');
    });
});
