/**
 * Tests de integración — Sistema de efectos (Phase 3: deferred triggers)
 *
 * Bug histórico: cuando triggerCardEffect se llamaba con effectContext activo
 * (ej. onPlay de Vida 0 disparando durante un eliminate de Muerte 3), la función
 * del efecto podía llamar startEffect() y sobreescribir el contexto activo,
 * perdiendo el estado del eliminate.
 *
 * Fix (Phase 3): _triggerEffect encola un item {action: '__deferredTrigger'}
 * cuando detecta effectContext activo. El trigger se ejecuta cuando finishEffect
 * libera el contexto y processAbilityEffect procesa la cola.
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['alpha', 'beta', 'gamma'];

function makeEmptyField() {
  const f = {};
  LINES_MOCK.forEach(l => { f[l] = { player: [], ai: [], compiledBy: null }; });
  return f;
}

function freshGameState() {
  return {
    player: { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    ai:     { hand: [], deck: [], trash: [], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'player',
    currentEffectLine: null,
    pendingLanding: null,
    pendingEndTurnFor: null,
    pendingControlResume: null,
    uncoveredThisTurn: new Set(),
    currentTriggerCard: null,
  };
}

describe('Effect system — deferred triggers (Phase 3)', () => {
  let GS;
  let triggerCardEffectMock;
  let _triggerEffect;

  beforeEach(() => {
    GS = freshGameState();
    triggerCardEffectMock = jest.fn();

    // Cargar _triggerEffect desde logic.js en un contexto aislado
    const logicCode = fs.readFileSync(
      path.join(__dirname, '../../src/logic.js'), 'utf8'
    );

    // Extraer solo la función _triggerEffect del código fuente
    const match = logicCode.match(/function _triggerEffect\([\s\S]*?\n\}/);
    if (!match) throw new Error('_triggerEffect not found in logic.js');
    // eslint-disable-next-line no-new-func
    const factory = new Function(
      'gameState', 'triggerCardEffect',
      `${match[0]}; return _triggerEffect;`
    );
    _triggerEffect = factory(GS, triggerCardEffectMock);
  });

  test('llama triggerCardEffect directamente cuando no hay effectContext activo', () => {
    GS.effectContext = null;
    const card = { nombre: 'Vida 0', valor: 0, id: 'vida0-1' };

    _triggerEffect(card, 'onPlay', 'player');

    expect(triggerCardEffectMock).toHaveBeenCalledWith(card, 'onPlay', 'player');
    expect(GS.effectQueue).toHaveLength(0);
  });

  test('llama triggerCardEffect cuando effectContext es "animating" (no es race condition)', () => {
    GS.effectContext = { type: 'animating' };
    const card = { nombre: 'Fuego 0', valor: 0, id: 'fuego0-1' };

    _triggerEffect(card, 'onPlay', 'player');

    expect(triggerCardEffectMock).toHaveBeenCalledWith(card, 'onPlay', 'player');
    expect(GS.effectQueue).toHaveLength(0);
  });

  test('encola trigger diferido cuando effectContext está activo (tipo eliminate)', () => {
    GS.effectContext = { type: 'eliminate', count: 1, selected: [] };
    const card = { nombre: 'Vida 0', valor: 0, id: 'vida0-1' };

    _triggerEffect(card, 'onPlay', 'player');

    // NO debe llamar triggerCardEffect directamente
    expect(triggerCardEffectMock).not.toHaveBeenCalled();

    // Debe encolar un item diferido
    expect(GS.effectQueue).toHaveLength(1);
    const item = GS.effectQueue[0];
    expect(item.effect.action).toBe('__deferredTrigger');
    expect(item.effect.card).toBe(card);
    expect(item.effect.trigger).toBe('onPlay');
    expect(item.targetPlayer).toBe('player');
    expect(item.cardName).toBe('Vida 0');

    // effectContext NO debe haber sido modificado
    expect(GS.effectContext.type).toBe('eliminate');
  });

  test('encola trigger diferido cuando effectContext está activo (tipo discard)', () => {
    GS.effectContext = { type: 'discard', count: 1, selected: [] };
    const card = { nombre: 'Metal 0', valor: 0, id: 'metal0-1' };

    _triggerEffect(card, 'onPlay', 'ai');

    expect(triggerCardEffectMock).not.toHaveBeenCalled();
    expect(GS.effectQueue[0].effect.action).toBe('__deferredTrigger');
    expect(GS.effectQueue[0].effect.card).toBe(card);
    expect(GS.effectQueue[0].targetPlayer).toBe('ai');
    expect(GS.effectContext.type).toBe('discard'); // contexto intacto
  });
});

describe('processAbilityEffect — procesa __deferredTrigger de la cola', () => {
  let GS;
  let triggerCardEffectMock;
  let routeAfterEffectsMock;

  beforeAll(() => {
    GS = freshGameState();
    triggerCardEffectMock = jest.fn();
    routeAfterEffectsMock = jest.fn();

    global.LINES = LINES_MOCK;
    global.gameState = GS;
    global.updateUI = jest.fn();
    global.updateStatus = jest.fn();
    global.logEvent = jest.fn();
    global.drawCard = jest.fn();
    global.draw = jest.fn();
    global.discard = jest.fn();
    global.startEffect = jest.fn();
    global.highlightSelectableLines = jest.fn();
    global.aiLowestValueCardIdx = jest.fn(() => 0);
    global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
    global.executeNewEffect = jest.fn();
    global.triggerCardEffect = triggerCardEffectMock;
    global.landPendingCard = jest.fn();
    global.document = { getElementById: jest.fn(() => null) };
    global.window = {};

    const engineCode = fs.readFileSync(
      path.join(__dirname, '../../src/abilities-engine.js'), 'utf8'
    );
    // eslint-disable-next-line no-new-func
    new Function(
      'LINES', 'gameState', 'updateUI', 'updateStatus', 'logEvent', 'drawCard', 'draw', 'discard',
      'startEffect', 'highlightSelectableLines', 'aiLowestValueCardIdx',
      'aiPickDestLine', 'executeNewEffect', 'triggerCardEffect', 'landPendingCard',
      'document', 'window',
      engineCode
    )(
      LINES_MOCK, GS, global.updateUI, global.updateStatus, global.logEvent,
      global.drawCard, global.draw, global.discard, global.startEffect,
      global.highlightSelectableLines, global.aiLowestValueCardIdx,
      global.aiPickDestLine, global.executeNewEffect, triggerCardEffectMock,
      global.landPendingCard, global.document, global.window
    );

    // processAbilityEffect and _routeAfterEffects exposed via window by the engine
    global.window._routeAfterEffects = routeAfterEffectsMock;
  });

  beforeEach(() => {
    triggerCardEffectMock.mockClear();
    routeAfterEffectsMock.mockClear();
    GS.effectContext = null;
    GS.effectQueue = [];
    GS.currentTriggerCard = null;
    GS.pendingLanding = null;
  });

  test('item __deferredTrigger es consumido de la cola y currentTriggerCard queda seteado', () => {
    const card = { nombre: 'Vida 0', valor: 0, id: 'vida0-test' };
    GS.effectQueue = [{
      effect: { action: '__deferredTrigger', card, trigger: 'onPlay' },
      targetPlayer: 'player',
      cardName: 'Vida 0',
    }];

    global.window.processAbilityEffect();

    // El item fue consumido — la cola quedó vacía (o con efectos de Vida 0, que no es lo que testamos)
    // Lo importante: currentTriggerCard se seteó al card name antes de procesar
    expect(GS.currentTriggerCard).toBe('Vida 0');
  });

  test('effectContext es null cuando el trigger diferido se procesa — no hay corrupción', () => {
    const card = { nombre: 'Vida 0', valor: 0, id: 'vida0-test2' };

    // Simular: eliminate estaba activo, trigger fue diferido
    // Ahora effectContext está libre (finishEffect ya corrió)
    GS.effectContext = null;
    GS.effectQueue = [{
      effect: { action: '__deferredTrigger', card, trigger: 'onPlay' },
      targetPlayer: 'player',
      cardName: 'Vida 0',
    }];

    // Antes de procesar, confirmar que el contexto está libre
    expect(GS.effectContext).toBeNull();

    global.window.processAbilityEffect();

    // currentTriggerCard seteado — el trigger se procesó
    expect(GS.currentTriggerCard).toBe('Vida 0');
  });
});
