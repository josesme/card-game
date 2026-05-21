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
- Efecto "al jugar" (h_accion): se resuelve una sola vez cuando se juega la carta.
- Efecto "inicio de turno" (h_inicio): se activa CADA inicio de turno mientras la carta esté visible en campo. Es permanente y muy valioso — perder una carta con este efecto es una pérdida de ventaja recurrente.
- Efecto "fin de turno" (h_final): igual que inicio pero al final del turno. También permanente.
- Las cartas del rival con efectos de inicio/fin también se activan cada turno — son amenazas permanentes que conviene eliminar.
`.trim();

// ─── Conocimiento estratégico (secciones 3 y 4 de compile-estrategy-es.md) ────

const STRATEGY_CONTEXT = `
GESTIÓN DE MANO Y REFRESH:
- Con 3 o más cartas en mano, NO hagas refresh. Juega siempre una carta.
- Refresh solo es correcto con 1-2 cartas, o si todas tus cartas requieren un objetivo específico que no existe en el campo actual.
- Hacer jugadas mediocres para vaciar la mano suele ser peor que un refresh anticipado con 1-2 cartas.
- Las cartas 5 reducen en 1 los turnos antes de tener que refrescar. Si tienes pocas cartas y consideras refrescar pronto, un 5 simplifica la decisión.

VALOR DE CARTAS Y COMPILACIÓN:
- Una carta bocarriba con valor 0 NO contribuye a compilar (suma 0 puntos). No la menciones como ventaja para compilar.
- Una carta bocabajo vale siempre 2, independientemente de su valor impreso.
- Para compilar necesitas ≥10 pts en tu lado Y más que el rival. Suma siempre los puntos reales antes de afirmar que una jugada "acerca a compilar".

CARTAS DE ALTO IMPACTO:
- Las cartas con efectos que eliminan múltiples cartas (ej: "elimina 1 carta de cada otra línea") son más valiosas si el rival tiene cartas en varias líneas. Esperar un turno puede doblar su impacto.
- No gastes una carta de eliminación masiva cuando el rival solo tiene cartas en 1 línea, salvo que sea urgente.

PROPIEDAD DE CARTAS EN CAMPO:
- "TUS CARTAS" = las cartas que controlas tú (la IA). Los efectos que "eliminan carta rival" NO pueden apuntar a estas.
- "CARTAS RIVAL" = las cartas del jugador humano. Estas SÍ son objetivo de eliminaciones, volteos y efectos hostiles.
- Nunca uses un efecto de eliminación contra tus propias cartas salvo que el texto diga explícitamente "carta propia".

CARTAS BOCA ABAJO:
- Son herramientas válidas pero no la base de una estrategia competitiva. Son más flexibles (cualquier línea) pero el texto de las cartas face-up es importante.
- No juegues boca abajo sin un plan: cubrirte para activar efectos, stall, forzar un compile del rival, o proteger cartas valiosas.
- Cuándo jugar boca abajo: para alcanzar umbral de compilación, cubrir una carta con bottom command importante, "pasar" el turno sin buenas opciones, o preparar efectos que se activan con cartas boca abajo.
- Una carta boca abajo vale 2.5pts de media. La falta de texto importa más que el impacto en puntos.
`.trim();

// ─── Serialización del estado ─────────────────────────────────────────────────

function _serializarCarta(obj) {
    if (obj.faceDown) return '[?:2pts]';
    const c = obj.card;
    const efectos = [
        c.h_inicio ? `INICIO:${c.h_inicio}` : '',
        c.h_final  ? `FIN:${c.h_final}`     : '',
    ].filter(Boolean).join(', ');
    // h_accion solo aparece cuando se juega, no en campo — no se incluye aquí
    return efectos
        ? `${c.nombre}(${c.valor})[${efectos}]`
        : `${c.nombre}(${c.valor})`;
}

function _serializarCampo(field, calcularPuntos) {
    const lineas = ['izquierda', 'centro', 'derecha'];
    const nombres = { izquierda: 'Izquierda', centro: 'Centro', derecha: 'Derecha' };
    return lineas.map(l => {
        const compiladoPor = field[l].compiledBy;
        if (compiladoPor) return `  ${nombres[l]}: COMPILADA por ${compiladoPor === 'ai' ? 'IA' : 'Jugador'}`;
        const aiPts   = calcularPuntos(l, 'ai');
        const plPts   = calcularPuntos(l, 'player');
        const aiCartas = (field[l].ai     || []).map(_serializarCarta).join(', ') || '—';
        const plCartas = (field[l].player || []).map(_serializarCarta).join(', ') || '—';
        return `  ${nombres[l]}: TUS CARTAS ${aiPts}pts [${aiCartas}] | CARTAS RIVAL ${plPts}pts [${plCartas}]`;
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

// ─── Serialización de jugadas ─────────────────────────────────────────────────

function _serializarJugadas(jugadas) {
    return jugadas.map((j, i) => {
        if (j.action === 'refresh') return `${i}: REFRESH (actualizar mano)`;
        const modo = j.faceUp ? 'BOCARRIBA' : 'BOCABAJO(val:2,sin efecto)';
        let efectoTxt = '';
        if (j.faceUp) {
            const partes = [];
            if (j.card.h_accion) partes.push(`al jugar: ${j.card.h_accion}`);
            if (j.card.h_inicio) partes.push(`inicio de turno (permanente): ${j.card.h_inicio}`);
            if (j.card.h_final)  partes.push(`fin de turno (permanente): ${j.card.h_final}`);
            if (partes.length) efectoTxt = ` | ${partes.join(' / ')}`;
        }
        return `${i}: ${j.card.nombre}(val:${j.card.valor}) en línea ${j.line} ${modo}${efectoTxt}`;
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
CONOCIMIENTO ESTRATÉGICO:
${STRATEGY_CONTEXT}

---
INSTRUCCIÓN: En máximo 3 líneas, identifica la mejor jugada y su motivo. Termina SIEMPRE con:
Jugada: N
(N = número de la jugada elegida. Sin texto después.)`.trim();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { construirPrompt, _serializarJugadas };
}
