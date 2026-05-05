/**
 * Tests para llm-prompt.js — construcción de prompt y parseo de respuesta
 */

global.calculateScore = function(estado, linea, jugador) {
    return (estado.field[linea][jugador] || []).reduce((s, c) => {
        return s + (c.faceDown ? 2 : (c.card ? c.card.valor || 0 : 0));
    }, 0);
};

const { construirPrompt, _serializarJugadas } = require('../src/llm-prompt.js');

function makeCard(nombre, valor, protocol = 'Muerte', opts = {}) {
    return { nombre, valor, protocol, h_accion: opts.h_accion || '', h_inicio: '', h_final: '' };
}

function makeEstado(overrides = {}) {
    const base = {
        player: { hand: [], deck: Array(10).fill(null), trash: [], compiled: [], protocols: ['Muerte', 'Fuego', 'Vida'] },
        ai:     { hand: [], deck: Array(8).fill(null),  trash: [], compiled: [], protocols: ['Velocidad', 'Gravedad', 'Agua'] },
        field: {
            izquierda: { player: [], ai: [], compiledBy: null },
            centro:    { player: [], ai: [], compiledBy: null },
            derecha:   { player: [], ai: [], compiledBy: null },
        },
        effectContext: null,
    };
    return Object.assign(base, overrides);
}

function makeJugada(nombre, valor, linea, bocarriba = true, protocol = 'Velocidad', efecto = '') {
    return {
        card: makeCard(nombre, valor, protocol, { h_accion: efecto }),
        line: linea,
        faceUp: bocarriba,
        cardIndex: 0,
    };
}

// ─── _serializarJugadas ───────────────────────────────────────────────────────

describe('_serializarJugadas', () => {
    test('refresh aparece con etiqueta clara', () => {
        const txt = _serializarJugadas([{ action: 'refresh' }]);
        expect(txt).toContain('REFRESH');
        expect(txt).toContain('0:');
    });

    test('jugada bocarriba incluye modo BOCARRIBA', () => {
        const txt = _serializarJugadas([makeJugada('Velocidad 3', 3, 'izquierda', true)]);
        expect(txt).toContain('BOCARRIBA');
        expect(txt).toContain('Velocidad 3');
    });

    test('jugada bocabajo indica val:2 y sin efecto', () => {
        const txt = _serializarJugadas([makeJugada('Velocidad 3', 3, 'centro', false)]);
        expect(txt).toContain('BOCABAJO');
        expect(txt).toContain('val:2');
        expect(txt).toContain('sin efecto');
    });

    test('jugada con efecto lo incluye en la descripción', () => {
        const jugada = makeJugada('Muerte 3', 3, 'izquierda', true, 'Muerte', 'Elimina 1 carta del rival');
        const txt = _serializarJugadas([jugada]);
        expect(txt).toContain('Elimina 1 carta del rival');
    });

    test('numera las jugadas desde 0', () => {
        const jugadas = [
            makeJugada('A', 1, 'izquierda'),
            makeJugada('B', 2, 'centro'),
            makeJugada('C', 3, 'derecha'),
        ];
        const txt = _serializarJugadas(jugadas);
        expect(txt).toContain('0:');
        expect(txt).toContain('1:');
        expect(txt).toContain('2:');
    });
});

// ─── construirPrompt ──────────────────────────────────────────────────────────

describe('construirPrompt', () => {
    test('incluye protocolos de ambos jugadores', () => {
        const e = makeEstado();
        const jugadas = [makeJugada('Velocidad 3', 3, 'izquierda')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt).toContain('Velocidad');
        expect(prompt).toContain('Gravedad');
        expect(prompt).toContain('Muerte');
    });

    test('incluye instrucción de responder con un número', () => {
        const e = makeEstado();
        const jugadas = [makeJugada('Velocidad 3', 3, 'izquierda')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt).toContain('número');
        expect(prompt).toContain('Número:');
    });

    test('incluye reglas base (compilar, valor bocabajo)', () => {
        const e = makeEstado();
        const jugadas = [makeJugada('A', 1, 'izquierda')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt).toContain('≥10');
        expect(prompt).toContain('2');
    });

    test('incluye tips relevantes a los protocolos de la partida', () => {
        const e = makeEstado(); // IA tiene Velocidad, Gravedad, Agua
        const jugadas = [makeJugada('A', 1, 'izquierda')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt).toContain('VELOCIDAD');
        expect(prompt).toContain('GRAVEDAD');
        expect(prompt).toContain('AGUA');
    });

    test('muestra línea compilada cuando corresponde', () => {
        const e = makeEstado();
        e.field.izquierda.compiledBy = 'ai';
        const jugadas = [makeJugada('A', 1, 'centro')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt).toContain('COMPILADA');
    });

    test('muestra cartas boca abajo como [?:2pts]', () => {
        const e = makeEstado();
        e.field.centro.ai.push({ card: makeCard('Velocidad 3', 3), faceDown: true });
        const jugadas = [makeJugada('A', 1, 'izquierda')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt).toContain('[?:2pts]');
    });

    test('muestra cartas boca arriba con nombre y valor', () => {
        const e = makeEstado();
        e.field.izquierda.player.push({ card: makeCard('Muerte 4', 4, 'Muerte'), faceDown: false });
        const jugadas = [makeJugada('A', 1, 'izquierda')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt).toContain('Muerte 4(4)');
    });

    test('muestra últimas cartas del descarte rival', () => {
        const e = makeEstado();
        e.player.trash = [makeCard('Muerte 3', 3), makeCard('Fuego 2', 2)];
        const jugadas = [makeJugada('A', 1, 'izquierda')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt).toContain('Muerte 3');
        expect(prompt).toContain('Fuego 2');
    });

    test('prompt termina con "Número:" para que el LLM complete', () => {
        const e = makeEstado();
        const jugadas = [makeJugada('A', 1, 'izquierda')];
        const prompt = construirPrompt(e, jugadas, calculateScore);
        expect(prompt.endsWith('Número:')).toBe(true);
    });
});
