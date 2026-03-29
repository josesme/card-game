# RULES AUDIT — COMPILE Digital
**Fuente:** Canal `#rules-questions` del Discord oficial del juego
**Fecha de análisis:** Marzo 2026
**Propósito:** Identificar discrepancias entre las reglas oficiales aclaradas por el diseñador y la implementación digital actual. Este documento es para revisión antes de aplicar cambios.

---

## 🔴 CRÍTICO — Bugs confirmados o altamente probables

### C-01 · Muerte 1 no está protegida de efectos externos

**Regla oficial:** Muerte 1 no puede ser movida, volteada ni eliminada por efectos externos. Solo se elimina a sí misma mediante su propio texto.

**Estado en código:** `persistent: { immobile: true }` está definido en `abilities-engine.js:73`, pero el modificador `immobile` solo se aplica en el caso `preventProtocolMove` (Plaga 1, línea 4855). **Nunca se usa para bloquear efectos de flip/shift/eliminate sobre Muerte 1.**

**Consecuencia:** La IA o el jugador pueden voltear, cambiar de línea o eliminar Muerte 1 con cualquier efecto. Es incorrecta.

**Acción necesaria:** Leer `immobile` en los resolutores de `flip`, `shift`, `eliminate` y bloquear la carta si tiene ese modificador.

---

### C-02 · Velocidad 2 se elimina en compilación en lugar de desplazarse

**Regla oficial:** Velocidad 2 **no se elimina** cuando la línea compila. En cambio, **se desplaza a otra línea** (en lugar de eliminarse junto con el resto).

**Estado en código:** `'Velocidad 2': {}` — sin ningún efecto definido. No hay lógica de desplazamiento en la fase de compilación.

**Consecuencia:** Velocidad 2 se elimina al compilar como cualquier otra carta. Mecánica ignorada completamente.

**Acción necesaria:** En el proceso de compilación, detectar si hay Velocidad 2 en la línea que compila y desplazarla a otra línea en lugar de eliminarla.

---

### C-03 · Barajar mazo del rival cuando roba con mazo vacío

**Regla oficial:** Cualquier robo — incluyendo robos del oponente (ej. re-compilación) — fuerza el barajado del descarte si el mazo está vacío. El mazo se baraja **antes** de ejecutar el robo.

**Estado en código:** Por verificar. El barajado al robar está implementado para el jugador activo, pero no está claro si se aplica cuando el oponente roba de tu mazo (re-compilación, efectos como Espíritu 0, etc.).

**Acción necesaria:** Verificar la función `drawCard` — debe comprobar `deck.length === 0` y barajar el descarte del dueño de ese mazo antes de extraer, independientemente de quién ejecuta el robo.

---

## 🟡 IMPORTANTE — Verificar implementación

### I-01 · Tiempo 2 dispara durante el refresh en lugar de después

**Regla oficial (aclaración del diseñador):** Tiempo 2 dispara `onDeckShuffle` **después** de que el refresh completo termine, no durante. Si el refresh te da 6 cartas, primero tienes 6 cartas, luego limpias caché, luego dispara Tiempo 2. "Nada interrumpe el robo."

**Estado en código:** `onDeckShuffle` está implementado y se llama en `shuffleDeck()`. Si el refresh baraja el mazo a mitad del proceso de robo, el trigger dispararía antes de que el refresh termine.

**Acción necesaria:** Verificar que `onDeckShuffleEffects` no se llama hasta que el ciclo de robo del refresh haya completado todos sus robos.

---

### I-02 · Robo de oponente también dispara Tiempo 2

**Regla oficial:** Si el oponente baraja tu mazo (por ejemplo, al activar un efecto que te obliga a barajar), el `onDeckShuffle` de tus cartas debe dispararse.

**Estado en código:** `onDeckShuffleEffects(who)` recibe el jugador cuyo mazo se baraja. Parece correcto, pero requiere verificar que se llama también cuando el oponente provoca el barajado de tu descarte.

---

### I-03 · Limpiar caché dispara efectos de descarte

**Regla oficial:** Descartar cartas para limpiar caché (reducir mano a 5) **sí dispara** efectos reactivos como `onOpponentDiscard` y `onForcedDiscard`.

**Estado en código:** Verificar que el descarte de caché en `checkCachePhase` llama a `onOpponentDiscardEffects` y `onForcedDiscardEffects` igual que un descarte por efecto.

---

### I-04 · Luz 0 — la carta eliminada sigue contando como referencia de valor

**Regla oficial (flaw documentado por el diseñador):** Si la carta volteada por Luz 0 es eliminada durante la resolución, **aún se usa su valor como referencia** para el número de cartas a robar. Es un flaw conocido y aceptado.

**Estado en código:** Verificar que el robo de Luz 0 usa el valor de la carta volteada incluso si ya no está en mesa en ese momento. Si no, estaría robando 0 cuando la carta ha sido eliminada.

---

### I-05 · Muerte 2 puede eliminar cartas cubiertas

**Regla oficial:** Muerte 2 elimina "todas las cartas con Valor 1 o 2 de una línea". El cualificador numérico ("todas las de valor X") funciona como "all/this/that" y **sí puede afectar cartas cubiertas**, a diferencia de efectos genéricos que solo afectan a la carta superior.

**Estado en código:** Verificar que `deleteAllValueRange` en `abilities-engine.js` itera toda la pila de la línea y no solo la carta superior.

---

### I-06 · Metal 1 solo bloquea compilación si está visible

**Regla oficial:** El bloqueo de compilación de Metal 1 solo aplica si Metal 1 está bocarriba y descubierta en el momento de la compilación.

**Estado en código:** Documentado en CODEX y tiene implementación. Marcar como verificado — bajo riesgo.

---

## 🟢 ACLARACIONES — Reglas que parecen correctas pero conviene documentar

### A-01 · Cartas comprometidas no cuentan como cubiertas

**Regla oficial:** Una carta comprometida (en cola para aterrizar) no cubre a la carta debajo hasta que realmente aterriza. Los efectos de "antes de ser cubierta" siguen disparando mientras la carta superior está solo comprometida.

**Estado en código:** El sistema de `pendingLanding` / `landPendingCard` parece implementarlo correctamente.

---

### A-02 · Mazo vacío + "jugar desde el mazo" = fizzle (no barajado)

**Regla oficial:** Solo los **robos** fuerzan el barajado del descarte si el mazo está vacío. Efectos que dicen "juega la carta superior de tu mazo" simplemente no hacen nada si el mazo está vacío.

**Estado en código:** Documentado en CODEX. Verificar que `playFromDeck` en abilities-engine comprueba `deck.length > 0` antes de actuar.

---

### A-03 · Muerte 1 — errata aplicada correctamente

**Regla oficial (errata 10/2024):** "Inicio: Puedes robar 1 carta. Si lo haces, elimina 1 carta adicional. Luego, elimina esta carta."

**Estado en código:** Implementado como `optionalDrawThenDelete` en `onTurnStart`. Parece correcto — pendiente de cruzar con C-01.

---

### A-04 · Psique 1 + Velocidad 3 — combo degenerado conocido

**Regla oficial:** Este combo existe y es legítimo. El diseñador lo reconoce como potencialmente roto y sugiere house rule si molesta. No hay errata.

**Estado en código:** Si Psique 1 y Velocidad 3 están implementadas correctamente, el combo debería ser posible. No es un bug — es una decisión de diseño.

---

### A-05 · "Descartar" incluye cualquier origen

**Regla oficial:** `descartar` incluye descarte de mano, de mesa, o forzado por efecto. Todos disparan efectos reactivos de descarte (Plaga 1, etc.).

**Estado en código:** Documentado en CODEX y parece implementado. Bajo riesgo.

---

## 📋 FUERA DE ALCANCE (no implementado por diseño)

- **Control Component** — fase entera sin implementar, backlog v3.0.0
- **Unidad 1 pseudo-compilación** — no activa re-compilación ni Control. Pendiente de verificar si está correcta.
- **Escenarios de Metal 6 con cambio de propietario** — edge case contrived, el diseñador tampoco tiene ruling definitivo.

---

## Resumen de acciones por prioridad

| ID | Descripción | Prioridad |
|----|-------------|-----------|
| C-01 | Muerte 1 no protegida de efectos externos | 🔴 Alta |
| C-02 | Velocidad 2 no se desplaza al compilar | 🔴 Alta |
| C-03 | Robo del oponente no baraja tu mazo vacío | 🔴 Alta |
| I-01 | Tiempo 2 puede disparar antes de que acabe el refresh | 🟡 Media |
| I-02 | Robo del oponente no dispara Tiempo 2 propio | 🟡 Media |
| I-03 | Caché no dispara efectos de descarte | 🟡 Media |
| I-04 | Luz 0 no usa valor de carta eliminada | 🟡 Media |
| I-05 | Muerte 2 no elimina cartas cubiertas | 🟡 Media |
| I-06 | Metal 1 visibilidad | 🟢 Baja |
| A-01 | Cartas comprometidas vs. cubiertas | 🟢 Verificar |
| A-02 | Fizzle correcto en mazo vacío | 🟢 Verificar |
