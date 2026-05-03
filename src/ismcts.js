'use strict';

/**
 * ISMCTS — Information Set Monte Carlo Tree Search
 * For COMPILE card game (imperfect information: player's hand is hidden).
 *
 * Key idea: instead of one fixed tree over known states, each iteration
 * "determinizes" the game (samples a plausible player hand consistent with
 * public info) and runs standard MCTS on that determinization.
 * Nodes accumulate stats across all determinizations where they were reachable.
 *
 * UCB formula (ISMCTS variant):
 *   UCB = wins/visits + C * sqrt(ln(availability) / visits)
 * where `availability` = times this node was reachable in a determinization.
 */

const ISMCTS_LINES = ['izquierda', 'centro', 'derecha'];
const ISMCTS_UCB_C = 0.7;   // exploration constant — lower than std (0.7 works for card games)
const ISMCTS_ROLLOUT_DEPTH = 14; // max plies per rollout

// ─────────────────────────────────────────────────────────────
// NODE
// ─────────────────────────────────────────────────────────────

class ISMCTSNode {
    constructor(move, parent, mover) {
        this.move   = move;       // move that created this node (null for root)
        this.parent = parent;
        this.mover  = mover;      // 'ai' | 'player' — who made this move
        this.children      = [];
        this.visits        = 0;
        this.wins          = 0.0; // accumulates result from AI perspective (1=AI wins)
        this.availabilities = 0;  // times reachable in a determinization
    }

    ucb(parentAvailability) {
        if (this.visits === 0) return Infinity;
        return this.wins / this.visits +
               ISMCTS_UCB_C * Math.sqrt(Math.log(parentAvailability || 1) / this.visits);
    }

    // Win rate from the perspective of the player AT this node's parent
    // (i.e. the player who chose to go here)
    winRateFor(player) {
        if (this.visits === 0) return 0;
        return player === 'ai'
            ? this.wins / this.visits
            : 1 - (this.wins / this.visits);
    }

    childForMove(move) {
        return this.children.find(c => _movesMatch(c.move, move)) || null;
    }
}

function _movesMatch(a, b) {
    if (!a || !b) return false;
    if (a.action && b.action) return a.action === b.action;
    if (!a.card || !b.card) return false;
    return a.line === b.line &&
           a.faceUp === b.faceUp &&
           a.card.nombre === b.card.nombre;
}

// ─────────────────────────────────────────────────────────────
// ISMCTS ENGINE
// ─────────────────────────────────────────────────────────────

class ISMCTS {
    /**
     * @param {number} timeBudgetMs   — milliseconds to search (maps to difficulty level)
     * @param {number} [rolloutDepth] — max plies per rollout
     */
    constructor(timeBudgetMs, rolloutDepth = ISMCTS_ROLLOUT_DEPTH) {
        this.timeBudget   = timeBudgetMs;
        this.rolloutDepth = rolloutDepth;
        this.iterations   = 0;
    }

    // ── Public entry ──────────────────────────────────────────

    /**
     * Find the best move for the AI given the current gameState.
     * @param {object} gameState  — real game state (player.hand is the real hand)
     * @param {Array}  rootMoves  — pre-generated legal AI moves (from generateAIPossibleMoves)
     * @returns {{ bestMove, score, iterations }}
     */
    findBestMove(gameState, rootMoves) {
        const deadline = Date.now() + this.timeBudget;
        const root = new ISMCTSNode(null, null, null);
        this.iterations = 0;

        if (!rootMoves || rootMoves.length === 0) return null;

        while (Date.now() < deadline) {
            // 1. Determinize: replace player.hand with a sampled plausible hand
            const det = this._determinize(gameState);

            // 2-5. Select → Expand → Rollout → Backpropagate
            const { node, state } = this._select(root, det, rootMoves);
            const result = this._rollout(state, 'player'); // player moves next after AI expansion
            this._backpropagate(node, result);
            this.iterations++;
        }

        if (root.children.length === 0) {
            return { bestMove: rootMoves[0], score: 0.5, iterations: this.iterations };
        }

        // Robust child: most visited (more stable than highest win rate)
        const best = root.children.reduce((a, b) => a.visits > b.visits ? a : b);
        return {
            bestMove:   best.move,
            score:      Math.round((best.visits > 0 ? best.wins / best.visits : 0.5) * 100),
            iterations: this.iterations,
        };
    }

    // ── Determinization ───────────────────────────────────────

    /**
     * Build a "world" where player's hidden hand is replaced by a random
     * sample consistent with all public information.
     */
    _determinize(state) {
        const pool = this._buildPublicPool(state);
        // Fisher-Yates shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const handSize = (state.player.hand || []).length;
        const sampledHand = pool.slice(0, handSize);
        const sampledDeck = pool.slice(handSize);

        const det = this._cloneState(state);
        det.player.hand = sampledHand;
        det.player.deck = sampledDeck;
        return det;
    }

    /**
     * Cards the player *might* still hold: all cards from their protocols,
     * minus face-up field cards, minus discards, minus revealed cards.
     * Returns full card objects (not just values) for exact move generation.
     */
    _buildPublicPool(state) {
        const pool = [];
        const protocols = state.player.protocols || [];
        protocols.forEach(proto => {
            const cards = (typeof GLOBAL_CARDS !== 'undefined' && GLOBAL_CARDS[proto]) || [];
            cards.forEach(c => pool.push({ ...c }));
        });

        // Remove face-up field cards
        ISMCTS_LINES.forEach(line => {
            (state.field[line].player || []).forEach(cardObj => {
                if (!cardObj.faceDown) {
                    const idx = pool.findIndex(c => c.nombre === cardObj.card.nombre);
                    if (idx !== -1) pool.splice(idx, 1);
                }
            });
        });
        // Remove discards (public)
        (state.player.trash || []).forEach(c => {
            const idx = pool.findIndex(p => p.nombre === c.nombre);
            if (idx !== -1) pool.splice(idx, 1);
        });
        // Remove revealed cards (e.g. from Luz 4)
        (state.revealedPlayerCards || []).forEach(c => {
            const idx = pool.findIndex(p => p.nombre === (c.nombre || c.name));
            if (idx !== -1) pool.splice(idx, 1);
        });

        return pool;
    }

    // ── Tree Policy: Select + Expand ──────────────────────────

    /**
     * Walk the tree using UCB until we find an unexpanded node, then expand it.
     * Marks nodes as "available" when they are reachable in this determinization.
     * @param {ISMCTSNode} root
     * @param {object}     det       — determinized state
     * @param {Array}      rootMoves — legal root moves (AI's turn)
     * @returns {{ node, state }}
     */
    _select(root, det, rootMoves) {
        let node  = root;
        let state = det;
        let mover = 'ai';    // AI moves first from root

        // Moves available at root are the pre-computed possibleMoves
        let legalMoves = rootMoves;

        while (true) {
            if (this._isTerminal(state)) return { node, state };

            // Mark all legal children as available in this determinization
            legalMoves.forEach(m => {
                const child = node.childForMove(m);
                if (child) child.availabilities++;
            });

            const unexpanded = legalMoves.filter(m => !node.childForMove(m));

            if (unexpanded.length > 0) {
                // Expand: pick a random untried move
                const move  = unexpanded[Math.floor(Math.random() * unexpanded.length)];
                const child = new ISMCTSNode(move, node, mover);
                child.availabilities = 1;
                node.children.push(child);
                const nextState = this._applyMove(state, move, mover);
                return { node: child, state: nextState };
            }

            // All moves tried — select best child by UCB (from current mover's perspective)
            const available = node.children.filter(c =>
                legalMoves.some(m => _movesMatch(c.move, m))
            );
            if (available.length === 0) return { node, state };

            const best = available.reduce((a, b) => {
                const ua = a.winRateFor(mover) + ISMCTS_UCB_C * Math.sqrt(Math.log(a.availabilities || 1) / (a.visits || 1));
                const ub = b.winRateFor(mover) + ISMCTS_UCB_C * Math.sqrt(Math.log(b.availabilities || 1) / (b.visits || 1));
                return ua > ub ? a : b;
            });

            state = this._applyMove(state, best.move, mover);
            node  = best;
            mover = mover === 'ai' ? 'player' : 'ai';
            legalMoves = this._generateMoves(state, mover);
        }
    }

    // ── Rollout ───────────────────────────────────────────────

    /**
     * Simulate from `state` using a lightweight heuristic policy.
     * Returns result in [0,1] from AI perspective (1 = AI wins).
     */
    _rollout(state, mover) {
        let s = this._cloneState(state);
        let player = mover;
        let depth = 0;

        while (!this._isTerminal(s) && depth < this.rolloutDepth) {
            const moves = this._generateMoves(s, player);
            if (moves.length === 0) break;
            const move = this._rolloutPolicy(s, moves, player);
            s = this._applyMove(s, move, player);
            player = player === 'ai' ? 'player' : 'ai';
            depth++;
        }

        return this._evaluate(s);
    }

    /**
     * Rollout policy — fast heuristic, no random for quality at low iteration counts:
     *   1. Compile if possible
     *   2. Block opponent compile
     *   3. Highest face-up card in best line
     *   4. Highest face-down card
     *   5. Refresh
     */
    _rolloutPolicy(state, moves, player) {
        const opponent = player === 'ai' ? 'player' : 'ai';

        // Returns true if a line is structurally unwinnable for `who`
        const isDeadLine = (line, who) => {
            if (state.field[line].compiledBy) return true;
            const opp = who === 'ai' ? 'player' : 'ai';
            const myS  = calculateScore(state, line, who);
            const oppS = calculateScore(state, line, opp);
            // Count cards still playable (face-down cards this player could flip or remaining hand)
            const myField   = (state.field[line][who] || []);
            const faceDownN = myField.filter(c => c.faceDown).length;
            // Max potential: current score + remaining hand (assume best case ~5 per card) + face-down flips (~3 avg)
            const handSize  = (state[who].hand || []).length;
            const maxAdd    = handSize * 5 + faceDownN * 3;
            if (myS + maxAdd < 10) return true;       // can't reach 10
            if (myS + maxAdd <= oppS) return true;    // can't beat opponent even at max
            return false;
        };

        // 1. Compile
        const compile = moves.find(m => {
            if (!m.line || !m.card) return false;
            const myS  = calculateScore(state, m.line, player);
            const oppS = calculateScore(state, m.line, opponent);
            const val  = m.faceUp ? (m.card.valor || 0) : 2;
            return myS + val >= 10 && myS + val > oppS && !state.field[m.line].compiledBy;
        });
        if (compile) return compile;

        // 2. Block opponent compile
        if (player === 'ai') {
            const block = moves.find(m => {
                if (!m.line || !m.card) return false;
                const oppS = calculateScore(state, m.line, 'player');
                return oppS >= 7 && !state.field[m.line].compiledBy;
            });
            if (block) return block;
        }

        // 3. Best face-up play — prefer winnable lines, score by: line advantage + card value
        const faceUpMoves = moves.filter(m => m.line && m.faceUp && m.card);
        if (faceUpMoves.length > 0) {
            // Separate moves by whether the line is winnable for the current player
            const winnableFU = faceUpMoves.filter(m => !isDeadLine(m.line, player));
            const pool = winnableFU.length > 0 ? winnableFU : faceUpMoves;
            return pool.reduce((best, m) => {
                const myS   = calculateScore(state, m.line, player);
                const oppS  = calculateScore(state, m.line, opponent);
                const lineA = myS - oppS; // advantage on this line
                const scoreM    = lineA + (m.card.valor || 0);
                const scoreBest = (calculateScore(state, best.line, player) - calculateScore(state, best.line, opponent)) + (best.card.valor || 0);
                return scoreM > scoreBest ? m : best;
            });
        }

        // 4. Best face-down play — only in winnable lines when playing as AI
        const faceDownMoves = moves.filter(m => m.line && !m.faceUp && m.card);
        if (faceDownMoves.length > 0) {
            const winnableFD = player === 'ai'
                ? faceDownMoves.filter(m => !isDeadLine(m.line, player))
                : faceDownMoves;
            const pool = winnableFD.length > 0 ? winnableFD : faceDownMoves;
            return pool.reduce((best, m) =>
                (m.card.valor || 0) > (best.card.valor || 0) ? m : best
            );
        }

        return moves[0];
    }

    // ── Backpropagation ───────────────────────────────────────

    _backpropagate(node, result) {
        let n = node;
        while (n !== null) {
            n.visits++;
            n.wins += result; // result always from AI perspective
            n = n.parent;
        }
    }

    // ── Terminal & Evaluation ─────────────────────────────────

    _isTerminal(state) {
        return (state.ai.compiled || []).length >= 3 ||
               (state.player.compiled || []).length >= 3;
    }

    /**
     * Evaluate a non-terminal leaf. Returns [0,1] from AI perspective.
     * Uses AIEvaluator when available; falls back to score-based heuristic.
     */
    _evaluate(state) {
        const aiCompiled = (state.ai.compiled || []).length;
        const plCompiled = (state.player.compiled || []).length;

        if (aiCompiled >= 3) return 1.0;
        if (plCompiled >= 3) return 0.0;

        if (typeof AIEvaluator !== 'undefined') {
            try {
                const evaluator = new AIEvaluator(state);
                evaluator.diffDepth = 5; // use full evaluation depth
                const { total } = evaluator.evaluateBoard(state);
                // total range: [-410, +410] based on max late-game weight sum
                return Math.max(0, Math.min(1, (total + 410) / 820));
            } catch (e) {
                // fall through to basic heuristic
            }
        }

        // Fallback: compile count + normalized line scores
        let aiScore = aiCompiled * 4;
        let plScore = plCompiled * 4;
        ISMCTS_LINES.forEach(line => {
            if (state.field[line].compiledBy === 'ai')     { aiScore += 2; return; }
            if (state.field[line].compiledBy === 'player') { plScore += 2; return; }
            const aS = calculateScore(state, line, 'ai');
            const pS = calculateScore(state, line, 'player');
            aiScore += aS / 10;
            plScore += pS / 10;
        });
        const total = aiScore + plScore;
        return total > 0 ? aiScore / total : 0.5;
    }

    // ── Move Generation ───────────────────────────────────────

    /**
     * Simplified move generation used inside the tree and rollouts.
     * Root AI moves come from logic.js (pre-computed, handles all edge cases).
     * Deeper moves use this simplified version for simulation speed.
     */
    _generateMoves(state, player) {
        const moves = [];
        const hand = state[player].hand || [];
        const protocols = state[player].protocols || [];

        hand.forEach((card, index) => {
            ISMCTS_LINES.forEach(line => {
                if (state.field[line].compiledBy) return;

                // Face-up: only if protocol matches
                const lineIdx = protocols.indexOf(card.protocol);
                if (lineIdx !== -1 && ISMCTS_LINES[lineIdx] === line) {
                    moves.push({ cardIndex: index, line, faceUp: true, card });
                }
                // Face-down: any line
                moves.push({ cardIndex: index, line, faceUp: false, card });
            });
        });

        // Refresh if hand is low and deck has cards
        if (state[player].deck.length > 0 && hand.length < 5) {
            moves.push({ action: 'refresh' });
        }

        return moves;
    }

    // ── State Transition ──────────────────────────────────────

    _applyMove(state, move, player) {
        const s  = this._cloneState(state);
        const ps = s[player];

        if (move.action === 'refresh') {
            while (ps.hand.length < 5 && ps.deck.length > 0) {
                ps.hand.push(ps.deck.pop());
            }
            return s;
        }

        if (!move.line) return s;

        // Remove card from hand
        let card;
        if (move.cardIndex !== undefined && move.cardIndex < ps.hand.length &&
            ps.hand[move.cardIndex] && ps.hand[move.cardIndex].nombre === move.card.nombre) {
            card = ps.hand.splice(move.cardIndex, 1)[0];
        } else {
            const idx = ps.hand.findIndex(c => c.nombre === move.card.nombre);
            card = idx !== -1 ? ps.hand.splice(idx, 1)[0] : ps.hand.pop();
        }
        if (!card) return s;

        // Place card
        s.field[move.line][player].push({ card, faceDown: !move.faceUp });

        // Simulate card effects for face-up AI cards (same table as minimax)
        if (player === 'ai' && move.faceUp && card.nombre !== '??') {
            this._simulateEffect(s, card, move.line);
        }

        // Auto-compile check (simulation heuristic: compile when eligible)
        if (move.faceUp) {
            const opponent = player === 'ai' ? 'player' : 'ai';
            const myScore  = calculateScore(s, move.line, player);
            const oppScore = calculateScore(s, move.line, opponent);
            if (myScore >= 10 && myScore > oppScore && !s.field[move.line].compiledBy) {
                s.field[move.line].compiledBy = player;
                s[player].compiled.push(move.line);
            }
        }

        return s;
    }

    /**
     * Apply simplified card effects during simulation.
     * Reuses CARD_SIM_EFFECTS defined in ismcts-worker (same table as minimax).
     */
    _simulateEffect(state, card, line) {
        const fx = (typeof CARD_SIM_EFFECTS !== 'undefined') ? CARD_SIM_EFFECTS[card.nombre] : null;
        if (!fx) return;

        if (fx.draw) {
            const n = Math.min(fx.draw, state.ai.deck.length);
            for (let i = 0; i < n; i++) state.ai.hand.push(state.ai.deck.pop());
        }
        if (fx.selfDiscard) {
            const n = Math.min(fx.selfDiscard, state.ai.hand.length);
            for (let i = 0; i < n; i++) {
                const c = state.ai.hand.pop();
                if (c) state.ai.trash.push(c);
            }
        }
        if (fx.opponentDiscard && state.player.hand.length > 0) {
            const minIdx = state.player.hand.reduce(
                (mi, c, j, arr) => c.valor < arr[mi].valor ? j : mi, 0
            );
            const [c] = state.player.hand.splice(minIdx, 1);
            if (c) state.player.trash.push(c);
        }
        if (fx.eliminate) {
            this._simEliminate(state, fx.eliminate, line);
        }
        if (fx.playFromDeck) {
            this._simPlayFromDeck(state, fx.playFromDeck, line);
        }
        if (fx.returnOpponent) {
            this._simReturnHighest(state, 'player');
        }
        if (fx.returnSelf) {
            const stack = state.field[line] && state.field[line].ai;
            if (stack && stack.length > 0) {
                const returned = stack.pop();
                if (returned) state.ai.hand.push(returned.card);
            }
        }
        if (fx.preventCompile) {
            state.player.cannotCompile = true;
        }
        if (fx.flipOpponent) {
            this._simFlipOpponent(state, fx.flipOpponent);
        }
    }

    _simEliminate(state, elim, line) {
        const { strategy, count = 1, maxVal } = elim;
        ISMCTS_LINES.forEach(l => {
            const stack = state.field[l].player;
            if (!stack || stack.length === 0) return;
            if (strategy === 'highest') {
                const visible = stack.filter(c => !c.faceDown);
                if (visible.length > 0) {
                    const top = visible.reduce((a, b) => (b.card.valor || 0) > (a.card.valor || 0) ? b : a);
                    const idx = stack.indexOf(top);
                    if (idx !== -1) stack.splice(idx, 1);
                }
            } else if (strategy === 'faceDown') {
                const fdIdx = stack.findIndex(c => c.faceDown);
                if (fdIdx !== -1) stack.splice(fdIdx, 1);
            } else if (strategy === 'maxVal' && maxVal !== undefined) {
                for (let i = stack.length - 1; i >= 0 && count > 0; i--) {
                    if (!stack[i].faceDown && (stack[i].card.valor || 0) <= maxVal) {
                        stack.splice(i, 1);
                    }
                }
            }
        });
    }

    _simPlayFromDeck(state, fx, line) {
        const n = Math.min(fx.count || 1, state.ai.deck.length);
        const target = ISMCTS_LINES.filter(l => {
            if (state.field[l].compiledBy) return false;
            if (fx.target === 'occupiedLines') return state.field[l].ai.length > 0;
            if (fx.target === 'otherLines') return l !== line;
            return true;
        });
        target.slice(0, n).forEach(l => {
            const c = state.ai.deck.pop();
            if (c) state.field[l].ai.push({ card: c, faceDown: true });
        });
    }

    _simReturnHighest(state, player) {
        let bestLine = null, bestVal = -1, bestIdx = -1;
        ISMCTS_LINES.forEach(l => {
            const stack = state.field[l][player];
            stack.forEach((cardObj, i) => {
                if (!cardObj.faceDown && (cardObj.card.valor || 0) > bestVal) {
                    bestVal  = cardObj.card.valor || 0;
                    bestLine = l;
                    bestIdx  = i;
                }
            });
        });
        if (bestLine !== null && bestIdx !== -1) {
            const [cardObj] = state.field[bestLine][player].splice(bestIdx, 1);
            state[player].hand.push(cardObj.card);
        }
    }

    _simFlipOpponent(state, count) {
        let flipped = 0;
        ISMCTS_LINES.forEach(l => {
            if (flipped >= count) return;
            const stack = state.field[l].player;
            const fdIdx = stack.findIndex(c => !c.faceDown);
            if (fdIdx !== -1) { stack[fdIdx] = { ...stack[fdIdx], faceDown: true }; flipped++; }
        });
    }

    // ── State Clone ───────────────────────────────────────────

    _cloneState(s) {
        const cloneStack = arr => arr.map(o => ({ card: o.card, faceDown: o.faceDown }));
        const cloneLine  = line => ({ ...line, player: cloneStack(line.player), ai: cloneStack(line.ai) });
        return {
            ...s,
            player: { ...s.player, hand: [...s.player.hand], deck: [...s.player.deck],
                      trash: [...s.player.trash], compiled: [...s.player.compiled] },
            ai:     { ...s.ai,     hand: [...s.ai.hand],     deck: [...s.ai.deck],
                      trash: [...s.ai.trash],     compiled: [...s.ai.compiled] },
            field: {
                izquierda: cloneLine(s.field.izquierda),
                centro:    cloneLine(s.field.centro),
                derecha:   cloneLine(s.field.derecha),
            },
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ISMCTS, ISMCTSNode };
}
