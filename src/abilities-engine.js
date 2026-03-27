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
    persistent: { allowAnyProtocol: true },
    onPlay: [
      { action: 'draw', target: 'self', count: 2 }
    ],
    onTurnEnd: [
      { action: 'optionalDiscardOrFlipSelf', target: 'self' }
    ]
  },

  'Espíritu 2': {
    onPlay: [
      { action: 'mayFlip', target: 'any', count: 1 }
    ]
  },

  'Espíritu 3': {
    onTurnStart: [
      { action: 'mayShiftSelf', condition: 'drawnSinceLastCheck' }
    ]
  },

  'Espíritu 4': {
    onPlay: [
      { action: 'rearrangeProtocols', target: 'self' }
    ]
  },

  'Espíritu 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== MUERTE ==========
  'Muerte 0': {
    onPlay: [
      { action: 'deleteFromEachOtherLine', target: 'any', count: 1 }
    ]
  },

  // ERRATA (10/2024): "Inicial: Puedes robar 1 carta. Si lo haces, elimina otra carta y, luego, elimina esta carta."
  'Muerte 1': {
    persistent: { immobile: true },
    onTurnStart: [
      { action: 'optionalDrawThenDelete', target: 'self', ifThenAction: 'delete', ifThenTarget: 'any', ifThenCount: 1, thenSelf: true }
    ]
  },

  'Muerte 2': {
    onPlay: [
      { action: 'deleteAllValueRange', target: 'any', minVal: 1, maxVal: 2 }
    ]
  },

  'Muerte 3': {
    onPlay: [
      { action: 'delete', target: 'any', count: 1, filter: 'faceDown' }
    ]
  },

  'Muerte 4': {
    onPlay: [
      { action: 'delete', target: 'any', count: 1, filter: 'maxValue', maxVal: 1 }
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
      { action: 'flip', target: 'any', count: 1, excludeSelf: true },
      { action: 'draw', target: 'self', count: 2 }
    ],
    onCover: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'flip', target: 'any', count: 1, excludeSelf: true }
    ]
  },

  'Fuego 1': {
    onPlay: [
      { action: 'discardThen', target: 'self', count: 1, ifThenAction: 'delete', ifThenTarget: 'any', ifThenCount: 1 }
    ]
  },

  'Fuego 2': {
    onPlay: [
      { action: 'discardThen', target: 'self', count: 1, ifThenAction: 'return', ifThenTarget: 'any', ifThenCount: 1 }
    ]
  },

  'Fuego 3': {
    onTurnEnd: [
      { action: 'optionalDiscard', target: 'self', count: 1, ifThenAction: 'flip', ifThenTarget: 'any', ifThenCount: 1 }
    ]
  },

  'Fuego 4': {
    onPlay: [
      { action: 'discardForDraw', target: 'self' }
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
      { action: 'playTopDeckBelowPerPair', target: 'self' }
    ]
  },

  'Gravedad 1': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'shift', target: 'any', count: 1, gravityConstraint: true }
    ]
  },

  'Gravedad 2': {
    onPlay: [
      { action: 'flipAndShiftToLine', target: 'any', count: 1 }
    ]
  },

  'Gravedad 4': {
    onPlay: [
      { action: 'shiftFaceDownToLine', target: 'other' }
    ]
  },

  'Gravedad 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  'Gravedad 6': {
    onPlay: [
      { action: 'forceOpponentPlayTopDeck', target: 'opponent', faceDown: true }
    ]
  },

  // ========== VIDA ==========
  'Vida 0': {
    onPlay: [
      { action: 'playTopDeckAllLines', target: 'self', faceDown: true }
    ],
    onTurnStart: [
      { action: 'warnIfCovered', target: 'self' }
    ],
    persistentEnd: true,
    onTurnEnd: [
      { action: 'deleteSelfIfCoveredAndWarned', target: 'self' }
    ]
  },

  'Vida 1': {
    onPlay: [
      { action: 'flip', target: 'any', count: 1 },
      { action: 'flip', target: 'any', count: 1 }
    ]
  },

  'Vida 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'mayFlip', target: 'any', count: 1, filter: 'faceDown' }
    ]
  },

  'Vida 3': {
    onCover: [
      { action: 'playTopDeckFaceDownChooseLine', target: 'self' }
    ]
  },

  'Vida 4': {
    onPlay: [
      { action: 'drawIfCovering', target: 'self', count: 1 }
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
    onTurnStart: [
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
      { action: 'discard', target: 'opponent', count: 1 }
    ],
    persistent: {
      effect: 'preventOpponentPlay',
      scope: 'line'
    }
  },

  'Plaga 1': {
    onPlay: [
      { action: 'discard', target: 'opponent', count: 1 }
    ],
    onTurnStart: [
      { action: 'draw', target: 'self', count: 1, condition: 'opponentDiscardedLastTurn' }
    ]
  },

  'Plaga 2': {
    onPlay: [
      { action: 'discardForOpponentMore', target: 'self' }
    ]
  },

  'Plaga 3': {
    onPlay: [
      { action: 'flipAllFaceUp', target: 'other' }
    ]
  },

  'Plaga 4': {
    onTurnEnd: [
      { action: 'forceOpponentDeleteFaceDown', target: 'opponent', count: 1 },
      { action: 'mayFlip', target: 'self', count: 1 }
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
    onTurnStart: [
      { action: 'flipSelf', target: 'self' }
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
      { action: 'shift', target: 'opponent', count: 1 }
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
      { action: 'playCard', target: 'self' }
    ]
  },

  'Velocidad 1': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 }
    ],
    onRefresh: [
      { action: 'draw', target: 'self', count: 1 }
    ]
  },

  // onCompileEliminate manejado directamente en compileLine (logic.js)
  'Velocidad 2': {},

  'Velocidad 3': {
    onPlay: [
      { action: 'shift', target: 'self', count: 1 }
    ],
    onTurnEnd: [
      { action: 'optionalShiftThenFlipSelf', target: 'self' }
    ]
  },

  'Velocidad 4': {
    onPlay: [
      { action: 'moveOpponentFaceDown', target: 'opponent', count: 1 }
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
      { action: 'flip', target: 'any', count: 1, excludeSelf: true },
      { action: 'flipSelf', target: 'self' }
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
      { action: 'return', target: 'self', count: 1 }
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
      { action: 'draw', target: 'self', count: 3 },
      { action: 'shiftCovered', target: 'opponent', count: 1 }
    ]
  },

  'Oscuridad 1': {
    onPlay: [
      { action: 'flip', target: 'opponent', count: 1 },
      { action: 'mayShift', target: 'opponent', count: 1 }
    ]
  },

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

  'Oscuridad 3': {
    onPlay: [
      { action: 'playHandFaceDown', target: 'self', excludeCurrentLine: true }
    ]
  },

  'Oscuridad 4': {
    onPlay: [
      { action: 'shiftFaceDown', target: 'any', count: 1 }
    ]
  },

  'Oscuridad 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== APATÍA (Expansión) ==========
  'Apatía 0': {
    persistent: { valueBonusPerFaceDown: 1, scope: 'thisLine' } // TODO: implementar en cálculo de score
  },

  'Apatía 1': {
    onPlay: [
      { action: 'flipAllFaceUpInLine', target: 'self' }
    ]
  },

  'Apatía 2': {
    persistent: { ignoreMiddleCommands: true, scope: 'thisLine' }, // TODO: implementar en triggerCardEffect
    onCover: [
      { action: 'flipSelf', target: 'self' }
    ]
  },

  'Apatía 3': {
    onPlay: [
      { action: 'flip', target: 'opponent', count: 1, filter: 'faceUp' }
    ]
  },

  'Apatía 4': {
    onPlay: [
      { action: 'mayFlipCovered', target: 'self', count: 1 }
    ]
  },

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

  'Odio 1': {
    onPlay: [
      { action: 'discard', target: 'self', count: 3 },
      { action: 'delete', target: 'any', count: 1 },
      { action: 'delete', target: 'any', count: 1 }
    ]
  },

  // "Después de que elimines cartas: Roba 1 carta." (persistent trigger)
  'Odio 3': {
    onTurnStart: [{ action: 'drawIfEliminatedLastTurn', target: 'self', count: 1 }]
  },

  'Odio 4': {
    onCover: [
      { action: 'deleteLowestCoveredInLine', target: 'self' }
    ]
  },

  'Odio 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  // ========== AMOR (Expansión) ==========
  'Amor 1': {
    onPlay: [
      { action: 'drawFromOpponentDeck', target: 'self', count: 1 }
    ],
    onTurnEnd: [
      { action: 'mayGiveCardForDraw', target: 'self', count: 2 }   // opcional: da 1 → roba 2
    ]
  },

  'Amor 2': {
    onPlay: [
      { action: 'draw', target: 'opponent', count: 1 },
      { action: 'refresh', target: 'self' }
    ]
  },

  'Amor 3': {
    onPlay: [
      { action: 'takeRandomFromOpponent', target: 'self', count: 1 },
      { action: 'giveCardToOpponent', target: 'self', count: 1 }
    ]
  },

  'Amor 4': {
    onPlay: [
      { action: 'revealFromHand', target: 'self', count: 1 },
      { action: 'flip', target: 'any', count: 1, excludeSelf: true }
    ]
  },

  'Amor 5': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  'Amor 6': {
    onPlay: [
      { action: 'draw', target: 'opponent', count: 2 }
    ]
  },

  // ── COMPILE MAIN 2 ──────────────────────────────────────────────────────────

  // ========== ASIMILACIÓN ==========
  'Asimilación 1': {
    onPlay: [
      { action: 'discard', target: 'self', count: 1 },
      { action: 'refresh', target: 'self' }
    ],
    // "Después de que un jugador actualice: Roba la carta superior del mazo de tu oponente. Descarta 1 carta en su descarte."
    onRefresh: [
      { action: 'drawFromOpponentDeck' },
      { action: 'discardToOpponentTrash', target: 'self', count: 1 }
    ],
    onOpponentRefresh: [
      { action: 'drawFromOpponentDeck' },
      { action: 'discardToOpponentTrash', target: 'self', count: 1 }
    ]
  },

  'Asimilación 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== CAOS ==========
  'Caos 0': {
    onTurnStart: [
      { action: 'swapTopDeckCards' }    // "Inicial: Roba top del mazo rival, rival roba top del tuyo"
    ],
    onPlay: [
      { action: 'flipCoveredInEachLine' }  // "En cada línea, voltea 1 carta cubierta"
    ]
  },

  'Caos 1': {
    onPlay: [
      { action: 'rearrangeProtocols', target: 'self' },
      { action: 'rearrangeProtocols', target: 'opponent' }
    ]
  },

  'Caos 4': {
    onTurnEnd: [
      { action: 'discardHandDraw', target: 'self' }
    ]
  },

  'Caos 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== CLARIDAD ==========
  'Claridad 4': {
    onPlay: [
      { action: 'mayShuffleDiscardIntoDeck', target: 'self' }
    ]
  },

  'Claridad 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== CORRUPCIÓN ==========
  'Corrupción 1': {
    persistent: { redirectReturnToTopDeck: true },
    onPlay: [
      { action: 'return', target: 'any', count: 1 }
    ]
  },

  'Corrupción 2': {
    onOwnDiscard: [
      { action: 'discardRandom', target: 'opponent', count: 1 }
    ],
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'discard', target: 'self', count: 1 }
    ]
  },

  'Corrupción 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== VALOR ==========
  'Valor 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 }
    ],
    onTurnEnd: [
      { action: 'drawIfOpponentWinsLine' }
    ]
  },

  'Valor 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== DIVERSIDAD ==========
  'Diversidad 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== MIEDO ==========
  'Miedo 2': {
    onPlay: [
      { action: 'return', target: 'opponent', count: 1 }
    ]
  },

  'Miedo 3': {
    onPlay: [
      { action: 'shift', target: 'opponent', count: 1, forceCurrentLine: true, targetAll: true }
    ]
  },

  'Miedo 4': {
    onPlay: [
      { action: 'discardRandom', target: 'opponent', count: 1 }
    ]
  },

  'Miedo 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== HIELO ==========
  'Hielo 1': {
    onPlay: [
      { action: 'mayShiftSelf' }
    ],
    // "Después de que tu oponente juegue una carta en esta línea: Tu oponente descarta 1 carta."
    onOpponentPlayInLine: [
      { action: 'discard', target: 'opponent', count: 1 }
    ]
  },

  'Hielo 2': {
    onPlay: [
      { action: 'shift', target: 'any', count: 1 }
    ]
  },

  'Hielo 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== SUERTE ==========
  'Suerte 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== ESPEJO ==========
  'Espejo 4': {
    // "Después de que tu oponente robe cartas: Roba 1 carta."
    onOpponentDraw: [
      { action: 'draw', target: 'self', count: 1 }
    ]
  },

  'Espejo 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== PAZ ==========
  'Paz 2': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 },
      { action: 'playHandFaceDown', target: 'self' }
    ]
  },

  'Paz 4': {
    // "Después de que descartes cartas durante el turno de tu oponente: Roba 1 carta."
    onForcedDiscard: [
      { action: 'draw', target: 'self', count: 1 }
    ]
  },

  'Paz 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== HUMO ==========
  'Humo 0': {
    onPlay: [
      { action: 'playTopDeckInFaceDownLines', target: 'self' }
    ]
  },

  'Humo 3': {
    onPlay: [
      { action: 'playHandFaceDown', target: 'self', requireFaceDownInLine: true }
    ]
  },

  'Humo 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== TIEMPO ==========
  'Tiempo 2': {
    onPlay: [
      { action: 'mayShuffleDiscardIntoDeck', target: 'self' }
    ],
    // "Después de que barajes tu mazo: Roba 1 carta y puedes cambiar esta carta."
    onDeckShuffle: [
      { action: 'drawAndMayShiftSelf' }
    ]
  },

  'Tiempo 4': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'discard', target: 'self', count: 2 }
    ]
  },

  'Tiempo 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== UNIDAD ==========
  'Unidad 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ========== GUERRA ==========
  'Guerra 0': {
    // "Después de que actualices: Puedes voltear esta carta."
    onRefresh: [
      { action: 'mayFlipSelf' }
    ],
    // "Después de que tu oponente robe cartas: Puedes eliminar 1 carta."
    onOpponentDraw: [
      { action: 'mayDelete', target: 'any', count: 1 }
    ]
  },

  'Guerra 1': {
    // "Después de que tu oponente actualice: Descarta cualquier número de cartas. Actualiza."
    onOpponentRefresh: [
      { action: 'discardAny', target: 'self' },
      { action: 'refresh', target: 'self' }
    ]
  },

  'Guerra 2': {
    onPlay: [
      { action: 'flip', target: 'any', count: 1 }
    ],
    // "Después de que tu oponente compile: Tu oponente descarta su mano."
    onOpponentCompile: [
      { action: 'discardHand', target: 'opponent' }
    ]
  },

  'Guerra 3': {
    onPlay: [
      { action: 'draw', target: 'self', count: 1 }
    ],
    // "Después de que tu oponente descarte cartas: Puedes jugar 1 carta bocabajo."
    onOpponentDiscard: [
      { action: 'playHandFaceDown', target: 'self', may: true }
    ]
  },

  'Guerra 4': {
    onPlay: [
      { action: 'discard', target: 'opponent', count: 1 }
    ]
  },

  'Guerra 5': {
    onPlay: [{ action: 'discard', target: 'self', count: 1 }]
  },

  // ── Cartas faltantes Main 2 ──────────────────────────────────────────────

  // ========== ASIMILACIÓN (faltantes) ==========
  'Asimilación 0': {
    onPlay: [{ action: 'returnOpponentFaceDown' }]
  },
  'Asimilación 2': {
    onTurnEnd: [{ action: 'playOpponentTopDeckHere' }]
  },
  'Asimilación 4': {
    onPlay: [{ action: 'swapTopDeckCards' }]
  },
  'Asimilación 6': {
    onTurnEnd: [{ action: 'playOwnTopDeckOpponentSide' }]
  },

  // ========== CAOS (faltantes) ==========
  'Caos 2': {
    onPlay: [{ action: 'shiftCovered', target: 'self', count: 1 }]
  },
  'Caos 3': {
    // "Esta carta puede jugarse sin coincidir con los Protocolos."
    playAnywhere: true
  },

  // ========== CLARIDAD (faltantes) ==========
  'Claridad 0': {
    persistent: { valueBonusPerHandCard: 1 }
  },
  'Claridad 1': {
    onTurnStart: [{ action: 'revealTopDeckMayDiscard' }],
    onPlay: [{ action: 'revealOpponentHand' }],
    onCover: [{ action: 'draw', target: 'self', count: 3 }]
  },
  'Claridad 2': {
    onPlay: [{ action: 'searchDeckValue1ThenPlay' }]
  },
  'Claridad 3': {
    onPlay: [{ action: 'searchDeckByValue', value: 5 }]
  },

  // ========== CORRUPCIÓN (faltantes) ==========
  'Corrupción 0': {
    playAnywhere: true,
    playOnAnySide: true,
    onTurnStart: [{ action: 'flipCoveredInOwnStack' }]
  },
  'Corrupción 3': {
    onPlay: [{ action: 'mayFlipCoveredFaceUp' }]
  },
  'Corrupción 6': {
    persistentEnd: true,
    onTurnEnd: [{ action: 'optionalDiscardOrDeleteSelf' }]
  },

  // ========== VALOR (faltantes) ==========
  'Valor 0': {
    onTurnStart: [{ action: 'drawIfNoHand' }],
    onPlay: [{ action: 'draw', target: 'self', count: 1 }],
    onTurnEnd: [{ action: 'optionalDiscardThenOpponentDiscard' }]
  },
  'Valor 1': {
    onPlay: [{ action: 'deleteInWinningOpponentLine' }]
  },
  'Valor 3': {
    onTurnEnd: [{ action: 'mayShiftSelfToHighestOpponentLine' }]
  },
  'Valor 6': {
    persistentEnd: true,
    onTurnEnd: [{ action: 'flipSelfIfOpponentWins' }]
  },

  // ========== DIVERSIDAD (faltantes) ==========
  'Diversidad 0': {
    onPlay: [{ action: 'compileDiversityIfSixProtocols' }],
    onTurnEnd: [{ action: 'playNonDiversityCard' }]
  },
  'Diversidad 1': {
    onPlay: [
      { action: 'shift', target: 'any', count: 1 },
      { action: 'drawPerDistinctProtocolsInLine' }
    ]
  },
  'Diversidad 3': {
    persistent: { valueBonusIfNonDiversityFaceUp: 2 }
  },
  'Diversidad 4': {
    onPlay: [{ action: 'flipCardBelowDistinctProtocolCount' }]
  },
  'Diversidad 6': {
    persistentEnd: true,
    onTurnEnd: [{ action: 'deleteIfFewDistinctProtocols', minProtocols: 4 }]
  },

  // ========== MIEDO (faltantes) ==========
  'Miedo 0': {
    persistent: { disableOpponentMiddleCommands: true },
    onPlay: [{ action: 'mayShiftOrFlip', target: 'any' }]
  },
  'Miedo 1': {
    onPlay: [
      { action: 'draw', target: 'self', count: 2 },
      { action: 'opponentDiscardAndRedraw', minusN: 1 }
    ]
  },

  // ========== HIELO (faltantes) ==========
  'Hielo 3': {
    persistentEnd: true,
    onTurnEnd: [{ action: 'mayShiftSelfIfCovered' }]
  },
  'Hielo 4': {
    persistent: { preventFlip: true }
  },
  'Hielo 6': {
    persistent: { preventDraw: true }
  },

  // ========== SUERTE (faltantes) ==========
  'Suerte 0': {
    onPlay: [{ action: 'luckDraw3PickByValue' }]
  },
  'Suerte 1': {
    onPlay: [{ action: 'luckPlayTopThenFlipNoEffect' }]
  },
  'Suerte 2': {
    onPlay: [{ action: 'luckDiscardTopDraw' }]
  },
  'Suerte 3': {
    onPlay: [{ action: 'luckCallProtocolDiscard' }]
  },
  'Suerte 4': {
    onPlay: [{ action: 'luckDiscardTopDeleteByValue' }]
  },

  // ========== ESPEJO (faltantes) ==========
  'Espejo 0': {
    persistent: { valueBonusPerOpponentCard: 1 }
  },
  'Espejo 1': {
    onTurnEnd: [{ action: 'copyOpponentCardEffect' }]
  },
  'Espejo 2': {
    onPlay: [{ action: 'swapOwnTwoStacks' }]
  },
  'Espejo 3': {
    onPlay: [
      { action: 'flip', target: 'self', count: 1 },
      { action: 'flipOpponentSameLine' }
    ]
  },

  // ========== PAZ (faltantes) ==========
  'Paz 1': {
    onPlay: [
      { action: 'discardHand', target: 'self' },
      { action: 'discardHand', target: 'opponent' }
    ],
    onTurnEnd: [{ action: 'drawIfEmptyHand', count: 1 }]
  },
  'Paz 3': {
    onPlay: [{ action: 'optionalDiscardThenFlipHighValue' }]
  },
  'Paz 6': {
    onPlay: [{ action: 'flipSelfIfMultipleHandCards' }]
  },

  // ========== HUMO (faltantes) ==========
  'Humo 1': {
    onPlay: [
      { action: 'flip', target: 'self', count: 1 },
      { action: 'mayShiftLastFlipped' }
    ]
  },
  'Humo 2': {
    persistent: { valueBonusPerFaceDown: 1 }
  },
  'Humo 4': {
    onPlay: [{ action: 'shiftCoveredFaceDown' }]
  },

  // ========== TIEMPO (faltantes) ==========
  'Tiempo 0': {
    onPlay: [{ action: 'playFromDiscardThenShuffle' }]
  },
  'Tiempo 1': {
    onPlay: [
      { action: 'flip', target: 'any', count: 1, coveredOnly: true },
      { action: 'discardOwnDeck' }
    ]
  },
  'Tiempo 3': {
    onPlay: [{ action: 'playFromDiscardFaceDownOtherLine' }]
  },

  // ========== UNIDAD (faltantes) ==========
  'Unidad 0': {
    onPlay: [{ action: 'mayFlipOrDrawIfUnityOnField' }],
    onCover: [{ action: 'mayFlipOrDrawIfUnityOnField' }],
    onCoverCondition: 'unityOnly'  // solo dispara si la carta que cubre es Unidad
  },
  'Unidad 1': {
    persistent: { allowUnityPlayInLine: true },
    onTurnStart: [{ action: 'mayShiftSelfIfCovered' }],
    onPlay: [{ action: 'compileSelfIfFiveOrMoreUnity' }]
  },
  'Unidad 2': {
    onPlay: [{ action: 'drawPerUnityCards' }]
  },
  'Unidad 3': {
    onPlay: [{ action: 'mayFlipIfUnityOnField' }]
  },
  'Unidad 4': {
    persistentEnd: true,
    onTurnEnd: [{ action: 'drawUnityFromDeckIfEmptyHand' }]
  }
};

// ============================================================================
// 3. FUNCIONES DE RESOLUCIÓN DE EFECTOS
// ============================================================================

/**
 * Inicia la resolución de un conjunto de efectos para una carta
/**
 * Voltea una carta y dispara onPlay si pasó de bocabajo a bocarriba (top de pila).
 * Regla CODEX: "Cuando un texto activo entra en juego (al voltearse boca arriba)"
 */
function flipAndTrigger(cardObj, line, owner) {
  const wasFaceDown = cardObj.faceDown;
  cardObj.faceDown = !cardObj.faceDown;
  if (wasFaceDown && typeof triggerFlipFaceUp === 'function') {
    triggerFlipFaceUp(cardObj, line, owner);
  }
}

/**
 * @param {Object} card - La carta que dispara el efecto
 * @param {string} trigger - Tipo de disparador: onPlay, onFlip, onTurnStart, etc.
 * @param {string} targetPlayer - 'player' o 'ai'
 */
function triggerCardEffect(card, trigger, targetPlayer, opts = {}) {
  const cardName = card.nombre;
  const effectDef = CARD_EFFECTS[cardName];

  // Miedo 0: bloquear onPlay del rival solo durante el turno del dueño de Miedo 0
  if (trigger === 'onPlay') {
    const rival = targetPlayer === 'player' ? 'ai' : 'player';
    if (gameState.turn === rival) {
      const blocked = LINES.some(l =>
        gameState.field[l][rival].some(cardObj => {
          if (cardObj.faceDown) return false;
          const ef = CARD_EFFECTS[cardObj.card.nombre];
          return ef && ef.persistent && ef.persistent.disableOpponentMiddleCommands;
        })
      );
      if (blocked) {
        console.log(`⛔ Miedo 0 activo — onPlay de ${cardName} bloqueado (turno de ${rival})`);
        return;
      }
    }
  }

  if (!effectDef || !effectDef[trigger]) {
    console.log(`Sin efecto ${trigger} para ${cardName}`);
    return;
  }

  // Unidad 0: onCover solo dispara si la carta que cubre es Unidad
  if (trigger === 'onCover' && effectDef.onCoverCondition === 'unityOnly') {
    const covering = gameState.coveringCard;
    if (!covering || !covering.nombre.startsWith('Unidad')) {
      console.log(`⏭️ onCover de ${cardName} ignorado — carta que cubre no es Unidad`);
      return;
    }
  }

  const effectList = effectDef[trigger];
  if (!Array.isArray(effectList)) return;

  gameState.effectQueue = gameState.effectQueue || [];
  if (opts.deferred) {
    // Deferred: agregar al FINAL de la cola (para efectos reactivos que van después de los propios)
    for (let i = 0; i < effectList.length; i++) {
      gameState.effectQueue.push({ effect: effectList[i], targetPlayer, cardName });
    }
  } else {
    // LIFO Stack: Agregar al INICIO (orden normal)
    for (let i = effectList.length - 1; i >= 0; i--) {
      gameState.effectQueue.unshift({ effect: effectList[i], targetPlayer, cardName });
    }
  }

  // Iniciar procesamiento
  processAbilityEffect();
}

/**
 * Procesa el siguiente efecto en la cola
 */
function processAbilityEffect() {
  if (gameState.effectContext) return; // efecto interactivo en curso, esperar a que termine

  if (!gameState.effectQueue || gameState.effectQueue.length === 0) {
    updateUI();
    // Commit queue: aterrizar carta pendiente tras resolver onCover no-interactivo
    if (gameState.pendingLanding && typeof landPendingCard === 'function') {
      landPendingCard();
      return;
    }
    if (gameState.pendingCheckCompile) {
      const who = gameState.pendingCheckCompile;
      gameState.pendingCheckCompile = null;
      setTimeout(() => checkCompilePhase(who), 600);
    } else if (gameState.pendingStartTurn) {
      const next = gameState.pendingStartTurn;
      gameState.pendingStartTurn = null;
      setTimeout(() => startTurn(next), 500);
    } else if (gameState.pendingTurnEnd) {
      const who = gameState.pendingTurnEnd;
      gameState.pendingTurnEnd = null;
      endTurn(who);
    }
    return;
  }

  const item = gameState.effectQueue.shift();
  const { effect, targetPlayer, cardName } = item;

  gameState.currentTriggerCard = cardName;
  console.log(`Resolviendo: ${effect.action} para ${cardName} (jugador: ${targetPlayer})`);

  // Resolver según el tipo de acción
  resolveAbilityAction(effect, targetPlayer);
}

/**
 * Resuelve una acción individual de efecto
 */
function resolveAbilityAction(actionDef, targetPlayer) {
  const triggerCardName = gameState.currentTriggerCard;
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
    case 'draw': {
      if (actionDef.condition === 'opponentDiscardedLastTurn') {
        const opp = targetPlayer === 'player' ? 'ai' : 'player';
        if (!gameState.discardedSinceLastCheck[opp]) { processAbilityEffect(); break; }
        gameState.discardedSinceLastCheck[opp] = false; // consumir el flag
      }
      draw(resolvedTarget, count || 1);
      updateUI();
      processAbilityEffect();
      break;
    }

    case 'discard':
      if (resolvedTarget === 'player') {
        startEffect('discard', 'player', count || 1);
      } else {
        discard('ai', count || 1);
        processAbilityEffect();
      }
      break;

    case 'discardRandom':
      // Miedo 4: el oponente descarta aleatoriamente (sin elección)
      discard(resolvedTarget, count || 1);
      processAbilityEffect();
      break;

    case 'delete': {
      const deleteOpts = {};
      if (actionDef.forceLine) deleteOpts.forceLine = actionDef.forceLine;
      if (actionDef.filter) deleteOpts.filter = actionDef.filter;
      if (actionDef.maxVal !== undefined) deleteOpts.maxVal = actionDef.maxVal;
      if (actionDef.minVal !== undefined) deleteOpts.minVal = actionDef.minVal;
      startEffect('eliminate', resolvedTarget, count || 1, deleteOpts);
      break;
    }

    case 'flip': {
      const flipOpts = {};
      if (actionDef.excludeSelf && triggerCardName) flipOpts.excludeCardName = triggerCardName;
      if (actionDef.filter) flipOpts.filter = actionDef.filter;
      if (actionDef.coveredOnly) flipOpts.coveredOnly = true;
      startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1, flipOpts);
      break;
    }

    case 'flipSelf': {
      // Buscar en todas las líneas (currentEffectLine puede haber cambiado tras el return)
      let flipped = false;
      if (triggerCardName) {
        LINES.forEach(line => {
          const stack = gameState.field[line][targetPlayer];
          const cardObj = stack.find(c => c.card.nombre === triggerCardName);
          if (cardObj) { flipAndTrigger(cardObj, line, targetPlayer); flipped = true; }
        });
      }
      if (flipped) {
        updateUI();
        if (typeof updateStatus === 'function') updateStatus(`${triggerCardName} se voltea`);
      }
      processAbilityEffect();
      break;
    }

    case 'shift': {
      const shiftOpts = {
        gravityConstraint: actionDef.gravityConstraint || false,
        effectLine: gameState.currentEffectLine
      };
      if (actionDef.forceCurrentLine && gameState.currentEffectLine) {
        shiftOpts.forceLine = gameState.currentEffectLine;
      }
      startEffect('shift', resolvedTarget, count || 1, shiftOpts);
      break;
    }

    case 'return':
      startEffect('return', resolvedTarget, count || 1);
      break;

    case 'refresh':
      while (gameState[targetPlayer].hand.length < 5) {
        if (!drawCard(targetPlayer)) break;
      }
      if (typeof onOpponentDrawEffects === 'function') onOpponentDrawEffects(targetPlayer);
      processAbilityEffect();
      break;

    case 'discardThen': {
      // Descarte obligatorio (sin "puedes"). El efecto secundario se activa SI se pudo descartar.
      const handSize = gameState[targetPlayer].hand.length;
      console.log(`🔥 discardThen: targetPlayer=${targetPlayer}, resolvedTarget=${resolvedTarget}, handSize=${handSize}, effectContext=${gameState.effectContext ? gameState.effectContext.type : 'null'}`);
      if (resolvedTarget === 'player' || resolvedTarget === 'any') {
        if (handSize > 0) {
          if (ifThenAction) {
            gameState.effectQueue.unshift({ effect: { action: ifThenAction, target: ifThenTarget, count: ifThenCount }, targetPlayer });
          }
          console.log(`🔥 discardThen: llamando startEffect('discard','player',${count || 1})`);
          startEffect('discard', 'player', count || 1);
          console.log(`🔥 discardThen: tras startEffect, effectContext=${gameState.effectContext ? gameState.effectContext.type : 'null'}`);
        } else {
          console.log(`⏭️ Descarte omitido — mano vacía para discardThen`);
          processAbilityEffect();
        }
      } else {
        if (handSize > 0) {
          discard('ai', count || 1);
          if (ifThenAction) {
            resolveAbilityAction({ action: ifThenAction, target: ifThenTarget, count: ifThenCount }, targetPlayer);
          } else {
            processAbilityEffect();
          }
        } else {
          console.log(`⏭️ AI Descarte omitido — mano vacía para discardThen`);
          processAbilityEffect();
        }
      }
      break;
    }

    case 'optionalDiscard': {
      const handSize = gameState[targetPlayer].hand.length;
      if (targetPlayer === 'player') {
        if (handSize === 0) {
          console.log(`⏭️ Descarte opcional omitido — mano vacía`);
          processAbilityEffect();
          break;
        }
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm', selected: [], count: 0 };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Descartas 1 carta para activar el efecto?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            // Queue the ifThen action, then do the interactive discard
            if (ifThenAction) {
              gameState.effectQueue.unshift({ effect: { action: ifThenAction, target: ifThenTarget, count: ifThenCount }, targetPlayer });
            }
            startEffect('discard', 'player', count || 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA descarta solo si tiene ventaja en mano (más de 3 cartas) o si el efecto vale la pena
        const aiScore = LINES.reduce((s, l) => s + calculateScore(gameState, l, 'ai'), 0);
        const plScore = LINES.reduce((s, l) => s + calculateScore(gameState, l, 'player'), 0);
        if (handSize > 0 && (handSize > 3 || aiScore < plScore)) {
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

    case 'mayDelete': {
      // Como 'delete' pero opcional para el jugador (IA siempre lo hace si puede)
      const mayDelOpts = {};
      if (actionDef.filter) mayDelOpts.filter = actionDef.filter;
      if (actionDef.maxVal !== undefined) mayDelOpts.maxVal = actionDef.maxVal;
      if (actionDef.minVal !== undefined) mayDelOpts.minVal = actionDef.minVal;
      if (targetPlayer === 'player') {
        startEffect('eliminate', resolvedTarget, count || 1, mayDelOpts);
      } else {
        resolveAbilityAction({ action: 'delete', target, count, ...mayDelOpts }, targetPlayer);
      }
      break;
    }

    case 'mayFlip': {
      const flipOpts = actionDef.filter ? { filter: actionDef.filter } : {};
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = target === 'self'
            ? `${triggerCardName}: ¿Quieres voltear esta carta?`
            : flipOpts.filter === 'faceDown'
              ? `${triggerCardName || ''}: ¿Quieres voltear 1 carta bocabajo?`
              : `${triggerCardName || ''}: ¿Quieres voltear 1 carta?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1, flipOpts);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        resolveAbilityAction({ action: 'flip', target, count, ...flipOpts }, targetPlayer);
      }
      break;
    }

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

    case 'mayShift': {
      // Oscuridad 1: opcionalmente mover la carta recién volteada a otra línea
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        const flipped = gameState.lastFlippedCard;
        if (confirmArea && btnYes && btnNo && flipped) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `¿Quieres cambiar de línea "${flipped.cardObj.card.nombre}"?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            // Shift forzado a esa carta específica
            const { cardObj, line } = flipped;
            const cardIdx = gameState.field[line][resolvedTarget].indexOf(cardObj);
            if (cardIdx !== -1) {
              gameState.effectContext = {
                type: 'shift',
                target: resolvedTarget,
                count: 1,
                selected: [],
                selectedCard: { line, target: resolvedTarget, cardIdx },
                waitingForLine: true
              };
              updateStatus(`Elige línea destino para "${cardObj.card.nombre}"`);
              highlightSelectableLines(line);
            } else {
              processAbilityEffect();
            }
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA: mover la carta recién volteada a línea aleatoria
        const flipped = gameState.lastFlippedCard;
        if (flipped) {
          const { cardObj, line } = flipped;
          const cardIdx = gameState.field[line][resolvedTarget]?.indexOf(cardObj);
          if (cardIdx !== undefined && cardIdx !== -1) {
            const dest = aiPickDestLine([line], resolvedTarget) || LINES.filter(l => l !== line)[0];
            gameState.field[line][resolvedTarget].splice(cardIdx, 1);
            gameState.field[dest][resolvedTarget].push(cardObj);
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'swapCard':
      startEffect('swap', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
      break;

    case 'drawIfEliminatedLastTurn': {
      // Odio 3: roba 1 carta si eliminaste cartas en el turno anterior
      if (!gameState.eliminatedLastTurn?.[targetPlayer]) { processAbilityEffect(); break; }
      drawCard(targetPlayer);
      if (typeof onOpponentDrawEffects === 'function') onOpponentDrawEffects(targetPlayer);
      processAbilityEffect();
      break;
    }

    case 'mayShiftSelf': {
      // Genérico: mover esta carta a otra línea (aunque esté cubierta)
      // Usado por Espíritu 3, Hielo 1, Tiempo 2 (via drawAndMayShiftSelf)
      const selfLine = gameState.currentEffectLine;
      if (!selfLine) { processAbilityEffect(); break; }
      if (actionDef.condition === 'drawnSinceLastCheck') {
        if (!gameState.drawnLastTurn?.[targetPlayer]) { processAbilityEffect(); break; }
      }
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `¿Quieres mover ${triggerCardName} a otra línea?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = { type: 'shiftSelf', sourceLine: selfLine, target: 'player', count: 1, selected: [], waitingForLine: true };
            updateStatus(`${triggerCardName}: elige línea destino`);
            highlightSelectableLines(selfLine);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA: mover a línea distinta
        const otherLines = LINES.filter(l => l !== selfLine);
        if (otherLines.length > 0) {
          const dest = aiPickDestLine([selfLine]) || otherLines[0];
          const stack = gameState.field[selfLine][targetPlayer];
          const idx = stack.findIndex(c => c.card.nombre === triggerCardName);
          if (idx !== -1) {
            const [cardObj] = stack.splice(idx, 1);
            gameState.field[dest][targetPlayer].push(cardObj);
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'mayShiftLastFlipped': {
      // Humo 1: opcionalmente cambia de línea la carta que acaba de voltear
      const flipped = gameState.lastFlippedCard;
      if (!flipped) { processAbilityEffect(); break; }
      const { cardObj: flippedCard, line: flippedLine } = flipped;
      // Verificar que sigue en el campo del jugador
      const flippedIdx = gameState.field[flippedLine]?.[targetPlayer]?.indexOf(flippedCard);
      if (flippedIdx === undefined || flippedIdx === -1) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Cambias ${flippedCard.card.nombre} a otra línea?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = {
              type: 'shiftSelf', sourceLine: flippedLine, target: 'player',
              count: 1, selected: [], waitingForLine: true,
              cardRef: flippedCard
            };
            updateStatus(`${triggerCardName}: elige línea destino para ${flippedCard.card.nombre}`);
            if (typeof highlightSelectableLines === 'function') highlightSelectableLines(flippedLine);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        // IA: mover la carta volteada a la línea que mejore su posición
        const dest = typeof aiPickDestLine === 'function'
          ? aiPickDestLine([flippedLine], targetPlayer)
          : LINES.filter(l => l !== flippedLine)[0];
        if (dest) {
          const currentIdx = gameState.field[flippedLine][targetPlayer].indexOf(flippedCard);
          if (currentIdx !== -1) {
            gameState.field[flippedLine][targetPlayer].splice(currentIdx, 1);
            gameState.field[dest][targetPlayer].push(flippedCard);
            updateUI();
          }
        }
        processAbilityEffect();
      }
      break;
    }

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
          const l = validLines.sort((a, b) => calculateScore(gameState, b, resolvedTarget) - calculateScore(gameState, a, resolvedTarget))[0];
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
        updateStatus('Juega una carta adicional este turno');
      } else {
        // IA juega su carta de mayor valor a la línea con más ventaja
        if (gameState.ai.hand.length > 0) {
          const cardIdx = gameState.ai.hand.reduce((b, c, i) => c.valor > gameState.ai.hand[b].valor ? i : b, 0);
          const validLines = LINES.filter(l => !gameState.field[l].compiledBy);
          if (validLines.length > 0) {
            const line = aiPickDestLine([], 'ai') || validLines[0];
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

    case 'playTopDeckFaceDownChooseLine': {
      // Vida 3: elige una línea diferente y coloca bocabajo la carta superior del mazo
      const sourceLine = gameState.currentEffectLine;
      if (gameState[targetPlayer].deck.length === 0) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        gameState.effectContext = { type: 'playTopDeckFaceDownChooseLine', sourceLine, owner: 'player', selected: [], count: 1 };
        gameState.effectContext.waitingForLine = true;
        updateStatus('Vida 3: elige una línea donde colocar una carta bocabajo');
        highlightSelectableLines(sourceLine);
      } else {
        const others = LINES.filter(l => l !== sourceLine);
        const dest = aiPickDestLine([sourceLine]) || others[0];
        const topCard = gameState[targetPlayer].deck.pop();
        gameState.field[dest][targetPlayer].push({ card: topCard, faceDown: true });
        processAbilityEffect();
      }
      break;
    }

    case 'revealOpponentHand': {
      // Luz 4 / Psique 0: muestra la mano de la IA al jugador en el modal
      if (targetPlayer === 'player') {
        updateUI(); // sincronizar contador antes de mostrar modal
        const hand = [...gameState.ai.hand]; // snapshot — copia para que efectos deferred no alteren el modal
        const modal = document.getElementById('reveal-modal');
        const container = document.getElementById('reveal-cards-container');
        const closeBtn = document.getElementById('btn-reveal-close');
        const titleEl = document.getElementById('reveal-title');
        const subtitleEl = document.getElementById('reveal-subtitle');
        const sourceEl = document.getElementById('reveal-source');
        if (modal && container && closeBtn && typeof createCardHTML === 'function') {
          // Bloquear cola de efectos mientras el modal está abierto
          gameState.effectContext = { type: 'revealHand' };
          if (titleEl) titleEl.textContent = 'MANO DEL RIVAL';
          if (subtitleEl) subtitleEl.textContent = `${hand.length} cartas en mano`;
          if (sourceEl) sourceEl.textContent = triggerCardName || '';
          console.log(`[reveal] Mano IA real: ${hand.length} cartas — ${hand.map(c => c.nombre).join(', ')}`);
          container.innerHTML = hand.length > 0
            ? hand.map(c => `<div style="transform: scale(0.8); transform-origin: top center;">${createCardHTML(c)}</div>`).join('')
            : '<p style="color:var(--ui-text-muted);">La mano del oponente está vacía.</p>';
          modal.classList.remove('hidden');
          closeBtn.onclick = () => {
            modal.classList.add('hidden');
            gameState.effectContext = null; // desbloquear cola
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
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
        updateStatus(`Carta del mazo revelada: ${topCard.nombre} — añadida a mano`);
      } else {
        updateStatus(`Carta del mazo revelada: ${topCard.nombre} — devuelta al mazo`);
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
        // AI flips la carta de mayor valor (maximiza las robadas)
        const actualTarget = resolvedTarget === 'any' ? 'player' : resolvedTarget;
        const validLines = LINES.filter(l => gameState.field[l][actualTarget].length > 0);
        if (validLines.length > 0) {
          const l = validLines.sort((a, b) => {
            const va = gameState.field[a][actualTarget].at(-1).card.valor || 0;
            const vb = gameState.field[b][actualTarget].at(-1).card.valor || 0;
            return vb - va;
          })[0];
          const stack = gameState.field[l][actualTarget];
          const cardObj = stack[stack.length - 1];
          gameState.lastFlippedCard = { cardObj, line: l };
          flipAndTrigger(cardObj, l, actualTarget);
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
        // AI flips en la línea con más bocabajo (maximiza robadas después del volteo)
        const actualTarget2 = resolvedTarget === 'any' ? 'player' : resolvedTarget;
        const validLines2 = LINES.filter(l => gameState.field[l][actualTarget2].length > 0);
        if (validLines2.length > 0) {
          const l = validLines2.sort((a, b) => {
            const fdA = [...gameState.field[a].player, ...gameState.field[a].ai].filter(c => c.faceDown).length;
            const fdB = [...gameState.field[b].player, ...gameState.field[b].ai].filter(c => c.faceDown).length;
            return fdB - fdA;
          })[0];
          const stack = gameState.field[l][actualTarget2];
          const cardObj = stack[stack.length - 1];
          gameState.lastFlippedCard = { cardObj, line: l };
          flipAndTrigger(cardObj, l, actualTarget2);
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
        updateStatus('Elige línea destino para desplazar todas tus cartas bocabajo');
        highlightSelectableLines();
      } else {
        // IA mueve bocabajos a línea con mayor potencial de compilado
        const others = LINES.filter(l => l !== sourceLine);
        const dest = aiPickDestLine([sourceLine]) || others[0];
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

    case 'mayShiftOrFlip': {
      // Miedo 0: elige Cambiar (shift) o Voltear (flip) cualquier carta del campo
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg  = document.getElementById('confirm-msg');
        const btnYes      = document.getElementById('btn-confirm-yes');
        const btnNo       = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || 'Miedo 0'}: ¿qué quieres hacer? SÍ = Cambiar carta de línea · NO = Voltear carta`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('shift', 'any', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('flip', 'any', 1);
          };
        } else {
          startEffect('flip', 'any', 1);
        }
      } else {
        // IA: voltear si el rival tiene cartas boca arriba que dañen; cambiar si tiene ventaja en alguna línea
        const canFlipOpp = LINES.some(l => { const s = gameState.field[l].player; return s.length > 0 && !s[s.length-1].faceDown; });
        const canShiftAdv = LINES.filter(l => gameState.field[l].ai.length > 0).length >= 2;
        const aiAction = (canFlipOpp || !canShiftAdv) ? 'flip' : 'shift';
        resolveAbilityAction({ action: aiAction, target: 'any', count: 1 }, targetPlayer);
      }
      break;
    }

    case 'maySwapOrFlip': {
      // Prerequisite: there must be at least one face-down card to reveal (Luz 2 mechanic)
      const hasFaceDown = LINES.some(l =>
        ['player', 'ai'].some(p => gameState.field[l][p].some(c => c.faceDown))
      );
      if (!hasFaceDown) {
        processAbilityEffect();
        break;
      }
      // Player chooses: swap a card or flip a card
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Qué quieres hacer? SÍ = Cambiar carta de línea · NO = Voltear carta`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('shift', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1);
          };
        } else {
          startEffect('flip', resolvedTarget, count || 1);
        }
      } else {
        // Flip si el rival tiene cartas bocarriba (bajarlas daña más); cambiar si no
        const canFlipOpp = LINES.some(l => { const s = gameState.field[l].player; return s.length > 0 && !s[s.length-1].faceDown; });
        const canShift = LINES.filter(l => gameState.field[l].ai.length > 0).length >= 2;
        const aiAction = (canFlipOpp || !canShift) ? 'flip' : 'shift';
        resolveAbilityAction({ action: aiAction, target, count }, targetPlayer);
      }
      break;
    }

    case 'mayReturnAndFlip': {
      // "Puedes devolver 1 carta del oponente. Si lo haces, voltea esta carta."
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `¿Quieres devolver 1 carta del oponente? (Si lo haces, ${triggerCardName} se voltea)`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            // Si devuelve → encolar flipSelf después del return
            gameState.effectQueue.unshift({
              effect: { action: 'flipSelf', target: 'self' },
              targetPlayer,
              cardName: triggerCardName
            });
            startEffect('return', resolvedTarget, count || 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA: si hay cartas del oponente en campo, devuelve una y se voltea
        const l = gameState.currentEffectLine || LINES.find(l => gameState.field[l][resolvedTarget].length > 0);
        if (l && gameState.field[l][resolvedTarget].length > 0) {
          const cardObj = gameState.field[l][resolvedTarget].pop();
          gameState[resolvedTarget].hand.push(cardObj.card);
          // Voltear Psique 4
          LINES.forEach(line => {
            const stack = gameState.field[line][targetPlayer];
            const self = stack.find(c => c.card.nombre === triggerCardName);
            if (self) flipAndTrigger(self, line, targetPlayer);
          });
        }
        processAbilityEffect();
      }
      break;
    }

    case 'warnIfCovered': {
      // Vida 0: al inicio del turno, si está cubierta activa el aviso
      const line = gameState.currentEffectLine;
      if (line) {
        const stack = gameState.field[line][targetPlayer];
        for (let i = stack.length - 2; i >= 0; i--) {
          if (stack[i].card.nombre === 'Vida 0' && !stack[i].faceDown) {
            stack[i].coveredWarning = true;
            updateStatus('Vida 0 cubierta — si sigue cubierta al final del turno, se elimina');
          }
        }
      }
      processAbilityEffect();
      break;
    }

    case 'deleteSelfIfCoveredAndWarned': {
      // Vida 0: al final del turno, si tiene el aviso activo y sigue cubierta, se elimina
      const line = gameState.currentEffectLine;
      if (line) {
        const stack = gameState.field[line][targetPlayer];
        for (let i = stack.length - 2; i >= 0; i--) {
          if (stack[i].card.nombre === 'Vida 0' && !stack[i].faceDown) {
            if (stack[i].coveredWarning) {
              const [removed] = stack.splice(i, 1);
              gameState[targetPlayer].trash.push(removed.card);
              updateStatus('Vida 0 eliminada por seguir cubierta');
            } else {
              // Cubierta pero sin aviso previo: no se elimina este turno
              stack[i].coveredWarning = false;
            }
          } else if (stack[i].card.nombre === 'Vida 0') {
            stack[i].coveredWarning = false; // descubierta: resetear flag
          }
        }
        // Si Vida 0 está en cima (no cubierta), resetear flag
        const top = stack[stack.length - 1];
        if (top && top.card.nombre === 'Vida 0') top.coveredWarning = false;
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
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Robas 1 carta? (Si lo haces, elimina 1 carta rival y luego esta carta se destruye)`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
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
            gameState.effectContext = null;
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
      // Odio 2: elimina tu carta descubierta de mayor valor, luego la del oponente.
      // Si hay empate en el mayor valor, el jugador elige cuál eliminar.
      // Si Odio 2 es su carta de mayor valor (se suicida), el segundo efecto no se activa.
      const findAllHighestUncovered = (player) => {
        let maxVal = -1;
        LINES.forEach(l => {
          const stack = gameState.field[l][player];
          if (stack.length === 0) return;
          const top = stack[stack.length - 1];
          if (!top.faceDown && top.card.valor > maxVal) maxVal = top.card.valor;
        });
        if (maxVal < 0) return [];
        const ties = [];
        LINES.forEach(l => {
          const stack = gameState.field[l][player];
          if (stack.length === 0) return;
          const top = stack[stack.length - 1];
          if (!top.faceDown && top.card.valor === maxVal)
            ties.push({ card: top, line: l, idx: stack.length - 1 });
        });
        return ties;
      };

      const isOppOnly = !!actionDef._oppOnly;
      const phasePlayer = isOppOnly ? opponent : targetPlayer;
      const ties = findAllHighestUncovered(phasePlayer);

      if (ties.length === 0) { processAbilityEffect(); break; }

      const label = isOppOnly ? 'rival' : 'propia';

      if (ties.length === 1 || gameState.turn === 'ai') {
        // Auto-eliminar (única carta o turno de IA)
        const chosen = ties[0];
        const removedCard = gameState.field[chosen.line][phasePlayer].splice(chosen.idx, 1)[0];
        gameState[phasePlayer].trash.push(removedCard.card);
        updateStatus(`${triggerCardName} elimina a ${removedCard.card.nombre} (${label})`);
        if (typeof triggerUncovered === 'function') triggerUncovered(chosen.line, phasePlayer);

        if (!isOppOnly) {
          const isSelf = removedCard.card.nombre === triggerCardName;
          if (!isSelf) {
            gameState.effectQueue.unshift({
              effect: { action: 'deleteHighestUncovered', target: actionDef.target, _oppOnly: true },
              targetPlayer,
              cardName: triggerCardName
            });
          }
        }
        processAbilityEffect();
      } else {
        // Empate: el jugador elige cuál eliminar
        const allowedLines = ties.map(t => t.line);
        const opts = { allowedLines };
        if (!isOppOnly) {
          // Si el jugador NO elige Odio 2 (no se suicida), activar fase del oponente
          opts._checkSuicide = {
            triggerCardName,
            queueEffect: {
              effect: { action: 'deleteHighestUncovered', target: actionDef.target, _oppOnly: true },
              targetPlayer,
              cardName: triggerCardName
            }
          };
        }
        startEffect('eliminate', phasePlayer, 1, opts);
      }
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
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Qué quieres hacer? SÍ = Descarta 1 carta · NO = Voltea esta carta`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('discard', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            // Buscar Espíritu 1 por nombre en todas las líneas y voltearla
            LINES.forEach(l => {
              const stack = gameState.field[l][targetPlayer];
              const cardObj = stack.find(c => c.card.nombre === triggerCardName);
              if (cardObj) cardObj.faceDown = true;
            });
            gameState.effectContext = null;
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
      // Fuego 4: descarta 1+ cartas obligatorio, luego roba N+1
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) {
          draw('player', 1);
          processAbilityEffect();
          break;
        }
        // Primera descarta es obligatoria; el loop continúa con _discardForDrawLoop
        gameState.effectQueue.unshift({ effect: { action: '_discardForDrawLoop', discardedSoFar: 1 }, targetPlayer });
        startEffect('discard', 'player', 1);
      } else {
        const n = Math.max(1, Math.floor(gameState.ai.hand.length / 2));
        discard('ai', n);
        draw('ai', n + 1);
        processAbilityEffect();
      }
      break;
    }

    case '_discardForDrawLoop': {
      // Continúa el loop de descarte de Fuego 4
      const n = actionDef.discardedSoFar || 0;
      const handSize = gameState.player.hand.length;
      if (handSize === 0 || targetPlayer !== 'player') {
        draw(targetPlayer, n + 1);
        processAbilityEffect();
        break;
      }
      const confirmArea = document.getElementById('command-confirm');
      const confirmMsg = document.getElementById('confirm-msg');
      const btnYes = document.getElementById('btn-confirm-yes');
      const btnNo = document.getElementById('btn-confirm-no');
      if (!confirmArea) { draw('player', n + 1); processAbilityEffect(); break; }
      gameState.effectContext = { type: 'confirm', selected: [] };
      confirmArea.classList.remove('hidden');
      confirmMsg.textContent = `${triggerCardName || ''}: ¿Descartas otra carta? Robas ${n + 1} si paras ahora.`;
      btnYes.onclick = () => {
        confirmArea.classList.add('hidden');
        gameState.effectContext = null;
        gameState.effectQueue.unshift({ effect: { action: '_discardForDrawLoop', discardedSoFar: n + 1 }, targetPlayer });
        startEffect('discard', 'player', 1);
      };
      btnNo.onclick = () => {
        confirmArea.classList.add('hidden');
        gameState.effectContext = null;
        draw('player', n + 1);
        processAbilityEffect();
      };
      break;
    }

    case 'optionalShiftThenFlipSelf': {
      // Velocidad 3 Final: puedes cambiar 1 carta tuya; si lo haces, voltea esta carta
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `¿Cambias 1 de tus cartas de línea? (${triggerCardName} se volteará si lo haces)`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            gameState.effectQueue.unshift({ effect: { action: 'flipSelf', target: 'self' }, targetPlayer, cardName: triggerCardName });
            startEffect('shift', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA cambia si hay línea destino ventajosa; si no, omite
        const destLine = aiPickDestLine([gameState.currentEffectLine]);
        if (destLine) {
          resolveAbilityAction({ action: 'shift', target: 'self', count: 1 }, targetPlayer);
        } else {
          processAbilityEffect();
        }
      }
      break;
    }

    case 'moveOpponentFaceDown': {
      // Velocidad 4: cambia 1 carta bocabajo del oponente a otra línea
      startEffect('shift', opponent, count || 1, { filter: 'faceDown' });
      break;
    }

    case 'shiftCovered': {
      // Oscuridad 0: cambia 1 carta cubierta del oponente (no la del tope)
      const hasCovered = LINES.some(l => gameState.field[l][resolvedTarget].length >= 2);
      if (!hasCovered) {
        // Sin cartas cubiertas: omitir efecto
        processAbilityEffect();
        break;
      }
      if (targetPlayer === 'player') {
        startEffect('shift', resolvedTarget, count || 1, { coveredOnly: true, targetAll: true });
      } else {
        // IA: toma cubierta de la línea rival de mayor puntuación; la mueve a su línea más débil
        const validLines = LINES.filter(l => gameState.field[l][resolvedTarget].length >= 2);
        const srcLine = validLines.sort((a, b) =>
          calculateScore(gameState, b, resolvedTarget) - calculateScore(gameState, a, resolvedTarget)
        )[0];
        const covered = gameState.field[srcLine][resolvedTarget].slice(0, -1);
        const coveredIdx = covered.reduce((best, c, i) => c.card.valor > covered[best].card.valor ? i : best, 0);
        const [cardObj] = gameState.field[srcLine][resolvedTarget].splice(coveredIdx, 1);
        const destCandidates = LINES.filter(x => x !== srcLine);
        const dest = destCandidates.sort((a, b) =>
          calculateScore(gameState, a, resolvedTarget) - calculateScore(gameState, b, resolvedTarget)
        )[0] || destCandidates[0];
        gameState.field[dest][resolvedTarget].push(cardObj);
        processAbilityEffect();
      }
      break;
    }

    case 'mayFlipCovered': {
      // Oscuridad 2: voltea 1 carta cubierta de esta línea — propia o rival (opcional)
      const line = gameState.currentEffectLine;
      const hasCoveredOwn = line && gameState.field[line][targetPlayer].length >= 2;
      const hasCoveredOpp = line && gameState.field[line][opponent].length >= 2;
      const hasCoveredInLine = hasCoveredOwn || hasCoveredOpp;
      if (targetPlayer === 'player') {
        if (!hasCoveredInLine) { processAbilityEffect(); break; }
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Quieres voltear una carta cubierta de esta línea?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            // target 'any' para poder elegir carta propia o rival
            startEffect('flip', 'any', 1, { forceLine: line, coveredOnly: true });
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA: prefiere voltear cubierta propia de mayor valor (la activa);
        // si no tiene, voltea la cubierta rival de mayor valor (boca arriba→abajo = pierde puntos)
        if (hasCoveredOwn) {
          const covered = gameState.field[line].ai.slice(0, -1);
          const bestIdx = covered.reduce((b, c, i) => c.card.valor > covered[b].card.valor ? i : b, 0);
          flipAndTrigger(gameState.field[line].ai[bestIdx], line, 'ai');
        } else if (hasCoveredOpp) {
          const coveredOpp = gameState.field[line].player.slice(0, -1);
          // Voltear la de mayor valor bocaarriba → bocabajo para reducir puntuación rival
          const faceUpCovered = coveredOpp.map((c, i) => ({ c, i })).filter(({ c }) => !c.faceDown);
          if (faceUpCovered.length > 0) {
            const best = faceUpCovered.reduce((b, x) => x.c.card.valor > b.c.card.valor ? x : b);
            gameState.field[line].player[best.i].faceDown = true;
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'mayFlipCoveredFaceUp': {
      // Corrupción 3: opcional — voltea bocabajo una carta cubierta bocarriba (propia o rival)
      const hasCoveredFaceUp = LINES.some(l =>
        ['player', 'ai'].some(p =>
          gameState.field[l][p].slice(0, -1).some(c => !c.faceDown)
        )
      );
      if (!hasCoveredFaceUp) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Volteas una carta cubierta bocarriba?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('flip', 'any', 1, { coveredOnly: true, filter: 'faceUp', targetAll: true });
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        // IA: voltear la cubierta bocarriba de mayor valor del oponente; si no hay, la propia de mayor valor
        let bestTarget = null, bestLine = null, bestSide = null, bestIdx = -1;
        LINES.forEach(l => {
          gameState.field[l].player.slice(0, -1).forEach((c, i) => {
            if (!c.faceDown && (!bestTarget || c.card.valor > bestTarget.card.valor)) {
              bestTarget = c; bestLine = l; bestSide = 'player'; bestIdx = i;
            }
          });
        });
        if (!bestTarget) {
          LINES.forEach(l => {
            gameState.field[l].ai.slice(0, -1).forEach((c, i) => {
              if (!c.faceDown && (!bestTarget || c.card.valor > bestTarget.card.valor)) {
                bestTarget = c; bestLine = l; bestSide = 'ai'; bestIdx = i;
              }
            });
          });
        }
        if (bestTarget) { gameState.field[bestLine][bestSide][bestIdx].faceDown = true; updateUI(); }
        processAbilityEffect();
      }
      break;
    }

    case 'playHandFaceDown': {
      // Juega 1 carta de mano bocabajo.
      // excludeCurrentLine: debe ser en otra línea (Oscuridad 3)
      // requireFaceDownInLine: la línea destino debe tener al menos 1 carta bocabajo (Humo 3)
      const excludeLine = actionDef.excludeCurrentLine ? gameState.currentEffectLine : null;
      let allowedLines = LINES.filter(l => l !== excludeLine);
      if (actionDef.requireFaceDownInLine) {
        allowedLines = allowedLines.filter(l =>
          ['player', 'ai'].some(p => gameState.field[l][p].some(c => c.faceDown))
        );
        if (allowedLines.length === 0) { processAbilityEffect(); break; }
      }
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) { processAbilityEffect(); break; }
        if (actionDef.may) {
          // Opcional: preguntar antes de jugar bocabajo
          const confirmArea = document.getElementById('command-confirm');
          const confirmMsg = document.getElementById('confirm-msg');
          const btnYes = document.getElementById('btn-confirm-yes');
          const btnNo = document.getElementById('btn-confirm-no');
          if (confirmArea && btnYes && btnNo) {
            gameState.effectContext = { type: 'confirm' };
            confirmArea.classList.remove('hidden');
            confirmMsg.textContent = `${triggerCardName || 'Carta'}: ¿Jugar 1 carta bocabajo?`;
            btnYes.onclick = () => {
              confirmArea.classList.add('hidden');
              gameState.effectContext = { type: 'pickHandFaceDown', excludeLine, allowedLines };
              const lineMsg = excludeLine ? ' en otra línea' : '';
              updateStatus(`${triggerCardName || 'Carta'}: elige una carta de tu mano para jugar bocabajo${lineMsg}`);
              if (typeof highlightSelectableLines === 'function') highlightSelectableLines(excludeLine, allowedLines);
            };
            btnNo.onclick = () => {
              confirmArea.classList.add('hidden');
              gameState.effectContext = null;
              processAbilityEffect();
            };
          } else { processAbilityEffect(); }
          break;
        }
        gameState.effectContext = { type: 'pickHandFaceDown', excludeLine, allowedLines };
        const lineMsg = excludeLine ? ' en otra línea' : actionDef.requireFaceDownInLine ? ' en una línea con carta bocabajo' : '';
        updateStatus(`${triggerCardName || 'Carta'}: elige una carta de tu mano para jugar bocabajo${lineMsg}`);
        if (typeof highlightSelectableLines === 'function') highlightSelectableLines(excludeLine, allowedLines);
      } else {
        // IA: si may=true, solo juega si tiene cartas de sobra
        if (actionDef.may && gameState.ai.hand.length <= 3) {
          processAbilityEffect();
          break;
        }
        if (gameState.ai.hand.length > 0) {
          const cardIdx = aiLowestValueCardIdx('ai') >= 0 ? aiLowestValueCardIdx('ai') : 0;
          const dest = allowedLines.filter(l => !gameState.field[l].compiledBy)
            .sort((a, b) => calculateScore(gameState, b, 'ai') - calculateScore(gameState, a, 'ai'))[0] || allowedLines[0];
          if (dest) {
            const movedCard = gameState.ai.hand.splice(cardIdx, 1)[0];
            gameState.field[dest].ai.push({ card: movedCard, faceDown: true });
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'shiftFaceDown': {
      // Oscuridad 4: cambia 1 carta bocabajo de cualquier lugar
      startEffect('shift', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1, { filter: 'faceDown' });
      break;
    }

    case 'discardForOpponentMore': {
      // Plaga 2: descarta 1+ cartas; el oponente descarta total+1
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) { processAbilityEffect(); break; }
        gameState.effectContext = { type: 'discardVariable', selected: [], target: 'player' };
        updateStatus('Plaga 2: descarta 1 o más cartas — el rival descartará tu total +1');
        highlightEffectTargets();
      } else {
        const n = Math.max(1, Math.floor(gameState.ai.hand.length / 2));
        discard('ai', n);
        discard('player', n + 1);
        processAbilityEffect();
      }
      break;
    }

    case 'flipAllFaceUp': {
      // Plaga 3: voltea cada carta bocarriba descubierta fuera de esta línea (face-up → face-down)
      const currentLine = gameState.currentEffectLine;
      LINES.forEach(l => {
        ['player', 'ai'].forEach(p => {
          const stack = gameState.field[l][p];
          if (stack.length === 0) return;
          const top = stack[stack.length - 1];
          if (!top.faceDown && !(l === currentLine && top.card.nombre === triggerCardName)) {
            top.faceDown = true;
          }
        });
      });
      updateUI();
      processAbilityEffect();
      break;
    }

    case 'forceOpponentDeleteFaceDown': {
      // Plaga 4: el oponente (rival de quien jugó la carta) elimina 1 de SUS PROPIAS cartas bocabajo
      if (targetPlayer === 'player') {
        // Jugador jugó Plaga 4: la IA (oponente) elimina aleatoriamente una de sus propias cartas bocabajo
        const validLines = LINES.filter(l => gameState.field[l].ai.some(c => c.faceDown));
        if (validLines.length > 0) {
          // Eliminar bocabajo de menor valor (sacrificar la menos útil)
          const l = validLines.sort((a, b) => {
            const fa = gameState.field[a].ai.find(c => c.faceDown);
            const fb = gameState.field[b].ai.find(c => c.faceDown);
            return (fa?.card.valor ?? 99) - (fb?.card.valor ?? 99);
          })[0];
          const fdIdx = gameState.field[l].ai.findIndex(c => c.faceDown);
          if (fdIdx >= 0) {
            const [removed] = gameState.field[l].ai.splice(fdIdx, 1);
            gameState.ai.trash.push(removed.card);
          }
        }
        processAbilityEffect();
      } else {
        // IA jugó Plaga 4: el jugador (oponente) elige una de sus propias cartas bocabajo
        startEffect('eliminate', 'player', count || 1, { filter: 'faceDown' });
      }
      break;
    }

    case 'deleteFromEachOtherLine': {
      // Muerte 0: elimina 1 carta de cada una de las otras líneas (obligatorio si hay cartas)
      const currentLine = gameState.currentEffectLine;
      const otherLines = LINES.filter(l => l !== currentLine);
      if (targetPlayer === 'player') {
        // Encola una eliminación por cada línea distinta que tenga cartas
        [...otherLines].reverse().forEach(l => {
          const hasCards = gameState.field[l].player.length > 0 || gameState.field[l].ai.length > 0;
          if (hasCards) {
            gameState.effectQueue.unshift({
              effect: { action: 'delete', target: 'any', count: 1, forceLine: l },
              targetPlayer,
              cardName: 'Muerte 0'
            });
          }
        });
        processAbilityEffect();
      } else {
        otherLines.forEach(l => {
          // IA elimina la carta superior de cualquier pila en esa línea
          const targets = ['player', 'ai'].filter(p => gameState.field[l][p].length > 0);
          if (targets.length > 0) {
            // Preferir eliminar carta del rival; solo propia si no hay del rival
            const p = targets.includes('player') ? 'player' : 'ai';
            const removed = gameState.field[l][p].pop();
            gameState[p].trash.push(removed.card);
          }
        });
        processAbilityEffect();
      }
      break;
    }

    case 'deleteAllValueRange': {
      // Muerte 2: elige una línea, elimina TODAS las cartas (ambos lados) con valor 1-2 o bocabajo
      const min = actionDef.minVal || 1;
      const max = actionDef.maxVal || 2;
      if (targetPlayer === 'player') {
        startEffect('massDeleteByValueRange', 'any', 1, { minVal: min, maxVal: max });
      } else {
        // IA: elige la línea donde elimina más cartas
        let bestLine = null, bestCount = 0;
        LINES.forEach(l => {
          const count = ['player', 'ai'].reduce((acc, p) =>
            acc + gameState.field[l][p].filter(c => c.faceDown || (c.card.valor >= min && c.card.valor <= max)).length, 0);
          if (count > bestCount) { bestCount = count; bestLine = l; }
        });
        if (bestLine) {
          ['player', 'ai'].forEach(p => {
            const toKeep = [];
            gameState.field[bestLine][p].forEach(c => {
              if (c.faceDown || (c.card.valor >= min && c.card.valor <= max)) {
                gameState[p].trash.push(c.card);
              } else { toKeep.push(c); }
            });
            gameState.field[bestLine][p] = toKeep;
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
      const totalInLine = gameState.field[line].player.length + gameState.field[line].ai.length;
      const pairs = Math.floor(totalInLine / 2);
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
        startEffect('flip', resolvedTarget === 'any' ? 'any' : resolvedTarget, count || 1, { excludeLine: destLine });
      } else {
        const validLines = LINES.filter(l => l !== destLine && gameState.field[l][opponent].length > 0);
        if (validLines.length > 0) {
          // Voltear carta de la línea de mayor ventaja del rival
          const l = validLines.sort((a, b) => calculateScore(gameState, b, opponent) - calculateScore(gameState, a, opponent))[0];
          const stack = gameState.field[l][opponent];
          const cardObj = stack[stack.length - 1];
          gameState.lastFlippedCard = { cardObj, line: l };
          flipAndTrigger(cardObj, l, opponent);
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
        startEffect('shift', 'any', 1, {
          filter: 'faceDown',
          gravityConstraint: true,
          effectLine: destLine,
          excludeLine: destLine  // fuente no puede ser esta misma línea
        });
      } else {
        const srcLines = LINES.filter(l => l !== destLine && gameState.field[l].ai.some(c => c.faceDown));
        if (srcLines.length > 0) {
          // Mover bocabajo desde línea de menor puntuación (la menos valiosa)
          const l = srcLines.sort((a, b) => calculateScore(gameState, a, 'ai') - calculateScore(gameState, b, 'ai'))[0];
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
          stack.forEach(cardObj => {
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

    case 'deleteLowestCoveredInLine': {
      // Odio 4 onCover: elimina la carta cubierta (no-top) de menor valor en esta línea
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      let lowest = null, lowestPlayer = null, lowestIdx = -1;
      ['player', 'ai'].forEach(p => {
        const stack = gameState.field[line][p];
        // Solo cartas cubiertas: todas excepto la top (stack.length - 1)
        for (let i = 0; i < stack.length - 1; i++) {
          if (!lowest || stack[i].card.valor < lowest.card.valor) {
            lowest = stack[i]; lowestPlayer = p; lowestIdx = i;
          }
        }
      });
      if (lowest) {
        gameState.field[line][lowestPlayer].splice(lowestIdx, 1);
        gameState[lowestPlayer].trash.push(lowest.card);
        updateUI();
      }
      processAbilityEffect();
      break;
    }

    case 'drawFromOpponentDeck': {
      // Roba la carta superior del mazo del oponente (va a tu mano)
      // Si el mazo rival está vacío, baraja su descarte primero
      if (gameState[opponent].deck.length === 0 && gameState[opponent].trash.length > 0) {
        gameState[opponent].deck = gameState[opponent].trash.sort(() => Math.random() - 0.5);
        gameState[opponent].trash = [];
      }
      if (gameState[opponent].deck.length > 0) {
        const top = gameState[opponent].deck.pop();
        gameState[targetPlayer].hand.push(top);
        updateStatus(`${targetPlayer === 'player' ? 'Robas' : 'IA roba'} la carta top del mazo rival`);
        updateUI();
      }
      processAbilityEffect();
      break;
    }

    case 'mayGiveCardForDraw': {
      // Amor 1 Final: puedes dar 1 carta de tu mano; si lo haces, roba N cartas
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) { processAbilityEffect(); break; }
        
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        
        if (confirmArea && btnYes && btnNo) {
          gameState.effectQueue.unshift({ effect: { action: '_drawAfterGive', count }, targetPlayer });
          gameState.effectContext = { type: 'confirm' };
          confirmArea.style.display = 'flex';
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Das 1 carta a tu oponente para robar ${count || 2} cartas?`;
          
          btnYes.onclick = () => {
            confirmArea.style.display = 'none';
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('give', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.style.display = 'none';
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            gameState.effectQueue.shift(); // quitar _drawAfterGive
            processAbilityEffect();
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA: dar si tiene ventaja en mano o el mazo tiene cartas valiosas
        if (gameState.ai.hand.length >= 2 && gameState.ai.deck.length > 0) {
          // IA da su carta de menor valor
          const idx = aiLowestValueCardIdx('ai');
          const [given] = gameState.ai.hand.splice(idx, 1);
          gameState.player.hand.push(given);
          updateStatus(`IA da ${given.nombre} al jugador y roba ${count || 2} cartas`);
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
        updateStatus(`${targetPlayer === 'player' ? 'Tomas' : 'IA toma'} una carta de la mano rival`);
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
          // IA da su carta de menor valor
          const idx = aiLowestValueCardIdx('ai');
          const [given] = gameState.ai.hand.splice(idx, 1);
          gameState.player.hand.push(given);
          updateStatus(`IA da ${given.nombre} al jugador`);
        }
        processAbilityEffect();
      }
      break;
    }

    case 'revealFromHand': {
      // Amor 4: el jugador revela 1 carta de su mano al rival
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) { processAbilityEffect(); break; }
        startEffect('reveal', 'player', 1);
      } else {
        // IA revela su carta de menor valor (mínima información útil al jugador)
        if (gameState.ai.hand.length > 0) {
          const idx = aiLowestValueCardIdx('ai');
          const card = gameState.ai.hand[idx >= 0 ? idx : 0];
          updateStatus(`IA revela: ${card.nombre}`);
          // Mostrar modal de revelación para el jugador
          gameState.effectQueue.unshift({ effect: { action: '_showRevealedCards', cards: [card] }, targetPlayer: 'ai' });
        }
        processAbilityEffect();
      }
      break;
    }

    case '_showRevealedCards': {
      // Amor 4: mostrar las cartas seleccionadas en el modal de revelación
      const cards = actionDef.cards || [];
      const modal = document.getElementById('reveal-modal');
      const container = document.getElementById('reveal-cards-container');
      const closeBtn = document.getElementById('btn-reveal-close');
      const titleEl = document.getElementById('reveal-title');
      const subtitleEl = document.getElementById('reveal-subtitle');
      const sourceEl = document.getElementById('reveal-source');
      if (modal && container && closeBtn && typeof createCardHTML === 'function') {
        if (titleEl) titleEl.textContent = 'CARTAS REVELADAS';
        if (subtitleEl) subtitleEl.textContent = `${cards.length} carta${cards.length !== 1 ? 's' : ''}`;
        if (sourceEl) sourceEl.textContent = triggerCardName || '';
        container.innerHTML = cards.map(c => `<div style="transform: scale(0.85); transform-origin: top center;">${createCardHTML(c)}</div>`).join('');
        modal.classList.remove('hidden');
        closeBtn.onclick = () => {
          modal.classList.add('hidden');
          processAbilityEffect();
        };
      } else {
        processAbilityEffect();
      }
      break;
    }

    // ── COMPILE MAIN 2 — Nuevas acciones (Fase B) ────────────────────────────

    case 'discardHand': {
      // War 2 reactive: descarta toda la mano del jugador objetivo
      const handSize = gameState[targetPlayer].hand.length;
      if (handSize > 0) {
        gameState[targetPlayer].trash.push(...gameState[targetPlayer].hand.splice(0));
        updateStatus(`${targetPlayer === 'player' ? 'Descartas' : 'IA descarta'} toda la mano (${handSize} cartas)`);
        updateUI();
      }
      processAbilityEffect();
      break;
    }

    case 'mayShuffleDiscardIntoDeck': {
      // Clarity 4, Time 2: baraja descarte en mazo (opcional)
      if (gameState[targetPlayer].trash.length === 0) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Barajes tu descarte (${gameState.player.trash.length} cartas) en tu mazo?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            shuffleDiscardIntoDeck('player');
            processAbilityEffect();
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        // IA baraja si el mazo tiene menos de 3 cartas
        if (gameState.ai.deck.length < 3) shuffleDiscardIntoDeck('ai');
        processAbilityEffect();
      }
      break;
    }

    case 'flipCoveredInEachLine': {
      // Caos 0: en cada línea, voltea (alterna) la primera carta cubierta (sea bocaarriba o bocabajo)
      LINES.forEach(l => {
        ['player', 'ai'].forEach(p => {
          const stack = gameState.field[l][p];
          // Cualquier carta que no sea la top está cubierta — voltea la inmediatamente bajo la top
          if (stack.length >= 2) {
            flipAndTrigger(stack[stack.length - 2], l, p);
          }
        });
      });
      updateUI();
      processAbilityEffect();
      break;
    }

    // (drawFromOpponentDeck duplicado eliminado — consolidado arriba)

    case 'swapTopDeckCards': {
      // Chaos 0: cada jugador roba la carta top del mazo rival
      if (gameState.ai.deck.length > 0) gameState.player.hand.push(gameState.ai.deck.pop());
      if (gameState.player.deck.length > 0) gameState.ai.hand.push(gameState.player.deck.pop());
      updateStatus('Intercambio: cada jugador roba la top del mazo rival');
      updateUI();
      processAbilityEffect();
      break;
    }

    case 'discardHandDraw': {
      // Chaos 4: descarta mano, roba tantas como descartaste
      const n = gameState[targetPlayer].hand.length;
      if (n > 0) {
        gameState[targetPlayer].trash.push(...gameState[targetPlayer].hand.splice(0));
        draw(targetPlayer, n);
        updateStatus(`${targetPlayer === 'player' ? 'Descartas y robas' : 'IA descarta y roba'} ${n} carta${n !== 1 ? 's' : ''}`);
        updateUI();
      }
      processAbilityEffect();
      break;
    }

    case 'playTopDeckInFaceDownLines': {
      // Smoke 0: juega carta top del mazo bocabajo en cada línea con una carta bocabajo (de cualquier jugador)
      const opponent0 = targetPlayer === 'player' ? 'ai' : 'player';
      LINES.forEach(l => {
        const hasFaceDown = gameState.field[l][targetPlayer].some(c => c.faceDown)
                         || gameState.field[l][opponent0].some(c => c.faceDown);
        if (hasFaceDown && gameState[targetPlayer].deck.length > 0) {
          gameState.field[l][targetPlayer].push({ card: gameState[targetPlayer].deck.pop(), faceDown: true });
        }
      });
      updateUI();
      processAbilityEffect();
      break;
    }

    case 'discardAny': {
      // Guerra 1: descarta cualquier número de cartas (0 a toda la mano)
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) { processAbilityEffect(); break; }
        // Usa discardAny como tipo de effectContext — botón STOP visible desde el inicio
        startEffect('discardAny', 'player', gameState.player.hand.length);
      } else {
        // IA: descarta si tiene más de 4 cartas (heurística simple)
        if (gameState.ai.hand.length > 4) discard('ai', 1);
        processAbilityEffect();
      }
      break;
    }

    case 'drawAndMayShiftSelf': {
      // Time 2 onDeckShuffle: roba 1 carta y puedes cambiar esta carta
      draw(targetPlayer, 1);
      gameState.effectQueue.unshift({ effect: { action: 'mayShiftSelf' }, targetPlayer, cardName: triggerCardName });
      processAbilityEffect();
      break;
    }

    // ── Cartas faltantes Main 2 ───────────────────────────────────────────────

    case 'returnOpponentFaceDown': {
      // Asimilación 0: trae a TU mano 1 carta bocabajo (cubierta o no) del oponente
      const hasFD = LINES.some(l => gameState.field[l][opponent].some(c => c.faceDown));
      if (!hasFD) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        // beneficiary='player' → la carta va a la mano del jugador, no del oponente
        // targetAll=true → permite seleccionar cartas cubiertas
        startEffect('return', 'opponent', 1, { filter: 'faceDown', targetAll: true, beneficiary: 'player' });
      } else {
        // IA: roba la bocabajo del jugador de mayor valor (cubierta o top)
        let best = null, bestLine = null, bestIdx = -1;
        LINES.forEach(l => {
          gameState.field[l][opponent].forEach((c, i) => {
            if (c.faceDown && (!best || c.card.valor > best.card.valor)) {
              best = c; bestLine = l; bestIdx = i;
            }
          });
        });
        if (best) {
          gameState.field[bestLine][opponent].splice(bestIdx, 1);
          gameState[targetPlayer].hand.push(best.card); // va a la mano de la IA, no del jugador
          updateUI();
        }
        processAbilityEffect();
      }
      break;
    }

    case 'playOpponentTopDeckHere': {
      // Asimilación 2 onTurnEnd: juega bocabajo la carta top del mazo rival EN ESTA PILA (del targetPlayer)
      const line = gameState.currentEffectLine;
      if (line && gameState[opponent].deck.length > 0) {
        const top = gameState[opponent].deck.pop();
        gameState.field[line][targetPlayer].push({ card: top, faceDown: true });
        updateUI();
      }
      processAbilityEffect();
      break;
    }

    case 'playOwnTopDeckOpponentSide': {
      // Asimilación 6 onTurnEnd: juega bocabajo tu carta top en el lado rival (línea a elegir)
      if (gameState[targetPlayer].deck.length === 0) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        // waitingForLine: true es necesario para que el click de línea dispare handleShiftTargetLine
        gameState.effectContext = { type: 'playTopDeckFaceDownOpponentChooseLine', owner: 'player', opponent: 'ai', waitingForLine: true };
        updateStatus('Asimilación 6: elige la línea donde colocar bocabajo en el lado del rival');
        if (typeof highlightSelectableLines === 'function') highlightSelectableLines();
      } else {
        // IA: coloca donde su ventaja sea mayor (el +2 al jugador duele menos en una línea ya ganada)
        const bestLine = LINES.reduce((best, l) => {
          const advL   = calculateScore(gameState, l, 'ai')   - calculateScore(gameState, l, 'player');
          const advB   = calculateScore(gameState, best, 'ai') - calculateScore(gameState, best, 'player');
          return advL > advB ? l : best;
        }, LINES[0]);
        const top = gameState.ai.deck.pop();
        gameState.field[bestLine].player.push({ card: top, faceDown: true });
        updateUI();
        processAbilityEffect();
      }
      break;
    }

    case 'drawIfNoHand': {
      // Valor 0 onTurnStart: si no tienes cartas en mano, roba 1
      if (gameState[targetPlayer].hand.length === 0) draw(targetPlayer, 1);
      processAbilityEffect();
      break;
    }

    case 'optionalDiscardThenOpponentDiscard': {
      // Valor 0 onTurnEnd: puedes descartar 1; si lo haces, oponente descarta 1
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) { processAbilityEffect(); break; }
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg  = document.getElementById('confirm-msg');
        const btnYes      = document.getElementById('btn-confirm-yes');
        const btnNo       = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Descartas 1 carta? Si lo haces, tu oponente también descartará 1.`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            gameState.effectQueue.unshift({ effect: { action: 'discard', target: 'opponent', count: 1 }, targetPlayer, cardName: triggerCardName });
            startEffect('discard', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        if (gameState.ai.hand.length > 3) { discard('ai', 1); discard('player', 1); }
        processAbilityEffect();
      }
      break;
    }

    case 'revealTopDeckMayDiscard': {
      // Claridad 1 onTurnStart: revela carta top del mazo, puedes descartarla
      if (gameState[targetPlayer].deck.length === 0) { processAbilityEffect(); break; }
      const topCard = gameState[targetPlayer].deck[gameState[targetPlayer].deck.length - 1];
      if (targetPlayer === 'player') {
        const modal     = document.getElementById('reveal-modal');
        const container = document.getElementById('reveal-cards-container');
        const closeBtn  = document.getElementById('btn-reveal-close');
        const titleEl   = document.getElementById('reveal-title');
        const subtitleEl = document.getElementById('reveal-subtitle');
        const sourceEl  = document.getElementById('reveal-source');
        const actionsEl = document.getElementById('reveal-actions');
        if (modal && container && closeBtn && typeof createCardHTML === 'function') {
          if (titleEl) titleEl.textContent = 'TOPE DEL MAZO';
          if (subtitleEl) subtitleEl.textContent = 'Puedes descartar esta carta';
          if (sourceEl) sourceEl.textContent = triggerCardName || '';
          container.innerHTML = `<div style="transform:scale(0.85);transform-origin:top center">${createCardHTML(topCard)}</div>`;
          actionsEl.innerHTML = `
            <button class="ui-btn ui-btn--danger" id="btn-reveal-discard">DESCARTAR</button>
            <button class="ui-btn" id="btn-reveal-close">MANTENER</button>
          `;
          modal.classList.remove('hidden');
          const cleanup = () => { modal.classList.add('hidden'); };
          document.getElementById('btn-reveal-close').onclick = () => { cleanup(); processAbilityEffect(); };
          document.getElementById('btn-reveal-discard').onclick = () => {
            cleanup();
            gameState.player.deck.pop();
            gameState.player.trash.push(topCard);
            updateUI();
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        if (topCard.valor <= 1) { gameState.ai.deck.pop(); gameState.ai.trash.push(topCard); }
        processAbilityEffect();
      }
      break;
    }

    case 'searchDeckByValue': {
      // Claridad 3: busca cartas con Valor dado en el mazo; si hay 1 la roba automáticamente,
      // si hay varias el jugador elige; baraja el mazo después.
      const targetValue = actionDef.value || 5;
      const deckRef = gameState[targetPlayer].deck;

      const shuffleDeck = () => {
        for (let i = deckRef.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deckRef[i], deckRef[j]] = [deckRef[j], deckRef[i]];
        }
      };

      // Reunir índices de cartas con el valor buscado (de mayor a menor para splice seguro)
      const matchIdx = [];
      for (let i = 0; i < deckRef.length; i++) {
        if (deckRef[i].valor === targetValue) matchIdx.push(i);
      }

      if (matchIdx.length === 0) {
        updateStatus(`No hay cartas con Valor ${targetValue} en el mazo`);
        shuffleDeck();
        updateUI();
        processAbilityEffect();
        break;
      }

      if (matchIdx.length === 1 || targetPlayer !== 'player') {
        // IA o sólo 1 carta: robar directamente
        const drawn = deckRef.splice(matchIdx[0], 1)[0];
        gameState[targetPlayer].hand.push(drawn);
        updateStatus(`${targetPlayer === 'player' ? 'Robas' : 'IA roba'} ${drawn.nombre} (Valor ${targetValue}) del mazo`);
        shuffleDeck();
        updateUI();
        processAbilityEffect();
        break;
      }

      // Múltiples cartas con el valor buscado: jugador elige cuál robar usando modal
      const matchCards = [];
      for (let i = matchIdx.length - 1; i >= 0; i--) {
        matchCards.unshift(deckRef.splice(matchIdx[i], 1)[0]);
      }
      
      const modal = document.getElementById('reveal-modal');
      const container = document.getElementById('reveal-cards-container');
      const titleEl = document.getElementById('reveal-title');
      const subtitleEl = document.getElementById('reveal-subtitle');
      const sourceEl = document.getElementById('reveal-source');
      const actionsEl = document.getElementById('reveal-actions');
      
      if (modal && container && typeof createCardHTML === 'function') {
        gameState.effectContext = { 
          type: 'pickDeckCard_valor5', 
          matchCards,
          targetValue,
          selectedIdx: null 
        };
        
        if (titleEl) titleEl.textContent = `ELIGE 1 CARTA (Valor ${targetValue})`;
        if (subtitleEl) subtitleEl.textContent = 'Roba esta carta, baraja el resto en tu mazo';
        if (sourceEl) sourceEl.textContent = triggerCardName || '';
        
        container.innerHTML = matchCards.map((c, idx) => 
          `<div class="reveal-card-select" data-idx="${idx}" style="transform: scale(0.85); transform-origin: top center; cursor: pointer;">
            ${createCardHTML(c)}
          </div>`
        ).join('');
        
        actionsEl.innerHTML = '<button class="ui-btn" id="btn-reveal-continue">ROBAR</button>';
        modal.classList.remove('hidden');
        
        let selectedIdx = null;
        container.querySelectorAll('.reveal-card-select').forEach(el => {
          el.onclick = () => {
            container.querySelectorAll('.reveal-card-select').forEach(x => x.classList.remove('selected'));
            el.classList.add('selected');
            selectedIdx = parseInt(el.dataset.idx);
            gameState.effectContext.selectedIdx = selectedIdx;
          };
        });
        
        document.getElementById('btn-reveal-continue').onclick = () => {
          if (selectedIdx === null) {
            alert('Selecciona una carta primero');
            return;
          }
          const chosenCard = matchCards[selectedIdx];
          // Devolver las no elegidas al mazo y barajar
          matchCards.forEach((c, i) => { 
            if (i !== selectedIdx) gameState.player.deck.push(c); 
          });
          gameState.player.hand.push(chosenCard);
          // Barajar mazo
          shuffleDeck();
          modal.classList.add('hidden');
          container.innerHTML = '';
          gameState.effectContext = null;
          updateStatus(`Robas ${chosenCard.nombre} (Valor ${targetValue}) del mazo`);
          updateUI();
          processAbilityEffect();
        };
      } else {
        // Fallback: mover a mano si no hay modal
        const handSizeBefore = gameState.player.hand.length;
        gameState.player.hand.push(...matchCards);
        gameState.effectContext = { type: 'pickDeckCard_valor5', handSizeBefore, revealedCount: matchCards.length, targetValue };
        showCancelButton();
        updateStatus(`Claridad 3: ${matchCards.length} cartas con Valor ${targetValue} en tu mazo — elige cuál robar`);
        updateUI();
      }
      break;
    }

    case 'searchDeckValue1ThenPlay': {
      // Claridad 2: revela mazo, elige 1 carta con Valor 1 para robar, baraja mazo, juega 1 carta con Valor 1
      const deckRef = gameState[targetPlayer].deck;
      const v1Indices = [];
      for (let i = 0; i < deckRef.length; i++) {
        if (deckRef[i].valor === 1) v1Indices.push(i);
      }

      // Helper: baraja mazo y lanza el paso "jugar carta Valor 1"
      const shuffleThenPlayStep = () => {
        for (let i = deckRef.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deckRef[i], deckRef[j]] = [deckRef[j], deckRef[i]];
        }
        updateUI();
        const v1InHand = gameState[targetPlayer].hand.filter(c => c.valor === 1);
        if (v1InHand.length === 0) { processAbilityEffect(); return; }
        if (targetPlayer === 'player') {
          gameState.effectContext = { type: 'playHandCard_valor1' };
          updateStatus('Claridad 2: juega 1 carta con Valor 1 de tu mano');
          updateUI();
        } else {
          const bestIdx = gameState.ai.hand.findIndex(c => c.valor === 1);
          const bestCard = gameState.ai.hand.splice(bestIdx, 1)[0];
          const bestLine = LINES.reduce((best, l) => {
            const advanL = (calculateScore(gameState, l, 'ai') + bestCard.valor) - calculateScore(gameState, l, 'player');
            const advanB = (calculateScore(gameState, best, 'ai') + bestCard.valor) - calculateScore(gameState, best, 'player');
            return advanL > advanB ? l : best;
          }, LINES[0]);
          gameState.field[bestLine].ai.push({ card: bestCard, faceDown: false });
          updateUI();
          processAbilityEffect();
        }
      };

      if (v1Indices.length === 0) {
        // No hay valor-1 en mazo: solo barajar
        updateStatus('Claridad 2: no hay cartas con Valor 1 en el mazo');
        shuffleThenPlayStep();
        break;
      }

      if (v1Indices.length === 1 || targetPlayer === 'ai') {
        // Una sola opción o IA: auto-robar la primera
        const [drawn] = deckRef.splice(v1Indices[0], 1);
        gameState[targetPlayer].hand.push(drawn);
        updateStatus(`${targetPlayer === 'player' ? 'Robas' : 'IA roba'} ${drawn.nombre} (Valor 1) del mazo`);
        shuffleThenPlayStep();
        break;
      }

      // Múltiples valor-1 en mazo: jugador elige cuál robar
      // Extrae todas de mayor a menor índice para no desplazar índices
      const revealedCards = [];
      for (let i = v1Indices.length - 1; i >= 0; i--) {
        revealedCards.unshift(deckRef.splice(v1Indices[i], 1)[0]);
      }
      const handSizeBefore = gameState.player.hand.length;
      gameState.player.hand.push(...revealedCards);
      gameState.effectContext = { type: 'pickDeckCard_valor1', handSizeBefore, revealedCount: revealedCards.length };
      updateStatus(`Claridad 2: ${revealedCards.length} cartas con Valor 1 reveladas en tu mazo — elige cuál robar`);
      updateUI();
      break;
    }

    case 'deleteInWinningOpponentLine': {
      // Valor 1: elimina 1 carta del oponente en línea donde su total > el tuyo
      const winLines = LINES.filter(l => {
        return calculateScore(gameState, l, opponent) > calculateScore(gameState, l, targetPlayer) &&
               gameState.field[l][opponent].length > 0;
      });
      if (winLines.length === 0) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        startEffect('eliminate', 'opponent', 1, { allowedLines: winLines });
      } else {
        const best = winLines.sort((a, b) => calculateScore(gameState, b, 'player') - calculateScore(gameState, a, 'player'))[0];
        const removed = gameState.field[best].player.pop();
        if (removed) { gameState.player.trash.push(removed.card); updateUI(); }
        processAbilityEffect();
      }
      break;
    }

    case 'mayShiftSelfToHighestOpponentLine': {
      // Valor 3 onTurnEnd: puede cambiar esta carta a la línea donde el oponente tiene más puntos
      const curLine = gameState.currentEffectLine;
      if (!curLine) { processAbilityEffect(); break; }
      const bestLine = LINES.reduce((best, l) =>
        calculateScore(gameState, l, opponent) > calculateScore(gameState, best, opponent) ? l : best, LINES[0]);
      if (bestLine === curLine) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg  = document.getElementById('confirm-msg');
        const btnYes      = document.getElementById('btn-confirm-yes');
        const btnNo       = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `Valor 3: ¿Cambias esta carta a ${bestLine} (línea más fuerte del rival)?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            const srcStack = gameState.field[curLine][targetPlayer];
            if (srcStack.length > 0) {
              const cardObj = srcStack.pop();
              gameState.field[bestLine][targetPlayer].push(cardObj);
              gameState.currentEffectLine = bestLine;
              updateUI();
            }
            processAbilityEffect();
          };
          btnNo.onclick = () => { confirmArea.classList.add('hidden'); gameState.effectContext = null; processAbilityEffect(); };
        } else { processAbilityEffect(); }
      } else {
        if (calculateScore(gameState, bestLine, 'player') > calculateScore(gameState, curLine, 'player')) {
          const srcStack = gameState.field[curLine].ai;
          if (srcStack.length > 0) { gameState.field[bestLine].ai.push(srcStack.pop()); updateUI(); }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'drawIfOpponentWinsLine': {
      // Valor 2 onTurnEnd: si el oponente tiene mayor valor en esta línea, roba 1 carta
      const line = gameState.currentEffectLine;
      if (line && calculateScore(gameState, line, opponent) > calculateScore(gameState, line, targetPlayer)) {
        draw(targetPlayer, 1);
        updateStatus(`${triggerCardName}: oponente gana esta línea — ${targetPlayer === 'player' ? 'robas' : 'IA roba'} 1 carta`);
      }
      processAbilityEffect();
      break;
    }

    case 'flipSelfIfOpponentWins': {
      // Valor 6 onTurnEnd: si el oponente gana esta línea, voltea esta carta
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      if (calculateScore(gameState, line, opponent) > calculateScore(gameState, line, targetPlayer)) {
        const stack = gameState.field[line][targetPlayer];
        const cardObj = stack.find(c => c.card.nombre === triggerCardName);
        if (cardObj) { flipAndTrigger(cardObj, line, targetPlayer); updateUI(); }
      }
      processAbilityEffect();
      break;
    }

    case 'flipCoveredInOwnStack': {
      // Corrupción 0 onTurnStart: voltea bocarriba→bocabajo 1 otra carta (cubierta o descubierta) en esta pila
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      const stack = gameState.field[line][targetPlayer];
      // Índices de cartas bocarriba que no sean Corrupción 0 (cubierta o descubierta)
      const faceUpIdx = [];
      for (let i = 0; i < stack.length; i++) {
        if (!stack[i].faceDown && stack[i].card.nombre !== 'Corrupción 0') faceUpIdx.push(i);
      }
      if (faceUpIdx.length === 0) { updateStatus(`Corrupción 0: sin cartas bocarriba para voltear`); processAbilityEffect(); break; }
      if (targetPlayer === 'ai' || faceUpIdx.length === 1) {
        const idx = targetPlayer === 'ai'
          ? faceUpIdx.reduce((best, i) => stack[i].card.valor > stack[best].card.valor ? i : best, faceUpIdx[0])
          : faceUpIdx[0];
        stack[idx].faceDown = true;
        updateUI();
        processAbilityEffect();
      } else {
        // Jugador elige cuál voltear (2+ opciones)
        startEffect('flip', 'player', 1, { forceLine: line, filter: 'faceUp', excludeCardName: 'Corrupción 0', targetAll: true });
      }
      break;
    }

    case 'optionalDiscardOrDeleteSelf': {
      // Corrupción 6 onTurnEnd: descarta 1 carta o elimina esta carta
      if (targetPlayer === 'player') {
        if (gameState.player.hand.length === 0) {
          // Sin cartas en mano: auto-elimina sin modal
          gameState.effectQueue.unshift({ effect: { action: '_deleteSelf' }, targetPlayer, cardName: triggerCardName });
          processAbilityEffect();
          break;
        }
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg  = document.getElementById('confirm-msg');
        const btnYes      = document.getElementById('btn-confirm-yes');
        const btnNo       = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Descartas 1 carta? NO = esta carta es eliminada.`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            startEffect('discard', 'player', 1);
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            gameState.effectQueue.unshift({ effect: { action: '_deleteSelf' }, targetPlayer, cardName: triggerCardName });
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        if (gameState.ai.hand.length > 0) discard('ai', 1);
        else { gameState.effectQueue.unshift({ effect: { action: '_deleteSelf' }, targetPlayer, cardName: triggerCardName }); }
        processAbilityEffect();
      }
      break;
    }

    case 'mayShiftCovered': {
      // Caos 2: cambia 1 de tus cartas cubiertas
      const hasCovered = LINES.some(l => gameState.field[l][targetPlayer].length > 1);
      if (!hasCovered) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        startEffect('shift', 'self', 1, { coveredOnly: true });
      } else {
        let bestSrc = null, bestLine = null, bestIdx = -1;
        LINES.forEach(l => {
          const st = gameState.field[l].ai;
          for (let i = 0; i < st.length - 1; i++) {
            if (!bestSrc || st[i].card.valor < bestSrc.card.valor) {
              bestSrc = st[i]; bestLine = l; bestIdx = i;
            }
          }
        });
        if (bestSrc) {
          const destLine = LINES.filter(l => l !== bestLine)
            .reduce((b, l) => calculateScore(gameState, l, 'ai') > calculateScore(gameState, b, 'ai') ? l : b, LINES.filter(l => l !== bestLine)[0]);
          gameState.field[bestLine].ai.splice(bestIdx, 1);
          gameState.field[destLine].ai.push(bestSrc);
          updateUI();
        }
        processAbilityEffect();
      }
      break;
    }

    case 'opponentDiscardAndRedraw': {
      // Miedo 1: rival descarta mano, roba (mano - N) cartas
      const minusN = actionDef.minusN || 1;
      const handSize = gameState[opponent].hand.length;
      if (handSize > 0) {
        gameState[opponent].trash.push(...gameState[opponent].hand.splice(0));
        const toDraw = Math.max(0, handSize - minusN);
        if (toDraw > 0) draw(opponent, toDraw);
        updateStatus(`${opponent === 'player' ? 'Descartas' : 'IA descarta'} mano y roba ${toDraw} carta${toDraw !== 1 ? 's' : ''}`);
        updateUI();
      }
      processAbilityEffect();
      break;
    }

    case 'discardToOpponentTrash': {
      // Asimilación 1: descarta 1 carta propia al descarte del oponente
      if (gameState[targetPlayer].hand.length === 0) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        // Jugador elige qué carta descartar (va al trash del oponente)
        gameState._discardToOpponentTrash = true;
        startEffect('discard', 'player', count || 1);
      } else {
        // IA: descarta la carta de menor valor al trash del rival
        const hand = gameState.ai.hand;
        if (hand.length > 0) {
          const minIdx = hand.reduce((best, c, i) => c.valor < hand[best].valor ? i : best, 0);
          const card = hand.splice(minIdx, 1)[0];
          gameState[opponent].trash.push(card);
          updateStatus(`IA descarta ${card.nombre} al descarte del jugador`);
          updateUI();
        }
        processAbilityEffect();
      }
      break;
    }

    case 'drawIfEmptyHand': {
      // Paz 1 onTurnEnd: si mano vacía, roba N cartas
      if (gameState[targetPlayer].hand.length === 0) draw(targetPlayer, count || 1);
      processAbilityEffect();
      break;
    }

    case 'optionalDiscardThenFlipHighValue': {
      // Paz 3: puedes descartar 1 carta; luego voltea 1 con valor > cartas en mano
      if (targetPlayer === 'player') {
        const doFlip = () => {
          const handCount = gameState.player.hand.length;
          gameState.effectQueue.unshift({ effect: { action: '_flipMinValue', minValue: handCount + 1 }, targetPlayer, cardName: triggerCardName });
          processAbilityEffect();
        };
        if (gameState.player.hand.length === 0) { doFlip(); break; }
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg  = document.getElementById('confirm-msg');
        const btnYes      = document.getElementById('btn-confirm-yes');
        const btnNo       = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = 'Paz 3: ¿Descartas 1 carta? (opcional)';
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            // minValue 'dynamic': se calcula tras el descarte como handCount + 1
            gameState.effectQueue.unshift({ effect: { action: '_flipMinValue', minValue: 'dynamic' }, targetPlayer, cardName: triggerCardName });
            startEffect('discard', 'player', 1);
          };
          btnNo.onclick = () => { confirmArea.classList.add('hidden'); gameState.effectContext = null; doFlip(); };
        } else { doFlip(); }
      } else {
        if (gameState.ai.hand.length > 2) discard('ai', 1);
        const handCount = gameState.ai.hand.length;
        let done = false;
        LINES.forEach(l => {
          if (done) return;
          ['player', 'ai'].forEach(p => {
            if (done) return;
            const st = gameState.field[l][p];
            if (st.length > 0 && st[st.length - 1].card.valor > handCount) {
              const wasFaceDown = st[st.length - 1].faceDown;
              st[st.length - 1].faceDown = !st[st.length - 1].faceDown;
              if (wasFaceDown && typeof triggerFlipFaceUp === 'function') triggerFlipFaceUp(st[st.length - 1], l, p);
              done = true;
            }
          });
        });
        processAbilityEffect();
      }
      break;
    }

    case '_flipMinValue': {
      // 'dynamic': calcular tras el descarte como handCount + 1
      const minVal = actionDef.minValue === 'dynamic'
        ? gameState[targetPlayer].hand.length + 1
        : (actionDef.minValue !== undefined ? actionDef.minValue : 0);
      if (targetPlayer === 'player') {
        startEffect('flip', 'any', 1, { filter: 'minValue', minVal });
      } else {
        // IA: voltea la primera carta con valor > minVal
        let done = false;
        LINES.forEach(l => {
          if (done) return;
          ['player', 'ai'].forEach(p => {
            if (done) return;
            const st = gameState.field[l][p];
            if (st.length > 0 && st[st.length - 1].card.valor > minVal) {
              flipAndTrigger(st[st.length - 1], l, p);
              done = true;
            }
          });
        });
        processAbilityEffect();
      }
      break;
    }

    case 'mayFlipSelf': {
      // Guerra 0: puedes voltear ESTA carta (opcional)
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      const st = gameState.field[line][targetPlayer];
      const selfCard = st.find(c => c.card.nombre === triggerCardName);
      if (!selfCard) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName}: ¿Voltear esta carta?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            flipAndTrigger(selfCard, line, targetPlayer);
            updateUI();
            processAbilityEffect();
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        // IA: voltea si está bocarriba (para ocultarla) — decisión simple
        flipAndTrigger(selfCard, line, targetPlayer);
        updateUI();
        processAbilityEffect();
      }
      break;
    }

    case 'flipSelfIfMultipleHandCards': {
      // Paz 6: si tienes más de 1 carta en mano, voltea esta carta
      if (gameState[targetPlayer].hand.length > 1) {
        const line = gameState.currentEffectLine;
        if (line) {
          const st = gameState.field[line][targetPlayer];
          if (st.length > 0) { flipAndTrigger(st[st.length - 1], line, targetPlayer); updateUI(); }
        }
      }
      processAbilityEffect();
      break;
    }

    case 'flipOpponentSameLine': {
      // Espejo 3: voltea 1 carta del oponente en la misma línea donde se volteó la propia
      const line = (gameState.lastFlippedCard && gameState.lastFlippedCard.line) || gameState.currentEffectLine;
      if (!line || gameState.field[line][opponent].length === 0) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        startEffect('flip', opponent, 1, { forceLine: line });
      } else {
        const st = gameState.field[line][opponent];
        flipAndTrigger(st[st.length - 1], line, opponent);
        updateUI();
        processAbilityEffect();
      }
      break;
    }

    case 'swapOwnTwoStacks': {
      // Espejo 2: intercambia todas las cartas de una pila propia con otra pila propia
      if (targetPlayer === 'player') {
        // Jugador elige las dos líneas a intercambiar
        gameState.effectContext = { type: 'rearrange', target: 'player', count: 1, selected: [], swapCards: true };
        if (typeof highlightEffectTargets === 'function') highlightEffectTargets();
        updateUI();
      } else {
        // IA: intercambia la línea con peor diferencia con la de mejor diferencia
        const lineScores = LINES.map(l => ({ l, score: calculateScore(gameState, l, 'ai') - calculateScore(gameState, l, 'player') }))
          .sort((a, b) => a.score - b.score);
        if (lineScores.length >= 2) {
          const [a, b2] = [lineScores[0].l, lineScores[lineScores.length - 1].l];
          if (a !== b2) {
            const tmp = gameState.field[a].ai;
            gameState.field[a].ai = gameState.field[b2].ai;
            gameState.field[b2].ai = tmp;
            updateUI();
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'mayFlipOrDrawIfUnityOnField': {
      // Unidad 0: si hay otra carta Unidad en el campo, voltea 1 o roba 1
      const hasOtherUnity = LINES.some(l =>
        ['player', 'ai'].some(p =>
          gameState.field[l][p].some(c => c.card.nombre !== triggerCardName && c.card.nombre.startsWith('Unidad'))
        )
      );
      if (!hasOtherUnity) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg  = document.getElementById('confirm-msg');
        const btnYes      = document.getElementById('btn-confirm-yes');
        const btnNo       = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = 'Unidad 0: ¿Volteas 1 carta (SÍ) o Robas 1 carta (NO)?';
          btnYes.onclick = () => { confirmArea.classList.add('hidden'); gameState.effectContext = null; startEffect('flip', 'any', 1); };
          btnNo.onclick  = () => { confirmArea.classList.add('hidden'); gameState.effectContext = null; draw('player', 1); processAbilityEffect(); };
        } else { processAbilityEffect(); }
      } else {
        if (gameState.ai.hand.length < 4) { draw('ai', 1); }
        else {
          let done = false;
          LINES.forEach(l => {
            if (done) return;
            const st = gameState.field[l].player;
            if (st.length > 0 && !st[st.length - 1].faceDown) { st[st.length - 1].faceDown = true; done = true; }
          });
        }
        processAbilityEffect();
      }
      break;
    }

    case 'drawPerUnityCards': {
      // Unidad 2: roba cartas = número de cartas Unidad en el campo
      const unityCount = LINES.reduce((acc, l) =>
        acc + ['player', 'ai'].reduce((a2, p) => a2 + gameState.field[l][p].filter(c => c.card.nombre.startsWith('Unidad')).length, 0), 0);
      if (unityCount > 0) draw(targetPlayer, unityCount);
      processAbilityEffect();
      break;
    }

    case 'mayFlipIfUnityOnField': {
      // Unidad 3: si hay otra Unidad en el campo, voltea 1 carta bocabajo
      const hasOtherUnity = LINES.some(l =>
        ['player', 'ai'].some(p =>
          gameState.field[l][p].some(c => c.card.nombre !== triggerCardName && c.card.nombre.startsWith('Unidad'))
        )
      );
      if (!hasOtherUnity) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        startEffect('flip', 'any', 1, { filter: 'faceDown' });
      } else {
        let done = false;
        LINES.forEach(l => {
          if (done) return;
          const st = gameState.field[l].ai;
          const fd = st.filter(c => c.faceDown);
          if (fd.length > 0) {
            const flipped = fd.sort((a, b) => b.card.valor - a.card.valor)[0];
            flipped.faceDown = false;
            if (typeof triggerFlipFaceUp === 'function') triggerFlipFaceUp(flipped, l, 'ai');
            done = true;
          }
        });
        processAbilityEffect();
      }
      break;
    }

    case 'drawUnityFromDeckIfEmptyHand': {
      // Unidad 4 onTurnEnd: si mano vacía, busca y roba todas las Unidad del mazo
      if (gameState[targetPlayer].hand.length > 0) { processAbilityEffect(); break; }
      const deckRef = gameState[targetPlayer].deck;
      const unitCards = deckRef.filter(c => c.nombre.startsWith('Unidad'));
      if (unitCards.length > 0) {
        unitCards.forEach(c => {
          const i = deckRef.indexOf(c);
          if (i >= 0) deckRef.splice(i, 1);
          gameState[targetPlayer].hand.push(c);
        });
        for (let i = deckRef.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deckRef[i], deckRef[j]] = [deckRef[j], deckRef[i]];
        }
        updateStatus(`${targetPlayer === 'player' ? 'Robas' : 'IA roba'} ${unitCards.length} carta${unitCards.length !== 1 ? 's' : ''} Unidad del mazo`);
        updateUI();
      }
      processAbilityEffect();
      break;
    }

    case 'compileSelfIfFiveOrMoreUnity': {
      // Unidad 1 onPlay: si hay 5+ Unidad en campo (cualquier lado, cualquier estado), compila esta línea
      const totalUnity = LINES.reduce((acc, l) =>
        acc + ['player', 'ai'].reduce((a2, p) =>
          a2 + gameState.field[l][p].filter(c => c.card.nombre.startsWith('Unidad')).length, 0), 0);
      if (totalUnity >= 5) {
        const line = gameState.currentEffectLine;
        if (line && typeof compileLine === 'function') {
          updateStatus(`${triggerCardName}: 5+ Unidad en campo — compilando ${line} automáticamente`);
          compileLine(line, targetPlayer);
          updateUI();
        }
      }
      processAbilityEffect();
      break;
    }

    case 'playUnidadCardsFromHand': {
      // Unidad 1 onTurnEnd: jugar bocarriba todas las cartas Unidad de la mano en esta línea
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      const hand = gameState[targetPlayer].hand;
      const unidadCards = hand.filter(c => c.nombre.startsWith('Unidad'));
      if (unidadCards.length === 0) { processAbilityEffect(); break; }
      unidadCards.forEach(c => {
        const idx = hand.indexOf(c);
        if (idx !== -1) {
          hand.splice(idx, 1);
          gameState.field[line][targetPlayer].push({ card: c, faceDown: false });
        }
      });
      updateStatus(`${triggerCardName}: ${unidadCards.length} carta(s) Unidad jugada(s) bocarriba en ${line}`);
      updateUI();
      processAbilityEffect();
      break;
    }

    case 'mayShiftSelfIfCovered': {
      // Hielo 3, Unidad 1: si esta carta está cubierta, puede cambiarla
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      const st = gameState.field[line][targetPlayer];
      const selfIdx = st.findIndex(c => c.card.nombre === triggerCardName);
      if (selfIdx < 0 || selfIdx === st.length - 1) { processAbilityEffect(); break; }
      const cardObj = st[selfIdx];
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg  = document.getElementById('confirm-msg');
        const btnYes      = document.getElementById('btn-confirm-yes');
        const btnNo       = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName}: está cubierta. ¿Quieres cambiarla a otra línea?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = {
              type: 'shiftSelf', sourceLine: line, target: 'player',
              count: 1, selected: [], waitingForLine: true,
              cardRef: cardObj
            };
            updateStatus(`${triggerCardName}: elige línea destino`);
            if (typeof highlightSelectableLines === 'function') highlightSelectableLines(line);
          };
          btnNo.onclick = () => { confirmArea.classList.add('hidden'); gameState.effectContext = null; processAbilityEffect(); };
        } else { processAbilityEffect(); }
      } else {
        const destLine = LINES.filter(l => l !== line)
          .reduce((b, l) => calculateScore(gameState, l, 'ai') > calculateScore(gameState, b, 'ai') ? l : b, LINES.filter(l => l !== line)[0] || line);
        if (destLine && destLine !== line) {
          st.splice(selfIdx, 1);
          gameState.field[destLine].ai.push(cardObj);
          updateUI();
        }
        processAbilityEffect();
      }
      break;
    }

    case 'luckDiscardTopDraw': {
      // Suerte 2: descarta carta top del mazo, roba tantas como su valor
      if (gameState[targetPlayer].deck.length === 0) { processAbilityEffect(); break; }
      const topCard = gameState[targetPlayer].deck.pop();
      gameState[targetPlayer].trash.push(topCard);
      const drawN = topCard.valor;
      updateStatus(`Suerte 2: ${topCard.nombre} (Valor ${drawN}) → roba ${drawN}`);
      if (drawN > 0) draw(targetPlayer, drawN);
      updateUI();
      processAbilityEffect();
      break;
    }

    case 'luckCallProtocolDiscard': {
      // Suerte 3: declara protocolo → descarta top rival → si coincide, elimina 1 carta
      if (gameState[opponent].deck.length === 0) { processAbilityEffect(); break; }
      // 6 protocolos en juego (3 jugador + 3 rival, sin duplicados)
      const allProtos = [...new Set([...gameState[targetPlayer].protocols, ...gameState[opponent].protocols])].filter(Boolean);
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          const dropItems = allProtos.map(p => `<div class="ui-dropdown-item" data-val="${p}"><span class="drop-dot"></span><span class="drop-text">${p}</span></div>`).join('');
          confirmMsg.innerHTML = `${triggerCardName || ''}: Declara un Protocolo
            <div class="ui-dropdown" id="luck3-dropdown" style="margin-top:10px;">
              <div class="ui-dropdown-trigger" id="luck3-trigger">
                <span class="drop-placeholder" id="luck3-placeholder">Elige protocolo</span>
                <span class="drop-value" id="luck3-value" style="display:none;"><span class="drop-dot"></span><span id="luck3-val-text"></span></span>
                <svg class="drop-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div class="ui-dropdown-list">${dropItems}</div>
            </div>`;
          // Dropdown behavior
          const dd3 = document.getElementById('luck3-dropdown');
          dd3.querySelector('.ui-dropdown-trigger').onclick = () => dd3.classList.toggle('open');
          dd3.querySelectorAll('.ui-dropdown-item').forEach(it => {
            it.onclick = () => {
              dd3.querySelectorAll('.ui-dropdown-item').forEach(x => x.classList.remove('active'));
              it.classList.add('active');
              dd3.dataset.selected = it.dataset.val;
              document.getElementById('luck3-placeholder').style.display = 'none';
              const valEl = document.getElementById('luck3-value');
              valEl.style.display = 'flex';
              document.getElementById('luck3-val-text').textContent = it.dataset.val;
              dd3.classList.remove('open');
            };
          });
          btnYes.onclick = () => {
            const declared = dd3.dataset.selected || allProtos[0];
            confirmArea.classList.add('hidden');
            confirmMsg.innerHTML = '';
            gameState.effectContext = null;
            // Ahora descarta top del rival
            const topCard = gameState[opponent].deck.pop();
            gameState[opponent].trash.push(topCard);
            if (topCard.protocol === declared) {
              updateStatus(`${triggerCardName}: ¡Coincide! ${topCard.nombre} es ${declared} → elimina 1 carta`);
              startEffect('eliminate', 'any', 1);
            } else {
              updateStatus(`${triggerCardName}: Fallo — carta era ${topCard.nombre} (${topCard.protocol})`);
              updateUI();
              processAbilityEffect();
            }
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            confirmMsg.innerHTML = '';
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        // IA: elige el protocolo del oponente con más cartas en su mazo
        const bestProto = gameState[opponent].protocols.reduce((best, p) => {
          const cnt = gameState[opponent].deck.filter(c => c.protocol === p).length;
          const bCnt = gameState[opponent].deck.filter(c => c.protocol === best).length;
          return cnt > bCnt ? p : best;
        }, gameState[opponent].protocols[0]);
        const topCard = gameState[opponent].deck.pop();
        gameState[opponent].trash.push(topCard);
        if (topCard.protocol === bestProto) {
          updateStatus(`IA — ${triggerCardName}: acierta con ${bestProto}! Elimina 1 carta del jugador`);
          startEffect('eliminate', 'player', 1);
        } else {
          updateStatus(`IA — ${triggerCardName}: fallo (declaró ${bestProto}, carta: ${topCard.nombre})`);
          updateUI();
          processAbilityEffect();
        }
      }
      break;
    }

    case 'luckDiscardTopDeleteByValue': {
      // Suerte 4: descarta top del mazo; elimina 1 carta con mismo Valor
      if (gameState[targetPlayer].deck.length === 0) { processAbilityEffect(); break; }
      const topCard = gameState[targetPlayer].deck.pop();
      gameState[targetPlayer].trash.push(topCard);
      const targetVal = topCard.valor;
      updateStatus(`Suerte 4: ${topCard.nombre} (Valor ${targetVal}) → elimina carta con Valor ${targetVal}`);
      const hasMatch = LINES.some(l => ['player', 'ai'].some(p => gameState.field[l][p].some(c => c.card.valor === targetVal)));
      if (hasMatch) {
        if (targetPlayer === 'player') {
          // filter exactValue + targetAll: permite seleccionar cubierta o descubierta
          startEffect('eliminate', 'any', 1, { filter: 'exactValue', exactVal: targetVal, targetAll: true });
        } else {
          let done = false;
          LINES.forEach(l => {
            if (done) return;
            const idx = gameState.field[l].player.findIndex(c => c.card.valor === targetVal);
            if (idx >= 0) {
              const [removed] = gameState.field[l].player.splice(idx, 1);
              gameState.player.trash.push(removed.card);
              done = true;
            }
          });
          updateUI();
          processAbilityEffect();
        }
      } else {
        updateUI();
        processAbilityEffect();
      }
      break;
    }

    case 'luckDraw3PickByValue': {
      // Suerte 0: declara un número 0-6, roba 3, selecciona 1 al azar — si coincide, la juegas
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          const numItems = [0,1,2,3,4,5,6].map(n => `<div class="ui-dropdown-item" data-val="${n}"><span class="drop-dot"></span><span class="drop-text">${n}</span></div>`).join('');
          confirmMsg.innerHTML = `${triggerCardName || ''}: ¿Qué número declaras? (0–6)
            <div class="ui-dropdown" id="luck0-dropdown" style="margin-top:10px;">
              <div class="ui-dropdown-trigger" id="luck0-trigger">
                <span class="drop-placeholder" id="luck0-placeholder">Elige número</span>
                <span class="drop-value" id="luck0-value" style="display:none;"><span class="drop-dot"></span><span id="luck0-val-text"></span></span>
                <svg class="drop-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div class="ui-dropdown-list">${numItems}</div>
            </div>`;
          const dd0 = document.getElementById('luck0-dropdown');
          dd0.querySelector('.ui-dropdown-trigger').onclick = () => dd0.classList.toggle('open');
          dd0.querySelectorAll('.ui-dropdown-item').forEach(it => {
            it.onclick = () => {
              dd0.querySelectorAll('.ui-dropdown-item').forEach(x => x.classList.remove('active'));
              it.classList.add('active');
              dd0.dataset.selected = it.dataset.val;
              document.getElementById('luck0-placeholder').style.display = 'none';
              const valEl = document.getElementById('luck0-value');
              valEl.style.display = 'flex';
              document.getElementById('luck0-val-text').textContent = it.dataset.val;
              dd0.classList.remove('open');
            };
          });
          btnYes.onclick = () => {
            const declaredVal = parseInt(dd0.dataset.selected ?? '0');
            confirmArea.classList.add('hidden');
            confirmMsg.innerHTML = '';
            gameState.effectContext = null;
            // Robar 3 cartas
            const handBefore = gameState.player.hand.length;
            draw('player', 3);
            const drawn = gameState.player.hand.length - handBefore;
            if (drawn === 0) { processAbilityEffect(); return; }
            // Seleccionar 1 al azar de las robadas
            const randomOffset = Math.floor(Math.random() * drawn);
            const pickedIdx = handBefore + randomOffset;
            const pickedCard = gameState.player.hand[pickedIdx];
            if (pickedCard.valor === declaredVal) {
              // ¡Coincide! Jugar en línea elegida
              updateStatus(`${triggerCardName}: ¡coincide! ${pickedCard.nombre} (Valor ${declaredVal}) — elige una línea`);
              const isOwn = gameState.player.protocols && gameState.player.protocols.includes(pickedCard.protocol);
              const isFaceDown = !isOwn;
              gameState.effectContext = { type: 'luckPlay_lineSelect', handIdx: pickedIdx, faceDown: isFaceDown };
              if (typeof highlightSelectableLines === 'function') highlightSelectableLines();
              updateUI();
            } else {
              updateStatus(`${triggerCardName}: no coincide — dijiste ${declaredVal}, carta: ${pickedCard.nombre} (Valor ${pickedCard.valor})`);
              updateUI();
              processAbilityEffect();
            }
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            confirmMsg.innerHTML = '';
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        // IA: declara número aleatorio, roba 3, selecciona 1 al azar, si coincide juega
        const aiDeclaredVal = Math.floor(Math.random() * 7);
        const handBefore = gameState.ai.hand.length;
        draw('ai', 3);
        const drawn = gameState.ai.hand.length - handBefore;
        if (drawn > 0) {
          const randomOffset = Math.floor(Math.random() * drawn);
          const pickedCard = gameState.ai.hand[handBefore + randomOffset];
          if (pickedCard.valor === aiDeclaredVal) {
            updateStatus(`IA — ${triggerCardName}: acierta con valor ${aiDeclaredVal}! Juega ${pickedCard.nombre}`);
            const handIdx = gameState.ai.hand.indexOf(pickedCard);
            gameState.ai.hand.splice(handIdx, 1);
            const isOwn = gameState.ai.protocols && gameState.ai.protocols.includes(pickedCard.protocol);
            const bestLine = LINES.reduce((best, l) =>
              calculateScore(gameState, l, 'ai') >= calculateScore(gameState, best, 'ai') ? l : best, LINES[0]);
            gameState.field[bestLine].ai.push({ card: pickedCard, faceDown: !isOwn });
            gameState.currentEffectLine = bestLine;
            if (isOwn) triggerCardEffect(pickedCard, 'onPlay', 'ai');
            updateUI();
          } else {
            updateStatus(`IA — ${triggerCardName}: no coincide (declaró ${aiDeclaredVal}, carta: ${pickedCard.nombre} valor ${pickedCard.valor})`);
          }
        }
        processAbilityEffect();
      }
      break;
    }

    case 'luckPlayTopThenFlipNoEffect': {
      // Suerte 1: juega bocabajo la carta top del mazo, luego voltéala (sin efectos)
      const line = gameState.currentEffectLine;
      if (!line || gameState[targetPlayer].deck.length === 0) { processAbilityEffect(); break; }
      const topCard = gameState[targetPlayer].deck.pop();
      const cardObj = { card: topCard, faceDown: true };
      gameState.field[line][targetPlayer].push(cardObj);
      updateUI();
      setTimeout(() => {
        cardObj.faceDown = false;
        updateStatus(`Suerte 1: ${topCard.nombre} revelada (sin comandos centrales)`);
        updateUI();
        processAbilityEffect();
      }, 400);
      break;
    }

    case 'discardOwnDeck': {
      // Tiempo 1: descarta todo tu mazo
      const deckSize = gameState[targetPlayer].deck.length;
      if (deckSize > 0) {
        gameState[targetPlayer].trash.push(...gameState[targetPlayer].deck.splice(0));
        updateStatus(`${targetPlayer === 'player' ? 'Descartas' : 'IA descarta'} el mazo (${deckSize} cartas)`);
        updateUI();
      }
      processAbilityEffect();
      break;
    }

    case 'playFromDiscardThenShuffle': {
      // Tiempo 0: muestra descarte, elige 1 carta para jugar, baraja el resto
      if (gameState[targetPlayer].trash.length === 0) { processAbilityEffect(); break; }
      
      if (targetPlayer === 'player') {
        const trashCount = gameState.player.trash.length;
        const modal = document.getElementById('reveal-modal');
        const container = document.getElementById('reveal-cards-container');
        const titleEl = document.getElementById('reveal-title');
        const subtitleEl = document.getElementById('reveal-subtitle');
        const sourceEl = document.getElementById('reveal-source');
        const actionsEl = document.getElementById('reveal-actions');
        
        if (modal && container && typeof createCardHTML === 'function') {
          // Guardar referencia al descarte para restaurar si se cancela
          gameState.effectContext = { 
            type: 'pickFromDiscardToPlay', 
            trashBackup: [...gameState.player.trash],
            selectedIdx: null 
          };
          
          if (titleEl) titleEl.textContent = 'ELIGE 1 CARTA';
          if (subtitleEl) subtitleEl.textContent = 'Juega esta carta, baraja el resto en tu mazo';
          if (sourceEl) sourceEl.textContent = triggerCardName || '';
          
          // Mostrar cartas del descarte con click para seleccionar
          container.innerHTML = gameState.player.trash.map((c, idx) => 
            `<div class="reveal-card-select" data-idx="${idx}" style="transform: scale(0.85); transform-origin: top center; cursor: pointer;">
              ${createCardHTML(c)}
            </div>`
          ).join('');
          
          actionsEl.innerHTML = '<button class="ui-btn" id="btn-reveal-continue">JUGAR</button>';
          modal.classList.remove('hidden');
          
          // Manejar selección de carta
          let selectedIdx = null;
          container.querySelectorAll('.reveal-card-select').forEach(el => {
            el.onclick = () => {
              container.querySelectorAll('.reveal-card-select').forEach(x => x.classList.remove('selected'));
              el.classList.add('selected');
              selectedIdx = parseInt(el.dataset.idx);
              gameState.effectContext.selectedIdx = selectedIdx;
            };
          });
          
          document.getElementById('btn-reveal-continue').onclick = () => {
            if (selectedIdx === null) {
              alert('Selecciona una carta primero');
              return;
            }
            const chosenCard = gameState.player.trash[selectedIdx];
            // Eliminar carta elegida del descarte
            gameState.player.trash.splice(selectedIdx, 1);
            // Jugar la carta en la línea actual
            const line = gameState.currentEffectLine || LINES[0];
            gameState.field[line].player.push({ card: chosenCard, faceDown: false });
            // Barajar el resto del descarte en el mazo
            if (gameState.player.trash.length > 0) {
              shuffleDiscardIntoDeck('player');
            } else {
              processAbilityEffect();
            }
            modal.classList.add('hidden');
            container.innerHTML = '';
            gameState.effectContext = null;
            updateUI();
            // Ejecutar efectos de la carta jugada
            if (typeof executeNewEffect === 'function') {
              executeNewEffect(chosenCard, 'player');
            }
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA: elige la carta de mayor valor
        const bestIdx = gameState.ai.trash.reduce((b, c, i) => c.valor > gameState.ai.trash[b].valor ? i : b, 0);
        const [card] = gameState.ai.trash.splice(bestIdx, 1);
        const line = gameState.currentEffectLine || LINES[0];
        gameState.field[line].ai.push({ card, faceDown: false });
        // Barajar el resto
        if (gameState.ai.trash.length > 0) {
          shuffleDiscardIntoDeck('ai');
        }
        updateUI();
        processAbilityEffect();
      }
      break;
    }

    case '_shuffleDiscardIntoDeck': {
      if (typeof shuffleDiscardIntoDeck === 'function') shuffleDiscardIntoDeck(targetPlayer);
      processAbilityEffect();
      break;
    }

    case 'playFromDiscardFaceDownOtherLine': {
      // Tiempo 3: revela descarte, elige 1 carta para jugar bocabajo en otra línea, baraja el resto
      if (gameState[targetPlayer].trash.length === 0) { processAbilityEffect(); break; }
      
      if (targetPlayer === 'player') {
        const modal = document.getElementById('reveal-modal');
        const container = document.getElementById('reveal-cards-container');
        const titleEl = document.getElementById('reveal-title');
        const subtitleEl = document.getElementById('reveal-subtitle');
        const sourceEl = document.getElementById('reveal-source');
        const actionsEl = document.getElementById('reveal-actions');
        
        if (modal && container && typeof createCardHTML === 'function') {
          gameState.effectContext = { 
            type: 'pickFromDiscardFaceDown', 
            trashBackup: [...gameState.player.trash],
            selectedIdx: null,
            excludeLine: gameState.currentEffectLine 
          };
          
          if (titleEl) titleEl.textContent = 'ELIGE 1 CARTA';
          if (subtitleEl) subtitleEl.textContent = 'Juega esta carta bocabajo en otra línea, baraja el resto';
          if (sourceEl) sourceEl.textContent = triggerCardName || '';
          
          container.innerHTML = gameState.player.trash.map((c, idx) => 
            `<div class="reveal-card-select" data-idx="${idx}" style="transform: scale(0.85); transform-origin: top center; cursor: pointer;">
              ${createCardHTML(c)}
            </div>`
          ).join('');
          
          actionsEl.innerHTML = '<button class="ui-btn" id="btn-reveal-continue">JUGAR</button>';
          modal.classList.remove('hidden');
          
          let selectedIdx = null;
          container.querySelectorAll('.reveal-card-select').forEach(el => {
            el.onclick = () => {
              container.querySelectorAll('.reveal-card-select').forEach(x => x.classList.remove('selected'));
              el.classList.add('selected');
              selectedIdx = parseInt(el.dataset.idx);
              gameState.effectContext.selectedIdx = selectedIdx;
            };
          });
          
          document.getElementById('btn-reveal-continue').onclick = () => {
            if (selectedIdx === null) {
              alert('Selecciona una carta primero');
              return;
            }
            const chosenCard = gameState.player.trash[selectedIdx];
            gameState.player.trash.splice(selectedIdx, 1);
            // Jugar bocabajo en otra línea (seleccionable por el jugador)
            gameState.effectContext = {
              type: 'pickFromDiscardFaceDown',
              chosenCard,
              excludeLine: gameState.currentEffectLine,
              waitingForLine: true
            };
            modal.classList.add('hidden');
            container.innerHTML = '';
            updateUI();
            if (typeof highlightSelectableLines === 'function') {
              highlightSelectableLines(gameState.currentEffectLine);
            }
            updateStatus('Elige una línea diferente para jugar la carta bocabajo');
          };
        } else {
          processAbilityEffect();
        }
      } else {
        // IA: elige la carta de mayor valor
        const bestIdx = gameState.ai.trash.reduce((b, c, i) => c.valor > gameState.ai.trash[b].valor ? i : b, 0);
        const [card] = gameState.ai.trash.splice(bestIdx, 1);
        const curLine = gameState.currentEffectLine;
        const destLine = LINES.filter(l => l !== curLine)[0] || LINES[0];
        gameState.field[destLine].ai.push({ card, faceDown: true });
        // Barajar el resto
        if (gameState.ai.trash.length > 0) {
          shuffleDiscardIntoDeck('ai');
        }
        updateUI();
        processAbilityEffect();
      }
      break;
    }

    case 'drawPerDistinctProtocolsInLine': {
      // Diversidad 1: roba cartas = protocolos distintos en esta línea
      const line = gameState.currentEffectLine;
      if (!line) { processAbilityEffect(); break; }
      const protocols = new Set();
      ['player', 'ai'].forEach(p =>
        gameState.field[line][p].forEach(c => protocols.add(c.card.nombre.replace(/ \d+$/, '')))
      );
      if (protocols.size > 0) draw(targetPlayer, protocols.size);
      processAbilityEffect();
      break;
    }

    case 'flipCardBelowDistinctProtocolCount': {
      // Diversidad 4: voltea 1 carta con Valor menor que el número de Protocolos distintos en el campo
      const allProtos = new Set();
      LINES.forEach(l => ['player', 'ai'].forEach(p =>
        gameState.field[l][p].forEach(c => allProtos.add(c.card.nombre.replace(/ \d+$/, '')))
      ));
      const protoCount = allProtos.size;
      if (targetPlayer === 'player') {
        startEffect('flip', 'any', 1, { filter: 'maxValue', maxVal: protoCount - 1 });
      } else {
        let done = false;
        LINES.forEach(l => {
          if (done) return;
          const st = gameState.field[l].player;
          if (st.length > 0 && st[st.length - 1].card.valor < protoCount) {
            flipAndTrigger(st[st.length - 1], l, 'player');
            done = true;
          }
        });
        processAbilityEffect();
      }
      break;
    }

    case 'deleteIfFewDistinctProtocols': {
      // Diversidad 6 onTurnEnd: si < minProtocols protocolos distintos, elimina esta carta
      const minProtos = actionDef.minProtocols || 4;
      const allProtos = new Set();
      LINES.forEach(l => ['player', 'ai'].forEach(p =>
        gameState.field[l][p].forEach(c => allProtos.add(c.card.nombre.replace(/ \d+$/, '')))
      ));
      if (allProtos.size < minProtos) {
        gameState.effectQueue.unshift({ effect: { action: '_deleteSelf' }, targetPlayer, cardName: triggerCardName });
      }
      processAbilityEffect();
      break;
    }

    case 'compileDiversityIfSixProtocols': {
      // Diversidad 0: si hay 6 protocolos distintos en cartas del campo (ambos lados), compila Diversidad
      const allFieldProtos = new Set();
      LINES.forEach(l =>
        ['player', 'ai'].forEach(p =>
          gameState.field[l][p].forEach(c => allFieldProtos.add(c.card.nombre.replace(/ \d+$/, '')))
        )
      );
      if (allFieldProtos.size >= 6) {
        // Compilar la línea donde está Diversidad como protocolo del jugador
        const diversityLine = LINES.find((l, i) => gameState[targetPlayer].protocols[i] === 'Diversidad');
        if (diversityLine && !gameState.field[diversityLine].compiledBy) {
          // Eliminar todas las cartas de esa línea → descarte
          ['player', 'ai'].forEach(p => {
            const stack = gameState.field[diversityLine][p];
            stack.forEach(c => gameState[p].trash.push(c.card));
            gameState.field[diversityLine][p] = [];
          });
          gameState.field[diversityLine].compiledBy = targetPlayer;
          if (!gameState[targetPlayer].compiled.includes('Diversidad')) {
            gameState[targetPlayer].compiled.push('Diversidad');
          }
          updateStatus(`${triggerCardName}: 6 protocolos distintos en el campo — ¡Diversidad compilada!`);
          updateUI();
          if (typeof checkWinCondition === 'function') checkWinCondition();
        } else if (diversityLine && gameState.field[diversityLine].compiledBy === targetPlayer) {
          // Recompilar: roba top del mazo rival
          const opponent = targetPlayer === 'player' ? 'ai' : 'player';
          if (gameState[opponent].deck.length > 0) {
            gameState[targetPlayer].hand.push(gameState[opponent].deck.pop());
          }
          updateStatus(`${triggerCardName}: Diversidad recompilada — robas del mazo rival`);
          updateUI();
        }
      }
      processAbilityEffect();
      break;
    }

    case 'playNonDiversityCard': {
      // Diversidad 0 onTurnEnd: puedes jugar 1 carta que no sea Diversidad en esta línea (bocarriba)
      const nonDivCards = gameState[targetPlayer].hand.filter(c => !c.nombre.startsWith('Diversidad'));
      if (nonDivCards.length === 0) { processAbilityEffect(); break; }
      const effectLine = gameState.currentEffectLine || LINES[0];
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg  = document.getElementById('confirm-msg');
        const btnYes      = document.getElementById('btn-confirm-yes');
        const btnNo       = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `Diversidad 0 Final: ¿Jugar 1 carta (no Diversidad) bocarriba en esta línea?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = {
              type: 'playNonDiversity',
              line: effectLine,
              filter: 'nonDiversity'
            };
            updateStatus('Elige una carta de tu mano (no Diversidad) para jugar en esta línea');
            updateUI();
          };
          btnNo.onclick = () => { confirmArea.classList.add('hidden'); gameState.effectContext = null; processAbilityEffect(); };
        } else { processAbilityEffect(); }
      } else {
        // IA: juega la carta no-Diversidad de mayor valor
        const best = nonDivCards.reduce((b, c) => c.valor > b.valor ? c : b);
        const idx = gameState.ai.hand.indexOf(best);
        const [card] = gameState.ai.hand.splice(idx, 1);
        const cardObj = { card, faceDown: false };
        gameState.field[effectLine].ai.push(cardObj);
        updateStatus(`IA juega ${card.nombre} bocarriba en ${effectLine} (Diversidad 0)`);
        updateUI();
        // Disparar onPlay de la carta jugada
        if (typeof triggerCardEffect === 'function') {
          gameState.currentEffectLine = effectLine;
          triggerCardEffect(card, 'onPlay', 'ai');
        }
        processAbilityEffect();
      }
      break;
    }

    case 'copyOpponentCardEffect': {
      // Espejo 1 onTurnEnd: opcional — copia el comando central de 1 carta bocarriba del rival
      const availCards = [];
      LINES.forEach(l => {
        gameState.field[l][opponent].forEach(c => {
          if (!c.faceDown && CARD_EFFECTS[c.card.nombre]?.onPlay) availCards.push({ card: c.card, line: l });
        });
      });
      if (availCards.length === 0) { processAbilityEffect(); break; }
      if (targetPlayer === 'player') {
        const confirmArea = document.getElementById('command-confirm');
        const confirmMsg = document.getElementById('confirm-msg');
        const btnYes = document.getElementById('btn-confirm-yes');
        const btnNo = document.getElementById('btn-confirm-no');
        if (confirmArea && btnYes && btnNo) {
          gameState.effectContext = { type: 'confirm' };
          confirmArea.classList.remove('hidden');
          confirmMsg.textContent = `${triggerCardName || ''}: ¿Copias el efecto de una carta del rival?`;
          btnYes.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            if (availCards.length === 1) {
              const chosen = availCards[0];
              updateStatus(`Espejo 1: copiando efecto de ${chosen.card.nombre}`);
              // "como si estuviera en esta carta" → mantener línea de Espejo 1
              triggerCardEffect(chosen.card, 'onPlay', 'player');
              processAbilityEffect();
            } else {
              // Jugador elige qué carta copiar
              gameState.effectContext = { type: 'selectCardToCopy', target: 'ai', count: 1, selected: [] };
              if (typeof highlightEffectTargets === 'function') highlightEffectTargets();
              updateUI();
            }
          };
          btnNo.onclick = () => {
            confirmArea.classList.add('hidden');
            gameState.effectContext = null;
            processAbilityEffect();
          };
        } else { processAbilityEffect(); }
      } else {
        // IA: elige la carta rival con mayor valor
        const best = availCards.reduce((b, x) => x.card.valor > b.card.valor ? x : b);
        updateStatus(`Espejo 1: copiando efecto de ${best.card.nombre}`);
        // "como si estuviera en esta carta" → mantener línea de Espejo 1
        triggerCardEffect(best.card, 'onPlay', targetPlayer);
        processAbilityEffect();
      }
      break;
    }

    case 'shiftCoveredFaceDown': {
      // Humo 4: cambia 1 carta cubierta bocabajo (la deja faceDown al moverla)
      if (targetPlayer === 'player') {
        startEffect('shift', 'any', 1, { coveredOnly: true, forceFaceDown: true });
      } else {
        let bestSrc = null, bestLine = null, bestIdx = -1;
        LINES.forEach(l => {
          const st = gameState.field[l].ai;
          for (let i = 0; i < st.length - 1; i++) {
            if (!bestSrc || st[i].card.valor < bestSrc.card.valor) {
              bestSrc = st[i]; bestLine = l; bestIdx = i;
            }
          }
        });
        if (bestSrc) {
          const dest = LINES.filter(l => l !== bestLine)[0] || bestLine;
          gameState.field[bestLine].ai.splice(bestIdx, 1);
          bestSrc.faceDown = true;
          gameState.field[dest].ai.push(bestSrc);
          updateUI();
        }
        processAbilityEffect();
      }
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
function getPersistentModifiers(card) {
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

  // Plaga 0: El oponente no puede jugar cartas en esta línea
  if (persistent.effect === 'preventOpponentPlay') {
    modifiers.preventOpponentPlay = true;
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

  // Reducciones: cartas bocarriba del oponente en esta línea (ej: Metal 0)
  // DEBEN estar descubiertas (ser la última de la pila)
  const oppStack = state.field[line][opponent];
  if (oppStack.length > 0) {
    const topCardObj = oppStack[oppStack.length - 1];
    if (!topCardObj.faceDown) {
      const modifiers = getPersistentModifiers(topCardObj.card);
      if (modifiers.valueReduction) {
        totalReduction += modifiers.valueReduction;
      }
    }
  }

  // Bonos: cartas propias bocaarriba en esta línea (fase Start activa aunque estén cubiertas)
  const selfStack = state.field[line][player];
  const faceDownCount =
    state.field[line].player.filter(c => c.faceDown).length +
    state.field[line].ai.filter(c => c.faceDown).length;
  const oppCardCount = state.field[line][player === 'player' ? 'ai' : 'player'].length;

  selfStack.forEach(cardObj => {
    if (cardObj.faceDown) return; // bocabajo nunca activa bonos persistentes
    const effectDef = CARD_EFFECTS[cardObj.card.nombre];
    if (!effectDef || !effectDef.persistent) return;
    const p = effectDef.persistent;

    // Humo 2: +1 por cada carta bocabajo en esta línea
    if (p.valueBonusPerFaceDown) {
      totalBonus += p.valueBonusPerFaceDown * faceDownCount;
    }

    // Claridad 0: +1 por cada carta en tu mano
    if (p.valueBonusPerHandCard) {
      totalBonus += p.valueBonusPerHandCard * (state[player].hand.length || 0);
    }

    // Espejo 0: +1 por cada carta del oponente en esta línea
    if (p.valueBonusPerOpponentCard) {
      totalBonus += p.valueBonusPerOpponentCard * oppCardCount;
    }

    // Diversidad 3: +2 si hay alguna carta bocaarriba que no sea Diversidad en esta pila
    if (p.valueBonusIfNonDiversityFaceUp) {
      const hasNonDiv = selfStack.some(c => !c.faceDown && !c.card.nombre.startsWith('Diversidad'));
      if (hasNonDiv) totalBonus += p.valueBonusIfNonDiversityFaceUp;
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
 * DEBE estar descubierta (top de la pila)
 */
function lineHasIgnoreMiddleCommands(line) {
  if (!line) return false;
  return ['player', 'ai'].some(p => {
    const stack = gameState.field[line][p];
    if (stack.length === 0) return false;
    const topCardObj = stack[stack.length - 1];
    if (topCardObj.faceDown) return false;
    const ef = CARD_EFFECTS[topCardObj.card.nombre];
    return ef && ef.persistent && ef.persistent.ignoreMiddleCommands;
  });
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
  const modifiers = getPersistentModifiers(card);
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
 * Hook para inicio de turno — todas las cartas bocarriba de la pila
 * (el comando inicio es siempre visible aunque la carta esté cubierta)
 */
function onTurnStartEffects(player) {
  // Armar efectos persistentes de fin de turno (persistentEnd: true, h_inicio con "Final:")
  // Solo las cartas bocarriba AHORA con persistentEnd dispararán su onTurnEnd
  gameState.armedEndEffects = new Set();
  LINES.forEach(line => {
    if (gameState.ignoreEffectsLines && gameState.ignoreEffectsLines[line]) return;
    gameState.currentEffectLine = line;
    gameState.field[line][player].forEach(cardObj => {
      if (!cardObj.faceDown) {
        const ef = CARD_EFFECTS[cardObj.card.nombre];
        if (ef?.persistentEnd && ef.onTurnEnd) {
          gameState.armedEndEffects.add(cardObj.card.id);
        }
        triggerCardEffect(cardObj.card, 'onTurnStart', player);
      }
    });
  });
}

/**
 * Hook para fin de turno — dos categorías:
 * 1) persistentEnd (h_inicio "Final:"): solo si armadas al inicio Y siguen bocarriba (cubiertas o no)
 * 2) normales (h_final "Final:"): si la carta es top descubierta al final del turno
 */
function onTurnEndEffects(player) {
  LINES.forEach(line => {
    if (gameState.ignoreEffectsLines && gameState.ignoreEffectsLines[line]) return;
    gameState.currentEffectLine = line;
    const stack = gameState.field[line][player];
    if (stack.length === 0) return;

    // 1) Persistentes armadas: cualquier carta bocarriba cuyo ID fue registrado al inicio
    if (gameState.armedEndEffects && gameState.armedEndEffects.size > 0) {
      stack.forEach(cardObj => {
        if (!cardObj.faceDown && gameState.armedEndEffects.has(cardObj.card.id)) {
          triggerCardEffect(cardObj.card, 'onTurnEnd', player);
        }
      });
    }

    // 2) Normales: solo la top descubierta, si tiene onTurnEnd y NO es persistentEnd
    const top = stack[stack.length - 1];
    if (!top.faceDown) {
      const ef = CARD_EFFECTS[top.card.nombre];
      if (ef?.onTurnEnd && !ef.persistentEnd) {
        triggerCardEffect(top.card, 'onTurnEnd', player);
      }
    }
  });
  gameState.armedEndEffects = null;
}


/**
 * Velocidad 1: dispara onRefresh para cartas bocarriba del jugador que usó Refresh.
 */
function onRefreshEffects(player) {
  LINES.forEach(line => {
    const stack = gameState.field[line][player];
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    if (top.faceDown) return;
    const effectDef = CARD_EFFECTS[top.card.nombre];
    if (effectDef && effectDef.onRefresh) {
      gameState.currentEffectLine = line;
      triggerCardEffect(top.card, 'onRefresh', player);
    }
  });
}

// ============================================================================
// 5b. HOOKS REACTIVOS (Fase B)
// ============================================================================

/**
 * Baraja el descarte de `who` en su mazo y dispara onDeckShuffle
 */
function shuffleDiscardIntoDeck(who) {
  const state = gameState[who];
  if (state.trash.length === 0) return;
  state.deck.push(...state.trash);
  state.deck.sort(() => Math.random() - 0.5);
  state.trash = [];
  updateStatus(`${who === 'player' ? 'Barajas' : 'IA baraja'} el descarte en el mazo`);
  updateUI();
  onDeckShuffleEffects(who);
}

/**
 * Dispara onDeckShuffle para cartas bocarriba de `who` cuando baraja su mazo
 */
function onDeckShuffleEffects(who) {
  LINES.forEach(line => {
    const stack = gameState.field[line][who];
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    if (top.faceDown) return;
    const effectDef = CARD_EFFECTS[top.card.nombre];
    if (effectDef && effectDef.onDeckShuffle) {
      gameState.currentEffectLine = line;
      triggerCardEffect(top.card, 'onDeckShuffle', who);
    }
  });
}

/**
 * Dispara onOpponentRefresh para cartas del oponente de `who` (quien acaba de actualizar)
 */
function onOpponentRefreshEffects(who) {
  const opponent = who === 'player' ? 'ai' : 'player';
  LINES.forEach(line => {
    const stack = gameState.field[line][opponent];
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    if (top.faceDown) return;
    const effectDef = CARD_EFFECTS[top.card.nombre];
    if (effectDef && effectDef.onOpponentRefresh) {
      gameState.currentEffectLine = line;
      triggerCardEffect(top.card, 'onOpponentRefresh', opponent);
    }
  });
}

/**
 * Dispara onOpponentDraw para cartas del oponente de `who` (quien acaba de robar)
 * Guarda `_inOpponentDrawEffects` para evitar bucles infinitos (ej: Mirror 4)
 */
function onOpponentDrawEffects(who) {
  if (gameState._inOpponentDrawEffects) return;
  gameState._inOpponentDrawEffects = true;
  try {
    const opponent = who === 'player' ? 'ai' : 'player';
    LINES.forEach(line => {
      const stack = gameState.field[line][opponent];
      if (stack.length === 0) return;
      const top = stack[stack.length - 1];
      if (top.faceDown) return;
      const effectDef = CARD_EFFECTS[top.card.nombre];
      if (effectDef && effectDef.onOpponentDraw) {
        gameState.currentEffectLine = line;
        triggerCardEffect(top.card, 'onOpponentDraw', opponent, { deferred: true });
      }
    });
  } finally {
    gameState._inOpponentDrawEffects = false;
  }
}

/**
 * Dispara onOpponentCompile para cartas del oponente de `who` (quien acaba de compilar)
 */
function onOpponentCompileEffects(who) {
  const opponent = who === 'player' ? 'ai' : 'player';
  LINES.forEach(line => {
    const stack = gameState.field[line][opponent];
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    if (top.faceDown) return;
    const effectDef = CARD_EFFECTS[top.card.nombre];
    if (effectDef && effectDef.onOpponentCompile) {
      gameState.currentEffectLine = line;
      triggerCardEffect(top.card, 'onOpponentCompile', opponent, { deferred: true });
    }
  });
}

/**
 * Dispara onOpponentDiscard para cartas del oponente de `who` (quien acaba de descartar)
 * Guarda `_inOpponentDiscardEffects` para evitar bucles
 */
function onOpponentDiscardEffects(who) {
  if (gameState._inOpponentDiscardEffects) return;
  gameState._inOpponentDiscardEffects = true;
  try {
    const opponent = who === 'player' ? 'ai' : 'player';
    LINES.forEach(line => {
      const stack = gameState.field[line][opponent];
      if (stack.length === 0) return;
      const top = stack[stack.length - 1];
      if (top.faceDown) return;
      const effectDef = CARD_EFFECTS[top.card.nombre];
      if (effectDef && effectDef.onOpponentDiscard) {
        gameState.currentEffectLine = line;
        triggerCardEffect(top.card, 'onOpponentDiscard', opponent, { deferred: true });
      }
    });
  } finally {
    gameState._inOpponentDiscardEffects = false;
  }
}

/**
 * Dispara onOpponentPlayInLine para cartas del oponente de `who` en `line`
 * (quien acaba de jugar una carta en esa línea)
 */
function onOpponentPlayInLineEffects(who, line) {
  const opponent = who === 'player' ? 'ai' : 'player';
  const stack = gameState.field[line][opponent];
  if (stack.length === 0) return;
  const top = stack[stack.length - 1];
  if (top.faceDown) return;
  const effectDef = CARD_EFFECTS[top.card.nombre];
  if (effectDef && effectDef.onOpponentPlayInLine) {
    gameState.currentEffectLine = line;
    triggerCardEffect(top.card, 'onOpponentPlayInLine', opponent, { deferred: true });
  }
}

/**
 * Dispara onForcedDiscard para cartas bocarriba de `who` que fue forzado a descartar
 * Solo debe llamarse durante el turno del oponente (efectos forzados, no descartes voluntarios)
 */
function onForcedDiscardEffects(who) {
  LINES.forEach(line => {
    const stack = gameState.field[line][who];
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    if (top.faceDown) return;
    const effectDef = CARD_EFFECTS[top.card.nombre];
    if (effectDef && effectDef.onForcedDiscard) {
      gameState.currentEffectLine = line;
      triggerCardEffect(top.card, 'onForcedDiscard', who, { deferred: true });
    }
  });
}

// ============================================================================
// 6. INTEGRACIÓN CON CÁLCULO DE VALOR
// ============================================================================

/**
 * Versión mejorada de calculateScore() que considera modificadores persistentes
 */
function calculateScoreWithModifiers(state, line, player) {
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

/**
 * Devuelve true si el opponent no puede jugar cartas en targetLine
 * (porque el dueño de la línea tiene Plaga 0 activa en esa línea).
 * DEBE estar descubierta (top de la pila)
 */
function isPlayBlockedByPersistent(targetLine, playingPlayer, isFaceDown = false) {
  const opponent = playingPlayer === 'player' ? 'ai' : 'player';
  const stack = gameState.field[targetLine][opponent];
  if (stack.length === 0) return false;
  
  const topCardObj = stack[stack.length - 1];
  if (topCardObj.faceDown) return false;
  
  const mods = getPersistentModifiers(topCardObj.card);
  if (mods.preventOpponentPlay) return true;
  // Metal 2: bloquea solo jugadas bocabajo
  if (isFaceDown && mods.preventFaceDown) return true;
  
  return false;
}

// ============================================================================
// EXPORTS / Disponibilidad Global
// ============================================================================

/**
 * Corrupción 1: al devolver una carta a la mano del jugador `dest`,
 * si el rival de `dest` tiene Corrupción 1 bocarriba, va al tope del mazo bocarriba en su lugar.
 */
function applyReturnToHand(dest, card) {
  const rival = dest === 'player' ? 'ai' : 'player';
  const redirected = LINES.some(l => {
    const stack = gameState.field[l][rival];
    if (stack.length === 0) return false;
    const top = stack[stack.length - 1];
    return !top.faceDown && getPersistentModifiers(top.card).redirectReturnToTopDeck;
  });
  if (redirected) {
    gameState[dest].deck.push(card); // tope del mazo = último elemento (pop/push)
    updateStatus(`Corrupción 1: carta devuelta al tope del mazo bocarriba en lugar de a la mano`);
  } else {
    gameState[dest].hand.push(card);
  }
}

/**
 * Dispara onOwnDiscard para cartas bocarriba de `who` (quien acaba de descartar).
 * Cubre Corrupción 2: "después de que descartes cartas → rival descarta 1".
 */
function onOwnDiscardEffects(who) {
  if (gameState._inOwnDiscardEffects) return;
  gameState._inOwnDiscardEffects = true;
  try {
    LINES.forEach(line => {
      const stack = gameState.field[line][who];
      if (stack.length === 0) return;
      const top = stack[stack.length - 1];
      if (top.faceDown) return;
      const effectDef = CARD_EFFECTS[top.card.nombre];
      if (effectDef && effectDef.onOwnDiscard) {
        gameState.currentEffectLine = line;
        triggerCardEffect(top.card, 'onOwnDiscard', who, { deferred: true });
      }
    });
  } finally {
    gameState._inOwnDiscardEffects = false;
  }
}

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
  window.onRefreshEffects = onRefreshEffects;
  window.hasAllowAnyProtocol = hasAllowAnyProtocol;
  window.getUnityPlayLine = getUnityPlayLine;
  window.canPlayAnywhere = canPlayAnywhere;
  window.canPlayOnAnySide = canPlayOnAnySide;
  window.isPlayBlockedByPersistent = isPlayBlockedByPersistent;
  window.hasForceOpponentFaceDown = hasForceOpponentFaceDown;
  // Fase B: hooks reactivos
  window.shuffleDiscardIntoDeck = shuffleDiscardIntoDeck;
  window.onDeckShuffleEffects = onDeckShuffleEffects;
  window.onOpponentRefreshEffects = onOpponentRefreshEffects;
  window.onOpponentDrawEffects = onOpponentDrawEffects;
  window.onOpponentCompileEffects = onOpponentCompileEffects;
  window.onOpponentDiscardEffects = onOpponentDiscardEffects;
  window.onOpponentPlayInLineEffects = onOpponentPlayInLineEffects;
  window.onForcedDiscardEffects = onForcedDiscardEffects;
  window.onOwnDiscardEffects = onOwnDiscardEffects;
  window.applyReturnToHand = applyReturnToHand;
}

/**
 * Devuelve true si el oponente de `player` tiene Psique 1 bocarriba en campo.
 * Mientras esté activa, `player` solo puede jugar bocabajo.
 * DEBE estar descubierta (top de la pila)
 */
function hasForceOpponentFaceDown(player) {
  const opponent = player === 'player' ? 'ai' : 'player';
  return LINES.some(line => {
    const stack = gameState.field[line][opponent];
    if (stack.length === 0) return false;
    const topCardObj = stack[stack.length - 1];
    if (topCardObj.faceDown) return false;
    const effectDef = CARD_EFFECTS[topCardObj.card.nombre];
    return effectDef && effectDef.persistent && effectDef.persistent.effect === 'forceOpponentFaceDown';
  });
}

function hasAllowAnyProtocol(player) {
  return LINES.some(line => {
    const stack = gameState.field[line][player];
    // h_inicio siempre activo aunque esté cubierto — revisar todas las cartas bocarriba
    return stack.some(cardObj => {
      if (cardObj.faceDown) return false;
      const effectDef = CARD_EFFECTS[cardObj.card.nombre];
      return effectDef && effectDef.persistent && effectDef.persistent.allowAnyProtocol;
    });
  });
}

/**
 * Caos 3 (y similares): devuelve true si la carta tiene playAnywhere
 * (puede jugarse bocarriba en cualquier línea sin coincidir con protocolo).
 */
function canPlayAnywhere(card) {
  const effectDef = CARD_EFFECTS[card.nombre];
  return !!(effectDef && effectDef.playAnywhere);
}

/**
 * Corrupción 0: devuelve true si la carta puede jugarse en el lado de cualquier jugador.
 */
function canPlayOnAnySide(card) {
  const effectDef = CARD_EFFECTS[card.nombre];
  return !!(effectDef && effectDef.playOnAnySide);
}

/**
 * Unidad 1: devuelve la línea donde el jugador tiene Unidad 1 bocarriba
 * con allowUnityPlayInLine activo. Devuelve null si no existe.
 * Permite jugar cartas Unidad bocarriba en esa línea sin coincidir con protocolo.
 */
function getUnityPlayLine(player) {
  for (const line of LINES) {
    const stack = gameState.field[line][player];
    const hasModifier = stack.some(cardObj => {
      if (cardObj.faceDown) return false;
      const effectDef = CARD_EFFECTS[cardObj.card.nombre];
      return effectDef && effectDef.persistent && effectDef.persistent.allowUnityPlayInLine;
    });
    if (hasModifier) return line;
  }
  return null;
}
