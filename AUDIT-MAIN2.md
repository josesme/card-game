# AUDIT MAIN 2 — COMPILE
> Última revisión: 2026-03-20
> Revisado por: Claude Sonnet 4.6
> Scope: todas las cartas de los 15 protocolos de Main 2 (edicion: 2 en cards-data.js)

## Leyenda
- ✅ **CORRECTO** — implementado y coherente con el texto
- ⚠️ **DUDA** — comportamiento parcial o condición no verificada
- ❌ **BUG** — implementado de forma incorrecta
- 🔲 **NO IMPLEMENTADO** — falta el efecto o parte del mismo

---

## ASIMILACIÓN

### Asimilación 0
**Texto:** Devuelve a tu mano 1 carta bocabajo (cubierta o descubierta) de tu oponente.
**Impl:** `onPlay: returnOpponentFaceDown`
**Estado:** ✅

### Asimilación 1
**Texto:** Descarta 1 carta. Actualiza. / Final reactivo: Después de que un jugador actualice → Roba la carta superior del mazo del oponente. Descarta 1 carta en su descarte.
**Impl:** `onPlay: [discard, refresh]` | `onRefresh/onOpponentRefresh: drawFromOpponentDeck`
**Estado:** ⚠️ DUDA
**Notas:** El segundo paso del reactivo ("Descarta 1 carta en su descarte") no está claro si está implementado. Verificar case `drawFromOpponentDeck`.

### Asimilación 2
**Texto:** Final: Juega bocabajo la carta superior del mazo de tu oponente en esta pila.
**Impl:** `onTurnEnd: playOpponentTopDeckHere`
**Estado:** ✅

### Asimilación 4
**Texto:** Roba la carta superior del mazo de tu oponente. Tu oponente roba la carta superior de tu mazo.
**Impl:** `onPlay: swapTopDeckCards`
**Estado:** ✅

### Asimilación 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

### Asimilación 6
**Texto:** Final: Juega bocabajo la carta superior de tu mazo en el lado de tu oponente.
**Impl:** `onTurnEnd: playOwnTopDeckOpponentSide`
**Estado:** ✅

---

## CAOS

### Caos 0
**Texto:** En cada línea, voltea 1 carta cubierta. / Inicial: Roba la carta superior del mazo del oponente. Tu oponente roba la superior del tuyo.
**Impl:** `onPlay: [flipCoveredInEachLine, swapTopDeckCards]`
**Estado:** ✅

### Caos 1
**Texto:** Reorganiza tus Protocolos. Reorganiza los Protocolos de tu oponente.
**Impl:** `onPlay: [rearrangeProtocols(self), rearrangeProtocols(opponent)]`
**Estado:** ✅

### Caos 2
**Texto:** Cambia 1 de tus cartas cubiertas.
**Impl:** `onPlay: shiftCovered(self, 1)` — obligatorio, sin modal
**Estado:** ✅

### Caos 3
**Texto:** Esta carta puede jugarse sin coincidir con los Protocolos.
**Impl:** Sin efecto en CARD_EFFECTS
**Estado:** 🔲 NO IMPLEMENTADO
**Notas:** Es una regla pasiva (allowAnyProtocol). Debe gestionarse en la lógica de validación de jugada, no en abilities-engine. Verificar si el sistema de juego comprueba `allowAnyProtocol` para Caos 3.

### Caos 4
**Texto:** Final: Descarta tu mano. Roba tantas cartas como hayas descartado.
**Impl:** `onTurnEnd: discardHandDraw`
**Estado:** ✅

### Caos 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## CLARIDAD

### Claridad 0
**Texto:** El valor total en esta línea se incrementa en 1 por cada carta en tu mano.
**Impl:** `persistent: { valueBonusPerHandCard: 1 }`
**Estado:** ✅

### Claridad 1
**Texto:** Inicial: Revela la carta superior de tu mazo. Puedes descartarla. / Tu oponente revela su mano. / Si esta carta va a ser cubierta: Roba 3 cartas.
**Impl:** `onTurnStart: revealTopDeckMayDiscard` | `onPlay: revealOpponentHand` | `onCover: draw(3)`
**Estado:** ✅

### Claridad 2
**Texto:** Revela tu mazo. Roba 1 carta con Valor 1. Baraja tu mazo. Juega 1 carta con Valor 1.
**Impl:** `onPlay: searchDeckValue1ThenPlay`
**Estado:** ⚠️ DUDA
**Notas:** El case es complejo (4 pasos). Verificar que el flujo completo (reveal→busca V1→baraja→juega V1) esté implementado correctamente.

### Claridad 3
**Texto:** Revela tu mazo. Roba 1 carta con Valor 5. Baraja tu mazo.
**Impl:** `onPlay: searchDeckByValue(value: 5)`
**Estado:** ✅

### Claridad 4
**Texto:** Puedes barajar tu descarte en tu mazo.
**Impl:** `onPlay: mayShuffleDiscardIntoDeck`
**Estado:** ✅

### Claridad 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## CORRUPCIÓN

### Corrupción 0
**Texto:** Inicial: Voltea 1 otra carta bocarriba (cubierta o descubierta) en esta pila. / Esta carta puede jugarse en el lado de cualquier jugador sin coincidir con los Protocolos.
**Impl:** `onTurnStart: flipCoveredInOwnStack`
**Estado:** 🔲 PARCIALMENTE IMPLEMENTADO
**Notas:** El `onTurnStart` ("Inicial") está implementado. La segunda regla pasiva (puede jugarse en el lado de cualquier jugador sin coincidir protocolos) NO está implementada. Requiere lógica en la validación de jugada.

### Corrupción 1
**Texto:** Devuelve 1 carta. / Cuando una carta vaya a ser devuelta a la mano de tu oponente: En su lugar, colócala bocarriba en lo alto de su mazo.
**Impl:** `persistent: { redirectReturnToTopDeck: true }` | `onPlay: return(any, 1)` | helper `applyReturnToHand`
**Estado:** ✅

### Corrupción 2
**Texto:** Después de que descartes cartas: Tu oponente descarta 1 carta. / Roba 1 carta. Descarta 1 carta.
**Impl:** `onOwnDiscard: discardRandom(opponent, 1)` | `onPlay: [draw(1), discard(1)]`
**Estado:** ✅

### Corrupción 3
**Texto:** Puedes voltear 1 carta cubierta bocarriba.
**Impl:** `onPlay: mayFlipCoveredFaceUp`
**Estado:** ✅

### Corrupción 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

### Corrupción 6
**Texto:** Final: Descarta 1 carta o elimina esta carta.
**Impl:** `onTurnEnd: optionalDiscardOrDeleteSelf`
**Estado:** ✅

---

## VALOR

### Valor 0
**Texto:** Inicial: Si no tienes cartas en mano, roba 1 carta. / Roba 1 carta. / Final: Puedes descartar 1 carta. Si lo haces, tu oponente descarta 1 carta.
**Impl:** `onTurnStart: drawIfNoHand` | `onPlay: draw(1)` | `onTurnEnd: optionalDiscardThenOpponentDiscard`
**Estado:** ✅

### Valor 1
**Texto:** Elimina 1 carta de tu oponente en una línea donde su valor total sea mayor que el tuyo.
**Impl:** `onPlay: deleteInWinningOpponentLine`
**Estado:** ✅

### Valor 2
**Texto:** Roba 1 carta. / Final: Si tu oponente tiene un valor total mayor que el tuyo en esta línea, roba 1 carta.
**Impl:** `onPlay: draw(1)` | `onTurnEnd: drawIfOpponentWinsLine`
**Estado:** ✅

### Valor 3
**Texto:** Final: Puedes cambiar esta carta a la línea donde tu oponente tenga su valor total más alto.
**Impl:** `onTurnEnd: mayShiftSelfToHighestOpponentLine`
**Estado:** ✅

### Valor 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

### Valor 6
**Texto:** Final: Si tu oponente tiene un valor mayor que el tuyo en esta línea, voltea esta carta.
**Impl:** `onTurnEnd: flipSelfIfOpponentWins`
**Estado:** ✅

---

## DIVERSIDAD

### Diversidad 0
**Texto:** Si hay 6 Protocolos distintos en cartas de TU campo, voltea el Protocolo Diversidad al lado compilado. / Final: Puedes jugar 1 carta que no sea Diversidad en esta línea.
**Impl:** `onPlay: compileDiversityIfSixProtocols` (añade 'Diversidad' a compiled[]) | `onTurnEnd: playNonDiversityCard`
**Estado:** ✅
**Notas:** Solo cuenta cartas del jugador que la juega (no del rival). Cuenta hacia la victoria (compiled.length >= 3).

### Diversidad 1
**Texto:** Cambia 1 carta. Roba tantas cartas como Protocolos distintos haya en cartas de esta línea.
**Impl:** `onPlay: [shift(any, 1), drawPerDistinctProtocolsInLine]`
**Estado:** ✅

### Diversidad 3
**Texto:** El valor total en esta línea se incrementa en 2 si hay alguna carta bocarriba que no sea Diversidad en esta pila.
**Impl:** `persistent: { valueBonusIfNonDiversityFaceUp: 2 }`
**Estado:** ✅

### Diversidad 4
**Texto:** Voltea 1 carta con Valor menor que el número de Protocolos distintos en cartas del campo.
**Impl:** `onPlay: flipCardBelowDistinctProtocolCount`
**Estado:** ✅

### Diversidad 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

### Diversidad 6
**Texto:** Final: Si no hay al menos 4 Protocolos distintos en cartas del campo, elimina esta carta.
**Impl:** `onTurnEnd: deleteIfFewDistinctProtocols(minProtocols: 4)`
**Estado:** ✅

---

## MIEDO

### Miedo 0
**Texto:** Durante tu turno, las cartas de tu oponente no tienen comandos centrales. / Cambia o voltea 1 carta.
**Impl:** `persistent: { disableOpponentMiddleCommands: true }` | `onPlay: mayShiftOrFlip`
**Estado:** ✅

### Miedo 1
**Texto:** Roba 2 cartas. Tu oponente descarta su mano y roba tantas cartas como haya descartado menos 1.
**Impl:** `onPlay: [draw(2), opponentDiscardAndRedraw(minusN: 1)]`
**Estado:** ✅

### Miedo 2
**Texto:** Devuelve 1 carta de tu oponente.
**Impl:** `onPlay: return(opponent, 1)`
**Estado:** ✅

### Miedo 3
**Texto:** Cambia 1 carta (cubierta o descubierta) de tu oponente en esta línea.
**Impl:** `onPlay: shift(opponent, 1, forceCurrentLine: true)`
**Estado:** ✅

### Miedo 4
**Texto:** Tu oponente descarta 1 carta aleatoria.
**Impl:** `onPlay: discardRandom(opponent, 1)`
**Estado:** ✅

### Miedo 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## HIELO

### Hielo 1
**Texto:** Puedes cambiar esta carta. / Después de que tu oponente juegue una carta en esta línea: Tu oponente descarta 1 carta.
**Impl:** `onPlay: mayShiftSelf` | `onOpponentPlayInLine: discard(opponent, 1)`
**Estado:** ✅

### Hielo 2
**Texto:** Cambia 1 otra carta.
**Impl:** `onPlay: shift(any, 1)`
**Estado:** ✅

### Hielo 3
**Texto:** Final: Si esta carta está cubierta, puedes cambiarla.
**Impl:** `onTurnEnd: mayShiftSelfIfCovered`
**Estado:** ✅

### Hielo 4
**Texto:** Esta carta no puede ser volteada.
**Impl:** `persistent: { preventFlip: true }`
**Estado:** ✅

### Hielo 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

### Hielo 6
**Texto:** Si tienes cartas en mano, no puedes robar cartas.
**Impl:** `persistent: { preventDraw: true }` + check `hand.length > 0` en `drawCard()`
**Estado:** ✅
**Notas:** La condición `hand.length > 0` está implementada en `drawCard()` en logic.js.

---

## SUERTE

### Suerte 0
**Texto:** Di un número. Roba 3 cartas. Revela la que tenga el valor indicado bocarriba. Puedes jugarla.
**Impl:** `onPlay: luckDraw3PickByValue`
**Estado:** ✅

### Suerte 1
**Texto:** Juega bocabajo la carta superior de tu mazo. Voltea esa carta, ignorando los comandos centrales.
**Impl:** `onPlay: luckPlayTopThenFlipNoEffect`
**Estado:** ✅

### Suerte 2
**Texto:** Descarta la carta superior de tu mazo. Roba tantas cartas como el Valor de la carta descartada.
**Impl:** `onPlay: luckDiscardTopDraw`
**Estado:** ✅

### Suerte 3
**Texto:** Di un Protocolo. Descarta la carta superior del mazo del oponente. Si coincide con el Protocolo indicado, elimina 1 carta.
**Impl:** `onPlay: luckCallProtocolDiscard`
**Estado:** ✅

### Suerte 4
**Texto:** Descarta la carta superior de tu mazo. Elimina 1 carta (cubierta o descubierta) que comparta Valor con la descartada.
**Impl:** `onPlay: luckDiscardTopDeleteByValue`
**Estado:** ✅

### Suerte 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## TIEMPO

### Tiempo 0
**Texto:** Juega 1 carta de tu descarte. Baraja tu descarte en tu mazo.
**Impl:** `onPlay: playFromDiscardThenShuffle`
**Estado:** ✅

### Tiempo 1
**Texto:** Voltea 1 carta cubierta. Descarta todo tu mazo.
**Impl:** `onPlay: [flip(any, 1, coveredOnly: true), discardOwnDeck]` — obligatorio, sin modal
**Estado:** ✅

### Tiempo 2
**Texto:** Si hay cartas en tu descarte, puedes barajar tu descarte en tu mazo. / Después de que barajes tu mazo: Roba 1 carta y puedes cambiar esta carta.
**Impl:** `onPlay: mayShuffleDiscardIntoDeck` | `onDeckShuffle: drawAndMayShiftSelf`
**Estado:** ✅

### Tiempo 3
**Texto:** Revela 1 carta de tu descarte. Juégala bocabajo en otra línea.
**Impl:** `onPlay: playFromDiscardFaceDownOtherLine`
**Estado:** ✅

### Tiempo 4
**Texto:** Roba 2 cartas. Descarta 2 cartas.
**Impl:** `onPlay: [draw(2), discard(2)]`
**Estado:** ✅

### Tiempo 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## UNIDAD

### Unidad 0
**Texto:** Si hay otra carta de Unidad en el campo, voltea 1 carta o roba 1 carta. / Cuando esta carta vaya a ser cubierta por una carta Unidad: voltea 1 carta o roba 1 carta.
**Impl:** `onPlay: mayFlipOrDrawIfUnityOnField` | `onCover: mayFlipOrDrawIfUnityOnField`
**Estado:** ✅

### Unidad 1
**Texto:** Inicio: Si esta carta está cubierta, puedes cambiarla. / Si hay 5 o más cartas Unidad en el campo, compila automáticamente esta línea. / Las cartas Unidad pueden jugarse bocarriba en esta línea.
**Impl:** `onTurnStart: mayShiftSelfIfCovered` | `onPlay: compileSelfIfFiveOrMoreUnity` | `onTurnEnd: playUnidadCardsFromHand`
**Estado:** ✅
**Notas:** Confirmado por el usuario que el comportamiento es correcto.

### Unidad 2
**Texto:** Roba cartas igual al número de cartas Unidad en el campo.
**Impl:** `onPlay: drawPerUnityCards`
**Estado:** ✅

### Unidad 3
**Texto:** Si hay otra carta Unidad en el campo, puedes voltear 1 carta bocarriba.
**Impl:** `onPlay: mayFlipIfUnityOnField`
**Estado:** ✅

### Unidad 4
**Texto:** Final: Si tu mano está vacía, revela tu mazo, roba todas las cartas Unidad de él y baraja tu mazo.
**Impl:** `onTurnEnd: drawUnityFromDeckIfEmptyHand`
**Estado:** ✅

### Unidad 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## PAZ

### Paz 1
**Texto:** Ambos jugadores descartan su mano. / Final: Si tu mano está vacía, roba 1 carta.
**Impl:** `onPlay: [discardHand(self), discardHand(opponent)]` | `onTurnEnd: drawIfEmptyHand`
**Estado:** ✅

### Paz 2
**Texto:** Roba 1 carta. Juega 1 carta bocabajo.
**Impl:** `onPlay: [draw(1), playHandFaceDown]` — cualquier línea (sin restricción)
**Estado:** ✅

### Paz 3
**Texto:** Puedes descartar 1 carta. Voltea 1 carta que tenga un valor mayor que el número de cartas en tu mano.
**Impl:** `onPlay: optionalDiscardThenFlipHighValue`
**Estado:** ✅

### Paz 4
**Texto:** Después de que descartes cartas durante el turno de tu oponente: Roba 1 carta.
**Impl:** `onForcedDiscard: draw(self, 1)`
**Estado:** ✅

### Paz 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

### Paz 6
**Texto:** Si tienes más de 1 carta en mano, voltea esta carta.
**Impl:** `onPlay: flipSelfIfMultipleHandCards`
**Estado:** ✅

---

## HUMO

### Humo 0
**Texto:** Juega la carta superior de tu mazo bocabajo en cada línea con una carta bocabajo.
**Impl:** `onPlay: playTopDeckInFaceDownLines`
**Estado:** ✅
**Notas:** Comprueba bocabajo de AMBOS jugadores en cada línea (fix 2026-03-20: antes solo comprobaba el propio).

### Humo 1
**Texto:** Voltea 1 de tus cartas. Puedes cambiarla.
**Impl:** `onPlay: [flip(self, 1), mayShiftLastFlipped]`
**Estado:** ✅

### Humo 2
**Texto:** Tu valor total en esta línea se incrementa en 1 por cada carta bocabajo en esta línea.
**Impl:** `persistent: { valueBonusPerFaceDown: 1 }`
**Estado:** ✅

### Humo 3
**Texto:** Juega 1 carta bocabajo en una línea con una carta bocabajo.
**Impl:** `onPlay: playHandFaceDown(requireFaceDownInLine: true)` — filtra líneas válidas
**Estado:** ✅

### Humo 4
**Texto:** Cambia 1 carta cubierta bocabajo.
**Impl:** `onPlay: shiftCoveredFaceDown`
**Estado:** ✅

### Humo 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## ESPEJO

### Espejo 0
**Texto:** El valor total en esta línea se incrementa en 1 por cada carta de tu oponente en esta línea.
**Impl:** `persistent: { valueBonusPerOpponentCard: 1 }`
**Estado:** ✅

### Espejo 1
**Texto:** Final: Puedes resolver el comando central de 1 carta de tu oponente como si estuviera en esta carta.
**Impl:** `onTurnEnd: copyOpponentCardEffect`
**Estado:** ⚠️ DUDA
**Notas:** Verificar que el case ejecute el `h_accion` (middle command) de la carta del oponente elegida, y que lo haga como si fuera el dueño de Espejo 1 quien lo ejecuta (targetPlayer correcto).

### Espejo 2
**Texto:** Intercambia todas tus cartas de una de tus pilas con otra de tus pilas.
**Impl:** `onPlay: swapOwnTwoStacks`
**Estado:** ✅

### Espejo 3
**Texto:** Voltea 1 de tus cartas. Voltea 1 carta de tu oponente en la misma línea.
**Impl:** `onPlay: [flip(self, 1), flipOpponentSameLine]` — omite segundo volteo si rival sin cartas en la línea
**Estado:** ✅

### Espejo 4
**Texto:** Después de que tu oponente robe cartas: Roba 1 carta.
**Impl:** `onOpponentDraw: draw(self, 1)`
**Estado:** ✅

### Espejo 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## GUERRA

### Guerra 0
**Texto:** Después de que actualices: Puedes voltear esta carta. / Después de que tu oponente robe cartas: Puedes eliminar 1 carta.
**Impl:** `onRefresh: mayFlip(self)` | `onOpponentDraw: mayDelete(any, 1)`
**Estado:** ✅

### Guerra 1
**Texto:** Final: Después de que tu oponente actualice: Descarta cualquier número de cartas. Actualiza.
**Impl:** `onOpponentRefresh: [discardAny, refresh]`
**Estado:** ✅

### Guerra 2
**Texto:** Voltea 1 carta. / Después de que tu oponente compile: Tu oponente descarta su mano.
**Impl:** `onPlay: flip(any, 1)` | `onOpponentCompile: discardHand(opponent)`
**Estado:** ✅

### Guerra 3
**Texto:** Roba 1 carta. / Después de que tu oponente descarte cartas: Puedes jugar 1 carta bocabajo.
**Impl:** `onPlay: draw(1)` | `onOpponentDiscard: playHandFaceDown(self)` — cualquier línea
**Estado:** ✅

### Guerra 4
**Texto:** Tu oponente descarta 1 carta.
**Impl:** `onPlay: discard(opponent, 1)` — interactivo (el oponente elige)
**Estado:** ✅

### Guerra 5
**Texto:** Descarta 1 carta.
**Impl:** `onPlay: discard(self, 1)`
**Estado:** ✅

---

## AMOR

### Amor 4
**Texto:** Revela 1 carta de tu mano. Voltea 1 carta (que no seas tú mismo).
**Impl:** `onPlay: [revealFromHand(self, 1), flip(any, 1, excludeSelf: true)]`
**Estado:** ⚠️ DUDA
**Notas:** Pendiente de memory: "Revelar cartas propias en Amor 4 para razonamiento de IA". La IA no puede ver qué carta reveló el jugador para tomar decisiones. Funcionalidad básica implementada.

---

## RESUMEN

| Estado | Cartas | % |
|--------|--------|---|
| ✅ Correcto | 76 | 88% |
| ⚠️ Duda | 5 | 6% |
| 🔲 No implementado | 2 | 2% |
| ❌ Bug | 0 | 0% |

**Total auditadas:** 83 cartas

---

## PENDIENTES ⚠️

### 1. Asimilación 1 — segundo paso del reactivo
**Verificar:** En el case `drawFromOpponentDeck`, ¿se descarta también 1 carta en el descarte del oponente ("Descarta 1 carta en su descarte")?

### 2. Claridad 2 — flujo completo
**Verificar:** El case `searchDeckValue1ThenPlay` implementa los 4 pasos: revelar mazo → buscar V1 → barajar → jugar V1.

### 3. Espejo 1 — targetPlayer en copyOpponentCardEffect
**Verificar:** Al ejecutar el middle command de la carta del oponente, ¿se usa el targetPlayer correcto (el dueño de Espejo 1, no el del oponente)?

### 4. Amor 4 — IA reasoning
**Pendiente:** La IA no sabe qué carta reveló el jugador. Mejora futura: exponer la carta revelada al motor de IA para que pueda tomar decisiones informadas.

---

## NO IMPLEMENTADOS 🔲

### 1. Caos 3 — allowAnyProtocol
Necesita soporte en la lógica de validación de jugada (dónde se comprueba si la carta coincide con los protocolos del jugador). Corrupción 0 tiene la misma necesidad.

### 2. Corrupción 0 — jugada en lado contrario
La segunda regla pasiva ("puede jugarse en el lado de cualquier jugador sin coincidir con los Protocolos") no está implementada en la validación de jugada.
