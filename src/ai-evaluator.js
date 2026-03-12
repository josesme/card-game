/**
 * 🤖 AI EVALUATION ENGINE - COMPILE PHASE 2
 * Version: 2.1.1
 * Last Updated: 2026-03-11
 * 
 * Board Evaluation System:
 * - Evaluates game state complexity
 * - Calculates threats and opportunities
 * - Scores potential moves
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
   */
  evaluateBoard(state = this.gameState) {
    const scores = {
      compilationDanger: this.evaluateCompilationThreat(state),
      lineStrength: this.evaluateLineStrengths(state),
      handQuality: this.evaluateHandQuality(state),
      opponentThreat: this.evaluateOpponentThreat(state),
      opportunityScore: this.evaluateOpportunities(state),
    };

    const totalScore = 
      (scores.compilationDanger * this.weights.compilationThreat) +
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
   */
  evaluateCompilationThreat(state) {
    const aiCompiled = state.ai.compiled.length;
    const playerCompiled = state.player.compiled.length;

    if (playerCompiled >= 2) return +0.8;
    if (aiCompiled >= 2) return -0.8;

    const aiThreat = this.countCompilationPotential(state, 'ai');
    const playerThreat = this.countCompilationPotential(state, 'player');

    return (playerThreat - aiThreat) / 10;
  }

  /**
   * 📊 LINE STRENGTHS: How are we doing in each line?
   */
  evaluateLineStrengths(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let totalDifference = 0;

    LINES.forEach(line => {
      const aiScore = window.calculateScore ? window.calculateScore(state, line, 'ai') : 0;
      const playerScore = window.calculateScore ? window.calculateScore(state, line, 'player') : 0;
      
      totalDifference += (playerScore - aiScore) / 30;
    });

    return totalDifference / 3;
  }

  /**
   * 🎴 HAND QUALITY: How good is AI current hand?
   */
  evaluateHandQuality(state) {
    const hand = state.ai.hand || [];
    if (hand.length === 0) return 0;

    let totalValue = 0;
    let effectCount = 0;

    hand.forEach(card => {
      totalValue += (card.valor || 0) / 6;
      if (card.h_accion || card.h_inicio || card.h_final) effectCount++;
    });

    return Math.min(1, (totalValue / hand.length + effectCount / hand.length) / 2);
  }

  /**
   * 🚨 OPPONENT THREAT: What can opponent do?
   */
  evaluateOpponentThreat(state) {
    const opponentHand = state.player.hand || [];
    const opponentDeck = state.player.deck || [];
    const cardsAvailable = opponentHand.length + Math.min(opponentDeck.length, 3);
    const compilationPotential = this.countCompilationPotential(state, 'player');

    return Math.min(1, (cardsAvailable / 10 + compilationPotential / 3) / 2);
  }

  /**
   * 🌟 OPPORTUNITIES: What good moves can we make?
   */
  evaluateOpportunities(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let opportunities = 0;

    LINES.forEach(line => {
      const aiScore = window.calculateScore ? window.calculateScore(state, line, 'ai') : 0;
      const playerScore = window.calculateScore ? window.calculateScore(state, line, 'player') : 0;

      if (aiScore >= 10 && aiScore > playerScore) opportunities += 2;
      if (aiScore < playerScore && (playerScore - aiScore) <= 3) opportunities += 1;
    });

    return Math.min(1, opportunities / 6);
  }

  /**
   * 🔢 COUNT COMPILATION POTENTIAL
   */
  countCompilationPotential(state, player) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let potentialCount = 0;

    LINES.forEach(line => {
      const aiScore = window.calculateScore ? window.calculateScore(state, line, 'ai') : 0;
      const playerScore = window.calculateScore ? window.calculateScore(state, line, 'player') : 0;

      if (player === 'ai') {
        if (aiScore >= 10 && aiScore > playerScore) potentialCount += 2;
        else if (aiScore >= 7) potentialCount += 1;
      } else {
        if (playerScore >= 10 && playerScore > aiScore) potentialCount += 2;
        else if (playerScore >= 7) potentialCount += 1;
      }
    });

    return potentialCount;
  }

  getRecommendation(scores) {
    if (scores.compilationDanger < -0.5) return { priority: 'COMPILE', strategy: 'aggressive' };
    if (scores.compilationDanger > 0.6) return { priority: 'DEFEND', strategy: 'defensive' };
    if (scores.handQuality > 0.7 && scores.lineStrength < 0) return { priority: 'ATTACK', strategy: 'aggressive' };
    return { priority: 'BALANCE', strategy: 'balanced' };
  }

  evaluateMoveQuality(move) {
    // Note: Simulation now happens in minimax.js
    // This is a static evaluator for a given state
    return this.evaluateBoard(this.gameState).total;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIEvaluator;
}
