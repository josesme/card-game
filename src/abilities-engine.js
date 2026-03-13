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
  // "Actualiza. Roba 1 carta. / Sáltate tu Fase de Comprobar Caché."
  'Espíritu 0': {
    onPlay: [
      { action: 'refresh', target: 'self' },
      { action: 'draw', target: 'self', count: 1 }
    ],
    onTurnEnd: [
      { action: 'skipPhase', target: 'self', phase: 'checkCache' }
    ]
  },

  // "Cada vez que juegues una carta bocarriba, puedes colocarla sin coincidir con los Protocolos.
  //  / Roba 2 cartas. / Inicial: Descarta 1 carta o bien voltea esta carta."
  'Espíritu 1': {
    persistent: { allowAnyProtocol: true },
    onPlay: [
      { action: 'draw', target: 'self', count: 2 }
    ],
    onTurnStart: [
      { action: 'optionalDiscardOrFlipSelf', target: 'self' }
    ]
  },

  // "Puedes voltear 1 carta."
  'Espíritu 2': {
    onPlay: [
      { action: 'mayFlip', target: 'any', count: 1 }
    ]
  },

  // "Después de robar cartas: Puedes cambiar esta carta, incluso si está cubierta."
  // TODO: necesita hook onDraw; por ahora aproximado como onPlay
  'Espíritu 3': {
    onPlay: [
      { action: 'maySwap', target: 'self', cards: 1 }
    ]
  },

  // "Reorganiza 2 de tus Protocolos."
  'Espíritu 4': {
    onPlay: [
      { action: 'rearrangeProtocols', target: 'self' }
    ]
  },

  // "Descarta 1 carta."
  'Espíritu 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== MUERTE ==========
  // "Elimina 1 carta de cada una de las otras líneas."
  'Muerte 0': {
    onPlay: [
      { action: 'deleteFromEachOtherLine', target: 'any', count: 1 }
    ]
  },

  // ERRATA (10/2024): "Inicial: Puedes robar 1 carta. Si lo haces, elimina otra carta y, luego, elimina esta carta."
  'Muerte 1': {
    persistent: { immobile: true },
    onTurnStart: [
      { action: 'optionalDrawThenDelete', target: 'self', ifThenAction: 'delete', ifThenTarget: 'opponent', ifThenCount: 1, thenSelf: true }
    ]
  },

  // "Elimina todas las cartas con Valor 1 o 2 de una línea."
  'Muerte 2': {
    onPlay: [
      { action: 'deleteAllValueRange', target: 'any', minVal: 1, maxVal: 2 }
    ]
  },

  // "Elimina 1 carta bocabajo."
  'Muerte 3': {
    onPlay: [
      { action: 'delete', target: 'any', count: 1, filter: 'faceDown' }
    ]
  },

  // "Elimina 1 carta con Valor 0 o 1."
  'Muerte 4': {
    onPlay: [
      { action: 'delete', target: 'any', count: 1, filter: 'maxValue', maxVal: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Muerte 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== FUEGO ==========
  // "Voltea otra carta. Roba 2 cartas. / Si se cubre esta carta: Primero, roba 1 carta y voltea otra carta."
  'Fuego 0': {
    onPlay: [
      { action: 'flip', target: 'any', count: 1 },
      { action: 'draw', target: 'self', count: 2 }
    ],
    onCover: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'flip', target: 'any', count: 1 }
    ]
  },

  // "Descarta 1 carta. Si lo haces, elimina 1 carta."
  'Fuego 1': {
    onPlay: [
      { action: 'discardThen', target: 'self', count: 1, ifThenAction: 'delete', ifThenTarget: 'opponent', ifThenCount: 1 }
    ]
  },

  // "Descarta 1 carta. Si lo haces, devuelve 1 carta."
  'Fuego 2': {
    onPlay: [
      { action: 'discardThen', target: 'self', count: 1, ifThenAction: 'return', ifThenTarget: 'any', ifThenCount: 1 }
    ]
  },

  // "Final: Puedes descartar 1 carta. Si lo haces, voltea 1 carta."
  'Fuego 3': {
    onTurnEnd: [
      { action: 'optionalDiscard', target: 'self', count: 1, ifThenAction: 'flip', ifThenTarget: 'any', ifThenCount: 1 }
    ]
  },

  // "Descarta 1 o más cartas. Roba tantas cartas como hayas descartado más 1."
  'Fuego 4': {
    onPlay: [
      { action: 'discardForDraw', target: 'self' }
    ]
  },

  // "Descarta 1 carta."
  'Fuego 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== GRAVEDAD ==========
  // "Por cada 2 cartas en esta línea, juega bocabajo la carta superior de tu mazo debajo de esta carta."
  'Gravedad 0': {
    onPlay: [
      { action: 'playTopDeckBelowPerPair', target: 'self' }
    ]
  },

  // "Roba 2 cartas. Cambia 1 carta a esta línea. O bien de esta línea."
  'Gravedad 1': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'shift', target: 'any', count: 1 }
    ]
  },

  // "Voltea 1 carta. Cambia esa carta a esta línea."
  'Gravedad 2': {
    onPlay: [
      { action: 'flipAndShiftToLine', target: 'any', count: 1 }
    ]
  },

  // "Cambia 1 carta bocabajo a esta línea."
  'Gravedad 4': {
    onPlay: [
      { action: 'shiftFaceDownToLine', target: 'other' }
    ]
  },

  // "Descarta 1 carta."
  'Gravedad 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // "Tu oponente juega bocabajo la carta superior de su mazo en esta línea."
  'Gravedad 6': {
    onPlay: [
      { action: 'forceOpponentPlayTopDeck', target: 'opponent', faceDown: true }
    ]
  },

  // ========== VIDA ==========
  // "Final: Si esta carta está cubierta, elimina esta carta.
  //  / En cada línea donde tengas al menos 1 carta, juega bocabajo la carta superior de tu mazo."
  'Vida 0': {
    onPlay: [
      { action: 'playTopDeckAllLines', target: 'self', faceDown: true }
    ],
    onTurnEnd: [
      { action: 'deleteSelfIfCovered', target: 'self' }
    ]
  },

  // "Voltea 1 carta. Voltea 1 carta."
  'Vida 1': {
    onPlay: [
      { action: 'flip', target: 'any', count: 1 },
      { action: 'flip', target: 'any', count: 1 }
    ]
  },

  // "Roba 1 carta. Puedes voltear 1 carta que esté bocabajo."
  'Vida 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'mayFlip', target: 'any', count: 1 }
    ]
  },

  // "Si se cubre esta carta: Primero, juega bocabajo la carta superior de tu mazo en otra línea."
  'Vida 3': {
    onCover: [
      { action: 'playTopDeckFaceDownOtherLines', target: 'self' }
    ]
  },

  // "Si esta carta está cubriendo otra carta, roba 1 carta."
  'Vida 4': {
    onPlay: [
      { action: 'drawIfCovering', target: 'self', count: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Vida 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== LUZ ==========
  // "Voltea 1 carta. Roba tantas cartas como el Valor de la carta volteada."
  'Luz 0': {
    onPlay: [
      { action: 'flipAndDrawByValue', target: 'any', count: 1 }
    ]
  },

  // "Final: Roba 1 carta."
  'Luz 1': {
    onTurnEnd: [
      { action: 'draw', target: 'self', count: 1 }
    ]
  },

  // "Roba 2 cartas. Revela 1 carta bocabajo. Puedes cambiar o voltear esa carta."
  'Luz 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'maySwapOrFlip', target: 'any', count: 1 }
    ]
  },

  // "Cambia todas las cartas bocabajo de esta línea a otra línea."
  'Luz 3': {
    onPlay: [
      { action: 'moveAllFaceDownCards', target: 'self', toLine: 'any' }
    ]
  },

  // "Tu oponente te revela su mano."
  'Luz 4': {
    onPlay: [
      { action: 'revealOpponentHand', target: 'opponent' }
    ]
  },

  // "Descarta 1 carta."
  'Luz 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== METAL ==========
  // "El Valor total de tu oponente en esta línea se reduce en 2. / Voltea 1 carta."
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

  // "Roba 2 cartas. Tu oponente no puede Compilar en el siguiente turno."
  'Metal 1': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'preventOpponentCompile', target: 'opponent', nextTurns: 1 }
    ]
  },

  // "Tu oponente no puede jugar cartas bocabajo en esta línea."
  'Metal 2': {
    persistent: {
      effect: 'preventFaceDownPlays',
      scope: 'line',
      target: 'opponent'
    }
  },

  // "Roba 1 carta. Elimina todas las cartas de otra línea que tengan 6 o más cartas."
  'Metal 3': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'deleteLineIfOver', target: 'other', threshold: 8 }
    ]
  },

  // "Descarta 1 carta."
  'Metal 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // "Si se cubre o se voltea esta carta: Primero, elimina esta carta."
  'Metal 6': {
    persistent: {
      effect: 'deleteOnCoverOrFlip',
      scope: 'self'
    }
  },

  // ========== PLAGA ==========
  // "Tu oponente descarta 1 carta. / Tu oponente no puede jugar cartas en esta línea."
  'Plaga 0': {
    onPlay: [
      { action: 'discard', target: 'opponent', count: 1 }
    ],
    persistent: {
      effect: 'preventOpponentPlay',
      scope: 'line'
    }
  },

  // "Después de que tu oponente descarte cartas: Roba 1 carta. / Tu oponente descarta 1 carta."
  // TODO: trigger onOpponentDiscard no implementado aún; el draw reactivo se omite por ahora
  'Plaga 1': {
    persistent: {
      effect: 'drawOnOpponentDiscard',
      count: 1
    },
    onPlay: [
      { action: 'discard', target: 'opponent', count: 1 }
    ]
  },

  // "Descarta 1 o más cartas. Tu oponente descarta tantas cartas como tú más 1."
  'Plaga 2': {
    onPlay: [
      { action: 'discardForOpponentMore', target: 'self' }
    ]
  },

  // "Voltea cada otra carta bocarriba."
  'Plaga 3': {
    onPlay: [
      { action: 'flipAllFaceUp', target: 'other' }
    ]
  },

  // "Final: Tu oponente elimina 1 de sus cartas bocabajo. Puedes voltear esta carta."
  'Plaga 4': {
    onTurnEnd: [
      { action: 'forceOpponentDeleteFaceDown', target: 'opponent', count: 1 },
      { action: 'mayFlip', target: 'self', count: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Plaga 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== PSIQUE ==========
  // "Roba 2 cartas. Tu oponente descarta 2 cartas. Y luego, revela su mano."
  'Psique 0': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'discard', target: 'opponent', count: 2 },
      { action: 'revealOpponentHand', target: 'opponent' }
    ]
  },

  // "Tu oponente solo puede jugar cartas bocabajo. / Inicial: Voltea esta carta."
  'Psique 1': {
    persistent: {
      effect: 'forceOpponentFaceDown'
    },
    onTurnStart: [
      { action: 'flip', target: 'self', count: 1 }
    ]
  },

  // "Tu oponente descarta 2 cartas. Reorganiza sus Protocolos."
  'Psique 2': {
    onPlay: [
      { action: 'discard', target: 'opponent', count: 2 },
      { action: 'rearrangeProtocols', target: 'opponent' }
    ]
  },

  // "Tu oponente descarta 1 carta. Cambia 1 de sus cartas."
  'Psique 3': {
    onPlay: [
      { action: 'discard', target: 'opponent', count: 1 },
      { action: 'shift', target: 'opponent', count: 1 }
    ]
  },

  // "Final: Puedes devolver 1 de las cartas de tu oponente. Si lo haces, voltea esta carta."
  'Psique 4': {
    onTurnEnd: [
      { action: 'mayReturnAndFlip', target: 'opponent', count: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Psique 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== VELOCIDAD ==========
  // "Juega 1 carta."
  'Velocidad 0': {
    onPlay: [
      { action: 'playCard', target: 'self' }
    ]
  },

  // "Después de Borrar la Caché: Roba 1 carta. / Roba 2 cartas."
  'Velocidad 1': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 }
    ],
    onTurnEnd: [
      { action: 'draw', target: 'self', count: 1 }
    ]
  },

  // "Si esta carta se elimina Compilando: En su lugar, cambia esta carta, incluso si está cubierta."
  // TODO: necesita hook onEliminate; no implementado aún
  'Velocidad 2': {},

  // "Cambia 1 de tus otras cartas. / Final: Puedes cambiar 1 de tus cartas. Si lo haces, voltea esta carta."
  'Velocidad 3': {
    onPlay: [
      { action: 'swap', target: 'self', count: 1 }
    ],
    onTurnEnd: [
      { action: 'optionalSwapThenFlipSelf', target: 'self' }
    ]
  },

  // "Cambia 1 de las cartas bocabajo de tu oponente."
  'Velocidad 4': {
    onPlay: [
      { action: 'moveOpponentFaceDown', target: 'opponent', count: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Velocidad 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== AGUA ==========
  // "Voltea otra carta. Voltea esta carta."
  'Agua 0': {
    onPlay: [
      { action: 'flip', target: 'other', count: 1 },
      { action: 'flip', target: 'self', count: 1 }
    ]
  },

  // "En cada una de tus otras líneas, juega bocabajo la carta superior de tu mazo."
  'Agua 1': {
    onPlay: [
      { action: 'playTopDeckFaceDownOtherLines', target: 'self' }
    ]
  },

  // "Roba 2 cartas. Reorganiza tus Protocolos."
  'Agua 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'rearrangeProtocols', target: 'self' }
    ]
  },

  // "Devuelve todas las cartas con Valor 2 de 1 línea."
  'Agua 3': {
    onPlay: [
      { action: 'returnCardsWithValue', target: 'self', value: 2, count: 'all' }
    ]
  },

  // "Devuelve 1 de tus cartas."
  'Agua 4': {
    onPlay: [
      { action: 'return', target: 'self', count: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Agua 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== OSCURIDAD ==========
  // "Roba 3 cartas. Cambia 1 de las cartas cubiertas de tu oponente."
  'Oscuridad 0': {
    onPlay: [
      { action: 'draw', target: 'self', count: 3 },
      { action: 'shiftCovered', target: 'opponent', count: 1 }
    ]
  },

  // "Voltea 1 de las cartas de tu oponente. Puedes cambiar esa carta."
  'Oscuridad 1': {
    onPlay: [
      { action: 'flip', target: 'opponent', count: 1 },
      { action: 'maySwap', target: 'opponent', count: 1 }
    ]
  },

  // "Cada carta bocabajo en esta pila tiene un Valor de 4.
  //  / Puedes voltear 1 carta cubierta de esta línea."
  'Oscuridad 2': {
    persistent: {
      effect: 'faceDownValueOverride',
      value: 4,
      scope: 'thisStack'
    },
    onPlay: [
      { action: 'mayFlipCovered', target: 'self', count: 1 }
    ]
  },

  // "Juega 1 carta bocabajo en otra línea."
  'Oscuridad 3': {
    onPlay: [
      { action: 'playHandFaceDown', target: 'self' }
    ]
  },

  // "Cambia 1 carta bocabajo."
  'Oscuridad 4': {
    onPlay: [
      { action: 'shiftFaceDown', target: 'any', count: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Oscuridad 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== APATÍA (Expansión) ==========
  // "Tu Valor total en esta línea se incrementa en 1 por cada carta bocabajo en esta línea."
  'Apatía 0': {
    persistent: { valueBonusPerFaceDown: 1, scope: 'thisLine' } // TODO: implementar en cálculo de score
  },

  // "Voltea todas las demás cartas bocarriba en esta línea."
  'Apatía 1': {
    onPlay: [
      { action: 'flipAllFaceUpInLine', target: 'self' }
    ]
  },

  // "Ignora todos los comandos de acción de las cartas en esta línea."
  // "Si se cubre esta carta: Primero, voltea esta carta."
  'Apatía 2': {
    persistent: { ignoreMiddleCommands: true, scope: 'thisLine' }, // TODO: implementar en triggerCardEffect
    onCover: [
      { action: 'flipSelf', target: 'self' }
    ]
  },

  // "Voltea 1 de las cartas bocarriba de tu oponente."
  'Apatía 3': {
    onPlay: [
      { action: 'flip', target: 'opponent', count: 1 }
    ]
  },

  // "Puedes voltear 1 de tus cartas bocarriba cubiertas."
  'Apatía 4': {
    onPlay: [
      { action: 'mayFlipCovered', target: 'self', count: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Apatía 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== ODIO (Expansión) ==========
  // ERRATA (10/2024): "Elimina tu carta descubierta de mayor valor. Elimina la del oponente de mayor valor."
  // ACLARACION: Si Odio 2 es tu carta de mayor valor, se elimina a sí misma y el segundo efecto no se activa.
  'Odio 2': {
    onPlay: [
      { action: 'deleteHighestUncovered', target: 'self', thenOpponent: true }
    ]
  },

  // "Elimina 1 carta." (libre: cualquier carta del campo)
  'Odio 0': {
    onPlay: [
      { action: 'delete', target: 'any', count: 1 }
    ]
  },

  // "Descarta 3 cartas. Elimina 1 carta. Elimina 1 carta."
  'Odio 1': {
    onPlay: [
      { action: 'discard', target: 'self', count: 3 },
      { action: 'delete', target: 'any', count: 1 },
      { action: 'delete', target: 'any', count: 1 }
    ]
  },

  // "Después de que elimines cartas: Roba 1 carta." (persistent trigger)
  'Odio 3': {
    persistent: { drawOnOwnDelete: 1 } // TODO: disparar en executeEliminate cuando Odio 3 está en campo
  },

  // "Si se cubre esta carta: Primero, elimina la carta cubierta de menor valor en esta línea."
  'Odio 4': {
    onCover: [
      { action: 'deleteLowestCoveredInLine', target: 'self' }
    ]
  },

  // "Descarta 1 carta."
  'Odio 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== AMOR (Expansión) ==========
  // "Roba la carta superior del mazo de tu oponente."
  // "Final: Puedes dar 1 carta de tu mano a tu oponente. Si lo haces, roba 2 cartas."
  'Amor 1': {
    onPlay: [
      { action: 'drawFromOpponentDeck', target: 'self', count: 1 }
    ],
    onTurnEnd: [
      { action: 'mayGiveCardForDraw', target: 'self', count: 2 }
    ]
  },

  // "Tu oponente roba 1 carta. Actualiza."
  'Amor 2': {
    onPlay: [
      { action: 'draw', target: 'opponent', count: 1 },
      { action: 'refresh', target: 'self' }
    ]
  },

  // "Toma 1 carta aleatoria de la mano de tu oponente. Da 1 carta de tu mano a tu oponente."
  'Amor 3': {
    onPlay: [
      { action: 'takeRandomFromOpponent', target: 'self', count: 1 },
      { action: 'giveCardToOpponent', target: 'self', count: 1 }
    ]
  },

  // "Revela 1 carta de tu mano. Voltea 1 carta."
  'Amor 4': {
    onPlay: [
      { action: 'revealFromHand', target: 'self', count: 1 },
      { action: 'flip', target: 'any', count: 1 }
    ]
  },

  // "Descarta 1 carta."
  'Amor 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // "Tu oponente roba 2 cartas."
  'Amor 6': {
    onPlay: [
      { action: 'draw', target: 'opponent', count: 2 }
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
      if (resolvedTarget === 'player') {
        startEffect('discard', 'player', count || 1);
      } else {
        discard('ai', count || 1);
        processAbilityEffect();
      }
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

    case 'discardThen': {
      // Descarte obligatorio (sin "puedes"). El efecto secundario se activa siempre.
      if (resolvedTarget === 'player' || resolvedTarget === 'any') {
        if (ifThenAction) {
          gameState.effectQueue.unshift({ effect: { action: ifThenAction, target: ifThenTarget, count: ifThenCount }, targetPlayer });
        }
        startEffect('discard', 'player', count || 1);
      } else {
        discard('ai', count || 1);
        if (ifThenAction) {
          resolveAbilityAction({ action: ifThenAction, target: ifThenTarget, count: ifThenCount }, targetPlayer);
        } else {
          processAbilityEffect();
        }
      }
      break;
    }

    case 'optionalDiscard': {
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = '¿Descartas 1 carta para activar el efecto?';
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            // Queue the ifThen action, then do the interactive discard
            if (ifThenAction) {
              gameState.effectQueue.unshift({ effect: { action: ifThenAction, target: ifThenTarget, count: ifThenCount }, targetPlayer });
            }
            startEffect('discard', 'player', count || 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA decide aleatoriamente
        if (Math.random() > 0.5 && gameState.ai.hand.length > 0) {
          discard('ai', 1);
          resolveAbilityAction({ action: ifThenAction, target: ifThenTarget, count: ifThenCount }, targetPlayer);
        } else {
          processAbilityEffect();
        }
      }
      break;
    }

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
      if (actionDef.phase === 'checkCache') {
        // Marca al jugador para saltarse su próximo caché (aplica en endTurn del siguiente turno)
        gameState[resolvedTarget].skipNextCacheCheck = true;
      } else {
        gameState.skipPhase = actionDef.phase;
      }
      processAbilityEffect();
      break;

    // --- SIMPLES: variantes opcionales (may*) y alias ---

    case 'mayDelete':
      // Como 'delete' pero opcional para el jugador (IA siempre lo hace si puede)
      if (targetPlayer === 'player') {
        startEffect('eliminate', resolvedTarget, count || 1);
      } else {
        resolveAbilityAction({ action: 'delete', target, count }, targetPlayer);
      }
      break;

    case 'mayFlip':
      if (targetPlayer === 'player') {
        startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
      } else {
        resolveAbilityAction({ action: 'flip', target, count }, targetPlayer);
      }
      break;

    case 'mayReturn':
      if (targetPlayer === 'player') {
        startEffect('return', resolvedTarget, count || 1);
      } else {
        resolveAbilityAction({ action: 'return', target, count }, targetPlayer);
      }
      break;

    case 'maySwap':
      if (targetPlayer === 'player') {
        startEffect('swap', resolvedTarget, count || 1);
      } else {
        resolveAbilityAction({ action: 'swap', target, count }, targetPlayer);
      }
      break;

    case 'swapCard':
      startEffect('swap', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
      break;

    case 'moveOpponentCard':
      startEffect('shift', opponent, count || 1);
      break;

    case 'rearrangeProtocols':
      startEffect('rearrange', resolvedTarget, count || 1);
      break;

    case 'forceSwapProtocols':
      startEffect('rearrange', opponent, count || 2);
      break;

    case 'drawPerCard': {
      // Count face-up cards in the current effect line for targetPlayer
      const line = gameState.currentEffectLine;
      if (line) {
        const faceUpCount = gameState.field[line][targetPlayer].filter(c => !c.faceDown).length;
        draw(targetPlayer, faceUpCount * (count || 1));
      }
      processAbilityEffect();
      break;
    }

    case 'deleteLineIfOver': {
      // Delete all opponent cards in current line if their score exceeds threshold
      const line = gameState.currentEffectLine;
      const threshold = actionDef.threshold || 8;
      if (line) {
        const lineScore = gameState.field[line][resolvedTarget].reduce((sum, c) => sum + (c.faceDown ? 2 : c.card.valor), 0);
        if (lineScore > threshold) {
          const removed = gameState.field[line][resolvedTarget].splice(0);
          removed.forEach(c => gameState[resolvedTarget].trash.push(c.card));
        }
      }
      processAbilityEffect();
      break;
    }

    case 'mayReturnIfMoreCards': {
      // If opponent has more cards in current line, may return 1 opponent card
      const line = gameState.currentEffectLine;
      if (line) {
        const myCount = gameState.field[line][targetPlayer].length;
        const oppCount = gameState.field[line][resolvedTarget].length;
        if (oppCount > myCount) {
          if (targetPlayer === 'player') {
            startEffect('return', resolvedTarget, count || 1);
          } else {
            // AI auto-returns
            if (gameState.field[line][resolvedTarget].length > 0) {
              const cardObj = gameState.field[line][resolvedTarget].pop();
              gameState[resolvedTarget].hand.push(cardObj.card);
              processAbilityEffect();
            } else {
              processAbilityEffect();
            }
          }
        } else {
          processAbilityEffect();
        }
      } else {
        processAbilityEffect();
      }
      break;
    }

    case 'returnCardsWithValue': {
      // Return all self cards across all lines with the given value back to hand
      const targetValue = actionDef.value;
      LINES.forEach(l => {
        const toReturn = [];
        const remaining = [];
        gameState.field[l][resolvedTarget].forEach(c => {
          if (!c.faceDown && c.card.valor === targetValue) {
            toReturn.push(c);
          } else {
            remaining.push(c);
          }
        });
        gameState.field[l][resolvedTarget] = remaining;
        toReturn.forEach(c => gameState[resolvedTarget].hand.push(c.card));
      });
      processAbilityEffect();
      break;
    }

    case 'revealAndReturn': {
      // Reveal a face-down opponent card and return it to their hand
      if (targetPlayer === 'player') {
        // Use startEffect to let player pick a face-down opponent card to return
        startEffect('return', resolvedTarget, count || 1);
      } else {
        // AI: find player face-down cards and return one
        const validLines = LINES.filter(l => gameState.field[l][resolvedTarget].some(c => c.faceDown));
        if (validLines.length > 0) {
          const l = validLines[Math.floor(Math.random() * validLines.length)];
          const faceDownIdx = gameState.field[l][resolvedTarget].findLastIndex(c => c.faceDown);
          if (faceDownIdx >= 0) {
            const cardObj = gameState.field[l][resolvedTarget].splice(faceDownIdx, 1)[0];
            gameState[resolvedTarget].hand.push(cardObj.card);
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'preventOpponentCompile': {
      // Block opponent's compile for nextTurns turns
      const turns = actionDef.nextTurns || 1;
      gameState.preventCompile[resolvedTarget] = (gameState.preventCompile[resolvedTarget] || 0) + turns;
      processAbilityEffect();
      break;
    }

    case 'discardMulti': {
      // Force target to discard N cards — interactive for player, random for AI
      if (resolvedTarget === 'player') {
        startEffect('discard', 'player', count || 1);
      } else {
        discard('ai', count || 1);
        processAbilityEffect();
      }
      break;
    }

    case 'playCard': {
      // Let the current player play one more card immediately
      if (targetPlayer === 'player') {
        gameState.pendingPlayCard = true;
        updateStatus('¡JUEGA otra carta ahora!');
      } else {
        // AI plays a random card from hand if available
        if (gameState.ai.hand.length > 0) {
          const cardIdx = Math.floor(Math.random() * gameState.ai.hand.length);
          const validLines = LINES.filter(l => !gameState.field[l].compiledBy);
          if (validLines.length > 0) {
            const line = validLines[Math.floor(Math.random() * validLines.length)];
            const movedCard = gameState.ai.hand.splice(cardIdx, 1)[0];
            gameState.field[line].ai.push({ card: movedCard, faceDown: false });
            gameState.currentEffectLine = line;
            if (typeof executeNewEffect === 'function') executeNewEffect(movedCard, 'ai');
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'playTopDeck': {
      // Take top card from own deck and place in current line (face up or face down)
      const line = gameState.currentEffectLine;
      const faceUp = actionDef.faceUp !== false;
      if (line && gameState[targetPlayer].deck.length > 0) {
        const topCard = gameState[targetPlayer].deck.pop();
        gameState.field[line][targetPlayer].push({ card: topCard, faceDown: !faceUp });
        if (faceUp && typeof executeNewEffect === 'function') {
          executeNewEffect(topCard, targetPlayer);
        } else {
          processAbilityEffect();
        }
      } else {
        processAbilityEffect();
      }
      break;
    }

    case 'playTopDeckFaceDownOtherLines': {
      // Place top deck card face-down in each other line (not current)
      const currentLine = gameState.currentEffectLine;
      const otherLines = LINES.filter(l => l !== currentLine);
      otherLines.forEach(l => {
        if (gameState[targetPlayer].deck.length > 0) {
          const topCard = gameState[targetPlayer].deck.pop();
          gameState.field[l][targetPlayer].push({ card: topCard, faceDown: true });
        }
      });
      processAbilityEffect();
      break;
    }

    case 'revealOpponentHand': {
      // Show opponent hand to the player
      if (targetPlayer === 'player') {
        const hand = gameState.ai.hand;
        const names = hand.map(c => `${c.nombre} (${c.valor})`).join(', ');
        updateStatus(`Mano rival: ${names || '(vacía)'}`);
        // Keep message for 4 seconds then continue
        setTimeout(() => processAbilityEffect(), 4000);
      } else {
        // AI already "knows" all cards
        processAbilityEffect();
      }
      break;
    }

    case 'revealTopDeck': {
      // Look at top card of deck; if ifMatchProtocol draw it
      if (gameState[targetPlayer].deck.length === 0) { processAbilityEffect(); break; }
      const topCard = gameState[targetPlayer].deck[gameState[targetPlayer].deck.length - 1];
      if (actionDef.ifMatchProtocol && gameState[targetPlayer].protocols.includes(topCard.protocol)) {
        // Draw it
        gameState[targetPlayer].deck.pop();
        gameState[targetPlayer].hand.push(topCard);
        updateStatus(`¡Carta revelada del mazo: ${topCard.nombre} — robada!`);
      } else {
        updateStatus(`Carta revelada del mazo: ${topCard.nombre} — devuelta.`);
      }
      processAbilityEffect();
      break;
    }

    case 'flipAndDrawByValue': {
      // Flip a card, then draw cards equal to its value
      // Push a deferred draw action, then start the flip
      gameState.effectQueue.unshift({ effect: { action: '_drawByFlippedValue' }, targetPlayer });
      if (targetPlayer === 'player') {
        startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
      } else {
        // AI flips a random card
        const validLines = LINES.filter(l => gameState.field[l][resolvedTarget === 'any' ? 'player' : resolvedTarget].length > 0);
        if (validLines.length > 0) {
          const l = validLines[Math.floor(Math.random() * validLines.length)];
          const actualTarget = resolvedTarget === 'any' ? 'player' : resolvedTarget;
          const stack = gameState.field[l][actualTarget];
          const cardObj = stack[stack.length - 1];
          gameState.lastFlippedCard = { cardObj, line: l };
          cardObj.faceDown = !cardObj.faceDown;
        }
        processAbilityEffect();
      }
      break;
    }

    case '_drawByFlippedValue': {
      // Internal: draw cards equal to the last flipped card's value
      if (gameState.lastFlippedCard) {
        const val = gameState.lastFlippedCard.cardObj.card.valor || 0;
        draw(targetPlayer, val);
      }
      processAbilityEffect();
      break;
    }

    case 'flipAndDrawPerFaceDown': {
      // Flip a card, then draw 1 per face-down card in its line
      gameState.effectQueue.unshift({ effect: { action: '_drawByFaceDownCount' }, targetPlayer });
      if (targetPlayer === 'player') {
        startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
      } else {
        const actualTarget = resolvedTarget === 'any' ? 'player' : resolvedTarget;
        const validLines = LINES.filter(l => gameState.field[l][actualTarget].length > 0);
        if (validLines.length > 0) {
          const l = validLines[Math.floor(Math.random() * validLines.length)];
          const stack = gameState.field[l][actualTarget];
          const cardObj = stack[stack.length - 1];
          gameState.lastFlippedCard = { cardObj, line: l };
          cardObj.faceDown = !cardObj.faceDown;
        }
        processAbilityEffect();
      }
      break;
    }

    case '_drawByFaceDownCount': {
      // Internal: draw 1 per face-down card in the last flipped card's line
      if (gameState.lastFlippedCard) {
        const { line } = gameState.lastFlippedCard;
        const faceDownCount = [...gameState.field[line].player, ...gameState.field[line].ai].filter(c => c.faceDown).length;
        draw(targetPlayer, faceDownCount);
      }
      processAbilityEffect();
      break;
    }

    case 'moveAllFaceDownCards': {
      // Move all self face-down cards in current line to another line
      const sourceLine = gameState.currentEffectLine;
      if (!sourceLine) { processAbilityEffect(); break; }
      const hasFaceDown = gameState.field[sourceLine][targetPlayer].some(c => c.faceDown);
      if (!hasFaceDown) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        // Let player pick destination line
        gameState.effectContext = { type: 'moveAllFaceDown', sourceLine, owner: 'player', selected: [], count: 1 };
        gameState.effectContext.waitingForLine = true;
        updateStatus('Elige la línea destino para mover tus cartas bocabajo');
        highlightSelectableLines();
      } else {
        // AI picks a random other line
        const others = LINES.filter(l => l !== sourceLine);
        const dest = others[Math.floor(Math.random() * others.length)];
        const toMove = gameState.field[sourceLine].ai.filter(c => c.faceDown);
        gameState.field[sourceLine].ai = gameState.field[sourceLine].ai.filter(c => !c.faceDown);
        toMove.forEach(c => gameState.field[dest].ai.push(c));
        processAbilityEffect();
      }
      break;
    }

    case 'ignoreOtherEffects': {
      // Mark current line to suppress other effects this turn
      const line = gameState.currentEffectLine;
      if (line) gameState.ignoreEffectsLines[line] = true;
      processAbilityEffect();
      break;
    }

    case 'maySwapOrFlip': {
      // Player chooses: swap a card or flip a card
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = '¿Qué quieres hacer? SÍ = Intercambiar carta · NO = Voltear carta';
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            startEffect('swap', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
          };
        } else {
          startEffect('flip', resolvedTarget, count || 1);
        }
      } else {
        // AI: pick whichever is more beneficial — random for now
        const aiAction = Math.random() > 0.5 ? 'swap' : 'flip';
        resolveAbilityAction({ action: aiAction, target, count }, targetPlayer);
      }
      break;
    }

    case 'mayReturnAndFlip': {
      // Optionally return 1 opponent card, then flip 1 card
      if (targetPlayer === 'player') {
        // Push flip as next effect in queue, then do return
        gameState.effectQueue.unshift({
          effect: { action: 'flip', target: 'any', count: 1 },
          targetPlayer
        });
        startEffect('return', resolvedTarget, count || 1);
      } else {
        // AI auto: return random opponent card, then flip random
        if (gameState.field[gameState.currentEffectLine || 'centro'][resolvedTarget].length > 0) {
          const l = gameState.currentEffectLine || LINES.find(l => gameState.field[l][resolvedTarget].length > 0);
          if (l) {
            const cardObj = gameState.field[l][resolvedTarget].pop();
            gameState[resolvedTarget].hand.push(cardObj.card);
          }
        }
        // Then flip
        resolveAbilityAction({ action: 'flip', target: 'any', count: 1 }, targetPlayer);
      }
      break;
    }

    case 'deleteSelfIfCovered': {
      // Vida 0 errata: at end of turn, if this card is covered (not the top of its stack), eliminate it
      const line = gameState.currentEffectLine;
      if (line) {
        const stack = gameState.field[line][targetPlayer];
        // Eliminate any Vida 0 cards that are covered (not at the top of the stack)
        for (let i = stack.length - 2; i >= 0; i--) {
          if (stack[i].card.nombre === 'Vida 0' && !stack[i].faceDown) {
            const [removed] = stack.splice(i, 1);
            gameState[targetPlayer].trash.push(removed.card);
          }
        }
      }
      processAbilityEffect();
      break;
    }

    case 'optionalDrawThenDelete': {
      // Muerte 1 errata: optionally draw 1 → if you do, delete 1 opponent card → then delete self
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = '¿Robas 1 carta? (Si lo haces, elimina 1 carta rival y luego esta carta se destruye)';
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            draw(targetPlayer, 1);
            // Queue: delete opponent, then delete self
            gameState.effectQueue.unshift(
              { effect: { action: '_deleteSelf' }, targetPlayer },
              { effect: { action: actionDef.ifThenAction || 'delete', target: actionDef.ifThenTarget || 'opponent', count: actionDef.ifThenCount || 1 }, targetPlayer }
            );
            processAbilityEffect();
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // AI: draw if hand is small, then delete + self-destruct
        if (gameState.ai.hand.length < 3 && gameState.ai.deck.length > 0) {
          draw('ai', 1);
          resolveAbilityAction({ action: actionDef.ifThenAction || 'delete', target: actionDef.ifThenTarget || 'opponent', count: actionDef.ifThenCount || 1 }, targetPlayer);
          // Self-destruct: find and remove Muerte 1 from AI field
          LINES.forEach(l => {
            gameState.field[l].ai = gameState.field[l].ai.filter(c => {
              if (c.card.nombre === 'Muerte 1') { gameState.ai.trash.push(c.card); return false; }
              return true;
            });
          });
        } else {
          processAbilityEffect();
        }
      }
      break;
    }

    case '_deleteSelf': {
      // Internal: find and remove the Muerte 1 card that triggered this effect
      LINES.forEach(l => {
        gameState.field[l][targetPlayer] = gameState.field[l][targetPlayer].filter(c => {
          if (c.card.nombre === 'Muerte 1') { gameState[targetPlayer].trash.push(c.card); return false; }
          return true;
        });
      });
      processAbilityEffect();
      break;
    }

    case 'flipAllUncovered': {
      // Plaga 3 middle: flip each OTHER uncovered card (not covered ones)
      // "other" = all lines, all players' top cards except those already face-down
      LINES.forEach(l => {
        ['player', 'ai'].forEach(p => {
          const stack = gameState.field[l][p];
          if (stack.length > 0) {
            const topCard = stack[stack.length - 1];
            if (!topCard.faceDown) {
              topCard.faceDown = true; // flip face-down the uncovered (top) cards
            }
          }
        });
      });
      processAbilityEffect();
      break;
    }

    case 'deleteHighestUncovered': {
      // Odio 2: delete own highest-value uncovered card, then delete opponent's highest
      // If Odio 2 itself is the highest, it self-destructs and second effect doesn't fire
      const findHighestUncovered = (player) => {
        let best = null, bestLine = null, bestIdx = -1;
        LINES.forEach(l => {
          const stack = gameState.field[l][player];
          if (stack.length === 0) return;
          const top = stack[stack.length - 1];
          if (!top.faceDown && (!best || top.card.valor > best.card.valor)) {
            best = top; bestLine = l; bestIdx = stack.length - 1;
          }
        });
        return { card: best, line: bestLine, idx: bestIdx };
      };

      const selfHighest = findHighestUncovered(targetPlayer);
      if (!selfHighest.card) { processAbilityEffect(); break; }

      const isSelf = selfHighest.card.card.nombre === 'Odio 2';
      gameState.field[selfHighest.line][targetPlayer].splice(selfHighest.idx, 1);
      gameState[targetPlayer].trash.push(selfHighest.card.card);

      if (!isSelf) {
        // Second effect: delete opponent's highest uncovered card
        const oppHighest = findHighestUncovered(opponent);
        if (oppHighest.card) {
          gameState.field[oppHighest.line][opponent].splice(oppHighest.idx, 1);
          gameState[opponent].trash.push(oppHighest.card.card);
        }
      }
      processAbilityEffect();
      break;
    }

    // -----------------------------------------------------------------------
    // NUEVOS CASES (extraídos de revisión de cartas escaneadas)
    // -----------------------------------------------------------------------

    case 'drawIfCovering': {
      // Vida 4: roba si esta carta está cubriendo otra (no es la única en la pila)
      const line = gameState.currentEffectLine;
      if (line) {
        const stack = gameState.field[line][targetPlayer];
        if (stack.length >= 2) draw(targetPlayer, actionDef.count || 1);
      }
      processAbilityEffect();
      break;
    }

    case 'playTopDeckAllLines': {
      // Vida 0: en cada línea donde el jugador tenga al menos 1 carta,
      // juega bocabajo la carta superior del mazo
      const faceDown = actionDef.faceDown !== false;
      LINES.forEach(l => {
        if (gameState.field[l][targetPlayer].length > 0 && gameState[targetPlayer].deck.length > 0) {
          const top = gameState[targetPlayer].deck.pop();
          gameState.field[l][targetPlayer].push({ card: top, faceDown });
        }
      });
      processAbilityEffect();
      break;
    }

    case 'optionalDiscardOrFlipSelf': {
      // Espíritu 1: el jugador elige descartar 1 carta O voltear esta carta
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = '¿Qué quieres hacer? SÍ = Descarta 1 carta · NO = Voltea esta carta';
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            startEffect('discard', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            // Voltear la carta de Espíritu 1 en campo
            const line = gameState.currentEffectLine;
            if (line) {
              const stack = gameState.field[line][targetPlayer];
              const top = stack[stack.length - 1];
              if (top) top.faceDown = !top.faceDown;
            }
            updateUI();
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA: descarta si tiene cartas
        if (gameState.ai.hand.length > 0) discard('ai', 1);
        processAbilityEffect();
      }
      break;
    }

    case 'discardForDraw': {
      // Fuego 4: descarta N cartas (a elección), luego roba N+1
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = '¿Cuántas cartas descartas? SÍ = 1 carta · NO = todas las de tu mano';
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectQueue.unshift({ effect: { action: '_drawAfterDiscard', discarded: 1 }, targetPlayer });
            startEffect('discard', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            const n = gameState.player.hand.length;
            gameState.effectQueue.unshift({ effect: { action: '_drawAfterDiscard', discarded: n }, targetPlayer });
            startEffect('discard', 'player', n);
          };
        } else {
          processAbilityEffect();
        }
      } else {
        const n = Math.max(1, Math.floor(gameState.ai.hand.length / 2));
        discard('ai', n);
        draw('ai', n + 1);
        processAbilityEffect();
      }
      break;
    }

    case '_drawAfterDiscard': {
      const n = actionDef.discarded || 0;
      draw(targetPlayer, n + 1);
      processAbilityEffect();
      break;
    }

    case 'optionalSwapThenFlipSelf': {
      // Velocidad 3 Final: puedes cambiar 1 carta tuya; si lo haces, voltea esta carta
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = '¿Cambias 1 de tus cartas? (Se volteará Velocidad 3 si lo haces)';
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            // After swap, flip self
            gameState.effectQueue.unshift({ effect: { action: 'flip', target: 'self', count: 1 }, targetPlayer });
            startEffect('swap', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        if (Math.random() > 0.5) {
          resolveAbilityAction({ action: 'swap', target: 'self', count: 1 }, targetPlayer);
        } else {
          processAbilityEffect();
        }
      }
      break;
    }

    case 'moveOpponentFaceDown': {
      // Velocidad 4: cambia 1 carta bocabajo del oponente a otra línea
      // Reutilizamos shift pero filtrado a faceDown — por ahora delegamos a shift opponent
      startEffect('shift', opponent, count || 1);
      break;
    }

    case 'shiftCovered': {
      // Oscuridad 0: cambia 1 carta cubierta del oponente (no la del tope)
      if (targetPlayer === 'player') {
        // Por ahora usar shift normal — el jugador elige
        startEffect('shift', resolvedTarget, count || 1);
      } else {
        // IA: mover carta cubierta aleatoria del jugador
        const validLines = LINES.filter(l => gameState.field[l].player.length >= 2);
        if (validLines.length > 0) {
          const l = validLines[Math.floor(Math.random() * validLines.length)];
          const coveredIdx = Math.floor(Math.random() * (gameState.field[l].player.length - 1));
          const [cardObj] = gameState.field[l].player.splice(coveredIdx, 1);
          const dest = LINES.filter(x => x !== l)[Math.floor(Math.random() * 2)];
          gameState.field[dest].player.push(cardObj);
        }
        processAbilityEffect();
      }
      break;
    }

    case 'mayFlipCovered': {
      // Oscuridad 2: voltea 1 carta cubierta de esta línea (opcional)
      const line = gameState.currentEffectLine;
      if (targetPlayer === 'player') {
        if (line && gameState.field[line][targetPlayer].length >= 2) {
          startEffect('flip', targetPlayer, 1);
        } else {
          processAbilityEffect();
        }
      } else {
        if (line && gameState.field[line].ai.length >= 2) {
          const coveredIdx = Math.floor(Math.random() * (gameState.field[line].ai.length - 1));
          gameState.field[line].ai[coveredIdx].faceDown = !gameState.field[line].ai[coveredIdx].faceDown;
        }
        processAbilityEffect();
      }
      break;
    }

    case 'playHandFaceDown': {
      // Oscuridad 3: juega 1 carta de tu mano bocabajo en otra línea
      if (targetPlayer === 'player') {
        gameState.pendingPlayCard = true;
        gameState.selectionModeFaceUp = false; // fuerza bocabajo
        updateStatus('Elige una carta y una línea diferente para jugarla bocabajo');
      } else {
        if (gameState.ai.hand.length > 0) {
          const cardIdx = Math.floor(Math.random() * gameState.ai.hand.length);
          const currentLine = gameState.currentEffectLine;
          const others = LINES.filter(l => l !== currentLine);
          const dest = others[Math.floor(Math.random() * others.length)];
          const movedCard = gameState.ai.hand.splice(cardIdx, 1)[0];
          gameState.field[dest].ai.push({ card: movedCard, faceDown: true });
        }
        processAbilityEffect();
      }
      break;
    }

    case 'shiftFaceDown': {
      // Oscuridad 4: cambia 1 carta bocabajo de cualquier lugar
      startEffect('shift', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
      break;
    }

    case 'discardForOpponentMore': {
      // Plaga 2: descarta N cartas; el oponente descarta N+1
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = '¿Cuántas cartas descartas? SÍ = 1 · NO = todas tus cartas';
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectQueue.unshift({ effect: { action: '_discardOpponentMore', discarded: 1 }, targetPlayer });
            startEffect('discard', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            const n = gameState.player.hand.length;
            gameState.effectQueue.unshift({ effect: { action: '_discardOpponentMore', discarded: n }, targetPlayer });
            startEffect('discard', 'player', n);
          };
        } else {
          processAbilityEffect();
        }
      } else {
        const n = Math.max(1, Math.floor(gameState.ai.hand.length / 2));
        discard('ai', n);
        discard('player', n + 1);
        processAbilityEffect();
      }
      break;
    }

    case '_discardOpponentMore': {
      const n = actionDef.discarded || 0;
      discard(opponent, n + 1);
      processAbilityEffect();
      break;
    }

    case 'flipAllFaceUp': {
      // Plaga 3: voltea cada carta bocarriba descubierta fuera de esta línea (face-up → face-down)
      const currentLine = gameState.currentEffectLine;
      LINES.forEach(l => {
        if (l === currentLine) return;
        ['player', 'ai'].forEach(p => {
          const stack = gameState.field[l][p];
          if (stack.length > 0) {
            const top = stack[stack.length - 1];
            if (!top.faceDown) top.faceDown = true;
          }
        });
      });
      processAbilityEffect();
      break;
    }

    case 'forceOpponentDeleteFaceDown': {
      // Plaga 4: el oponente debe eliminar 1 de sus cartas bocabajo
      if (targetPlayer === 'player') {
        // El jugador elige qué carta bocabajo del oponente eliminar
        startEffect('eliminate', opponent, count || 1);
      } else {
        // IA: elimina una carta bocabajo del jugador aleatoriamente
        const validLines = LINES.filter(l => gameState.field[l].player.some(c => c.faceDown));
        if (validLines.length > 0) {
          const l = validLines[Math.floor(Math.random() * validLines.length)];
          const fdIdx = gameState.field[l].player.findIndex(c => c.faceDown);
          if (fdIdx >= 0) {
            const [removed] = gameState.field[l].player.splice(fdIdx, 1);
            gameState.player.trash.push(removed.card);
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'deleteFromEachOtherLine': {
      // Muerte 0: elimina 1 carta de cada una de las otras líneas
      const currentLine = gameState.currentEffectLine;
      const otherLines = LINES.filter(l => l !== currentLine);
      if (targetPlayer === 'player') {
        // Encola una eliminación por cada línea distinta
        otherLines.reverse().forEach(l => {
          gameState.effectQueue.unshift({
            effect: { action: 'delete', target: 'any', count: 1 },
            targetPlayer,
            cardName: 'Muerte 0',
            _forceLine: l
          });
        });
        processAbilityEffect();
      } else {
        otherLines.forEach(l => {
          ['player', 'ai'].forEach(p => {
            if (gameState.field[l][p].length > 0) {
              const removed = gameState.field[l][p].pop();
              gameState[p].trash.push(removed.card);
            }
          });
        });
        processAbilityEffect();
      }
      break;
    }

    case 'deleteAllValueRange': {
      // Muerte 2: elimina todas las cartas con valor en [minVal, maxVal] de 1 línea
      if (targetPlayer === 'player') {
        startEffect('eliminate', 'any', 99); // UI deja eliminar — mejora pendiente: filtrar por valor
      } else {
        const min = actionDef.minVal || 1;
        const max = actionDef.maxVal || 2;
        const validLine = LINES.find(l =>
          [...gameState.field[l].player, ...gameState.field[l].ai].some(c => !c.faceDown && c.card.valor >= min && c.card.valor <= max)
        );
        if (validLine) {
          ['player', 'ai'].forEach(p => {
            const toKeep = [];
            gameState.field[validLine][p].forEach(c => {
              if (!c.faceDown && c.card.valor >= min && c.card.valor <= max) {
                gameState[p].trash.push(c.card);
              } else {
                toKeep.push(c);
              }
            });
            gameState.field[validLine][p] = toKeep;
          });
        }
        processAbilityEffect();
      }
      break;
    }

    case 'playTopDeckBelowPerPair': {
      // Gravedad 0: por cada 2 cartas en esta línea, inserta 1 del mazo bocabajo BAJO la carta actual
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      const stack = gameState.field[line][targetPlayer];
      const pairs = Math.floor(stack.length / 2);
      for (let i = 0; i < pairs; i++) {
        if (gameState[targetPlayer].deck.length > 0) {
          const top = gameState[targetPlayer].deck.pop();
          // Insertar debajo de la carta actual (posición antes del último elemento)
          stack.splice(stack.length - 1, 0, { card: top, faceDown: true });
        }
      }
      processAbilityEffect();
      break;
    }

    case 'flipAndShiftToLine': {
      // Gravedad 2: voltea 1 carta y luego muévela a esta línea
      const destLine = gameState.currentEffectLine;
      gameState.effectQueue.unshift({ effect: { action: '_shiftLastFlippedToLine', destLine }, targetPlayer });
      if (targetPlayer === 'player') {
        startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
      } else {
        const validLines = LINES.filter(l => l !== destLine && gameState.field[l][opponent].length > 0);
        if (validLines.length > 0) {
          const l = validLines[Math.floor(Math.random() * validLines.length)];
          const stack = gameState.field[l][opponent];
          const cardObj = stack[stack.length - 1];
          gameState.lastFlippedCard = { cardObj, line: l };
          cardObj.faceDown = !cardObj.faceDown;
        }
        processAbilityEffect();
      }
      break;
    }

    case '_shiftLastFlippedToLine': {
      if (gameState.lastFlippedCard) {
        const { cardObj, line: srcLine } = gameState.lastFlippedCard;
        const destLine = actionDef.destLine || gameState.currentEffectLine;
        if (srcLine && destLine && srcLine !== destLine) {
          const srcStack = gameState.field[srcLine];
          ['player', 'ai'].forEach(p => {
            const idx = srcStack[p].indexOf(cardObj);
            if (idx >= 0) {
              srcStack[p].splice(idx, 1);
              gameState.field[destLine][p].push(cardObj);
            }
          });
        }
      }
      processAbilityEffect();
      break;
    }

    case 'shiftFaceDownToLine': {
      // Gravedad 4: mueve 1 carta bocabajo desde otra línea a esta
      const destLine = gameState.currentEffectLine;
      if (targetPlayer === 'player') {
        startEffect('shift', 'any', 1);
      } else {
        const srcLines = LINES.filter(l => l !== destLine && gameState.field[l].ai.some(c => c.faceDown));
        if (srcLines.length > 0) {
          const l = srcLines[Math.floor(Math.random() * srcLines.length)];
          const fdIdx = gameState.field[l].ai.findIndex(c => c.faceDown);
          if (fdIdx >= 0 && destLine) {
            const [moved] = gameState.field[l].ai.splice(fdIdx, 1);
            gameState.field[destLine].ai.push(moved);
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'forceOpponentPlayTopDeck': {
      // Gravedad 6: el oponente juega bocabajo la carta superior de su mazo en esta línea
      const destLine = gameState.currentEffectLine;
      if (destLine && gameState[opponent].deck.length > 0) {
        const top = gameState[opponent].deck.pop();
        gameState.field[destLine][opponent].push({ card: top, faceDown: true });
      }
      processAbilityEffect();
      break;
    }

    case 'flipAllFaceUpInLine': {
      // Apatía 1: voltea todas las demás cartas bocarriba en esta línea
      const line = gameState.currentEffectLine;
      if (line) {
        ['player', 'ai'].forEach(p => {
          const stack = gameState.field[line][p];
          stack.forEach((cardObj, idx) => {
            // "otras cartas" = todas excepto la última jugada (top actual si es el activador)
            if (!cardObj.faceDown) cardObj.faceDown = true;
          });
          // La carta recién jugada (top) se deja bocarriba si fue jugada bocarriba
          if (stack.length > 0 && p === targetPlayer) {
            stack[stack.length - 1].faceDown = false;
          }
        });
      }
      processAbilityEffect();
      break;
    }

    case 'flipSelf': {
      // Apatía 2 onCover: voltea esta carta cuando se cubre
      const line = gameState.currentEffectLine;
      if (line) {
        const stack = gameState.field[line][targetPlayer];
        // La carta cubierta es la segunda desde arriba (justo se acaba de cubrir)
        if (stack.length >= 2) {
          const coveredCard = stack[stack.length - 2];
          coveredCard.faceDown = !coveredCard.faceDown;
        }
      }
      processAbilityEffect();
      break;
    }

    case 'deleteLowestCoveredInLine': {
      // Odio 4 onCover: elimina la carta cubierta de menor valor en esta línea
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      // Buscar en ambos lados la carta cubierta de menor valor
      let lowest = null, lowestPlayer = null, lowestIdx = -1;
      ['player', 'ai'].forEach(p => {
        const stack = gameState.field[line][p];
        // cartas cubiertas = todas excepto la última (top)
        for (let i = 0; i < stack.length - 1; i++) {
          if (!lowest || stack[i].card.valor < lowest.card.valor) {
            lowest = stack[i]; lowestPlayer = p; lowestIdx = i;
          }
        }
      });
      if (lowest) {
        gameState.field[line][lowestPlayer].splice(lowestIdx, 1);
        gameState[lowestPlayer].trash.push(lowest.card);
      }
      processAbilityEffect();
      break;
    }

    case 'drawFromOpponentDeck': {
      // Amor 1: roba la carta superior del mazo del oponente (va a tu mano)
      if (gameState[opponent].deck.length > 0) {
        const top = gameState[opponent].deck.pop();
        gameState[targetPlayer].hand.push(top);
      }
      processAbilityEffect();
      break;
    }

    case 'mayGiveCardForDraw': {
      // Amor 1 Final: puedes dar 1 carta de tu mano; si lo haces, roba N cartas
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) { processAbilityEffect(); break; }
        gameState.effectQueue.unshift({ effect: { action: '_drawAfterGive', count }, targetPlayer });
        showConfirm('¿Das 1 carta a tu oponente para robar ' + (count || 2) + ' cartas?', () => {
          startEffect('give', 'player', 1); // mano→mano del rival
        }, () => {
          gameState.effectQueue.shift(); // cancelar el draw
          processAbilityEffect();
        });
      } else {
        // IA: dar si tiene ventaja en mano
        if (gameState.ai.hand.length > 3 && gameState.ai.hand.length > 0) {
          const given = gameState.ai.hand.splice(Math.floor(Math.random() * gameState.ai.hand.length), 1)[0];
          gameState.player.hand.push(given); // mano→mano del jugador
          draw('ai', count || 2);
        }
        processAbilityEffect();
      }
      break;
    }

    case '_drawAfterGive': {
      // Amor 1: tras dar carta, roba N
      draw(targetPlayer, count || 2);
      processAbilityEffect();
      break;
    }

    case 'takeRandomFromOpponent': {
      // Amor 3: toma 1 carta aleatoria de la mano del oponente
      if (gameState[opponent].hand.length > 0) {
        const idx = Math.floor(Math.random() * gameState[opponent].hand.length);
        const [taken] = gameState[opponent].hand.splice(idx, 1);
        gameState[targetPlayer].hand.push(taken);
      }
      processAbilityEffect();
      break;
    }

    case 'giveCardToOpponent': {
      // Amor 3: da 1 carta de tu mano al oponente (mano→mano)
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) { processAbilityEffect(); break; }
        startEffect('give', 'player', 1);
      } else {
        if (gameState.ai.hand.length > 0) {
          const idx = Math.floor(Math.random() * gameState.ai.hand.length);
          const [given] = gameState.ai.hand.splice(idx, 1);
          gameState.player.hand.push(given);
        }
        processAbilityEffect();
      }
      break;
    }

    case 'revealFromHand': {
      // Amor 4: revela 1 carta de tu mano (efecto informativo; sin impacto en estado)
      // Para el jugador: mostrar confirmación; para la IA: no-op
      processAbilityEffect();
      break;
    }

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
 * Aplica modificadores persistentes al cálculo de valor.
 * Retorna el modificador neto: positivo = reducción, negativo = bono al score.
 */
function applyPersistentValueModifiers(state, line, player) {
  const opponent = player === 'player' ? 'ai' : 'player';
  let totalReduction = 0;
  let totalBonus = 0;

  // Reducciones: cartas del oponente en esta línea (ej: Metal 0)
  state.field[line][opponent].forEach(cardObj => {
    const modifiers = getPersistentModifiers(cardObj.card, line);
    if (modifiers.valueReduction) {
      totalReduction += modifiers.valueReduction;
    }
  });

  // Bonos: cartas propias bocarriba en esta línea (ej: Apatía 0)
  state.field[line][player].forEach(cardObj => {
    if (!cardObj.faceDown) {
      const effectDef = CARD_EFFECTS[cardObj.card.nombre];
      if (effectDef && effectDef.persistent && effectDef.persistent.valueBonusPerFaceDown) {
        // Contar cartas bocabajo en toda la línea (ambos lados)
        const faceDownCount =
          state.field[line].player.filter(c => c.faceDown).length +
          state.field[line].ai.filter(c => c.faceDown).length;
        totalBonus += effectDef.persistent.valueBonusPerFaceDown * faceDownCount;
      }
    }
  });

  // Retorna reducción neta; si es negativo, calculateScore lo interpreta como bono
  return totalReduction - totalBonus;
}

// ============================================================================
// 5. INTEGRACIÓN CON LOGIC.JS
// ============================================================================

/**
 * Comprueba si alguna carta bocarriba en la línea tiene ignoreMiddleCommands activo (Apatía 2)
 */
function lineHasIgnoreMiddleCommands(line) {
  if (!line) return false;
  return ['player', 'ai'].some(p =>
    gameState.field[line][p].some(cardObj => {
      if (cardObj.faceDown) return false;
      const ef = CARD_EFFECTS[cardObj.card.nombre];
      return ef && ef.persistent && ef.persistent.ignoreMiddleCommands;
    })
  );
}

/**
 * Reemplaza executeEffect() en logic.js
 * Ahora usa el motor de habilidades en lugar de parsear texto
 */
function executeNewEffect(card, targetPlayer) {
  const line = gameState.currentEffectLine;
  // Apatía 2: ignora comandos de acción (onPlay/middle zone) en esta línea
  if (lineHasIgnoreMiddleCommands(line)) {
    console.log(`⛔ Apatía 2 activa en ${line} — onPlay de ${card.nombre} ignorado`);
    updateUI();
    return;
  }
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
    if (gameState.ignoreEffectsLines && gameState.ignoreEffectsLines[line]) return;
    gameState.currentEffectLine = line;
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
    if (gameState.ignoreEffectsLines && gameState.ignoreEffectsLines[line]) return;
    gameState.currentEffectLine = line;
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
function calculateScoreWithModifiers(state, line, player) {
  const opponent = player === 'player' ? 'ai' : 'player';
  let score = 0;

  // Sumar valores base
  state.field[line][player].forEach(cardObj => {
    if (!cardObj.faceDown) {
      score += cardObj.card.valor;
    } else {
      score += 2; // Cartas bocabajo siempre valen 2
    }
  });

  // Aplicar modificadores persistentes del oponente
  const reduction = applyPersistentValueModifiers(state, line, player);
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
  window.hasAllowAnyProtocol = hasAllowAnyProtocol;
}

/**
 * Devuelve true si alguna carta del jugador con persistent.allowAnyProtocol está descubierta en campo.
 * ERRATA Espíritu 1: mientras esté bocarriba y descubierta, sus cartas bocarriba pueden jugarse en cualquier línea.
 */
function hasAllowAnyProtocol(player) {
  return LINES.some(line => {
    const stack = gameState.field[line][player];
    if (stack.length === 0) return false;
    const top = stack[stack.length - 1];
    if (top.faceDown) return false;
    const effectDef = CARD_EFFECTS[top.card.nombre];
    return effectDef && effectDef.persistent && effectDef.persistent.allowAnyProtocol;
  });
}
