/**
 * Tests de integración — Asimilación 6
 *
 * Cubre el bug donde el juego quedaba en callejón sin salida tras jugar
 * Asimilación 6: el efecto onTurnEnd (playOwnTopDeckOpponentSide) establece
 * un effectContext interactivo; finishEffect() no retomaba la cadena
 * processingEndTriggers al resolver.
 *
 * El test verifica el lado del motor (abilities-engine.js):
 *   - onTurnEndEffects detecta correctamente Asimilación 6 como trigger
 *   - processNextEndTrigger activa el efecto y establece effectContext
 *   - Con mazo vacío, el efecto avanza sin colgar (processAbilityEffect)
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['izquierda', 'centro', 'derecha'];

function makeCard(nombre, valor = 1) {
  return { nombre, valor, id: `${nombre}-test`, protocol: 'Asimilación' };
}

function makeEmptyField() {
  const field = {};
  LINES_MOCK.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return field;
}

function makeGameState() {
  return {
    player: { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false, protocols: [] },
    ai:     { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false, protocols: [] },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'player',
    currentEffectLine: null,
    pendingEndTriggers: [],
    pendingStartTriggers: [],
    processingEndTriggers: false,
    processingStartTriggers: false,
    pendingEndTurnWho: null,
    pendingStartTurnWho: null,
    armedEndEffects: null,
    ignoreEffectsLines: {},
    currentTriggerCard: null,
    _inOpponentDrawEffects: false,
    _inOpponentDiscardEffects: false,
  };
}

let GS;
let ENGINE;
let continueAfterEndEffectsMock;

function loadEngine() {
  GS = makeGameState();
  continueAfterEndEffectsMock = jest.fn();

  global.LINES = LINES_MOCK;
  global.gameState = GS;
  global.updateUI = jest.fn();
  global.updateStatus = jest.fn();
  global.drawCard = (target) => {
    if (GS[target].deck.length > 0) { GS[target].hand.push(GS[target].deck.pop()); return true; }
    return false;
  };
  global.draw = (target, count) => { for (let i = 0; i < count; i++) global.drawCard(target); };
  global.discard = jest.fn();
  global.startEffect = jest.fn();
  global.highlightSelectableLines = jest.fn();
  global.aiLowestValueCardIdx = jest.fn(() => 0);
  global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect = jest.fn();
  global.logEvent = jest.fn();
  global.calculateScore = jest.fn(() => 0);
  global.triggerUncovered = jest.fn();
  global.triggerFlipFaceUp = jest.fn();
  global.applyReturnToHand = jest.fn();
  global.shuffleDiscardIntoDeck = jest.fn();
  global.onOpponentPlayInLineEffects = jest.fn();
  global.continueAfterEndEffects = continueAfterEndEffectsMock;
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../../src/abilities-engine.js'), 'utf8'
  );
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
}

beforeAll(() => loadEngine());
beforeEach(() => {
  jest.clearAllMocks();
  GS.field = makeEmptyField();
  GS.effectQueue = [];
  GS.effectContext = null;
  GS.pendingEndTriggers = [];
  GS.processingEndTriggers = false;
  GS.pendingEndTurnWho = null;
  GS.armedEndEffects = null;
  GS.ignoreEffectsLines = {};
  GS.player.deck = [];
  GS.player.hand = [];
  GS.ai.hand = [];
  GS.ai.deck = [];
  continueAfterEndEffectsMock.mockClear();
  global.continueAfterEndEffects = continueAfterEndEffectsMock;
});

describe('Asimilación 6 — onTurnEnd: playOwnTopDeckOpponentSide', () => {
  test('onTurnEndEffects detecta Asimilación 6 (top descubierta) como trigger de fin de turno', () => {
    const asim6 = makeCard('Asimilación 6', 6);
    GS.field.centro.player.push({ card: asim6, faceDown: false });

    ENGINE.onTurnEndEffects('player');

    expect(GS.pendingEndTriggers.length).toBe(1);
    expect(GS.pendingEndTriggers[0].card.nombre).toBe('Asimilación 6');
  });

  test('carta bocabajo no activa el trigger de fin de turno', () => {
    const asim6 = makeCard('Asimilación 6', 6);
    GS.field.centro.player.push({ card: asim6, faceDown: true });

    ENGINE.onTurnEndEffects('player');

    expect(GS.pendingEndTriggers.length).toBe(0);
  });

  test('processNextEndTrigger activa el efecto y establece effectContext interactivo cuando hay mazo', () => {
    const asim6 = makeCard('Asimilación 6', 6);
    GS.field.centro.player.push({ card: asim6, faceDown: false });
    GS.player.deck = [makeCard('SomeCard', 3)];
    GS.currentEffectLine = 'centro';

    ENGINE.onTurnEndEffects('player');
    ENGINE.processNextEndTrigger('player');

    expect(GS.effectContext).not.toBeNull();
    expect(GS.effectContext.type).toBe('playTopDeckFaceDownOpponentChooseLine');
    expect(GS.effectContext.owner).toBe('player');
    expect(GS.effectContext.opponent).toBe('ai');
    expect(GS.effectContext.waitingForLine).toBe(true);
  });

  test('con mazo vacío el efecto avanza directamente sin establecer effectContext', () => {
    const asim6 = makeCard('Asimilación 6', 6);
    GS.field.centro.player.push({ card: asim6, faceDown: false });
    GS.player.deck = [];
    GS.currentEffectLine = 'centro';

    ENGINE.onTurnEndEffects('player');
    // continueEndTurn establece pendingEndTurnWho antes de llamar processNextEndTrigger
    GS.pendingEndTurnWho = 'player';
    ENGINE.processNextEndTrigger('player');

    // Sin cartas el efecto llama processAbilityEffect con cola vacía →
    // que detecta processingEndTriggers y llama processNextEndTrigger otra vez →
    // que llama continueAfterEndEffects (cola de triggers vacía)
    expect(GS.effectContext).toBeNull();
    expect(continueAfterEndEffectsMock).toHaveBeenCalledWith('player');
  });
});
