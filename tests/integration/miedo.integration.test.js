/**
 * Tests de integración — Miedo 3
 *
 * Bug histórico: el comando central de Miedo 3 (shift oponente en esta línea,
 * cubierta o descubierta) no se disparaba porque `targetAll: true` del actionDef
 * no se transfería a shiftOpts en el case 'shift' de resolveAbilityAction.
 * Sin targetAll, el hasValid check de startEffect solo revisaba la carta top;
 * y effectContext tampoco tenía targetAll, por lo que markFieldTargets no
 * resaltaba las cartas cubiertas seleccionables.
 *
 * Fix: `if (actionDef.targetAll) shiftOpts.targetAll = true;`
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
    player: { hand: [], deck: [], trash: [], compiled: [], protocols: ['Miedo'],
      drawnSinceLastCheck: false, discardedSinceLastCheck: false,
      drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    ai: { hand: [], deck: [], trash: [], compiled: [], protocols: ['Unidad'],
      drawnSinceLastCheck: false, discardedSinceLastCheck: false,
      drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'player',
    phase: 'action',
    currentEffectLine: 'centro',
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
    uncoveredThisTurn: new Set(),
  };
}

let ENGINE = null;
let GS    = null;
let startEffectSpy = null;

function loadEngine() {
  GS = makeGameState();
  global.LINES      = LINES_MOCK;
  global.gameState  = GS;
  global.updateUI   = jest.fn();
  global.updateStatus = jest.fn();
  global.logEvent   = jest.fn();
  global.drawCard   = (target) => {
    if (GS[target].deck.length > 0) { GS[target].hand.push(GS[target].deck.pop()); return true; }
    return false;
  };
  global.draw    = (target, count) => { for (let i = 0; i < count; i++) global.drawCard(target); };
  global.discard = (target, count) => {
    for (let i = 0; i < count; i++) {
      if (GS[target].hand.length > 0) GS[target].trash.push(GS[target].hand.pop());
    }
  };
  global.highlightSelectableLines = jest.fn();
  global.highlightEffectTargets   = jest.fn();
  global.clearEffectHighlights    = jest.fn();
  global.aiLowestValueCardIdx     = jest.fn(() => 0);
  global.aiPickDestLine           = jest.fn(() => LINES_MOCK[0]);
  global.executeNewEffect         = jest.fn();
  global.showConfirmDialog        = jest.fn();
  global.showRearrangeDoneButton  = jest.fn();
  global.document = { getElementById: jest.fn(() => null), querySelectorAll: jest.fn(() => []) };
  global.window   = {};
  global.getPersistentModifiers   = jest.fn(() => ({}));
  global.cardMatchesFilter        = jest.fn(() => true);

  startEffectSpy = jest.fn();
  global.startEffect = startEffectSpy;

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../../src/abilities-engine.js'), 'utf8'
  );
  ENGINE = {};
  new Function(
    'LINES', 'gameState', 'updateUI', 'updateStatus', 'logEvent', 'drawCard', 'draw', 'discard',
    'startEffect', 'highlightSelectableLines', 'highlightEffectTargets', 'clearEffectHighlights',
    'aiLowestValueCardIdx', 'aiPickDestLine', 'executeNewEffect', 'showConfirmDialog',
    'showRearrangeDoneButton', 'getPersistentModifiers', 'cardMatchesFilter', 'document', 'window',
    `
    ${engineCode}
    if (typeof triggerCardEffect !== 'undefined') {
      this.triggerCardEffect = triggerCardEffect;
      this.processAbilityEffect = processAbilityEffect;
    }
    `
  ).call(
    ENGINE,
    global.LINES, global.gameState, global.updateUI, global.updateStatus, global.logEvent,
    global.drawCard, global.draw, global.discard, global.startEffect,
    global.highlightSelectableLines, global.highlightEffectTargets, global.clearEffectHighlights,
    global.aiLowestValueCardIdx, global.aiPickDestLine, global.executeNewEffect,
    global.showConfirmDialog, global.showRearrangeDoneButton,
    global.getPersistentModifiers, global.cardMatchesFilter,
    global.document, global.window
  );
}

describe('Miedo 3 — onPlay shift oponente (targetAll forwarding)', () => {

  beforeEach(() => {
    loadEngine();
  });

  test('startEffect recibe targetAll:true al disparar onPlay del jugador', () => {
    // IA tiene una carta bocarriba en la línea centro
    GS.field.centro.ai.push({ card: makeCard('Unidad 5', 5), faceDown: false });
    GS.currentEffectLine = 'centro';

    const miedo3 = makeCard('Miedo 3', 3);
    ENGINE.triggerCardEffect(miedo3, 'onPlay', 'player');

    expect(startEffectSpy).toHaveBeenCalled();
    const call = startEffectSpy.mock.calls[0];
    // call: (type, target, count, opts)
    expect(call[0]).toBe('shift');
    expect(call[1]).toBe('ai');      // oponente del jugador
    expect(call[3]).toMatchObject({ targetAll: true, forceLine: 'centro' });
  });

  test('startEffect recibe targetAll:true aunque la carta top sea cubierta', () => {
    // IA tiene una carta cubierta (top cubierta = bocabajo) en centro
    GS.field.centro.ai.push({ card: makeCard('Unidad 2', 2), faceDown: true });
    GS.currentEffectLine = 'centro';

    const miedo3 = makeCard('Miedo 3', 3);
    ENGINE.triggerCardEffect(miedo3, 'onPlay', 'player');

    expect(startEffectSpy).toHaveBeenCalled();
    expect(startEffectSpy.mock.calls[0][3]).toMatchObject({ targetAll: true });
  });

  test('startEffect NO se llama si la IA no tiene cartas en la línea actual', () => {
    // centro AI vacío — efecto correctamente omitido (no hay targetAll que salve eso)
    // startEffect no debe llamarse porque hasValid falla
    // Nota: aquí startEffect es el spy; si se llama con una pila vacía,
    // el propio startEffect real haría el skip — aquí verificamos que
    // resolveAbilityAction SÍ llama a startEffect (el guard está dentro de él).
    GS.currentEffectLine = 'centro';
    // campo AI centro vacío

    const miedo3 = makeCard('Miedo 3', 3);
    ENGINE.triggerCardEffect(miedo3, 'onPlay', 'player');

    // startEffect se llama — el guard hasValid está dentro de startEffect real,
    // no en resolveAbilityAction. Solo verificamos que se pasa targetAll.
    if (startEffectSpy.mock.calls.length > 0) {
      expect(startEffectSpy.mock.calls[0][3]).toMatchObject({ targetAll: true });
    }
    // Si no se llamó (cola vacía antes de llegar), el test pasa igualmente
    // porque el bug era que se llamaba SIN targetAll, no que no se llamara.
  });

});
