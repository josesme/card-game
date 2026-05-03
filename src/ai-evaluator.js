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
    this.diffDepth = 3; // actualizado cada turno desde playAITurn
    this.weights = {
      compilationThreat:  100,  // Win/loss proximity — highest priority
      defensiveNeed:       80,  // Suppress opponent resources
      lineValue:           50,  // Score advantage across lines
      cardAdvantage:       30,  // Hand quality
      opportunities:       25,  // Exploitable line situations
      protocolCoverage:    20,  // Protocol cards face-up = effects active
      faceDownBalance:     15,  // Bocabajos propios vs amenaza bocabajos rival
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
    const protocolCoverage  = this.evaluateProtocolCoverage(state);
    const faceDownBalance   = this.evaluateFaceDownBalance(state);

    // AI-03: Niveles 1-2 limitan la defensa activa.
    let effectiveOpponentThreat = opponentThreat;
    if (this.diffDepth <= 1) {
      effectiveOpponentThreat = 0;
    } else if (this.diffDepth === 2) {
      const LINES = ['izquierda', 'centro', 'derecha'];
      const immediateThreat = LINES.some(line =>
        !state.field[line].compiledBy && this._score(state, line, 'player') >= 9
      );
      if (!immediateThreat) effectiveOpponentThreat = 0;
    }

    // AI-E2: pesos dinámicos según fase de juego
    const w = this._phaseWeights(state);

    const total =
      compilationThreat          * w.compilationThreat +
      lineStrength               * w.lineValue +
      handQuality                * w.cardAdvantage +
      (-effectiveOpponentThreat) * w.defensiveNeed +
      opportunities              * w.opportunities +
      protocolCoverage           * w.protocolCoverage +
      faceDownBalance            * w.faceDownBalance;

    return {
      total,
      details: { compilationThreat, lineStrength, handQuality, opponentThreat, opportunities, protocolCoverage, faceDownBalance },
      recommendation: this.getRecommendation(compilationThreat, lineStrength),
    };
  }

  // ─────────────────────────────────────────────
  // GAME PHASE
  // early: 0-1 compiles total — develop freely
  // mid:   2-3 compiles total — balance attack/defense
  // late:  either player has 2 compiles — close it out
  // ─────────────────────────────────────────────

  _getGamePhase(state) {
    const aiCompiled = (state.ai.compiled || []).length;
    const plCompiled = (state.player.compiled || []).length;
    if (aiCompiled >= 2 || plCompiled >= 2) return 'late';
    if (aiCompiled + plCompiled >= 2)       return 'mid';
    return 'early';
  }

  _phaseWeights(state) {
    const phase = this._getGamePhase(state);
    const w = Object.assign({}, this.weights);
    if (phase === 'mid') {
      w.compilationThreat = 120;
      w.defensiveNeed     =  95;
      w.opportunities     =  35;
      w.lineValue         =  45;
      w.cardAdvantage     =  20;
    } else if (phase === 'late') {
      // Late: compile or be compiled — everything else is noise
      w.compilationThreat = 180;
      w.defensiveNeed     = 130;
      w.opportunities     =  50;
      w.lineValue         =  25;
      w.cardAdvantage     =  10;
      w.protocolCoverage  =  10;
      w.faceDownBalance   =   5;
    }
    return w;
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
    if (playerCompiled === 2) score -= 0.80;   // Player at match point — bloquear es prioridad absoluta

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

      // Two cards away (solo niveles 4-5)
      if (this.diffDepth >= 4) {
        const top2AI     = this._aiTop2Sum(state);
        const top2Player = this._estimatePlayerTop2Sum(state);
        if (aiScore + top2AI > playerScore && aiScore + top2AI >= 10)         score += 0.20;
        if (playerScore + top2Player > aiScore && playerScore + top2Player >= 10) score -= 0.20;
      }
    });

    // Multi-line pressure (AI-E8): amenazar compile en 2+ líneas simultáneamente
    // es tácticamente casi irreversible — el rival solo puede bloquear una.
    // El umbral y el bonus escalan con la fase de juego.
    const phase = this._getGamePhase(state);
    const threatThreshold = phase === 'late' ? 6 : 7; // late: activar antes
    const aiBonus   = phase === 'late' ? 0.60 : phase === 'mid' ? 0.45 : 0.35;
    const plPenalty = phase === 'late' ? 0.70 : phase === 'mid' ? 0.55 : 0.40;

    const aiLinesThreat = LINES.filter(line => {
      if (state.field[line].compiledBy) return false;
      if (this.isDeadLine(state, line, 'ai')) return false;
      const aiS = this._score(state, line, 'ai');
      const plS = this._score(state, line, 'player');
      return aiS >= threatThreshold && aiS >= plS;
    }).length;
    const playerLinesThreat = LINES.filter(line => {
      if (state.field[line].compiledBy) return false;
      if (this.isDeadLine(state, line, 'player')) return false;
      const plS = this._score(state, line, 'player');
      const aiS = this._score(state, line, 'ai');
      return plS >= threatThreshold && plS >= aiS;
    }).length;
    if (aiLinesThreat >= 2)     score += aiBonus   * (aiLinesThreat - 1);
    if (playerLinesThreat >= 2) score -= plPenalty * (playerLinesThreat - 1);

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
      const handCount = state[player].hand.length;
      const deckCount = state[player].deck.length;
      const cardsLeft = handCount + deckCount;

      if (cardsLeft === 0) return true;

      // Calcular el potencial realista (no el optimista de asumir todo 5s)
      let realisticPotential;
      if (player === 'ai') {
        // IA: valores exactos conocidos
        const handSum = state.ai.hand.reduce((s, c) => s + (c.valor || 0), 0);
        const deckAvg = deckCount > 0
          ? state.ai.deck.reduce((s, c) => s + (c.valor || 0), 0) / deckCount
          : 0;
        realisticPotential = myScore + handSum + (deckCount * deckAvg);
      } else {
        // Jugador: estimar media del pool público restante
        const avgVal = this._estimatePlayerAvgCard(state);
        realisticPotential = myScore + (cardsLeft * avgVal);
      }

      if (realisticPotential < 10 || realisticPotential <= oppScore) return true;
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

    // 4b. Acumular múltiples 4s es problemático: sus efectos son pasivos y situacionales.
    // (strategy chat: los 4s se descartan más que cualquier otro número)
    const fours = hand.filter(c => c.valor === 4).length;
    if (fours >= 2) score -= 0.12 * (fours - 1);

    // 5. Penalización por agotamiento de recursos (solo nivel 5)
    // Un jugador experto gestiona sus cartas para no quedarse sin opciones.
    if (this.diffDepth >= 5) {
      const totalResources = hand.length + deckCount + (state.ai.trash || []).length;
      if (deckCount === 0 && hand.length <= 2) score -= 0.4; // Sin mazo y casi sin mano
      else if (deckCount === 0 && hand.length <= 4) score -= 0.2; // Sin mazo, mano reducida
      else if (deckCount <= 2 && hand.length <= 2) score -= 0.2; // Mazo casi vacío + mano corta
      if (totalResources <= 3) score -= 0.3; // Recursos totales críticos
    }

    return Math.max(0, Math.min(1, score / hand.length));
  }

  // ─────────────────────────────────────────────
  // OPPONENT THREAT (resources + compile potential + hidden bocabajos)
  // positive = player is dangerous (caller subtracts this)
  // ─────────────────────────────────────────────

  evaluateOpponentThreat(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    const hand  = state.player.hand  || [];
    const deck  = state.player.deck  || [];
    const cardsAvailable       = hand.length + Math.min(deck.length, 3);
    const compilationPotential = this.countCompilationPotential(state, 'player');

    // Bocabajos rivales en líneas cercanas a compilar = amenaza oculta
    let hiddenThreat = 0;
    LINES.forEach(line => {
      if (state.field[line].compiledBy) return;
      const playerScore  = this._score(state, line, 'player');
      const faceDownCount = (state.field[line].player || []).filter(c => c.faceDown).length;
      // Si el rival está cerca y tiene bocabajos = riesgo de activar de golpe
      if (playerScore >= 5 && faceDownCount > 0) hiddenThreat += faceDownCount * 0.1;
      else hiddenThreat += faceDownCount * 0.04;
    });

    return Math.min(1, (cardsAvailable / 10 + compilationPotential / 4) / 2 + hiddenThreat);
  }

  // ─────────────────────────────────────────────
  // PROTOCOL COVERAGE
  // Bonus por cartas propias de protocolo boca arriba (efectos activos)
  // y presión en las 3 líneas simultáneamente
  // ─────────────────────────────────────────────

  evaluateProtocolCoverage(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    const myProtocols = state.ai.protocols || [];
    let score = 0;
    let linesWithCards = 0;

    LINES.forEach((line, idx) => {
      if (state.field[line].compiledBy) return;
      const lineCards = state.field[line].ai || [];
      if (lineCards.length > 0) linesWithCards++;

      const protocol = myProtocols[idx];
      if (!protocol) return;

      const faceUpProtocol = lineCards.filter(c => !c.faceDown && c.card && c.card.protocol === protocol).length;
      const faceUpAny      = lineCards.filter(c => !c.faceDown).length;

      // Carta de protocolo activa = efecto disponible
      score += faceUpProtocol * 0.22;

      // 2+ cartas de protocolo en la misma línea = combo potencial
      if (faceUpProtocol >= 2) score += 0.25;

      // Línea mixta (protocolo + otras boca arriba) = presión estable
      if (faceUpProtocol >= 1 && faceUpAny >= 2) score += 0.12;
    });

    // Presión en las 3 frentes simultáneamente dificulta al rival defenderse
    if (linesWithCards === 3) score += 0.3;
    else if (linesWithCards === 2) score += 0.1;

    return Math.max(-1, Math.min(1, score / 3));
  }

  // ─────────────────────────────────────────────
  // FACE-DOWN BALANCE (AI-E3)
  // Bocabajo tiene valor estratégico solo con un plan:
  // - Protocolos con sinergia de bocabajo (Life/Water/Smoke/Darkness/Apathy)
  // - Línea donde la IA puede ganar (no línea perdida)
  // - Cubrir carta con bottom command
  // Sin plan = pérdida de tempo — penalizar.
  // ─────────────────────────────────────────────

  evaluateFaceDownBalance(state) {
    const LINES = ['izquierda', 'centro', 'derecha'];
    const FACEDOWN_SYNERGY_PROTOCOLS = ['Vida', 'Agua', 'Humo', 'Oscuridad', 'Apatía'];
    const aiProtocols = state.ai.protocols || [];
    const hasFaceDownSynergy = aiProtocols.some(p => FACEDOWN_SYNERGY_PROTOCOLS.includes(p));

    let score = 0;

    LINES.forEach(line => {
      if (state.field[line].compiledBy) return;
      const aiCards     = state.field[line].ai     || [];
      const playerCards = state.field[line].player || [];
      const aiTotal     = aiCards.length;

      if (aiTotal > 0) {
        const aiFaceDown = aiCards.filter(c =>  c.faceDown).length;
        const aiFaceUp   = aiCards.filter(c => !c.faceDown).length;
        const lineLost   = this.isDeadLine(state, line, 'ai');

        // Bocabajo en línea perdida = contribuir al rival directamente
        if (aiFaceDown > 0 && lineLost) {
          score -= 0.4 * aiFaceDown;
        } else if (aiFaceDown > 0) {
          if (hasFaceDownSynergy) {
            // Bocabajo con sinergia activa = herramienta táctica válida
            score += 0.15 * aiFaceDown;
          } else {
            // Bocabajo sin sinergia = pérdida de tempo leve
            score -= 0.1 * aiFaceDown;
          }
        }

        // Tener al menos 1 boca arriba = efectos accesibles
        if (aiFaceUp >= 1) score += 0.15;

        // Mezcla equilibrada con sinergia = posición flexible
        if (aiFaceDown >= 1 && aiFaceUp >= 1 && hasFaceDownSynergy) score += 0.1;

        // Solo bocabajos sin ninguno activo = sin efectos
        if (aiFaceDown > 0 && aiFaceUp === 0 && !hasFaceDownSynergy) score -= 0.25;
      }

      // Bocabajos del rival = potencial oculto
      const playerFaceDown = playerCards.filter(c => c.faceDown).length;
      score -= playerFaceDown * 0.06;
    });

    return Math.max(-1, Math.min(1, score));
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
   * Build the pool of card values the player might still hold,
   * using only public information:
   *   - Base: the actual cards from the player's chosen protocols (known from draft)
   *   - Minus: face-up field cards (visible) + discards (visible) + revealed hand cards
   * Never reads state.player.hand or state.player.deck (private).
   */
  _buildPlayerPool(state) {
    const protocols = state.player.protocols || [];
    const pool = [];

    protocols.forEach(proto => {
      const cards = (typeof GLOBAL_CARDS !== 'undefined' && GLOBAL_CARDS && GLOBAL_CARDS[proto]) || [];
      cards.forEach(c => pool.push(c.valor !== undefined ? c.valor : (c.value || 0)));
    });

    // Fallback: if GLOBAL_CARDS not available use generic pool
    if (pool.length === 0) {
      pool.push(0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5);
    }

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
    (state.revealedPlayerCards || []).forEach(c => {
      const idx = pool.indexOf(c.valor !== undefined ? c.valor : (c.value || 0));
      if (idx !== -1) pool.splice(idx, 1);
    });

    return pool;
  }

  _estimatePlayerBestCard(state) {
    const pool = this._buildPlayerPool(state);
    return pool.length > 0 ? Math.max(...pool) : 2.5;
  }

  _estimatePlayerAvgCard(state) {
    const pool = this._buildPlayerPool(state);
    if (pool.length === 0) return 2.5;
    return pool.reduce((s, v) => s + v, 0) / pool.length;
  }

  // Suma de los 2 mejores valores en mano de la IA
  _aiTop2Sum(state) {
    const vals = (state.ai.hand || []).map(c => c.valor || 0).sort((a, b) => b - a);
    return (vals[0] || 0) + (vals[1] || 0);
  }

  _estimatePlayerTop2Sum(state) {
    const pool = this._buildPlayerPool(state);
    pool.sort((a, b) => b - a);
    return (pool[0] || 0) + (pool[1] || 0);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIEvaluator;
}
