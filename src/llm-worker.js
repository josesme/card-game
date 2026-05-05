'use strict';

/**
 * llm-worker.js — Web Worker que consulta Ollama para decidir la jugada de la IA.
 *
 * Protocolo de mensajes:
 *   ← { type: 'init', ollamaUrl, model }
 *   ← { type: 'findBestMove', gameState, possibleMoves, nivel, prompt }
 *   → { type: 'result', result: { bestMove, depthReached } }
 *   → { type: 'error', message }
 */

self.window = self; // compatibilidad con scripts que referencian window

importScripts('score-utils.js', 'llm-prompt.js');

let OLLAMA_URL = 'http://localhost:11434';
let MODEL      = 'qwen3:8b';

self.onmessage = async function({ data: msg }) {
    if (msg.type === 'init') {
        if (msg.ollamaUrl) OLLAMA_URL = msg.ollamaUrl;
        if (msg.model)     MODEL      = msg.model;
        self.postMessage({ type: 'ready' });
        return;
    }

    if (msg.type === 'findBestMove') {
        const { gameState, possibleMoves, nivel } = msg;

        if (!possibleMoves || possibleMoves.length === 0) {
            self.postMessage({ type: 'error', message: 'Sin jugadas posibles' });
            return;
        }

        const prompt = construirPrompt(
            gameState,
            possibleMoves,
            (estado, linea, jugador) => {
                // calculateScore viene de score-utils.js importado arriba
                return typeof calculateScore === 'function'
                    ? calculateScore(estado, linea, jugador)
                    : 0;
            }
        );

        try {
            const respuesta = await _consultarOllama(prompt, nivel);
            const jugada    = _parsearRespuesta(respuesta, possibleMoves);

            if (jugada) {
                self.postMessage({
                    type:   'result',
                    result: { bestMove: jugada, depthReached: `LLM(${MODEL})` },
                });
            } else {
                self.postMessage({
                    type:   'error',
                    message: `Respuesta no parseable: "${respuesta}"`,
                });
            }
        } catch (e) {
            self.postMessage({ type: 'error', message: e.message });
        }
    }
};

// ─── Llamada a Ollama ─────────────────────────────────────────────────────────

async function _consultarOllama(prompt, nivel) {
    // Temperatura baja para respuestas consistentes; 0.1 evita aleatoriedad innecesaria
    const temperatura = nivel >= 4 ? 0.05 : 0.15;

    const body = JSON.stringify({
        model:  MODEL,
        prompt: prompt + ' /no_think',
        stream: false,
        options: {
            temperature:  temperatura,
            top_p:        0.9,
            num_predict:  16,
            stop:         ['\n', ' ', '.', ','],
        },
    });

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status} — URL: ${OLLAMA_URL}/api/generate — model: ${MODEL}`);

    const data = await res.json();
    return (data.response || '').trim();
}

// ─── Parseo de respuesta ──────────────────────────────────────────────────────

function _parsearRespuesta(respuesta, jugadas) {
    // Extraer primer número de la respuesta
    const match = respuesta.match(/\d+/);
    if (!match) return null;

    const idx = parseInt(match[0], 10);
    if (idx >= 0 && idx < jugadas.length) return jugadas[idx];

    return null;
}
