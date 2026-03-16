/**
 * 🤖 AI EVALUATION ENGINE - COMPILE PHASE 2
 * Version: 2.2.0
 *
 * Scoring convention: positive = good for AI, negative = bad for AI.
 * All component scores are clamped to [-1, 1] before weighting.
 */

class AIEvaluator {
  constructor(gameState) {
    this.gameState = gameState;
    this.weights = {
      compilationThreat: 100,  // Win/loss proximity — highest priority
      defensiveNeed:      80,  // Suppress opponent resources
      lineValue:          50,  // Score advantage across lines
      cardAdvantage:      30,  // Hand quality
      opportunities:      25,  // Exploitable line situations
    };
  }

  // ─────────────────────────────────────────────
  // MAIN ENTRY
  // ─────────────────────────────────────────────

  evaluateBoard(state = this.gameState) {
    const compilationThreat = this.evaluateCompilationThreat(state);
    const lineStrength      = this.evaluateLineStrengths(state);
    const handQuality       = this.evaluateHandQuality(state);
    const opponentThreat    = this.evaluateOpponentThreat(state);
    const opportunities     = this.evaluateOpportunities(state);

    const total =
      compilationThreat * this.weights.compilationThreat +
      lineStrength      * this.weights.lineValue +
      handQuality       * this.weights.cardAdvantage +
      (-opponentThreat) * this.weights.defensiveNeed +   // high threat = bad for AI
      opportunities     * this.weights.opportunities;

    return {
      total,
      details: { compilationThreat, lineStrength, handQuality, opponentThreat, opportunities },
      recommendation: this.getRecommendation(compilationThreat, lineStrength),
    };
  }

  // ─────────────────────────────────────────────
  // COMPILATION THREAT
  // positive = AI closer to winning / player far from winning
  // negative = player closer to winning / AI far
  // ─────────────────────────────────────────────

  evaluateCompilationThreat(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    const aiCompiled     = state.ai.compiled.length;
    const playerCompiled = state.player.compiled.length;
    let score = 0;

    // Match point bonuses (one compile away from victory)
    if (aiCompiled === 2)     score += 0.55;   // AI is at match point — exploit
    if (playerCompiled === 2) score -= 0.65;   // Player at match point — urgent defence

    // General compile count advantage
    score += (aiCompiled - playerCompiled) * 0.12;

    // Best card value in each hand (for "one card away" detection)
    const bestAI     = state.ai.hand.reduce((m, c) => Math.max(m, c.valor || 0), 0);
    const bestPlayer = state.player.hand.reduce((m, c) => Math.max(m, c.valor || 0), 0);

    LINES.forEach(line => {
      if (state.field[line].compiledBy) return; // already decided, skip

      const aiScore     = this._score(state, line, 'ai');
      const playerScore = this._score(state, line, 'player');

      // Immediate compile opportunity this turn (score beats opponent AND reaches threshold)
      if (aiScore > playerScore && aiScore >= 10)     score += 0.28;
      if (playerScore > aiScore && playerScore >= 10) score -= 0.28;

      // One card away from compile
      if (aiScore + bestAI > playerScore && aiScore + bestAI >= 10)         score += 0.14;
      if (playerScore + bestPlayer > aiScore && playerScore + bestPlayer >= 10) score -= 0.14;
    });

    return Math.max(-1, Math.min(1, score));
  }

  // ─────────────────────────────────────────────
  // LINE STRENGTHS
  // positive = AI leads overall, negative = player leads
  // Lines close to the compile threshold are weighted more.
  // ─────────────────────────────────────────────

  evaluateLineStrengths(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let total = 0;

    LINES.forEach(line => {
      const aiScore     = this._score(state, line, 'ai');
      const playerScore = this._score(state, line, 'player');
      const diff        = aiScore - playerScore;           // positive = AI leads
      const maxScore    = Math.max(aiScore, playerScore);

      // Weight by proximity to compile threshold (hot lines matter more)
      const weight = maxScore >= 8 ? 1.6 : maxScore >= 5 ? 1.1 : 0.7;

      total += (diff / 20) * weight;
    });

    return Math.max(-1, Math.min(1, total / 3));
  }

  // ─────────────────────────────────────────────
  // HAND QUALITY (AI hand only)
  // ─────────────────────────────────────────────

  evaluateHandQuality(state) {
    const hand = state.ai.hand || [];
    if (hand.length === 0) return 0;

    let totalValue  = 0;
    let effectCount = 0;

    hand.forEach(card => {
      totalValue += (card.valor || 0) / 6;
      if (card.h_accion || card.h_inicio || card.h_final) effectCount++;
    });

    return Math.min(1, (totalValue / hand.length + effectCount / hand.length) / 2);
  }

  // ─────────────────────────────────────────────
  // OPPONENT THREAT (resources + compile potential)
  // positive = player is dangerous (caller subtracts this)
  // ─────────────────────────────────────────────

  evaluateOpponentThreat(state) {
    const hand  = state.player.hand  || [];
    const deck  = state.player.deck  || [];
    const cardsAvailable     = hand.length + Math.min(deck.length, 3);
    const compilationPotential = this.countCompilationPotential(state, 'player');

    return Math.min(1, (cardsAvailable / 10 + compilationPotential / 4) / 2);
  }

  // ─────────────────────────────────────────────
  // OPPORTUNITIES (lines AI can exploit right now)
  // ─────────────────────────────────────────────

  evaluateOpportunities(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let opportunities = 0;

    LINES.forEach(line => {
      const aiScore     = this._score(state, line, 'ai');
      const playerScore = this._score(state, line, 'player');

      if (aiScore >= 10 && aiScore > playerScore)                opportunities += 2; // compile ready
      else if (aiScore > playerScore && aiScore >= 6)            opportunities += 1; // comfortable lead
      else if (aiScore >= playerScore * 0.75 && aiScore > 0)     opportunities += 0.5; // close, gaining
    });

    return Math.min(1, opportunities / 6);
  }

  // ─────────────────────────────────────────────
  // COMPILE POTENTIAL COUNTER
  // ─────────────────────────────────────────────

  countCompilationPotential(state, player) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let count = 0;

    LINES.forEach(line => {
      if (state.field[line].compiledBy) return;

      const myScore  = this._score(state, line, player);
      const oppScore = this._score(state, line, player === 'ai' ? 'player' : 'ai');

      if (myScore > oppScore && myScore >= 10) count += 2; // can compile now
      else if (myScore >= 7)                   count += 1; // getting close
    });

    return count;
  }

  // ─────────────────────────────────────────────
  // RECOMMENDATION (used by minimax for move ordering)
  // ─────────────────────────────────────────────

  getRecommendation(compilationThreat, lineStrength) {
    if (compilationThreat >= 0.4)  return 'COMPILE';   // AI close to winning — push
    if (compilationThreat <= -0.4) return 'DEFEND';    // Player close to winning — block
    if (lineStrength >= 0.3)       return 'ATTACK';    // AI leading — press advantage
    return 'BALANCE';
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  _score(state, line, player) {
    return window.calculateScore ? window.calculateScore(state, line, player) : 0;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIEvaluator;
}
