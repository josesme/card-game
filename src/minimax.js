/**
 * 🧠 MINIMAX ALGORITHM - COMPILE AI DECISION MAKING
 * Version: 2.2.0
 * Last Updated: 2026-03-16
 */

/**
 * Simplified effect table for minimax simulation.
 * Only face-up AI cards use this. Keys must match card.nombre exactly.
 * Fields:
 *   draw:              number  — AI draws N cards from deck
 *   selfDiscard:       number  — AI discards N cards from hand (cost)
 *   opponentDiscard:   number  — player discards N cards from hand
 *   eliminate:         object  — remove opponent card(s) from field
 *     strategy: 'highest' | 'faceDown' | 'maxVal' | 'eachOtherLine'
 *     count:    number (default 1)
 *     maxVal:   number (for maxVal strategy)
 *   selfEliminateHighest: bool — Odio 2: also eliminate AI's own highest
 *   playFromDeck:      object  — push face-down cards from AI deck to field
 *     target: 'occupiedLines' | 'otherLines' | 'pairsInLine'
 *   preventCompile:    bool    — flag player cannot compile next simulated turn
 */
const CARD_SIM_EFFECTS = {
  // ── Draw ──────────────────────────────────────────────
  'Espíritu 0': { draw: 1 },
  'Espíritu 1': { draw: 2 },
  'Fuego 0':    { draw: 2 },
  'Fuego 4':    { draw: 1 },
  'Gravedad 1': { draw: 2 },
  'Luz 0':      { draw: 2 },
  'Luz 1':      { draw: 1 },  // onTurnEnd — roba 1 por turno mientras esté bocarriba
  'Luz 2':      { draw: 2 },
  'Metal 1':    { draw: 2, preventCompile: true },
  'Metal 3':    { draw: 1, eliminate: { strategy: 'lineOver8' } },
  'Oscuridad 0':{ draw: 3 },
  'Psique 0':   { draw: 2, opponentDiscard: 2 },
  'Velocidad 1':{ draw: 2 },
  'Vida 2':     { draw: 1, flipOpponent: 1 },
  'Vida 4':     { draw: 1 },  // roba 1 si cubre otra carta (condición frecuente en mid-game)
  'Agua 2':     { draw: 2 },
  'Amor 1':     { draw: 1 },
  'Guerra 3':   { draw: 1 },  // onPlay roba 1
  'Valor 2':    { draw: 1 },  // onPlay roba 1

  // ── Self discard (cost cards) ─────────────────────────
  'Espíritu 5': { selfDiscard: 1 },
  'Muerte 5':   { selfDiscard: 1 },
  'Fuego 5':    { selfDiscard: 1 },
  'Gravedad 5': { selfDiscard: 1 },
  'Vida 5':     { selfDiscard: 1 },
  'Luz 5':      { selfDiscard: 1 },
  'Metal 5':    { selfDiscard: 1 },
  'Plaga 5':    { selfDiscard: 1 },
  'Psique 5':   { selfDiscard: 1 },
  'Velocidad 5':{ selfDiscard: 1 },
  'Agua 5':     { selfDiscard: 1 },
  'Oscuridad 5':{ selfDiscard: 1 },
  'Apatía 5':   { selfDiscard: 1 },
  'Odio 5':     { selfDiscard: 1 },
  'Amor 5':     { selfDiscard: 1 },

  // ── Conditional (discard to activate) ────────────────
  'Fuego 1':    { selfDiscard: 1, eliminate: { strategy: 'highest' } },
  'Fuego 2':    { selfDiscard: 1, returnOpponent: 1 },
  // Fuego 3: onTurnEnd — optionally discard to flip 1 opponent card; modeled without cost (optional trigger)
  'Fuego 3':    { flipOpponent: 1 },

  // ── Opponent discard ─────────────────────────────────
  'Plaga 0':    { opponentDiscard: 1 },
  'Plaga 1':    { opponentDiscard: 1 },
  'Plaga 2':    { selfDiscard: 1, opponentDiscard: 2 },
  // Plaga 4: onTurnEnd — forces opponent to eliminate 1 of their own facedown cards
  'Plaga 4':    { eliminate: { strategy: 'faceDown' } },
  'Psique 2':   { opponentDiscard: 2 },
  'Psique 3':   { opponentDiscard: 1 },
  // Psique 1: persistent — while face-up, forces opponent to play only facedown (≈ preventCompile)
  'Psique 1':   { preventCompile: true },
  // Psique 4: onTurnEnd — may return 1 opponent card to hand (and flip self facedown)
  'Psique 4':   { returnOpponent: 1 },
  'Guerra 4':   { opponentDiscard: 1 },  // onPlay oponente descarta 1
  'Hielo 1':    { opponentDiscard: 1 },  // onOpponentPlayInLine — aproximado como efecto inmediato

  // ── Eliminate ────────────────────────────────────────
  'Muerte 0':   { eliminate: { strategy: 'eachOtherLine' } },
  'Muerte 2':   { eliminate: { strategy: 'byValueRange', minVal: 1, maxVal: 2 } },
  'Muerte 3':   { eliminate: { strategy: 'faceDown' } },
  'Muerte 4':   { eliminate: { strategy: 'maxVal', maxVal: 1 } },
  'Odio 0':     { eliminate: { strategy: 'highest' } },
  'Odio 1':     { selfDiscard: 3, eliminate: { strategy: 'highest', count: 2 } },
  'Odio 2':     { selfEliminateHighest: true, eliminate: { strategy: 'highest' } },
  'Valor 1':    { eliminate: { strategy: 'highest' } },  // elimina carta en línea ganadora del oponente

  // ── Flip opponent cards (reduces their score) ─────────
  'Espíritu 2': { flipOpponent: 1 },
  'Metal 0':    { flipOpponent: 1 },
  'Apatía 3':   { flipOpponent: 1 },
  'Oscuridad 1':{ flipOpponent: 1 },
  'Gravedad 2': { flipOpponent: 1 },
  'Vida 1':     { flipOpponent: 2 },
  'Agua 0':     { flipOpponent: 1 },  // voltea 1 cualquiera + voltea self (coste no modelado)
  'Amor 4':     { flipOpponent: 1 },  // revela 1 de mano propia, voltea 1 cualquiera
  'Guerra 2':   { flipOpponent: 1 },  // onPlay voltea 1 cualquiera

  // ── Flip self line (hide own cards) ──────────────────
  'Apatía 1':   { flipSelfLineAllFaceUp: true },

  // ── Play from deck ───────────────────────────────────
  'Vida 0':     { playFromDeck: { target: 'occupiedLines' } },
  'Agua 1':     { playFromDeck: { target: 'otherLines' } },
  'Gravedad 0': { playFromDeck: { target: 'pairsInLine' } },

  // ── Positional ───────────────────────────────────────
  'Gravedad 6': { opponentPlayFromDeck: true },
  'Agua 3':     { returnOpponentByValue: 2 },
  'Velocidad 0':{ extraPlay: 1 },
  'Oscuridad 3':{ extraPlay: 1 },
  // Oscuridad 2: onPlay — may flip 1 covered card in this line; modeled as opponent flip
  'Oscuridad 2':{ flipOpponent: 1 },
  // Oscuridad 4: onPlay — shifts 1 facedown card (any); modeled as opponent field disruption
  'Oscuridad 4':{ returnOpponent: 1 },

  // ── Opponent gains (bad for AI) ───────────────────────
  'Amor 6':     { opponentDraw: 2 },
  'Amor 2':     { opponentDraw: 1 },

  // ── Return opponent cards ─────────────────────────────
  'Corrupción 1': { returnOpponent: 1 },
  'Miedo 2':      { returnOpponent: 1 },
  'Agua 4':       { returnSelf: true },    // onPlay devuelve esta carta a la mano — no deja score
  'Hielo 2':      { returnOpponent: 1 },  // shift any ≈ devuelve carta de mayor valor del oponente

  // ── Prevent compile / restrict opponent ───────────────
  // Metal 2: persistent — el oponente no puede jugar bocabajo en esta línea
  'Metal 2':      { preventCompile: true },

  // ── Mixed effects ─────────────────────────────────────
  'Valor 0':      { draw: 1, opponentDiscard: 1 },  // roba 1 + descarta oponente (onTurnEnd condicional)
  'Paz 2':        { draw: 1 },                       // roba 1 + juega mano bocabajo (extra presence no modelada)

  // ── Mass / composite flips ────────────────────────────
  'Plaga 3':      { flipOpponent: 3 },    // voltea todas las bocabajo del rival en la línea (~3 max)
  'Caos 0':       { flipOpponent: 2 },    // voltea cubiertas en cada línea (~2 en promedio)

  // ── Opponent forced discard ───────────────────────────
  'Miedo 4':      { opponentDiscard: 1 },
  'Miedo 1':      { draw: 2, opponentDiscard: 1 },

  // ── Opponent repositioning (shift = lose tempo) ───────
  'Miedo 3':      { returnOpponent: 1 },  // shift masivo simplificado como return del más alto
  'Velocidad 4':  { returnOpponent: 1 },  // reposición bocabajo = pérdida de tempo del rival

  // ── Deck tutoring (AI gains card advantage) ──────────
  'Claridad 3':   { draw: 1 },            // busca carta valor 5 del mazo = +1 carta de calidad
  'Claridad 2':   { draw: 1 },            // busca carta valor 1 y la juega = +1 en campo (aproximación)

  // ── Alternative compile triggers ─────────────────────
  // Diversidad 0 y Unidad 1 pueden compilar directamente — el árbol debe valorarlas alto
  'Diversidad 0': { draw: 1 },            // efecto compile condicional; aproximamos como +draw para que la IA la valore
  'Unidad 1':     { draw: 1 },            // ídem — el valor real se captura si la condición se cumple en partida

  // ── Main 1 — huecos cubiertos ────────────────────────
  // Muerte 1: Start trigger — roba 1, elimina otra carta, se auto-elimina
  'Muerte 1':   { draw: 1, eliminate: { strategy: 'highest' } },
  // Luz 3: cambia TODAS las bocabajo de esta línea a otra → disruption de campo rival
  'Luz 3':      { returnOpponent: 1 },
  // Amor 3: toma 1 carta aleatoria de la mano rival, da 1 propia → ganancia neta de calidad
  'Amor 3':     { draw: 1 },
  // Espíritu 3: reactivo (tras robar); Espíritu 4: reorganiza protocolos — sin efecto directo en sim
  // Gravedad 4: cambia bocabajo propia a esta línea — posicional, sin impacto oponente
  // Velocidad 2/3: reactivos o posicionales propios; Apatía 0/2: modificadores de score (calculateScore)
  // Apatía 4: voltea propia cubierta; Odio 3/4: reactivos; Vida 3: trigger al cubrir; Luz 4: informacional

  // ── Main 2 — huecos en familias ya presentes ─────────
  // Guerra 0: después de que oponente robe → puede eliminar 1 carta (trigger frecuente)
  'Guerra 0':   { eliminate: { strategy: 'highest' } },
  // Guerra 1: después de que oponente actualice → descarta+actualiza (motor de robo potente)
  'Guerra 1':   { draw: 2 },
  'Guerra 5':   { selfDiscard: 1 },
  'Hielo 5':    { selfDiscard: 1 },
  // Hielo 3/4: reactivo o propiedad pasiva — sin efecto directo
  // Paz 1: ambos descartan toda la mano — impacto propio alto, skip
  // Paz 3: descarta 1 (opcional) + voltea carta con valor > cartas en mano
  'Paz 3':      { flipOpponent: 1 },
  // Paz 4/6: reactivo o condicional propio
  'Paz 5':      { selfDiscard: 1 },
  // Claridad 0: modificador de score persistente (calculateScore lo aplica)
  // Claridad 1: trigger al ser cubierta (roba 3) + revela mano oponente → draw potencial
  'Claridad 1': { draw: 2 },
  // Claridad 4: baraja descarte en mazo → recarga futura
  'Claridad 4': { draw: 1 },
  'Claridad 5': { selfDiscard: 1 },
  // Caos 1: reorganiza ambos protocolos — complejo; Caos 2/3: posicional propio / propiedad
  // Caos 4: descarta mano + roba mismo número → reset de calidad de mano
  'Caos 4':     { draw: 1 },
  'Caos 5':     { selfDiscard: 1 },
  // Miedo 0: suprime comandos de oponente este turno + voltea/cambia 1 carta
  'Miedo 0':    { flipOpponent: 1 },
  'Miedo 5':    { selfDiscard: 1 },
  // Corrupción 0: voltea propia en pila — sin efecto sobre oponente
  // Corrupción 2: roba 1 + descarta 1 (neto 0) + persistente: oponente descarta 1 al descartar tú
  'Corrupción 2': { opponentDiscard: 1 },
  // Corrupción 3: voltea 1 carta cubierta bocarriba (propia o rival)
  'Corrupción 3': { flipOpponent: 1 },
  'Corrupción 5': { selfDiscard: 1 },
  // Corrupción 6: condicional auto-eliminar en turno final — sin efecto directo
  // Diversidad 1: cambia 1 carta + roba tantas como protocolos distintos en línea (~2 en midgame)
  'Diversidad 1': { returnOpponent: 1, draw: 2 },
  // Diversidad 3/6: modificador persistente de score / auto-eliminar condicional
  // Diversidad 4: voltea carta con valor < número de protocolos distintos en campo
  'Diversidad 4': { flipOpponent: 1 },
  'Diversidad 5': { selfDiscard: 1 },
  // Unidad 0: si hay otra Unidad en campo → voltea 1 o roba 1 (draw es opción dominante)
  'Unidad 0':   { draw: 1 },
  // Unidad 2: roba N igual a cartas Unidad en campo (~2 en midgame típico)
  'Unidad 2':   { draw: 2 },
  // Unidad 3: si hay otra Unidad → voltea 1 carta bocarriba
  'Unidad 3':   { flipOpponent: 1 },
  // Unidad 4: complejo condicional (mano vacía → roba todas las Unidad del mazo)
  'Unidad 5':   { selfDiscard: 1 },
  // Valor 3/6: reactivo / condicional propio; Valor 5: estándar
  'Valor 5':    { selfDiscard: 1 },

  // ── Asimilación (Main 2 — familia completa) ──────────
  // Asimilación 0: devuelve 1 carta bocabajo del oponente
  'Asimilación 0': { returnOpponent: 1 },
  // Asimilación 1: roba carta superior del mazo rival + descarta en su pila
  'Asimilación 1': { draw: 1 },
  // Asimilación 2: Final — juega bocabajo la carta superior del mazo rival en esta pila (AI gana presencia)
  'Asimilación 2': { draw: 1 },
  // Asimilación 4: intercambio mutuo de carta superior de mazo — neutro, skip
  'Asimilación 5': { selfDiscard: 1 },
  // Asimilación 6: juega propia bocabajo en lado rival — auto-perjudicial, skip

  // ── Suerte (Main 2 — familia completa) ───────────────
  // Suerte 0: roba 3, revela la que coincida con número dicho, puede jugarla
  'Suerte 0':   { draw: 2 },
  // Suerte 1: juega bocabajo la carta superior de tu mazo (ignora comandos de acción)
  'Suerte 1':   { draw: 1 },
  // Suerte 2: descarta carta superior propia, roba tantas como su valor (~media 2.5)
  'Suerte 2':   { draw: 2 },
  // Suerte 3: condicional sobre protocolo declarado — demasiado probabilístico para sim
  // Suerte 4: descarta carta superior del mazo rival; elimina carta que comparta valor
  'Suerte 4':   { eliminate: { strategy: 'highest' } },
  'Suerte 5':   { selfDiscard: 1 },

  // ── Espejo (Main 2 — familia completa) ───────────────
  // Espejo 0: score +1 por carta rival en línea — calculateScore lo aplica
  // Espejo 1: copia efecto de carta rival — demasiado variable para sim
  // Espejo 2: intercambia tus dos pilas — posicional propio
  // Espejo 3: voltea 1 propia + 1 rival en misma línea
  'Espejo 3':   { flipOpponent: 1 },
  // Espejo 4: reactivo (roba cuando rival roba)
  'Espejo 5':   { selfDiscard: 1 },

  // ── Humo (Main 2 — familia completa) ─────────────────
  // Humo 0: en cada línea con bocabajo, juega bocabajo la carta superior de tu mazo
  'Humo 0':     { playFromDeck: { target: 'occupiedLines' } },
  // Humo 1: voltea propia + puede cambiarla; Humo 2: score persistente (calculateScore)
  // Humo 3: juega bocabajo en 1 línea con bocabajo (subconjunto de Humo 0)
  'Humo 3':     { playFromDeck: { target: 'occupiedLines' } },
  // Humo 4: cambia 1 carta cubierta bocabajo — posicional propio
  'Humo 5':     { selfDiscard: 1 },

  // ── Tiempo (Main 2 — familia completa) ───────────────
  // Tiempo 0: juega 1 carta de tu descarte + baraja el descarte en el mazo
  'Tiempo 0':   { draw: 1 },
  // Tiempo 1: voltea 1 cubierta + descarta todo el mazo — demasiado destructivo para approx
  // Tiempo 2: después de barajar → roba 1 carta (+ puede cambiar esta carta)
  'Tiempo 2':   { draw: 1 },
  // Tiempo 3: revela 1 del descarte, juégala bocabajo en otra línea
  'Tiempo 3':   { playFromDeck: { target: 'otherLines' } },
  // Tiempo 4: roba 2 + descarta 2 (reset de calidad de mano)
  'Tiempo 4':   { draw: 2, selfDiscard: 2 },
  'Tiempo 5':   { selfDiscard: 1 },
};

class MiniMax {
  constructor(evaluator, maxDepth = 3) {
    this.evaluator = evaluator;
    this.maxDepth = maxDepth;
    this.nodeCount = 0;
    this.pruneCount = 0;
  }

  /**
   * 🎯 MAIN DECISION: Find best move using minimax
   */
  findBestMove(gameState, availableMoves) {
    this.nodeCount = 0;
    this.pruneCount = 0;

    if (availableMoves.length === 0) return null;

    // Order moves before search for better alpha-beta pruning
    const orderedMoves = this.sortMoves(gameState, availableMoves, 'ai');

    // Try each move and evaluate resulting positions
    const evaluatedMoves = orderedMoves.map(move => {
      const simulatedState = this.simulateMove(gameState, move, 'ai');
      return {
        move,
        score: this.minimaxAlpha(
          simulatedState,
          1,
          false, // Player's turn next (minimizing)
          -Infinity,
          +Infinity
        ),
      };
    });

    // Sort by score (AI wants maximum)
    evaluatedMoves.sort((a, b) => b.score - a.score);

    return {
      bestMove: evaluatedMoves[0].move,
      score: evaluatedMoves[0].score,
      alternatives: evaluatedMoves.slice(1, 3),
      statistics: {
        nodesEvaluated: this.nodeCount,
        nodesPruned: this.pruneCount,
        depth: this.maxDepth,
      },
    };
  }

  /**
   * 🔄 MINIMAX WITH ALPHA-BETA PRUNING
   */
  minimaxAlpha(gameState, depth, isMaximizing, alpha, beta) {
    this.nodeCount++;

    // Terminal conditions
    if (this.isGameOver(gameState)) {
      return this.getTerminalScore(gameState);
    }
    if (depth >= this.maxDepth) {
      // Quiescence: si alguien puede compilar ahora, extender 1 nivel más
      // pero solo evaluando los movimientos de compilación inmediata.
      if (this.isHotPosition(gameState)) {
        const LINES = ['izquierda', 'centro', 'derecha'];
        const player = isMaximizing ? 'ai' : 'player';
        const allMoves = isMaximizing
          ? this.generateAIMoves(gameState)
          : this.generatePlayerMoves(gameState);

        const compileMoves = allMoves.filter(m => {
          if (!m.line || !m.card) return false;
          const myScore  = this._lineScore(gameState, m.line, player);
          const oppScore = this._lineScore(gameState, m.line, player === 'ai' ? 'player' : 'ai');
          const val = m.faceUp ? (m.card.valor || 0) : 2;
          return myScore + val >= 10 && myScore + val > oppScore;
        });

        if (compileMoves.length > 0) {
          // Evaluar solo los movimientos de compilación y devolver el mejor
          if (isMaximizing) {
            let best = this.evaluator.evaluateBoard(gameState).total;
            for (const move of compileMoves) {
              const next = this.simulateMove(gameState, move, 'ai');
              best = Math.max(best, this.evaluator.evaluateBoard(next).total);
            }
            return best;
          } else {
            let best = this.evaluator.evaluateBoard(gameState).total;
            for (const move of compileMoves) {
              const next = this.simulateMove(gameState, move, 'player');
              best = Math.min(best, this.evaluator.evaluateBoard(next).total);
            }
            return best;
          }
        }
      }
      return this.evaluator.evaluateBoard(gameState).total;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      const aiMoves = this.sortMoves(gameState, this.generateAIMoves(gameState), 'ai');

      for (const move of aiMoves) {
        const nextState = this.simulateMove(gameState, move, 'ai');
        const evalScore = this.minimaxAlpha(nextState, depth + 1, false, alpha, beta);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) {
          this.pruneCount++;
          break;
        }
      }
      return maxEval;
    } else {
      let minEval = +Infinity;
      const playerMoves = this.sortMoves(gameState, this.generatePlayerMoves(gameState), 'player');

      for (const move of playerMoves) {
        const nextState = this.simulateMove(gameState, move, 'player');
        const evalScore = this.minimaxAlpha(nextState, depth + 1, true, alpha, beta);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) {
          this.pruneCount++;
          break;
        }
      }
      return minEval;
    }
  }

  /**
   * Checks if a line is blocked for playingPlayer by opponent's Plaga 0 (in simulated state)
   * DEBE estar descubierta (top de la pila)
   */
  isLineBlocked(gameState, line, playingPlayer) {
    const opponent = playingPlayer === 'player' ? 'ai' : 'player';
    const stack = (gameState.field && gameState.field[line] && gameState.field[line][opponent]) || [];
    if (stack.length === 0) return false;

    const topCardObj = stack[stack.length - 1];
    if (topCardObj.faceDown) return false;
    if (!topCardObj.card) return false;
    
    const effects = typeof CARD_EFFECTS !== 'undefined' && CARD_EFFECTS[topCardObj.card.nombre];
    const persistent = effects && effects.persistent;
    return persistent && persistent.effect === 'preventOpponentPlay';
  }

  /**
   * 🎮 GENERATE AI MOVES
   */
  generateAIMoves(gameState) {
    const moves = [];
    const hand = gameState.ai.hand || [];
    const LINES = ['izquierda', 'centro', 'derecha'];

    hand.forEach((card, index) => {
      LINES.forEach(line => {
        // Skip lines already compiled
        if (gameState.field[line].compiledBy) return;

        // Skip lines blocked by player's Plaga 0
        if (this.isLineBlocked(gameState, line, 'ai')) return;

        // DEAD LINE DETECTION: Skip if AI cannot win this line
        if (this.evaluator && this.evaluator.isDeadLine(gameState, line, 'ai')) return;

        // Option 1: Face up (only if protocol matches)
        const lineIdx = gameState.ai.protocols.indexOf(card.protocol);
        if (lineIdx !== -1 && LINES[lineIdx] === line) {
          moves.push({ cardIndex: index, line, faceUp: true, card });
        }
        // Option 2: Face down
        moves.push({ cardIndex: index, line, faceUp: false, card });
      });
    });

    if (gameState.ai.deck.length > 0 && hand.length < 5) {
      moves.push({ action: 'refresh' });
    }

    return moves;
  }

  /**
   * 🎯 GENERATE PLAYER MOVES (Imperfect information)
   * The AI does NOT know which specific cards the player holds.
   * It only knows: hand count (visible), protocols chosen (public), face-up field cards and discards.
   * Moves are generated with estimated average card value derived from public information.
   */
  generatePlayerMoves(gameState) {
    const moves = [];
    const handCount = (gameState.player.hand || []).length;
    const LINES = ['izquierda', 'centro', 'derecha'];
    const revealed = gameState.revealedPlayerCards || [];

    if (handCount === 0) {
      if (gameState.player.deck.length > 0) moves.push({ action: 'refresh' });
      return moves;
    }

    // Generar movimientos exactos para cartas reveladas
    const usedRevealed = new Set();
    revealed.forEach(card => {
      LINES.forEach(line => {
        if (this.isLineBlocked(gameState, line, 'player')) return;
        // Face-down: cualquier línea
        if (!usedRevealed.has(card.nombre + '_fd_' + line)) {
          moves.push({ line, faceUp: false, card: { valor: 2, nombre: card.nombre, protocol: card.protocolo }, estimated: false });
          usedRevealed.add(card.nombre + '_fd_' + line);
        }
        // Face-up: solo en línea de su protocolo
        gameState.player.protocols.forEach((protocol, idx) => {
          if (LINES[idx] === line && card.protocolo === protocol) {
            moves.push({ line, faceUp: true, card, estimated: false });
          }
        });
      });
    });

    // Generar movimientos estimados para cartas no reveladas
    const unknownCount = handCount - revealed.length;
    if (unknownCount > 0) {
      const estimatedValue = this._estimatePlayerCardValue(gameState);
      const estimatedCard = { valor: estimatedValue, nombre: '??', protocol: null };
      LINES.forEach(line => {
        if (this.isLineBlocked(gameState, line, 'player')) return;
        moves.push({ line, faceUp: false, card: estimatedCard, estimated: true });
        gameState.player.protocols.forEach((protocol, idx) => {
          if (LINES[idx] === line) {
            moves.push({ line, faceUp: true, card: { valor: estimatedValue, nombre: '??', protocol }, estimated: true });
          }
        });
      });
    }

    if (gameState.player.deck.length > 0 && handCount < 5) {
      moves.push({ action: 'refresh' });
    }

    return moves;
  }

  /**
   * Estimate average value of player's unknown cards using only public information.
   * Uses the actual card values from the player's chosen protocols (known from draft)
   * instead of a generic [0-5] pool. Subtracts face-up field cards, discards, and
   * already-revealed cards (all public information).
   */
  _estimatePlayerCardValue(gameState) {
    const LINES = ['izquierda', 'centro', 'derecha'];

    // Build pool from player's real protocol cards (public: protocols chosen in draft)
    const pool = [];
    const protocols = gameState.player.protocols || [];
    protocols.forEach(proto => {
      const cards = (typeof GLOBAL_CARDS !== 'undefined' && GLOBAL_CARDS && GLOBAL_CARDS[proto]) || [];
      cards.forEach(c => pool.push(c.valor !== undefined ? c.valor : (c.value || 0)));
    });

    // Fallback: if GLOBAL_CARDS not available, use generic pool
    if (pool.length === 0) {
      pool.push(0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5);
    }

    // Remove face-up field cards (visible)
    LINES.forEach(line => {
      (gameState.field[line].player || []).forEach(c => {
        if (!c.faceDown) {
          const idx = pool.indexOf(c.card.valor);
          if (idx !== -1) pool.splice(idx, 1);
        }
      });
    });
    // Remove discards (public)
    (gameState.player.trash || []).forEach(c => {
      const idx = pool.indexOf(c.valor);
      if (idx !== -1) pool.splice(idx, 1);
    });
    // Remove already-revealed cards (generate exact moves separately)
    (gameState.revealedPlayerCards || []).forEach(c => {
      const idx = pool.indexOf(c.valor);
      if (idx !== -1) pool.splice(idx, 1);
    });

    if (pool.length === 0) return 2.5;
    return pool.reduce((a, b) => a + b, 0) / pool.length;
  }

  /**
   * 🔀 MOVE ORDERING: Better moves first → improves alpha-beta pruning
   */
  sortMoves(gameState, moves, player) {
    const score = (move) => {
      const handCount = (gameState[player].hand || []).length;

      if (move.action === 'refresh') {
        if (player !== 'ai') return (handCount - 5) * 10;
        // Refresh: bueno solo con mano muy baja (strategy chat: con 3+ cartas es peor que bocabajo mediocre)
        if (handCount <= 1) return 40;
        if (handCount === 2) return 15;
        return -20; // 3+ cartas en mano → no recargar
      }
      if (!move.line) return 0;

      const opponent  = player === 'ai' ? 'player' : 'ai';
      const myScore   = this._lineScore(gameState, move.line, player);
      const oppScore  = this._lineScore(gameState, move.line, opponent);
      const cardVal   = (move.card && move.card.valor) || 0;
      const playerCompiled = (gameState.player.compiled || []).length;
      let s = 0;

      // 1. Compile Priority
      if (myScore + cardVal >= 10 && myScore + cardVal > oppScore) s += 150;

      // 2. Block Opponent Compile
      // Bloquear el tercer compile del rival es la jugada más urgente del juego
      const blockThreshold = this.maxDepth >= 5 ? 6 : 7;
      if (player === 'ai') {
        if (playerCompiled >= 2 && oppScore >= 6) s += 180; // match point rival: máxima urgencia
        else if (oppScore >= blockThreshold)       s += 50;
      }

      // 3. Face-up vs Face-down: táctica deliberada, no solo penalización
      if (move.faceUp) {
        s += 25;
      } else {
        const protocols = gameState[player].protocols || [];
        const LINES = ['izquierda', 'centro', 'derecha'];

        // Penalización base: jugar bocabajo una carta que podría ir bocarriba
        // Se reduce cuando la mano es pequeña (bocabajo es tempo válido)
        if (protocols.includes(move.card.protocol)) {
          s -= handCount <= 2 ? 5 : 15; // con mano pequeña, penalizar menos
        }

        // Bonus táctico 1: acumulación silenciosa en línea secundaria
        if (myScore <= 3 && oppScore <= 3) s += 18;

        // Bonus táctico 2: el rival amenaza compilar otra línea
        const rivalThreatenElsewhere = LINES.some(l => {
          if (l === move.line) return false;
          if (gameState.field[l].compiledBy) return false;
          return this._lineScore(gameState, l, opponent) >= (this.maxDepth >= 5 ? 6 : 7);
        });
        if (rivalThreatenElsewhere) s += 12;

        // Bonus táctico 3: bocabajo con mano pequeña = preservar tempo
        // (strategy chat: con 1-2 cartas, jugar bocabajo > pasar)
        if (player === 'ai' && handCount <= 2) s += 10;

        // Bonus táctico 4: combo bocabajo + voltear posterior
        if (player === 'ai' && cardVal >= 4) {
          const hand = gameState.ai.hand || [];
          const hasFlipSetup = hand.some(c => {
            if (!c.h_accion || c === move.card) return false;
            const txt = c.h_accion.toLowerCase();
            if (!txt.includes('voltea')) return false;
            const flipProtoIdx = protocols.indexOf(c.protocol);
            return flipProtoIdx !== -1 && LINES[flipProtoIdx] !== move.line;
          });
          if (hasFlipSetup) s += 22;
        }
      }

      // 4. Synergy & Value
      s += cardVal * 5;
      const hasEffect = move.card && (move.card.h_accion || move.card.h_inicio || move.card.h_final);
      if (hasEffect && move.faceUp) s += 20;

      return player === 'ai' ? s : -s;
    };

    return [...moves].sort((a, b) => score(b) - score(a));
  }

  /**
   * Una posición es "caliente" si algún jugador puede compilar una línea
   * en este mismo turno (score >= 10 y por encima del rival).
   * Usado por quiescence search para evitar cortar en momentos críticos.
   */
  isHotPosition(gameState) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    return LINES.some(line => {
      if (gameState.field[line].compiledBy) return false;
      const aiScore     = this._lineScore(gameState, line, 'ai');
      const playerScore = this._lineScore(gameState, line, 'player');
      return (aiScore >= 10 && aiScore > playerScore) ||
             (playerScore >= 10 && playerScore > aiScore);
    });
  }

  _lineScore(gameState, line, player) {
    return window.calculateScore ? window.calculateScore(gameState, line, player) : 0;
  }

  /**
   * Fast structural clone: copies only mutable parts, shares card object refs.
   * ~10× faster than JSON.parse/stringify — card objects themselves are never mutated.
   */
  _cloneState(s) {
    const cloneStack = arr => arr.map(o => ({ card: o.card, faceDown: o.faceDown }));
    const cloneLine  = line => ({ ...line, player: cloneStack(line.player), ai: cloneStack(line.ai) });
    return {
      ...s,
      player: { ...s.player, hand: [...s.player.hand], deck: [...s.player.deck], trash: [...s.player.trash], compiled: [...s.player.compiled] },
      ai:     { ...s.ai,     hand: [...s.ai.hand],     deck: [...s.ai.deck],     trash: [...s.ai.trash],     compiled: [...s.ai.compiled] },
      field:  { izquierda: cloneLine(s.field.izquierda), centro: cloneLine(s.field.centro), derecha: cloneLine(s.field.derecha) },
    };
  }

  /**
   * 📋 SIMULATE MOVE: Apply move to game state copy
   */
  simulateMove(gameState, move, player) {
    const newState = this._cloneState(gameState);
    const pState = newState[player];

    if (move.action === 'refresh') {
      while (pState.hand.length < 5 && pState.deck.length > 0) {
        pState.hand.push(pState.deck.pop());
      }
      return newState;
    }

    if (move.line) {
      let card;
      if (player === 'ai' && move.cardIndex !== undefined) {
        // AI: índice exacto conocido
        card = pState.hand.splice(move.cardIndex, 1)[0];
      } else {
        // Jugador: posición en mano desconocida para la IA — reducir conteo sin exponer carta real
        pState.hand.pop();
        card = move.card;
      }
      newState.field[move.line][player].push({
        card,
        faceDown: !move.faceUp
      });

      // Simulate onPlay effects for known AI cards played face-up
      if (player === 'ai' && move.faceUp && card.nombre !== '??') {
        this.simulateCardEffect(newState, card, move.line);
      }
    }

    return newState;
  }

  /**
   * 🃏 SIMULATE CARD EFFECT: Apply simplified onPlay effects for AI cards
   */
  simulateCardEffect(state, card, line) {
    const fx = CARD_SIM_EFFECTS[card.nombre];
    if (!fx) return;

    const LINES = ['izquierda', 'centro', 'derecha'];

    // Draw
    if (fx.draw) {
      const n = Math.min(fx.draw, state.ai.deck.length);
      for (let i = 0; i < n; i++) state.ai.hand.push(state.ai.deck.pop());
    }

    // AI self-discard (cost)
    if (fx.selfDiscard) {
      const n = Math.min(fx.selfDiscard, state.ai.hand.length);
      for (let i = 0; i < n; i++) {
        const c = state.ai.hand.pop();
        if (c) state.ai.trash.push(c);
      }
    }

    // Opponent discard — el jugador descarta su carta de menor valor (juego óptimo para el jugador).
    // Determinista: evita Math.random() dentro del árbol minimax, que produce evaluaciones inconsistentes.
    if (fx.opponentDiscard) {
      const n = Math.min(fx.opponentDiscard, state.player.hand.length);
      for (let i = 0; i < n; i++) {
        if (state.player.hand.length === 0) break;
        const minIdx = state.player.hand.reduce((mi, c, j, arr) => c.valor < arr[mi].valor ? j : mi, 0);
        const [c] = state.player.hand.splice(minIdx, 1);
        if (c) state.player.trash.push(c);
      }
    }

    // Odio 2: also remove AI's own highest value card first
    if (fx.selfEliminateHighest) {
      this._simEliminateHighest(state, 'ai', LINES);
    }

    // Eliminate opponent cards
    if (fx.eliminate) {
      this._simEliminate(state, fx.eliminate, line, LINES);
    }

    // Play face-down cards from AI deck onto field
    if (fx.playFromDeck) {
      this._simPlayFromDeck(state, fx.playFromDeck, line, LINES);
    }

    // Prevent player from compiling (Metal 1)
    if (fx.preventCompile) {
      state.player.cannotCompile = true;
    }

    // Flip opponent cards face-down (reduces their score in evaluation)
    if (fx.flipOpponent) {
      this._simFlipOpponent(state, fx.flipOpponent, LINES);
    }

    // Return opponent card(s) to hand
    if (fx.returnOpponent) {
      for (let i = 0; i < fx.returnOpponent; i++) {
        this._simReturnHighest(state, 'player', LINES);
      }
    }

    // Return all opponent cards of a specific value
    if (fx.returnOpponentByValue !== undefined) {
      LINES.forEach(l => {
        const stack = state.field[l].player;
        const toKeep = [];
        stack.forEach(c => {
          if (!c.faceDown && c.card.valor === fx.returnOpponentByValue) {
            state.player.hand.push(c.card);
          } else {
            toKeep.push(c);
          }
        });
        state.field[l].player = toKeep;
      });
    }

    // Apatía 1: flip all own face-up cards in this line face-down
    if (fx.flipSelfLineAllFaceUp) {
      (state.field[line].ai || []).forEach(c => {
        if (!c.faceDown) c.faceDown = true;
      });
    }

    // Gravedad 6: opponent places top deck card face-down on this line
    if (fx.opponentPlayFromDeck && state.player.deck.length > 0) {
      const card = state.player.deck.pop();
      state.field[line].player.push({ card, faceDown: true });
    }

    // Extra play: AI plays one additional card from hand face-down on best available line
    if (fx.extraPlay && state.ai.hand.length > 0) {
      const bestLine = LINES.filter(l => !state.field[l].compiledBy)
        .sort((a, b) => {
          const sa = window.calculateScore ? window.calculateScore(state, a, 'ai') : 0;
          const sb = window.calculateScore ? window.calculateScore(state, b, 'ai') : 0;
          return sb - sa;
        })[0];
      if (bestLine) {
        const card = state.ai.hand.pop();
        state.field[bestLine].ai.push({ card, faceDown: true });
      }
    }

    // Opponent draws cards (bad for AI)
    if (fx.opponentDraw) {
      const n = Math.min(fx.opponentDraw, state.player.deck.length);
      for (let i = 0; i < n; i++) state.player.hand.push(state.player.deck.pop());
    }
  }

  /**
   * Remove opponent cards from field based on strategy
   */
  _simEliminate(state, config, currentLine, LINES) {
    const count = config.count || 1;

    for (let i = 0; i < count; i++) {
      if (config.strategy === 'highest') {
        this._simEliminateHighest(state, 'player', LINES);

      } else if (config.strategy === 'faceDown') {
        for (const l of LINES) {
          const stack = state.field[l].player;
          const idx = stack.findIndex(c => c.faceDown);
          if (idx !== -1) { state.player.trash.push(stack.splice(idx, 1)[0].card); break; }
        }

      } else if (config.strategy === 'maxVal') {
        let best = null, bestLine = null, bestIdx = -1;
        for (const l of LINES) {
          state.field[l].player.forEach((c, idx) => {
            if (!c.faceDown && c.card.valor <= config.maxVal) {
              if (!best || c.card.valor > best.card.valor) { best = c; bestLine = l; bestIdx = idx; }
            }
          });
        }
        if (best) { state.player.trash.push(state.field[bestLine].player.splice(bestIdx, 1)[0].card); }

      } else if (config.strategy === 'eachOtherLine') {
        // Muerte 0: remove highest from each line OTHER than current
        LINES.filter(l => l !== currentLine).forEach(l => {
          this._simEliminateHighest(state, 'player', [l]);
        });
        break;

      } else if (config.strategy === 'byValueRange') {
        // Muerte 2 / Agua 3: remove all cards with valor in [minVal, maxVal] from best opponent line
        const bestLine = LINES.filter(l => state.field[l].player.length > 0)
          .sort((a, b) => {
            const sa = window.calculateScore ? window.calculateScore(state, a, 'player') : 0;
            const sb = window.calculateScore ? window.calculateScore(state, b, 'player') : 0;
            return sb - sa;
          })[0];
        if (bestLine) {
          state.field[bestLine].player = state.field[bestLine].player.filter(c => {
            const inRange = !c.faceDown && c.card.valor >= config.minVal && c.card.valor <= config.maxVal;
            if (inRange) state.player.trash.push(c.card);
            return !inRange;
          });
        }
        break;

      } else if (config.strategy === 'lineOver8') {
        // Metal 3: eliminate all cards from opponent's best line if score >= 8
        const target = LINES.filter(l => l !== currentLine).find(l => {
          const score = window.calculateScore ? window.calculateScore(state, l, 'player') : 0;
          return score >= 8;
        });
        if (target) {
          state.field[target].player.forEach(c => state.player.trash.push(c.card));
          state.field[target].player = [];
        }
        break;
      }
    }
  }

  /**
   * Flip N of opponent's highest-value face-up cards to face-down
   */
  _simFlipOpponent(state, count, LINES) {
    for (let i = 0; i < count; i++) {
      let best = null, bestLine = null;
      for (const l of LINES) {
        const stack = state.field[l].player;
        if (stack.length === 0) continue;
        const top = stack[stack.length - 1];
        if (!top.faceDown && (!best || top.card.valor > best.card.valor)) {
          best = top; bestLine = l;
        }
      }
      if (best) best.faceDown = true;
    }
  }

  /**
   * Return highest-value card of `player` from field back to their hand
   */
  _simReturnHighest(state, player, LINES) {
    let best = null, bestLine = null, bestIdx = -1;
    for (const l of LINES) {
      (state.field[l][player] || []).forEach((c, idx) => {
        if (!best || c.card.valor > best.card.valor) { best = c; bestLine = l; bestIdx = idx; }
      });
    }
    if (best) {
      state[player].hand.push(state.field[bestLine][player].splice(bestIdx, 1)[0].card);
    }
  }

  /**
   * Remove the highest value face-up card of `player` across given lines
   */
  _simEliminateHighest(state, player, lines) {
    let best = null, bestLine = null, bestIdx = -1;
    for (const l of lines) {
      (state.field[l][player] || []).forEach((c, idx) => {
        if (!c.faceDown && (!best || c.card.valor > best.card.valor)) {
          best = c; bestLine = l; bestIdx = idx;
        }
      });
    }
    if (best) { state[player].trash.push(state.field[bestLine][player].splice(bestIdx, 1)[0].card); }
  }

  /**
   * Push face-down cards from AI deck onto field
   */
  _simPlayFromDeck(state, config, currentLine, LINES) {
    if (config.target === 'occupiedLines') {
      LINES.forEach(l => {
        if (state.field[l].ai.length > 0 && state.ai.deck.length > 0) {
          state.field[l].ai.push({ card: state.ai.deck.pop(), faceDown: true });
        }
      });
    } else if (config.target === 'otherLines') {
      LINES.filter(l => l !== currentLine).forEach(l => {
        if (state.ai.deck.length > 0) {
          state.field[l].ai.push({ card: state.ai.deck.pop(), faceDown: true });
        }
      });
    } else if (config.target === 'pairsInLine') {
      const stack = state.field[currentLine].ai;
      const pairs = Math.floor(stack.length / 2);
      for (let i = 0; i < pairs && state.ai.deck.length > 0; i++) {
        stack.splice(stack.length - 1, 0, { card: state.ai.deck.pop(), faceDown: true });
      }
    }
  }

  isGameOver(gameState) {
    return gameState.ai.compiled.length >= 3 || gameState.player.compiled.length >= 3;
  }

  getTerminalScore(gameState) {
    if (gameState.ai.compiled.length >= 3) return +1000;
    if (gameState.player.compiled.length >= 3) return -1000;
    return 0;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MiniMax;
}
