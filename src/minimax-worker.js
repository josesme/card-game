'use strict';

// In Web Workers, 'window' is undefined. Alias self so existing scripts work.
self.window = self;

importScripts('score-utils.js', 'ai-evaluator.js', 'minimax.js');

let _evaluator = null;

self.onmessage = function({ data: msg }) {
    if (msg.type === 'init') {
        self.CARD_EFFECTS  = msg.cardEffects;
        self.GLOBAL_CARDS  = msg.globalCards;
        _evaluator = new AIEvaluator({});
        if (msg.profileWeights) Object.assign(_evaluator.weights, msg.profileWeights);
        self.postMessage({ type: 'ready' });
        return;
    }

    if (msg.type === 'findBestMove') {
        const { gameState, possibleMoves, diffDepth, maxDepth, timeBudgetMs } = msg;
        _evaluator.diffDepth = diffDepth;

        const deadline = Date.now() + timeBudgetMs;
        let bestResult = null;

        for (let depth = 1; depth <= maxDepth; depth++) {
            const mm = new MiniMax(_evaluator, depth);
            const result = mm.findBestMove(gameState, possibleMoves);
            if (result && result.bestMove) {
                bestResult = { ...result, depthReached: depth };
            }
            if (Date.now() >= deadline) break;
        }

        self.postMessage({ type: 'result', result: bestResult });
    }
};
