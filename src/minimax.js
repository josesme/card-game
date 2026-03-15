/**
 * 🧠 MINIMAX ALGORITHM - COMPILE AI DECISION MAKING
 * Version: 2.1.1
 * Last Updated: 2026-03-11
 */

class MiniMax {
  constructor(evaluator, maxDepth = 2) {
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

    // Try each move and evaluate resulting positions
    const evaluatedMoves = availableMoves.map(move => {
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
      const aiMoves = this.generateAIMoves(gameState);

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
      const playerMoves = this.generatePlayerMoves(gameState);

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
   * 🎯 GENERATE PLAYER MOVES (Heuristic search)
   */
  generatePlayerMoves(gameState) {
    const moves = [];
    const hand = gameState.player.hand || [];
    const LINES = ['izquierda', 'centro', 'derecha'];

    // Prioritize high value cards to limit branching
    const bestIndices = hand
      .map((card, idx) => ({ idx, val: card.valor }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 3)
      .map(item => item.idx);

    bestIndices.forEach(index => {
      const card = hand[index];
      LINES.forEach(line => {
        // Skip lines blocked by AI's Plaga 0
        if (this.isLineBlocked(gameState, line, 'player')) return;

        const lineIdx = gameState.player.protocols.indexOf(card.protocol);
        if (lineIdx !== -1 && LINES[lineIdx] === line) {
          moves.push({ cardIndex: index, line, faceUp: true, card });
        }
        moves.push({ cardIndex: index, line, faceUp: false, card });
      });
    });

    return moves;
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
      const card = pState.hand.splice(move.cardIndex, 1)[0];
      newState.field[move.line][player].push({
        card: card,
        faceDown: !move.faceUp
      });
      // Basic simulation doesn't handle all complex effects yet, 
      // but board state update is already a huge improvement.
    }

    return newState;
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
