/**
 * Tests for CARD_SIM_EFFECTS new entries (Block 3B)
 * Covers: Luz 1, Vida 4, Agua 0, Amor 4, Metal 2, Guerra 2-4, Valor 0-2, Hielo 1-2, Paz 2
 */

const MiniMax = require('../src/minimax.js');

const LINES = ['izquierda', 'centro', 'derecha'];

function makeState() {
  const field = {};
  LINES.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return {
    player: { hand: Array.from({ length: 5 }, (_, i) => ({ nombre: `p${i}`, valor: i + 1 })), deck: Array.from({ length: 10 }, (_, i) => ({ nombre: `pd${i}`, valor: i + 1 })), trash: [], compiled: [] },
    ai:     { hand: Array.from({ length: 5 }, (_, i) => ({ nombre: `a${i}`, valor: i + 1 })), deck: Array.from({ length: 10 }, (_, i) => ({ nombre: `ad${i}`, valor: i + 1 })), trash: [], compiled: [] },
    field,
  };
}

function card(nombre, valor = 1) {
  return { nombre, valor };
}

function fieldCard(nombre, valor, faceDown = false) {
  return { card: { nombre, valor }, faceDown };
}

const mm = new MiniMax(null, 2);

describe('simulateCardEffect — Block 3B new entries', () => {

  // ── Draw ──────────────────────────────────────────────────────────────────

  test('Luz 1: draws 1 card for AI', () => {
    const state = makeState();
    const before = state.ai.hand.length;
    mm.simulateCardEffect(state, card('Luz 1', 1), 'centro');
    expect(state.ai.hand.length).toBe(before + 1);
  });

  test('Vida 4: draws 1 card for AI', () => {
    const state = makeState();
    const before = state.ai.hand.length;
    mm.simulateCardEffect(state, card('Vida 4', 4), 'izquierda');
    expect(state.ai.hand.length).toBe(before + 1);
  });

  test('Guerra 3: draws 1 card for AI', () => {
    const state = makeState();
    const before = state.ai.hand.length;
    mm.simulateCardEffect(state, card('Guerra 3', 3), 'centro');
    expect(state.ai.hand.length).toBe(before + 1);
  });

  test('Valor 2: draws 1 card for AI', () => {
    const state = makeState();
    const before = state.ai.hand.length;
    mm.simulateCardEffect(state, card('Valor 2', 2), 'derecha');
    expect(state.ai.hand.length).toBe(before + 1);
  });

  test('Paz 2: draws 1 card for AI', () => {
    const state = makeState();
    const before = state.ai.hand.length;
    mm.simulateCardEffect(state, card('Paz 2', 2), 'centro');
    expect(state.ai.hand.length).toBe(before + 1);
  });

  // ── Eliminate ─────────────────────────────────────────────────────────────

  test('Valor 1: removes highest player card from field', () => {
    const state = makeState();
    state.field.izquierda.player.push(fieldCard('Low', 2, false));
    state.field.derecha.player.push(fieldCard('High', 5, false));
    mm.simulateCardEffect(state, card('Valor 1', 1), 'centro');
    expect(state.player.trash.length).toBe(1);
    expect(state.player.trash[0].nombre).toBe('High');
  });

  // ── Flip opponent ─────────────────────────────────────────────────────────

  test('Agua 0: flips 1 opponent face-up card to facedown', () => {
    const state = makeState();
    state.field.centro.player.push(fieldCard('X', 3, false));
    mm.simulateCardEffect(state, card('Agua 0', 0), 'izquierda');
    expect(state.field.centro.player[0].faceDown).toBe(true);
  });

  test('Amor 4: flips 1 opponent face-up card to facedown', () => {
    const state = makeState();
    state.field.izquierda.player.push(fieldCard('Y', 4, false));
    mm.simulateCardEffect(state, card('Amor 4', 4), 'centro');
    expect(state.field.izquierda.player[0].faceDown).toBe(true);
  });

  test('Guerra 2: flips 1 opponent face-up card to facedown', () => {
    const state = makeState();
    state.field.derecha.player.push(fieldCard('Z', 2, false));
    mm.simulateCardEffect(state, card('Guerra 2', 2), 'izquierda');
    expect(state.field.derecha.player[0].faceDown).toBe(true);
  });

  // ── Opponent discard ──────────────────────────────────────────────────────

  test('Guerra 4: opponent discards 1 card', () => {
    const state = makeState();
    const before = state.player.hand.length;
    mm.simulateCardEffect(state, card('Guerra 4', 4), 'centro');
    expect(state.player.hand.length).toBe(before - 1);
    expect(state.player.trash.length).toBe(1);
  });

  test('Hielo 1: opponent discards 1 card (reactive approx)', () => {
    const state = makeState();
    const before = state.player.hand.length;
    mm.simulateCardEffect(state, card('Hielo 1', 1), 'izquierda');
    expect(state.player.hand.length).toBe(before - 1);
  });

  // ── preventCompile ────────────────────────────────────────────────────────

  test('Metal 2: sets player.cannotCompile flag', () => {
    const state = makeState();
    mm.simulateCardEffect(state, card('Metal 2', 2), 'centro');
    expect(state.player.cannotCompile).toBe(true);
  });

  // ── Return opponent / mixed ───────────────────────────────────────────────

  test('Hielo 2: returns highest player field card to hand', () => {
    const state = makeState();
    state.field.izquierda.player.push(fieldCard('A', 3, false));
    state.field.derecha.player.push(fieldCard('B', 5, false));
    mm.simulateCardEffect(state, card('Hielo 2', 2), 'centro');
    expect(state.player.hand.some(c => c.nombre === 'B')).toBe(true);
    expect(state.field.derecha.player.length).toBe(0);
  });

  test('Valor 0: draws 1 and makes opponent discard 1', () => {
    const state = makeState();
    const aiBefore = state.ai.hand.length;
    const playerBefore = state.player.hand.length;
    mm.simulateCardEffect(state, card('Valor 0', 0), 'centro');
    expect(state.ai.hand.length).toBe(aiBefore + 1);
    expect(state.player.hand.length).toBe(playerBefore - 1);
  });

});
