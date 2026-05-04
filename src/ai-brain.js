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

    // AI-E12: contraestrategia activa — detectar setups peligrosos del rival
    s += _bonusContraestrategia(jugada, estado);

    // Bocarriba es mejor que bocabajo por defecto
    if (faceUp) {
        s += 25;
        if (card.h_accion || card.h_inicio || card.h_final) s += 20; // tiene efecto
        // AI-E14: comportamiento específico por protocolo propio
        s += _bonusProtocoloEspecifico(jugada, estado);
    } else {
        s += _puntuarBocabajo(jugada, estado, nivel);
    }

    // Valor de la carta
    s += valor * 5;

    return s;
}

/**
 * AI-E12 — Contraestrategia activa.
 * Detecta setups peligrosos del rival en campo y bonifica cartas de interacción
 * que los interrumpan, priorizando sobre el desarrollo propio.
 */
function _bonusContraestrategia(jugada, estado) {
    const { card, faceUp } = jugada;
    if (!faceUp || !card) return 0;

    const pp = estado.player.protocols || [];
    const texto = ((card.h_accion || '') + (card.h_inicio || '') + (card.h_final || '')).toLowerCase();
    const esInteraccion = ['elimina', 'descarta', 'voltea', 'devuelve'].some(p => texto.includes(p));
    let bonus = 0;

    // Setup peligroso 1: Psique 1 bloqueada (cubierta = intocable hasta que salga)
    const psique1Bloqueada = pp.includes('Psique') && LINEAS.some(l => {
        const stack = estado.field[l].player || [];
        const idx   = stack.findIndex(c => !c.faceDown && c.card && c.card.nombre === 'Psique 1');
        return idx !== -1 && idx < stack.length - 1;
    });
    if (psique1Bloqueada && esInteraccion) bonus += 60;

    // Setup peligroso 2: Velocidad 3 activa (da segundo turno — extremadamente fuerte)
    const vel3Activa = pp.includes('Velocidad') && LINEAS.some(l =>
        (estado.field[l].player || []).some(c => !c.faceDown && c.card && c.card.nombre === 'Velocidad 3'));
    if (vel3Activa && esInteraccion) bonus += 70;
    if (vel3Activa && !esInteraccion) bonus -= 15; // cualquier jugada no-interacción pierde valor si hay Vel3 activa

    // Setup peligroso 3: Gravedad 0 jugado con tablero lleno del rival (retriggering)
    const grav0Activa = pp.includes('Gravedad') && LINEAS.some(l =>
        (estado.field[l].player || []).some(c => !c.faceDown && c.card && c.card.nombre === 'Gravedad 0'));
    const tableroRivalLleno = LINEAS.reduce((n, l) =>
        n + (estado.field[l].player || []).length, 0) >= 4;
    if (grav0Activa && tableroRivalLleno && esInteraccion) bonus += 55;

    return bonus;
}

/**
 * AI-E14 — Comportamiento específico por protocolo propio.
 * Aplica bonificaciones o penalizaciones según condiciones del estado
 * para cartas que necesitan contexto para ser fuertes.
 */
function _bonusProtocoloEspecifico(jugada, estado) {
    const { card } = jugada;
    if (!card) return 0;

    const mano = estado.ai.hand || [];
    const pp   = estado.ai.protocols || [];
    let bonus  = 0;

    // Velocidad 0: no debe jugarse si no hay Velocidad 3 en mano o campo
    if (card.nombre === 'Velocidad 0') {
        const vel3EnMano  = mano.some(c => c.nombre === 'Velocidad 3');
        const vel3EnCampo = LINEAS.some(l =>
            (estado.field[l].ai || []).some(c => !c.faceDown && c.card && c.card.nombre === 'Velocidad 3'));
        if (!vel3EnMano && !vel3EnCampo) bonus -= 40;
    }

    // Espíritu 3: vale mucho — protegerlo (prefiero no jugarlo bocabajo; bonificar bocarriba)
    if (card.nombre === 'Espíritu 3') bonus += 30;

    // Gravedad 0: máximo valor con tablero propio lleno (retriggering)
    if (card.nombre === 'Gravedad 0') {
        const cartasAI = LINEAS.reduce((n, l) => n + (estado.field[l].ai || []).length, 0);
        if (cartasAI >= 4) bonus += 50;
        else if (cartasAI >= 2) bonus += 20;
    }

    // Muerte 5 en mano con tablero rival vacío: vale mucho menos (no hay objetivos)
    if (card.nombre === 'Muerte 5' && card.protocol === 'Muerte') {
        const cartasRival = LINEAS.reduce((n, l) => n + (estado.field[l].player || []).length, 0);
        if (cartasRival === 0) bonus -= 25;
    }

    // Psique 1: altísimo valor si puede quedar bloqueada
    if (card.nombre === 'Psique 1') {
        const linea = pp.indexOf('Psique') !== -1 ? LINEAS[pp.indexOf('Psique')] : null;
        if (linea) {
            const stack = estado.field[linea].ai || [];
            if (stack.length >= 1) bonus += 35; // hay cartas que la cubrirán
        }
    }

    return bonus;
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

    // Rival amenaza compilar OTRA línea → bocabajo en ESTA línea = bloqueo urgente
    const rivalAmenazaOtraLinea = LINEAS.some(l => {
        if (l === line || estado.field[l].compiledBy) return false;
        return _puntos(estado, l, 'player') >= 7;
    });
    if (rivalAmenazaOtraLinea) s += 12;

    // Bocabajo con mano pequeña = preservar tempo
    if (mano.length <= 2) s += 10;

    // Combo bocabajo + voltear posterior: carta de valor alto + hay carta de volteo en mano
    if ((card.valor || 0) >= 4) {
        const tieneVolteo = mano.some(c => {
            if (!c.h_accion || c === card) return false;
            const txt = c.h_accion.toLowerCase();
            if (!txt.includes('voltea')) return false;
            const flipProtoIdx = protocolos.indexOf(c.protocol);
            return flipProtoIdx !== -1 && LINEAS[flipProtoIdx] !== line;
        });
        if (tieneVolteo) s += 22;
    }

    // Penalización: bocabajo de carta de protocolo propio activo (desperdicia efecto)
    if (protocolos.includes(card.protocol)) {
        s -= mano.length <= 2 ? 5 : 15;
    }

    return s;
}

// AI-E4 — Refresh timing: evalúa jugabilidad de la mano, no solo tamaño
function _puntuarRefresh(estado) {
    const mano = estado.ai.hand || [];
    const mazo = estado.ai.deck || [];
    if (mazo.length === 0) return -50; // mazo vacío: refresh no da nada útil

    const n = mano.length;
    if (n <= 1) return 40;
    if (n === 2) return 15;

    // Con 3+ cartas: solo vale la pena si la mano tiene mayoría de cartas difíciles de jugar
    if (n >= 3) {
        const pp = estado.ai.protocols || [];
        // Contar cartas situacionales: valor 4, sin protocolo propio, o en CARTAS_DEBILES
        const situacionales = mano.filter(c =>
            !pp.includes(c.protocol) ||
            CARTAS_DEBILES.has(c.nombre) ||
            (c.valor === 4 && !c.h_accion && !c.h_inicio && !c.h_final)
        ).length;
        if (situacionales >= Math.ceil(n * 0.6)) return 10; // mayoría situacional → refresh puede valer
        return -20; // mano jugable: no desperdiciar tempo en refresh
    }

    return -20;
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
// PASO 3 — SIMULAR (ISMCTS propio)
// "¿Qué pasa si juego esto, y luego el rival juega aquello...?"
//
// Information Set MCTS: en cada iteración se "determiniza" la mano oculta del
// jugador muestreando cartas plausibles, luego se corre MCTS normal sobre ese
// mundo determinado. Los nodos acumulan estadísticas de todas las
// determinizaciones en que son alcanzables.
//
// Mejoras sobre el ISMCTS heredado:
//   1. Rival simulado con misma heurística que la IA (no random)
//   2. _evaluarHoja usa evaluarPosicion() del cerebro en vez de AIEvaluator
//   3. Rollout depth 6 para niveles 4-5 (más lectura de partida)
// ─────────────────────────────────────────────────────────────────────────────

const UCB_C        = 0.7;
const ROLLOUT_BASE = 4; // plies por defecto; escala con nivel en simular()

// ── Nodo MCTS ────────────────────────────────────────────────────────────────

function _crearNodo(movimiento, padre, jugador) {
    return {
        movimiento, padre, jugador,
        hijos:          [],
        visitas:        0,
        ganancias:      0.0,
        disponibilidades: 0,
    };
}

function _ucb(nodo, disponibilidadPadre) {
    if (nodo.visitas === 0) return Infinity;
    return nodo.ganancias / nodo.visitas +
           UCB_C * Math.sqrt(Math.log(disponibilidadPadre || 1) / nodo.visitas);
}

function _hijoParaMovimiento(nodo, mov) {
    return nodo.hijos.find(h => _movimientosIguales(h.movimiento, mov)) || null;
}

function _movimientosIguales(a, b) {
    if (!a || !b) return false;
    if (a.action && b.action) return a.action === b.action;
    if (!a.card || !b.card)   return false;
    return a.line === b.line && a.faceUp === b.faceUp &&
           a.card.nombre === b.card.nombre;
}

// ── Entrada pública del motor ────────────────────────────────────────────────

function simular(estado, candidatas, tiempoMs, nivel) {
    if (!candidatas || candidatas.length === 0) return null;
    if (candidatas.length === 1) return { bestMove: candidatas[0] };

    const deadline     = Date.now() + tiempoMs;
    const rolloutDepth = (nivel >= 4) ? 6 : ROLLOUT_BASE;
    const raiz         = _crearNodo(null, null, null);
    let iteraciones    = 0;

    while (Date.now() < deadline) {
        // 1. Determinizar: mano oculta del jugador → muestra plausible
        const det = _determinizar(estado);

        // 2-5. Selección → Expansión → Rollout → Backprop
        const { nodo, estadoNodo } = _seleccionar(raiz, det, candidatas);
        const resultado = _rollout(estadoNodo, 'player', rolloutDepth);
        _backpropagar(nodo, resultado);
        iteraciones++;
    }

    if (raiz.hijos.length === 0) return { bestMove: candidatas[0] };

    // Hijo robusto: el más visitado (más estable que mayor win rate)
    const mejor = raiz.hijos.reduce((a, b) => a.visitas > b.visitas ? a : b);
    return {
        bestMove:   mejor.movimiento,
        score:      Math.round((mejor.visitas > 0 ? mejor.ganancias / mejor.visitas : 0.5) * 100),
        iteraciones,
    };
}

// ── Determinización ──────────────────────────────────────────────────────────

function _determinizar(estado) {
    const pool = _construirPool(estado);
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const tamMano    = (estado.player.hand || []).length;
    const det        = _clonarEstado(estado);
    det.player.hand  = pool.slice(0, tamMano);
    det.player.deck  = pool.slice(tamMano);
    return det;
}

function _construirPool(estado) {
    const pool      = [];
    const protocolos = estado.player.protocols || [];
    protocolos.forEach(proto => {
        const cartas = (typeof GLOBAL_CARDS !== 'undefined' && GLOBAL_CARDS[proto]) || [];
        cartas.forEach(c => pool.push({ ...c }));
    });
    // Quitar cartas ya visibles en campo
    LINEAS.forEach(linea => {
        (estado.field[linea].player || []).forEach(obj => {
            if (!obj.faceDown) {
                const idx = pool.findIndex(c => c.nombre === obj.card.nombre);
                if (idx !== -1) pool.splice(idx, 1);
            }
        });
    });
    // Quitar descartes (público)
    (estado.player.trash || []).forEach(c => {
        const idx = pool.findIndex(p => p.nombre === c.nombre);
        if (idx !== -1) pool.splice(idx, 1);
    });
    // Quitar cartas reveladas (ej: Luz 4)
    (estado.revealedPlayerCards || []).forEach(c => {
        const idx = pool.findIndex(p => p.nombre === (c.nombre || c.name));
        if (idx !== -1) pool.splice(idx, 1);
    });
    return pool;
}

// ── Selección + Expansión ────────────────────────────────────────────────────

function _seleccionar(raiz, det, movimientosRaiz) {
    let nodo  = raiz;
    let estadoNodo = det;
    let jugador    = 'ai';
    let movimientosLegales = movimientosRaiz;

    while (true) {
        if (_esTerminal(estadoNodo)) return { nodo, estadoNodo };

        movimientosLegales.forEach(m => {
            const hijo = _hijoParaMovimiento(nodo, m);
            if (hijo) hijo.disponibilidades++;
        });

        const sinExpandir = movimientosLegales.filter(m => !_hijoParaMovimiento(nodo, m));

        if (sinExpandir.length > 0) {
            const mov    = sinExpandir[Math.floor(Math.random() * sinExpandir.length)];
            const hijo   = _crearNodo(mov, nodo, jugador);
            hijo.disponibilidades = 1;
            nodo.hijos.push(hijo);
            return { nodo: hijo, estadoNodo: _aplicarMovimiento(estadoNodo, mov, jugador) };
        }

        // Todos expandidos → elegir por UCB
        const disponibles = nodo.hijos.filter(h =>
            movimientosLegales.some(m => _movimientosIguales(h.movimiento, m))
        );
        if (disponibles.length === 0) return { nodo, estadoNodo };

        const mejor = disponibles.reduce((a, b) => {
            const ua = a.ganancias / (a.visitas || 1) +
                       UCB_C * Math.sqrt(Math.log(a.disponibilidades || 1) / (a.visitas || 1));
            const ub = b.ganancias / (b.visitas || 1) +
                       UCB_C * Math.sqrt(Math.log(b.disponibilidades || 1) / (b.visitas || 1));
            return ua > ub ? a : b;
        });

        estadoNodo = _aplicarMovimiento(estadoNodo, mejor.movimiento, jugador);
        nodo       = mejor;
        jugador    = jugador === 'ai' ? 'player' : 'ai';
        movimientosLegales = _generarMovimientos(estadoNodo, jugador);
    }
}

// ── Rollout ───────────────────────────────────────────────────────────────────

function _rollout(estadoInicial, jugadorActual, profundidad) {
    let s       = _clonarEstado(estadoInicial);
    let jugador = jugadorActual;
    let depth   = 0;

    while (!_esTerminal(s) && depth < profundidad) {
        const movs = _generarMovimientos(s, jugador);
        if (movs.length === 0) break;
        // FIX 1: ambos jugadores usan heurística (no random)
        const mov = _politicaRollout(s, movs, jugador);
        s       = _aplicarMovimiento(s, mov, jugador);
        jugador = jugador === 'ai' ? 'player' : 'ai';
        depth++;
    }

    return _evaluarHoja(s);
}

// Heurística de rollout: compile > bloquear > mejor carta bocarriba > bocabajo
// Se aplica igual para IA Y jugador (elimina asimetría anterior)
function _politicaRollout(estado, movimientos, jugador) {
    const oponente = jugador === 'ai' ? 'player' : 'ai';

    // 1. Compilar si es posible
    const compila = movimientos.find(m => {
        if (!m.line || !m.card) return false;
        if (estado.field[m.line].compiledBy) return false;
        const mio  = _puntos(estado, m.line, jugador);
        const ellos = _puntos(estado, m.line, oponente);
        const val  = m.faceUp ? (m.card.valor || 0) : 2;
        return mio + val >= 10 && mio + val > ellos;
    });
    if (compila) return compila;

    // 2. Bloquear compilación inminente del oponente
    const bloquea = movimientos.find(m => {
        if (!m.line || !m.card) return false;
        if (estado.field[m.line].compiledBy) return false;
        return _puntos(estado, m.line, oponente) >= 7;
    });
    if (bloquea) return bloquea;

    // 3. Mejor carta bocarriba en línea ganadora (no muerta)
    const bocarriba = movimientos.filter(m => m.line && m.faceUp && m.card &&
        !estado.field[m.line].compiledBy && !_lineaMuerta(estado, m.line, jugador));
    if (bocarriba.length > 0) {
        return bocarriba.reduce((mejor, m) => {
            const ventajaMejor = _puntos(estado, mejor.line, jugador) - _puntos(estado, mejor.line, oponente);
            const ventajaM     = _puntos(estado, m.line, jugador) - _puntos(estado, m.line, oponente);
            const puntosMejor  = ventajaMejor + (mejor.card.valor || 0);
            const puntosM      = ventajaM     + (m.card.valor || 0);
            return puntosM > puntosMejor ? m : mejor;
        });
    }

    // 4. Bocabajo en cualquier línea no muerta
    const bocabajo = movimientos.filter(m => m.line && !m.faceUp && m.card &&
        !estado.field[m.line].compiledBy && !_lineaMuerta(estado, m.line, jugador));
    if (bocabajo.length > 0) {
        return bocabajo.reduce((a, b) => (b.card.valor || 0) > (a.card.valor || 0) ? b : a);
    }

    return movimientos[0];
}

// ── Evaluación de hoja (FIX 2) ───────────────────────────────────────────────

function _evaluarHoja(estado) {
    const aiComp = (estado.ai.compiled     || []).length;
    const plComp = (estado.player.compiled || []).length;
    if (aiComp >= 3) return 1.0;
    if (plComp >= 3) return 0.0;

    // FIX 2: usar evaluarPosicion() del cerebro en vez de AIEvaluator
    // evaluarPosicion devuelve [-1, 1]; normalizamos a [0, 1]
    try {
        const v = evaluarPosicion(estado);
        return (v + 1) / 2;
    } catch (e) {
        // Fallback mínimo si algo falla
        let ai = aiComp * 4, pl = plComp * 4;
        LINEAS.forEach(l => {
            ai += _puntos(estado, l, 'ai')    / 10;
            pl += _puntos(estado, l, 'player') / 10;
        });
        const total = ai + pl;
        return total > 0 ? ai / total : 0.5;
    }
}

// ── Backpropagación ───────────────────────────────────────────────────────────

function _backpropagar(nodo, resultado) {
    let n = nodo;
    while (n !== null) {
        n.visitas++;
        n.ganancias += resultado; // siempre desde perspectiva de la IA
        n = n.padre;
    }
}

// ── Terminación ───────────────────────────────────────────────────────────────

function _esTerminal(estado) {
    return (estado.ai.compiled     || []).length >= 3 ||
           (estado.player.compiled || []).length >= 3;
}

// ── Generación de movimientos (dentro del árbol) ──────────────────────────────

function _generarMovimientos(estado, jugador) {
    const movimientos  = [];
    const mano         = estado[jugador].hand      || [];
    const protocolos   = estado[jugador].protocols || [];

    mano.forEach((carta, i) => {
        LINEAS.forEach(linea => {
            if (estado.field[linea].compiledBy) return;
            const lineaIdx = protocolos.indexOf(carta.protocol);
            if (lineaIdx !== -1 && LINEAS[lineaIdx] === linea) {
                movimientos.push({ cardIndex: i, line: linea, faceUp: true, card: carta });
            }
            movimientos.push({ cardIndex: i, line: linea, faceUp: false, card: carta });
        });
    });

    if (estado[jugador].deck.length > 0 && mano.length < 5) {
        movimientos.push({ action: 'refresh' });
    }
    return movimientos;
}

// ── Aplicar movimiento ────────────────────────────────────────────────────────

function _aplicarMovimiento(estado, movimiento, jugador) {
    const s  = _clonarEstado(estado);
    const ps = s[jugador];

    if (movimiento.action === 'refresh') {
        while (ps.hand.length < 5 && ps.deck.length > 0) ps.hand.push(ps.deck.pop());
        return s;
    }
    if (!movimiento.line) return s;

    // Sacar carta de mano
    let carta;
    if (movimiento.cardIndex !== undefined &&
        movimiento.cardIndex < ps.hand.length &&
        ps.hand[movimiento.cardIndex] &&
        ps.hand[movimiento.cardIndex].nombre === movimiento.card.nombre) {
        carta = ps.hand.splice(movimiento.cardIndex, 1)[0];
    } else {
        const idx = ps.hand.findIndex(c => c.nombre === movimiento.card.nombre);
        carta = idx !== -1 ? ps.hand.splice(idx, 1)[0] : ps.hand.pop();
    }
    if (!carta) return s;

    // Colocar en campo
    s.field[movimiento.line][jugador].push({ card: carta, faceDown: !movimiento.faceUp });

    // Simular efectos solo para IA bocarriba
    if (jugador === 'ai' && movimiento.faceUp && carta.nombre !== '??') {
        _simularEfecto(s, carta, movimiento.line);
    }

    // Compilar automáticamente si puntúa 10+ y gana la línea
    if (movimiento.faceUp) {
        const oponente = jugador === 'ai' ? 'player' : 'ai';
        const miScore  = _puntos(s, movimiento.line, jugador);
        const suScore  = _puntos(s, movimiento.line, oponente);
        if (miScore >= 10 && miScore > suScore && !s.field[movimiento.line].compiledBy) {
            s.field[movimiento.line].compiledBy = jugador;
            s[jugador].compiled.push(movimiento.line);
        }
    }

    return s;
}

function _simularEfecto(estado, carta, linea) {
    const fx = (typeof CARD_SIM_EFFECTS !== 'undefined') ? CARD_SIM_EFFECTS[carta.nombre] : null;
    if (!fx) return;

    if (fx.draw) {
        const n = Math.min(fx.draw, estado.ai.deck.length);
        for (let i = 0; i < n; i++) estado.ai.hand.push(estado.ai.deck.pop());
    }
    if (fx.selfDiscard) {
        const n = Math.min(fx.selfDiscard, estado.ai.hand.length);
        for (let i = 0; i < n; i++) {
            const c = estado.ai.hand.pop();
            if (c) estado.ai.trash.push(c);
        }
    }
    if (fx.opponentDiscard && estado.player.hand.length > 0) {
        const minIdx = estado.player.hand.reduce(
            (mi, c, j, arr) => c.valor < arr[mi].valor ? j : mi, 0
        );
        const [c] = estado.player.hand.splice(minIdx, 1);
        if (c) estado.player.trash.push(c);
    }
    if (fx.eliminate)      _simEliminar(estado, fx.eliminate, linea);
    if (fx.playFromDeck)   _simJugarDesMazo(estado, fx.playFromDeck, linea);
    if (fx.returnOpponent) _simDevolverMayor(estado, 'player');
    if (fx.returnSelf) {
        const stack = estado.field[linea] && estado.field[linea].ai;
        if (stack && stack.length > 0) {
            const devuelta = stack.pop();
            if (devuelta) estado.ai.hand.push(devuelta.card);
        }
    }
    if (fx.preventCompile) estado.player.cannotCompile = true;
    if (fx.flipOpponent)   _simVoltearOponente(estado, fx.flipOpponent);
}

function _simEliminar(estado, elim, linea) {
    const { strategy, count = 1, maxVal } = elim;
    LINEAS.forEach(l => {
        const stack = estado.field[l].player;
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
            for (let i = stack.length - 1; i >= 0; i--) {
                if (!stack[i].faceDown && (stack[i].card.valor || 0) <= maxVal) stack.splice(i, 1);
            }
        }
    });
}

function _simJugarDesMazo(estado, fx, linea) {
    const n = Math.min(fx.count || 1, estado.ai.deck.length);
    const objetivo = LINEAS.filter(l => {
        if (estado.field[l].compiledBy) return false;
        if (fx.target === 'occupiedLines') return estado.field[l].ai.length > 0;
        if (fx.target === 'otherLines')   return l !== linea;
        return true;
    });
    objetivo.slice(0, n).forEach(l => {
        const c = estado.ai.deck.pop();
        if (c) estado.field[l].ai.push({ card: c, faceDown: true });
    });
}

function _simDevolverMayor(estado, jugador) {
    let mejorLinea = null, mejorVal = -1, mejorIdx = -1;
    LINEAS.forEach(l => {
        (estado.field[l][jugador] || []).forEach((obj, i) => {
            if (!obj.faceDown && (obj.card.valor || 0) > mejorVal) {
                mejorVal = obj.card.valor || 0;
                mejorLinea = l;
                mejorIdx = i;
            }
        });
    });
    if (mejorLinea !== null && mejorIdx !== -1) {
        const [obj] = estado.field[mejorLinea][jugador].splice(mejorIdx, 1);
        estado[jugador].hand.push(obj.card);
    }
}

function _simVoltearOponente(estado, count) {
    let volteadas = 0;
    LINEAS.forEach(l => {
        if (volteadas >= count) return;
        const stack = estado.field[l].player;
        const idx = stack.findIndex(c => !c.faceDown);
        if (idx !== -1) { stack[idx] = { ...stack[idx], faceDown: true }; volteadas++; }
    });
}

// ── Clonar estado (rápido, solo partes mutables) ──────────────────────────────

function _clonarEstado(s) {
    const clonarStack = arr => arr.map(o => ({ card: o.card, faceDown: o.faceDown }));
    const clonarLinea = l  => ({ ...l, player: clonarStack(l.player), ai: clonarStack(l.ai) });
    return {
        ...s,
        player: { ...s.player, hand: [...s.player.hand], deck: [...s.player.deck],
                  trash: [...s.player.trash], compiled: [...s.player.compiled] },
        ai:     { ...s.ai,     hand: [...s.ai.hand],     deck: [...s.ai.deck],
                  trash: [...s.ai.trash],     compiled: [...s.ai.compiled] },
        field: {
            izquierda: clonarLinea(s.field.izquierda),
            centro:    clonarLinea(s.field.centro),
            derecha:   clonarLinea(s.field.derecha),
        },
    };
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
        simular,
        _puntuarJugada,
        _puntuarBocabajo,
        _puntuarRefresh,
        _bonusContraestrategia,
        _bonusProtocoloEspecifico,
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
        // Fase 4: ISMCTS interno
        _politicaRollout,
        _evaluarHoja,
        _generarMovimientos,
        _aplicarMovimiento,
        _clonarEstado,
    };
}
