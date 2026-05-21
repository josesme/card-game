'use strict';

/**
 * llm-worker.js — Web Worker que consulta un LLM para decidir la jugada de la IA.
 *
 * Soporta dos backends:
 *   - 'ollama'   : Ollama local (http://localhost:11434)
 *   - 'deepseek' : DeepSeek API (https://api.deepseek.com)
 *
 * Protocolo de mensajes:
 *   ← { type: 'init', backend, apiKey, model, ollamaUrl }
 *   ← { type: 'findBestMove', gameState, possibleMoves, nivel }
 *   → { type: 'result', result: { bestMove, depthReached } }
 *   → { type: 'error', message }
 */

self.window = self; // compatibilidad con scripts que referencian window

importScripts('score-utils.js', 'llm-prompt.js');

let BACKEND    = 'ollama';
let OLLAMA_URL = 'http://localhost:11434';
let MODEL      = 'qwen3:8b';
let API_KEY    = '';

self.onmessage = async function({ data: msg }) {
    if (msg.type === 'init') {
        if (msg.backend)   BACKEND    = msg.backend;
        if (msg.ollamaUrl) OLLAMA_URL = msg.ollamaUrl;
        if (msg.model)     MODEL      = msg.model;
        if (msg.apiKey)    API_KEY    = msg.apiKey;
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
                return typeof calculateScore === 'function'
                    ? calculateScore(estado, linea, jugador)
                    : 0;
            }
        );

        try {
            const respuesta = BACKEND === 'deepseek'
                ? await _consultarDeepSeek(prompt, nivel)
                : await _consultarOllama(prompt, nivel);

            const jugada = _parsearRespuesta(respuesta, possibleMoves);

            if (jugada) {
                self.postMessage({
                    type:   'result',
                    result: { bestMove: jugada, depthReached: `LLM(${MODEL})` },
                });
            } else {
                self.postMessage({
                    type:    'error',
                    message: `Respuesta no parseable: "${respuesta}"`,
                });
            }
        } catch (e) {
            self.postMessage({ type: 'error', message: e.message });
        }
    }
};

// ─── Backend: Ollama ──────────────────────────────────────────────────────────

async function _consultarOllama(prompt, nivel) {
    const temperatura = nivel >= 4 ? 0.05 : 0.15;

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model:    MODEL,
            messages: [{ role: 'user', content: prompt }],
            stream:   false,
            think:    false,
            options: {
                temperature: temperatura,
                top_p:       0.9,
                num_predict: 4,
            },
        }),
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    return (data.message?.content || '').trim();
}

// ─── Backend: DeepSeek API ────────────────────────────────────────────────────

async function _consultarDeepSeek(prompt, nivel) {
    const temperatura = nivel >= 4 ? 0.0 : 0.1;

    const res = await fetch('https://api.deepseek.com/chat/completions', {
        method:  'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model:       MODEL,
            messages:    [{ role: 'user', content: prompt }],
            max_tokens:  512,
            temperature: temperatura,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`DeepSeek HTTP ${res.status}: ${err}`);
    }

    const data = await res.json();
    // deepseek-reasoner devuelve reasoning_content + content; usamos content
    const msg = data.choices?.[0]?.message;
    console.log('[DeepSeek] raw response:', JSON.stringify({ content: msg?.content, reasoning: msg?.reasoning_content?.slice(0, 200) }));
    // Algunos modelos meten el número en reasoning_content cuando content queda vacío
    const content = (msg?.content || msg?.reasoning_content || '').trim();
    return content;
}

// ─── Parseo de respuesta ──────────────────────────────────────────────────────

function _parsearRespuesta(respuesta, jugadas) {
    // Buscar patrón explícito de conclusión primero (jugada N, move N, elijo N, etc.)
    const conclusionMatch = respuesta.match(/(?:jugada|move|elijo|choose|opción|option|número|number)[^\d]*(\d+)/i);
    if (conclusionMatch) {
        const idx = parseInt(conclusionMatch[1], 10);
        if (idx >= 0 && idx < jugadas.length) return jugadas[idx];
    }

    // Si no hay patrón explícito, tomar el último número del texto
    // (el reasoning termina con la conclusión — el último número es la jugada)
    const allMatches = [...respuesta.matchAll(/\d+/g)];
    for (let i = allMatches.length - 1; i >= 0; i--) {
        const idx = parseInt(allMatches[i][0], 10);
        if (idx >= 0 && idx < jugadas.length) return jugadas[idx];
    }

    return null;
}
