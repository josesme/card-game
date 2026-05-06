/**
 * Tests de integración — Metal 3
 *
 * Bug histórico: deleteLineIfOver usaba la línea propia (currentEffectLine)
 * en lugar de "otra línea", contaba score en vez de número de cartas, y
 * usaba > en lugar de >= para el threshold de 8.
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['alpha', 'beta', 'gamma'];

function makeCard(nombre, valor) {
  return { nombre, valor, id: `${nombre}-${Math.random().toString(36).slice(2, 6)}`, protocol: 'Metal' };
}

function makeEmptyField() {
  const f = {};
  LINES_MOCK.forEach(l => { f[l] = { player: [], ai: [], compiledBy: null }; });
  return f;
}

function freshGS() {
  return {
    player: { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    ai:     { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    field: makeEmptyField(),
    effectQueue: [], effectContext: null, turn: 'ai',
    currentEffectLine: 'alpha', currentTriggerCard: null,
    uncoveredThisTurn: new Set(),
    pendingLanding: null, pendingEndTurnFor: null, pendingControlResume: null,
    ignoreEffectsLines: {},
  };
}

let ENGINE;
let GS;

beforeAll(() => {
  GS = freshGS();
  global.LINES = LINES_MOCK;
  global.gameState = GS;
  global.updateUI = jest.fn();
  global.updateStatus = jest.fn();
  global.logEvent = jest.fn();
  global.drawCard = jest.fn(() => true);
  global.draw = jest.fn();
  global.discard = jest.fn();
  global.startEffect = jest.fn();
  global.finishEffect = jest.fn();
  global.highlightSelectableLines = jest.fn();
  global.triggerUncovered = jest.fn();
  global.aiLowestValueCardIdx = jest.fn(() => 0);
  global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect = jest.fn();
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};
  global.AudioManager = undefined;

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../../src/abilities-engine.js'), 'utf8'
  );
  new Function(
    'LINES', 'gameState', 'updateUI', 'updateStatus', 'logEvent', 'drawCard', 'draw', 'discard',
    'startEffect', 'finishEffect', 'highlightSelectableLines', 'triggerUncovered',
    'aiLowestValueCardIdx', 'aiPickDestLine', 'executeNewEffect', 'document', 'window', 'AudioManager',
    engineCode
  )(
    global.LINES, global.gameState, global.updateUI, global.updateStatus, global.logEvent,
    global.drawCard, global.draw, global.discard, global.startEffect, global.finishEffect,
    global.highlightSelectableLines, global.triggerUncovered,
    global.aiLowestValueCardIdx, global.aiPickDestLine, global.executeNewEffect,
    global.document, global.window, global.AudioManager
  );
  ENGINE = global.window;
});

beforeEach(() => {
  const f = makeEmptyField();
  GS.field = f;
  GS.player.trash = [];
  GS.ai.trash = [];
  GS.effectQueue = [];
  GS.effectContext = null;
  GS.currentEffectLine = 'alpha';
  GS.turn = 'ai';
  jest.clearAllMocks();
});

describe('Metal 3 — deleteLineIfOver (IA)', () => {
  const metal3 = makeCard('Metal 3', 3);
  const fillCards = (n) => Array.from({ length: n }, (_, i) => ({ card: makeCard(`Fuego ${i}`, i), faceDown: false }));

  test('no elimina si no hay otra línea con ≥8 cartas', () => {
    // alpha: línea propia (7 cartas entre ambos lados)
    GS.field['alpha'].ai = fillCards(4);
    GS.field['alpha'].player = fillCards(3);
    // beta: solo 5 cartas
    GS.field['beta'].player = fillCards(5);

    GS.effectQueue = [{ effect: { action: 'deleteLineIfOver', threshold: 8, target: 'other' }, targetPlayer: 'ai', cardName: 'Metal 3' }];
    GS.currentEffectLine = 'alpha';

    global.window.processAbilityEffect();

    // beta no tenía ≥8 cartas → no se elimina
    expect(GS.field['beta'].player.length).toBe(5);
  });

  test('elimina todas las cartas (ambos lados) de la línea con ≥8 cartas', () => {
    // alpha: línea propia de la IA
    GS.field['alpha'].ai = fillCards(2);
    // beta: 5 player + 3 ai = 8 cartas → válida
    GS.field['beta'].player = fillCards(5);
    GS.field['beta'].ai = fillCards(3);
    // gamma: solo 2 cartas
    GS.field['gamma'].player = fillCards(2);

    GS.effectQueue = [{ effect: { action: 'deleteLineIfOver', threshold: 8, target: 'other' }, targetPlayer: 'ai', cardName: 'Metal 3' }];
    GS.currentEffectLine = 'alpha';

    global.window.processAbilityEffect();

    // beta debe quedar vacía
    expect(GS.field['beta'].player.length).toBe(0);
    expect(GS.field['beta'].ai.length).toBe(0);
    // gamma no tocada
    expect(GS.field['gamma'].player.length).toBe(2);
    // alpha (línea propia) no tocada
    expect(GS.field['alpha'].ai.length).toBe(2);
  });

  test('no elimina la línea propia aunque tenga ≥8 cartas', () => {
    // alpha: la propia, con 8 cartas
    GS.field['alpha'].ai = fillCards(4);
    GS.field['alpha'].player = fillCards(4);
    // beta: sin cartas válidas
    GS.field['beta'].player = fillCards(2);

    GS.effectQueue = [{ effect: { action: 'deleteLineIfOver', threshold: 8, target: 'other' }, targetPlayer: 'ai', cardName: 'Metal 3' }];
    GS.currentEffectLine = 'alpha';

    global.window.processAbilityEffect();

    // alpha no debe ser tocada
    expect(GS.field['alpha'].ai.length).toBe(4);
    expect(GS.field['alpha'].player.length).toBe(4);
  });

  test('exactamente 8 cartas activa el efecto (>=, no >)', () => {
    GS.field['alpha'].ai = fillCards(1);
    // beta: exactamente 8 cartas (4+4)
    GS.field['beta'].player = fillCards(4);
    GS.field['beta'].ai = fillCards(4);

    GS.effectQueue = [{ effect: { action: 'deleteLineIfOver', threshold: 8, target: 'other' }, targetPlayer: 'ai', cardName: 'Metal 3' }];
    GS.currentEffectLine = 'alpha';

    global.window.processAbilityEffect();

    expect(GS.field['beta'].player.length).toBe(0);
    expect(GS.field['beta'].ai.length).toBe(0);
  });
});
