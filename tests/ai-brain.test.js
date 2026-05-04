/**
 * Tests para ai-brain.js — Fase 1
 *
 * Cobertura de la interfaz pública y los 4 pasos del cerebro.
 * En esta fase, simular() delega en ISMCTS (no disponible en tests),
 * así que verificamos que elegirJugada() actúa como fallback correcto.
 */

// ─── Setup global mínimo ────────────────────────────────────────────────────

const LINEAS = ['izquierda', 'centro', 'derecha'];

global.calculateScore = function(estado, linea, jugador) {
    return (estado.field[linea][jugador] || []).reduce((s, c) => {
        return s + (c.faceDown ? 2 : (c.card ? c.card.valor || 0 : 0));
    }, 0);
};

// Cargar ai-brain.js
const {
    decidir,
    filtrarYOrdenar,
    evaluarPosicion,
    elegirJugada,
    _puntuarJugada,
    _puntuarBocabajo,
    _puntuarRefresh,
    _bonusContraestrategia,
    _bonusProtocoloEspecifico,
    _lineaMuerta,
} = require('../src/ai-brain.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeCard(nombre, valor, protocol = 'Muerte', opts = {}) {
    return { nombre, valor, protocol, id: `${nombre}-${Math.random()}`, ...opts };
}

function makeEstado(overrides = {}) {
    const estado = {
        player: { hand: [], deck: [], trash: [], compiled: [], protocols: ['Muerte', 'Fuego', 'Vida'] },
        ai:     { hand: [], deck: [], trash: [], compiled: [], protocols: ['Muerte', 'Fuego', 'Vida'] },
        field: {
            izquierda: { player: [], ai: [], compiledBy: null },
            centro:    { player: [], ai: [], compiledBy: null },
            derecha:   { player: [], ai: [], compiledBy: null },
        },
        effectContext: null,
        turn: 'ai',
    };
    return Object.assign(estado, overrides);
}

function makeJugada(nombre, valor, linea, bocarriba = true) {
    return { card: makeCard(nombre, valor), line: linea, faceUp: bocarriba, cardIndex: 0 };
}

// ─── decidir() ──────────────────────────────────────────────────────────────

describe('decidir — interfaz pública', () => {
    test('devuelve null si no hay jugadas', () => {
        expect(decidir(makeEstado(), [], 5)).toBeNull();
    });

    test('devuelve la única jugada si solo hay una', () => {
        const jugada = makeJugada('Muerte 1', 1, 'izquierda');
        expect(decidir(makeEstado(), [jugada], 5)).toBe(jugada);
    });

    test('devuelve una jugada que existe en jugadasPosibles', () => {
        const estado = makeEstado();
        const jugadas = [
            makeJugada('Muerte 1', 1, 'izquierda'),
            makeJugada('Fuego 2', 2, 'centro'),
            makeJugada('Vida 3', 3, 'derecha'),
        ];
        const resultado = decidir(estado, jugadas, 3);
        expect(resultado).not.toBeNull();
        // La jugada devuelta debe ser una de las posibles (por nombre de carta o acción refresh)
        const nombres = jugadas.map(j => j.card ? j.card.nombre : j.action);
        const nombreResultado = resultado.card ? resultado.card.nombre : resultado.action;
        expect(nombres).toContain(nombreResultado);
    });
});

// ─── filtrarYOrdenar() ───────────────────────────────────────────────────────

describe('filtrarYOrdenar', () => {
    test('no elimina todas las jugadas aunque sean malas', () => {
        const estado = makeEstado();
        // Simular línea muerta para la IA: rival tiene 10+ puntos
        estado.field.izquierda.player.push({ card: makeCard('Muerte 5', 5), faceDown: false });
        estado.field.izquierda.player.push({ card: makeCard('Muerte 5', 5), faceDown: false });
        // Solo hay jugadas bocabajo en línea muerta
        const jugadas = [makeJugada('Fuego 1', 1, 'izquierda', false)];
        const resultado = filtrarYOrdenar(jugadas, estado, 5);
        // Fallback: devuelve todas aunque sean malas
        expect(resultado.length).toBeGreaterThan(0);
    });

    test('prioriza compilar sobre cualquier otra jugada', () => {
        const estado = makeEstado();
        // IA tiene 8 puntos en izquierda — jugar carta de valor 3 compila
        estado.field.izquierda.ai.push({ card: makeCard('Muerte 5', 5), faceDown: false });
        estado.field.izquierda.ai.push({ card: makeCard('Muerte 3', 3), faceDown: false });
        const jugadaCompila  = makeJugada('Muerte 3', 3, 'izquierda', true);
        const jugadaNormal   = makeJugada('Fuego 1', 1, 'centro', true);
        const jugadaBocabajo = makeJugada('Vida 2', 2, 'derecha', false);
        const resultado = filtrarYOrdenar(
            [jugadaNormal, jugadaBocabajo, jugadaCompila], estado, 5
        );
        expect(resultado[0].card.nombre).toBe('Muerte 3');
    });

    test('prioriza bocarriba sobre bocabajo en igualdad de condiciones', () => {
        const estado = makeEstado();
        const bocarriba = makeJugada('Muerte 2', 2, 'izquierda', true);
        const bocabajo  = makeJugada('Muerte 2', 2, 'izquierda', false);
        const resultado = filtrarYOrdenar([bocabajo, bocarriba], estado, 5);
        expect(resultado[0].faceUp).toBe(true);
    });

    test('refresh con mano vacía puntúa alto', () => {
        const estado = makeEstado();
        estado.ai.hand   = [];
        estado.ai.deck   = [makeCard('X', 1)];
        const refresh    = { action: 'refresh' };
        const bocabajo   = makeJugada('Muerte 1', 1, 'centro', false);
        const resultado  = filtrarYOrdenar([bocabajo, refresh], estado, 5);
        expect(resultado[0].action).toBe('refresh');
    });
});

// ─── _puntuarBocabajo() — AI-E15 ────────────────────────────────────────────

describe('_puntuarBocabajo — bocabajo defensivo (AI-E15)', () => {
    test('bocabajo en línea amenazada por rival puntúa más que en línea tranquila', () => {
        const estado = makeEstado();
        // Rival amenaza izquierda con 7 puntos
        estado.field.izquierda.player.push({ card: makeCard('Muerte 4', 4), faceDown: false });
        estado.field.izquierda.player.push({ card: makeCard('Muerte 3', 3), faceDown: false });
        const jugadaDefensiva = makeJugada('Fuego 1', 1, 'izquierda', false);
        const jugadaNormal    = makeJugada('Fuego 1', 1, 'centro',    false);
        const puntosDefensiva = _puntuarBocabajo(jugadaDefensiva, estado, 5);
        const puntosNormal    = _puntuarBocabajo(jugadaNormal,    estado, 5);
        expect(puntosDefensiva).toBeGreaterThan(puntosNormal);
    });

    test('carta de protocolo ya compilado puntúa más como sacrificio', () => {
        const estado = makeEstado();
        // Izquierda amenazada
        estado.field.izquierda.player.push({ card: makeCard('Muerte 4', 4), faceDown: false });
        estado.field.izquierda.player.push({ card: makeCard('Muerte 3', 3), faceDown: false });
        // Protocolo 'Muerte' está en índice 0 → línea 'izquierda' ya compilada por IA
        estado.field.izquierda.compiledBy = 'ai';
        estado.ai.compiled = ['izquierda'];

        const cartaSacrificable = makeJugada('Muerte 1', 1, 'izquierda', false); // protocolo compilado
        const cartaValiosa      = makeJugada('Fuego 3', 3, 'izquierda', false);  // protocolo activo

        const puntosSacrif = _puntuarBocabajo(cartaSacrificable, estado, 5);
        const puntosValios = _puntuarBocabajo(cartaValiosa,      estado, 5);
        expect(puntosSacrif).toBeGreaterThan(puntosValios);
    });

    test('carta de valor bajo es más sacrificable que carta de valor alto', () => {
        const estado = makeEstado();
        estado.field.centro.player.push({ card: makeCard('Fuego 4', 4), faceDown: false });
        estado.field.centro.player.push({ card: makeCard('Fuego 3', 3), faceDown: false });

        const cartaBaja  = makeJugada('Vida 0', 0, 'centro', false);
        const cartaAlta  = makeJugada('Vida 5', 5, 'centro', false);
        const puntosBaja = _puntuarBocabajo(cartaBaja,  estado, 5);
        const puntosAlta = _puntuarBocabajo(cartaAlta,  estado, 5);
        expect(puntosBaja).toBeGreaterThan(puntosAlta);
    });
});

// ─── evaluarPosicion() ───────────────────────────────────────────────────────

describe('evaluarPosicion', () => {
    test('tablero vacío devuelve valor cercano a 0', () => {
        const resultado = evaluarPosicion(makeEstado());
        expect(resultado).toBeGreaterThanOrEqual(-0.3);
        expect(resultado).toBeLessThanOrEqual(0.3);
    });

    test('IA con 2 compilaciones devuelve valor positivo alto', () => {
        const estado = makeEstado();
        estado.ai.compiled     = ['izquierda', 'centro'];
        estado.player.compiled = [];
        estado.field.izquierda.compiledBy = 'ai';
        estado.field.centro.compiledBy    = 'ai';
        const resultado = evaluarPosicion(estado);
        expect(resultado).toBeGreaterThan(0.3);
    });

    test('jugador con 2 compilaciones devuelve valor negativo', () => {
        const estado = makeEstado();
        estado.player.compiled = ['izquierda', 'centro'];
        estado.ai.compiled     = [];
        estado.field.izquierda.compiledBy = 'player';
        estado.field.centro.compiledBy    = 'player';
        const resultado = evaluarPosicion(estado);
        expect(resultado).toBeLessThan(-0.3);
    });
});

// ─── elegirJugada() ──────────────────────────────────────────────────────────

describe('elegirJugada', () => {
    test('con simulación válida usa su resultado', () => {
        const jugadas   = [makeJugada('A', 1, 'izquierda'), makeJugada('B', 2, 'centro')];
        const simulacion = { bestMove: jugadas[1] };
        expect(elegirJugada(simulacion, jugadas)).toBe(jugadas[1]);
    });

    test('sin simulación devuelve la primera candidata', () => {
        const jugadas = [makeJugada('A', 1, 'izquierda'), makeJugada('B', 2, 'centro')];
        expect(elegirJugada(null,              jugadas)).toBe(jugadas[0]);
        expect(elegirJugada({ bestMove: null }, jugadas)).toBe(jugadas[0]);
    });
});

// ─── _bonusContraestrategia (AI-E12) ─────────────────────────────────────────

describe('_bonusContraestrategia (AI-E12)', () => {
    test('Velocidad 3 activa del rival → carta de interacción recibe bonus alto', () => {
        const estado = makeEstado({ player: { protocols: ['Velocidad', 'Fuego', 'Vida'] } });
        estado.field.izquierda.player.push({ card: makeCard('Velocidad 3', 3, 'Velocidad'), faceDown: false });
        const jugadaInteraccion = makeJugada('Muerte 3', 3, 'centro', true);
        jugadaInteraccion.card.h_accion = 'Voltea 1 carta del rival';
        expect(_bonusContraestrategia(jugadaInteraccion, estado)).toBeGreaterThan(30);
    });

    test('Velocidad 3 activa → jugada no-interacción penalizada', () => {
        const estado = makeEstado({ player: { protocols: ['Velocidad', 'Fuego', 'Vida'] } });
        estado.field.izquierda.player.push({ card: makeCard('Velocidad 3', 3, 'Velocidad'), faceDown: false });
        const jugadaNormal = makeJugada('Muerte 3', 3, 'centro', true);
        expect(_bonusContraestrategia(jugadaNormal, estado)).toBeLessThan(0);
    });

    test('Psique 1 bloqueada → carta de interacción recibe bonus', () => {
        const estado = makeEstado({ player: { protocols: ['Psique', 'Fuego', 'Vida'] } });
        // Psique 1 en índice 0 (no es la cima) → bloqueada
        estado.field.izquierda.player.push({ card: makeCard('Psique 1', 1, 'Psique'), faceDown: false });
        estado.field.izquierda.player.push({ card: makeCard('Psique 3', 3, 'Psique'), faceDown: false });
        const jugadaElimina = makeJugada('Muerte 3', 3, 'centro', true);
        jugadaElimina.card.h_accion = 'Elimina 1 carta del rival';
        expect(_bonusContraestrategia(jugadaElimina, estado)).toBeGreaterThan(30);
    });

    test('sin setups peligrosos → devuelve 0', () => {
        const estado = makeEstado();
        const jugada = makeJugada('Muerte 3', 3, 'izquierda', true);
        expect(_bonusContraestrategia(jugada, estado)).toBe(0);
    });
});

// ─── _bonusProtocoloEspecifico (AI-E14) ───────────────────────────────────────

describe('_bonusProtocoloEspecifico (AI-E14)', () => {
    test('Velocidad 0 sin Velocidad 3 → penalización', () => {
        const estado = makeEstado({ ai: { protocols: ['Velocidad', 'Fuego', 'Vida'] } });
        const jugada = makeJugada('Velocidad 0', 0, 'izquierda', true);
        jugada.card.protocol = 'Velocidad';
        expect(_bonusProtocoloEspecifico(jugada, estado)).toBeLessThan(0);
    });

    test('Velocidad 0 con Velocidad 3 en mano → sin penalización', () => {
        const estado = makeEstado({ ai: {
            protocols: ['Velocidad', 'Fuego', 'Vida'],
            hand: [makeCard('Velocidad 3', 3, 'Velocidad')],
        } });
        const jugada = makeJugada('Velocidad 0', 0, 'izquierda', true);
        jugada.card.protocol = 'Velocidad';
        expect(_bonusProtocoloEspecifico(jugada, estado)).toBe(0);
    });

    test('Espíritu 3 recibe bonus por ser carta muy valiosa', () => {
        const estado = makeEstado();
        const jugada = makeJugada('Espíritu 3', 3, 'izquierda', true);
        jugada.card.protocol = 'Espíritu';
        expect(_bonusProtocoloEspecifico(jugada, estado)).toBeGreaterThan(0);
    });

    test('Gravedad 0 con tablero lleno → bonus alto', () => {
        const estado = makeEstado();
        ['izquierda', 'centro', 'derecha'].forEach(l => {
            estado.field[l].ai.push({ card: makeCard('X', 2), faceDown: false });
            estado.field[l].ai.push({ card: makeCard('Y', 2), faceDown: false });
        });
        const jugada = makeJugada('Gravedad 0', 0, 'izquierda', true);
        jugada.card.protocol = 'Gravedad';
        expect(_bonusProtocoloEspecifico(jugada, estado)).toBeGreaterThan(30);
    });

    test('Muerte 5 con tablero rival vacío → penalización', () => {
        const estado = makeEstado();
        const jugada = makeJugada('Muerte 5', 5, 'izquierda', true);
        jugada.card.protocol = 'Muerte';
        expect(_bonusProtocoloEspecifico(jugada, estado)).toBeLessThan(0);
    });
});

// ─── _puntuarRefresh (AI-E4) ──────────────────────────────────────────────────

describe('_puntuarRefresh (AI-E4)', () => {
    test('mazo vacío → puntuación muy negativa', () => {
        const estado = makeEstado({ ai: { hand: [makeCard('A', 2)], deck: [] } });
        expect(_puntuarRefresh(estado)).toBeLessThan(-10);
    });

    test('mano de 1 carta → puntúa alto', () => {
        const estado = makeEstado({ ai: { hand: [makeCard('A', 2)], deck: [makeCard('B', 3)] } });
        expect(_puntuarRefresh(estado)).toBeGreaterThan(20);
    });

    test('mano con mayoría situacional → vale la pena refrescar', () => {
        // Cartas sin protocolo propio = situacionales
        const estado = makeEstado({ ai: {
            protocols: ['Muerte', 'Fuego', 'Vida'],
            hand: [
                makeCard('Humo 1', 1, 'Humo'),
                makeCard('Agua 2', 2, 'Agua'),
                makeCard('Metal 3', 3, 'Metal'),
            ],
            deck: [makeCard('Muerte 3', 3, 'Muerte')],
        } });
        expect(_puntuarRefresh(estado)).toBeGreaterThanOrEqual(0);
    });

    test('mano con mayoría jugable → no refrescar', () => {
        const estado = makeEstado({ ai: {
            protocols: ['Muerte', 'Fuego', 'Vida'],
            hand: [
                makeCard('Muerte 3', 3, 'Muerte'),
                makeCard('Fuego 4', 4, 'Fuego'),
                makeCard('Vida 2', 2, 'Vida'),
            ],
            deck: [makeCard('X', 1)],
        } });
        expect(_puntuarRefresh(estado)).toBeLessThan(0);
    });
});

// ─── _puntuarBocabajo nuevas tácticas ─────────────────────────────────────────

describe('_puntuarBocabajo — rival amenaza otra línea', () => {
    test('bocabajo cuando rival amenaza OTRA línea → bonus', () => {
        const estado = makeEstado();
        // Rival amenaza centro con 8 puntos
        estado.field.centro.player.push({ card: makeCard('Fuego 4', 4), faceDown: false });
        estado.field.centro.player.push({ card: makeCard('Fuego 4', 4), faceDown: false });
        // IA juega bocabajo en izquierda (no donde amenaza)
        const jugada = makeJugada('Muerte 1', 1, 'izquierda', false);
        // Sin amenaza en izquierda para comparar
        const estadoLimpio = makeEstado();
        const puntosConAmenaza = _puntuarBocabajo(jugada, estado, 5);
        const puntosSinAmenaza = _puntuarBocabajo(jugada, estadoLimpio, 5);
        expect(puntosConAmenaza).toBeGreaterThan(puntosSinAmenaza);
    });
});
