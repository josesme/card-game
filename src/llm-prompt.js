'use strict';

/**
 * llm-prompt.js — Construcción del prompt para el LLM (Ollama / Qwen2.5)
 *
 * Genera un prompt compacto y estructurado con:
 *   1. Rol y tarea
 *   2. Reglas básicas del juego
 *   3. Estado actual de la partida
 *   4. Jugadas posibles numeradas
 *   5. Tips de estrategia relevantes a los protocolos en juego
 */

// ─── Reglas básicas condensadas ───────────────────────────────────────────────

const REGLAS_BASE = `
REGLAS DE COMPILE (resumen):
- Objetivo: compilar tus 3 protocolos antes que el rival.
- Compilar una línea: necesitas valor ≥10 en tu lado Y mayor que el rival.
- Carta boca arriba (face-up): solo en la línea de su protocolo. Vale su valor impreso.
- Carta boca abajo (face-down): en cualquier línea. Vale siempre 2, sin efectos.
- Acción por turno: jugar 1 carta O actualizar mano (refresh hasta 5 cartas).
- Refresh: solo si tienes <5 cartas en mano. Roba del mazo hasta 5.
- Compilación es obligatoria si puedes hacerla.
- Recompilar línea propia ya compilada: roba carta superior del mazo rival.
`.trim();

// ─── Tips por protocolo (extraídos de compile-estrategy-es.md) ───────────────

const STRATEGY_TIPS = {
    'Gravedad': `
GRAVEDAD: Gravity 0 puede valer 4-14pts según retriggers. Gravity 1 y 2 son el núcleo del protocolo.
Funciona mejor con Muerte y Velocidad. Counters: Muerte 2, Agua 3.
`.trim(),

    'Muerte': `
MUERTE: Control reactivo. Flojo en tablero vacío, devastador con objetivos. Muerte 2 es una de las mejores cartas del juego (especialmente contra Gravedad 0).
Ideal con Gravedad. También bueno con Fuego y Espíritu.
`.trim(),

    'Velocidad': `
VELOCIDAD: Velocidad 3 posiblemente la mejor carta del juego (End command da turno extra).
Velocidad 0: juégalo ANTES de activarlo — cúbrelo con otra carta para protegerlo.
Cartas débiles: Velocidad 2 y Velocidad 4. Mejor con Gravedad o Fuego.
Combo clave: Velocidad 0 + Velocidad 3 en End step activa Velocidad 0 → juegas carta extra.
`.trim(),

    'Vida': `
VIDA: Sólido y versátil. Vida 0 muy fuerte (hasta 6pts distribuidos + denegar control).
Sinergiza fuerte con Agua (combo de desarrollo más citado). Vida 3 y 4 quieren estar en posiciones concretas de la pila.
`.trim(),

    'Fuego': `
FUEGO: Muy bueno e infravalorado. Fuego 3 es uno de los mejores 3s del juego.
Fuego 0: 2 flips + draw, fiable. Fuego 4: excelente (+1 carta Y descarta cartas malas).
Fuego 2 y 5 son más débiles. Excelente para ciclar cartas malas. Soporta Velocidad y Espíritu.
`.trim(),

    'Agua': `
AGUA: Agua 3 considerada de las mejores cartas del juego. Agua 1 y 3 son la razón principal para pickear Agua.
Agua 4 devuelve Fuego 0 → Fuego 0 reactiva (combo de draw masivo).
Combo Life+Water: el combo de desarrollo más citado. Muy difícil de agotar.
`.trim(),

    'Oscuridad': `
OSCURIDAD: Oscuridad 2 cambia el valor de cartas boca abajo a 4 (en vez de 2). Muy flexible.
No es solo Oscuridad 2: D0, D1, D4 dan control de oponente. D3 da soporte.
Combina bien con Vida, cartas boca abajo valiosas.
`.trim(),

    'Espíritu': `
ESPÍRITU: Espíritu 3 es la pieza clave — permite mover cartas entre líneas, ignorar restricciones de protocolo.
Espíritu 1 permite jugar cualquier carta en la línea de Velocidad 0 / Gravedad 0.
Combina con Fuego 0 (draw controlado) y Gravedad (potencia masiva).
`.trim(),

    'Luz': `
LUZ: Protocolo de información y draw. Luz 4 revela mano rival — información muy valiosa para anticipar jugadas.
Luz 3 da draw consistente. Bueno con protocolos reactivos que necesitan saber qué hay en campo.
`.trim(),

    'Metal': `
METAL: Metal 3 hace un board nuke (borra múltiples cartas). Necesita estar en la línea correcta — Espíritu 1 ayuda a posicionarlo.
Sinergiza con Vida + Espíritu para borrado masivo. Metal 0 y Metal 2 dan control de cartas rivales.
`.trim(),

    'Psique': `
PSIQUE: Psique 1 cubierta es una bomba — cuando se activa puede ser determinante.
El combo Psique 1 bloqueado bajo otras cartas es el setup más peligroso del juego.
Psique 5 es fuerte (el protocolo ya tiene mucho draw). Psique 4 muy situacional.
`.trim(),

    'Apatía': `
APATÍA: Protocolo de disrupción y control de tempo. Apatía 0 y 2 son situacionales.
Apatía 3 y 4 dan control de turno. Funciona como soporte defensivo cuando el rival está cerca de compilar.
`.trim(),

    'Plaga': `
PLAGA: Motor de descarte forzado al rival. Muy efectivo con Corrupción.
Con Miedo o Tiempo como tercer protocolo puede agotar recursos del rival consistentemente.
`.trim(),

    'Odio': `
ODIO: Odio 3 tiene Top command permanente: "al borrar una carta, roba 1".
Con protocolos que borran mucho (Muerte, Metal, Gravedad) genera ventaja de mano sostenida.
`.trim(),

    'Amor': `
AMOR: Protocolo de puntos altos y soporte. Amor 4 y 5 dan puntos masivos con condiciones.
Necesita un tablero estable para brillar. Bueno para cerrar líneas rápido en late game.
`.trim(),
};

// Secciones generales siempre incluidas (condensadas)
const STRATEGY_GENERAL = `
ESTRATEGIA GENERAL:
- Early: monta combos y prepara late game. Mid: lucha por el Control si puedes. Late: Control es el objetivo principal.
- Una carta boca abajo vale ~2.5pts de media (vs 4-4.5 de media bocarriba). La falta de efecto importa más que el punto menos.
- Refresh es válido cuando tienes mano llena de cartas reactivas/situacionales. No refresques con mano jugable.
- Cuando la IA tiene 2 compiles y el rival también: compilar el tercero es la prioridad absoluta — no hay tiempo para desarrollo.
- Bloquear una línea rival cerca de compilar (≥7pts) es urgente aunque cueste tempo.
`.trim();

// ─── Serialización del estado ─────────────────────────────────────────────────

function _serializarCampo(field, calcularPuntos) {
    const lineas = ['izquierda', 'centro', 'derecha'];
    const nombres = { izquierda: 'Izquierda', centro: 'Centro', derecha: 'Derecha' };
    return lineas.map(l => {
        const compiladoPor = field[l].compiledBy;
        if (compiladoPor) return `  ${nombres[l]}: COMPILADA por ${compiladoPor === 'ai' ? 'IA' : 'Jugador'}`;
        const aiPts  = calcularPuntos(l, 'ai');
        const plPts  = calcularPuntos(l, 'player');
        const aiCartas = (field[l].ai || []).map(c =>
            c.faceDown ? `[?:2pts]` : `${c.card.nombre}(${c.card.valor})`
        ).join(', ') || '—';
        const plCartas = (field[l].player || []).map(c =>
            c.faceDown ? `[?:2pts]` : `${c.card.nombre}(${c.card.valor})`
        ).join(', ') || '—';
        return `  ${nombres[l]}: IA ${aiPts}pts [${aiCartas}] | Rival ${plPts}pts [${plCartas}]`;
    }).join('\n');
}

function _serializarMano(hand) {
    if (!hand || hand.length === 0) return '(vacía)';
    return hand.map(c => `${c.nombre}(val:${c.valor}, proto:${c.protocol})`).join(', ');
}

function _serializarDescarte(trash, limite = 5) {
    if (!trash || trash.length === 0) return '(ninguna)';
    return trash.slice(-limite).map(c => `${c.nombre}`).join(', ');
}

function _tipsProtocolos(protocolosIA, protocolosRival) {
    const todos = new Set([...protocolosIA, ...protocolosRival]);
    const tips = [];
    todos.forEach(p => {
        if (STRATEGY_TIPS[p]) tips.push(STRATEGY_TIPS[p]);
    });
    return tips.join('\n\n');
}

// ─── Serialización de jugadas ─────────────────────────────────────────────────

function _serializarJugadas(jugadas) {
    return jugadas.map((j, i) => {
        if (j.action === 'refresh') return `${i}: REFRESH (actualizar mano)`;
        const modo = j.faceUp ? 'BOCARRIBA' : 'BOCABAJO(val:2,sin efecto)';
        const efecto = j.faceUp && (j.card.h_accion || j.card.h_inicio || j.card.h_final)
            ? ` | Efecto: ${[j.card.h_accion, j.card.h_inicio, j.card.h_final].filter(Boolean).join(' / ')}`
            : '';
        return `${i}: ${j.card.nombre}(val:${j.card.valor}) en línea ${j.line} ${modo}${efecto}`;
    }).join('\n');
}

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Construye el prompt completo para el LLM.
 * @param {object} estado       - gameState
 * @param {Array}  jugadas      - possibleMoves (ya filtradas y ordenadas por ai-brain)
 * @param {Function} calcScore  - calculateScore(estado, linea, jugador)
 * @returns {string}
 */
function construirPrompt(estado, jugadas, calcScore) {
    const aiComp  = (estado.ai.compiled     || []).length;
    const plComp  = (estado.player.compiled || []).length;
    const aiProts = estado.ai.protocols     || [];
    const plProts = estado.player.protocols || [];

    const calcularPuntos = (linea, jugador) => calcScore(estado, linea, jugador);

    const campo     = _serializarCampo(estado.field, calcularPuntos);
    const mano      = _serializarMano(estado.ai.hand);
    const descarte  = _serializarDescarte(estado.player.trash);
    const jugadasTx = _serializarJugadas(jugadas);
    const tips      = _tipsProtocolos(aiProts, plProts);

    return `Eres la IA de un juego de cartas llamado COMPILE. Debes elegir la mejor jugada.

${REGLAS_BASE}

---
ESTADO ACTUAL:
- Protocolos IA: ${aiProts.join(', ')} (${aiComp} compilados)
- Protocolos Rival: ${plProts.join(', ')} (${plComp} compilados)
- Mano IA: ${mano}
- Mazo IA: ${(estado.ai.deck || []).length} cartas | Descarte IA: ${(estado.ai.trash || []).length} cartas
- Mazo Rival: ${(estado.player.deck || []).length} cartas | Últimas cartas descartadas por rival: ${descarte}

CAMPO (izquierda=protocolo[0], centro=protocolo[1], derecha=protocolo[2]):
${campo}

---
JUGADAS POSIBLES (elige UNA por su número):
${jugadasTx}

---
CONOCIMIENTO ESTRATÉGICO RELEVANTE:
${STRATEGY_GENERAL}

${tips}

---
INSTRUCCIÓN: Responde ÚNICAMENTE con el número de la jugada elegida (0, 1, 2...). Nada más. Sin explicación.
Número:`.trim();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { construirPrompt, _serializarJugadas };
}
