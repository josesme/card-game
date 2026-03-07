/**
 * ============================================================================
 * MOTOR DE HABILIDADES - COMPILE
 * ============================================================================
 * 
 * Sistema completo de efectos de cartas basado en:
 * - Hooks (onPlay, onFlip, onUncovered, onTurnStart, onTurnEnd)
 * - Actions (Draw, Discard, Delete, Flip, Shift, Return, etc.)
 * - Target resolution (player/ai/any/line-specific)
 * 
 * Este archivo reemplaza y expande la lógica de efectos básica en logic.js
 */

// ============================================================================
// 1. DEFINICIÓN DE EFECTOS POR CARTA
// ============================================================================

const CARD_EFFECTS = {
  // ========== ESPÍRITU ==========
  'Espíritu 0': {
    onPlay: [
      { action: 'refresh', target: 'self' },
      { action: 'draw', target: 'self', count: 1 }
    ],
    onTurnEnd: [
      { action: 'skipPhase', target: 'self', phase: 'checkCache' }
    ]
  },
  
  'Espíritu 1': {
    onPlay: [
      { action: 'ignoreOtherEffects', target: 'line', duration: 'turn' }
    ]
  },
  
  'Espíritu 2': {
    onPlay: [
      { action: 'drawPerCard', target: 'self', filter: 'faceUpInLine', count: 1 }
    ]
  },
  
  'Espíritu 3': {
    onPlay: [
      { action: 'maySwap', target: 'self', cards: 1 }
    ]
  },
  
  'Espíritu 4': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },
  
  'Espíritu 5': {
    onPlay: [
      { action: 'flip', target: 'any', count: 1 }
    ]
  },

  // ========== MUERTE ==========
  'Muerte 0': {
    onPlay: [
      { action: 'delete', target: 'self', count: 1 },
      { action: 'draw', target: 'self', count: 3 }
    ]
  },
  
  'Muerte 1': {
    persistent: { immobile: true }
  },
  
  'Muerte 2': {
    onPlay: [
      { action: 'mayDelete', target: 'opponent', count: 1 },
      { action: 'discard', target: 'self', count: 1 }
    ]
  },
  
  'Muerte 3': {
    onPlay: [
      { action: 'delete', target: 'self', count: 1 },
      { action: 'delete', target: 'opponent', count: 1 }
    ]
  },
  
  'Muerte 4': {
    onPlay: [
      { action: 'delete', target: 'self', count: 1 },
      { action: 'draw', target: 'self', count: 2 }
    ]
  },
  
  'Muerte 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== FUEGO ==========
  'Fuego 0': {
    onPlay: [
      { action: 'optionalDiscard', target: 'self', count: 1, ifThenAction: 'delete', ifThenTarget: 'opponent', ifThenCount: 1 }
    ]
  },
  
  'Fuego 1': {
    onPlay: [
      { action: 'optionalDiscard', target: 'self', count: 1, ifThenAction: 'discardMulti', ifThenTarget: 'opponent', ifThenCount: 2 }
    ]
  },
  
  'Fuego 2': {
    onPlay: [
      { action: 'optionalDiscard', target: 'self', count: 1, ifThenAction: 'draw', ifThenTarget: 'self', ifThenCount: 2 }
    ]
  },
  
  'Fuego 3': {
    onPlay: [
      { action: 'optionalDiscard', target: 'self', count: 1, ifThenAction: 'swap', ifThenTarget: 'self', ifThenCount: 1 }
    ]
  },
  
  'Fuego 4': {
    onPlay: [
      { action: 'optionalDiscard', target: 'self', count: 1, ifThenAction: 'flip', ifThenTarget: 'any', ifThenCount: 1 }
    ]
  },
  
  'Fuego 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== GRAVEDAD ==========
  'Gravedad 0': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'swapProtocols', target: 'self', count: 2 }
    ]
  },
  
  'Gravedad 1': {
    onPlay: [
      { action: 'moveAllCardsInLine', target: 'self', toLine: 'any' }
    ]
  },
  
  'Gravedad 2': {
    onPlay: [
      { action: 'moveCard', target: 'self', count: 1 }
    ]
  },
  
  'Gravedad 4': {
    onPlay: [
      { action: 'swap', target: 'self', count: 1 },
      { action: 'discard', target: 'self', count: 1 }
    ]
  },
  
  'Gravedad 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },
  
  'Gravedad 6': {
    onPlay: [
      { action: 'flip', target: 'self', count: 1 }
    ]
  },

  // ========== VIDA ==========
  'Vida 0': {
    onPlay: [
      { action: 'playTopDeck', target: 'self', faceUp: true }
    ]
  },
  
  'Vida 1': {
    onPlay: [
      { action: 'playTopDeck', target: 'self', faceUp: false }
    ]
  },
  
  'Vida 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'mayReturn', target: 'self', count: 1 }
    ]
  },
  
  'Vida 3': {
    onPlay: [
      { action: 'playTopDeck', target: 'self', faceUp: true },
      { action: 'mayFlip', target: 'self', count: 1 }
    ]
  },
  
  'Vida 4': {
    onPlay: [
      { action: 'revealTopDeck', target: 'self', ifMatchProtocol: true }
    ]
  },
  
  'Vida 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== LUZ ==========
  'Luz 0': {
    onPlay: [
      { action: 'flipAndDrawByValue', target: 'any', count: 1 }
    ]
  },
  
  'Luz 1': {
    onTurnEnd: [
      { action: 'draw', target: 'self', count: 1 }
    ]
  },
  
  'Luz 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'maySwapOrFlip', target: 'any', count: 1 }
    ]
  },
  
  'Luz 3': {
    onPlay: [
      { action: 'moveAllFaceDownCards', target: 'self', toLine: 'any' }
    ]
  },
  
  'Luz 4': {
    onPlay: [
      { action: 'revealOpponentHand', target: 'opponent' }
    ]
  },
  
  'Luz 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== METAL ==========
  'Metal 0': {
    persistent: {
      effect: 'reduceOpponentValue',
      value: 2,
      scope: 'line'
    },
    onPlay: [
      { action: 'flip', target: 'any', count: 1 }
    ]
  },
  
  'Metal 1': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'preventOpponentCompile', target: 'opponent', nextTurns: 1 }
    ]
  },
  
  'Metal 2': {
    persistent: {
      effect: 'preventFaceDownPlays',
      scope: 'line',
      target: 'opponent'
    }
  },
  
  'Metal 3': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'deleteLineIfOver', target: 'other', threshold: 8 }
    ]
  },
  
  'Metal 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },
  
  'Metal 6': {
    persistent: {
      effect: 'deleteOnCoverOrFlip',
      scope: 'self'
    }
  },

  // ========== PLAGA ==========
  'Plaga 0': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'revealAndReturn', target: 'opponent', count: 1 }
    ]
  },
  
  'Plaga 1': {
    persistent: {
      effect: 'preventProtocolMove',
      scope: 'self',
      target: 'opponent'
    },
    onPlay: [
      { action: 'draw', target: 'self', count: 1 }
    ]
  },
  
  'Plaga 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'forceSwapProtocols', target: 'opponent', count: 2 }
    ]
  },
  
  'Plaga 3': {
    onTurnEnd: [
      { action: 'mayReturnIfMoreCards', target: 'opponent', lineComparison: true }
    ]
  },
  
  'Plaga 4': {
    onPlay: [
      { action: 'moveOpponentCard', target: 'opponent', count: 1 }
    ]
  },
  
  'Plaga 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== PSIQUE ==========
  'Psique 0': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'discard', target: 'opponent', count: 2 },
      { action: 'revealOpponentHand', target: 'opponent' }
    ]
  },
  
  'Psique 1': {
    persistent: {
      effect: 'forceOpponentFaceDown'
    },
    onPlay: [
      { action: 'flip', target: 'self', count: 1 }
    ]
  },
  
  'Psique 2': {
    onPlay: [
      { action: 'discard', target: 'opponent', count: 2 },
      { action: 'rearrangeProtocols', target: 'opponent' }
    ]
  },
  
  'Psique 3': {
    onPlay: [
      { action: 'discard', target: 'opponent', count: 1 },
      { action: 'swap', target: 'opponent', count: 1 }
    ]
  },
  
  'Psique 4': {
    onTurnEnd: [
      { action: 'mayReturnAndFlip', target: 'opponent', count: 1 }
    ]
  },
  
  'Psique 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== VELOCIDAD ==========
  'Velocidad 0': {
    onPlay: [
      { action: 'refresh', target: 'self' },
      { action: 'draw', target: 'self', count: 1 },
      { action: 'playCard', target: 'self' }
    ]
  },
  
  'Velocidad 1': {
    onTurnEnd: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'playCard', target: 'self' }
    ]
  },
  
  'Velocidad 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'moveAllCardsInLine', target: 'self', toLine: 'any' },
      { action: 'playCard', target: 'self' }
    ]
  },
  
  'Velocidad 3': {
    onPlay: [
      { action: 'swap', target: 'self', count: 1 },
      { action: 'playCard', target: 'self' }
    ]
  },
  
  'Velocidad 4': {
    onPlay: [
      { action: 'moveCard', target: 'self', count: 1 },
      { action: 'playCard', target: 'self' }
    ]
  },
  
  'Velocidad 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== AGUA ==========
  'Agua 0': {
    onPlay: [
      { action: 'flip', target: 'other', count: 1 },
      { action: 'flip', target: 'self', count: 1 }
    ]
  },
  
  'Agua 1': {
    onPlay: [
      { action: 'playTopDeckFaceDownOtherLines', target: 'self' }
    ]
  },
  
  'Agua 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'rearrangeProtocols', target: 'self' }
    ]
  },
  
  'Agua 3': {
    onPlay: [
      { action: 'returnCardsWithValue', target: 'self', value: 2, count: 'all' }
    ]
  },
  
  'Agua 4': {
    onPlay: [
      { action: 'mayReturn', target: 'self', count: 1 }
    ]
  },
  
  'Agua 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== OSCURIDAD ==========
  'Oscuridad 0': {
    onPlay: [
      { action: 'flipAndDrawPerFaceDown', target: 'any', count: 1 }
    ]
  },
  
  'Oscuridad 1': {
    onTurnEnd: [
      { action: 'draw', target: 'self', count: 1 }
    ]
  },
  
  'Oscuridad 2': {
    onPlay: [
      { action: 'swapCard', target: 'any', count: 1 }
    ]
  },
  
  'Oscuridad 3': {
    onPlay: [
      { action: 'swap', target: 'self', count: 1 },
      { action: 'mayFlip', target: 'self', count: 1 }
    ]
  },
  
  'Oscuridad 4': {
    onPlay: [
      { action: 'flip', target: 'any', count: 1 },
      { action: 'discard', target: 'opponent', count: 1 }
    ]
  },
  
  'Oscuridad 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  }
};

// ============================================================================
// 2. SISTEMA DE ACCIONES
// ============================================================================

const ACTIONS = {
  /**
   * Acción Base: Robar cartas
   */
  draw: {
    execute: (context, params) => {
      const { gameState, targetPlayer, count } = params;
      for (let i = 0; i < count; i++) {
        drawCard(targetPlayer); // Usa función existente en logic.js
      }
      return { success: true, message: `${targetPlayer} robó ${count} carta(s)` };
    }
  },

  /**
   * Acción: Descartar cartas (elige el jugador/IA)
   */
  discard: {
    execute: (context, params) => {
      const { gameState, targetPlayer, count } = params;
      if (targetPlayer === 'player') {
        // Requiere UI - enviar a cola de efectos
        gameState.effectQueue.unshift({
          action: 'discard',
          targetPlayer,
          count,
          requiresUI: true
        });
      } else {
        // IA descarta aleatoriamente
        for (let i = 0; i < count; i++) {
          if (gameState.ai.hand.length > 0) {
            const idx = Math.floor(Math.random() * gameState.ai.hand.length);
            gameState.ai.trash.push(gameState.ai.hand.splice(idx, 1)[0]);
          }
        }
      }
      return { success: true, message: `${targetPlayer} descartó ${count} carta(s)` };
    }
  },

  /**
   * Acción: Eliminar cartas del tablero
   */
  delete: {
    execute: (context, params) => {
      const { gameState, targetPlayer, count } = params;
      if (targetPlayer === 'player') {
        gameState.effectQueue.unshift({
          action: 'delete',
          targetPlayer,
          count,
          requiresUI: true
        });
      } else {
        // IA elimina aleatoriamente
        for (let i = 0; i < count; i++) {
          const validLines = LINES.filter(l => gameState.field[l][targetPlayer].length > 0);
          if (validLines.length > 0) {
            const line = validLines[Math.floor(Math.random() * validLines.length)];
            const cardObj = gameState.field[line][targetPlayer].pop();
            gameState[targetPlayer].trash.push(cardObj.card);
          }
        }
      }
      return { success: true };
    }
  },

  /**
   * Acción: Voltear cartas
   */
  flip: {
    execute: (context, params) => {
      const { gameState, targetPlayer, count } = params;
      if (targetPlayer === 'any' || targetPlayer === 'player') {
        gameState.effectQueue.unshift({
          action: 'flip',
          targetPlayer: targetPlayer === 'any' ? null : targetPlayer,
          count,
          requiresUI: true
        });
      } else {
        for (let i = 0; i < count; i++) {
          const validLines = LINES.filter(l => gameState.field[l][targetPlayer].length > 0);
          if (validLines.length > 0) {
            const line = validLines[Math.floor(Math.random() * validLines.length)];
            const stack = gameState.field[line][targetPlayer];
            const cardObj = stack[stack.length - 1];
            cardObj.faceDown = !cardObj.faceDown;
          }
        }
      }
      return { success: true };
    }
  },

  /**
   * Acción: Mover cartas a otras líneas
   */
  shift: {
    execute: (context, params) => {
      const { gameState, targetPlayer, count } = params;
      gameState.effectQueue.unshift({
        action: 'shift',
        targetPlayer,
        count,
        requiresUI: true
      });
      return { success: true };
    }
  },

  /**
   * Acción: Devolver cartas a la mano
   */
  return: {
    execute: (context, params) => {
      const { gameState, targetPlayer, count } = params;
      gameState.effectQueue.unshift({
        action: 'return',
        targetPlayer,
        count,
        requiresUI: true
      });
      return { success: true };
    }
  },

  /**
   * Acción: Refresh (robar hasta 5 cartas)
   */
  refresh: {
    execute: (context, params) => {
      const { gameState, targetPlayer } = params;
      const current = gameState[targetPlayer].hand.length;
      if (current < 5) {
        for (let i = current; i < 5; i++) {
          drawCard(targetPlayer);
        }
      }
      return { success: true, message: `${targetPlayer} recargó` };
    }
  },

  /**
   * Acción: Cambiar posición de protocolos
   */
  rearrange: {
    execute: (context, params) => {
      const { gameState, targetPlayer } = params;
      gameState.effectQueue.unshift({
        action: 'rearrange',
        targetPlayer,
        requiresUI: true
      });
      return { success: true };
    }
  },

  /**
   * Acción: Intercambiar (Swap) cartas
   */
  swap: {
    execute: (context, params) => {
      const { gameState, targetPlayer, count } = params;
      gameState.effectQueue.unshift({
        action: 'swap',
        targetPlayer,
        count,
        requiresUI: true
      });
      return { success: true };
    }
  }
};

// ============================================================================
// 3. FUNCIONES DE RESOLUCIÓN DE EFECTOS
// ============================================================================

/**
 * Inicia la resolución de un conjunto de efectos para una carta
 * @param {Object} card - La carta que dispara el efecto
 * @param {string} trigger - Tipo de disparador: onPlay, onFlip, onTurnStart, etc.
 * @param {string} targetPlayer - 'player' o 'ai'
 */
function triggerCardEffect(card, trigger, targetPlayer) {
  const cardName = card.nombre;
  const effectDef = CARD_EFFECTS[cardName];

  if (!effectDef || !effectDef[trigger]) {
    console.log(`Sin efecto ${trigger} para ${cardName}`);
    return;
  }

  const effectList = effectDef[trigger];
  if (!Array.isArray(effectList)) return;

  // Agregar los efectos a la cola
  gameState.effectQueue = gameState.effectQueue || [];
  effectList.forEach(effect => {
    gameState.effectQueue.push({ effect, targetPlayer, cardName });
  });

  // Iniciar procesamiento
  processAbilityEffect();
}

/**
 * Procesa el siguiente efecto en la cola
 */
function processAbilityEffect() {
  if (!gameState.effectQueue || gameState.effectQueue.length === 0) {
    updateUI();
    return;
  }

  const item = gameState.effectQueue.shift();
  const { effect, targetPlayer, cardName } = item;

  console.log(`Resolviendo: ${effect.action} para ${cardName} (jugador: ${targetPlayer})`);

  // Resolver según el tipo de acción
  resolveAbilityAction(effect, targetPlayer);
}

/**
 * Resuelve una acción individual de efecto
 */
function resolveAbilityAction(actionDef, targetPlayer) {
  const { action, target, count, ifThenAction, ifThenTarget, ifThenCount } = actionDef;
  const opponent = targetPlayer === 'player' ? 'ai' : 'player';

  // Mapear targets
  let resolvedTarget = target;
  if (target === 'self') resolvedTarget = targetPlayer;
  if (target === 'opponent') resolvedTarget = opponent;
  if (target === 'other') resolvedTarget = opponent;
  if (target === 'any') resolvedTarget = 'any';

  // Ejecutar acción principal
  switch (action) {
    case 'draw':
      draw(resolvedTarget, count || 1);
      processAbilityEffect();
      break;

    case 'discard':
      discard(resolvedTarget, count || 1);
      processAbilityEffect();
      break;

    case 'delete':
      // Necesita interacción del usuario
      startEffect('eliminate', resolvedTarget, count || 1);
      break;

    case 'flip':
      startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
      break;

    case 'shift':
      startEffect('shift', resolvedTarget, count || 1);
      break;

    case 'return':
      startEffect('return', resolvedTarget, count || 1);
      break;

    case 'refresh':
      while (gameState[targetPlayer].hand.length < 5) {
        drawCard(targetPlayer);
      }
      processAbilityEffect();
      break;

    case 'optionalDiscard':
      // Para acciones opcionales, enviar confirmación
      if (targetPlayer === 'player') {
        gameState.pendingOptionalEffect = { ifThenAction, ifThenTarget, ifThenCount, count };
        updateStatus(`¿Descartas 1 carta para activar el efecto?`);
        // UI manejará esto
      } else {
        // IA decide aleatoriamente
        if (Math.random() > 0.5 && gameState.ai.hand.length > 0) {
          discard('ai', 1);
          resolveAbilityAction({
            action: ifThenAction,
            target: ifThenTarget,
            count: ifThenCount
          }, targetPlayer);
        } else {
          processAbilityEffect();
        }
      }
      break;

    case 'swapProtocols':
      startEffect('rearrange', resolvedTarget, count || 1);
      break;

    case 'moveAllCardsInLine':
      // Lógica especial - mover todas las cartas de esta línea a otra
      gameState.effectQueue.unshift({
        action: 'moveAllCardsInLine',
        targetPlayer,
        requiresUI: true
      });
      processAbilityEffect();
      break;

    case 'moveCard':
      startEffect('shift', resolvedTarget, count || 1);
      break;

    case 'swap':
      startEffect('swap', resolvedTarget, count || 1);
      break;

    case 'skipPhase':
      gameState.skipPhase = actionDef.phase;
      processAbilityEffect();
      break;

    // Agregar más casos según sea necesario
    default:
      console.warn(`Acción no implementada: ${action}`);
      processAbilityEffect();
  }
}

// ============================================================================
// 4. EFECTOS PERSISTENTES (Passive Abilities)
// ============================================================================

/**
 * Calcula modificadores persistentes de una carta
 */
function getPersistentModifiers(card, line) {
  const cardName = card.nombre;
  const effectDef = CARD_EFFECTS[cardName];

  if (!effectDef || !effectDef.persistent) return {};

  const persistent = effectDef.persistent;
  const modifiers = {};

  // Metal 0: Reduce value del oponente en 2
  if (persistent.effect === 'reduceOpponentValue') {
    modifiers.valueReduction = persistent.value;
  }

  // Metal 2: Previene cartas bocabajo del oponente
  if (persistent.effect === 'preventFaceDownPlays') {
    modifiers.preventFaceDown = true;
  }

  // Metal 6: Se elimina si se cubre o voltea
  if (persistent.effect === 'deleteOnCoverOrFlip') {
    modifiers.deleteOnModify = true;
  }

  // Plaga 1: El oponente no puede mover este protocolo
  if (persistent.effect === 'preventProtocolMove') {
    modifiers.immobile = true;
  }

  // Psique 1: Fuerza al oponente a jugar bocabajo
  if (persistent.effect === 'forceOpponentFaceDown') {
    modifiers.forceOpponentFaceDown = true;
  }

  return modifiers;
}

/**
 * Aplica modificadores persistentes al cálculo de valor
 */
function applyPersistentValueModifiers(line, player) {
  let totalReduction = 0;

  LINES.forEach(currentLine => {
    if (currentLine === line) {
      const opponent = player === 'player' ? 'ai' : 'player';
      gameState.field[currentLine][opponent].forEach(cardObj => {
        const modifiers = getPersistentModifiers(cardObj.card, currentLine);
        if (modifiers.valueReduction) {
          totalReduction += modifiers.valueReduction;
        }
      });
    }
  });

  return totalReduction;
}

// ============================================================================
// 5. INTEGRACIÓN CON LOGIC.JS
// ============================================================================

/**
 * Reemplaza executeEffect() en logic.js
 * Ahora usa el motor de habilidades en lugar de parsear texto
 */
function executeNewEffect(card, targetPlayer) {
  triggerCardEffect(card, 'onPlay', targetPlayer);
}

/**
 * Hook para cuando se voltea una carta
 */
function onCardFlipped(card, targetPlayer, line) {
  triggerCardEffect(card, 'onFlip', targetPlayer);
  
  // Aplicar efectos especiales de volteado
  const modifiers = getPersistentModifiers(card, line);
  if (modifiers.deleteOnModify) {
    // Eliminar la carta inmediatamente
    const cardIndex = gameState.field[line][targetPlayer].findIndex(c => c.card.id === card.id);
    if (cardIndex !== -1) {
      const deletedCard = gameState.field[line][targetPlayer].splice(cardIndex, 1)[0];
      gameState[targetPlayer].trash.push(deletedCard.card);
    }
  }
}

/**
 * Hook para inicio de turno
 */
function onTurnStartEffects(player) {
  LINES.forEach(line => {
    gameState.field[line][player].forEach(cardObj => {
      if (!cardObj.faceDown) {
        triggerCardEffect(cardObj.card, 'onTurnStart', player);
      }
    });
  });
}

/**
 * Hook para fin de turno
 */
function onTurnEndEffects(player) {
  LINES.forEach(line => {
    gameState.field[line][player].forEach(cardObj => {
      if (!cardObj.faceDown) {
        triggerCardEffect(cardObj.card, 'onTurnEnd', player);
      }
    });
  });
}

// ============================================================================
// 6. INTEGRACIÓN CON CÁLCULO DE VALOR
// ============================================================================

/**
 * Versión mejorada de calculateScore() que considera modificadores persistentes
 */
function calculateScoreWithModifiers(line, player) {
  const opponent = player === 'player' ? 'ai' : 'player';
  let score = 0;

  // Sumar valores base
  gameState.field[line][player].forEach(cardObj => {
    if (!cardObj.faceDown) {
      score += cardObj.card.valor;
    } else {
      score += 2; // Cartas bocabajo siempre valen 2
    }
  });

  // Aplicar modificadores persistentes del oponente
  const reduction = applyPersistentValueModifiers(line, player);
  score = Math.max(0, score - reduction); // No puede ser negativo

  return score;
}

// ============================================================================
// EXPORTS / Disponibilidad Global
// ============================================================================

// Asegurar que estas funciones estén disponibles globalmente para logic.js
if (typeof window !== 'undefined') {
  window.CARD_EFFECTS = CARD_EFFECTS;
  window.triggerCardEffect = triggerCardEffect;
  window.processAbilityEffect = processAbilityEffect;
  window.executeNewEffect = executeNewEffect;
  window.onCardFlipped = onCardFlipped;
  window.onTurnStartEffects = onTurnStartEffects;
  window.onTurnEndEffects = onTurnEndEffects;
  window.calculateScoreWithModifiers = calculateScoreWithModifiers;
  window.getPersistentModifiers = getPersistentModifiers;
}
