/**
 * Tests de integración — Velocidad
 *
 * Prueban el flujo real del juego, no funciones aisladas.
 * onTurnStartEffects (armado) + onCacheClearEffects (disparo) deben funcionar
 * juntos. Los tests unitarios de phase-b.test.js prueban cada función por
 * separado con estado prefabricado; estos tests prueban la interacción real.
 *
 * MANTENIMIENTO:
 * - Si un test unitario en phase-b.test.js queda absorbido por un test aquí
 *   (mismo escenario, más fiel), eliminar el unitario.
 * - Si al cambiar la implementación un test aquí falla pero los unitarios pasan,
 *   el problema está en la interacción — no eliminar este test.
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

function makeGameState() {
  return {
    player: { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    ai:     { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'player',
    currentEffectLine: null,
    _inOpponentDrawEffects: false,
    _inOpponentDiscardEffects: false,
  };
}

// ─── Carga del motor con implementaciones REALES (no mockeadas) ───────────────

let ENGINE = null;
let GS = null;

function loadEngine() {
  GS = makeGameState();
  global.LINES = LINES_MOCK;
  global.gameState = GS;
  global.updateUI = jest.fn();
  global.updateStatus = jest.fn();

  // drawCard y draw son implementaciones REALES — el test verifica el resultado
  // observando el estado de la mano, no mockeando la función.
  global.drawCard = (target) => {
    if (GS[target].deck.length > 0) {
      GS[target].hand.push(GS[target].deck.pop());
      GS[target].drawnSinceLastCheck = true;
      return true;
    }
    return false;
  };
  global.draw = (target, count) => {
    for (let i = 0; i < count; i++) global.drawCard(target);
  };
  global.discard = (target, count) => {
    for (let i = 0; i < count; i++) {
      if (GS[target].hand.length > 0) {
        GS[target].trash.push(GS[target].hand.pop());
        GS[target].discardedSinceLastCheck = true;
      }
    }
  };

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
}

function resetGS() {
  GS.player = { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false };
  GS.ai     = { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false };
  GS.field = makeEmptyField();
  GS.effectQueue = [];
  GS.effectContext = null;
  GS.armedCacheClearEffects = null;
  GS.armedEndEffects = null;
  GS.pendingStartTriggers = [];
  GS.turn = 'player';
  GS.currentEffectLine = null;
  GS._inOpponentDrawEffects = false;
  GS._inOpponentDiscardEffects = false;
  GS.ignoreEffectsLines = {};
}

beforeAll(() => loadEngine());
beforeEach(() => { resetGS(); jest.clearAllMocks(); });

// ─── Velocidad 1: flujo completo onTurnStartEffects → onCacheClearEffects ─────

describe('Velocidad 1 — integración onTurnStart + onCacheClear', () => {

  test('roba 1 carta si estaba en mesa al inicio del turno (caso normal)', () => {
    const vel1 = makeCard('Velocidad 1');
    GS.field.alpha.player = [{ card: vel1, faceDown: false }];
    GS.player.deck = [makeCard('dummy')];

    // Simular inicio de turno: armar cartas
    ENGINE.onTurnStartEffects('player');
    expect(GS.armedCacheClearEffects.has(vel1.id)).toBe(true);

    const before = GS.player.hand.length;

    // Simular borrar caché al final del turno
    ENGINE.onCacheClearEffects('player');

    expect(GS.player.hand.length).toBe(before + 1);
  });

  test('roba 1 carta aunque esté cubierta por otra carta', () => {
    // Regresión: bug donde onCacheClearEffects solo miraba la carta top.
    // Velocidad 1 cubierta → no era top → no disparaba.
    const vel1 = makeCard('Velocidad 1');
    const psique0 = makeCard('Psique 0');
    GS.field.alpha.player = [
      { card: vel1,   faceDown: false }, // cubierta
      { card: psique0, faceDown: false }, // top
    ];
    GS.player.deck = [makeCard('dummy')];

    ENGINE.onTurnStartEffects('player');
    const before = GS.player.hand.length;
    ENGINE.onCacheClearEffects('player');

    expect(GS.player.hand.length).toBe(before + 1);
  });

  test('NO roba si Velocidad 1 fue jugada durante este turno (no armada)', () => {
    // La carta se juega DESPUÉS de onTurnStartEffects → no está en el set armado.
    ENGINE.onTurnStartEffects('player'); // campo vacío → set armado vacío

    const vel1 = makeCard('Velocidad 1');
    GS.field.alpha.player = [{ card: vel1, faceDown: false }]; // jugada mid-turn
    GS.player.deck = [makeCard('dummy')];

    const before = GS.player.hand.length;
    ENGINE.onCacheClearEffects('player');

    expect(GS.player.hand.length).toBe(before); // no roba
  });

  test('NO roba si Velocidad 1 está bocabajo aunque estuviera armada', () => {
    const vel1 = makeCard('Velocidad 1');
    GS.field.alpha.player = [{ card: vel1, faceDown: false }];
    ENGINE.onTurnStartEffects('player');

    // La carta se voltea bocabajo antes del fin de turno
    GS.field.alpha.player[0].faceDown = true;
    GS.player.deck = [makeCard('dummy')];

    const before = GS.player.hand.length;
    ENGINE.onCacheClearEffects('player');

    expect(GS.player.hand.length).toBe(before);
  });

  test('onCacheClearEffects consume el set: segunda llamada no roba', () => {
    const vel1 = makeCard('Velocidad 1');
    GS.field.alpha.player = [{ card: vel1, faceDown: false }];
    GS.player.deck = [makeCard('d1'), makeCard('d2')];

    ENGINE.onTurnStartEffects('player');
    ENGINE.onCacheClearEffects('player'); // primera: roba 1
    ENGINE.onCacheClearEffects('player'); // segunda: no debería robar (set consumido)

    expect(GS.player.hand.length).toBe(1); // solo 1 carta, no 2
  });
});
