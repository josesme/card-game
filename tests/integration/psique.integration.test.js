/**
 * Tests de integración — Psique
 *
 * Bug histórico: Psique 2 no mostraba la UI de reorganizar protocolos del rival.
 * Causa: startEffect('rearrange', 'ai') usaba isAIResolving=(target==='ai'), lo
 * cual invocaba resolveEffectAI directamente cuando el jugador jugaba la carta.
 * Fix: rearrange usa la lógica general (gameState.turn), no el target.
 *
 * Estos tests verifican que el abilities-engine despacha el efecto correcto.
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['alpha', 'beta', 'gamma'];

function makeCard(nombre, valor = 1) {
  return { nombre, valor, protocol: 'alpha', id: `${nombre}-${Math.random().toString(36).slice(2, 7)}` };
}

function makeEmptyField() {
  const field = {};
  LINES_MOCK.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return field;
}

function makeGameState() {
  return {
    player: { hand: [], deck: [], trash: [], protocols: ['alpha', 'beta', 'gamma'], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    ai:     { hand: [], deck: [], trash: [], protocols: ['alpha', 'beta', 'gamma'], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'player',
    currentEffectLine: 'alpha',
    _inOpponentDrawEffects: false,
    _inOpponentDiscardEffects: false,
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
  global.drawCard = (target) => {
    if (GS[target].deck.length > 0) { GS[target].hand.push(GS[target].deck.pop()); GS[target].drawnSinceLastCheck = true; return true; }
    return false;
  };
  global.draw = (target, count) => { for (let i = 0; i < count; i++) global.drawCard(target); };
  global.discard = (target, count) => {
    for (let i = 0; i < count; i++) {
      if (GS[target].hand.length > 0) { GS[target].trash.push(GS[target].hand.pop()); GS[target].discardedSinceLastCheck = true; }
    }
  };
  global.startEffect = jest.fn();
  global.highlightSelectableLines = jest.fn();
  global.aiLowestValueCardIdx = jest.fn(() => 0);
  global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect = jest.fn();
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};

  const engineCode = fs.readFileSync(path.join(__dirname, '../../src/abilities-engine.js'), 'utf8');
  // eslint-disable-next-line no-new-func
  new Function(
    'LINES', 'gameState', 'updateUI', 'updateStatus', 'drawCard', 'draw', 'discard',
    'startEffect', 'highlightSelectableLines', 'aiLowestValueCardIdx',
    'aiPickDestLine', 'executeNewEffect', 'document', 'window',
    engineCode
  )(
    global.LINES, global.gameState, global.updateUI, global.updateStatus,
    global.drawCard, global.draw, global.discard, global.startEffect,
    global.highlightSelectableLines, global.aiLowestValueCardIdx,
    global.aiPickDestLine, global.executeNewEffect, global.document, global.window
  );
  ENGINE = global.window;
}

function resetGS() {
  GS.player = { hand: [], deck: [], trash: [], protocols: ['alpha', 'beta', 'gamma'], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false };
  GS.ai     = { hand: [], deck: [], trash: [], protocols: ['alpha', 'beta', 'gamma'], drawnSinceLastCheck: false, discardedSinceLastCheck: false, drawnLastTurn: false, eliminatedSinceLastCheck: false, eliminatedLastTurn: false };
  GS.field = makeEmptyField();
  GS.effectQueue = [];
  GS.effectContext = null;
  GS.turn = 'player';
  GS.currentEffectLine = 'alpha';
}

beforeAll(() => loadEngine());
beforeEach(() => { resetGS(); jest.clearAllMocks(); });

// ─── Psique 2 — el jugador debe poder reorganizar protocolos del rival ────────

describe('Psique 2 — rearrange de protocolos del rival', () => {

  test('jugador juega Psique 2: startEffect recibe rearrange con target=ai', () => {
    // Dar 3 cartas al rival para que el discard no se salte
    GS.ai.hand = [makeCard('dummy1'), makeCard('dummy2'), makeCard('dummy3')];
    GS.turn = 'player';
    GS.currentEffectLine = 'alpha';

    const psique2 = makeCard('Psique 2', 2);
    ENGINE.triggerCardEffect(psique2, 'onPlay', 'player');

    // El discard de 2 cartas del rival debe haberse producido
    expect(GS.ai.trash.length).toBe(2);
    expect(GS.ai.hand.length).toBe(1);

    // El segundo efecto (rearrangeProtocols opponent) debe llamar a
    // startEffect con target='ai' — el jugador (no la IA) debe resolver el UI.
    // Este dispatch es el que startEffect recibe antes de decidir quién resuelve.
    expect(global.startEffect).toHaveBeenCalledWith('rearrange', 'ai', 1, expect.objectContaining({ owner: 'player' }));
  });

  test('IA juega Psique 2: primero pide al jugador descartar (startEffect discard)', () => {
    // Cuando la IA juega Psique 2, el jugador (human) debe elegir qué descartar.
    // El abilities-engine despacha startEffect('discard', 'player', 2) para eso.
    GS.player.hand = [makeCard('x1'), makeCard('x2'), makeCard('x3')];
    GS.turn = 'ai';
    GS.currentEffectLine = 'beta';

    const psique2 = makeCard('Psique 2', 2);
    ENGINE.triggerCardEffect(psique2, 'onPlay', 'ai');

    expect(global.startEffect).toHaveBeenCalledWith('discard', 'player', 2);
  });

});

// ─── Psique 4 — el jugador debe poder elegir qué carta del rival devolver ─────

describe('Psique 4 — mayReturnAndFlip: el jugador elige la carta a devolver', () => {

  test('jugador tiene Psique 4: al confirmar devolver, startEffect recibe return con owner=player', () => {
    // Bug histórico: startEffect('return','ai',1) sin owner → isAIResolving=true → IA elegía sola.
    // Fix: se pasa { owner: targetPlayer } para que el jugador activo resuelva la selección.
    // En test, mockear showConfirmDialog para que llame al onYes inmediatamente.
    global.showConfirmDialog = jest.fn((msg, onYes) => onYes());

    const psique4 = makeCard('Psique 4', 4);
    GS.field.alpha.player = [{ card: psique4, faceDown: false }];
    GS.turn = 'player';
    GS.currentEffectLine = 'alpha';

    ENGINE.onTurnEndEffects('player');
    ENGINE.processNextEndTrigger('player');

    // startEffect debe haberse llamado con return, target=ai, owner=player
    expect(global.startEffect).toHaveBeenCalledWith('return', 'ai', 1, expect.objectContaining({ owner: 'player' }));

    delete global.showConfirmDialog;
  });

});
