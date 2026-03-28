/**
 * 🤖 AI PROFILES - COMPILE
 * Version: 1.0.0
 *
 * 10 perfiles de IA para niveles 1-5 (2 variantes por nivel)
 * Cada perfil define el comportamiento estratégico de la IA
 */

const AI_PROFILES = {
  // ─────────────────────────────────────────────
  // NIVEL 1 - PRINCIPIANTE
  // ─────────────────────────────────────────────

  /**
   * IA1-A: "El Impulsivo"
   * - Sin preocupación defensiva
   * - Busca llegar a 10 puntos lo antes posible
   * - Prioriza valor de cartas sobre efectos
   * - Juega cartas altas sin dudar
   */
  level1_aggressive: {
    name: "IA1-A - El Impulsivo",
    level: 1,
    minimaxDepth: 1,                    // Sin planificación, solo turno actual
    aggression: 0.95,                   // Máxima agresividad, solo ataca
    defensiveNeed: 0.0,                 // No se defiende
    valueOverEffect: 0.9,               // 90% valor de carta, 10% efectos
    faceUpPreference: 0.8,              // Casi siempre boca arriba
    resourceManagement: 0.1,            // No gestiona recursos
    protocolImportance: 0.0,            // Ignora protocolos
    riskTaking: 1.0,                    // Máximo riesgo, sin cálculo
    compilationPriority: 1.0,           // Solo busca compilar
    description: "Nivel 1 agresivo. Llega lo antes posible sin mirar más allá. ¿Tiene un 5? Lo juega sin dudar."
  },

  /**
   * IA1-B: "El Casual"
   * - Juega sin estrategia definida
   * - Alterna entre cartas altas y bajas
   * - Sin planificación a futuro
   * - Comete errores frecuentes
   */
  level1_casual: {
    name: "IA1-B - El Casual",
    level: 1,
    minimaxDepth: 1,                    // Sin planificación
    aggression: 0.5,                    // Agresividad media
    defensiveNeed: 0.1,                 // Mínima defensa
    valueOverEffect: 0.7,               // 70% valor, 30% efectos
    faceUpPreference: 0.5,              // 50/50 boca arriba/abajo
    resourceManagement: 0.1,            // No gestiona recursos
    protocolImportance: 0.0,            // Ignora protocolos
    riskTaking: 0.8,                    // Alto riesgo
    compilationPriority: 0.7,           // Busca compilar pero sin urgencia
    description: "Nivel 1 casual. Juega sin estrategia clara. Comete errores pero no es completamente aleatorio."
  },

  // ─────────────────────────────────────────────
  // NIVEL 2 - BÁSICO
  // ─────────────────────────────────────────────

  /**
   * IA2-A: "El Aprendiz"
   * - Empieza a entender el juego
   * - Defiende cuando está muy cerca de perder
   * - Prioriza valor pero considera efectos básicos
   * - Planifica 1 turno adelante
   */
  level2_learner: {
    name: "IA2-A - El Aprendiz",
    level: 2,
    minimaxDepth: 2,                    // Piensa 1 turno adelante
    aggression: 0.7,                    // Moderadamente agresivo
    defensiveNeed: 0.3,                 // Se defiende si ve peligro cercano
    valueOverEffect: 0.6,               // 60% valor, 40% efectos
    faceUpPreference: 0.6,              // Prefiere boca arriba pero usa bocabajos
    resourceManagement: 0.2,            // Mínima gestión de recursos
    protocolImportance: 0.1,            // Empieza a notar protocolos
    riskTaking: 0.6,                    // Riesgo moderado-alto
    compilationPriority: 0.8,           // Prioridad alta a compilar
    description: "Nivel 2 aprendiz. Entiende conceptos básicos. Defiende cuando el peligro es obvio."
  },

  /**
   * IA2-B: "El Conservador"
   * - Más cauteloso que el Aprendiz
   * - Guarda cartas para momentos clave
   * - Evita riesgos innecesarios
   * - Pierde oportunidades por ser demasiado cauteloso
   */
  level2_conservative: {
    name: "IA2-B - El Conservador",
    level: 2,
    minimaxDepth: 2,                    // Piensa 1 turno adelante
    aggression: 0.4,                    // Poco agresivo
    defensiveNeed: 0.5,                 // Se defiende más de lo necesario
    valueOverEffect: 0.5,               // 50% valor, 50% efectos
    faceUpPreference: 0.4,              // Más bocabajos que boca arriba
    resourceManagement: 0.3,            // Algo de gestión de recursos
    protocolImportance: 0.15,           // Considera protocolos ligeramente
    riskTaking: 0.3,                    // Bajo riesgo
    compilationPriority: 0.6,           // Compila pero sin urgencia
    description: "Nivel 2 conservador. Demasiado cauteloso. Guarda cartas pero pierde oportunidades."
  },

  // ─────────────────────────────────────────────
  // NIVEL 3 - INTERMEDIO
  // ─────────────────────────────────────────────

  /**
   * IA3-A: "El Táctico"
   * - Balance entre ataque y defensa
   * - Usa efectos de cartas conscientemente
   * - Planifica 2 turnos adelante
   * - Gestiona razonablemente sus recursos
   */
  level3_tactician: {
    name: "IA3-A - El Táctico",
    level: 3,
    minimaxDepth: 2,                    // Piensa 2 turnos adelante
    aggression: 0.6,                    // Agresividad balanceada
    defensiveNeed: 0.5,                 // Defensa equilibrada
    valueOverEffect: 0.4,               // 40% valor, 60% efectos
    faceUpPreference: 0.5,              // Balance boca arriba/abajo
    resourceManagement: 0.5,            // Gestión media de recursos
    protocolImportance: 0.4,            // Usa protocolos conscientemente
    riskTaking: 0.5,                    // Riesgo calculado
    compilationPriority: 0.7,           // Buena prioridad de compilación
    description: "Nivel 3 táctico. Balancea ataque y defensa. Usa efectos y planifica 2 turnos."
  },

  /**
   * IA3-B: "El Oportunista"
   * - Aprovecha errores del rival
   * - Ataca líneas débiles del oponente
   * - Más reactivo que planificador
   * - Bueno en posiciones tácticas
   */
  level3_opportunist: {
    name: "IA3-B - El Oportunista",
    level: 3,
    minimaxDepth: 2,                    // Piensa 2 turnos adelante
    aggression: 0.75,                   // Agresivo cuando ve oportunidad
    defensiveNeed: 0.4,                 // Defensa reactiva
    valueOverEffect: 0.35,              // 35% valor, 65% efectos
    faceUpPreference: 0.55,             // Ligeramente más boca arriba
    resourceManagement: 0.45,           // Gestión decente de recursos
    protocolImportance: 0.5,            // Aprovecha protocolos para combos
    riskTaking: 0.7,                    // Riesgo moderado-alto
    compilationPriority: 0.85,          // Alta prioridad, busca oportunidades
    description: "Nivel 3 oportunista. Detecta y explota errores. Más reactivo que planificador."
  },

  // ─────────────────────────────────────────────
  // NIVEL 4 - AVANZADO
  // ─────────────────────────────────────────────

  /**
   * IA4-A: "El Estratega"
   * - Planificación a 3 turnos
   * - Excelente gestión de recursos
   * - Balance perfecto ataque/defensa
   * - Usa protocolos efectivamente
   */
  level4_strategist: {
    name: "IA4-A - El Estratega",
    level: 4,
    minimaxDepth: 3,                    // Piensa 3 turnos adelante
    aggression: 0.55,                   // Agresividad muy balanceada
    defensiveNeed: 0.6,                 // Buena defensa preventiva
    valueOverEffect: 0.25,              // 25% valor, 75% efectos
    faceUpPreference: 0.5,              // Perfecto balance
    resourceManagement: 0.7,            // Muy buena gestión
    protocolImportance: 0.7,            // Protocolos como parte clave
    riskTaking: 0.4,                    // Riesgo bajo-moderado
    compilationPriority: 0.75,          // Compila en momento óptimo
    description: "Nivel 4 estratega. Planifica 3 turnos. Excelente gestión y uso de protocolos."
  },

  /**
   * IA4-B: "El Calculador"
   * - Análisis profundo de cada movimiento
   * - Minimiza riesgos al máximo
   * - Sacrifica ventajas cortoplacistas por beneficio a largo plazo
   * - Difícil de sorprender
   */
  level4_calculator: {
    name: "IA4-B - El Calculador",
    level: 4,
    minimaxDepth: 3,                    // Piensa 3 turnos adelante
    aggression: 0.45,                   // Poco agresivo, espera errores
    defensiveNeed: 0.7,                 // Muy defensivo
    valueOverEffect: 0.2,               // 20% valor, 80% efectos
    faceUpPreference: 0.45,             // Más bocabajos tácticos
    resourceManagement: 0.75,           // Gestión excelente
    protocolImportance: 0.75,           // Protocolos muy importantes
    riskTaking: 0.25,                   // Muy bajo riesgo
    compilationPriority: 0.7,           // Compila cuando es seguro
    description: "Nivel 4 calculador. Análisis profundo. Sacrifica corto plazo por largo plazo."
  },

  // ─────────────────────────────────────────────
  // NIVEL 5 - EXPERTO
  // ─────────────────────────────────────────────

  /**
   * IA5-A: "El Maestro"
   * - Planificación a 4+ turnos
   * - Gestión perfecta de recursos
   * - Lee las intenciones del rival
   * - Casi no comete errores
   */
  level5_master: {
    name: "IA5-A - El Maestro",
    level: 5,
    minimaxDepth: 4,                    // Piensa 4+ turnos adelante
    aggression: 0.65,                   // Oportunista activo
    lineControl: 0.80,                  // Dominio agresivo de líneas (separado de aggression)
    defensiveNeed: 0.75,                // Defensa casi perfecta
    valueOverEffect: 0.15,              // 15% valor, 85% efectos
    faceUpPreference: 0.5,              // Balance perfecto según situación
    resourceManagement: 0.9,            // Gestión casi perfecta
    protocolImportance: 0.85,           // Protocolos esenciales
    riskTaking: 0.3,                    // Riesgo muy calculado
    compilationPriority: 0.85,          // Compila en momento óptimo
    description: "Nivel 5 maestro. Dominio de líneas, defensa casi perfecta. Casi no comete errores."
  },

  /**
   * IA5-B: "El Gran Maestro"
   * - Máxima profundidad de pensamiento
   * - Estrategias complejas multi-turno
   * - Adaptativo al estilo del rival
   * - Nivel casi perfecto
   */
  level5_grandmaster: {
    name: "IA5-B - El Gran Maestro",
    level: 5,
    minimaxDepth: 5,                    // Máxima profundidad (5 turnos)
    aggression: 0.60,                   // Oportunista calculado
    lineControl: 0.90,                  // Control de líneas casi perfecto
    defensiveNeed: 0.85,                // Defensa excelente
    valueOverEffect: 0.1,               // 10% valor, 90% efectos
    faceUpPreference: 0.5,              // Decisión perfecta según contexto
    resourceManagement: 0.95,           // Gestión perfecta
    protocolImportance: 0.9,            // Protocolos maximizados
    riskTaking: 0.2,                    // Mínimo riesgo calculado
    compilationPriority: 0.90,          // Compila en el momento más favorable
    description: "Nivel 5 gran maestro. Máxima profundidad. Control total de líneas. Casi perfecto."
  },
};

/**
 * Obtiene el perfil de IA por nombre
 * @param {string} profileName - Nombre del perfil (ej: "level1_aggressive")
 * @returns {object} Perfil de IA o null si no existe
 */
function getAIProfile(profileName) {
  return AI_PROFILES[profileName] || null;
}

/**
 * Obtiene todos los perfiles de un nivel específico
 * @param {number} level - Nivel (1-5)
 * @returns {array} Array de perfiles del nivel especificado
 */
function getProfilesByLevel(level) {
  return Object.values(AI_PROFILES).filter(p => p.level === level);
}

/**
 * Obtiene un perfil aleatorio de un nivel específico
 * @param {number} level - Nivel (1-5)
 * @returns {object} Perfil aleatorio del nivel o null si no existe
 */
function getRandomProfileForLevel(level) {
  const profiles = getProfilesByLevel(level);
  if (profiles.length === 0) return null;
  return profiles[Math.floor(Math.random() * profiles.length)];
}

/**
 * Aplica un perfil de IA a los pesos del evaluador.
 * Usa mapeo lineal directo desde el rango [0,1] del perfil a los rangos
 * reales de cada peso, sin suelo artificial. Así un nivel 1 con
 * defensiveNeed=0.0 realmente tiene peso 0 (no se defiende en absoluto).
 *
 * Rangos de referencia (calibrados para que el nivel 5 sea similar a los
 * pesos originales del evaluador):
 *   compilationThreat : 0 → 0   /  1.0 → 120
 *   defensiveNeed     : 0 → 0   /  1.0 → 100
 *   lineValue         : 0 → 0   /  1.0 →  70
 *   cardAdvantage     : 0 → 0   /  1.0 →  50
 *   opportunities     : 0 → 0   /  1.0 →  35
 *   protocolCoverage  : 0 → 0   /  1.0 →  30
 *   faceDownBalance   : 0 → 0   /  1.0 →  20
 *
 * @param {object} evaluator - Instancia de AIEvaluator
 * @param {object} profile - Perfil de IA a aplicar
 */
function applyAIProfile(evaluator, profile) {
  if (!evaluator || !profile) return;

  evaluator.weights.compilationThreat = profile.compilationPriority          * 120;
  evaluator.weights.defensiveNeed     = profile.defensiveNeed                * 100;
  evaluator.weights.lineValue         = (profile.lineControl ?? profile.aggression) * 70;
  evaluator.weights.cardAdvantage     = profile.resourceManagement           *  50;
  evaluator.weights.opportunities     = profile.aggression                   *  35;
  evaluator.weights.protocolCoverage  = profile.protocolImportance           *  30;
  evaluator.weights.faceDownBalance   = profile.resourceManagement           *  20;

  // Guardar referencia al perfil activo para uso en sortMoves (AI-02)
  evaluator.activeProfile = profile;
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AI_PROFILES, getAIProfile, getProfilesByLevel, getRandomProfileForLevel, applyAIProfile };
}
