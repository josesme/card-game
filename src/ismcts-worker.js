'use strict';

// In Web Workers, 'window' is undefined. Alias self so existing scripts work.
self.window = self;

importScripts('score-utils.js', 'minimax.js', 'ismcts.js');

self.onmessage = function ({ data: msg }) {
    if (msg.type === 'init') {
        self.CARD_EFFECTS  = msg.cardEffects;
        self.GLOBAL_CARDS  = msg.globalCards;
        self.postMessage({ type: 'ready' });
        return;
    }

    if (msg.type === 'findBestMove') {
        const { gameState, possibleMoves, diffDepth, timeBudgetMs } = msg;

        const ismcts = new ISMCTS(timeBudgetMs);
        const result = ismcts.findBestMove(gameState, possibleMoves);

        if (result && result.bestMove) {
            self.postMessage({
                type: 'result',
                result: {
                    bestMove:     result.bestMove,
                    depthReached: `ISMCTS(${result.iterations}it)`,
                    score:        result.score,
                },
            });
        } else {
            // Fallback: first available move
            self.postMessage({
                type: 'result',
                result: {
                    bestMove:     possibleMoves[0],
                    depthReached: 'ISMCTS-fallback',
                    score:        0,
                },
            });
        }
    }
};
