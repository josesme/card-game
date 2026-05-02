/**
 * Integration tests for ISMCTS engine.
 * Verifies: valid move returned, win detection, determinization pool,
 * and that the engine finds a compile when one is available.
 */

const { ISMCTS } = require('../../src/ismcts.js');

// ── Minimal stubs ──────────────────────────────────────────────────────────

global.CARD_SIM_EFFECTS = {};
global.CARD_EFFECTS     = {};

// calculateScore: sum face-up card values, face-down = 2
global.calculateScore = function (state, line, player) {
    return (state.field[line][player] || []).reduce((sum, c) => {
        return sum + (c.faceDown ? 2 : (c.card.valor || 0));
    }, 0);
};

global.GLOBAL_CARDS = {
    Fuego: [
        { nombre: 'Fuego 0', valor: 0, protocol: 'Fuego' },
        { nombre: 'Fuego 1', valor: 1, protocol: 'Fuego' },
        { nombre: 'Fuego 2', valor: 2, protocol: 'Fuego' },
        { nombre: 'Fuego 3', valor: 3, protocol: 'Fuego' },
        { nombre: 'Fuego 4', valor: 4, protocol: 'Fuego' },
        { nombre: 'Fuego 5', valor: 5, protocol: 'Fuego' },
    ],
    Metal: [
        { nombre: 'Metal 0', valor: 0, protocol: 'Metal' },
        { nombre: 'Metal 1', valor: 1, protocol: 'Metal' },
        { nombre: 'Metal 2', valor: 2, protocol: 'Metal' },
        { nombre: 'Metal 3', valor: 3, protocol: 'Metal' },
        { nombre: 'Metal 4', valor: 4, protocol: 'Metal' },
        { nombre: 'Metal 5', valor: 5, protocol: 'Metal' },
    ],
    Agua: [
        { nombre: 'Agua 0', valor: 0, protocol: 'Agua' },
        { nombre: 'Agua 1', valor: 1, protocol: 'Agua' },
        { nombre: 'Agua 2', valor: 2, protocol: 'Agua' },
        { nombre: 'Agua 3', valor: 3, protocol: 'Agua' },
        { nombre: 'Agua 4', valor: 4, protocol: 'Agua' },
        { nombre: 'Agua 5', valor: 5, protocol: 'Agua' },
    ],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function makeLine() {
    return { player: [], ai: [], compiledBy: null };
}

function makeState(overrides = {}) {
    return {
        ai: {
            hand:      [],
            deck:      [],
            trash:     [],
            compiled:  [],
            protocols: ['Fuego', 'Metal', 'Agua'],
            ...overrides.ai,
        },
        player: {
            hand:      [],
            deck:      [],
            trash:     [],
            compiled:  [],
            protocols: ['Fuego', 'Metal', 'Agua'],
            ...overrides.player,
        },
        field: {
            izquierda: makeLine(),
            centro:    makeLine(),
            derecha:   makeLine(),
            ...(overrides.field || {}),
        },
        revealedPlayerCards: [],
    };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ISMCTS — basic validity', () => {
    test('returns a valid move from possible moves', () => {
        const state = makeState({
            ai: { hand: [{ nombre: 'Fuego 3', valor: 3, protocol: 'Fuego' }] },
            player: { hand: [{ nombre: 'Metal 2', valor: 2, protocol: 'Metal' }] },
        });
        const moves = [
            { cardIndex: 0, line: 'izquierda', faceUp: true,  card: state.ai.hand[0] },
            { cardIndex: 0, line: 'izquierda', faceUp: false, card: state.ai.hand[0] },
            { cardIndex: 0, line: 'centro',    faceUp: false, card: state.ai.hand[0] },
        ];

        const ismcts = new ISMCTS(100); // 100ms budget
        const result = ismcts.findBestMove(state, moves);

        expect(result).not.toBeNull();
        expect(result.bestMove).toBeDefined();
        expect(moves.some(m =>
            m.line === result.bestMove.line &&
            m.faceUp === result.bestMove.faceUp &&
            m.card.nombre === result.bestMove.card.nombre
        )).toBe(true);
    });

    test('runs at least 10 iterations with 200ms budget', () => {
        const state = makeState({
            ai:     { hand: [{ nombre: 'Fuego 4', valor: 4, protocol: 'Fuego' }] },
            player: { hand: [{ nombre: 'Metal 1', valor: 1, protocol: 'Metal' }] },
        });
        const moves = [
            { cardIndex: 0, line: 'izquierda', faceUp: true, card: state.ai.hand[0] },
        ];

        const ismcts = new ISMCTS(200);
        ismcts.findBestMove(state, moves);

        expect(ismcts.iterations).toBeGreaterThan(10);
    });
});

describe('ISMCTS — compile detection', () => {
    test('chooses the compile move when AI can win a line immediately', () => {
        // AI has score 7 in izquierda, plays a 5 face-up → 12 > 0 → compile
        const ai5 = { nombre: 'Fuego 5', valor: 5, protocol: 'Fuego' };
        const ai1 = { nombre: 'Fuego 1', valor: 1, protocol: 'Fuego' };

        const state = makeState({
            ai:     { hand: [ai5, ai1] },
            player: { hand: [{ nombre: 'Metal 1', valor: 1, protocol: 'Metal' }] },
        });
        // AI already has 7 points in izquierda
        state.field.izquierda.ai = [
            { card: { nombre: 'Fuego 3', valor: 3, protocol: 'Fuego' }, faceDown: false },
            { card: { nombre: 'Fuego 4', valor: 4, protocol: 'Fuego' }, faceDown: false },
        ];

        const moves = [
            { cardIndex: 0, line: 'izquierda', faceUp: true,  card: ai5 }, // compile!
            { cardIndex: 0, line: 'izquierda', faceUp: false, card: ai5 },
            { cardIndex: 1, line: 'centro',    faceUp: false, card: ai1 },
            { cardIndex: 1, line: 'derecha',   faceUp: false, card: ai1 },
        ];

        const ismcts = new ISMCTS(300);
        const result = ismcts.findBestMove(state, moves);

        expect(result.bestMove.line).toBe('izquierda');
        expect(result.bestMove.faceUp).toBe(true);
        expect(result.bestMove.card.nombre).toBe('Fuego 5');
    });
});

describe('ISMCTS — determinization', () => {
    test('_buildPublicPool excludes face-up field cards and discards', () => {
        const state = makeState({
            player: {
                protocols: ['Fuego'],
                hand:  [],
                trash: [{ nombre: 'Fuego 0', valor: 0, protocol: 'Fuego' }],
            },
        });
        state.field.izquierda.player = [
            { card: { nombre: 'Fuego 5', valor: 5, protocol: 'Fuego' }, faceDown: false },
        ];

        const ismcts = new ISMCTS(100);
        const pool = ismcts._buildPublicPool(state);

        expect(pool.find(c => c.nombre === 'Fuego 0')).toBeUndefined(); // in trash
        expect(pool.find(c => c.nombre === 'Fuego 5')).toBeUndefined(); // face-up on field
        expect(pool.length).toBe(4); // 6 total - 2 removed
    });

    test('determinized hand size matches real hand size', () => {
        const state = makeState({
            player: {
                protocols: ['Fuego'],
                hand: [
                    { nombre: 'Fuego 1', valor: 1, protocol: 'Fuego' },
                    { nombre: 'Fuego 2', valor: 2, protocol: 'Fuego' },
                    { nombre: 'Fuego 3', valor: 3, protocol: 'Fuego' },
                ],
            },
        });

        const ismcts = new ISMCTS(100);
        const det = ismcts._determinize(state);

        expect(det.player.hand.length).toBe(3);
    });
});

describe('ISMCTS — terminal detection', () => {
    test('_isTerminal returns true when AI has 3 compiled lines', () => {
        const state = makeState({ ai: { compiled: ['izquierda', 'centro', 'derecha'] } });
        const ismcts = new ISMCTS(100);
        expect(ismcts._isTerminal(state)).toBe(true);
    });

    test('_isTerminal returns false when nobody has 3 compiles', () => {
        const state = makeState({ ai: { compiled: ['izquierda'] } });
        const ismcts = new ISMCTS(100);
        expect(ismcts._isTerminal(state)).toBe(false);
    });

    test('_evaluate returns 1.0 when AI wins', () => {
        const state = makeState({ ai: { compiled: ['izquierda', 'centro', 'derecha'] } });
        const ismcts = new ISMCTS(100);
        expect(ismcts._evaluate(state)).toBe(1.0);
    });

    test('_evaluate returns 0.0 when player wins', () => {
        const state = makeState({ player: { compiled: ['izquierda', 'centro', 'derecha'] } });
        const ismcts = new ISMCTS(100);
        expect(ismcts._evaluate(state)).toBe(0.0);
    });
});
