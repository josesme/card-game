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
  'Luz 2':      { draw: 2 },
  'Metal 1':    { draw: 2, preventCompile: true },
  'Metal 3':    { draw: 1, eliminate: { strategy: 'lineOver8' } },
  'Oscuridad 0':{ draw: 3 },
  'Psique 0':   { draw: 2, opponentDiscard: 2 },
  'Velocidad 1':{ draw: 2 },
  'Vida 2':     { draw: 1, flipOpponent: 1 },
  'Agua 2':     { draw: 2 },
  'Amor 1':     { draw: 1 },

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

  // ── Opponent discard ─────────────────────────────────
  'Plaga 0':    { opponentDiscard: 1 },
  'Plaga 1':    { opponentDiscard: 1 },
  'Plaga 2':    { selfDiscard: 1, opponentDiscard: 2 },
  'Psique 2':   { opponentDiscard: 2 },
  'Psique 3':   { opponentDiscard: 1 },

  // ── Eliminate ────────────────────────────────────────
  'Muerte 0':   { eliminate: { strategy: 'eachOtherLine' } },
  'Muerte 2':   { eliminate: { strategy: 'byValueRange', minVal: 1, maxVal: 2 } },
  'Muerte 3':   { eliminate: { strategy: 'faceDown' } },
  'Muerte 4':   { eliminate: { strategy: 'maxVal', maxVal: 1 } },
  'Odio 0':     { eliminate: { strategy: 'highest' } },
  'Odio 1':     { selfDiscard: 3, eliminate: { strategy: 'highest', count: 2 } },
  'Odio 2':     { selfEliminateHighest: true, eliminate: { strategy: 'highest' } },

  // ── Flip opponent cards (reduces their score) ─────────
  'Espíritu 2': { flipOpponent: 1 },
  'Metal 0':    { flipOpponent: 1 },
  'Apatía 3':   { flipOpponent: 1 },
  'Oscuridad 1':{ flipOpponent: 1 },
  'Gravedad 2': { flipOpponent: 1 },
  'Vida 1':     { flipOpponent: 2 },

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

  // ── Opponent gains (bad for AI) ───────────────────────
  'Amor 6':     { opponentDraw: 2 },
  'Amor 2':     { opponentDraw: 1 },
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
   * Estimate average value of player's unknown cards using only public information:
   * - Player's 18 cards = values [0-5] × 3 protocol families
   * - Subtract face-up cards on field (visible) and discards (visible)
   */
  _estimatePlayerCardValue(gameState) {
    const pool = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5];
    const LINES = ['izquierda', 'centro', 'derecha'];

    LINES.forEach(line => {
      (gameState.field[line].player || []).forEach(c => {
        if (!c.faceDown) {
          const idx = pool.indexOf(c.card.valor);
          if (idx !== -1) pool.splice(idx, 1);
        }
      });
    });
    (gameState.player.trash || []).forEach(c => {
      const idx = pool.indexOf(c.valor);
      if (idx !== -1) pool.splice(idx, 1);
    });
    // Excluir cartas reveladas (ya generan movimientos exactos)
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
      if (move.action === 'refresh') {
        // Refresh is good if hand is low
        const handCount = (gameState[player].hand || []).length;
        return player === 'ai' ? (5 - handCount) * 10 : (handCount - 5) * 10;
      }
      if (!move.line) return 0;

      const myScore  = this._lineScore(gameState, move.line, player);
      const oppScore = this._lineScore(gameState, move.line, player === 'ai' ? 'player' : 'ai');
      const cardVal  = (move.card && move.card.valor) || 0;
      let s = 0;

      // 1. Compile Priority
      if (myScore + cardVal >= 10 && myScore + cardVal > oppScore) s += 150;
      
      // 2. Block Opponent Compile (nivel 5 bloquea antes: threshold 6 en vez de 7)
      const blockThreshold = this.maxDepth >= 5 ? 6 : 7;
      if (oppScore >= blockThreshold && player === 'ai') s += 50;

      // 3. Efficiency (Face-up > Face-down)
      if (move.faceUp) s += 25;
      else {
        // Penalty for playing face-down if the card COULD be face-up elsewhere
        const protocols = gameState[player].protocols || [];
        if (protocols.includes(move.card.protocol)) s -= 15;
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
   * 📋 SIMULATE MOVE: Apply move to game state copy
   */
  simulateMove(gameState, move, player) {
    const newState = JSON.parse(JSON.stringify(gameState));
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
