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
//
// Componentes con sus pesos según fase de juego:
//   amenazaCompilacion  — quién está más cerca de ganar
//   fuerzaLineas        — ventaja de puntos en cada línea
//   calidadMano         — valor y utilidad de la mano de la IA
//   amenazaRival        — peligro del jugador (recursos + protocolos)
//   sinergias           — combinaciones de protocolos activas (AI-E5)
//   bocabajos           — equilibrio de bocabajos propios y rivales
//   interaccion         — cartas de interacción vs desarrollo (AI-E9)
// ─────────────────────────────────────────────────────────────────────────────

// Protocolos con sinergia de bocabajo conocida
const PROTOCOLOS_BOCABAJO = ['Vida', 'Agua', 'Humo', 'Oscuridad', 'Apatía'];

// Cartas situacionales de bajo valor real (AI-E7)
const CARTAS_DEBILES = new Set([
    'Velocidad 2', 'Velocidad 4', 'Apatía 0', 'Apatía 2',
    'Psique 4', 'Plaga 4', 'Gravedad 4'
]);
const CARTAS_FUERTES = new Set([
    'Fuego 4', 'Agua 3', 'Velocidad 3', 'Psique 1', 'Gravedad 0',
    'Espíritu 3', 'Muerte 5', 'Vida 4'
]);

function evaluarPosicion(estado) {
    const aiComp = (estado.ai.compiled     || []).length;
    const plComp = (estado.player.compiled || []).length;
    if (aiComp >= 3) return  1;
    if (plComp >= 3) return -1;

    const fase = _faseDeJuego(estado);
    const w    = _pesos(fase);

    const amenaza    = _evaluarAmenazaCompilacion(estado, fase);
    const lineas     = _evaluarFuerzaLineas(estado);
    const mano       = _evaluarCalidadMano(estado);
    const rival      = _evaluarAmenazaRival(estado, fase);
    const sinergias  = _evaluarSinergias(estado);         // AI-E5
    const bocabajos  = _evaluarBocabajos(estado);
    const interaccion = _evaluarInteraccion(estado, fase); // AI-E9
    const tempo      = _evaluarTempo(estado);              // AI-E10
    const metaReglas = _evaluarMetaReglas(estado, lineas); // AI-E13

    const total =
        amenaza     * w.amenaza     +
        lineas      * w.lineas      +
        mano        * w.mano        +
        (-rival)    * w.rival       +
        sinergias   * w.sinergias   +
        bocabajos   * w.bocabajos   +
        interaccion * w.interaccion +
        tempo       * w.tempo       +
        metaReglas  * w.metaReglas;

    return Math.max(-1, Math.min(1, total / 100));
}

function _faseDeJuego(estado) {
    const ai = (estado.ai.compiled     || []).length;
    const pl = (estado.player.compiled || []).length;
    if (ai >= 2 || pl >= 2) return 'late';
    if (ai + pl >= 2)       return 'mid';
    return 'early';
}

function _pesos(fase) {
    if (fase === 'late') return {
        amenaza: 45, lineas: 10, mano:  5, rival: 35,
        sinergias: 3, bocabajos: 2, interaccion: 8, tempo: 3, metaReglas: 4
    };
    if (fase === 'mid') return {
        amenaza: 30, lineas: 18, mano: 10, rival: 22,
        sinergias: 6, bocabajos: 5, interaccion: 10, tempo: 6, metaReglas: 5
    };
    return { // early
        amenaza: 20, lineas: 25, mano: 15, rival: 12,
        sinergias: 8, bocabajos: 7, interaccion:  6, tempo: 8, metaReglas: 4
    };
}

// ── Amenaza de compilación ────────────────────────────────────────────────────

function _evaluarAmenazaCompilacion(estado, fase) {
    const aiComp = (estado.ai.compiled     || []).length;
    const plComp = (estado.player.compiled || []).length;
    let s = (aiComp - plComp) * 0.15;

    if (aiComp === 2) s += 0.50;
    if (plComp === 2) s -= 0.75;

    const umbral   = fase === 'late' ? 6 : 7;
    const bonusAI  = fase === 'late' ? 0.55 : fase === 'mid' ? 0.40 : 0.28;
    const penaPlJ  = fase === 'late' ? 0.65 : fase === 'mid' ? 0.50 : 0.28;

    let lineasAI = 0, lineasPl = 0;
    LINEAS.forEach(l => {
        if (estado.field[l].compiledBy) return;
        const ai = _puntos(estado, l, 'ai');
        const pl = _puntos(estado, l, 'player');
        if (ai >= 10 && ai > pl) s += 0.28;
        if (pl >= 10 && pl > ai) s -= 0.28;
        if (ai >= umbral && ai >= pl) lineasAI++;
        if (pl >= umbral && pl >= ai) lineasPl++;
    });

    // Presión multi-línea: amenazar 2+ líneas es casi irreversible
    if (lineasAI >= 2) s += bonusAI * (lineasAI - 1);
    if (lineasPl >= 2) s -= penaPlJ * (lineasPl - 1);

    return Math.max(-1, Math.min(1, s));
}

// ── Fuerza de líneas ──────────────────────────────────────────────────────────

function _evaluarFuerzaLineas(estado) {
    let total = 0;
    LINEAS.forEach(l => {
        if (estado.field[l].compiledBy) return;
        const ai = _puntos(estado, l, 'ai');
        const pl = _puntos(estado, l, 'player');
        const diff = ai - pl;
        const max  = Math.max(ai, pl);
        const peso = max >= 8 ? 1.6 : max >= 5 ? 1.1 : 0.7;
        total += (diff / 20) * peso;
    });
    return Math.max(-1, Math.min(1, total / 3));
}

// ── Calidad de mano (AI-E7) ───────────────────────────────────────────────────

function _evaluarCalidadMano(estado) {
    const mano  = estado.ai.hand  || [];
    const mazo  = estado.ai.deck  || [];
    if (mano.length === 0) return 0;

    let s = 0;
    mano.forEach(c => {
        // AI-E7: distinguir cartas fuertes de situacionales
        if (CARTAS_FUERTES.has(c.nombre)) s += 0.4;
        else if (CARTAS_DEBILES.has(c.nombre)) s += 0.05;
        else s += (c.valor || 0) / 6;

        if (c.h_accion || c.h_inicio || c.h_final) s += 0.15;
    });

    // Cartas de protocolo jugables bocarriba
    const protocolos  = estado.ai.protocols || [];
    const jugablesUp  = mano.filter(c => protocolos.includes(c.protocol)).length;
    s += (jugablesUp / mano.length) * 0.3;

    // Variedad: mezcla de valores altos y bajos es mejor que todo alto o todo bajo
    const altas = mano.filter(c => c.valor >= 4).length;
    const bajas  = mano.filter(c => c.valor <= 1).length;
    if (altas > 0 && bajas > 0) s += 0.15;

    // Acumular muchos 4s es problemático (situacionales, se descartan más)
    const cuatros = mano.filter(c => c.valor === 4).length;
    if (cuatros >= 2) s -= 0.25 * (cuatros - 1) * mano.length;

    // Sin mazo y mano pequeña = recursos críticos
    if (mazo.length === 0 && mano.length <= 2) s -= 0.4;

    return Math.max(0, Math.min(1, s / mano.length));
}

// ── Amenaza del rival ─────────────────────────────────────────────────────────

function _evaluarAmenazaRival(estado, fase) {
    const plComp = (estado.player.compiled || []).length;

    // Match point del rival con línea cerca de cerrar = amenaza máxima
    if (plComp >= 2) {
        const cerca = LINEAS.some(l => {
            if (estado.field[l].compiledBy) return false;
            return _puntos(estado, l, 'player') >= 7;
        });
        if (cerca) return 1.0;
    }

    const mano  = estado.player.hand  || [];
    const mazo  = estado.player.deck  || [];
    const cartas = mano.length + Math.min(mazo.length, 3);

    // Bocabajos ocultos del rival en líneas avanzadas
    let amenazaOculta = 0;
    LINEAS.forEach(l => {
        if (estado.field[l].compiledBy) return;
        const plScore = _puntos(estado, l, 'player');
        const fd = (estado.field[l].player || []).filter(c => c.faceDown).length;
        amenazaOculta += fd * (plScore >= 5 ? 0.1 : 0.04);
    });

    // Peligro por protocolo (protocolos del rival son públicos desde el draft)
    let peligroProtocolo = 0;
    const pp = estado.player.protocols || [];
    const totalCartasRival = LINEAS.reduce((n, l) =>
        n + (estado.field[l].player || []).length, 0);

    if (pp.includes('Gravedad') && pp.includes('Muerte') && totalCartasRival >= 3)
        peligroProtocolo += 0.25;
    else if (pp.includes('Gravedad') && pp.includes('Muerte'))
        peligroProtocolo += 0.12;

    if (pp.includes('Velocidad')) {
        const vel3EnCampo = LINEAS.some(l =>
            (estado.field[l].player || []).some(c =>
                !c.faceDown && c.card && c.card.nombre === 'Velocidad 3'));
        peligroProtocolo += vel3EnCampo ? 0.30 : 0.08;
    }

    if (pp.includes('Psique')) {
        const psique1Bloqueada = LINEAS.some(l => {
            const stack = estado.field[l].player || [];
            const idx   = stack.findIndex(c => !c.faceDown && c.card && c.card.nombre === 'Psique 1');
            return idx !== -1 && idx < stack.length - 1;
        });
        peligroProtocolo += psique1Bloqueada ? 0.35 : 0.06;
    }

    if (pp.includes('Vida')  && pp.includes('Agua'))  peligroProtocolo += 0.10;
    if (pp.includes('Plaga'))                         peligroProtocolo += 0.08;

    // Potencial de compilación
    let potencial = 0;
    LINEAS.forEach(l => {
        if (estado.field[l].compiledBy) return;
        const pl = _puntos(estado, l, 'player');
        const ai = _puntos(estado, l, 'ai');
        if (pl > ai && pl >= 10) potencial += 2;
        else if (pl >= 7)        potencial += 1;
    });

    return Math.min(1, (cartas / 10 + potencial / 4) / 2 + amenazaOculta + peligroProtocolo);
}

// ── Sinergias entre protocolos (AI-E5) ────────────────────────────────────────

function _evaluarSinergias(estado) {
    const pp = estado.ai.protocols || [];
    let s = 0;

    const cartasEnCampo = (jugador) => LINEAS.reduce((acc, l) =>
        acc.concat(estado.field[l][jugador] || []), []);
    const aiCampo = cartasEnCampo('ai');
    const faceUpAI = aiCampo.filter(c => !c.faceDown);

    // Vida + Agua: desarrollo consistente con bocabajos
    if (pp.includes('Vida') && pp.includes('Agua')) {
        const tieneVida = faceUpAI.some(c => c.card && c.card.protocol === 'Vida');
        const tieneAgua = faceUpAI.some(c => c.card && c.card.protocol === 'Agua');
        if (tieneVida && tieneAgua) s += 0.4;
        else if (tieneVida || tieneAgua) s += 0.15;
    }

    // Gravedad + Muerte: combo tablero lleno
    if (pp.includes('Gravedad') && pp.includes('Muerte')) {
        const cartasTotales = aiCampo.length;
        if (cartasTotales >= 4) s += 0.45;
        else if (cartasTotales >= 2) s += 0.20;
    }

    // Velocidad + Fuego: presión rápida
    if (pp.includes('Velocidad') && pp.includes('Fuego')) {
        const vel3 = faceUpAI.some(c => c.card && c.card.nombre === 'Velocidad 3');
        s += vel3 ? 0.35 : 0.10;
    }

    // Espíritu + cualquiera: potencia de mano
    if (pp.includes('Espíritu')) {
        const esp3 = faceUpAI.some(c => c.card && c.card.nombre === 'Espíritu 3');
        s += esp3 ? 0.30 : 0.08;
    }

    // Oscuridad + bocabajos: sinergia pasiva
    if (pp.includes('Oscuridad')) {
        const bocabajos = aiCampo.filter(c => c.faceDown).length;
        s += Math.min(0.3, bocabajos * 0.08);
    }

    return Math.max(-1, Math.min(1, s));
}

// ── Equilibrio de bocabajos ───────────────────────────────────────────────────

function _evaluarBocabajos(estado) {
    const pp = estado.ai.protocols || [];
    const tieneSinergia = pp.some(p => PROTOCOLOS_BOCABAJO.includes(p));
    let s = 0;

    LINEAS.forEach(l => {
        if (estado.field[l].compiledBy) return;
        const aiCartas  = estado.field[l].ai     || [];
        const plCartas  = estado.field[l].player || [];
        const lineaMuertaAI = _lineaMuerta(estado, l, 'ai');

        const aiFD = aiCartas.filter(c =>  c.faceDown).length;
        const aiUP = aiCartas.filter(c => !c.faceDown).length;

        if (aiFD > 0 && lineaMuertaAI) {
            s -= 0.4 * aiFD; // bocabajo en línea muerta = regalo al rival
        } else if (aiFD > 0) {
            s += tieneSinergia ? 0.15 * aiFD : -0.1 * aiFD;
        }

        if (aiUP >= 1) s += 0.15;
        if (aiFD >= 1 && aiUP >= 1 && tieneSinergia) s += 0.1;
        if (aiFD > 0 && aiUP === 0 && !tieneSinergia) s -= 0.25;

        s -= plCartas.filter(c => c.faceDown).length * 0.06;
    });

    return Math.max(-1, Math.min(1, s));
}

// ── Interacción vs desarrollo (AI-E9) ─────────────────────────────────────────

function _evaluarInteraccion(estado, fase) {
    if (fase === 'early') return 0; // en early no tiene sentido forzar interacción
    const mano = estado.ai.hand || [];
    if (mano.length === 0) return 0;

    const amenazaRival = _evaluarAmenazaRival(estado, fase);
    if (amenazaRival < 0.4) return 0; // sin amenaza real, no bonificar interacción

    // Contar cartas de interacción en mano
    const palabrasInteraccion = ['elimina', 'descarta', 'voltea', 'devuelve'];
    const cartasInteraccion = mano.filter(c => {
        const texto = ((c.h_accion || '') + (c.h_inicio || '') + (c.h_final || '')).toLowerCase();
        return palabrasInteraccion.some(p => texto.includes(p));
    }).length;

    // Bonus escalado por amenaza: cuanto más peligroso el rival, más vale interrumpir
    const bonus = (cartasInteraccion / mano.length) * amenazaRival * 0.5;
    return Math.max(0, Math.min(1, bonus));
}

// ── Tempo (AI-E10) ────────────────────────────────────────────────────────────
// Penaliza posiciones que reducen opciones futuras

function _evaluarTempo(estado) {
    const mano = estado.ai.hand || [];
    const mazo = estado.ai.deck || [];
    let s = 0;

    // Sin recursos = sin opciones futuras
    if (mano.length === 0 && mazo.length === 0) return -1;

    // Tener cartas jugables bocarriba = opciones activas
    const pp = estado.ai.protocols || [];
    const jugablesBocarriba = mano.filter(c => pp.includes(c.protocol)).length;
    s += (jugablesBocarriba / Math.max(1, mano.length)) * 0.4;

    // Presencia en las 3 líneas = más opciones que el rival pueda bloquear
    const lineasConCartas = LINEAS.filter(l =>
        !estado.field[l].compiledBy &&
        (estado.field[l].ai || []).length > 0
    ).length;
    if (lineasConCartas === 3) s += 0.4;
    else if (lineasConCartas === 2) s += 0.2;
    else if (lineasConCartas === 0) s -= 0.3;

    return Math.max(-1, Math.min(1, s));
}

// ── Meta-reglas (AI-E13) ──────────────────────────────────────────────────────
// (1) jugada que no mejora nada → penalizar
// (2) posición sin avance en ninguna dimensión → penalizar
// (3) equilibrio muy ajustado → pequeño bonus a quien tiene más cartas

function _evaluarMetaReglas(estado, fuerzaLineas) {
    let s = 0;
    const mano = estado.ai.hand || [];
    const mazo = estado.ai.deck || [];

    // Regla 3: en equilibrio, más recursos = más opciones futuras
    const recursosAI = mano.length + mazo.length;
    const recursosPl = (estado.player.hand || []).length + (estado.player.deck || []).length;
    if (Math.abs(fuerzaLineas) < 0.15) {
        // Posición equilibrada: la ventaja de recursos se amplifica
        s += ((recursosAI - recursosPl) / 20) * 0.3;
    }

    // Regla 2: IA sin cartas en campo en fase media/tardía = desarrollo nulo
    const cartasAIEnCampo = LINEAS.reduce((n, l) =>
        n + (estado.field[l].ai || []).length, 0);
    if (cartasAIEnCampo === 0 && recursosAI < 4) s -= 0.4;

    return Math.max(-1, Math.min(1, s));
}

/**
 * Evaluación de emergencia sin dependencias externas.
 * Solo se usa si evaluarPosicion() falla por algún motivo inesperado.
 */
function _evaluarBasico(estado) {
    const aiComp = (estado.ai.compiled     || []).length;
    const plComp = (estado.player.compiled || []).length;
    if (aiComp >= 3) return  1;
    if (plComp >= 3) return -1;
    let s = (aiComp - plComp) * 0.3;
    LINEAS.forEach(l => {
        if (estado.field[l].compiledBy === 'ai')     { s += 0.15; return; }
        if (estado.field[l].compiledBy === 'player') { s -= 0.15; return; }
        s += (_puntos(estado, l, 'ai') - _puntos(estado, l, 'player')) / 40;
    });
    return Math.max(-1, Math.min(1, s));
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
        _evaluarAmenazaCompilacion,
        _evaluarFuerzaLineas,
        _evaluarCalidadMano,
        _evaluarAmenazaRival,
        _evaluarSinergias,
        _evaluarBocabajos,
        _evaluarInteraccion,
        _evaluarTempo,
        _evaluarMetaReglas,
        _faseDeJuego,
    };
}
