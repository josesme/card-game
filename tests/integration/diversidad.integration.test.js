/**
 * Tests de integración — Diversidad 0 / Unidad 1
 *
 * Validan las reglas aclaradas en el canal oficial rules-questions:
 * - Diversidad 0 y Unidad 1 NO son compilaciones (no activan Guerra 2, etc.)
 * - Diversidad 0 NO borra cartas al compilar
 * - Unidad 1 SIEMPRE borra, incluso cuando ya está compilada
 * - Cartas bocabajo NO cuentan para ningún recuento
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['alpha', 'beta', 'gamma'];

function makeCard(nombre, valor = 1, protocol = '') {
  return { nombre, valor, id: `${nombre}-${Math.random().toString(36).slice(2, 7)}`, protocol };
}

function makeEmptyField() {
  const field = {};
  LINES_MOCK.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return field;
}

function makeGameState() {
  return {
    player: {
      hand: [], deck: [], trash: [],
      protocols: ['Diversidad', 'Unidad', 'Tiempo'],
      compiled: [],
      drawnSinceLastCheck: false, discardedSinceLastCheck: false,
      drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false
    },
    ai: {
      hand: [], deck: [], trash: [],
      protocols: ['Muerte', 'Fuego', 'Agua'],
      compiled: [],
      drawnSinceLastCheck: false, discardedSinceLastCheck: false,
      drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false
    },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'player',
    currentEffectLine: 'alpha',
    currentTriggerCard: null,
    _inOpponentDrawEffects: false,
    _inOpponentDiscardEffects: false,
    ignoreEffectsLines: {},
    armedEndEffects: {},
    armedCacheClearEffects: {},
    pendingStartTriggers: [],
  };
}

let ENGINE = null;
let GS = null;

function loadEngine() {
  GS = makeGameState();
  global.LINES = LINES_MOCK;
  global.gameState = GS;
  global.updateUI = jest.fn();
  global.updateStatus = jest.fn();
  global.logEvent = jest.fn();
  global.checkWinCondition = jest.fn();
  global.onOpponentCompileEffects = jest.fn();
  global.shuffleDiscardIntoDeck = jest.fn();
  global.highlightSelectableLines = jest.fn();
  global.clearEffectHighlights = jest.fn();
  global.startEffect = jest.fn();
  global.aiLowestValueCardIdx = jest.fn(() => 0);
  global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect = jest.fn();
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
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../../src/abilities-engine.js'), 'utf8'
  );
  new Function(
    'LINES', 'gameState', 'updateUI', 'updateStatus', 'logEvent',
    'drawCard', 'draw', 'discard', 'startEffect', 'highlightSelectableLines',
    'aiLowestValueCardIdx', 'aiPickDestLine', 'executeNewEffect',
    'checkWinCondition', 'onOpponentCompileEffects', 'shuffleDiscardIntoDeck',
    'clearEffectHighlights', 'document', 'window',
    engineCode
  )(
    global.LINES, global.gameState, global.updateUI, global.updateStatus, global.logEvent,
    global.drawCard, global.draw, global.discard, global.startEffect,
    global.highlightSelectableLines, global.aiLowestValueCardIdx,
    global.aiPickDestLine, global.executeNewEffect,
    global.checkWinCondition, global.onOpponentCompileEffects, global.shuffleDiscardIntoDeck,
    global.clearEffectHighlights, global.document, global.window
  );

  ENGINE = global.window;
}

function resetGS() {
  GS.player = {
    hand: [], deck: [], trash: [],
    protocols: ['Diversidad', 'Unidad', 'Tiempo'],
    compiled: [],
    drawnSinceLastCheck: false, discardedSinceLastCheck: false,
    drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false
  };
  GS.ai = {
    hand: [], deck: [], trash: [],
    protocols: ['Muerte', 'Fuego', 'Agua'],
    compiled: [],
    drawnSinceLastCheck: false, discardedSinceLastCheck: false,
    drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false
  };
  GS.field = makeEmptyField();
  GS.effectQueue = [];
  GS.effectContext = null;
  GS.currentEffectLine = 'alpha';
  GS.currentTriggerCard = 'Diversidad 0';
  GS.ignoreEffectsLines = {};
  GS.armedEndEffects = {};
  GS.armedCacheClearEffects = {};
  GS.pendingStartTriggers = [];
}

beforeAll(() => loadEngine());
beforeEach(() => { resetGS(); jest.clearAllMocks(); });

// ─── Diversidad 0 ─────────────────────────────────────────────────────────────

describe('Diversidad 0 — compileDiversityIfSixProtocols', () => {

  function triggerDiv0(targetPlayer = 'player') {
    ENGINE.triggerCardEffect(makeCard('Diversidad 0'), 'onPlay', targetPlayer);
  }

  test('compila cuando hay 6 protocolos distintos bocarriba', () => {
    // 6 protocolos distintos bocarriba (player + ai)
    GS.field.alpha.player = [{ card: makeCard('Diversidad 0', 0, 'Diversidad'), faceDown: false }];
    GS.field.alpha.ai    = [{ card: makeCard('Muerte 1',    1, 'Muerte'),    faceDown: false }];
    GS.field.beta.player = [{ card: makeCard('Unidad 1',    1, 'Unidad'),    faceDown: false }];
    GS.field.beta.ai     = [{ card: makeCard('Fuego 1',     1, 'Fuego'),     faceDown: false }];
    GS.field.gamma.player= [{ card: makeCard('Tiempo 1',    1, 'Tiempo'),    faceDown: false }];
    GS.field.gamma.ai    = [{ card: makeCard('Agua 1',      1, 'Agua'),      faceDown: false }];

    triggerDiv0();

    // Protocolo compilado
    expect(GS.field.alpha.compiledBy).toBe('player'); // alpha = protocols[0] = 'Diversidad'
    expect(GS.player.compiled).toContain('Diversidad');
  });

  test('NO compila con menos de 6 protocolos distintos', () => {
    // Solo 4 protocolos distintos
    GS.field.alpha.player = [{ card: makeCard('Diversidad 0', 0, 'Diversidad'), faceDown: false }];
    GS.field.alpha.ai    = [{ card: makeCard('Muerte 1',    1, 'Muerte'),    faceDown: false }];
    GS.field.beta.player = [{ card: makeCard('Unidad 1',    1, 'Unidad'),    faceDown: false }];
    GS.field.beta.ai     = [{ card: makeCard('Fuego 1',     1, 'Fuego'),     faceDown: false }];

    triggerDiv0();

    expect(GS.field.alpha.compiledBy).toBeNull();
    expect(GS.player.compiled).toHaveLength(0);
  });

  test('cartas bocabajo NO cuentan para el recuento', () => {
    // 5 bocarriba + 1 bocabajo → solo 5 protocolos válidos → NO compila
    GS.field.alpha.player = [{ card: makeCard('Diversidad 0', 0, 'Diversidad'), faceDown: false }];
    GS.field.alpha.ai    = [{ card: makeCard('Muerte 1',    1, 'Muerte'),    faceDown: false }];
    GS.field.beta.player = [{ card: makeCard('Unidad 1',    1, 'Unidad'),    faceDown: false }];
    GS.field.beta.ai     = [{ card: makeCard('Fuego 1',     1, 'Fuego'),     faceDown: false }];
    GS.field.gamma.player= [{ card: makeCard('Tiempo 1',    1, 'Tiempo'),    faceDown: false }];
    GS.field.gamma.ai    = [{ card: makeCard('Agua 1',      1, 'Agua'),      faceDown: true }]; // bocabajo

    triggerDiv0();

    expect(GS.field.alpha.compiledBy).toBeNull(); // no compiló
    expect(GS.player.compiled).toHaveLength(0);
  });

  test('NO borra cartas al compilar', () => {
    const cardInLine = { card: makeCard('Fuego 1', 1, 'Fuego'), faceDown: false };
    GS.field.alpha.ai = [cardInLine];
    GS.field.alpha.player = [{ card: makeCard('Diversidad 0', 0, 'Diversidad'), faceDown: false }];
    GS.field.beta.player  = [{ card: makeCard('Unidad 1',  1, 'Unidad'),  faceDown: false }];
    GS.field.beta.ai      = [{ card: makeCard('Muerte 1',  1, 'Muerte'),  faceDown: false }];
    GS.field.gamma.player = [{ card: makeCard('Tiempo 1',  1, 'Tiempo'),  faceDown: false }];
    GS.field.gamma.ai     = [{ card: makeCard('Agua 1',    1, 'Agua'),    faceDown: false }];

    triggerDiv0();

    // La línea alpha (Diversidad) debe seguir teniendo sus cartas
    expect(GS.field.alpha.player.length).toBe(1);
    expect(GS.field.alpha.ai.length).toBe(1);
  });

  test('NO llama a onOpponentCompileEffects (no es acción de compilar)', () => {
    GS.field.alpha.player = [{ card: makeCard('Diversidad 0', 0, 'Diversidad'), faceDown: false }];
    GS.field.alpha.ai    = [{ card: makeCard('Muerte 1',    1, 'Muerte'),    faceDown: false }];
    GS.field.beta.player = [{ card: makeCard('Unidad 1',    1, 'Unidad'),    faceDown: false }];
    GS.field.beta.ai     = [{ card: makeCard('Fuego 1',     1, 'Fuego'),     faceDown: false }];
    GS.field.gamma.player= [{ card: makeCard('Tiempo 1',    1, 'Tiempo'),    faceDown: false }];
    GS.field.gamma.ai    = [{ card: makeCard('Agua 1',      1, 'Agua'),      faceDown: false }];

    triggerDiv0();

    expect(global.onOpponentCompileEffects).not.toHaveBeenCalled();
  });

  test('ya compilada por mismo jugador — no hace nada (no recompila)', () => {
    GS.field.alpha.compiledBy = 'player';
    GS.player.compiled = ['Diversidad'];
    GS.player.deck = [makeCard('rival-top')];
    GS.ai.deck     = [makeCard('rival-top2')];

    // 6 protocolos en campo
    GS.field.alpha.player = [{ card: makeCard('Diversidad 0', 0, 'Diversidad'), faceDown: false }];
    GS.field.alpha.ai    = [{ card: makeCard('Muerte 1',    1, 'Muerte'),    faceDown: false }];
    GS.field.beta.player = [{ card: makeCard('Unidad 1',    1, 'Unidad'),    faceDown: false }];
    GS.field.beta.ai     = [{ card: makeCard('Fuego 1',     1, 'Fuego'),     faceDown: false }];
    GS.field.gamma.player= [{ card: makeCard('Tiempo 1',    1, 'Tiempo'),    faceDown: false }];
    GS.field.gamma.ai    = [{ card: makeCard('Agua 1',      1, 'Agua'),      faceDown: false }];

    const handBefore = GS.player.hand.length;
    triggerDiv0();

    // No se roba del mazo rival
    expect(GS.player.hand.length).toBe(handBefore);
    // compiled no se duplica
    expect(GS.player.compiled.filter(x => x === 'Diversidad')).toHaveLength(1);
  });
});

// ─── Unidad 1 ─────────────────────────────────────────────────────────────────

describe('Unidad 1 — compileSelfIfFiveOrMoreUnity', () => {

  function triggerUnidad1(targetPlayer = 'player') {
    GS.currentEffectLine = 'beta'; // Unidad = protocols[1] → beta
    GS.currentTriggerCard = 'Unidad 1';
    ENGINE.triggerCardEffect(makeCard('Unidad 1'), 'onPlay', targetPlayer);
  }

  function put5UnityFaceUp() {
    // 5 cartas Unidad bocarriba en campo
    GS.field.alpha.player = [{ card: makeCard('Unidad 2', 2, 'Unidad'), faceDown: false }];
    GS.field.alpha.ai    = [{ card: makeCard('Unidad 3', 3, 'Unidad'), faceDown: false }];
    GS.field.beta.player = [{ card: makeCard('Unidad 1', 1, 'Unidad'), faceDown: false }];
    GS.field.beta.ai     = [{ card: makeCard('Unidad 4', 4, 'Unidad'), faceDown: false }];
    GS.field.gamma.player= [{ card: makeCard('Unidad 5', 5, 'Unidad'), faceDown: false }];
  }

  test('borra todas las cartas de la línea y voltea protocolo con 5+ Unidad bocarriba', () => {
    put5UnityFaceUp();
    const extraCard = { card: makeCard('Fuego 1', 1, 'Fuego'), faceDown: false };
    GS.field.beta.player.push(extraCard);

    triggerUnidad1();

    expect(GS.field.beta.player).toHaveLength(0);
    expect(GS.field.beta.ai).toHaveLength(0);
    expect(GS.field.beta.compiledBy).toBe('player');
    expect(GS.player.compiled).toContain('beta');
  });

  test('cartas bocabajo NO cuentan — no dispara con solo 4 bocarriba + 1 bocabajo', () => {
    // 4 bocarriba + 1 bocabajo = no llega a 5
    GS.field.alpha.player = [{ card: makeCard('Unidad 2', 2, 'Unidad'), faceDown: false }];
    GS.field.alpha.ai    = [{ card: makeCard('Unidad 3', 3, 'Unidad'), faceDown: false }];
    GS.field.beta.player = [{ card: makeCard('Unidad 1', 1, 'Unidad'), faceDown: false }];
    GS.field.beta.ai     = [{ card: makeCard('Unidad 4', 4, 'Unidad'), faceDown: false }];
    GS.field.gamma.player= [{ card: makeCard('Unidad 5', 5, 'Unidad'), faceDown: true }]; // bocabajo

    triggerUnidad1();

    expect(GS.field.beta.compiledBy).toBeNull();
    expect(GS.player.compiled).toHaveLength(0);
  });

  test('siempre borra aunque la línea ya esté compilada por el mismo jugador', () => {
    put5UnityFaceUp();
    GS.field.beta.compiledBy = 'player';
    GS.player.compiled = ['beta'];
    const cardInLine = { card: makeCard('Fuego 2', 2, 'Fuego'), faceDown: false };
    GS.field.beta.player.push(cardInLine);

    const deckBefore = GS.ai.deck.length;
    triggerUnidad1();

    // Cartas borradas
    expect(GS.field.beta.player).toHaveLength(0);
    // No roba del mazo rival (no es recompilación)
    expect(GS.player.hand.length).toBe(0);
    expect(GS.ai.deck.length).toBe(deckBefore);
    // compiled no se duplica
    expect(GS.player.compiled.filter(x => x === 'beta')).toHaveLength(1);
  });

  test('NO llama a onOpponentCompileEffects (no es acción de compilar)', () => {
    put5UnityFaceUp();

    triggerUnidad1();

    expect(global.onOpponentCompileEffects).not.toHaveBeenCalled();
  });
});
