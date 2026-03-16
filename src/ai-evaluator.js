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
    const bestPlayer = this._estimatePlayerBestCard(state);

    LINES.forEach(line => {
      if (state.field[line].compiledBy) return; // already decided, skip

      // Dead line check
      if (this.isDeadLine(state, line, 'ai')) {
        // AI cannot win this line. If player can still win it, it's a threat.
        if (!this.isDeadLine(state, line, 'player')) score -= 0.1;
        return;
      }

      const aiScore     = this._score(state, line, 'ai');
      const playerScore = this._score(state, line, 'player');

      // Immediate compile opportunity this turn
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
  // ─────────────────────────────────────────────

  evaluateLineStrengths(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    let total = 0;

    LINES.forEach(line => {
      if (state.field[line].compiledBy) return;

      // Penalize dead lines for AI
      if (this.isDeadLine(state, line, 'ai')) {
        total -= 0.5;
        return;
      }

      const aiScore     = this._score(state, line, 'ai');
      const playerScore = this._score(state, line, 'player');
      const diff        = aiScore - playerScore;
      const maxScore    = Math.max(aiScore, playerScore);

      const weight = maxScore >= 8 ? 1.6 : maxScore >= 5 ? 1.1 : 0.7;
      total += (diff / 20) * weight;
    });

    return Math.max(-1, Math.min(1, total / 3));
  }

  // ─────────────────────────────────────────────
  // DEAD LINE DETECTION
  // A line is "dead" for a player if they cannot possibly win it (reach 10 + beat opponent).
  // ─────────────────────────────────────────────

  isDeadLine(state, line, player) {
    if (state.field[line].compiledBy) return true;

    const opponent = player === 'ai' ? 'player' : 'ai';
    const myScore  = this._score(state, line, player);
    const oppScore = this._score(state, line, opponent);

    // If opponent already has 10+ and I am behind, can I still catch up?
    if (oppScore >= 10 && myScore < oppScore) {
      // Simple check: how many cards can I still play here?
      // For AI we know exactly, for player we estimate.
      const handCount = state[player].hand.length;
      const deckCount = state[player].deck.length;
      const cardsLeft = handCount + deckCount;

      if (cardsLeft === 0) return true;

      // Even if I play all cards as 5s, can I beat oppScore?
      // (Simplified: assuming 1 card slot available per turn, but field is unlimited in depth)
      // Actually COMPILE is about reaching 10 AND being ahead.
      // If opponent is at 15 and I have 0 cards, it's dead.
      // If I have cards but their max possible sum < 10 or < oppScore, it's dead.
      
      const maxPotential = myScore + (cardsLeft * 5); 
      if (maxPotential < 10 || maxPotential <= oppScore) return true;
    }

    // Special case: blocked lines (Plaga 0) - handled by isLineBlocked in minimax,
    // but here we consider it "temporarily dead" for evaluation if blocked.
    // However, isDeadLine here is more about "permanent" inability to win.

    return false;
  }

  // ─────────────────────────────────────────────
  // HAND QUALITY (AI hand only)
  // ─────────────────────────────────────────────

  evaluateHandQuality(state) {
    const hand = state.ai.hand || [];
    if (hand.length === 0) return 0;

    const deckCount = state.ai.deck.length;
    let score = 0;
    
    // 1. Base values and effect density
    hand.forEach(card => {
      score += (card.valor || 0) / 6; // base value contribution
      if (card.h_accion || card.h_inicio || card.h_final) score += 0.2;
    });

    // 2. Protocol Coverage
    const myProtocols = state.ai.protocols || [];
    const faceUpPotential = hand.filter(c => myProtocols.includes(c.protocol)).length;
    score += (faceUpPotential / hand.length) * 0.3;

    // 3. Synergy & Combos
    // Fuego 4 / Plaga 2: Better with more cards in hand
    const hasDiscardSynergy = hand.some(c => c.nombre === 'Fuego 4' || c.nombre === 'Plaga 2');
    if (hasDiscardSynergy && hand.length >= 4) score += 0.25;

    // Vida 0 / Agua 1 / Gravedad 0: Synergy with cards in deck
    const hasDeckSynergy = hand.some(c => ['Vida 0', 'Agua 1', 'Gravedad 0'].includes(c.nombre));
    if (hasDeckSynergy && deckCount >= 3) score += 0.2;
    if (hasDeckSynergy && deckCount === 0) score -= 0.3; // Useless without deck

    // Draw cards: High value if hand is low
    const hasDraw = hand.some(c => c.h_accion && c.h_accion.includes('Roba'));
    if (hasDraw && hand.length <= 2) score += 0.3;

    // 4. Resource balance (mix of high and low values)
    const highVals = hand.filter(c => c.valor >= 4).length;
    const lowVals  = hand.filter(c => c.valor <= 1).length;
    if (highVals > 0 && lowVals > 0) score += 0.15; // Balanced hand

    return Math.max(0, Math.min(1, score / hand.length));
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

  /**
   * Estimate the highest card value the player might hold,
   * using only public information: protocols (18 cards known) minus
   * face-up field cards and discards (both visible).
   */
  _estimatePlayerBestCard(state) {
    const pool = [0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5];
    const LINES = ['izquierda', 'centro', 'derecha'];

    LINES.forEach(line => {
      (state.field[line].player || []).forEach(c => {
        if (!c.faceDown) {
          const idx = pool.indexOf(c.card.valor);
          if (idx !== -1) pool.splice(idx, 1);
        }
      });
    });
    (state.player.trash || []).forEach(c => {
      const idx = pool.indexOf(c.valor);
      if (idx !== -1) pool.splice(idx, 1);
    });

    return pool.length > 0 ? Math.max(...pool) : 2.5;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIEvaluator;
}
