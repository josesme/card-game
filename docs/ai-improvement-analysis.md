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

## Arquitectura actual verificada

- **Profundidades por perfil:** nivel1 → 1, nivel2 → 2, nivel3 → 2, nivel4 → 3, nivel5A (Maestro) → 4, nivel5B (Gran Maestro) → 5
- **Alpha-beta pruning** + **quiescence search** (solo compiles) + **imperfect information** (cartas del jugador)
- **Move ordering** en `sortMoves`: prioriza compile > bloqueo match point > bocarriba > valor
- **Dead line detection** integrada en `generateAIMoves` y `evaluateLineStrengths`
- **`applyAIProfile`** mapea propiedades [0,1] del perfil a pesos reales del evaluador en cada turno
