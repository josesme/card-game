/**
 * 🧠 MINIMAX ALGORITHM - COMPILE AI DECISION MAKING
 * Version: 2.1.0
 * Last Updated: 2026-03-07
 * 
 * Minimax Implementation:
 * - Evaluates future game states
 * - Maximizes AI score, minimizes player score
 * - Uses alpha-beta pruning for optimization
 * - Limits depth to prevent excessive calculation
 * 
 * Algorithm Flow:
 * 1. Generate all possible moves
 * 2. For each move, simulate result
 * 3. Recursively evaluate responses
 * 4. Choose move with best outcome
 * 5. Use pruning to skip bad branches
 */

class MiniMax {
  constructor(evaluator, maxDepth = 3) {
    this.evaluator = evaluator;
    this.maxDepth = maxDepth;
    this.nodeCount = 0;
    this.pruneCount = 0;
  }

  /**
   * 🎯 MAIN DECISION: Find best move using minimax
   * gameState: current game state
   * availableMoves: array of possible moves
   * depth: current recursion depth (default 0)
   * Returns: best move with evaluation
   */
  findBestMove(gameState, availableMoves, depth = 0) {
    this.nodeCount = 0;
    this.pruneCount = 0;

    if (availableMoves.length === 0) return null;

    // Try each move and evaluate resulting positions
    const evaluatedMoves = availableMoves.map(move => ({
      move,
      score: this.minimaxAlpha(
        this.simulateMove(gameState, move),
        depth + 1,
        true,  // It's player's turn next
        -Infinity,
        +Infinity
      ),
    }));

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
   * Returns: score of best move from this position
   */
  minimaxAlpha(gameState, depth, isMaximizing, alpha, beta) {
    this.nodeCount++;

    // Terminal condition: max depth reached
    if (depth >= this.maxDepth) {
      return this.evaluator.evaluateBoard().total;
    }

    // Terminal condition: game over
    if (this.isGameOver(gameState)) {
      return this.getTerminalScore(gameState);
    }

    if (isMaximizing) {
      // AI turn: try to maximize score
      let maxEval = -Infinity;
      const aiMoves = this.generateAIMoves(gameState);

      for (const move of aiMoves) {
        const nextState = this.simulateMove(gameState, move);
        const evalScore = this.minimaxAlpha(nextState, depth + 1, false, alpha, beta);
        
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);

        // Beta cutoff: prune this branch
        if (beta <= alpha) {
          this.pruneCount++;
          break;
        }
      }

      return maxEval;
    } else {
      // Player turn: try to minimize AI score
      let minEval = +Infinity;
      const playerMoves = this.generatePlayerMoves(gameState);

      for (const move of playerMoves) {
        const nextState = this.simulateMove(gameState, move);
        const evalScore = this.minimaxAlpha(nextState, depth + 1, true, alpha, beta);
        
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);

        // Alpha cutoff: prune this branch
        if (beta <= alpha) {
          this.pruneCount++;
          break;
        }
      }

      return minEval;
    }
  }

  /**
   * 🎮 GENERATE AI MOVES: All possible AI moves from state
   * Returns: array of move objects
   */
  generateAIMoves(gameState) {
    const moves = [];
    const hand = gameState.aiHand || [];

    hand.forEach((card, index) => {
      // Option 1: Play face up (if protocol matches)
      const LINES = ['izquierda', 'centro', 'derecha'];
      LINES.forEach(line => {
        moves.push({
          cardIndex: index,
          line,
          faceUp: true,
          card,
        });
      });

      // Option 2: Play face down
      LINES.forEach(line => {
        moves.push({
          cardIndex: index,
          line,
          faceUp: false,
          card,
        });
      });
    });

    // Option 3: Refresh deck
    if ((gameState.aiDeck || []).length > 0) {
      moves.push({
        action: 'refresh',
        deck: gameState.aiDeck.length,
      });
    }

    return moves;
  }

  /**
   * 🎯 GENERATE PLAYER MOVES: All possible player moves
   * (Simplified for minimax - assumes rational play)
   * Returns: array of move objects
   */
  generatePlayerMoves(gameState) {
    // Simplified: only generate top 3-5 likely player moves
    // to reduce branching factor
    const moves = [];
    const hand = gameState.playerHand || [];

    // Take only best cards to limit branching
    const bestCards = hand
      .map((card, idx) => ({ card, idx, value: card.valor || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, Math.min(4, hand.length));

    const LINES = ['izquierda', 'centro', 'derecha'];
    
    bestCards.forEach(({ card, idx }) => {
      LINES.forEach(line => {
        moves.push({
          cardIndex: idx,
          line,
          faceUp: true,
          card,
        });
      });
    });

    return moves;
  }

  /**
   * 📋 SIMULATE MOVE: Apply move to game state
   * Returns: new game state after move
   */
  simulateMove(gameState, move) {
    // Create deep copy to avoid modifying original
    const newState = JSON.parse(JSON.stringify(gameState));

    if (move.action === 'refresh') {
      // Refresh implementation
      return newState;
    }

    if (move.line) {
      // Card play implementation
      // This would be expanded to actually modify game state
      // For now, return state with move logged
      newState.lastMove = move;
    }

    return newState;
  }

  /**
   * 🏁 CHECK IF GAME IS OVER
   * Returns: boolean
   */
  isGameOver(gameState) {
    const aiCompiled = gameState.aiCompiled || 0;
    const playerCompiled = gameState.playerCompiled || 0;

    return aiCompiled >= 3 || playerCompiled >= 3;
  }

  /**
   * 📊 GET TERMINAL SCORE: Score when game ends
   * Returns: score (high if AI wins, low if player wins)
   */
  getTerminalScore(gameState) {
    const aiCompiled = gameState.aiCompiled || 0;
    const playerCompiled = gameState.playerCompiled || 0;

    if (aiCompiled >= 3) {
      return +1000; // AI wins
    }
    if (playerCompiled >= 3) {
      return -1000; // AI loses
    }

    return 0;
  }

  /**
   * 📈 ITERATIVE DEEPENING: Find best move with increasing depth
   * Balances quality vs speed
   * Returns: best move after exploring deeper
   */
  findBestMoveIterativeDeepening(gameState, availableMoves, timeLimit = 3000) {
    const startTime = Date.now();
    let bestResult = null;

    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const tempMaxDepth = this.maxDepth;
      this.maxDepth = depth;

      const result = this.findBestMove(gameState, availableMoves);
      bestResult = result;

      this.maxDepth = tempMaxDepth;

      // Check if we're out of time
      if (Date.now() - startTime > timeLimit) {
        break;
      }
    }

    return bestResult;
  }

  /**
   * 🎲 QUIESCENCE SEARCH: Extend search for tactical positions
   * Searches deeper when position is "noisy" (full of captures/trades)
   * Prevents horizon effect
   */
  quiescenceSearch(gameState, depth, isMaximizing, alpha, beta) {
    // Get static evaluation
    const staticEval = this.evaluator.evaluateBoard().total;

    if (isMaximizing) {
      alpha = Math.max(alpha, staticEval);
      if (alpha >= beta) return staticEval;
    } else {
      beta = Math.min(beta, staticEval);
      if (alpha >= beta) return staticEval;
    }

    // If position is quiet, return
    if (!this.isPositionTactical(gameState)) {
      return staticEval;
    }

    // Search deeper in tactical positions
    if (isMaximizing) {
      const moves = this.generateAIMoves(gameState);
      for (const move of moves) {
        const nextState = this.simulateMove(gameState, move);
        const evalScore = this.quiescenceSearch(nextState, depth - 1, false, alpha, beta);
        alpha = Math.max(alpha, evalScore);
        if (alpha >= beta) break;
      }
      return alpha;
    } else {
      const moves = this.generatePlayerMoves(gameState);
      for (const move of moves) {
        const nextState = this.simulateMove(gameState, move);
        const evalScore = this.quiescenceSearch(nextState, depth - 1, true, alpha, beta);
        beta = Math.min(beta, evalScore);
        if (alpha >= beta) break;
      }
      return beta;
    }
  }

  /**
   * 🎯 IS POSITION TACTICAL: Is this position "noisy"?
   * Positions with lots of captures/exchanges
   */
  isPositionTactical(gameState) {
    // Check if any line has big point differences
    // or if someone is about to compile
    const LINES = ['izquierda', 'centro', 'derecha'];
    
    for (const line of LINES) {
      const aiScore = gameState.scores?.[line]?.ai || 0;
      const playerScore = gameState.scores?.[line]?.player || 0;
      const diff = Math.abs(aiScore - playerScore);

      if (diff > 5 || aiScore >= 8 || playerScore >= 8) {
        return true; // Position is tactical
      }
    }

    return false;
  }
}

// Export for use in logic.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MiniMax;
}
