/**
 * Tests sistemáticos para las 37 cartas nuevas de Main 2
 * Cobertura: estructura CARD_EFFECTS, acciones directas (sin DOM), rutas IA, modificadores persistentes
 */

const fs = require('fs');
const path = require('path');

const LINES_MOCK = ['alpha', 'beta', 'gamma'];

function makeEmptyField() {
  const field = {};
  LINES_MOCK.forEach(l => { field[l] = { player: [], ai: [], compiledBy: null }; });
  return field;
}

function makeCard(nombre, valor = 1) {
  return { nombre, valor, id: `${nombre}-${Math.random()}` };
}

function makeGameState() {
  return {
    player: { hand: [], deck: [], trash: [] },
    ai: { hand: [], deck: [], trash: [] },
    field: makeEmptyField(),
    effectQueue: [],
    effectContext: null,
    turn: 'player',
    currentEffectLine: null,
    drawnSinceLastCheck: { player: false, ai: false },
    discardedSinceLastCheck: { player: false, ai: false },
    _inOpponentDrawEffects: false,
    _inOpponentDiscardEffects: false,
  };
}

// ─── Carga del motor ──────────────────────────────────────────────────────────
let ENGINE = null;
let GS = null;

function simpleScore(state, line, player) {
  return state.field[line][player].reduce((s, c) => s + (c.faceDown ? 2 : c.card.valor), 0);
}

function getEngine() {
  if (ENGINE) return ENGINE;

  GS = makeGameState();
  global.LINES = LINES_MOCK;
  global.gameState = GS;
  global.updateUI = jest.fn();
  global.updateStatus = jest.fn();
  global.calculateScore = jest.fn(simpleScore);
  global.drawCard = jest.fn(target => {
    if (GS[target].deck.length > 0) { GS[target].hand.push(GS[target].deck.pop()); return true; }
    return false;
  });
  global.draw = jest.fn((target, count) => {
    for (let i = 0; i < count; i++) global.drawCard(target);
    if (count > 0) GS.drawnSinceLastCheck[target] = true;
  });
  global.discard = jest.fn((target, count) => {
    let n = 0;
    for (let i = 0; i < count; i++) {
      if (GS[target].hand.length > 0) { GS[target].trash.push(GS[target].hand.pop()); n++; }
    }
    if (n > 0) GS.discardedSinceLastCheck[target] = true;
  });
  global.startEffect = jest.fn();
  global.highlightSelectableLines = jest.fn();
  global.highlightEffectTargets = jest.fn();
  global.aiLowestValueCardIdx = jest.fn(() => 0);
  global.aiPickDestLine = jest.fn(() => LINES_MOCK[1]);
  global.executeNewEffect = jest.fn();
  global.shuffleDiscardIntoDeck = jest.fn(target => {
    GS[target].deck.push(...GS[target].trash.splice(0));
  });
  global.document = { getElementById: jest.fn(() => null) };
  global.window = {};

  const engineCode = fs.readFileSync(
    path.join(__dirname, '../src/abilities-engine.js'), 'utf8'
  );
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'LINES', 'gameState', 'updateUI', 'updateStatus', 'drawCard', 'draw', 'discard',
    'startEffect', 'highlightSelectableLines', 'highlightEffectTargets', 'aiLowestValueCardIdx',
    'aiPickDestLine', 'executeNewEffect', 'shuffleDiscardIntoDeck', 'document', 'window', 'calculateScore',
    engineCode
  );
  fn(
    global.LINES, global.gameState, global.updateUI, global.updateStatus,
    global.drawCard, global.draw, global.discard, global.startEffect,
    global.highlightSelectableLines, global.highlightEffectTargets, global.aiLowestValueCardIdx,
    global.aiPickDestLine, global.executeNewEffect, global.shuffleDiscardIntoDeck,
    global.document, global.window, global.calculateScore
  );

  ENGINE = global.window;
  return ENGINE;
}

function resetGS() {
  GS.player = { hand: [], deck: [], trash: [] };
  GS.ai = { hand: [], deck: [], trash: [] };
  GS.field = makeEmptyField();
  GS.effectQueue = [];
  GS.effectContext = null;
  GS.turn = 'player';
  GS.currentEffectLine = null;
  GS._inOpponentDrawEffects = false;
  GS._inOpponentDiscardEffects = false;
}

beforeAll(() => getEngine());
beforeEach(() => {
  resetGS();
  jest.clearAllMocks();
  global.calculateScore.mockImplementation(simpleScore);
  global.processAbilityEffect = jest.fn();
});

// Helper: encola y ejecuta una acción directamente
function runAction(actionDef, targetPlayer = 'player', cardName = 'Test') {
  GS.effectQueue = [{ effect: actionDef, targetPlayer, cardName }];
  ENGINE.processAbilityEffect();
}

// ─── 1. CARD_EFFECTS: estructura de las 37 cartas nuevas ─────────────────────
describe('CARD_EFFECTS — Main 2 nuevas entradas', () => {

  describe('Asimilación', () => {
    test('Asim 0: onPlay=returnOpponentFaceDown', () => {
      const ef = ENGINE.CARD_EFFECTS['Asimilación 0'];
      expect(ef.onPlay[0].action).toBe('returnOpponentFaceDown');
    });
    test('Asim 2: onTurnEnd=playOpponentTopDeckHere', () => {
      const ef = ENGINE.CARD_EFFECTS['Asimilación 2'];
      expect(ef.onTurnEnd[0].action).toBe('playOpponentTopDeckHere');
    });
    test('Asim 4: onPlay=swapTopDeckCards', () => {
      const ef = ENGINE.CARD_EFFECTS['Asimilación 4'];
      expect(ef.onPlay[0].action).toBe('swapTopDeckCards');
    });
    test('Asim 6: onTurnEnd=playOwnTopDeckOpponentSide', () => {
      const ef = ENGINE.CARD_EFFECTS['Asimilación 6'];
      expect(ef.onTurnEnd[0].action).toBe('playOwnTopDeckOpponentSide');
    });
  });

  describe('Caos', () => {
    test('Caos 2: onPlay=shiftCovered target:self (obligatorio)', () => {
      const ef = ENGINE.CARD_EFFECTS['Caos 2'];
      expect(ef.onPlay[0].action).toBe('shiftCovered');
      expect(ef.onPlay[0].target).toBe('self');
    });
    test('Caos 3: sin efectos activos (solo regla de juego)', () => {
      const ef = ENGINE.CARD_EFFECTS['Caos 3'];
      expect(ef.onPlay).toBeUndefined();
    });
  });

  describe('Claridad', () => {
    test('Claridad 0: persistent.valueBonusPerHandCard=1', () => {
      const ef = ENGINE.CARD_EFFECTS['Claridad 0'];
      expect(ef.persistent.valueBonusPerHandCard).toBe(1);
    });
    test('Claridad 1: onTurnStart=revealTopDeckMayDiscard, onCover=draw 3', () => {
      const ef = ENGINE.CARD_EFFECTS['Claridad 1'];
      expect(ef.onTurnStart[0].action).toBe('revealTopDeckMayDiscard');
      expect(ef.onCover[0].action).toBe('draw');
      expect(ef.onCover[0].count).toBe(3);
    });
    test('Claridad 2: onPlay=searchDeckValue1ThenPlay', () => {
      expect(ENGINE.CARD_EFFECTS['Claridad 2'].onPlay[0].action).toBe('searchDeckValue1ThenPlay');
    });
    test('Claridad 3: onPlay=searchDeckByValue value:5', () => {
      const ef = ENGINE.CARD_EFFECTS['Claridad 3'];
      expect(ef.onPlay[0].action).toBe('searchDeckByValue');
      expect(ef.onPlay[0].value).toBe(5);
    });
  });

  describe('Corrupción', () => {
    test('Corrupción 0: onTurnStart=flipCoveredInOwnStack', () => {
      expect(ENGINE.CARD_EFFECTS['Corrupción 0'].onTurnStart[0].action).toBe('flipCoveredInOwnStack');
    });
    test('Corrupción 3: onPlay=mayFlipCoveredFaceUp', () => {
      expect(ENGINE.CARD_EFFECTS['Corrupción 3'].onPlay[0].action).toBe('mayFlipCoveredFaceUp');
    });
    test('Corrupción 6: onTurnEnd=optionalDiscardOrDeleteSelf', () => {
      expect(ENGINE.CARD_EFFECTS['Corrupción 6'].onTurnEnd[0].action).toBe('optionalDiscardOrDeleteSelf');
    });
  });

  describe('Valor', () => {
    test('Valor 0: onTurnStart=drawIfNoHand, onPlay=draw 1, onTurnEnd=optionalDiscardThenOpponentDiscard', () => {
      const ef = ENGINE.CARD_EFFECTS['Valor 0'];
      expect(ef.onTurnStart[0].action).toBe('drawIfNoHand');
      expect(ef.onPlay[0].action).toBe('draw');
      expect(ef.onTurnEnd[0].action).toBe('optionalDiscardThenOpponentDiscard');
    });
    test('Valor 1: onPlay=deleteInWinningOpponentLine', () => {
      expect(ENGINE.CARD_EFFECTS['Valor 1'].onPlay[0].action).toBe('deleteInWinningOpponentLine');
    });
    test('Valor 3: onTurnEnd=mayShiftSelfToHighestOpponentLine', () => {
      expect(ENGINE.CARD_EFFECTS['Valor 3'].onTurnEnd[0].action).toBe('mayShiftSelfToHighestOpponentLine');
    });
    test('Valor 6: onTurnEnd=flipSelfIfOpponentWins', () => {
      expect(ENGINE.CARD_EFFECTS['Valor 6'].onTurnEnd[0].action).toBe('flipSelfIfOpponentWins');
    });
  });

  describe('Diversidad', () => {
    test('Diversidad 0: onPlay=compileDiversityIfSixProtocols, onTurnEnd=playNonDiversityCard', () => {
      const ef = ENGINE.CARD_EFFECTS['Diversidad 0'];
      expect(ef.onPlay[0].action).toBe('compileDiversityIfSixProtocols');
      expect(ef.onTurnEnd[0].action).toBe('playNonDiversityCard');
    });
    test('Diversidad 1: onPlay=[shift any, drawPerDistinctProtocolsInLine]', () => {
      const ef = ENGINE.CARD_EFFECTS['Diversidad 1'];
      expect(ef.onPlay[0].action).toBe('shift');
      expect(ef.onPlay[1].action).toBe('drawPerDistinctProtocolsInLine');
    });
    test('Diversidad 3: persistent.valueBonusIfNonDiversityFaceUp=2', () => {
      expect(ENGINE.CARD_EFFECTS['Diversidad 3'].persistent.valueBonusIfNonDiversityFaceUp).toBe(2);
    });
    test('Diversidad 4: onPlay=flipCardBelowDistinctProtocolCount', () => {
      expect(ENGINE.CARD_EFFECTS['Diversidad 4'].onPlay[0].action).toBe('flipCardBelowDistinctProtocolCount');
    });
    test('Diversidad 6: onTurnEnd=deleteIfFewDistinctProtocols', () => {
      expect(ENGINE.CARD_EFFECTS['Diversidad 6'].onTurnEnd[0].action).toBe('deleteIfFewDistinctProtocols');
    });
  });

  describe('Miedo', () => {
    test('Miedo 0: persistent.disableOpponentMiddleCommands, onPlay=mayShiftOrFlip', () => {
      const ef = ENGINE.CARD_EFFECTS['Miedo 0'];
      expect(ef.persistent.disableOpponentMiddleCommands).toBe(true);
      expect(ef.onPlay[0].action).toBe('mayShiftOrFlip');
    });
    test('Miedo 1: onPlay=[draw 2, opponentDiscardAndRedraw minusN:1]', () => {
      const ef = ENGINE.CARD_EFFECTS['Miedo 1'];
      expect(ef.onPlay[0].action).toBe('draw');
      expect(ef.onPlay[0].count).toBe(2);
      expect(ef.onPlay[1].action).toBe('opponentDiscardAndRedraw');
    });
  });

  describe('Hielo', () => {
    test('Hielo 3: onTurnEnd=mayShiftSelfIfCovered', () => {
      expect(ENGINE.CARD_EFFECTS['Hielo 3'].onTurnEnd[0].action).toBe('mayShiftSelfIfCovered');
    });
    test('Hielo 4: persistent.preventFlip=true', () => {
      expect(ENGINE.CARD_EFFECTS['Hielo 4'].persistent.preventFlip).toBe(true);
    });
    test('Hielo 6: persistent.preventDraw=true', () => {
      expect(ENGINE.CARD_EFFECTS['Hielo 6'].persistent.preventDraw).toBe(true);
    });
  });

  describe('Suerte', () => {
    test('Suerte 0: onPlay=luckDraw3PickByValue', () => {
      expect(ENGINE.CARD_EFFECTS['Suerte 0'].onPlay[0].action).toBe('luckDraw3PickByValue');
    });
    test('Suerte 1: onPlay=luckPlayTopThenFlipNoEffect', () => {
      expect(ENGINE.CARD_EFFECTS['Suerte 1'].onPlay[0].action).toBe('luckPlayTopThenFlipNoEffect');
    });
    test('Suerte 2: onPlay=luckDiscardTopDraw', () => {
      expect(ENGINE.CARD_EFFECTS['Suerte 2'].onPlay[0].action).toBe('luckDiscardTopDraw');
    });
    test('Suerte 3: onPlay=luckCallProtocolDiscard', () => {
      expect(ENGINE.CARD_EFFECTS['Suerte 3'].onPlay[0].action).toBe('luckCallProtocolDiscard');
    });
    test('Suerte 4: onPlay=luckDiscardTopDeleteByValue', () => {
      expect(ENGINE.CARD_EFFECTS['Suerte 4'].onPlay[0].action).toBe('luckDiscardTopDeleteByValue');
    });
  });

  describe('Espejo', () => {
    test('Espejo 0: persistent.valueBonusPerOpponentCard=1', () => {
      expect(ENGINE.CARD_EFFECTS['Espejo 0'].persistent.valueBonusPerOpponentCard).toBe(1);
    });
    test('Espejo 1: onTurnEnd=copyOpponentCardEffect', () => {
      expect(ENGINE.CARD_EFFECTS['Espejo 1'].onTurnEnd[0].action).toBe('copyOpponentCardEffect');
    });
    test('Espejo 2: onPlay=swapOwnTwoStacks', () => {
      expect(ENGINE.CARD_EFFECTS['Espejo 2'].onPlay[0].action).toBe('swapOwnTwoStacks');
    });
    test('Espejo 3: onPlay=[flip self, flipOpponentSameLine]', () => {
      const ef = ENGINE.CARD_EFFECTS['Espejo 3'];
      expect(ef.onPlay[0].action).toBe('flip');
      expect(ef.onPlay[1].action).toBe('flipOpponentSameLine');
    });
  });

  describe('Paz', () => {
    test('Paz 1: onPlay=[discardHand self, discardHand opponent], onTurnEnd=drawIfEmptyHand', () => {
      const ef = ENGINE.CARD_EFFECTS['Paz 1'];
      expect(ef.onPlay[0].action).toBe('discardHand');
      expect(ef.onPlay[0].target).toBe('self');
      expect(ef.onPlay[1].target).toBe('opponent');
      expect(ef.onTurnEnd[0].action).toBe('drawIfEmptyHand');
    });
    test('Paz 3: onPlay=optionalDiscardThenFlipHighValue', () => {
      expect(ENGINE.CARD_EFFECTS['Paz 3'].onPlay[0].action).toBe('optionalDiscardThenFlipHighValue');
    });
    test('Paz 6: onPlay=flipSelfIfMultipleHandCards', () => {
      expect(ENGINE.CARD_EFFECTS['Paz 6'].onPlay[0].action).toBe('flipSelfIfMultipleHandCards');
    });
  });

  describe('Humo', () => {
    test('Humo 0: onPlay=playTopDeckInFaceDownLines (target self)', () => {
      const ef = ENGINE.CARD_EFFECTS['Humo 0'];
      expect(ef.onPlay[0].action).toBe('playTopDeckInFaceDownLines');
      expect(ef.onPlay[0].target).toBe('self');
    });
    test('Humo 1: onPlay=[flip self 1, mayShiftSelf]', () => {
      const ef = ENGINE.CARD_EFFECTS['Humo 1'];
      expect(ef.onPlay[0].action).toBe('flip');
      expect(ef.onPlay[1].action).toBe('mayShiftLastFlipped');
    });
    test('Humo 2: persistent.valueBonusPerFaceDown=1', () => {
      expect(ENGINE.CARD_EFFECTS['Humo 2'].persistent.valueBonusPerFaceDown).toBe(1);
    });
    test('Humo 4: onPlay=shiftCoveredFaceDown', () => {
      expect(ENGINE.CARD_EFFECTS['Humo 4'].onPlay[0].action).toBe('shiftCoveredFaceDown');
    });
  });

  describe('Tiempo', () => {
    test('Tiempo 0: onPlay=playFromDiscardThenShuffle', () => {
      expect(ENGINE.CARD_EFFECTS['Tiempo 0'].onPlay[0].action).toBe('playFromDiscardThenShuffle');
    });
    test('Tiempo 1: onPlay=[flip coveredOnly, discardOwnDeck] (obligatorio)', () => {
      const ef = ENGINE.CARD_EFFECTS['Tiempo 1'];
      expect(ef.onPlay[0].action).toBe('flip');
      expect(ef.onPlay[0].coveredOnly).toBe(true);
      expect(ef.onPlay[1].action).toBe('discardOwnDeck');
    });
    test('Tiempo 3: onPlay=playFromDiscardFaceDownOtherLine', () => {
      expect(ENGINE.CARD_EFFECTS['Tiempo 3'].onPlay[0].action).toBe('playFromDiscardFaceDownOtherLine');
    });
  });

  describe('Unidad', () => {
    test('Unidad 0: onPlay=mayFlipOrDrawIfUnityOnField', () => {
      expect(ENGINE.CARD_EFFECTS['Unidad 0'].onPlay[0].action).toBe('mayFlipOrDrawIfUnityOnField');
    });
    test('Unidad 1: onTurnStart=mayShiftSelfIfCovered, onPlay=compileSelfIfFiveOrMoreUnity', () => {
      const ef = ENGINE.CARD_EFFECTS['Unidad 1'];
      expect(ef.onTurnStart[0].action).toBe('mayShiftSelfIfCovered');
      expect(ef.onPlay[0].action).toBe('compileSelfIfFiveOrMoreUnity');
    });
    test('Unidad 2: onPlay=drawPerUnityCards', () => {
      expect(ENGINE.CARD_EFFECTS['Unidad 2'].onPlay[0].action).toBe('drawPerUnityCards');
    });
    test('Unidad 3: onPlay=mayFlipIfUnityOnField', () => {
      expect(ENGINE.CARD_EFFECTS['Unidad 3'].onPlay[0].action).toBe('mayFlipIfUnityOnField');
    });
    test('Unidad 4: onTurnEnd=drawUnityFromDeckIfEmptyHand', () => {
      expect(ENGINE.CARD_EFFECTS['Unidad 4'].onTurnEnd[0].action).toBe('drawUnityFromDeckIfEmptyHand');
    });
  });
});

// ─── 2. Acciones directas (sin DOM) ──────────────────────────────────────────
describe('Acciones directas Main 2', () => {

  test('drawIfNoHand: roba 1 cuando mano vacía', () => {
    GS.player.deck = [makeCard('D1')];
    GS.player.hand = [];
    runAction({ action: 'drawIfNoHand' }, 'player');
    expect(global.draw).toHaveBeenCalledWith('player', 1);
  });

  test('drawIfNoHand: no roba si ya tiene cartas', () => {
    GS.player.hand = [makeCard('H1')];
    runAction({ action: 'drawIfNoHand' }, 'player');
    expect(global.draw).not.toHaveBeenCalled();
  });

  test('drawIfEmptyHand: roba cuando mano vacía', () => {
    GS.player.deck = [makeCard('D1'), makeCard('D2')];
    GS.player.hand = [];
    runAction({ action: 'drawIfEmptyHand' }, 'player');
    expect(global.draw).toHaveBeenCalledWith('player', 1);
  });

  test('drawIfEmptyHand: no roba si tiene mano', () => {
    GS.player.hand = [makeCard('H1')];
    runAction({ action: 'drawIfEmptyHand' }, 'player');
    expect(global.draw).not.toHaveBeenCalled();
  });

  test('opponentDiscardAndRedraw: rival descarta 3 y roba 2 (minusN=1)', () => {
    GS.ai.hand = [makeCard('A'), makeCard('B'), makeCard('C')];
    GS.ai.deck = [makeCard('D1'), makeCard('D2'), makeCard('D3')];
    runAction({ action: 'opponentDiscardAndRedraw', minusN: 1 }, 'player');
    expect(GS.ai.trash).toHaveLength(3);
    expect(global.draw).toHaveBeenCalledWith('ai', 2);
  });

  test('opponentDiscardAndRedraw: rival con 1 carta y minusN=1 → no roba (toDraw=0)', () => {
    GS.ai.hand = [makeCard('A')];
    GS.ai.deck = [makeCard('D1')];
    runAction({ action: 'opponentDiscardAndRedraw', minusN: 1 }, 'player');
    expect(GS.ai.trash).toHaveLength(1);
    expect(global.draw).not.toHaveBeenCalled(); // toDraw=0 → no se llama draw
  });

  test('opponentDiscardAndRedraw: rival con mano vacía no hace nada', () => {
    GS.ai.hand = [];
    runAction({ action: 'opponentDiscardAndRedraw', minusN: 1 }, 'player');
    expect(global.draw).not.toHaveBeenCalled();
  });

  test('flipCoveredInOwnStack: voltea la única carta bocarriba que no sea Corrupción 0 (auto)', () => {
    // Corrupción 0 + 1 otra carta bocarriba → auto-voltea la otra
    const corr0 = { card: makeCard('Corrupción 0', 0), faceDown: false };
    const other = { card: makeCard('Under', 3), faceDown: false };
    GS.field['alpha'].player = [corr0, other];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'flipCoveredInOwnStack' }, 'player');
    expect(GS.field['alpha'].player[1].faceDown).toBe(true);   // Under volteada
    expect(GS.field['alpha'].player[0].faceDown).toBe(false);   // Corrupción 0 intacta
  });

  test('flipCoveredInOwnStack: no hace nada si todas las cartas (excepto Corrupción 0) están bocabajo', () => {
    const corr0 = { card: makeCard('Corrupción 0', 0), faceDown: false };
    const covered = { card: makeCard('Under'), faceDown: true }; // bocabajo → se ignora
    GS.field['alpha'].player = [covered, corr0];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'flipCoveredInOwnStack' }, 'player');
    expect(GS.field['alpha'].player[0].faceDown).toBe(true);  // sin cambio
    expect(GS.field['alpha'].player[1].faceDown).toBe(false); // Corrupción 0 intacta
  });

  test('flipCoveredInOwnStack: no hace nada si solo hay 1 carta', () => {
    const solo = { card: makeCard('Solo'), faceDown: true };
    GS.field['alpha'].player = [solo];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'flipCoveredInOwnStack' }, 'player');
    expect(GS.field['alpha'].player[0].faceDown).toBe(true); // sin cambio
  });

  test('flipCoveredInOwnStack: no hace nada sin línea activa', () => {
    GS.currentEffectLine = null;
    runAction({ action: 'flipCoveredInOwnStack' }, 'player');
    // no lanza excepción y processAbilityEffect continúa
  });

  test('flipSelfIfOpponentWins (IA): voltea carta propia cuando pierde la línea', () => {
    const valor6 = { card: makeCard('Valor 6', 1), faceDown: false };
    GS.field['alpha'].ai = [valor6];
    GS.field['alpha'].player = [{ card: makeCard('Fuerte', 5), faceDown: false }];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'flipSelfIfOpponentWins', triggerCard: 'Valor 6' }, 'ai', 'Valor 6');
    expect(GS.field['alpha'].ai[0].faceDown).toBe(true);
  });

  test('flipSelfIfOpponentWins (IA): no voltea si la IA gana la línea', () => {
    const valor6 = { card: makeCard('Valor 6', 5), faceDown: false };
    GS.field['alpha'].ai = [valor6];
    GS.field['alpha'].player = [{ card: makeCard('Débil', 1), faceDown: false }];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'flipSelfIfOpponentWins', triggerCard: 'Valor 6' }, 'ai', 'Valor 6');
    expect(GS.field['alpha'].ai[0].faceDown).toBe(false);
  });

  test('flipSelfIfMultipleHandCards: voltea top si tiene más de 1 carta', () => {
    const top = { card: makeCard('Paz 6', 2), faceDown: false };
    GS.field['alpha'].player = [top];
    GS.player.hand = [makeCard('H1'), makeCard('H2')];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'flipSelfIfMultipleHandCards' }, 'player');
    expect(GS.field['alpha'].player[0].faceDown).toBe(true);
  });

  test('flipSelfIfMultipleHandCards: no voltea si solo 1 carta en mano', () => {
    const top = { card: makeCard('Paz 6', 2), faceDown: false };
    GS.field['alpha'].player = [top];
    GS.player.hand = [makeCard('H1')];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'flipSelfIfMultipleHandCards' }, 'player');
    expect(GS.field['alpha'].player[0].faceDown).toBe(false);
  });

  test('flipOpponentSameLine (IA): voltea top del oponente en la línea actual', () => {
    const playerCard = { card: makeCard('PlayerCard', 3), faceDown: false };
    GS.field['beta'].player = [playerCard];
    GS.currentEffectLine = 'beta';
    runAction({ action: 'flipOpponentSameLine' }, 'ai');
    expect(GS.field['beta'].player[0].faceDown).toBe(true);
  });

  test('flipOpponentSameLine (player): llama a startEffect flip ai (resuelto, no literal)', () => {
    GS.field['beta'].ai = [{ card: makeCard('AC', 3), faceDown: false }];
    GS.currentEffectLine = 'beta';
    runAction({ action: 'flipOpponentSameLine' }, 'player');
    expect(global.startEffect).toHaveBeenCalledWith('flip', 'ai', 1, expect.anything());
  });

  test('flipOpponentSameLine (player): sin cartas rival en línea → omite efecto', () => {
    GS.field['beta'].ai = [];
    GS.currentEffectLine = 'beta';
    runAction({ action: 'flipOpponentSameLine' }, 'player');
    expect(global.startEffect).not.toHaveBeenCalled();
  });

  test('discardOwnDeck: mueve todas las cartas del mazo al descarte', () => {
    GS.player.deck = [makeCard('D1'), makeCard('D2'), makeCard('D3')];
    runAction({ action: 'discardOwnDeck' }, 'player');
    expect(GS.player.deck).toHaveLength(0);
    expect(GS.player.trash).toHaveLength(3);
  });

  test('discardOwnDeck: no hace nada si el mazo está vacío', () => {
    GS.player.deck = [];
    runAction({ action: 'discardOwnDeck' }, 'player');
    expect(GS.player.trash).toHaveLength(0);
  });

  test('swapOwnTwoStacks (IA): intercambia la peor pila IA con la mejor', () => {
    // alpha: IA(1) vs jugador(5) → diff=-4 (peor para IA)
    // beta: IA(5) vs jugador(1) → diff=4 (mejor para IA)
    const weakCard = { card: makeCard('Débil', 1), faceDown: false };
    const strongCard = { card: makeCard('Fuerte', 5), faceDown: false };
    GS.field['alpha'].ai = [weakCard];
    GS.field['alpha'].player = [{ card: makeCard('JFuerte', 5), faceDown: false }];
    GS.field['beta'].ai = [strongCard];
    GS.field['beta'].player = [{ card: makeCard('JDébil', 1), faceDown: false }];
    runAction({ action: 'swapOwnTwoStacks' }, 'ai');
    // La peor pila IA (alpha, diff=-4) se intercambia con la mejor (beta, diff=4)
    expect(GS.field['alpha'].ai).toContain(strongCard);
    expect(GS.field['beta'].ai).toContain(weakCard);
  });

  test('deleteInWinningOpponentLine (IA): elimina carta del jugador en línea donde jugador gana', () => {
    // Para IA (targetPlayer=ai, opponent=player): winLines = líneas donde jugador(opponent) > IA
    // El jugador tiene 5 pts, IA tiene 1 → jugador gana → IA elimina carta del jugador
    GS.field['alpha'].player = [{ card: makeCard('PlayerStrong', 5), faceDown: false }];
    const aiCard = { card: makeCard('AICard', 1), faceDown: false };
    GS.field['alpha'].ai = [aiCard];
    // Añadir una carta del jugador para eliminar
    const playerTarget = { card: makeCard('PlayerTarget', 3), faceDown: false };
    GS.field['alpha'].player.push(playerTarget);
    runAction({ action: 'deleteInWinningOpponentLine' }, 'ai');
    // La IA debería haber eliminado la top de la pila del jugador en alpha
    expect(GS.player.trash).toHaveLength(1);
  });

  test('deleteInWinningOpponentLine (IA): no hace nada si jugador no gana ninguna línea', () => {
    // IA gana alpha (5 > 1) → jugador no gana → winLines vacío
    GS.field['alpha'].ai = [{ card: makeCard('AIStrong', 5), faceDown: false }];
    GS.field['alpha'].player = [{ card: makeCard('PlayerWeak', 1), faceDown: false }];
    runAction({ action: 'deleteInWinningOpponentLine' }, 'ai');
    expect(GS.field['alpha'].player).toHaveLength(1); // sin cambios
  });

  test('deleteInWinningOpponentLine (player): llama a startEffect eliminate opponent', () => {
    GS.field['alpha'].ai = [{ card: makeCard('AIStrong', 5), faceDown: false }];
    GS.field['alpha'].player = [{ card: makeCard('Weak', 1), faceDown: false }];
    runAction({ action: 'deleteInWinningOpponentLine' }, 'player');
    expect(global.startEffect).toHaveBeenCalledWith('eliminate', 'opponent', 1, { allowedLines: ['alpha'] });
  });
});

// ─── 3. Modificadores de valor persistentes ───────────────────────────────────
describe('Modificadores persistentes — calculateScoreWithModifiers', () => {

  test('Claridad 0: +1 por carta en mano del jugador', () => {
    const claridad0 = { card: makeCard('Claridad 0', 1), faceDown: false };
    GS.field['alpha'].player = [claridad0];
    GS.player.hand = [makeCard('H1'), makeCard('H2'), makeCard('H3')];
    const score = ENGINE.calculateScoreWithModifiers(GS, 'alpha', 'player');
    // Base: 1 (Claridad valor) + 3 (hand bonus) = 4
    expect(score).toBe(4);
  });

  test('Claridad 0: sin cartas en mano → sin bonus', () => {
    const claridad0 = { card: makeCard('Claridad 0', 1), faceDown: false };
    GS.field['alpha'].player = [claridad0];
    GS.player.hand = [];
    const score = ENGINE.calculateScoreWithModifiers(GS, 'alpha', 'player');
    expect(score).toBe(1);
  });

  test('Humo 0: juega en líneas con bocabajo propio y rival', () => {
    // Resetear estado usando el mismo objeto GS (el motor tiene su referencia)
    LINES_MOCK.forEach(l => { GS.field[l] = { player: [], ai: [], compiledBy: null }; });
    GS.player.hand = []; GS.player.deck = []; GS.player.trash = [];
    GS.ai.hand = []; GS.ai.deck = []; GS.ai.trash = [];
    GS.effectQueue = []; GS.effectContext = null;
    // alpha: carta bocabajo del player
    GS.field['alpha'].player = [{ card: makeCard('A', 1), faceDown: true }];
    // beta: carta bocabajo del rival (ai)
    GS.field['beta'].ai = [{ card: makeCard('B', 1), faceDown: true }];
    // gamma: sin bocabajo — no debe jugar aquí
    GS.field['gamma'].player = [{ card: makeCard('C', 1), faceDown: false }];
    // Mazo del player con 2 cartas
    GS.player.deck = [makeCard('D1', 1), makeCard('D2', 1)];
    GS.effectQueue = [{ effect: { action: 'playTopDeckInFaceDownLines', target: 'self' }, targetPlayer: 'player' }];
    ENGINE.processAbilityEffect();
    // Debe haber jugado en alpha y beta (1 carta nueva en cada una del player)
    expect(GS.field['alpha'].player.length).toBe(2); // la bocabajo original + la nueva
    expect(GS.field['beta'].player.length).toBe(1);  // nueva carta del player
    expect(GS.field['gamma'].player.length).toBe(1); // sin cambio
    expect(GS.player.deck.length).toBe(0);
  });

  test('Humo 2: +1 por carta bocabajo en la línea', () => {
    const humo2 = { card: makeCard('Humo 2', 2), faceDown: false };
    const fdCard1 = { card: makeCard('FD1', 1), faceDown: true };
    const fdCard2 = { card: makeCard('FD2', 1), faceDown: true };
    GS.field['beta'].player = [humo2];
    GS.field['beta'].ai = [fdCard1, fdCard2]; // 2 bocabajo en beta
    const score = ENGINE.calculateScoreWithModifiers(GS, 'beta', 'player');
    // Base: 2 (Humo valor) + 2 (facedown bonus) = 4
    expect(score).toBe(4);
  });

  test('Espejo 0: +1 por carta del oponente en la línea', () => {
    const espejo0 = { card: makeCard('Espejo 0', 0), faceDown: false };
    GS.field['alpha'].player = [espejo0];
    GS.field['alpha'].ai = [
      { card: makeCard('AI1', 1), faceDown: false },
      { card: makeCard('AI2', 1), faceDown: false },
    ];
    const score = ENGINE.calculateScoreWithModifiers(GS, 'alpha', 'player');
    // Base: 0 + 2 (opponent cards bonus) = 2
    expect(score).toBe(2);
  });

  test('Diversidad 3: +2 si hay carta no-Diversidad bocarriba en la misma pila', () => {
    const div3 = { card: makeCard('Diversidad 3', 3), faceDown: false };
    const agua = { card: makeCard('Agua 1', 1), faceDown: false };
    GS.field['gamma'].player = [div3, agua]; // agua es no-Diversidad, bocarriba
    const score = ENGINE.calculateScoreWithModifiers(GS, 'gamma', 'player');
    // Base: 3 + 1 + 2 (nonDiversity bonus) = 6
    expect(score).toBe(6);
  });

  test('Diversidad 3: sin bonus si todas las cartas son Diversidad', () => {
    const div3 = { card: makeCard('Diversidad 3', 3), faceDown: false };
    const div1 = { card: makeCard('Diversidad 1', 1), faceDown: false };
    GS.field['gamma'].player = [div3, div1];
    const score = ENGINE.calculateScoreWithModifiers(GS, 'gamma', 'player');
    // Base: 3 + 1 = 4, sin bonus
    expect(score).toBe(4);
  });

  test('Diversidad 3: sin bonus si la carta no-Diversidad está bocabajo', () => {
    const div3 = { card: makeCard('Diversidad 3', 3), faceDown: false };
    const fdAgua = { card: makeCard('Agua 1', 1), faceDown: true }; // bocabajo
    GS.field['gamma'].player = [fdAgua, div3];
    const score = ENGINE.calculateScoreWithModifiers(GS, 'gamma', 'player');
    // Base: 2 (bocabajo=2) + 3 = 5, sin bonus (la no-Diversidad está bocabajo)
    expect(score).toBe(5);
  });

  test('bonus persistente se aplica aunque la carta esté cubierta (no es top)', () => {
    // Claridad 0 cubierta por otra carta → aún da bonus
    const claridad0 = { card: makeCard('Claridad 0', 1), faceDown: false };
    const topCard = { card: makeCard('TopCard', 2), faceDown: false };
    GS.field['alpha'].player = [claridad0, topCard]; // claridad está cubierta
    GS.player.hand = [makeCard('H1'), makeCard('H2')];
    const score = ENGINE.calculateScoreWithModifiers(GS, 'alpha', 'player');
    // Base: 1 (Claridad) + 2 (Top) + 2 (hand bonus para Claridad 0) = 5
    expect(score).toBe(5);
  });

  test('carta bocabajo no activa bonus persistente', () => {
    const claridad0fd = { card: makeCard('Claridad 0', 1), faceDown: true }; // bocabajo
    GS.field['alpha'].player = [claridad0fd];
    GS.player.hand = [makeCard('H1'), makeCard('H2'), makeCard('H3')];
    const score = ENGINE.calculateScoreWithModifiers(GS, 'alpha', 'player');
    // Bocabajo vale 2, sin bonus (la carta está bocabajo)
    expect(score).toBe(2);
  });
});

// ─── 4. Rutas IA — acciones con lógica automática ────────────────────────────
describe('Rutas IA — acciones auto-resueltas', () => {

  test('optionalDiscardThenOpponentDiscard (IA): descarta 1 si tiene >3 cartas, y el jugador también descarta 1', () => {
    GS.ai.hand = [makeCard('A'), makeCard('B'), makeCard('C'), makeCard('D')]; // 4 cartas
    GS.player.hand = [makeCard('X'), makeCard('Y')];
    runAction({ action: 'optionalDiscardThenOpponentDiscard' }, 'ai');
    expect(global.discard).toHaveBeenCalledWith('ai', 1);
    expect(global.discard).toHaveBeenCalledWith('player', 1);
  });

  test('optionalDiscardThenOpponentDiscard (IA): no descarta si tiene ≤3 cartas', () => {
    GS.ai.hand = [makeCard('A'), makeCard('B')];
    runAction({ action: 'optionalDiscardThenOpponentDiscard' }, 'ai');
    expect(global.discard).not.toHaveBeenCalled();
  });

  test('optionalDiscardOrDeleteSelf (IA): descarta 1 si tiene mano', () => {
    GS.ai.hand = [makeCard('A')];
    runAction({ action: 'optionalDiscardOrDeleteSelf' }, 'ai', 'Corrupción 6');
    expect(global.discard).toHaveBeenCalledWith('ai', 1);
    expect(GS.effectQueue).toHaveLength(0); // no encola _deleteSelf
  });

  test('optionalDiscardOrDeleteSelf (IA): no descarta si mano vacía (intenta eliminar carta)', () => {
    GS.ai.hand = [];
    runAction({ action: 'optionalDiscardOrDeleteSelf' }, 'ai', 'Corrupción 6');
    // discard no debe llamarse cuando mano vacía
    expect(global.discard).not.toHaveBeenCalled();
  });

  test('playOpponentTopDeckHere (IA): toma del mazo del jugador y lo coloca en el lado de IA en alpha', () => {
    // Para IA (targetPlayer=ai, opponent=player): toma del mazo rival (player) y lo pone en field[line][ai]
    // "esta pila" = la pila del targetPlayer (IA), no la del oponente
    const playerTop = makeCard('PlayerDeckTop', 3);
    GS.player.deck = [playerTop];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'playOpponentTopDeckHere' }, 'ai');
    expect(GS.player.deck).toHaveLength(0);
    expect(GS.field['alpha'].ai.some(c => c.card === playerTop && c.faceDown)).toBe(true);
  });

  test('playOpponentTopDeckHere (IA): no hace nada si mazo del oponente vacío', () => {
    GS.player.deck = [];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'playOpponentTopDeckHere' }, 'ai');
    expect(GS.field['alpha'].ai).toHaveLength(0);
  });

  test('playFromDiscardThenShuffle (IA): juega la carta de mayor valor del descarte', () => {
    const best = makeCard('BestCard', 5);
    const weak = makeCard('WeakCard', 1);
    GS.ai.trash = [weak, best];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'playFromDiscardThenShuffle' }, 'ai');
    expect(GS.field['alpha'].ai.some(c => c.card === best)).toBe(true);
    expect(GS.ai.trash).not.toContain(best);
  });

  test('playFromDiscardThenShuffle (IA): juega mejor carta y baraja el resto en el mazo', () => {
    const best = makeCard('BestCard2', 5);
    const rest = makeCard('Resto', 1);
    GS.ai.trash = [rest, best]; // best es idx 1 (mayor valor)
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'playFromDiscardThenShuffle' }, 'ai');
    // La mejor carta fue a campo
    expect(GS.field['alpha'].ai.some(c => c.card === best)).toBe(true);
    // La carta restante fue al mazo (shuffleDiscardIntoDeck interno)
    expect(GS.ai.deck).toContain(rest);
    expect(GS.ai.trash).toHaveLength(0);
  });

  test('playFromDiscardThenShuffle: no hace nada si descarte vacío', () => {
    GS.ai.trash = [];
    runAction({ action: 'playFromDiscardThenShuffle' }, 'ai');
    expect(GS.field['alpha'].ai).toHaveLength(0);
  });
});

// ── Miedo 0: disableOpponentMiddleCommands solo durante turno del dueño ──────
describe('Miedo 0 — bloqueo onPlay por turno', () => {
  function resetGS() {
    LINES_MOCK.forEach(l => { GS.field[l] = { player: [], ai: [], compiledBy: null }; });
    GS.player.hand = []; GS.player.deck = []; GS.player.trash = [];
    GS.ai.hand = []; GS.ai.deck = []; GS.ai.trash = [];
    GS.effectQueue = [];
    GS.effectContext = null;
    GS.currentEffectLine = null;
  }

  test('bloquea onPlay del rival cuando es turno del dueño de Miedo 0', () => {
    resetGS();
    // AI tiene Miedo 0 bocarriba en alpha
    GS.field['alpha'].ai = [{ card: makeCard('Miedo 0', 0), faceDown: false }];
    // Es turno de AI (dueño de Miedo 0) → onPlay del player debe bloquearse
    GS.turn = 'ai';
    const testCard = makeCard('Fuego 2', 2);
    // triggerCardEffect con trigger=onPlay para player — debe ser bloqueado (return sin encolar)
    const queueBefore = GS.effectQueue.length;
    ENGINE.triggerCardEffect(testCard, 'onPlay', 'player');
    // No debería haber encolado nada (Fuego 2 ni siquiera tiene efecto, pero el return se produce antes)
    expect(GS.effectQueue.length).toBe(queueBefore);
  });

  test('NO bloquea onPlay del rival cuando NO es turno del dueño de Miedo 0', () => {
    resetGS();
    // AI tiene Miedo 0 bocarriba
    GS.field['alpha'].ai = [{ card: makeCard('Miedo 0', 0), faceDown: false }];
    // Es turno de Player (NO es turno del dueño de Miedo 0) → onPlay del player NO debe bloquearse
    GS.turn = 'player';
    // Usamos una carta con efecto real para verificar que SÍ se procesa
    GS.player.deck = [makeCard('X', 1)];
    const testCard = makeCard('Valor 2', 2);
    ENGINE.triggerCardEffect(testCard, 'onPlay', 'player');
    // Valor 2 tiene onPlay: draw 1 → debería haber encolado y procesado
    expect(GS.player.hand.length).toBe(1);
  });

  test('NO bloquea onPlay del propio dueño de Miedo 0', () => {
    resetGS();
    // Player tiene Miedo 0 bocarriba
    GS.field['alpha'].player = [{ card: makeCard('Miedo 0', 0), faceDown: false }];
    // Es turno de Player (dueño) → onPlay del AI debería bloquearse, pero onPlay del player NO
    GS.turn = 'player';
    GS.player.deck = [makeCard('Y', 1)];
    const testCard = makeCard('Valor 2', 2);
    ENGINE.triggerCardEffect(testCard, 'onPlay', 'player');
    // Player juega su propia carta — no debe bloquearse
    expect(GS.player.hand.length).toBe(1);
  });
});

// ── Corrupción 0: flipCoveredInOwnStack incluye cartas cubiertas y descubiertas ──
describe('Corrupción 0 — flipCoveredInOwnStack', () => {
  function resetGS() {
    LINES_MOCK.forEach(l => { GS.field[l] = { player: [], ai: [], compiledBy: null }; });
    GS.player.hand = []; GS.player.deck = []; GS.player.trash = [];
    GS.ai.hand = []; GS.ai.deck = []; GS.ai.trash = [];
    GS.effectQueue = [];
    GS.effectContext = null;
    GS.currentEffectLine = null;
  }

  function runAction(effect, target) {
    GS.effectQueue = [{ effect, targetPlayer: target, cardName: 'Corrupción 0' }];
    GS.currentTriggerCard = 'Corrupción 0';
    ENGINE.processAbilityEffect();
  }

  test('IA voltea la carta top (descubierta) si es la única bocarriba aparte de Corrupción 0', () => {
    resetGS();
    // Pila: Corrupción 0 (cubierta, bocarriba) + OtraCard (top, bocarriba)
    GS.field['alpha'].ai = [
      { card: makeCard('Corrupción 0', 0), faceDown: false },
      { card: makeCard('Fuego 2', 2), faceDown: false }
    ];
    GS.currentEffectLine = 'alpha';
    runAction({ action: 'flipCoveredInOwnStack' }, 'ai');
    // Fuego 2 (top) debe haberse volteado bocabajo
    expect(GS.field['alpha'].ai[1].faceDown).toBe(true);
    // Corrupción 0 no se toca
    expect(GS.field['alpha'].ai[0].faceDown).toBe(false);
  });

  test('IA elige la carta de mayor valor entre cubiertas y descubiertas', () => {
    resetGS();
    // Pila: Carta1 (valor 1, cubierta) + Corrupción 0 (cubierta) + Carta5 (top, valor 5)
    GS.field['beta'].ai = [
      { card: makeCard('Agua 1', 1), faceDown: false },
      { card: makeCard('Corrupción 0', 0), faceDown: false },
      { card: makeCard('Fuego 5', 5), faceDown: false }
    ];
    GS.currentEffectLine = 'beta';
    runAction({ action: 'flipCoveredInOwnStack' }, 'ai');
    // IA debería voltear Fuego 5 (mayor valor)
    expect(GS.field['beta'].ai[2].faceDown).toBe(true);
    // Las demás no se tocan
    expect(GS.field['beta'].ai[0].faceDown).toBe(false);
    expect(GS.field['beta'].ai[1].faceDown).toBe(false);
  });

  test('no voltea cartas ya bocabajo ni a Corrupción 0 misma', () => {
    resetGS();
    // Solo Corrupción 0 bocarriba + 1 carta bocabajo → no hay objetivo válido
    GS.field['gamma'].ai = [
      { card: makeCard('Corrupción 0', 0), faceDown: false },
      { card: makeCard('Agua 2', 2), faceDown: true }
    ];
    GS.currentEffectLine = 'gamma';
    runAction({ action: 'flipCoveredInOwnStack' }, 'ai');
    // Nada cambia
    expect(GS.field['gamma'].ai[0].faceDown).toBe(false);
    expect(GS.field['gamma'].ai[1].faceDown).toBe(true);
  });
});

// ── mayShiftSelf: genérico (no hardcodeado a Espíritu 3) ─────────────────────
describe('mayShiftSelf — genérico para cualquier carta', () => {
  function resetGS() {
    LINES_MOCK.forEach(l => { GS.field[l] = { player: [], ai: [], compiledBy: null }; });
    GS.player.hand = []; GS.player.deck = []; GS.player.trash = [];
    GS.ai.hand = []; GS.ai.deck = []; GS.ai.trash = [];
    GS.effectQueue = [];
    GS.effectContext = null;
    GS.currentEffectLine = null;
    GS.currentTriggerCard = null;
  }

  test('IA mueve Hielo 1 (no Espíritu 3) a otra línea', () => {
    resetGS();
    const hielo1 = { card: makeCard('Hielo 1', 1), faceDown: false };
    GS.field['alpha'].ai = [hielo1];
    GS.currentEffectLine = 'alpha';
    GS.currentTriggerCard = 'Hielo 1';
    GS.effectQueue = [{ effect: { action: 'mayShiftSelf' }, targetPlayer: 'ai', cardName: 'Hielo 1' }];
    ENGINE.processAbilityEffect();
    // Hielo 1 ya no está en alpha
    expect(GS.field['alpha'].ai.length).toBe(0);
    // Está en otra línea (beta, por aiPickDestLine mock)
    const found = LINES_MOCK.some(l => GS.field[l].ai.some(c => c.card.nombre === 'Hielo 1'));
    expect(found).toBe(true);
  });

  test('IA mueve Tiempo 2 via drawAndMayShiftSelf', () => {
    resetGS();
    const tiempo2 = { card: makeCard('Tiempo 2', 2), faceDown: false };
    // Usar alpha como source (aiPickDestLine mock devuelve 'beta', así el move es alpha→beta)
    GS.field['alpha'].ai = [tiempo2];
    GS.ai.deck = [makeCard('X', 1)];
    GS.currentEffectLine = 'alpha';
    GS.currentTriggerCard = 'Tiempo 2';
    GS.effectQueue = [{ effect: { action: 'drawAndMayShiftSelf' }, targetPlayer: 'ai', cardName: 'Tiempo 2' }];
    ENGINE.processAbilityEffect();
    // Roba 1 carta
    expect(GS.ai.hand.length).toBe(1);
    // Tiempo 2 ya no está en alpha
    expect(GS.field['alpha'].ai.length).toBe(0);
    // Está en beta (destino del mock)
    expect(GS.field['beta'].ai.some(c => c.card.nombre === 'Tiempo 2')).toBe(true);
  });

  test('IA no mueve si la carta no está en la línea (nombre incorrecto)', () => {
    resetGS();
    // Carta con nombre distinto al triggerCardName — no debe encontrarla
    const other = { card: makeCard('Agua 1', 1), faceDown: false };
    GS.field['alpha'].ai = [other];
    GS.currentEffectLine = 'alpha';
    GS.currentTriggerCard = 'Hielo 1';
    GS.effectQueue = [{ effect: { action: 'mayShiftSelf' }, targetPlayer: 'ai', cardName: 'Hielo 1' }];
    ENGINE.processAbilityEffect();
    // Agua 1 sigue en alpha (no se movió porque no es Hielo 1)
    expect(GS.field['alpha'].ai.length).toBe(1);
    expect(GS.field['alpha'].ai[0].card.nombre).toBe('Agua 1');
  });
});

// ── Unidad 1: allowUnityPlayInLine (regla pasiva, no auto-juega) ─────────────
describe('Unidad 1 — allowUnityPlayInLine', () => {
  test('Unidad 1 tiene persistent.allowUnityPlayInLine y NO tiene onTurnEnd', () => {
    const ef = ENGINE.CARD_EFFECTS['Unidad 1'];
    expect(ef.persistent.allowUnityPlayInLine).toBe(true);
    expect(ef.onTurnEnd).toBeUndefined();
  });

  test('getUnityPlayLine devuelve la línea donde Unidad 1 está bocarriba', () => {
    LINES_MOCK.forEach(l => { GS.field[l] = { player: [], ai: [], compiledBy: null }; });
    GS.field['beta'].player = [{ card: makeCard('Unidad 1', 1), faceDown: false }];
    const line = ENGINE.getUnityPlayLine('player');
    expect(line).toBe('beta');
  });

  test('getUnityPlayLine devuelve null si Unidad 1 está bocabajo', () => {
    LINES_MOCK.forEach(l => { GS.field[l] = { player: [], ai: [], compiledBy: null }; });
    GS.field['beta'].player = [{ card: makeCard('Unidad 1', 1), faceDown: true }];
    const line = ENGINE.getUnityPlayLine('player');
    expect(line).toBeNull();
  });

  test('getUnityPlayLine devuelve null si no hay Unidad 1 en el campo', () => {
    LINES_MOCK.forEach(l => { GS.field[l] = { player: [], ai: [], compiledBy: null }; });
    const line = ENGINE.getUnityPlayLine('player');
    expect(line).toBeNull();
  });
});

// ── Caos 3: playAnywhere ─────────────────────────────────────────────────────
describe('Caos 3 — playAnywhere', () => {
  test('Caos 3 tiene playAnywhere: true', () => {
    const ef = ENGINE.CARD_EFFECTS['Caos 3'];
    expect(ef.playAnywhere).toBe(true);
  });

  test('canPlayAnywhere devuelve true para Caos 3', () => {
    const card = makeCard('Caos 3', 3);
    expect(ENGINE.canPlayAnywhere(card)).toBe(true);
  });

  test('canPlayAnywhere devuelve false para una carta normal', () => {
    const card = makeCard('Fuego 2', 2);
    expect(ENGINE.canPlayAnywhere(card)).toBe(false);
  });
});

// ── Corrupción 0: playOnAnySide + playAnywhere ───────────────────────────────
describe('Corrupción 0 — playOnAnySide', () => {
  test('Corrupción 0 tiene playAnywhere y playOnAnySide', () => {
    const ef = ENGINE.CARD_EFFECTS['Corrupción 0'];
    expect(ef.playAnywhere).toBe(true);
    expect(ef.playOnAnySide).toBe(true);
  });

  test('canPlayAnywhere devuelve true para Corrupción 0', () => {
    expect(ENGINE.canPlayAnywhere(makeCard('Corrupción 0', 0))).toBe(true);
  });

  test('canPlayOnAnySide devuelve true para Corrupción 0', () => {
    expect(ENGINE.canPlayOnAnySide(makeCard('Corrupción 0', 0))).toBe(true);
  });

  test('canPlayOnAnySide devuelve false para Caos 3', () => {
    expect(ENGINE.canPlayOnAnySide(makeCard('Caos 3', 3))).toBe(false);
  });

  test('canPlayOnAnySide devuelve false para carta normal', () => {
    expect(ENGINE.canPlayOnAnySide(makeCard('Fuego 2', 2))).toBe(false);
  });
});
