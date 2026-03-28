# 📋 CHANGELOG - COMPILE Card Game

Historial de cambios y evolución del proyecto. Formato resumido con secciones expandibles.

---

## 🎯 Versión Actual

**v2.1.0** — Completado pendiente de validación (AI Overhaul)

<details>
<summary><strong>Ver detalles de v2.1.0</strong></summary>

### v2.1.0 — AI Overhaul: 5 niveles con diferencias reales

**Objetivo:** Que cada nivel de dificultad tenga un comportamiento cualitativamente distinto.

#### Cambios Implementados

- ✅ **AI-07:** Fisher-Yates shuffle — reemplazo del `sort(() => Math.random() - 0.5)` sesgado
- ✅ **AI-04:** Perfiles de comportamiento por nivel — 10 perfiles (2 variantes × 5 niveles)
- ✅ **AI-01:** Bug fixes en `simulateMove` + `opponentDiscard` — determinismo en minimax
- ✅ **AI-09:** Memoria del descarte por nivel — la IA solo "recuerda" lo que su nivel permite
- ✅ **AI-08:** Dead line detection realista — usa valores reales de cartas, no asume 5s
- ✅ **AI-05:** Detección de amenaza en 2 turnos — niveles 4-5 ven amenazas lejanas
- ✅ **AI-06:** Penalización por deck vacío — nivel 5 gestiona recursos
- ✅ **AI-02:** Epsilon-greedy — nivel 1 juega aleatoriamente 50% de turnos, nivel 2 el 20%
- ✅ **AI-03:** Sin defensa activa en niveles bajos — nivel 1 ignora amenazas; nivel 2 solo defiende si el jugador está a 1 carta de compilar (score ≥ 9)

#### Perfiles de IA Creados

| Nivel | Variante | Nombre | Características |
|-------|----------|--------|-----------------|
| 1 | A | El Impulsivo | Sin defensa, prioriza valor, depth=1 |
| 1 | B | El Casual | Sin estrategia clara, errores frecuentes |
| 2 | A | El Aprendiz | Defiende si ve peligro obvio, depth=2 |
| 2 | B | El Conservador | Demasiado cauteloso, pierde oportunidades |
| 3 | A | El Táctico | Balance ataque/defensa, usa efectos |
| 3 | B | El Oportunista | Explota errores del rival |
| 4 | A | El Estratega | Planifica 3 turnos, gestiona recursos |
| 4 | B | El Calculador | Sacrifica corto plazo por largo plazo |
| 5 | A | El Maestro | 4+ turnos, casi sin errores |
| 5 | B | El Gran Maestro | Depth=5, adaptativo, estratégico |

#### Archivos Relacionados

- `src/ai-profiles.js` — 10 perfiles de IA con parámetros configurables
- `src/ai-evaluator.js` — pesos ajustables según perfil
- `docs/BACKLOG.md` — tareas pendientes y completadas

</details>

---

## 📦 Versiones Anteriores

<details>
<summary><strong>v2.0.0 — Main 2 Complete</strong></summary>

### v2.0.0 — Main 2 Complete + Auditoría Completa

**Fecha:** Marzo 2026

#### Implementación Completa

- ✅ 180 cartas totales (Main 1 + Main 2)
- ✅ 30 protocolos × 6 cartas cada uno
- ✅ Todos los efectos de Main 2 implementados
- ✅ 139 tests pasando (100% pass rate)

#### Auditoría Main 2

**Bugs Corregidos (12):**
1. **Caos 0** — efecto "Inicial:" movido a `onTurnStart`
2. **Corrupción 0** — flip de cartas cubiertas incluye toda la pila
3. **Miedo 0** — bloqueo de efectos solo durante turno del dueño
4. **Miedo 3** — shift de cartas cubiertas con `targetAll: true`
5. **Hielo 1** — `mayShiftSelf` usa nombre dinámico de carta
6. **Tiempo 2** — mismo fix genérico de `mayShiftSelf`
7. **Espejo 1** — copia efectos manteniendo línea de Espejo 1
8. **Unidad 0** — onCover solo dispara con cartas Unidad
9. **Unidad 1** — convertido a regla pasiva de validación
10. **Guerra 0** — nueva acción `mayFlipSelf` para auto-volteo
11. **Guerra 1** — `discardAny` soporta 0-N cartas
12. **Paz 3** — cálculo dinámico post-descarte

**No Implementados (2) → Completados:**
- ✅ **Caos 3** — `playAnywhere: true` + validación 3 puntos
- ✅ **Corrupción 0** — `playOnAnySide: true` + diálogo de lado

**Verificaciones (10):**
- ✅ Claridad 2, Diversidad 0, Espejo 2/3, Hielo 4/6, Paz 1/4, Guerra 3, Tiempo 0/3

#### Archivos Relacionados

- `src/cards-data.js` — 180 cartas definidas
- `src/abilities-engine.js` — motor de efectos
- `tests/main2-cards.test.js` — 139 tests
- `AUDIT-MAIN2.md` — auditoría completa carta a carta

</details>

<details>
<summary><strong>v1.5.0 — Modal Reveal System</strong></summary>

### v1.5.0 — Modal Reveal para Selección de Cartas

**Fecha:** Febrero-Marzo 2026

#### Características

- ✅ **Tiempo 0:** Elige carta del descarte con modal
- ✅ **Tiempo 3:** Elige carta del descarte o línea con modal
- ✅ **Claridad 3:** Elige carta de valor 5 del mazo con modal
- ✅ Las cartas no pasan por la mano — selección directa
- ✅ Botón CANCELAR para interrumpir acciones interactivas

#### Fixes Relacionados

- ✅ Mostrar cartas reveladas en modal, no en mano
- ✅ Botón siempre visible con max-height en contenedor
- ✅ Limpiar efectos highlights después de jugar bocabajo
- ✅ Prevenir que IA juegue durante interacción del jugador

#### Archivos Relacionados

- `src/game.html` — modales de reveal
- `src/logic.js` — handlers interactivos
- `docs/CODEX.md` — reglas actualizadas

</details>

<details>
<summary><strong>v1.4.0 — IA con Minimax + Alpha-Beta</strong></summary>

### v1.4.0 — IA Inteligente con Minimax

**Fecha:** Enero-Febrero 2026

#### Arquitectura de IA

**3 Nuevos Módulos:**

1. **`ai-evaluator.js`** (298 líneas)
   - 7 métricas de evaluación
   - Score: -100 (perdiendo) a +100 (ganando)
   - Métodos: `evaluateBoard()`, `evaluateCompilationThreat()`, `evaluateLineStrengths()`, etc.

2. **`minimax.js`** (352 líneas)
   - Alpha-Beta Pruning (50-70% reducción)
   - Profundidad configurable (1-5)
   - Quiescence Search para posiciones tácticas

3. **Integración en `logic.js`**
   - Reemplazo de decisiones aleatorias
   - Logging transparente de decisiones

#### Métricas del Evaluador

```javascript
{
  compilationThreat: 100,  // Win/loss proximity
  defensiveNeed: 80,       // Suppress opponent resources
  lineValue: 50,           // Score advantage across lines
  cardAdvantage: 30,       // Hand quality
  opportunities: 25,       // Exploitable line situations
  protocolCoverage: 20,    // Protocol cards face-up = effects active
  faceDownBalance: 15,     // Face-down cards balance
}
```

#### Rendimiento

| Profundidad | Nodos | Tiempo | Decisión |
|-------------|-------|--------|----------|
| Depth 2 | ~300-400 | <100ms | Instantánea |
| Depth 3 | ~2000-4000 | 300-800ms | ~1 segundo |

#### Archivos Relacionados

- `src/ai-evaluator.js` — evaluador de tablero
- `src/minimax.js` — algoritmo de búsqueda
- `docs/FASE-2-IA.md` — documentación técnica completa

</details>

<details>
<summary><strong>v1.3.0 — Draft System 1-2-2-1</strong></summary>

### v1.3.0 — Sistema de Draft con Selección Alternada

**Fecha:** Diciembre 2025 - Enero 2026

#### Características

- ✅ Draft 1-2-2-1: Jugador 1 elige 1 → Jugador 2 elige 2 → Jugador 1 elige 2 → Jugador 2 elige 1
- ✅ 15 protocolos disponibles por set (Main 1 / Main 2)
- ✅ Colocación automática en espacios izquierdo/medio/derecho
- ✅ Miniaturas de cartas con logo COMPILE
- ✅ IA con draft estratégico (sinergias + contrapicks)

#### Fixes Destacados

- ✅ Sincronizar DOM de protocolos tras swap
- ✅ Slot-title en miniaturas de cartas seleccionadas
- ✅ Logo centrado en miniaturas

#### Archivos Relacionados

- `src/draft.html` — interfaz de draft
- `src/logic.js` — lógica de draft 1-2-2-1
- `docs/DRAFT-SYSTEM.md` — reglas y estrategia

</details>

<details>
<summary><strong>v1.2.0 — Abilities Engine</strong></summary>

### v1.2.0 — Motor de Habilidades de Cartas

**Fecha:** Noviembre-Diciembre 2025

#### Sistema de Efectos

**3 Tipos de Comandos:**
- **Inicio (h_inicio):** Efectos al comienzo del turno
- **Acción (h_accion):** Efectos al jugar la carta
- **Fin (h_final):** Efectos al final del turno

**Hooks Implementados:**
- `onTurnStart` — efectos de Inicio
- `onPlay` — efectos de Acción
- `onTurnEnd` — efectos de Fin
- `onCover` — cuando va a ser cubierta
- `onCompile` — al compilar una línea
- `onRefresh` — al actualizar mano
- `onOpponentPlayInLine` — reactivo a jugada rival
- `onOpponentDiscard` — reactivo a descarte rival
- `onDeckShuffle` — al barajar mazo

#### Reglas de Resolución

- **LIFO:** Último en entrar, primero en salir
- **Comando Central:** Se activa al jugar boca arriba, voltearse, o descubrirse
- **Cartas Cubiertas:** Solo efectos persistentes aplican
- **Objetivos:** Cualquiera descubierta, salvo indicación contraria

#### Archivos Relacionados

- `src/abilities-engine.js` — motor de efectos
- `src/cards-data.js` — definiciones de cartas
- `docs/CODEX.md` — reglas completas

</details>

<details>
<summary><strong>v1.1.0 — Core Game Engine</strong></summary>

### v1.1.0 — Motor Principal de Juego

**Fecha:** Octubre-Noviembre 2025

#### Ciclo de Turno

```
1. Inicio (Start) → efectos h_inicio
2. Verificar Control △ → quién tiene ventaja en 2+ líneas
3. Verificar Compilación → compilar si ≥10 y mayor que rival
4. Acción → jugar 1 carta O actualizar mano
5. Verificar Caché → descartar hasta tener 5 cartas
6. Fin (End) → efectos h_final
```

#### Mecánicas Base

- ✅ Compilación y recompilación
- ✅ Cartas boca abajo (valor = 2)
- ✅ Mazo vacío → reconstruir desde descarte
- ✅ Líneas de juego (izquierda, centro, derecha)
- ✅ Protocolos por línea
- ✅ Información oculta (mano rival, cartas bocabajo)

#### Archivos Relacionados

- `src/logic.js` — motor principal
- `src/game.html` — mesa de juego
- `docs/CODEX.md` — reglas oficiales

</details>

<details>
<summary><strong>v1.0.0 — MVP Inicial</strong></summary>

### v1.0.0 — Primera Versión Jugable

**Fecha:** Septiembre-Octubre 2025

#### Características Mínimas

- ✅ Juego 1v1 vs IA básica (aleatoria)
- ✅ 15 protocolos de Main 1 (90 cartas)
- ✅ Draft básico
- ✅ Compilación
- ✅ Turno secuencial

#### Archivos Fundacionales

- `src/index.html` — pantalla principal
- `src/style.css` — estilos base
- `launcher.html` — lanzamiento sin servidor

</details>

---

## 📊 Estadísticas del Proyecto

<details>
<summary><strong>Métricas Actuales</strong></summary>

| Métrica | Valor |
|---------|-------|
| **Total Commits** | 70+ |
| **Archivos Fuente** | 19 en `src/` |
| **Líneas de Código** | ~8000+ |
| **Cartas Implementadas** | 180 |
| **Protocolos** | 30 (15 Main 1 + 15 Main 2) |
| **Tests** | 182 pasando (100%) |
| **Niveles de IA** | 5 (con 2 variantes cada uno) |
| **Efectos de Carta** | 47+ tipos únicos |

</details>

---

## 📝 Convenciones de Commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/):

| Prefijo | Descripción | Ejemplo |
|---------|-------------|---------|
| `feat:` | Nueva característica | `feat(modal-reveal): Tiempo 0 elige cartas con modal` |
| `fix:` | Corrección de bug | `fix(ai): realistic dead line detection` |
| `docs:` | Documentación | `docs(backlog): add v2.1.0 AI Overhaul milestone` |
| `style:` | Estilos, formato | `style(index): diff-grid usa CSS grid` |
| `refactor:` | Refactorización | `refactor(cancel-btn): restringir CANCELAR` |
| `test:` | Tests | `test: añadir tests para efecto X` |
| `chore:` | Tareas de mantenimiento | `chore: redirect CLAUDE.md to DEV_INSTRUCTIONS` |

---

## 🔗 Enlaces a Documentación

| Documento | Propósito |
|-----------|-----------|
| [`README.md`](README.md) | Introducción y cómo jugar |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de cambios (este archivo) |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Tareas pendientes y roadmap |
| [`docs/CODEX.md`](docs/CODEX.md) | Reglas oficiales, erratas, FAQ |
| [`docs/DRAFT-SYSTEM.md`](docs/DRAFT-SYSTEM.md) | Sistema de draft y estrategia |
| [`docs/FASE-2-IA.md`](docs/FASE-2-IA.md) | Documentación técnica de IA |
| [`docs/FASE-3-CONTROL.md`](docs/FASE-3-CONTROL.md) | Diseño del Control Component |
| [`AUDIT-MAIN2.md`](AUDIT-MAIN2.md) | Auditoría completa de Main 2 |
| [`DEV_INSTRUCTIONS.md`](DEV_INSTRUCTIONS.md) | Instrucciones para desarrollo |

---

*Última actualización: 28 de Marzo 2026*
