/**
 * Tests de integración — Luz 2
 *
 * Cubre el bug donde la IA ejecutaba "Revela 1 carta bocabajo. Puedes cambiar
 * o voltear esa carta." y lanzaba ReferenceError: bestSide is not defined.
 * La variable correcta era bestTarget — typo en el bloque de decisión de la IA.
 */

const fs   = require('fs');
const path = require('path');

const LINES_MOCK = ['alpha', 'beta', 'gamma'];

function makeCard(nombre, valor = 1) {
  return { nombre, valor, id: `${nombre}-${Math.random().toString(36).slice(2,7)}` };
}

function makeEmptyField() {
  const field = {};
  LINES_MOCK.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return field;
}

function makeGameState() {
  return {
    player: { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    ai:     { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'ai',
    currentEffectLine: null,
    currentTriggerCard: 'Luz 2',
    _inOpponentDrawEffects: false,
    _inOpponentDiscardEffects: false,
    lastRevealedCard: null,
  };
}

let ENGINE = null;
let GS     = null;

function loadEngine() {
  GS = makeGameState();
  global.LINES        = LINES_MOCK;
  global.gameState    = GS;
  global.updateUI     = jest.fn();
  global.updateStatus = jest.fn();
  global.logEvent     = jest.fn();

  global.drawCard = (target) => {
    if (GS[target].deck.length > 0) { GS[target].hand.push(GS[target].deck.pop()); return true; }
    return false;
  };
  global.draw = (target, count) => { for (let i = 0; i < count; i++) global.drawCard(target); };
  global.discard = (target, count) => {
    for (let i = 0; i < count; i++) {
      if (GS[target].hand.length > 0) GS[target].trash.push(GS[target].hand.pop());
    }
  };

  global.startEffect        = jest.fn();
  global.highlightSelectableLines = jest.fn();
  global.aiLowestValueCardIdx     = jest.fn(() => 0);
  global.aiPickDestLine           = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect         = jest.fn();
  global.triggerFlipFaceUp        = jest.fn();
  global.insertCardIntoStack      = jest.fn((stack, card) => stack.push(card));
  global.triggerUncovered         = jest.fn();
  global.document = { getElementById: jest.fn(() => null) };
  global.window   = {};

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../../src/abilities-engine.js'), 'utf8'
  );
  // eslint-disable-next-line no-new-func
  ENGINE = new Function(
    'LINES','gameState','updateUI','updateStatus','logEvent',
    'drawCard','draw','discard','startEffect','highlightSelectableLines',
    'aiLowestValueCardIdx','aiPickDestLine','executeNewEffect',
    'triggerFlipFaceUp','insertCardIntoStack','triggerUncovered',
    'document','window',
    engineCode + '\nreturn { resolveAbilityAction, processAbilityEffect };'
  )(
    global.LINES, global.gameState, global.updateUI, global.updateStatus, global.logEvent,
    global.drawCard, global.draw, global.discard, global.startEffect,
    global.highlightSelectableLines, global.aiLowestValueCardIdx, global.aiPickDestLine,
    global.executeNewEffect, global.triggerFlipFaceUp, global.insertCardIntoStack,
    global.triggerUncovered, global.document, global.window
  );
}

beforeEach(() => { loadEngine(); });

describe('Luz 2 — IA revela carta bocabajo', () => {
  test('no lanza ReferenceError cuando la IA tiene una carta bocabajo propia', () => {
    // IA tiene una carta bocabajo en campo
    GS.field.alpha.ai.push({ card: makeCard('Metal 3', 3), faceDown: true });
    // Mazo con cartas para el robo de Luz 2 (roba 2)
    GS.ai.deck.push({ card: makeCard('X', 1) }, { card: makeCard('Y', 1) });

    expect(() => {
      ENGINE.resolveAbilityAction({ action: 'maySwapOrFlip' }, 'ai');
    }).not.toThrow();
  });

  test('no lanza ReferenceError cuando la IA tiene carta bocabajo del jugador', () => {
    // Solo hay carta bocabajo del jugador (sin bocabajo propias de IA)
    GS.field.beta.player.push({ card: makeCard('Agua 1', 1), faceDown: true });
    GS.ai.deck.push({ card: makeCard('X', 1) }, { card: makeCard('Y', 1) });

    expect(() => {
      ENGINE.resolveAbilityAction({ action: 'maySwapOrFlip' }, 'ai');
    }).not.toThrow();
  });

  test('no lanza ReferenceError cuando no hay cartas bocabajo en campo', () => {
    // Campo vacío — sin bocabajo
    GS.field.alpha.ai.push({ card: makeCard('Fuego 1', 1), faceDown: false });
    GS.ai.deck.push({ card: makeCard('X', 1) }, { card: makeCard('Y', 1) });

    expect(() => {
      ENGINE.resolveAbilityAction({ action: 'maySwapOrFlip' }, 'ai');
    }).not.toThrow();
  });

  test('lastRevealedCard se asigna correctamente cuando hay bocabajo', () => {
    const card = { card: makeCard('Metal 3', 3), faceDown: true };
    GS.field.alpha.ai.push(card);
    GS.ai.deck.push({ card: makeCard('X', 1) }, { card: makeCard('Y', 1) });

    ENGINE.resolveAbilityAction({ action: 'maySwapOrFlip' }, 'ai');

    expect(GS.lastRevealedCard).not.toBeNull();
    expect(GS.lastRevealedCard.target).toBe('ai');
  });
});
