'use strict';

/**
 * AI BRAIN — Motor central de decisión de la IA para COMPILE
 *
 * Punto único de entrada: decidir(estadoJuego, jugadasPosibles, nivel)
 *
 * Flujo interno:
 *   1. filtrarYOrdenar  — descarta jugadas malas, prioriza las prometedoras
 *   2. evaluarPosicion  — foto estática del tablero (quién va ganando y por cuánto)
 *   3. simular          — explora el futuro jugando partidas imaginarias
 *   4. elegirJugada     — devuelve la mejor jugada encontrada
 *
 * Convención de puntuación: positivo = bueno para la IA, negativo = bueno para el jugador.
 */

const LINEAS = ['izquierda', 'centro', 'derecha'];

// Tiempo de búsqueda por nivel (ms). A más nivel, más tiempo para explorar.
const TIEMPO_POR_NIVEL = { 1: 300, 2: 500, 3: 1000, 4: 2500, 5: 5000 };

// ─────────────────────────────────────────────────────────────────────────────
// ENTRADA PÚBLICA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Punto de entrada único. Recibe el estado del juego y la lista de jugadas
 * legales precalculadas, devuelve la jugada elegida.
 *
 * @param {object} estadoJuego     - Estado completo del juego
 * @param {Array}  jugadasPosibles - Jugadas legales para la IA este turno
 * @param {number} nivel           - Nivel de dificultad (1-5)
 * @returns {{ cardIndex, line, faceUp } | { action: 'refresh' }}
 */
function decidir(estadoJuego, jugadasPosibles, nivel) {
    if (!jugadasPosibles || jugadasPosibles.length === 0) return null;
    if (jugadasPosibles.length === 1) return jugadasPosibles[0];

    const tiempoMs    = TIEMPO_POR_NIVEL[nivel] ?? 1000;
    const candidatas  = filtrarYOrdenar(jugadasPosibles, estadoJuego, nivel);
    const resultados  = simular(estadoJuego, candidatas, tiempoMs, nivel);
    return elegirJugada(resultados, candidatas);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1 — FILTRAR Y ORDENAR
// "¿Qué jugadas merece la pena explorar y en qué orden?"
//
// Descarta jugadas claramente malas (bocabajo en línea muerta, etc.)
// Ordena las restantes: las más prometedoras primero para que la simulación
// explore mejor en el tiempo disponible.
// ─────────────────────────────────────────────────────────────────────────────

function filtrarYOrdenar(jugadas, estado, nivel) {
    const jugadasValidas = jugadas.filter(j => !_esJugadaClaramenteMala(j, estado));
    if (jugadasValidas.length === 0) return jugadas; // fallback: no filtrar nada

    return [...jugadasValidas].sort((a, b) => {
        return _puntuarJugada(b, estado, nivel) - _puntuarJugada(a, estado, nivel);
    });
}

/**
 * Devuelve true si la jugada es claramente mala y no merece explorarse.
 * Criterio conservador: solo descartar lo obvio.
 */
function _esJugadaClaramenteMala(jugada, estado) {
    if (!jugada.line || !jugada.card) return false;

    // Bocabajo en línea donde la IA ya no puede ganar
    if (!jugada.faceUp && _lineaMuerta(estado, jugada.line, 'ai')) return true;

    return false;
}

/**
 * Puntuación heurística de una jugada para ordenarla.
 * Mayor puntuación = explorar antes.
 */
function _puntuarJugada(jugada, estado, nivel) {
    if (jugada.action === 'refresh') return _puntuarRefresh(estado);

    const { line, card, faceUp } = jugada;
    if (!line || !card) return 0;

    const rival       = 'player';
    const miPuntos    = _puntos(estado, line, 'ai');
    const rivalPuntos = _puntos(estado, line, rival);
    const valor       = card.valor || 0;
    let s = 0;

    // Compilar ahora — máxima prioridad
    if (faceUp && miPuntos + valor >= 10 && miPuntos + valor > rivalPuntos) s += 150;

    // Bloquear compilación inminente del rival
    const rivalCompilados = (estado.player.compiled || []).length;
    if (rivalCompilados >= 2 && rivalPuntos >= 6) s += 180;
    else if (rivalPuntos >= 7) s += 50;

    // Bocarriba es mejor que bocabajo por defecto
    if (faceUp) {
        s += 25;
        if (card.h_accion || card.h_inicio || card.h_final) s += 20; // tiene efecto
    } else {
        s += _puntuarBocabajo(jugada, estado, nivel);
    }

    // Valor de la carta
    s += valor * 5;

    return s;
}

/**
 * Puntuación específica para jugadas bocabajo.
 * Distingue bocabajo con sentido (bloqueo defensivo, carta sacrificable)
 * de bocabajo sin sentido (pérdida de tempo).
 */
function _puntuarBocabajo(jugada, estado, nivel) {
    const { line, card } = jugada;
    const rival       = 'player';
    const rivalPuntos = _puntos(estado, line, rival);
    const miPuntos    = _puntos(estado, line, 'ai');
    const mano        = estado.ai.hand || [];
    const protocolos  = estado.ai.protocols || [];
    let s = 0;

    // Bocabajo defensivo (AI-E15): el rival amenaza compilar OTRA línea
    // → jugar bocabajo en ESA línea como bloqueo, sacrificando una carta menor
    const rivalAmenazaEstaLinea = rivalPuntos >= 6 && rivalPuntos > miPuntos;
    if (rivalAmenazaEstaLinea) {
        s += 30;
        // Bonus si la carta es sacrificable (protocolo ya compilado propio)
        const lineaIdx = protocolos.indexOf(card.protocol);
        const lineaProtocolo = lineaIdx !== -1 ? LINEAS[lineaIdx] : null;
        const lineaYaCompilada = lineaProtocolo &&
            estado.field[lineaProtocolo] &&
            estado.field[lineaProtocolo].compiledBy === 'ai';
        if (lineaYaCompilada) s += 20; // carta de protocolo ya compilado = descartable
        if (card.valor <= 1) s += 15;  // carta de bajo valor = menos coste sacrificarla
        if (!card.h_accion && !card.h_inicio && !card.h_final) s += 10; // sin efecto útil
    }

    // Acumulación silenciosa en línea temprana (ambos con pocos puntos)
    if (miPuntos <= 3 && rivalPuntos <= 3) s += 18;

    // Bocabajo con mano pequeña = preservar tempo
    if (mano.length <= 2) s += 10;

    // Penalización: bocabajo de carta de protocolo propio activo (desperdicia efecto)
    if (protocolos.includes(card.protocol)) {
        s -= mano.length <= 2 ? 5 : 15;
    }

    return s;
}

function _puntuarRefresh(estado) {
    const mano = (estado.ai.hand || []).length;
    if (mano <= 1) return 40;
    if (mano === 2) return 15;
    return -20; // con 3+ cartas, no actualizar
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2 — EVALUAR POSICIÓN
// "¿Quién va ganando ahora mismo y por cuánto?"
//
// Devuelve un número entre -1 (jugador ganando claramente)
// y +1 (IA ganando claramente). 0 = equilibrio.
// ─────────────────────────────────────────────────────────────────────────────

function evaluarPosicion(estado) {
    // Por ahora delega en AIEvaluator existente mientras completamos la migración.
    // Fase 2 reemplazará esta llamada con la implementación propia.
    if (typeof AIEvaluator !== 'undefined') {
        try {
            const ev = new AIEvaluator(estado);
            ev.diffDepth = 5;
            const { total } = ev.evaluateBoard(estado);
            // AIEvaluator devuelve rango aprox [-410, +410] → normalizar a [-1, +1]
            return Math.max(-1, Math.min(1, total / 410));
        } catch (e) { /* cae al fallback */ }
    }
    return _evaluarBasico(estado);
}

/**
 * Evaluación de emergencia sin dependencias externas.
 * Solo mira compilaciones y puntos en líneas.
 */
function _evaluarBasico(estado) {
    const aiComp  = (estado.ai.compiled     || []).length;
    const plComp  = (estado.player.compiled || []).length;
    if (aiComp >= 3) return 1;
    if (plComp >= 3) return -1;

    let puntos = (aiComp - plComp) * 0.3;
    LINEAS.forEach(l => {
        if (estado.field[l].compiledBy === 'ai')     { puntos += 0.15; return; }
        if (estado.field[l].compiledBy === 'player') { puntos -= 0.15; return; }
        const diff = _puntos(estado, l, 'ai') - _puntos(estado, l, 'player');
        puntos += diff / 40;
    });
    return Math.max(-1, Math.min(1, puntos));
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3 — SIMULAR
// "¿Qué pasa si juego esto, y luego el rival juega aquello...?"
//
// Usa ISMCTS si está disponible. En Fase 4 este algoritmo vivirá aquí
// directamente. Por ahora delega para no romper nada.
// ─────────────────────────────────────────────────────────────────────────────

function simular(estado, candidatas, tiempoMs) {
    // Durante la migración (Fases 1-3), ISMCTS sigue siendo el motor.
    // En Fase 4 este bloque se reemplaza con la implementación propia.
    if (typeof ISMCTS !== 'undefined') {
        const motor = new ISMCTS(tiempoMs);
        return motor.findBestMove(estado, candidatas);
    }
    // Fallback: devolver null para que elegirJugada use la primera candidata
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 4 — ELEGIR JUGADA
// "De todo lo que vi, esta es la mejor."
// ─────────────────────────────────────────────────────────────────────────────

function elegirJugada(resultadoSimulacion, candidatas) {
    // Si la simulación encontró un resultado, usarlo
    if (resultadoSimulacion && resultadoSimulacion.bestMove) {
        return resultadoSimulacion.bestMove;
    }
    // Fallback: la primera candidata (ya ordenada por filtrarYOrdenar)
    return candidatas[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// AUXILIARES INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

function _puntos(estado, linea, jugador) {
    return typeof calculateScore === 'function'
        ? calculateScore(estado, linea, jugador)
        : 0;
}

function _lineaMuerta(estado, linea, jugador) {
    if (estado.field[linea].compiledBy) return true;
    const rival    = jugador === 'ai' ? 'player' : 'ai';
    const miScore  = _puntos(estado, linea, jugador);
    const rivScore = _puntos(estado, linea, rival);
    if (rivScore >= 10 && miScore < rivScore) {
        const cartas = (estado[jugador].hand  || []).length +
                       (estado[jugador].deck  || []).length;
        if (cartas === 0) return true;
    }
    return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS (Node.js / tests)
// ─────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        decidir,
        filtrarYOrdenar,
        evaluarPosicion,
        elegirJugada,
        _puntuarJugada,
        _puntuarBocabajo,
        _lineaMuerta,
    };
}
