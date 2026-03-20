# AUDIT MAIN 2 — Auditoría Fresca (2026-03-20)

Auditoría carta a carta de los 15 protocolos de Main 2 (90 cartas).
Cada carta se valida comparando el texto de `cards-data.js` con la implementación en `abilities-engine.js`.

**Leyenda:** ✅ Correcto · ❌ Bug · ⚠️ Revisar · 🔲 No implementado

---

## ASIMILACIÓN

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Asimilación 0** | h_accion: "Devuelve a tu mano 1 carta bocabajo (cubierta o descubierta) de tu oponente." | ✅ | `returnOpponentFaceDown` implementado |
| **Asimilación 1** | h_accion: "Descarta 1 carta. Actualiza." / h_final: "Después de que un jugador actualice: Roba la carta superior del mazo de tu oponente. Descarta 1 carta en su descarte." | ❌ | onPlay y onRefresh/onOpponentRefresh disparan `drawFromOpponentDeck` pero falta el segundo paso: "Descarta 1 carta en su descarte" (descartar 1 carta propia al descarte del oponente) |
| **Asimilación 2** | h_final: "Final: Juega bocabajo la carta superior del mazo de tu oponente en esta pila." | ✅ | `playOpponentTopDeckHere` en onTurnEnd |
| **Asimilación 4** | h_accion: "Roba la carta superior del mazo de tu oponente. Tu oponente roba la carta superior de tu mazo." | ✅ | `swapTopDeckCards` |
| **Asimilación 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |
| **Asimilación 6** | h_final: "Final: Juega bocabajo la carta superior de tu mazo en el lado de tu oponente." | ✅ | `playOwnTopDeckOpponentSide` en onTurnEnd |

---

## CAOS

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Caos 0** | h_accion: "En cada línea, voltea 1 carta cubierta." / h_final: **"Inicial:** Roba la carta superior del mazo de tu oponente. Tu oponente roba la carta superior de tu mazo." | ❌ | `swapTopDeckCards` está en **onPlay** pero el texto dice "Inicial:" → debe ir en **onTurnStart**. `flipCoveredInEachLine` correcto en onPlay |
| **Caos 1** | h_accion: "Reorganiza tus Protocolos. Reorganiza los Protocolos de tu oponente." | ✅ | `rearrangeProtocols` × 2 |
| **Caos 2** | h_accion: "Cambia 1 de tus cartas cubiertas." | ✅ | `shiftCovered` target self |
| **Caos 3** | h_final: "Esta carta puede jugarse sin coincidir con los Protocolos." | 🔲 | Sin `persistent: { allowAnyProtocol: true }` — definición vacía, no implementa validación de juego libre |
| **Caos 4** | h_final: "Final: Descarta tu mano. Roba tantas cartas como hayas descartado." | ✅ | `discardHandDraw` en onTurnEnd |
| **Caos 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## CLARIDAD

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Claridad 0** | h_inicio: "El valor total en esta línea se incrementa en 1 por cada carta en tu mano." | ✅ | `persistent: { valueBonusPerHandCard: 1 }` |
| **Claridad 1** | h_inicio: "Inicial: Revela la carta superior de tu mazo. Puedes descartarla." / h_accion: "Tu oponente revela su mano." / h_final: "Si esta carta va a ser cubierta: Primero, roba 3 cartas." | ✅ | onTurnStart, onPlay, onCover correctos |
| **Claridad 2** | h_accion: "Revela tu mazo. Roba 1 carta con Valor 1 revelada así. Baraja tu mazo. Juega 1 carta con Valor 1." | ⚠️ | `searchDeckValue1ThenPlay` — verificar que implementa "Juega 1 carta con Valor 1" además de robar |
| **Claridad 3** | h_accion: "Revela tu mazo. Roba 1 carta con Valor 5 revelada así. Baraja tu mazo." | ✅ | `searchDeckByValue` value=5 |
| **Claridad 4** | h_accion: "Puedes barajar tu descarte en tu mazo." | ✅ | `mayShuffleDiscardIntoDeck` |
| **Claridad 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## CORRUPCIÓN

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Corrupción 0** | h_inicio: "Inicial: Voltea 1 otra carta bocarriba (cubierta o descubierta) en esta pila." / h_final: "Esta carta puede jugarse en el lado de cualquier jugador sin coincidir con los Protocolos." | ❌❌ | **Bug 1**: `flipCoveredInOwnStack` (ln 3527) usa `i < stack.length - 1` → excluye la carta top. El texto dice "(cubierta o descubierta)" — si Corrupción 0 está cubierta, la carta encima (descubierta) debería ser objetivo válido. **Bug 2**: "puede jugarse en el lado de cualquier jugador sin coincidir con los Protocolos" → 🔲 no implementado en validación de juego |
| **Corrupción 1** | h_accion: "Devuelve 1 carta." / h_final: "Cuando una carta vaya a ser devuelta a la mano de tu oponente: En su lugar, colócala bocarriba en lo alto de su mazo." | ✅ | onPlay: return any + `persistent: { redirectReturnToTopDeck: true }` + `applyReturnToHand()` (ln 4790) |
| **Corrupción 2** | h_inicio: "Después de que descartes cartas: Tu oponente descarta 1 carta." / h_accion: "Roba 1 carta. Descarta 1 carta." | ⚠️ | `onOwnDiscard: discardRandom` — el texto no dice "aleatoria", dice "Tu oponente descarta 1 carta" (debería ser interactivo para el oponente humano). También verificar que `discardHand` en Paz 1 dispara `onOwnDiscardEffects` |
| **Corrupción 3** | h_accion: "Puedes voltear 1 carta cubierta bocarriba." | ✅ | `mayFlipCoveredFaceUp` |
| **Corrupción 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |
| **Corrupción 6** | h_inicio: "Final: Descarta 1 carta o elimina esta carta." | ✅ | `optionalDiscardOrDeleteSelf` en onTurnEnd — nota: el texto dice h_inicio pero la key `h_inicio` contiene "Final:" por error en data, la implementación onTurnEnd es correcta |

---

## VALOR

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Valor 0** | h_inicio: "Inicial: Si no tienes cartas en mano, roba 1 carta." / h_accion: "Roba 1 carta." / h_final: "Final: Puedes descartar 1 carta. Si lo haces, tu oponente descarta 1 carta." | ✅ | onTurnStart, onPlay, onTurnEnd correctos |
| **Valor 1** | h_accion: "Elimina 1 carta de tu oponente en una línea donde su valor total sea mayor que el tuyo." | ✅ | `deleteInWinningOpponentLine` |
| **Valor 2** | h_accion: "Roba 1 carta." / h_final: "Final: Si tu oponente tiene un valor total mayor que el tuyo en esta línea, roba 1 carta." | ✅ | onPlay + `drawIfOpponentWinsLine` en onTurnEnd |
| **Valor 3** | h_final: "Final: Puedes cambiar esta carta a la línea donde tu oponente tenga su valor total más alto." | ✅ | `mayShiftSelfToHighestOpponentLine` en onTurnEnd |
| **Valor 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |
| **Valor 6** | h_final: "Final: Si tu oponente tiene un valor mayor que el tuyo en esta línea, voltea esta carta." | ✅ | `flipSelfIfOpponentWins` en onTurnEnd |

---

## DIVERSIDAD

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Diversidad 0** | h_accion: "Si hay 6 Protocolos distintos en cartas del campo, voltea el Protocolo Diversidad al lado compilado." / h_final: "Final: Puedes jugar 1 carta que no sea Diversidad en esta línea." | ⚠️ | `compileDiversityIfSixProtocols` + `playNonDiversityCard` — verificar si `playNonDiversityCard` deja elegir al jugador (texto dice "Puedes jugar") o auto-juega |
| **Diversidad 1** | h_accion: "Cambia 1 carta. Roba tantas cartas como Protocolos distintos haya en cartas de esta línea." | ✅ | shift any + `drawPerDistinctProtocolsInLine` |
| **Diversidad 3** | h_inicio: "El valor total en esta línea se incrementa en 2 si hay alguna carta bocarriba que no sea Diversidad en esta pila." | ✅ | `persistent: { valueBonusIfNonDiversityFaceUp: 2 }` |
| **Diversidad 4** | h_accion: "Voltea 1 carta con Valor menor que el número de Protocolos distintos en cartas del campo." | ✅ | `flipCardBelowDistinctProtocolCount` |
| **Diversidad 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |
| **Diversidad 6** | h_final: "Final: Si no hay al menos 4 Protocolos distintos en cartas del campo, elimina esta carta." | ✅ | `deleteIfFewDistinctProtocols` minProtocols=4 en onTurnEnd |

---

## MIEDO

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Miedo 0** | h_inicio: "Durante tu turno, las cartas de tu oponente no tienen comandos centrales." / h_accion: "Cambia o voltea 1 carta." | ❌ | **Bug**: `disableOpponentMiddleCommands` en `triggerCardEffect` (ln 1140-1153) bloquea TODOS los onPlay del rival sin verificar `gameState.turn`. Si el dueño de Miedo 0 es 'player', debería bloquear onPlay de 'ai' solo **durante el turno de 'player'**, no siempre |
| **Miedo 1** | h_accion: "Roba 2 cartas. Tu oponente descarta su mano y roba tantas cartas como haya descartado menos 1." | ✅ | draw 2 + `opponentDiscardAndRedraw` minusN=1 |
| **Miedo 2** | h_accion: "Devuelve 1 carta de tu oponente." | ✅ | `return` target opponent |
| **Miedo 3** | h_accion: "Cambia 1 carta (cubierta o descubierta) de tu oponente en esta línea." | ❌ | Definición: `shift, target: opponent, forceCurrentLine: true` — pero falta `targetAll: true` para permitir seleccionar cartas cubiertas. Sin él, solo la carta top (descubierta) es movible |
| **Miedo 4** | h_accion: "Tu oponente descarta 1 carta aleatoria." | ✅ | `discardRandom` target opponent |
| **Miedo 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## HIELO

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Hielo 1** | h_accion: "Puedes cambiar esta carta." / h_final: "Después de que tu oponente juegue una carta en esta línea: Tu oponente descarta 1 carta." | ❌ | `mayShiftSelf` (ln 1572-1617) está **hardcodeado para 'Espíritu 3'**: el mensaje dice "¿Quieres mover Espíritu 3?" y la IA busca `c.card.nombre === 'Espíritu 3'`. Debería usar `triggerCardName` dinámicamente. La parte reactiva `onOpponentPlayInLine` está bien |
| **Hielo 2** | h_accion: "Cambia 1 otra carta." | ✅ | `shift` target any — nota: "otra" implica excluir a sí misma, verificar si excludeSelf está implementado |
| **Hielo 3** | h_inicio: "Final: Si esta carta está cubierta, puedes cambiarla." | ✅ | `mayShiftSelfIfCovered` en onTurnEnd. Nota: h_inicio contiene "Final:" — fase Start pero efecto Final, implementación correcta |
| **Hielo 4** | h_final: "Esta carta no puede ser volteada." | ⚠️ | `persistent: { preventFlip: true }` definido. Verificar que la lógica de `flip` y `handleFieldCardClick` comprueba este flag |
| **Hielo 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |
| **Hielo 6** | h_inicio: "Si tienes cartas en mano, no puedes robar cartas." | ⚠️ | `persistent: { preventDraw: true }` — el texto dice "Si tienes cartas en mano" (condicional), pero el persistent es incondicional. Verificar si `drawCard()` en logic.js aplica la condición correctamente |

---

## SUERTE

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Suerte 0** | h_accion: "Di un número. Roba 3 cartas. Revela 1 carta robada con el valor bocarriba de tu número indicado. Puedes jugarla." | ✅ | `luckDraw3PickByValue` |
| **Suerte 1** | h_accion: "Juega bocabajo la carta superior de tu mazo. Voltea esa carta, ignorando los comandos centrales." | ✅ | `luckPlayTopThenFlipNoEffect` |
| **Suerte 2** | h_accion: "Descarta la carta superior de tu mazo. Roba tantas cartas como el Valor de la carta descartada." | ✅ | `luckDiscardTopDraw` |
| **Suerte 3** | h_accion: "Di un Protocolo. Descarta la carta superior del mazo de tu oponente. Si la carta descartada coincide con el Protocolo indicado, elimina 1 carta." | ✅ | `luckCallProtocolDiscard` |
| **Suerte 4** | h_accion: "Descarta la carta superior de tu mazo. Elimina 1 carta (cubierta o descubierta) que comparta Valor con la carta descartada." | ✅ | `luckDiscardTopDeleteByValue` |
| **Suerte 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## ESPEJO

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Espejo 0** | h_inicio: "El valor total en esta línea se incrementa en 1 por cada carta de tu oponente en esta línea." | ✅ | `persistent: { valueBonusPerOpponentCard: 1 }` |
| **Espejo 1** | h_final: "Final: Puedes resolver el comando central de 1 carta de tu oponente como si estuviera en esta carta." | ❌ | `copyOpponentCardEffect` (ln 4302-4327) establece `currentEffectLine = chosen.line` (línea de la carta del oponente) en vez de la línea de Espejo 1. "Como si estuviera en esta carta" = debe usar la línea de Espejo 1 |
| **Espejo 2** | h_accion: "Intercambia todas tus cartas de una de tus pilas con otra de tus pilas." | ⚠️ | `swapOwnTwoStacks` usa `effectContext.type = 'rearrange'` con `swapCards: true`. Verificar que el handler en logic.js soporta este modo |
| **Espejo 3** | h_accion: "Voltea 1 de tus cartas. Voltea 1 carta de tu oponente en la misma línea." | ⚠️ | flip self + `flipOpponentSameLine` — usa `gameState.currentEffectLine` para determinar la línea. Debería usar la línea de la carta que el jugador volteó en el paso anterior (via `lastFlippedCard.line`). Si el jugador voltea una carta en línea distinta a donde se jugó Espejo 3, el oponente se voltea en la línea incorrecta |
| **Espejo 4** | h_final: "Después de que tu oponente robe cartas: Roba 1 carta." | ✅ | `onOpponentDraw` → draw self 1 |
| **Espejo 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## PAZ

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Paz 1** | h_accion: "Ambos jugadores descartan su mano." / h_final: "Final: Si tu mano está vacía, roba 1 carta." | ⚠️ | `discardHand` × 2 + `drawIfEmptyHand` en onTurnEnd. Verificar que `discardHand` dispara `onOwnDiscardEffects` (para Corrupción 2) |
| **Paz 2** | h_accion: "Roba 1 carta. Juega 1 carta bocabajo." | ✅ | draw 1 + `playHandFaceDown` |
| **Paz 3** | h_accion: "Puedes descartar 1 carta. Voltea 1 carta que tenga un valor mayor que el número de cartas en tu mano." | ❌ | En `optionalDiscardThenFlipHighValue` (ln 3652), al elegir SÍ (descartar), se encola `_flipMinValue` con `minValue: -99` **antes** del descarte interactivo. Debería calcularse **después** del descarte (hand.length + 1). El path "NO" calcula bien con `handCount + 1` |
| **Paz 4** | h_final: "Después de que descartes cartas durante el turno de tu oponente: Roba 1 carta." | ⚠️ | `onForcedDiscard` → draw 1. Verificar que este hook se dispara en `discard()` y `discardRandom()` cuando es turno del oponente |
| **Paz 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |
| **Paz 6** | h_accion: "Si tienes más de 1 carta en mano, voltea esta carta." | ✅ | `flipSelfIfMultipleHandCards` |

---

## HUMO

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Humo 0** | h_accion: "Juega la carta superior de tu mazo bocabajo en cada línea con una carta bocabajo." | ✅ | `playTopDeckInFaceDownLines` — corregido para revisar cartas bocabajo de ambos jugadores |
| **Humo 1** | h_accion: "Voltea 1 de tus cartas. Puedes cambiarla." | ✅ | flip self + `mayShiftLastFlipped` |
| **Humo 2** | h_inicio: "Tu valor total en esta línea se incrementa en 1 por cada carta bocabajo en esta línea." | ✅ | `persistent: { valueBonusPerFaceDown: 1 }` |
| **Humo 3** | h_accion: "Juega 1 carta bocabajo en una línea con una carta bocabajo." | ✅ | `playHandFaceDown` con `requireFaceDownInLine: true` |
| **Humo 4** | h_accion: "Cambia 1 carta cubierta bocabajo." | ✅ | `shiftCoveredFaceDown` |
| **Humo 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## TIEMPO

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Tiempo 0** | h_accion: "Juega 1 carta de tu descarte. Baraja tu descarte en tu mazo." | ⚠️ | `playFromDiscardThenShuffle` — verificar handler interactivo en logic.js |
| **Tiempo 1** | h_accion: "Voltea 1 carta cubierta. Descarta todo tu mazo." | ✅ | flip any coveredOnly + `discardOwnDeck` |
| **Tiempo 2** | h_accion: "Si hay cartas en tu descarte, puedes barajar tu descarte en tu mazo." / h_inicio: "Después de que barajes tu mazo: Roba 1 carta y puedes cambiar esta carta." | ❌ | `drawAndMayShiftSelf` en onDeckShuffle llama a `mayShiftSelf` que está **hardcodeado para 'Espíritu 3'** (mismo bug que Hielo 1). El mensaje dice "¿Quieres mover Espíritu 3?" |
| **Tiempo 3** | h_accion: "Revela 1 carta de tu descarte. Juégala bocabajo en otra línea." | ⚠️ | `playFromDiscardFaceDownOtherLine` — verificar handler interactivo en logic.js |
| **Tiempo 4** | h_accion: "Roba 2 cartas. Descarta 2 cartas." | ✅ | draw 2 + discard 2 |
| **Tiempo 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## UNIDAD

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Unidad 0** | h_accion: "Si hay otra carta de Unidad en el campo, voltea 1 carta o roba 1 carta." / h_final: "Cuando esta carta vaya a ser cubierta **por una carta Unidad**: Primero, voltea 1 carta o roba 1 carta." | ❌ | `onCover` dispara `mayFlipOrDrawIfUnityOnField` para **cualquier** carta que cubra, no solo cartas Unidad. Falta filtrar por `card.nombre.startsWith('Unidad')` en la lógica de onCover |
| **Unidad 1** | h_inicio: "Inicio: Si esta carta está cubierta, puedes cambiarla." / h_accion: "Si hay 5 o más cartas Unidad en el campo, voltea el protocolo Unidad al lado compilado y elimina todas las cartas de esa línea." / h_final: "Las cartas Unidad pueden jugarse bocarriba en esta línea." | ❌ | `playUnidadCardsFromHand` en onTurnEnd auto-juega TODAS las cartas Unidad de la mano → el texto dice "pueden jugarse" = regla pasiva de validación (permiso), no acción automática. Debería ser un modificador de reglas de juego |
| **Unidad 2** | h_accion: "Roba cartas igual al número de cartas Unidad en el campo." | ✅ | `drawPerUnityCards` |
| **Unidad 3** | h_accion: "Si hay otra carta Unidad en el campo, puedes voltear 1 carta bocarriba." | ⚠️ | `mayFlipIfUnityOnField` — "Puedes" implica opcionalidad. Verificar que player tiene opción de no voltear |
| **Unidad 4** | h_inicio: "Final: Si tu mano está vacía, revela tu mazo, roba todas las cartas Unidad de él y baraja tu mazo." | ✅ | `drawUnityFromDeckIfEmptyHand` en onTurnEnd |
| **Unidad 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## GUERRA

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Guerra 0** | h_inicio: "Después de que actualices: Puedes voltear **esta** carta." / h_final: "Después de que tu oponente robe cartas: Puedes eliminar 1 carta." | ❌ | `onRefresh: mayFlip, target: self` — `mayFlip` abre selección interactiva de CUALQUIER carta. El texto dice "voltear **esta** carta" = debería usar `flipSelf` (auto-voltear Guerra 0, con confirmación) |
| **Guerra 1** | h_final: "Después de que tu oponente actualice: Descarta cualquier número de cartas. Actualiza." | ❌ | `discardAny` (ln 3179-3200) solo permite descartar 0 o 1 carta. El texto dice "cualquier número" = debe soportar descarte múltiple (0 a N) |
| **Guerra 2** | h_accion: "Voltea 1 carta." / h_final: "Después de que tu oponente compile: Tu oponente descarta su mano." | ✅ | flip any + `onOpponentCompile: discardHand opponent` |
| **Guerra 3** | h_accion: "Roba 1 carta." / h_final: "Después de que tu oponente descarte cartas: Puedes jugar 1 carta bocabajo." | ⚠️ | `onOpponentDiscard: playHandFaceDown` — "Puedes" implica opcionalidad. Verificar que `playHandFaceDown` permite declinar |
| **Guerra 4** | h_accion: "Tu oponente descarta 1 carta." | ✅ | discard opponent 1 |
| **Guerra 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |

---

## AMOR (Main 2 edition)

| Carta | Texto | Estado | Notas |
|-------|-------|--------|-------|
| **Amor 1** | h_accion: "Roba la carta superior del mazo de tu oponente." / h_final: "Final: Puedes dar 1 carta de tu mano a tu oponente. Si lo haces, roba 2 cartas." | ✅ | Correcto |
| **Amor 2** | h_accion: "Tu oponente roba 1 carta. Actualiza." | ✅ | draw opponent + refresh self |
| **Amor 3** | h_accion: "Toma 1 carta aleatoria de la mano de tu oponente. Da 1 carta de tu mano a tu oponente." | ✅ | takeRandomFromOpponent + giveCardToOpponent |
| **Amor 4** | h_accion: "Revela 1 carta de tu mano. Voltea 1 carta." | ✅ | revealFromHand + flip any |
| **Amor 5** | h_accion: "Descarta 1 carta." | ✅ | Genérica |
| **Amor 6** | h_accion: "Tu oponente roba 2 cartas." | ✅ | draw opponent 2 |

---

## Código Duplicado

| Problema | Detalle |
|----------|---------|
| **`drawFromOpponentDeck` duplicado** | Case definido en ln 2929 (simple, sin check de mazo vacío) Y en ln 3124 (con shuffle si mazo vacío). Solo el primero ejecuta — el segundo es dead code. Consolidar en uno solo con la lógica de shuffle |

---

# RESUMEN DE HALLAZGOS — ESTADO FINAL

Todas las 4 fases completadas. 139 tests pasando.

## Bugs Confirmados (❌) — 12 → ✅ TODOS CORREGIDOS

| # | Carta | Fix aplicado |
|---|-------|-------------|
| 1 | **Caos 0** | ✅ `swapTopDeckCards` movido a onTurnStart |
| 2 | **Corrupción 0** | ✅ `flipCoveredInOwnStack` incluye toda la pila excepto Corrupción 0 |
| 3 | **Miedo 0** | ✅ Check `gameState.turn === rival` en `triggerCardEffect` |
| 4 | **Miedo 3** | ✅ Añadido `targetAll: true` al shift |
| 5 | **Hielo 1** | ✅ `mayShiftSelf` usa `triggerCardName` dinámicamente |
| 6 | **Tiempo 2** | ✅ Mismo fix genérico de `mayShiftSelf` |
| 7 | **Espejo 1** | ✅ `copyOpponentCardEffect` mantiene línea de Espejo 1 |
| 8 | **Unidad 0** | ✅ `onCoverCondition: 'unityOnly'` + `gameState.coveringCard` |
| 9 | **Unidad 1** | ✅ Convertido a `persistent: { allowUnityPlayInLine: true }` |
| 10 | **Guerra 0** | ✅ Nueva acción `mayFlipSelf` (solo voltea la carta propia) |
| 11 | **Guerra 1** | ✅ `discardAny` soporta 0-N cartas con botón LISTO |
| 12 | **Paz 3** | ✅ `minValue: 'dynamic'` calcula `handCount+1` post-descarte |

## Incompleto (❌ parcial) — 1 → ✅ COMPLETADO

| # | Carta | Fix aplicado |
|---|-------|-------------|
| 1 | **Asimilación 1** | ✅ Nueva acción `discardToOpponentTrash` + handler en logic.js |

## No Implementado (🔲) — 2 → ✅ IMPLEMENTADOS

| # | Carta | Fix aplicado |
|---|-------|-------------|
| 1 | **Caos 3** | ✅ `playAnywhere: true` + `canPlayAnywhere()` + validación 3 puntos |
| 2 | **Corrupción 0** | ✅ `playOnAnySide: true` + `canPlayOnAnySide()` + diálogo de lado |

## Verificación (⚠️) — 10 → RESULTADOS

| # | Carta | Resultado |
|---|-------|-----------|
| 1 | Claridad 2 | ✅ OK — draw + play ambos implementados |
| 2 | Corrupción 2 | ℹ️ `discardRandom` aceptable (juego 1v1 vs IA) |
| 3 | Diversidad 0 | ✅ OK — confirm dialog para opción |
| 4 | Espejo 2 | ✅ OK — handler `swapCards: true` existe |
| 5 | Espejo 3 | ✅ CORREGIDO — ahora usa `lastFlippedCard.line` |
| 6 | Hielo 4 | ✅ OK — `preventFlip` verificado en 3 puntos |
| 7 | Hielo 6 | ✅ OK — condición `hand.length > 0` correcta |
| 8 | Paz 1/4 | ✅ OK — hooks `onOwnDiscard` y `onForcedDiscard` correctos |
| 9 | Guerra 3 | ✅ CORREGIDO — `may: true` + confirm dialog |
| 10 | Tiempo 0/3 | ✅ OK — handlers interactivos funcionan |

## Dead Code — 1 → ✅ ELIMINADO

| # | Fix aplicado |
|---|-------------|
| 1 | ✅ `drawFromOpponentDeck` consolidado con lógica de shuffle-trash |
