/**
 * Tests de integración — getPersistentModifiers y cartas bocabajo
 *
 * Garantiza que los efectos persistentes (preventEliminate, preventShift,
 * preventFlip) NO se aplican cuando la carta está bocabajo.
 * El bug original: la protección se aplicaba sin comprobar faceDown.
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['alpha', 'beta', 'gamma'];

function makeCard(nombre, valor = 1) {
  return { nombre, valor, id: `${nombre}-${Math.random().toString(36).slice(2, 7)}` };
}

function makeEmptyField() {
  const field = {};
  LINES_MOCK.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return field;
}

let ENGINE = null;
let GS = null;

beforeAll(() => {
  GS = {
    player: { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    ai:     { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    field: makeEmptyField(),
    effectQueue: [], effectContext: null, turn: 'player',
    currentEffectLine: null, _inOpponentDrawEffects: false, _inOpponentDiscardEffects: false,
  };
  global.LINES = LINES_MOCK;
  global.gameState = GS;
  global.updateUI = jest.fn();
  global.updateStatus = jest.fn();
  global.drawCard = jest.fn();
  global.draw = jest.fn();
  global.discard = jest.fn();
  global.startEffect = jest.fn();
  global.highlightSelectableLines = jest.fn();
  global.aiLowestValueCardIdx = jest.fn(() => 0);
  global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect = jest.fn();
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../../src/abilities-engine.js'), 'utf8'
  );
  // eslint-disable-next-line no-new-func
  new Function(
    'LINES', 'gameState', 'updateUI', 'updateStatus', 'drawCard', 'draw', 'discard',
    'startEffect', 'highlightSelectableLines', 'aiLowestValueCardIdx',
    'aiPickDestLine', 'executeNewEffect', 'document', 'window',
    engineCode
  )(
    global.LINES, global.gameState, global.updateUI, global.updateStatus,
    global.drawCard, global.draw, global.discard, global.startEffect,
    global.highlightSelectableLines, global.aiLowestValueCardIdx,
    global.aiPickDestLine, global.executeNewEffect, global.document, global.window
  );
  ENGINE = global.window;
});

// ─── getPersistentModifiers: comportamiento bocarriba vs bocabajo ─────────────

describe('getPersistentModifiers — faceDown desactiva protecciones', () => {
  const muerte1 = makeCard('Muerte 1');
  const hielo4  = makeCard('Hielo 4');

  test('Muerte 1 bocarriba: preventEliminate, preventShift, preventFlip activos', () => {
    const mods = ENGINE.getPersistentModifiers({ card: muerte1, faceDown: false });
    expect(mods.preventEliminate).toBe(true);
    expect(mods.preventShift).toBe(true);
    expect(mods.preventFlip).toBe(true);
  });

  test('Muerte 1 bocabajo: sin protecciones (carta inactiva)', () => {
    const mods = ENGINE.getPersistentModifiers({ card: muerte1, faceDown: true });
    expect(mods.preventEliminate).toBeFalsy();
    expect(mods.preventShift).toBeFalsy();
    expect(mods.preventFlip).toBeFalsy();
  });

  test('Hielo 4 bocarriba: preventFlip activo', () => {
    const mods = ENGINE.getPersistentModifiers({ card: hielo4, faceDown: false });
    expect(mods.preventFlip).toBe(true);
  });

  test('Hielo 4 bocabajo: sin preventFlip', () => {
    const mods = ENGINE.getPersistentModifiers({ card: hielo4, faceDown: true });
    expect(mods.preventFlip).toBeFalsy();
  });
});
