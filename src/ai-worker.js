'use strict';

// En Web Workers, 'window' es undefined. Alias self para que los scripts existentes funcionen.
self.window = self;

importScripts('score-utils.js', 'ai-evaluator.js', 'minimax.js', 'ismcts.js', 'ai-brain.js');

self.onmessage = function({ data: msg }) {
    if (msg.type === 'init') {
        self.CARD_SIM_EFFECTS = msg.cardEffects;
        self.GLOBAL_CARDS     = msg.globalCards;
        self.postMessage({ type: 'ready' });
        return;
    }

    if (msg.type === 'findBestMove') {
        const { gameState, possibleMoves, nivel } = msg;

        try {
            const jugada = decidir(gameState, possibleMoves, nivel);
            self.postMessage({
                type:   'result',
                result: { bestMove: jugada, depthReached: `AIBrain(nivel${nivel})` }
            });
        } catch (e) {
            self.postMessage({
                type:   'result',
                result: { bestMove: possibleMoves[0], depthReached: 'AIBrain-fallback' }
            });
        }
    }
};
