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
  'Fuego 4':    { draw: 1 },                          // net: discard 1, draw 2 → +1
  'Gravedad 1': { draw: 2 },
  'Luz 0':      { draw: 2 },                          // avg flip value ≈ 2
  'Luz 2':      { draw: 2 },
  'Metal 1':    { draw: 2, preventCompile: true },
  'Oscuridad 0':{ draw: 3 },
  'Psique 0':   { draw: 2, opponentDiscard: 2 },
  'Velocidad 1':{ draw: 2 },
  'Agua 2':     { draw: 2 },
  'Amor 1':     { draw: 1 },                          // steals from opponent deck

  // ── Opponent discard ─────────────────────────────────
  'Plaga 0':    { opponentDiscard: 1 },
  'Plaga 1':    { opponentDiscard: 1 },
  'Plaga 2':    { selfDiscard: 1, opponentDiscard: 2 },
  'Psique 2':   { opponentDiscard: 2 },
  'Psique 3':   { opponentDiscard: 1 },

  // ── Eliminate ────────────────────────────────────────
  'Muerte 0':   { eliminate: { strategy: 'eachOtherLine' } },
  'Muerte 3':   { eliminate: { strategy: 'faceDown' } },
  'Muerte 4':   { eliminate: { strategy: 'maxVal', maxVal: 1 } },
  'Odio 0':     { eliminate: { strategy: 'highest' } },
  'Odio 1':     { selfDiscard: 3, eliminate: { strategy: 'highest', count: 2 } },
  'Odio 2':     { selfEliminateHighest: true, eliminate: { strategy: 'highest' } },

  // ── Play from deck ───────────────────────────────────
  'Vida 0':     { playFromDeck: { target: 'occupiedLines' } },
  'Agua 1':     { playFromDeck: { target: 'otherLines' } },
  'Gravedad 0': { playFromDeck: { target: 'pairsInLine' } },
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
   */
  isLineBlocked(gameState, line, playingPlayer) {
    const opponent = playingPlayer === 'player' ? 'ai' : 'player';
    const stack = (gameState.field && gameState.field[line] && gameState.field[line][opponent]) || [];
    return stack.some(cardObj => {
      if (cardObj.faceDown) return false;
      if (!cardObj.card) return false;
      const effects = typeof CARD_EFFECTS !== 'undefined' && CARD_EFFECTS[cardObj.card.nombre];
      const persistent = effects && effects.persistent;
      return persistent && persistent.effect === 'preventOpponentPlay';
    });
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
        // Skip lines blocked by player's Plaga 0
        if (this.isLineBlocked(gameState, line, 'ai')) return;

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

    if (handCount === 0) {
      if (gameState.player.deck.length > 0) moves.push({ action: 'refresh' });
      return moves;
    }

    const estimatedValue = this._estimatePlayerCardValue(gameState);
    const estimatedCard = { valor: estimatedValue, nombre: '??', protocol: null };

    LINES.forEach(line => {
      if (this.isLineBlocked(gameState, line, 'player')) return;

      // Face-down play: always possible when holding cards
      moves.push({ line, faceUp: false, card: estimatedCard, estimated: true });

      // Face-up play: only on matching protocol line (public info)
      gameState.player.protocols.forEach((protocol, idx) => {
        if (LINES[idx] === line) {
          moves.push({ line, faceUp: true, card: { valor: estimatedValue, nombre: '??', protocol }, estimated: true });
        }
      });
    });

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

    if (pool.length === 0) return 2.5;
    return pool.reduce((a, b) => a + b, 0) / pool.length;
  }

  /**
   * 🔀 MOVE ORDERING: Better moves first → improves alpha-beta pruning
   * For AI (maximizing): compile-ready > face-up on leading line > high value > face-down > refresh
   * For player (minimizing): same logic in reverse (worst for AI first)
   */
  sortMoves(gameState, moves, player) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    const score = (move) => {
      if (move.action === 'refresh') return player === 'ai' ? -5 : 5;
      if (!move.line) return 0;

      const myScore  = this._lineScore(gameState, move.line, player);
      const oppScore = this._lineScore(gameState, move.line, player === 'ai' ? 'player' : 'ai');
      const cardVal  = (move.card && move.card.valor) || 0;
      let s = 0;

      // Compile-ready: playing here wins the line
      if (myScore + cardVal >= 10 && myScore + cardVal > oppScore) s += 100;
      // Leading the line
      if (myScore > oppScore) s += 20;
      // Face up preferred (visible value contribution)
      if (move.faceUp) s += 10;
      // Card value
      s += cardVal * 2;

      return player === 'ai' ? s : -s; // player moves: lower is better for AI
    };

    return [...moves].sort((a, b) => score(b) - score(a));
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
      if (move.estimated) {
        // Player moves use estimated cards — don't expose real hand contents
        pState.hand.pop();
        card = move.card;
      } else {
        card = pState.hand.splice(move.cardIndex, 1)[0];
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

    // Opponent discard
    if (fx.opponentDiscard) {
      const n = Math.min(fx.opponentDiscard, state.player.hand.length);
      for (let i = 0; i < n; i++) {
        const c = state.player.hand.pop();
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
        // Remove first face-down card found in opponent field
        let removed = false;
        for (const l of LINES) {
          const stack = state.field[l].player;
          const idx = stack.findIndex(c => c.faceDown);
          if (idx !== -1) { state.player.trash.push(stack.splice(idx, 1)[0].card); removed = true; break; }
        }

      } else if (config.strategy === 'maxVal') {
        // Remove highest value card with valor <= maxVal
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
        break; // already handled multiple lines
      }
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
