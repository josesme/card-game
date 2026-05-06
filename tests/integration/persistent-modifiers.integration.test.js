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
  global.logEvent = jest.fn();
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../../src/abilities-engine.js'), 'utf8'
  );
  // eslint-disable-next-line no-new-func
  new Function(
    'LINES', 'gameState', 'updateUI', 'updateStatus', 'logEvent', 'drawCard', 'draw', 'discard',
    'startEffect', 'highlightSelectableLines', 'aiLowestValueCardIdx',
    'aiPickDestLine', 'executeNewEffect', 'document', 'window',
    engineCode
  )(
    global.LINES, global.gameState, global.updateUI, global.updateStatus, global.logEvent,
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

// ─── Metal 0: valueReduction aplica aunque esté cubierta ─────────────────────

describe('Metal 0 — valueReduction persiste aunque esté cubierta', () => {
  const metal0 = makeCard('Metal 0', 0);
  const someCard = makeCard('Fuego 3', 3);
  const coverCard = makeCard('Fuego 1', 1);

  // Load score-utils to get calculateScore as a pure function independent of logic.js
  let calcScore;
  beforeAll(() => {
    const scoreUtilsCode = fs.readFileSync(
      path.join(__dirname, '../../src/score-utils.js'), 'utf8'
    );
    const selfMock = {};
    new Function('self', 'CARD_EFFECTS', scoreUtilsCode)(selfMock, global.window.CARD_EFFECTS);
    calcScore = selfMock.calculateScore;
  });

  function makeState(aiStack, playerStack) {
    const field = {};
    LINES_MOCK.forEach(l => { field[l] = { player: [], ai: [] }; });
    field['alpha'].ai = aiStack;
    field['alpha'].player = playerStack;
    return { player: { hand: [] }, ai: { hand: [] }, field };
  }

  test('Metal 0 bocarriba descubierta: reduce score del oponente en 2', () => {
    const state = makeState(
      [{ card: metal0, faceDown: false }],
      [{ card: someCard, faceDown: false }]
    );
    expect(calcScore(state, 'alpha', 'player')).toBe(1); // 3 - 2
  });

  test('Metal 0 bocarriba cubierta: sigue reduciendo score del oponente en 2', () => {
    const state = makeState(
      [{ card: metal0, faceDown: false }, { card: coverCard, faceDown: false }],
      [{ card: someCard, faceDown: false }]
    );
    expect(calcScore(state, 'alpha', 'player')).toBe(1); // 3 - 2, Metal 0 activo aunque cubierto
  });

  test('Metal 0 bocabajo cubierta: NO reduce score', () => {
    const state = makeState(
      [{ card: metal0, faceDown: true }, { card: coverCard, faceDown: false }],
      [{ card: someCard, faceDown: false }]
    );
    expect(calcScore(state, 'alpha', 'player')).toBe(3); // bocabajo → inactivo
  });
});
