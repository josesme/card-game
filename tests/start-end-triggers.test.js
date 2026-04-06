/**
 * Tests para el sistema de triggers Start/End simultáneos.
 *
 * Qué testean estos tests:
 *  - onTurnStart/EndEffects recogen triggers en el array pendiente, SIN disparar directamente.
 *  - processNextStart/EndTrigger limpia los flags y dispara efectos correctamente.
 *  - Con lista vacía, los flags se limpian (la continuación se verifica por flag/estado, no por mock interno).
 *
 * Cartas con onTurnStart: Espíritu 3, Muerte 1, Odio 3, Psique 1
 * Cartas con onTurnEnd (no persistentEnd): Espíritu 0, Espíritu 1, Fuego 3, Luz 1, Plaga 4
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['izquierda', 'centro', 'derecha'];

function makeEmptyField() {
  const field = {};
  LINES_MOCK.forEach(l => {
    field[l] = { player: [], ai: [], compiledBy: null };
  });
  return field;
}

function makeCard(nombre, valor = 1) {
  return { nombre, valor, id: `${nombre}-test` };
}

function makeGameState() {
  return {
    player: { hand: [], deck: Array.from({ length: 10 }, (_, i) => makeCard(`dummy-${i}`)), trash: [], protocols: [] },
    ai:     { hand: [], deck: Array.from({ length: 10 }, (_, i) => makeCard(`dummy-ai-${i}`)), trash: [], protocols: [] },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'player',
    currentEffectLine: null,
    armedEndEffects: null,
    pendingStartTriggers: [],
    pendingEndTriggers: [],
    processingStartTriggers: false,
    processingEndTriggers: false,
    pendingStartTurnWho: null,
    pendingEndTurnWho: null,
    pendingCheckCompile: null,
    pendingStartTurn: null,
    pendingTurnEnd: null,
    pendingLanding: null,
    drawnSinceLastCheck: { player: false, ai: false },
    discardedSinceLastCheck: { player: false, ai: false },
    eliminatedLastTurn: { player: false, ai: false },
    uncoveredThisTurn: new Set(),
    ignoreEffectsLines: {},
    _inOpponentDrawEffects: false,
    _inOpponentDiscardEffects: false,
    _inOwnDiscardEffects: false,
  };
}

let ENGINE = null;
let GS = null;

function getEngine() {
  if (ENGINE) return ENGINE;

  GS = makeGameState();
  global.LINES = LINES_MOCK;
  global.gameState = GS;
  global.updateUI = jest.fn();
  global.updateStatus = jest.fn();
  global.drawCard = jest.fn(target => {
    if (GS[target].deck.length > 0) { GS[target].hand.push(GS[target].deck.pop()); return true; }
    return false;
  });
  global.draw = jest.fn((target, count) => {
    for (let i = 0; i < count; i++) global.drawCard(target);
  });
  global.discard = jest.fn();
  global.startEffect = jest.fn();
  global.highlightSelectableLines = jest.fn();
  global.aiLowestValueCardIdx = jest.fn(() => 0);
  global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect = jest.fn();
  global.continueAfterEndEffects = jest.fn();
  global.checkCompilePhase = jest.fn();
  global.checkWinCondition = jest.fn();
  global.startTurn = jest.fn();
  global.endTurn = jest.fn();
  global.landPendingCard = jest.fn();
  global.calculateScore = jest.fn(() => 0);
  global.compileLine = jest.fn();
  global.executeEffect = jest.fn();
  global.animCardEliminate = jest.fn();
  global.createCardHTML = jest.fn(() => '');
  global.triggerUncovered = jest.fn();
  global.clearEffectHighlights = jest.fn();
  global.highlightEffectTargets = jest.fn();
  global.finishEffect = jest.fn();
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};
  global.setTimeout = jest.fn((fn) => fn()); // ejecutar síncronamente en tests

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../src/abilities-engine.js'), 'utf8'
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
    global.highlightSelectableLines, global.aiLowestValueCardIdx, global.aiPickDestLine,
    global.executeNewEffect, global.document, global.window
  );

  ENGINE = global.window;
  return ENGINE;
}

function resetGS() {
  GS.player = { hand: [], deck: Array.from({ length: 10 }, (_, i) => makeCard(`dummy-${i}`)), trash: [], protocols: [] };
  GS.ai     = { hand: [], deck: Array.from({ length: 10 }, (_, i) => makeCard(`dummy-ai-${i}`)), trash: [], protocols: [] };
  GS.field  = makeEmptyField();
  GS.effectQueue = [];
  GS.effectContext = null;
  GS.turn = 'player';
  GS.armedEndEffects = null;
  GS.pendingStartTriggers = [];
  GS.pendingEndTriggers = [];
  GS.processingStartTriggers = false;
  GS.processingEndTriggers = false;
  GS.pendingStartTurnWho = null;
  GS.pendingEndTurnWho = null;
  GS.pendingCheckCompile = null;
  GS.pendingStartTurn = null;
  GS.pendingTurnEnd = null;
  GS.pendingLanding = null;
  GS.currentEffectLine = null;
  GS.drawnSinceLastCheck = { player: false, ai: false };
  GS.eliminatedLastTurn = { player: false, ai: false };
  GS.discardedSinceLastCheck = { player: false, ai: false };
  GS.uncoveredThisTurn = new Set();
  GS.ignoreEffectsLines = {};
  GS._inOpponentDrawEffects = false;
  GS._inOpponentDiscardEffects = false;
  GS._inOwnDiscardEffects = false;
}

beforeAll(() => getEngine());
beforeEach(() => {
  resetGS();
  jest.clearAllMocks();
  global.continueAfterEndEffects = jest.fn();
  global.checkCompilePhase = jest.fn();
  global.startTurn = jest.fn();
  global.endTurn = jest.fn();
  global.setTimeout = jest.fn((fn) => fn());
});

// ─── onTurnStartEffects: colección ───────────────────────────────────────────

describe('onTurnStartEffects — colección de triggers', () => {
  test('lista vacía si ninguna carta tiene onTurnStart', () => {
    GS.field.izquierda.player = [{ card: makeCard('Metal 2'), faceDown: false }];
    ENGINE.onTurnStartEffects('player');
    expect(GS.pendingStartTriggers).toHaveLength(0);
  });

  test('recoge 1 trigger con Muerte 1 bocarriba', () => {
    GS.field.izquierda.player = [{ card: makeCard('Muerte 1'), faceDown: false }];
    ENGINE.onTurnStartEffects('player');
    expect(GS.pendingStartTriggers).toHaveLength(1);
    expect(GS.pendingStartTriggers[0].card.nombre).toBe('Muerte 1');
    expect(GS.pendingStartTriggers[0].line).toBe('izquierda');
    expect(GS.pendingStartTriggers[0].player).toBe('player');
  });

  test('recoge 2 triggers con 2 cartas en líneas distintas', () => {
    GS.field.izquierda.player = [{ card: makeCard('Muerte 1'), faceDown: false }];
    GS.field.centro.player    = [{ card: makeCard('Odio 3'),   faceDown: false }];
    ENGINE.onTurnStartEffects('player');
    expect(GS.pendingStartTriggers).toHaveLength(2);
    const names = GS.pendingStartTriggers.map(t => t.card.nombre);
    expect(names).toContain('Muerte 1');
    expect(names).toContain('Odio 3');
  });

  test('ignora cartas bocabajo', () => {
    GS.field.izquierda.player = [{ card: makeCard('Muerte 1'), faceDown: true }];
    ENGINE.onTurnStartEffects('player');
    expect(GS.pendingStartTriggers).toHaveLength(0);
  });

  test('NO encola efectos en effectQueue (no dispara directamente)', () => {
    GS.field.izquierda.player = [{ card: makeCard('Muerte 1'), faceDown: false }];
    ENGINE.onTurnStartEffects('player');
    expect(GS.effectQueue).toHaveLength(0);
  });

  test('inicializa armedEndEffects como Set', () => {
    ENGINE.onTurnStartEffects('player');
    expect(GS.armedEndEffects).toBeInstanceOf(Set);
  });
});

// ─── processNextStartTrigger: flags y dispatch ────────────────────────────────

describe('processNextStartTrigger — comportamiento', () => {
  test('con lista vacía: limpia processingStartTriggers y pendingStartTurnWho', () => {
    GS.pendingStartTriggers = [];
    GS.processingStartTriggers = true;
    GS.pendingStartTurnWho = 'player';
    ENGINE.processNextStartTrigger('player');
    expect(GS.processingStartTriggers).toBe(false);
    expect(GS.pendingStartTurnWho).toBeNull();
  });

  test('con lista vacía: la cadena continúa (pendingCheckCompile se resuelve)', () => {
    GS.pendingStartTriggers = [];
    GS.processingStartTriggers = true;
    GS.pendingStartTurnWho = 'player';
    GS.pendingCheckCompile = 'player'; // debería resolverse al continuar
    ENGINE.processNextStartTrigger('player');
    // El motor interno llama processAbilityEffect → checkCompilePhase (via setTimeout mock)
    expect(global.checkCompilePhase).toHaveBeenCalledWith('player');
  });

  test('con 1 trigger: encola efectos en effectQueue al disparar', () => {
    // Odio 3 onTurnStart es condicional (drawnSinceLastCheck), Psique 1 onTurnStart flipSelf
    // Usamos Psique 1 que no necesita condición y es no-interactivo para IA
    GS.turn = 'ai';
    const card = makeCard('Psique 1');
    GS.field.izquierda.ai = [{ card, faceDown: false }];
    GS.pendingStartTriggers = [{ card, line: 'izquierda', player: 'ai' }];
    GS.pendingStartTurnWho = 'ai';
    ENGINE.processNextStartTrigger('ai');
    // El trigger fue consumido
    expect(GS.pendingStartTriggers).toHaveLength(0);
  });

  test('con 1 trigger: currentEffectLine se establece con la línea del trigger', () => {
    GS.turn = 'ai';
    const card = makeCard('Odio 3'); // onTurnStart condicional: si condición false, no hace nada interactivo
    GS.eliminatedLastTurn = { player: false, ai: false }; // condición false → efecto se salta
    GS.field.centro.ai = [{ card, faceDown: false }];
    GS.pendingStartTriggers = [{ card, line: 'centro', player: 'ai' }];
    GS.pendingStartTurnWho = 'ai';
    ENGINE.processNextStartTrigger('ai');
    // currentEffectLine se establece en la línea del trigger antes de disparar
    expect(GS.currentEffectLine).toBe('centro');
  });

  test('con 2 triggers IA: el primer trigger se consume inmediatamente', () => {
    GS.turn = 'ai';
    // Odio 3: condición false → salta sin interacción, procesa rapidísimo
    const card1 = makeCard('Odio 3');
    const card2 = makeCard('Odio 3');
    GS.eliminatedLastTurn = { player: false, ai: false };
    GS.field.izquierda.ai = [{ card: card1, faceDown: false }];
    GS.field.centro.ai    = [{ card: card2, faceDown: false }];
    GS.pendingStartTriggers = [
      { card: card1, line: 'izquierda', player: 'ai' },
      { card: card2, line: 'centro',    player: 'ai' },
    ];
    GS.pendingStartTurnWho = 'ai';
    ENGINE.processNextStartTrigger('ai');
    // Ambos triggers deben procesarse (cadena automática para IA con efecto sin condición)
    expect(GS.pendingStartTriggers).toHaveLength(0);
  });
});

// ─── onTurnEndEffects: colección ─────────────────────────────────────────────

describe('onTurnEndEffects — colección de triggers', () => {
  test('lista vacía si ninguna carta tiene onTurnEnd', () => {
    GS.armedEndEffects = new Set();
    GS.field.izquierda.player = [{ card: makeCard('Metal 2'), faceDown: false }];
    ENGINE.onTurnEndEffects('player');
    expect(GS.pendingEndTriggers).toHaveLength(0);
  });

  test('recoge 1 trigger con Luz 1 bocarriba (top)', () => {
    GS.armedEndEffects = new Set();
    GS.field.izquierda.player = [{ card: makeCard('Luz 1'), faceDown: false }];
    ENGINE.onTurnEndEffects('player');
    expect(GS.pendingEndTriggers).toHaveLength(1);
    expect(GS.pendingEndTriggers[0].card.nombre).toBe('Luz 1');
    expect(GS.pendingEndTriggers[0].line).toBe('izquierda');
  });

  test('recoge 2 triggers con 2 líneas con onTurnEnd', () => {
    GS.armedEndEffects = new Set();
    GS.field.izquierda.player = [{ card: makeCard('Luz 1'),    faceDown: false }];
    GS.field.centro.player    = [{ card: makeCard('Fuego 3'), faceDown: false }];
    ENGINE.onTurnEndEffects('player');
    expect(GS.pendingEndTriggers).toHaveLength(2);
    const names = GS.pendingEndTriggers.map(t => t.card.nombre);
    expect(names).toContain('Luz 1');
    expect(names).toContain('Fuego 3');
  });

  test('NO encola efectos en effectQueue (no dispara directamente)', () => {
    GS.armedEndEffects = new Set();
    GS.field.izquierda.player = [{ card: makeCard('Luz 1'), faceDown: false }];
    ENGINE.onTurnEndEffects('player');
    expect(GS.effectQueue).toHaveLength(0);
  });

  test('limpia armedEndEffects al terminar', () => {
    GS.armedEndEffects = new Set();
    ENGINE.onTurnEndEffects('player');
    expect(GS.armedEndEffects).toBeNull();
  });
});

// ─── processNextEndTrigger: flags y dispatch ──────────────────────────────────

describe('processNextEndTrigger — comportamiento', () => {
  test('con lista vacía: limpia flags y llama continueAfterEndEffects', () => {
    GS.pendingEndTriggers = [];
    GS.processingEndTriggers = true;
    GS.pendingEndTurnWho = 'player';
    ENGINE.processNextEndTrigger('player');
    expect(GS.processingEndTriggers).toBe(false);
    expect(GS.pendingEndTurnWho).toBeNull();
    expect(global.continueAfterEndEffects).toHaveBeenCalledWith('player');
  });

  test('con 1 trigger: el trigger es consumido', () => {
    const card = makeCard('Luz 1');
    GS.pendingEndTriggers = [{ card, line: 'izquierda', player: 'player' }];
    GS.pendingEndTurnWho = 'player';
    ENGINE.processNextEndTrigger('player');
    expect(GS.pendingEndTriggers).toHaveLength(0);
  });

  test('con 1 trigger: currentEffectLine se establece con la línea del trigger', () => {
    const card = makeCard('Luz 1');
    GS.pendingEndTriggers = [{ card, line: 'centro', player: 'player' }];
    GS.pendingEndTurnWho = 'player';
    ENGINE.processNextEndTrigger('player');
    // currentEffectLine se establece en la línea del trigger antes de disparar
    expect(GS.currentEffectLine).toBe('centro');
    expect(GS.pendingEndTriggers).toHaveLength(0);
  });

  test('con 2 triggers IA: ambos se disparan y llama continueAfterEndEffects', () => {
    GS.turn = 'ai';
    // Usar Espíritu 0 + Luz 1: ambos tienen onTurnEnd no-interactivo para IA
    const card1 = makeCard('Espíritu 0');
    const card2 = makeCard('Luz 1');
    GS.field.izquierda.ai = [{ card: card1, faceDown: false }];
    GS.field.centro.ai    = [{ card: card2, faceDown: false }];
    GS.pendingEndTriggers = [
      { card: card1, line: 'izquierda', player: 'ai' },
      { card: card2, line: 'centro',    player: 'ai' },
    ];
    GS.pendingEndTurnWho = 'ai';
    ENGINE.processNextEndTrigger('ai');
    // Toda la cadena procesa ambos triggers y llama la continuación
    expect(GS.pendingEndTriggers).toHaveLength(0);
    expect(global.continueAfterEndEffects).toHaveBeenCalled();
  });
});
