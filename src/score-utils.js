'use strict';

// Pure scoring helpers shared between main thread and minimax Web Worker.
// These functions are self-contained — they only access state data and CARD_EFFECTS.

function getPersistentModifiers(cardOrObj) {
  const faceDown = cardOrObj.faceDown;
  const card = cardOrObj.card ?? cardOrObj;
  if (faceDown) return {};
  const cardName = card.nombre;
  const effectDef = (typeof CARD_EFFECTS !== 'undefined' ? CARD_EFFECTS : {})[cardName];

  if (!effectDef || !effectDef.persistent) return {};

  const persistent = effectDef.persistent;
  const modifiers = {};

  if (persistent.effect === 'reduceOpponentValue')    modifiers.valueReduction = persistent.value;
  if (persistent.effect === 'preventFaceDownPlays')   modifiers.preventFaceDown = true;
  if (persistent.effect === 'deleteOnCoverOrFlip')    modifiers.deleteOnModify = true;
  if (persistent.effect === 'preventProtocolMove')    modifiers.immobile = true;
  if (persistent.preventFlip)                         modifiers.preventFlip = true;
  if (persistent.immobile) {
    modifiers.preventFlip = true;
    modifiers.preventShift = true;
    modifiers.preventEliminate = true;
  }
  if (persistent.effect === 'forceOpponentFaceDown')  modifiers.forceOpponentFaceDown = true;
  if (persistent.effect === 'preventOpponentPlay')    modifiers.preventOpponentPlay = true;

  return modifiers;
}

function applyPersistentValueModifiers(state, line, player) {
  const opponent = player === 'player' ? 'ai' : 'player';
  let totalReduction = 0;
  let totalBonus = 0;
  const CARD_EFF = typeof CARD_EFFECTS !== 'undefined' ? CARD_EFFECTS : {};

  const oppStack = state.field[line][opponent];
  if (oppStack.length > 0) {
    const topCardObj = oppStack[oppStack.length - 1];
    const modifiers = getPersistentModifiers(topCardObj);
    if (modifiers.valueReduction) totalReduction += modifiers.valueReduction;
  }

  const selfStack = state.field[line][player];
  const faceDownCount =
    state.field[line].player.filter(c => c.faceDown).length +
    state.field[line].ai.filter(c => c.faceDown).length;
  const oppCardCount = state.field[line][player === 'player' ? 'ai' : 'player'].length;

  selfStack.forEach(cardObj => {
    if (cardObj.faceDown) return;
    const effectDef = CARD_EFF[cardObj.card.nombre];
    if (!effectDef || !effectDef.persistent) return;
    const p = effectDef.persistent;

    if (p.valueBonusPerFaceDown)        totalBonus += p.valueBonusPerFaceDown * faceDownCount;
    if (p.valueBonusPerHandCard)        totalBonus += p.valueBonusPerHandCard * (state[player].hand.length || 0);
    if (p.valueBonusPerOpponentCard)    totalBonus += p.valueBonusPerOpponentCard * oppCardCount;
    if (p.valueBonusIfNonDiversityFaceUp) {
      const hasNonDiv = selfStack.some(c => !c.faceDown && !c.card.nombre.startsWith('Diversidad'));
      if (hasNonDiv) totalBonus += p.valueBonusIfNonDiversityFaceUp;
    }
  });

  return totalReduction - totalBonus;
}

function calculateScore(state, line, target) {
  const CARD_EFF = typeof CARD_EFFECTS !== 'undefined' ? CARD_EFFECTS : {};

  const faceDownOverride = (() => {
    for (const cardObj of state.field[line][target]) {
      if (cardObj.faceDown) continue;
      const ef = CARD_EFF[cardObj.card.nombre];
      if (ef && ef.persistent && ef.persistent.effect === 'faceDownValueOverride') return ef.persistent.value;
    }
    return null;
  })();

  let score = state.field[line][target].reduce((sum, cardObj) => {
    if (cardObj.faceDown) return sum + (faceDownOverride !== null ? faceDownOverride : 2);
    return sum + cardObj.card.valor;
  }, 0);

  const netModifier = applyPersistentValueModifiers(state, line, target);
  score = score - netModifier;

  return score;
}

// Expose globally: works as window.calculateScore in browser and self.calculateScore in worker
self.calculateScore = calculateScore;
