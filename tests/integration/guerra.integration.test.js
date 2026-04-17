/**
 * Tests de integración — Guerra 2
 *
 * Escenario reproducido por el usuario:
 * - Línea derecha jugador: [bocabajo, Apatía 0, bocabajo, Apatía 4]
 * - Línea derecha IA: [bocabajo, bocabajo, bocabajo]
 * - IA juega Guerra 2 bocarriba en derecha
 *
 * Guerra 2 onPlay: flip any 1 carta (IA lo resuelve auto).
 * La carta más beneficiosa para la IA es Apatía 4 (bocarriba, valor 4) → la voltea bocabajo.
 *
 * Este test verifica:
 * 1. Que el efecto se dispara correctamente (startEffect llamado con los parámetros correctos).
 * 2. Que la cola de efectos queda vacía tras la resolución (sin freeze).
 * 3. Que effectContext queda null (sin efecto interactivo colgado).
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['izquierda', 'centro', 'derecha'];

function makeCard(nombre, valor = 1, extra = {}) {
  return { nombre, valor, id: `${nombre}-${Math.random().toString(36).slice(2, 7)}`, ...extra };
}

function makeEmptyField() {
  const field = {};
  LINES_MOCK.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return field;
}

function makeGameState() {
  return {
    player: { hand: [], deck: [], trash: [], compiled: [], protocols: ['Apatía'],
      drawnSinceLastCheck: false, discardedSinceLastCheck: false,
      drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    ai: { hand: [], deck: [], trash: [], compiled: [], protocols: ['Guerra'],
      drawnSinceLastCheck: false, discardedSinceLastCheck: false,
      drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'ai',
    phase: 'action',
    currentEffectLine: 'derecha',
    currentTriggerCard: null,
    pendingStartTriggers: [],
    pendingEndTriggers: [],
    processingStartTriggers: false,
    pendingCheckCompile: null,
    pendingTurnEnd: null,
    pendingStartTurn: null,
    pendingLanding: null,
    pendingEndTurnFor: null,
    pendingControlResume: null,
    armedCacheClearEffects: null,
    armedEndEffects: null,
    _inOpponentDrawEffects: false,
    _inOpponentDiscardEffects: false,
    _inOwnDiscardEffects: false,
    ignoreEffectsLines: {},
    coveringCard: null,
  };
}

let ENGINE = null;
let GS = null;

// resolveEffectAI simplificado — solo el caso 'flip' que necesitamos
function resolveEffectAI_flip(target, count, opts, GS, LINES, flipAndTrigger, updateUI_fn, processAbilityEffect_fn) {
  const actualTarget = target === 'any' ? 'player' : target; // default: target player if 'any'

  // Lógica bidireccional: evaluar beneficio real para la IA
  // player bocarriba (V) → bocabajo (2): benefit = V - 2 (bueno si V > 2)
  // AI bocabajo (2) → bocarriba (V): benefit = V - 2 (bueno si V > 2)
  let bestCardObj = null, bestLine = null, bestSide = null, bestIdx = -1, bestBenefit = -Infinity;

  ['player', 'ai'].forEach(side => {
    LINES.forEach(line => {
      const stack = GS.field[line][side];
      if (stack.length === 0) return;
      const topCard = stack[stack.length - 1];
      let benefit;
      if (side === 'player' && !topCard.faceDown) {
        benefit = topCard.card.valor - 2; // flip bocarriba → bocabajo: reduce score rival
      } else if (side === 'ai' && topCard.faceDown) {
        benefit = topCard.card.valor - 2; // flip bocabajo → bocarriba: activa carta propia
      } else {
        return;
      }
      if (benefit > bestBenefit) {
        bestBenefit = benefit; bestCardObj = topCard; bestLine = line; bestSide = side; bestIdx = stack.length - 1;
      }
    });
  });

  if (bestCardObj && bestLine) {
    if (bestSide === 'player') {
      GS.field[bestLine][bestSide][bestIdx].faceDown = true;
    } else {
      flipAndTrigger(GS.field[bestLine][bestSide][bestIdx], bestLine, bestSide);
    }
    updateUI_fn();
  }
  processAbilityEffect_fn();
}

function loadEngine() {
  GS = makeGameState();
  global.LINES = LINES_MOCK;
  global.gameState = GS;
  global.updateUI = jest.fn();
  global.updateStatus = jest.fn();
  global.logEvent = jest.fn();
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
  global.highlightSelectableLines = jest.fn();
  global.aiLowestValueCardIdx = jest.fn(() => 0);
  global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect = jest.fn();
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};

  // startEffect: versión real para flip de IA.
  // Referencia ENGINE lazy (leída en tiempo de llamada, no de definición) para que funcione
  // tanto antes como después de cargar el engine.
  global.startEffect = jest.fn((type, target, count, opts = {}) => {
    if (type === 'flip' && opts.owner === 'ai') {
      resolveEffectAI_flip(
        target, count, opts, GS, LINES_MOCK,
        (cardObj, line, side) => ENGINE && ENGINE.flipAndTrigger && ENGINE.flipAndTrigger(cardObj, line, side),
        global.updateUI,
        () => ENGINE && ENGINE.processAbilityEffect && ENGINE.processAbilityEffect()
      );
    }
    // Otros tipos: dejar mocked (efectos interactivos de jugador no aplican aquí)
  });

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

function resetGS() {
  GS.player = { hand: [], deck: [], trash: [], compiled: [], protocols: ['Apatía'],
    drawnSinceLastCheck: false, discardedSinceLastCheck: false,
    drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false };
  GS.ai = { hand: [], deck: [], trash: [], compiled: [], protocols: ['Guerra'],
    drawnSinceLastCheck: false, discardedSinceLastCheck: false,
    drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false };
  GS.field = makeEmptyField();
  GS.effectQueue = [];
  GS.effectContext = null;
  GS.armedCacheClearEffects = null;
  GS.armedEndEffects = null;
  GS.pendingStartTriggers = [];
  GS.pendingEndTriggers = [];
  GS.processingStartTriggers = false;
  GS.pendingCheckCompile = null;
  GS.pendingTurnEnd = null;
  GS.pendingStartTurn = null;
  GS.pendingLanding = null;
  GS.pendingEndTurnFor = null;
  GS.pendingControlResume = null;
  GS.turn = 'ai';
  GS.phase = 'action';
  GS.currentEffectLine = 'derecha';
  GS.currentTriggerCard = null;
  GS._inOpponentDrawEffects = false;
  GS._inOpponentDiscardEffects = false;
  GS._inOwnDiscardEffects = false;
  GS.ignoreEffectsLines = {};
  GS.coveringCard = null;
}

beforeAll(() => loadEngine());
beforeEach(() => { resetGS(); jest.clearAllMocks(); });

// ─── Setup helper ─────────────────────────────────────────────────────────────

function setupDerecha() {
  const bocabajo1 = makeCard('Dummy A', 3);
  const apatia0   = makeCard('Apatía 0', 0);
  const bocabajo2 = makeCard('Dummy B', 2);
  const apatia4   = makeCard('Apatía 4', 4);

  const aiDown1 = makeCard('Dummy C', 3);
  const aiDown2 = makeCard('Dummy D', 2);
  const aiDown3 = makeCard('Dummy E', 1);
  const guerra2 = makeCard('Guerra 2', 2);

  // Jugador derecha: bocabajo | Apatía 0 | bocabajo | Apatía 4 (top)
  GS.field.derecha.player = [
    { card: bocabajo1, faceDown: true },
    { card: apatia0,   faceDown: false },
    { card: bocabajo2, faceDown: true },
    { card: apatia4,   faceDown: false },  // ← top, bocarriba, valor 4
  ];

  // IA derecha: 3 bocabajo
  GS.field.derecha.ai = [
    { card: aiDown1, faceDown: true },
    { card: aiDown2, faceDown: true },
    { card: aiDown3, faceDown: true },
  ];

  return { apatia4, guerra2 };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Guerra 2 — onPlay flip any (IA juega en derecha)', () => {

  test('triggerCardEffect dispara startEffect con flip-any para la IA', () => {
    const { guerra2 } = setupDerecha();
    GS.currentEffectLine = 'derecha';

    ENGINE.triggerCardEffect(guerra2, 'onPlay', 'ai');

    expect(global.startEffect).toHaveBeenCalledWith(
      'flip', 'any', 1, expect.objectContaining({ owner: 'ai' })
    );
  });

  test('cola de efectos queda vacía tras resolución (sin freeze)', () => {
    const { guerra2 } = setupDerecha();
    GS.currentEffectLine = 'derecha';

    ENGINE.triggerCardEffect(guerra2, 'onPlay', 'ai');

    expect(GS.effectQueue.length).toBe(0);
  });

  test('effectContext queda null tras la resolución (sin efecto interactivo colgado)', () => {
    const { guerra2 } = setupDerecha();
    GS.currentEffectLine = 'derecha';

    ENGINE.triggerCardEffect(guerra2, 'onPlay', 'ai');

    expect(GS.effectContext).toBeNull();
  });

  test('la IA voltea Apatía 4 (top bocarriba, mayor beneficio) bocabajo', () => {
    const { apatia4, guerra2 } = setupDerecha();
    GS.currentEffectLine = 'derecha';

    ENGINE.triggerCardEffect(guerra2, 'onPlay', 'ai');

    // Apatía 4 es la top card del jugador en derecha (índice 3)
    const topPlayerCard = GS.field.derecha.player[3];
    expect(topPlayerCard.card).toBe(apatia4);
    expect(topPlayerCard.faceDown).toBe(true);
  });

  test('onOpponentCompile de Guerra 2 descarta la mano del jugador', () => {
    const { guerra2 } = setupDerecha();
    // Simular que el jugador tiene cartas en mano
    GS.player.hand = [makeCard('Apatía 3'), makeCard('Apatía 5')];

    GS.currentEffectLine = 'derecha';
    // Guerra 2 reacciona cuando el jugador compila — targetPlayer es 'ai' (dueño de la carta)
    ENGINE.triggerCardEffect(guerra2, 'onOpponentCompile', 'ai');

    expect(GS.player.hand.length).toBe(0);
    expect(GS.player.trash.length).toBe(2);
    expect(GS.effectContext).toBeNull();
    expect(GS.effectQueue.length).toBe(0);
  });

});
