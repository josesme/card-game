/**
 * 🤖 AI EVALUATION ENGINE - COMPILE PHASE 2
 * Version: 2.1.0
 * Last Updated: 2026-03-07
 * 
 * Board Evaluation System:
 * - Evaluates game state complexity
 * - Calculates threats and opportunities
 * - Scores potential moves
 * - Provides strategic recommendations
 * 
 * Key Metrics:
 * - Compilation threats (proximity to 3 compilations)
 * - Line value differences (current vs needed)
 * - Hand quality (card values and effects)
 * - Opportunity cost (what we lose if opponent plays)
 */

class AIEvaluator {
  constructor(gameState) {
    this.gameState = gameState;
    this.weights = {
      compilationThreat: 100,      // Highest priority
      defensiveNeed: 80,           // Prevent opponent winning
      lineValue: 50,               // Gain points
      cardAdvantage: 30,           // Hand quality
      effectChaining: 25,          // Ability synergies
    };
  }

  /**
   * 🎯 MAIN EVALUATION: Calculate overall board state score
   * Returns: number (-100 to +100)
   * - Negative: AI losing/needs defense
   * - Zero: Balanced
   * - Positive: AI winning
   */
  evaluateBoard() {
    const scores = {
      compilationDanger: this.evaluateCompilationThreat(),
      lineStrength: this.evaluateLineStrengths(),
      handQuality: this.evaluateHandQuality(),
      opponentThreat: this.evaluateOpponentThreat(),
      opportunityScore: this.evaluateOpportunities(),
    };

    const totalScore = 
      (scores.compilationDanger * this.weights.compilationThreat) +
      (scores.defensiveNeed * this.weights.defensiveNeed) +
      (scores.lineStrength * this.weights.lineValue) +
      (scores.handQuality * this.weights.cardAdvantage) +
      (scores.opportunityScore * this.weights.effectChaining);

    return {
      total: totalScore,
      details: scores,
      recommendation: this.getRecommendation(scores),
    };
  }

  /**
   * ⚠️ COMPILATION THREAT: How close is someone to winning?
   * Returns: -1 (we winning) to +1 (opponent winning)
   */
  evaluateCompilationThreat() {
    const aiCompiled = this.gameState.aiCompiled || 0;
    const playerCompiled = this.gameState.playerCompiled || 0;

    // If opponent has 2 compilations, DANGER!
    if (playerCompiled >= 2) {
      return +0.8; // High danger
    }

    // If we have 2, we're winning
    if (aiCompiled >= 2) {
      return -0.8; // Winning
    }

    // Count how many lines each can potentially compile
    const aiThreat = this.countCompilationPotential('ai');
    const playerThreat = this.countCompilationPotential('player');

    return (playerThreat - aiThreat) / 10; // Normalized
  }

  /**
   * 📊 LINE STRENGTHS: How are we doing in each line?
   * Returns: -1 (losing all lines) to +1 (winning all lines)
   */
  evaluateLineStrengths() {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let totalDifference = 0;

    LINES.forEach(line => {
      const aiScore = this.gameState.scores?.[line]?.ai || 0;
      const playerScore = this.gameState.scores?.[line]?.player || 0;
      
      // Normalize difference (-10 to +10 = -1 to +1)
      totalDifference += (playerScore - aiScore) / 30;
    });

    return totalDifference / 3; // Average of 3 lines
  }

  /**
   * 🎴 HAND QUALITY: How good is our current hand?
   * Returns: -1 (bad cards) to +1 (excellent cards)
   */
  evaluateHandQuality() {
    const hand = this.gameState.aiHand || [];
    
    if (hand.length === 0) return 0;

    let totalValue = 0;
    let effectCount = 0;

    hand.forEach(card => {
      // Card value (0-6 points)
      totalValue += (card.valor || 0) / 6;
      
      // Does it have effects?
      if (card.h_accion || card.h_inicio || card.h_final) {
        effectCount++;
      }
    });

    const avgValue = (totalValue / hand.length);
    const effectRatio = effectCount / hand.length;

    // Quality = average value + effect bonus
    return Math.min(1, (avgValue + effectRatio) / 2);
  }

  /**
   * 🚨 OPPONENT THREAT: What can opponent do?
   * Returns: -1 (weak) to +1 (dangerous)
   */
  evaluateOpponentThreat() {
    const opponentHand = this.gameState.playerHand || [];
    const opponentDeck = this.gameState.playerDeck || [];

    // How many cards can they play?
    const cardsAvailable = opponentHand.length + Math.min(opponentDeck.length, 3);

    // How many compilations can they get?
    const compilationPotential = this.countCompilationPotential('player');

    // Threat = combination of resources and potential
    const resourceThreat = Math.min(1, cardsAvailable / 10);
    const compilationThreat = compilationPotential / 3;

    return Math.min(1, (resourceThreat + compilationThreat) / 2);
  }

  /**
   * 🌟 OPPORTUNITIES: What good moves can we make?
   * Returns: -1 (no good moves) to +1 (excellent opportunities)
   */
  evaluateOpportunities() {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let opportunities = 0;

    LINES.forEach(line => {
      const aiScore = this.gameState.scores?.[line]?.ai || 0;
      const playerScore = this.gameState.scores?.[line]?.player || 0;

      // Can we compile this line?
      if (aiScore >= 10 && aiScore > playerScore) {
        opportunities += 2; // Very high value
      }

      // Can we close the gap?
      if (aiScore < playerScore && (playerScore - aiScore) <= 3) {
        opportunities += 1; // Possible to win
      }
    });

    return Math.min(1, opportunities / 6);
  }

  /**
   * 🔢 COUNT COMPILATION POTENTIAL: How many lines can compile?
   * Returns: number of lines that can potentially compile
   */
  countCompilationPotential(player) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let potentialCount = 0;

    LINES.forEach(line => {
      const aiScore = this.gameState.scores?.[line]?.ai || 0;
      const playerScore = this.gameState.scores?.[line]?.player || 0;

      if (player === 'ai') {
        // Can AI compile this line?
        if (aiScore >= 10 && aiScore > playerScore) {
          potentialCount += 2; // Can compile now
        } else if (aiScore >= 7) {
          potentialCount += 1; // Close to compiling
        }
      } else {
        // Can player compile this line?
        if (playerScore >= 10 && playerScore > aiScore) {
          potentialCount += 2;
        } else if (playerScore >= 7) {
          potentialCount += 1;
        }
      }
    });

    return potentialCount;
  }

  /**
   * 💡 RECOMMENDATION: What should we do?
   * Returns: strategic recommendation object
   */
  getRecommendation(scores) {
    // PRIORITY 1: If we can compile, DO IT
    if (scores.compilationDanger < -0.5) {
      return {
        priority: 'COMPILE',
        description: 'We can win this turn - play offensively!',
        strategy: 'aggressive',
      };
    }

    // PRIORITY 2: If opponent is close to winning, DEFEND
    if (scores.compilationDanger > 0.6) {
      return {
        priority: 'DEFEND',
        description: 'Opponent is close to winning - block them!',
        strategy: 'defensive',
      };
    }

    // PRIORITY 3: If we have good hand, ATTACK
    if (scores.handQuality > 0.7 && scores.lineStrength < 0) {
      return {
        priority: 'ATTACK',
        description: 'We have good cards - gain points!',
        strategy: 'aggressive',
      };
    }

    // PRIORITY 4: Balance and recover
    return {
      priority: 'BALANCE',
      description: 'Stabilize board and wait for opportunities',
      strategy: 'balanced',
    };
  }

  /**
   * 🎯 EVALUATE SPECIFIC MOVE: How good is this move?
   * Move format: { card, line, faceUp }
   * Returns: score (higher is better)
   */
  evaluateMoveQuality(move) {
    const beforeState = JSON.parse(JSON.stringify(this.gameState));
    
    // Simulate move
    // (This would be expanded to actually simulate)
    
    const afterEval = this.evaluateBoard();
    return afterEval.total;
  }

  /**
   * 📈 GET BEST MOVE: Find optimal move from available options
   * Moves: array of possible moves
   * Returns: best move object with score
   */
  getBestMove(availableMoves) {
    if (availableMoves.length === 0) return null;

    const scoredMoves = availableMoves.map(move => ({
      move,
      score: this.evaluateMoveQuality(move),
    }));

    // Sort by score (highest first)
    scoredMoves.sort((a, b) => b.score - a.score);

    return {
      bestMove: scoredMoves[0].move,
      score: scoredMoves[0].score,
      alternatives: scoredMoves.slice(1, 4), // Top 3 alternatives
      reasoning: this.getRecommendation(
        this.evaluateBoard().details
      ),
    };
  }
}

// Export for use in logic.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIEvaluator;
}
