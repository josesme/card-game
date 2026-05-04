/**
 * Tests para el evaluador de posición de ai-brain.js — Fase 2
 * Cubre cada componente por separado y la función principal evaluarPosicion().
 */

const LINEAS = ['izquierda', 'centro', 'derecha'];

global.calculateScore = function(estado, linea, jugador) {
    return (estado.field[linea][jugador] || []).reduce((s, c) => {
        return s + (c.faceDown ? 2 : (c.card ? c.card.valor || 0 : 0));
    }, 0);
};

const {
    evaluarPosicion,
    _evaluarAmenazaCompilacion,
    _evaluarFuerzaLineas,
    _evaluarCalidadMano,
    _evaluarAmenazaRival,
    _evaluarSinergias,
    _evaluarBocabajos,
    _evaluarInteraccion,
    _evaluarTempo,
    _evaluarMetaReglas,
    _faseDeJuego,
} = require('../src/ai-brain.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeCard(nombre, valor, protocol = 'Muerte', opts = {}) {
    return { nombre, valor, protocol,
        h_accion: opts.h_accion || '', h_inicio: opts.h_inicio || '', h_final: opts.h_final || '' };
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
    // Merge profundo básico para field y player/ai
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

// ─── _faseDeJuego ────────────────────────────────────────────────────────────

describe('_faseDeJuego', () => {
    test('early con 0 compilaciones', () => {
        expect(_faseDeJuego(makeEstado())).toBe('early');
    });
    test('mid con 1 compile de cada uno', () => {
        const e = makeEstado({ ai: { compiled: ['izquierda'] }, player: { compiled: ['centro'] } });
        expect(_faseDeJuego(e)).toBe('mid');
    });
    test('late cuando la IA tiene 2 compilaciones', () => {
        const e = makeEstado({ ai: { compiled: ['izquierda', 'centro'] } });
        expect(_faseDeJuego(e)).toBe('late');
    });
    test('late cuando el jugador tiene 2 compilaciones', () => {
        const e = makeEstado({ player: { compiled: ['izquierda', 'centro'] } });
        expect(_faseDeJuego(e)).toBe('late');
    });
});

// ─── evaluarPosicion ─────────────────────────────────────────────────────────

describe('evaluarPosicion — casos extremos', () => {
    test('IA gana → devuelve 1', () => {
        const e = makeEstado({ ai: { compiled: ['izquierda', 'centro', 'derecha'] } });
        expect(evaluarPosicion(e)).toBe(1);
    });
    test('jugador gana → devuelve -1', () => {
        const e = makeEstado({ player: { compiled: ['izquierda', 'centro', 'derecha'] } });
        expect(evaluarPosicion(e)).toBe(-1);
    });
    test('tablero vacío → valor entre -0.3 y 0.3', () => {
        const r = evaluarPosicion(makeEstado());
        expect(r).toBeGreaterThanOrEqual(-0.3);
        expect(r).toBeLessThanOrEqual(0.3);
    });
    test('IA con ventaja clara devuelve positivo', () => {
        const e = makeEstado({ ai: { compiled: ['izquierda', 'centro'] } });
        e.field.izquierda.compiledBy = 'ai';
        e.field.centro.compiledBy    = 'ai';
        expect(evaluarPosicion(e)).toBeGreaterThan(0.3);
    });
    test('jugador con ventaja clara devuelve negativo', () => {
        const e = makeEstado({ player: { compiled: ['izquierda', 'centro'] } });
        e.field.izquierda.compiledBy = 'player';
        e.field.centro.compiledBy    = 'player';
        expect(evaluarPosicion(e)).toBeLessThan(-0.3);
    });
});

// ─── _evaluarAmenazaCompilacion ───────────────────────────────────────────────

describe('_evaluarAmenazaCompilacion', () => {
    test('IA con línea lista para compilar devuelve positivo', () => {
        const e = makeEstado();
        e.field.izquierda.ai = [carta('Muerte 5', 5), carta('Muerte 5', 5)];
        const r = _evaluarAmenazaCompilacion(e, 'early');
        expect(r).toBeGreaterThan(0);
    });
    test('jugador a punto de compilar devuelve negativo', () => {
        const e = makeEstado();
        e.field.izquierda.player = [carta('Muerte 5', 5), carta('Muerte 5', 5)];
        const r = _evaluarAmenazaCompilacion(e, 'early');
        expect(r).toBeLessThan(0);
    });
    test('IA en match point (2 compiles) tiene bonus', () => {
        const e = makeEstado({ ai: { compiled: ['izquierda', 'centro'] } });
        const r = _evaluarAmenazaCompilacion(e, 'late');
        expect(r).toBeGreaterThan(0.3);
    });
    test('jugador en match point tiene penalización severa', () => {
        const e = makeEstado({ player: { compiled: ['izquierda', 'centro'] } });
        const r = _evaluarAmenazaCompilacion(e, 'late');
        expect(r).toBeLessThan(-0.5);
    });
});

// ─── _evaluarFuerzaLineas ─────────────────────────────────────────────────────

describe('_evaluarFuerzaLineas', () => {
    test('tablero vacío → 0', () => {
        expect(_evaluarFuerzaLineas(makeEstado())).toBe(0);
    });
    test('IA lidera en todas → positivo', () => {
        const e = makeEstado();
        LINEAS.forEach(l => { e.field[l].ai = [carta('X', 4)]; });
        expect(_evaluarFuerzaLineas(e)).toBeGreaterThan(0);
    });
    test('jugador lidera en todas → negativo', () => {
        const e = makeEstado();
        LINEAS.forEach(l => { e.field[l].player = [carta('X', 4)]; });
        expect(_evaluarFuerzaLineas(e)).toBeLessThan(0);
    });
});

// ─── _evaluarCalidadMano (AI-E7) ──────────────────────────────────────────────

describe('_evaluarCalidadMano (AI-E7)', () => {
    test('mano vacía → 0', () => {
        expect(_evaluarCalidadMano(makeEstado())).toBe(0);
    });
    test('carta fuerte (Velocidad 3) puntúa más que carta débil (Velocidad 2)', () => {
        const conFuerte = makeEstado();
        conFuerte.ai.protocols = ['Velocidad', 'Fuego', 'Vida'];
        conFuerte.ai.hand = [makeCard('Velocidad 3', 3, 'Velocidad')];
        const conDebil = makeEstado();
        conDebil.ai.protocols = ['Velocidad', 'Fuego', 'Vida'];
        conDebil.ai.hand = [makeCard('Velocidad 2', 2, 'Velocidad')];
        expect(_evaluarCalidadMano(conFuerte)).toBeGreaterThan(_evaluarCalidadMano(conDebil));
    });
    test('carta con efecto puntúa más que carta sin efecto de igual valor', () => {
        const conEfecto = makeEstado({ ai: { hand: [makeCard('A', 3, 'Muerte', { h_accion: 'Elimina 1 carta' })] } });
        const sinEfecto = makeEstado({ ai: { hand: [makeCard('B', 3, 'Muerte')] } });
        expect(_evaluarCalidadMano(conEfecto)).toBeGreaterThan(_evaluarCalidadMano(sinEfecto));
    });
    test('muchos cuatros en mano penaliza', () => {
        const pocos = makeEstado({ ai: { hand: [makeCard('A', 4), makeCard('B', 2)] } });
        const muchos = makeEstado({ ai: { hand: [makeCard('A', 4), makeCard('B', 4), makeCard('C', 4)] } });
        expect(_evaluarCalidadMano(pocos)).toBeGreaterThan(_evaluarCalidadMano(muchos));
    });
});

// ─── _evaluarAmenazaRival ─────────────────────────────────────────────────────

describe('_evaluarAmenazaRival', () => {
    test('rival sin cartas → amenaza baja', () => {
        const r = _evaluarAmenazaRival(makeEstado(), 'early');
        expect(r).toBeLessThan(0.4);
    });
    test('rival en match point con línea avanzada → amenaza máxima', () => {
        const e = makeEstado({ player: { compiled: ['izquierda', 'centro'] } });
        e.field.derecha.player = [carta('X', 4), carta('Y', 4)]; // 8 puntos
        const r = _evaluarAmenazaRival(e, 'late');
        expect(r).toBe(1.0);
    });
    test('Velocidad 3 en campo del rival aumenta amenaza', () => {
        const eSin = makeEstado({ player: { protocols: ['Velocidad', 'Fuego', 'Vida'] } });
        const eCon = makeEstado({ player: { protocols: ['Velocidad', 'Fuego', 'Vida'] } });
        eCon.field.izquierda.player = [{ card: makeCard('Velocidad 3', 3, 'Velocidad'), faceDown: false }];
        expect(_evaluarAmenazaRival(eCon, 'mid')).toBeGreaterThan(_evaluarAmenazaRival(eSin, 'mid'));
    });
});

// ─── _evaluarSinergias (AI-E5) ────────────────────────────────────────────────

describe('_evaluarSinergias (AI-E5)', () => {
    test('sin protocolos sinérgicos → 0', () => {
        const e = makeEstado({ ai: { protocols: ['Muerte', 'Fuego', 'Metal'] } });
        expect(_evaluarSinergias(e)).toBe(0);
    });
    test('Vida + Agua activos en campo → bonus positivo', () => {
        const e = makeEstado({ ai: { protocols: ['Vida', 'Agua', 'Fuego'] } });
        e.field.izquierda.ai = [{ card: makeCard('Vida 1', 1, 'Vida'), faceDown: false }];
        e.field.centro.ai    = [{ card: makeCard('Agua 1', 1, 'Agua'), faceDown: false }];
        expect(_evaluarSinergias(e)).toBeGreaterThan(0.3);
    });
    test('Gravedad + Muerte con tablero lleno → bonus alto', () => {
        const e = makeEstado({ ai: { protocols: ['Gravedad', 'Muerte', 'Fuego'] } });
        LINEAS.forEach(l => { e.field[l].ai = [carta('X', 2), carta('Y', 2)]; });
        expect(_evaluarSinergias(e)).toBeGreaterThan(0.3);
    });
});

// ─── _evaluarInteraccion (AI-E9) ──────────────────────────────────────────────

describe('_evaluarInteraccion (AI-E9)', () => {
    test('en early, interacción devuelve 0 independientemente de amenaza', () => {
        const e = makeEstado({ ai: { hand: [makeCard('A', 2, 'Muerte', { h_accion: 'Elimina 1 carta' })] } });
        expect(_evaluarInteraccion(e, 'early')).toBe(0);
    });
    test('en late con rival amenazante, cartas de interacción puntúan positivo', () => {
        const e = makeEstado({ player: { compiled: ['izquierda', 'centro'] } });
        e.field.derecha.player = [carta('X', 4), carta('Y', 4)];
        e.ai.hand = [makeCard('Muerte 3', 3, 'Muerte', { h_accion: 'Elimina 1 carta del rival' })];
        expect(_evaluarInteraccion(e, 'late')).toBeGreaterThan(0);
    });
});

// ─── _evaluarTempo (AI-E10) ───────────────────────────────────────────────────

describe('_evaluarTempo (AI-E10)', () => {
    test('sin cartas en mano ni mazo → -1', () => {
        expect(_evaluarTempo(makeEstado())).toBe(-1);
    });
    test('presencia en 3 líneas da bonus de tempo', () => {
        const eTres = makeEstado({ ai: { hand: [makeCard('A', 1)] } });
        const eUna  = makeEstado({ ai: { hand: [makeCard('A', 1)] } });
        LINEAS.forEach(l => { eTres.field[l].ai = [carta('X', 2)]; });
        eUna.field.izquierda.ai = [carta('X', 2)];
        expect(_evaluarTempo(eTres)).toBeGreaterThan(_evaluarTempo(eUna));
    });
    test('mano con cartas jugables bocarriba puntúa más', () => {
        // Protocolo 'Muerte' → línea izquierda
        const eBuena = makeEstado({ ai: { hand: [makeCard('Muerte 3', 3, 'Muerte')], protocols: ['Muerte', 'Fuego', 'Vida'] } });
        const eMala  = makeEstado({ ai: { hand: [makeCard('Humo 3', 3, 'Humo')],    protocols: ['Muerte', 'Fuego', 'Vida'] } });
        expect(_evaluarTempo(eBuena)).toBeGreaterThan(_evaluarTempo(eMala));
    });
});

// ─── _evaluarBocabajos ────────────────────────────────────────────────────────

describe('_evaluarBocabajos', () => {
    test('bocabajo en línea muerta penaliza', () => {
        const e = makeEstado();
        // Rival tiene 10 puntos en izquierda, IA no puede alcanzar
        e.field.izquierda.player = [carta('X', 5), carta('Y', 5)];
        e.field.izquierda.ai     = [bocabajo('Z', 1)];
        expect(_evaluarBocabajos(e)).toBeLessThan(0);
    });
    test('bocabajo con sinergia (Vida) en línea viva puntúa positivo', () => {
        const e = makeEstado({ ai: { protocols: ['Vida', 'Agua', 'Fuego'] } });
        e.field.izquierda.ai = [bocabajo('Vida 1', 1, 'Vida')];
        expect(_evaluarBocabajos(e)).toBeGreaterThan(0);
    });
    test('bocabajos del rival penalizan', () => {
        const eLimpio = makeEstado();
        const eConFD  = makeEstado();
        eConFD.field.izquierda.player = [bocabajo('X', 2)];
        expect(_evaluarBocabajos(eLimpio)).toBeGreaterThan(_evaluarBocabajos(eConFD));
    });
});
