/**
 * Tests for CARD_SIM_EFFECTS new entries (Block 3 Part A)
 * Verifies simulateCardEffect correctly applies each new card's approximated effect.
 */

const MiniMax = require('../src/minimax.js');

const LINES = ['izquierda', 'centro', 'derecha'];

function makeState() {
  const field = {};
  LINES.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return {
    player: { hand: [], deck: Array.from({ length: 10 }, (_, i) => ({ nombre: `p${i}`, valor: i + 1 })), trash: [], compiled: [] },
    ai:     { hand: [], deck: Array.from({ length: 10 }, (_, i) => ({ nombre: `a${i}`, valor: i + 1 })), trash: [], compiled: [] },
    field,
  };
}

function card(nombre, valor = 1) {
  return { nombre, valor };
}

function fieldCard(nombre, valor, faceDown = false) {
  return { card: { nombre, valor }, faceDown };
}

// MiniMax instance (evaluator not needed for simulateCardEffect)
const mm = new MiniMax(null, 2);

describe('simulateCardEffect — new entries (Block 3 Part A)', () => {

  test('Fuego 3: flips 1 opponent face-up card to facedown', () => {
    const state = makeState();
    state.field.izquierda.player.push(fieldCard('X', 3, false));
    mm.simulateCardEffect(state, card('Fuego 3', 3), 'centro');
    expect(state.field.izquierda.player[0].faceDown).toBe(true);
  });

  test('Fuego 3: does nothing if opponent has no face-up cards', () => {
    const state = makeState();
    state.field.izquierda.player.push(fieldCard('X', 3, true));
    mm.simulateCardEffect(state, card('Fuego 3', 3), 'centro');
    // Card stays facedown (nothing to flip)
    expect(state.field.izquierda.player[0].faceDown).toBe(true);
  });

  test('Plaga 4: removes 1 facedown player card from field', () => {
    const state = makeState();
    state.field.centro.player.push(fieldCard('Y', 2, true));
    state.field.centro.player.push(fieldCard('Z', 4, false));
    mm.simulateCardEffect(state, card('Plaga 4', 4), 'derecha');
    // Facedown card removed, face-up card remains
    const remaining = state.field.centro.player;
    expect(remaining.length).toBe(1);
    expect(remaining[0].card.nombre).toBe('Z');
    expect(state.player.trash.length).toBe(1);
  });

  test('Plaga 4: does nothing if opponent has no facedown cards', () => {
    const state = makeState();
    state.field.centro.player.push(fieldCard('Z', 4, false));
    mm.simulateCardEffect(state, card('Plaga 4', 4), 'derecha');
    expect(state.field.centro.player.length).toBe(1);
    expect(state.player.trash.length).toBe(0);
  });

  test('Psique 1: sets player.cannotCompile flag', () => {
    const state = makeState();
    mm.simulateCardEffect(state, card('Psique 1', 1), 'izquierda');
    expect(state.player.cannotCompile).toBe(true);
  });

  test('Psique 4: returns highest player field card to hand', () => {
    const state = makeState();
    state.field.izquierda.player.push(fieldCard('Low', 1, false));
    state.field.derecha.player.push(fieldCard('High', 5, false));
    mm.simulateCardEffect(state, card('Psique 4', 4), 'centro');
    expect(state.player.hand.length).toBe(1);
    expect(state.player.hand[0].nombre).toBe('High');
    expect(state.field.derecha.player.length).toBe(0);
    expect(state.field.izquierda.player.length).toBe(1);
  });

  test('Oscuridad 2: flips 1 opponent face-up card to facedown', () => {
    const state = makeState();
    state.field.centro.player.push(fieldCard('A', 3, false));
    mm.simulateCardEffect(state, card('Oscuridad 2', 2), 'izquierda');
    expect(state.field.centro.player[0].faceDown).toBe(true);
  });

  test('Oscuridad 4: flips 1 opponent face-up card to facedown (shift disruption)', () => {
    const state = makeState();
    state.field.izquierda.player.push(fieldCard('B', 4, false));
    mm.simulateCardEffect(state, card('Oscuridad 4', 4), 'derecha');
    expect(state.field.izquierda.player[0].faceDown).toBe(true);
  });

});
