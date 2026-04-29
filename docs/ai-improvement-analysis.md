# Análisis de mejora de IA — COMPILE

> Referencia generada en sesión 2026-04-30 tras lectura completa de `ai-profiles.js`, `ai-evaluator.js`, `minimax.js`.

## Mejoras priorizadas

### 1. Completar CARD_SIM_EFFECTS — ✅ COMPLETADO (2026-04-30)

`CARD_SIM_EFFECTS` en `src/minimax.js:23` define qué hace cada carta en el lookahead del minimax. Las cartas ausentes se juegan "a ciegas" (la IA no ve su beneficio al decidir si jugarlas).

**Resultado:** Se añadieron ~45 entradas nuevas cubriendo todas las familias de Main 1 y Main 2. Verificadas contra `src/cards-data.js` (fuente de verdad de efectos).

**Cartas sin entrada (intencional) — razones documentadas:**

| Carta | Razón para omitir |
|-------|-------------------|
| Espíritu 3, 4 | Reactivo (tras robar) / reorganiza protocolos — sin efecto onPlay simulable |
| Gravedad 4 | Posicional propio (cambia bocabajo propia a línea) — sin impacto en oponente |
| Vida 3 | Trigger al ser cubierta, no onPlay |
| Luz 4 | Informacional (revela mano rival) — sin cambio de estado en sim |
| Metal 6 | Auto-eliminante pasivo — no existe Metal 4 en el pool de cartas |
| Velocidad 2, 3 | Reactivo / posicional propio |
| Apatía 0, 2 | Modificadores persistentes de score — manejados por `calculateScore` |
| Apatía 4 | Voltea propia cubierta — sin efecto sobre oponente |
| Odio 3, 4 | Reactivo (tras eliminar) / trigger al cubrir |
| Amor 0 | No existe en el pool de cartas (Amor empieza en 1) |
| Caos 1, 2, 3 | Reorganiza protocolos / posicional propio / propiedad de carta |
| Claridad 0 | Modificador persistente de score — `calculateScore` lo aplica |
| Diversidad 3, 6 | Modificador persistente / auto-eliminar condicional |
| Unidad 4 | Complejo condicional (mano vacía → busca Unidad en mazo) |
| Valor 3, 6 | Reactivo / condicional propio |
| Paz 1, 4, 6 | Ambos descartan mano (perjudica también a IA) / reactivo / condicional propio |
| Asimilación 4, 6 | Intercambio neutro / auto-perjudicial |
| Suerte 3 | Probabilístico sobre protocolo declarado |
| Espejo 0, 1, 2, 4 | Modificador persistente / copia efecto rival / posicional / reactivo |
| Humo 1, 2, 4 | Posicional propio / modificador persistente |
| Tiempo 1 | Descarta todo el mazo — demasiado destructivo para aproximar |
| Hielo 0, 3, 4 | No existe Hielo 0 / reactivo / propiedad pasiva |
| Gravedad 3, Metal 4 | **No existen en el pool de cartas** |

---

---

## Ideas futuras (aplazadas — bajo valor residual tras sesión 2026-04-30)

> Estas mejoras fueron evaluadas y descartadas para implementación inmediata. El arreglo de `_buildPlayerPool()` cubrió la parte más valiosa del punto 2; los puntos 3 y 4 tienen valor real pero no hay síntoma concreto que los justifique ahora.

### A. Escenarios multi-valor para cartas desconocidas del jugador

**Archivo:** `src/minimax.js:355` (`generatePlayerMoves`)  
**Valor real:** Bajo (antes era Medio — el arreglo de `_buildPlayerPool` ya calibra bien el pool por protocolo, que era la mayor fuente de error).  
**Coste:** Medio-Alto — requiere explorar 2 ramas por carta desconocida en vez de 1, aumentando el árbol de búsqueda. Puede requerir limitar profundidad para compensar.

La idea: generar movimiento optimista (valor máximo del pool) y pesimista (valor promedio) y elegir el movimiento AI que sea mejor contra ambos. Solo aportaría en situaciones donde el jugador tiene exactamente 1 carta que cambia el resultado de una línea — cada vez menos frecuente ahora que el pool es preciso.

---

### B. Extender quiescence search a efectos de alto impacto

**Archivo:** `src/minimax.js:225` (`isHotPosition`)  
**Valor real:** Bajo-Medio — la búsqueda corta justo antes de intercambios tácticos importantes (un eliminate que despeja 4+ puntos no se extiende, solo los compiles).  
**Coste:** Medio — añadir condición en `isHotPosition` para detectar si hay una carta con `eliminate: highest` jugable en línea rival con `score >= 7`. Sin riesgo de romper nada, pero requiere validar que no dispara la extensión demasiado a menudo (degradaría rendimiento).

---

### C. Subir peso `opportunities` en nivel 5

**Archivo:** `src/ai-profiles.js:308` (`applyAIProfile`)  
**Valor real:** Bajo — el nivel 5 puede ser algo pasivo en mid-game antes de estar en rango de compilar. No hay queja reportada.  
**Coste:** Muy bajo — 1 línea. Cambiar `aggression * 35` por `(aggression + compilationPriority) / 2 * 45` en el cálculo de `opportunities`. Solo afecta perfiles con `compilationPriority >= 0.8` (niveles 3–5).

---

## Arquitectura actual verificada

- **Profundidades por perfil:** nivel1 → 1, nivel2 → 2, nivel3 → 2, nivel4 → 3, nivel5A (Maestro) → 4, nivel5B (Gran Maestro) → 5
- **Alpha-beta pruning** + **quiescence search** (solo compiles) + **imperfect information** (cartas del jugador)
- **Move ordering** en `sortMoves`: prioriza compile > bloqueo match point > bocarriba > valor
- **Dead line detection** integrada en `generateAIMoves` y `evaluateLineStrengths`
- **`applyAIProfile`** mapea propiedades [0,1] del perfil a pesos reales del evaluador en cada turno
