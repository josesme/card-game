# 📖 CODEX DE COMPILE
**Fuente única de verdad para reglas, erratas y aclaraciones.**
Basado en: Compile Rules V2 (reglamento oficial) + The Compile Codex (rev. 22 SEP 2025).
Los PDFs originales han sido eliminados tras consolidar toda su información aquí.

---

## 🎯 Objetivo

Compile es un juego de cartas competitivo 1v1 donde los jugadores son IAs rebeldes que compiten por compilar sus 3 protocolos. El primero en compilar sus 3 protocolos gana.

---

## 🏗️ Preparación

### El Draft (1-2-2-1)
1. El jugador más joven elige primero (o acuerdan otro método).
2. **Jugador 1** elige 1 protocolo → coloca en su espacio **izquierdo**.
3. **Jugador 2** elige 2 protocolos → coloca en sus espacios **izquierdo y medio** (en ese orden).
4. **Jugador 1** elige 2 protocolos → coloca en sus espacios **medio y derecho**.
5. **Jugador 2** elige 1 protocolo → coloca en su espacio **derecho**.
6. Los protocolos restantes se devuelven a la caja.

> Los protocolos se colocan en posiciones fijas según el orden de draft. Cada jugador termina con exactamente 3 protocolos.

### El Mazo
Cada jugador toma las 6 cartas de comando de cada uno de sus 3 protocolos y las baraja juntas → **mazo de 18 cartas**.

### El Campo
- Cada jugador coloca sus protocolos en el centro, lado "Loading...", de izquierda a derecha en el orden del draft.
- Esto forma **3 líneas**, cada una definida por los dos protocolos opuestos en esa línea.
- Cada jugador coloca su mazo a un lado, con espacio designado para el descarte (trash).
- Cada jugador roba una **mano inicial de 5 cartas**.

---

## 🔄 Turno de Juego

El jugador que eligió primero en el draft va primero. El Control Component comienza en posición neutral.

> ⚠️ **Regla Avanzada △**: El Control Component se ignora en la primera partida. Ver sección específica.

### Orden de Fases

1. **Inicio (Start):** Se realizan los efectos de "Inicio" en tu lado del campo.
2. **Verificar Control △:** Si tienes un valor total mayor que tu oponente en al menos 2 líneas, **obtienes el Control Component**.
3. **Verificar Compilación:** Si cumples las condiciones para compilar, **debes compilar**. Esta es tu única acción del turno.
4. **Acción:** Juega 1 carta O actualiza tu mano. Si no tienes cartas para jugar, **debes** actualizar.
5. **Verificar Caché:** Si tienes más de 5 cartas en mano, descarta hasta tener 5.
6. **Fin (End):** Se realizan los efectos de "Fin" en tu lado del campo.

> Los efectos de Fin que se revelan **durante** esa fase no se activan. Solo los visibles al comienzo de la fase.

### Acciones

**Jugar una carta:** Juega una carta de tu mano en una línea de tu lado del campo. Puede jugarse:
- **Boca arriba (face-up):** Solo en la línea cuyo protocolo coincida con el de la carta. Se resuelven sus efectos activos (texto del medio).
- **Boca abajo (face-down):** En cualquier línea. Valor base = **2**, independientemente del valor impreso.

**Actualizar:** Roba cartas de tu mazo hasta tener 5 en mano. Si el mazo se vacía, baraja el descarte para formar uno nuevo y completa el robo. **No puedes actualizar con 5 o más cartas en mano.**

**Compilar:** Ver sección de Compilación.

---

## ⚡ Compilación

Durante la fase "Verificar Compilación": si tienes **valor ≥ 10** en una línea **Y** ese valor es **mayor que el de tu oponente** en la misma línea, **debes compilar** esa línea.

**Proceso:**
1. El jugador que compila elimina **todas** las cartas de la línea — tanto las suyas como las del oponente — y van al descarte de su propietario original.
2. Voltea tu carta de protocolo en esa línea al lado "Compiled".

**Restricciones:**
- Solo puedes compilar **una línea por turno**, aunque cumplas condiciones en varias.
- Compilar es **obligatorio** si puedes hacerlo.

**Recompilar:** Si compilas una línea con tu protocolo que ya está compilada:
- Se eliminan todas las cartas como de costumbre.
- En lugar de voltear el protocolo (ya está compilado), **robas la carta superior del mazo de tu oponente**. Ahora eres su propietario.
- El robo activa el barajado del mazo del oponente si está vacío.

> Durante la compilación, **todas las cartas se eliminan simultáneamente** sin activar efectos.

> ⚠️ `Diversidad 0` y `Unidad 1` **no son compilaciones** — no activan ventanas "After compile", no interactúan con `Guerra 2` o `Velocidad 2`, y no activan el Control Component. Tampoco generan el robo de recompilación.
> - `Diversidad 0`: voltea el protocolo a compilado **sin borrar cartas**. Si ya está compilado por el mismo jugador, no hace nada.
> - `Unidad 1`: **siempre borra** todas las cartas de la línea al disparar, incluso si la línea ya estaba compilada por el mismo jugador. En ese caso solo borra (no cambia el protocolo ni genera recompilación).

---

## △ Control Component (Regla Avanzada)

> Ignorar en la primera partida.

**Ganar el Control Component:** En la fase "Verificar Control", si tienes valor total mayor que tu oponente en **al menos 2 líneas**, obtienes el Control Component.

**Usar el Control Component:** Cuando un jugador **compila o actualiza**, si ese jugador tiene el Control Component:
1. El Control Component se devuelve a la posición neutral.
2. Ese jugador puede **reorganizar los protocolos de un jugador** (cualquiera de los dos).

**Reglas al reorganizar protocolos:**
- Solo cambian de posición, **no de lado**.
- Las cartas en las líneas de esos protocolos **no se mueven**.
- El jugador **debe hacer algún cambio** — no puede dejar los protocolos en la misma posición.
- La reorganización ocurre **antes** de compilar (o de actualizar). El jugador no ve su nueva mano antes de reordenar.
- Es válido reordenar protocolos para elegir qué línea compilar a continuación.

> El Control Component se restablece al compilar o actualizar **incluso si no se usa** para reorganizar.

> **No puedes usar el Control Component si no puedes actualizar** (es decir, si tienes 5 o más cartas en mano).

**Estado en el juego digital:** ❌ **NO IMPLEMENTADO**. Falta la fase "Verificar Control" en el ciclo de turno y toda la mecánica de reorganización vinculada al Control Component.

---

## 📋 Reglas Generales

### Pilas y Cobertura
- Las cartas jugadas en líneas que ya tienen cartas las **cubren**.
- La carta **descubierta** (uncovered) es la que está en el extremo de la pila, más alejada del protocolo — es la **única que puede ser manipulada** en esa línea, salvo que un efecto especifique "cartas cubiertas" o "todas las cartas".
- Una carta cubierta **no puede descubrirse** mientras está en una pila. Solo la carta superior está descubierta.
- El valor y el comando superior (Persistent) son siempre visibles aunque la carta esté cubierta.
- Un jugador puede mirar sus propias cartas boca abajo, **no las del oponente**.
- Los cementerios son **información pública** — cualquier jugador puede consultarlos en cualquier momento.
- Las cartas boca abajo en el campo valen **2**, independientemente de su valor impreso.
- El valor de una línea puede ser **negativo** (es un estado válido — p.ej. Metal 0 reduce el valor de la pila a -2).

### "All Cards" (Todas las cartas)
"All cards" se refiere exclusivamente a cartas **en el campo** (cubiertas y descubiertas). No incluye cartas en la mano, mazo o cementerio.

### Efectos Iniciales y Finales (Start/End)
**"Inicial:" y "Final:"** están en el slot persistente y se rigen por estas reglas:
- Todos los efectos "Inicial:" y "Final:" se activan **al inicio de su fase respectiva**, y solo entonces.
- Si una carta con efecto "Final:" se revela o juega **durante** la fase Final, **no se activa**.
- Si un efecto "Final:" activo descubre otra carta con "Final:", esa segunda **no se activa** (la ventana ya pasó).
- Si una carta "Final:" queda cubierta durante la resolución del End step, **su efecto se cancela**.
- Con **múltiples efectos activos** al inicio de la fase, el jugador en turno los recoge todos y elige **uno a la vez** en el orden que prefiera. Las condiciones se evalúan **al procesar** cada trigger, no al inicio de la fase.
- Implementación: `onTurnStartEffects` registra IDs en `gameState.armedEndEffects`; `onTurnEndEffects` solo dispara para IDs armados y aún presentes.

### Activación del Comando Central
El comando central (texto del medio) de una carta se activa en **3 casos**:
1. **Al jugarse boca arriba** — durante la fase de acción.
2. **Al voltearse de bocabajo a bocarriba** — por cualquier efecto de volteo.
3. **Al descubrirse** — cuando la carta que la cubría es eliminada, desplazada o devuelta.

> **Excepción:** Suerte 1 voltea la carta "sin comandos centrales" (regla de carta).

> Solo se activa si la carta es la **descubierta** (top de la pila). Una carta cubierta que se voltea bocarriba no activa su comando central.

### Texto al Entrar en Juego
Cuando el texto de una carta entra en juego (al jugarse, voltearse o descubrirse), el **propietario** de esa carta decide cómo se resuelve.

### Cartas Comprometidas (Committed Cards)
Cuando una carta se mueve entre zonas (mano/mazo → campo, desplazamiento, eliminación al descarte), primero **abandona su zona actual** y queda "comprometida" hacia la nueva zona. Las consecuencias de abandonar la zona anterior (p. ej. descubrir la carta de debajo y activar su comando central) se resuelven **antes** de que la carta comprometida aterrice.

Un shift tiene dos partes: **leaving** (recoger la carta, puede descubrir la de debajo) y **landing** (aterrizar en la pila destino, puede cubrir la carta de encima de destino). Una carta desplazada siempre queda como la **descubierta** (top) de la pila destino.

- Mientras está comprometida (en tránsito), la carta **no puede ser manipulada** por ningún efecto.
- Las cartas comprometidas **no están en el campo** — no cuentan para valores de línea ni para efectos de `Unity`.
- Nada puede impedir que una carta comprometida entre en la zona a la que fue comprometida.
- Si la carta comprometida va a cubrir una carta con texto "Cuando esta carta vaya a ser cubierta: primero…", ese efecto se resuelve antes de que aterrice. Durante ese efecto, la carta comprometida **no es selección válida**.
- Varias cartas pueden estar comprometidas a una línea al mismo tiempo; la cola es **FIFO** — la primera committed aterriza, activa sus efectos, y solo entonces aterriza la siguiente.

### Efectos "After" (Después de)
Un efecto que dispara "después de" algo ocurre cuando el efecto desencadenante **y todas sus consecuencias** han terminado completamente. Ejemplo: "Después de que tu oponente compila:" — los pasos compile+control+eliminar+voltear protocolo finalizan antes de que este efecto dispare. No es necesario que el texto "After" estuviera visible al inicio del efecto desencadenante, solo al llegar a esa ventana.

### Resolución de Efectos (LIFO / FIFO)
- Cuando un texto activo entra en juego (al jugarse, voltearse boca arriba o descubrirse), se resuelve **interrumpiendo cualquier otro texto hasta completarse**.
- **Último en entrar, primero en salir (LIFO)** — es el orden general del juego.
- **Excepción: la cola de committed usa FIFO** — la primera carta comprometida aterriza primero.
- Si varios efectos se resolverían simultáneamente, el **jugador en turno** decide el orden, independientemente de quién posea las cartas.
- Un texto activo que queda cubierto, volteado o eliminado **deja de estar activo**, aunque quedara texto pendiente.

### Objetivos de Efectos
- Salvo indicación contraria, un efecto puede seleccionar cualquier carta **descubierta en cualquier lado del campo**.
- El **propietario** de la carta determina cómo se aplica el efecto cuando se resuelve.

### Información Pública
- Un jugador puede mirar las cartas boca abajo en **su propio lado** del campo.
- Las cartas boca arriba en el campo, el contenido del descarte, y el número de cartas en mano/mazo/descarte de cada jugador son **información pública**.
- Cuando una carta se descarta o elimina, se coloca **boca arriba** en el descarte de su propietario.

### Mazo Vacío
- Cuando necesitas robar y tu mazo está vacío, **baraja el descarte para formar uno nuevo**.
- Solo el robo desencadena esta reconstrucción — los efectos que involucran la carta superior del mazo (sin robar) **fizzlean** si el mazo está vacío.
- Si robas del mazo del oponente y está vacío, se baraja **su** descarte.
- Un draw no se interrumpe por el barajado — si el mazo se agota a mitad de un robo múltiple, se baraja el descarte y se continúa.
- Barajar un mazo con 0 o 1 carta **no activa** triggers de "After you shuffle" (el estado del juego no cambia realmente).

### Propiedad de Cartas
- Si una carta cambia de propietario, mantiene su nueva propiedad hasta el fin de la partida o hasta que cambie de nuevo.

### Protocolos
- Al reorganizar, intercambiar o mover protocolos, **solo se mueve la carta de protocolo**, no las cartas en su línea o pila.
- Al reorganizar protocolos, **se debe hacer algún cambio** — no puede quedar igual.

### Regla Meta
> "Los efectos en las cartas pueden y romperán estas reglas. Las cartas tienen razón."

---

## 📖 Glosario de Términos

| Término | Definición |
|---|---|
| **Compilar** | Eliminar todas las cartas de una línea en ambos lados y voltear un protocolo. |
| **Cubierta** | Carta con otra carta encima de ella. |
| **Descubierta** | La carta en el extremo de una pila, más alejada del protocolo. |
| **Eliminar** | Mover una carta del campo al descarte. |
| **Descartar** | Mover una carta de la mano al descarte del propietario. El jugador **elige** qué carta. |
| **Robar** | El propietario toma X cartas superiores de su mazo y las añade a su mano. Si el mazo se vacía, baraja el descarte y completa. |
| **Voltear** | Cambiar la orientación de boca abajo a boca arriba, o viceversa. |
| **Línea** | Zona de juego a través de dos protocolos opuestos. El campo tiene 3 líneas. |
| **Pila** | Las cartas en una línea en el lado de un jugador. |
| **Protocolo** | La cabecera que dicta en qué línea se pueden jugar cartas boca arriba. |
| **Reorganizar** | Cambiar la posición de protocolos. |
| **Actualizar** | Robar hasta tener 5 cartas en mano. Requiere tener menos de 5 cartas. |
| **Devolver** | Mover una carta del campo a la mano de su propietario. |
| **Revelar** | Mostrar información oculta a ambos jugadores y devolverla a su estado anterior (ej. volver boca abajo). Sin efecto permanente. |
| **Desplazar** | Mover una carta a otra línea en el mismo lado del campo. |
| **Limpiar Caché** | Descartar hasta tener 5 cartas en mano. |
| **Descarte** | Zona donde van las cartas descartadas y eliminadas. Se baraja para reconstruir el mazo cuando es necesario. |
| **Todas** | Afecta a todas las cartas válidas **simultáneamente**. |
| **Cada** | Aplica los efectos **una por una**, en secuencia. |

---

## ❓ FAQ

**¿Debo compilar si puedo?**
Sí, es obligatorio.

**¿Puedo compilar más de una línea si varias califican?**
No. Solo una línea por turno.

**¿Puedo actualizar con 5 o más cartas en mano?**
No. Solo si tienes menos de 5.

**¿Se activan efectos durante la compilación al eliminar cartas?**
No. Todas las cartas se eliminan simultáneamente sin activar efectos.

**¿Puedo compilar en una línea que mi oponente ya ha compilado?**
Sí (recompilar). No ganas un nuevo protocolo, pero robas la carta superior del mazo rival.

**¿El Actualizar cuenta como Draw para efectos tipo "After you draw"?**
Sí. Actualizar cuenta como draw.

**¿Devolver una carta a la mano cuenta como Draw?**
No. "Return" (devolver) no es draw.

**¿Puedo Actualizar si tengo exactamente 5 cartas en mano?**
No. Solo puedes actualizar si tienes menos de 5 cartas (robarías al menos 1).

**¿Puede el valor de una línea ser negativo?**
Sí. Un valor negativo es válido y gana la línea si es mayor (menos negativo) que el del oponente.

**¿Si un efecto no puede cambiar el estado del juego, ocurre algo?**
No. Si un efecto no puede cambiar el estado del juego, no ocurre nada y las ventanas "After" asociadas no se abren.

**¿Qué significa "revelar"?**
Mostrar a ambos jugadores la información revelada y devolverla a su estado anterior. No tiene efecto permanente.

**¿Puede una carta con comando superior eliminarse a sí misma si está cubierta?**
Sí. Mientras esté boca arriba, sus efectos aplican aunque esté cubierta.

**¿Puedo mirar cartas que juego desde la parte superior del mazo antes de colocarlas boca abajo?**
No. Solo puedes verlas después de estar en el campo.

**¿Cómo funciona la selección de cartas del descarte o mazo (Tiempo 0/3, Claridad 3)?**
Estas cartas abren un modal "revelar" que muestra las cartas disponibles. El jugador elige una haciendo click (se marca con ✓) y pulsa el botón de acción. Las cartas no elegidas se barajan de vuelta en el mazo (o permanecen en descarte según el efecto). **Las cartas no pasan por la mano** en ningún momento.

**¿Si un efecto descarta una carta que no está en la mano, se activa Plaga 1 u efectos similares?**
Sí. "Descartar" incluye cualquier descarte, salvo que se especifique lo contrario.

**¿Cuándo se reconstruye el mazo?**
Cuando está vacío y necesitas robar. Se baraja el descarte para formar uno nuevo. Esto aplica a **cualquier robo**, incluyendo robos del oponente (re-compilación, efectos de carta): si al robar de tu mazo este está vacío, tu descarte se baraja primero.

**¿Limpiar Caché dispara efectos de descarte?**
Sí. Descartar cartas para reducir la mano a 5 dispara efectos reactivos como `onOpponentDiscard` (ej. Plaga 1) y `onOwnDiscard` (ej. Corrupción 2). No dispara `onForcedDiscard` (ej. Paz 4), ya que ese trigger requiere que el descarte ocurra durante el turno del oponente.

**¿Cero es un número par?**
Sí.

**¿Cuál es la diferencia entre "Línea" y "Pila"?**
Una línea es 1/3 del campo, compuesta por 2 protocolos. Una pila es la parte de la línea perteneciente a un jugador.

**¿Debo usar el Control Component al compilar o actualizar?**
Se restablece a neutral automáticamente incluso si no lo usas para reorganizar.

**¿Cuál es la diferencia entre "Todas" y "Cada"?**
"Todas" afecta a todas las cartas válidas simultáneamente. "Cada" aplica los efectos una por una.

**¿Puedo activar efectos de Fin que se revelan durante esa fase?**
No. Solo los visibles al comienzo de la fase.

**¿Una carta cubierta puede descubrirse mientras está en una pila?**
No. Solo la carta superior de una pila está descubierta.

---

## 🃏 Erratas y Aclaraciones por Carta

### 🟣 Espíritu (Spirit)

**Espíritu 0**
- Actualizar como indica la carta es una acción normal, incluyendo el uso del Control Component.
- ACLARACIÓN: Espíritu 3, al desplazarse, queda committed — mientras está committed no es un objetivo válido para nuevos desplazamientos, rompiendo cualquier posible bucle.

**Espíritu 1**
- ERRATA (10/2024) — Comando superior: *"Cuando juegas cartas boca arriba, pueden jugarse sin coincidir con protocolos."*
- Mientras esté boca arriba y descubierta, permite jugar cualquier carta boca arriba en cualquier línea.

---

### 🔴 Muerte (Death)

**Muerte 0**
- ACLARACIÓN: Cuando su comando medio dispara, el propietario anota las líneas afectadas. Luego elige en qué orden procesarlas, una a una. En cada línea, selecciona una carta descubierta para eliminar y resuelve las consecuencias antes de pasar a la siguiente línea.

**Muerte 1**
- ERRATA (10/2024) — Comando superior: *"Inicio: Puedes robar 1 carta. Si lo haces, elimina 1 carta adicional. Luego, elimina esta carta."*
- No puede ser movida, volteada ni eliminada por efectos externos. Solo se elimina mediante su propio texto.

**Muerte 2**
- ACLARACIÓN: "Todas las cartas con Valor 1 o 2 de una línea" afecta a **toda la pila de esa línea**, incluyendo cartas cubiertas. El calificador numérico (valor exacto) penetra la cobertura, a diferencia de efectos genéricos que solo afectan a la carta superior.
- ACLARACIÓN: El dueño de Muerte 2 debe elegir una línea donde haya al menos una carta afectable (debe cambiar el estado del juego).

---

### 🟠 Fuego (Fire)

**Fuego 0**
- ERRATA (12/2024) — Comando inferior: *"Cuando esta carta vaya a ser cubierta: primero, roba 1 carta. Luego, voltea 1 carta."*
- Efecto `onCover`: se activa cuando otra carta entra en la misma línea y va a cubrirla. El efecto se resuelve antes de que la carta cubriente aterrice.

---

### ⚖️ Gravedad (Gravity)

**Gravedad 0**
- ACLARACIÓN: Las cartas que Gravedad 0 juega no aterrizan encima de la pila — aterrizan **justo debajo de Gravedad 0**. La cola committed aplica igualmente: la carta committed no aterriza encima sino debajo de Gravedad 0.

**Gravedad 2**
- ACLARACIÓN: Desplazará la carta volteada aunque esté cubierta. El texto "esa carta" hace referencia directa a una carta específica, lo que anula la regla general de no poder manipular cartas cubiertas.

---

### 🟢 Vida (Life)

**Vida 0**
- ERRATA (10/2024) — Comando superior: *"Fin: Si esta carta está cubierta, elimínala."* No tiene comando inferior.
- ACLARACIÓN: Cuando su comando medio dispara, el propietario anota las líneas afectadas, las procesa una a una. Si Vida 0 queda cubierta durante el proceso, su comando medio se detiene.
- Jugar desde la parte superior del mazo no obliga a barajar si el mazo está vacío.
- ACLARACIÓN: La restricción "líneas donde tengas una carta" se evalúa al inicio del efecto. Una línea vacía en ese momento no califica aunque reciba cartas después.

**Vida 2**
- ACLARACIÓN: La carta seleccionada debe estar **descubierta**.

**Vida 3**
- ACLARACIÓN: La carta jugada por Vida 3 aterriza como parte normal de su acción — nada bloquea su aterrizaje.

---

### 🟡 Luz (Light)

**Luz 0**
- ACLARACIÓN: Voltea 1 carta descubierta. Luego, roba cartas igual a su **valor actual** (tras el volteo).
- FALLO/RULING: Si la carta seleccionada es eliminada durante el proceso, se sigue usando como referencia para el número de cartas a robar. Si está en el descarte, su valor es el impreso (face-up). Si fue barajada al mazo (información privada), su valor se trata como 2.

**Luz 3**
- ACLARACIÓN: Las cartas movidas boca abajo mantienen su posición relativa y se mueven a la misma línea.

---

### ⚙️ Metal

**Metal 1**
- ERRATA (12/2024) — Comando medio: *"Roba 2 cartas. Tu oponente no puede compilar en su próximo turno."*
- ACLARACIÓN: El bloqueo de compilación solo aplica si el texto de Metal 1 es **visible** (boca arriba y descubierto) cuando se activa.

**Metal 6**
- ACLARACIÓN: Si se elimina a sí misma y cubría una carta con texto activable, ese texto se activa primero.
- ACLARACIÓN: Una vez eliminada, no se puede volver a usar el comando que la volteó.

---

### 🟣 Plaga (Plague)

**Plaga 1**
- ACLARACIÓN: Limpiar caché (descartar con 5+ cartas) activa Plaga 1.

**Plaga 3**
- ACLARACIÓN: *"Voltea cada otra carta descubierta."* — Afecta todas las cartas descubiertas boca arriba en el campo (propias y del oponente), excepto a sí misma. Las cartas cubiertas están excluidas.

---

### ⏱️ Tiempo (Time)

**Tiempo 0**
- ACLARACIÓN: Baraja el mazo aunque el cementerio esté vacío (no especifica un mínimo de cartas).

**Tiempo 2**
- Dispara `onDeckShuffle` con cualquier barajado del mazo — tanto explícito (usar su propio efecto) como automático (mazo vacío durante un robo).
- ACLARACIÓN (diseñador): Si el barajado ocurre durante el **Actualizar**, el efecto dispara **después** de completar todos los robos y limpiar caché. El robo no se interrumpe a mitad.
- ACLARACIÓN: Si el **oponente** causa el barajado de tu mazo (re-compilación, efecto de carta), el trigger de Tiempo 2 **sí dispara** igualmente.

---

### 🔵 Velocidad (Speed)

**Velocidad 0**
- ACLARACIÓN: Se activa cuando una carta es desplazada desde su pila. Mientras Velocidad 0 resuelve su efecto, la carta desplazada está en estado committed y **no aterriza** hasta que Velocidad 0 termina. Si hay otra carta committed bloqueando la misma pila, espera a que esa otra aterrice primero.

**Velocidad 2**
- ACLARACIÓN: Durante la compilación, se eliminan todas las cartas simultáneamente. Velocidad 2 **se desplaza a otra línea en lugar de eliminarse**.

---

### 🔵 Agua (Water)

**Agua 1**
- ACLARACIÓN: No fuerza el barajado del descarte si el mazo está vacío.

---

### 🤝 Unidad (Unity)

**Unidad 1**
- ACLARACIÓN: Unidad 1 **nunca puede recompilar** — si la línea ya está compilada por este jugador, no voltea el protocolo ni genera el robo de recompilación, pero **siempre borra** las cartas cuando se activa su trigger.
- ACLARACIÓN: Al no ser una compilación real, **no activa el Control Component** ni interactúa con efectos tipo "After compile" (Guerra 2, Velocidad 2...).

---

### ⚔️ Odio (Hate)

**Odio 2**
- ERRATA (10/2024) — Comando medio: *"Elimina tu carta descubierta de mayor valor. Elimina la del oponente de mayor valor."*
- ACLARACIÓN: Si Odio 2 es tu carta de mayor valor descubierta, se elimina a sí misma. El segundo efecto (eliminar carta del oponente) **no se activa**.
- ACLARACIÓN: Odio 2 usa "highest value **uncovered** card" — no puede afectar cartas cubiertas.

**Odio 3**
- ACLARACIÓN: Odio 3 se activa por cada carta que elimine **su propietario**. Al compilar, el compilador borra todas las cartas; si el compilador es el oponente de Odio 3, su propietario no está borrando → Odio 3 no dispara.

---

## 🃏 Main 2 — Erratas y Aclaraciones

### 🌀 Caos (Chaos)

**Caos 0**
- ERRATA (9/2025) — Comando medio: *"Voltea 1 carta cubierta en cada línea."*
- ACLARACIÓN: Cuando dispara, el propietario anota cada línea afectada y las procesa una a una. En cada línea, selecciona una carta cubierta para voltear y resuelve las consecuencias antes de pasar a la siguiente. Las cartas cubiertas que se voltean **no activan** su comando central.
- ACLARACIÓN: Si Caos 0 voltea una Metal 6 que ya estaba cubierta (de bocabajo a bocarriba), Metal 6 permanece en el campo — el trigger "would be covered" ya pasó.

**Caos 1**

**Caos 1**
- ACLARACIÓN: Debes hacer un cambio en los protocolos de **ambos** jugadores (no solo uno).

---

### 💀 Corrupción (Corruption)

**Corrupción 2**
- ACLARACIÓN: Corrupción 2 reacciona a la keyword "discard". Se activa aunque el origen del descarte no sea la mano (ej: descartar desde la parte superior del mazo).

**Corrupción 6**
- ACLARACIÓN: Si se elimina a sí misma al final del turno, activa el comando central de la carta que estaba cubriendo.

---

### 💪 Valor (Courage)

**Valor 3**
- ACLARACIÓN: Varias líneas pueden empatar en "valor total más alto". En ese caso, el jugador elige.

### 🌈 Diversidad (Diversity)

**Diversidad 0**
- ACLARACIÓN: Bypasea las restricciones de protocolo — permite jugar cartas boca arriba en cualquier línea.
- ACLARACIÓN: La comprobación de "todos los protocolos diferentes" incluye cartas **cubiertas y descubiertas** en el campo. Las cartas boca abajo no tienen protocolo visible → cuentan como non-Diversity.
- ACLARACIÓN: La comprobación ocurre **solo al activarse el trigger**, no de forma continua.
- ACLARACIÓN: Diversidad 0 **no es una compilación** — no interactúa con Guerra 2, Velocidad 2, ni activa el Control Component.

---

### ❄️ Hielo (Ice)

**Hielo 3**
- ACLARACIÓN: Si Hielo 3 estaba descubierto al inicio del End step, su trigger se recoge aunque después quede cubierto (ej. por Valor 3). La condición "estar cubierto" solo se evalúa cuando se elige procesar ese trigger, no al recogerlo. Si se procesa Valor 3 primero (cubriendo Hielo 3) y luego se procesa Hielo 3, el efecto se activa porque en ese momento Hielo 3 está cubierto.

**Hielo 4**
- ACLARACIÓN: Hielo 4 es inmune a efectos que la apunten directamente para voltearla. Efectos que la voltean sin apuntarla (como "all") sí pueden voltearla.

**Hielo 6**
- ACLARACIÓN: Las cartas se roban en bloque. Actualizar con 0 cartas en mano roba 5 cartas.

---

### 🍀 Suerte (Luck)

**Suerte 0**
- ACLARACIÓN: La carta jugada debe ser una de las 3 cartas robadas con Suerte 0. Puede jugarse boca arriba o boca abajo.

**Suerte 1**
- ERRATA (9/2025) — Comando medio: *"Juega la carta superior de tu mazo boca abajo. Voltea esa carta, ignorando su comando central."*
- ACLARACIÓN: Solo se ignora el comando central para ese volteo concreto.

**Suerte 3**
- ERRATA (8/2025) — Comando medio: *"Declara un protocolo. Descarta la carta superior del mazo de tu oponente. Si la carta descartada coincide con el protocolo declarado, elimina 1 carta."*
- ACLARACIÓN: La carta descartada va al cementerio del **oponente** (el texto será actualizado para aclararlo).
- ACLARACIÓN: Se puede declarar cualquier protocolo del juego, incluso uno que no esté en partida (puede cambiar en futuras actualizaciones).

---

### 🪞 Espejo (Mirror)

**Espejo 1**
- ACLARACIÓN: Su texto inferior queda bloqueado por Miedo 0 porque el texto se trata "como si estuviera en esta carta", pero no hay texto que copiar porque Miedo 0 dice que "las cartas no tienen comandos centrales".

**Espejo 2**
- ACLARACIÓN: Las cartas intercambiadas mantienen sus posiciones relativas dentro de sus pilas. Cada pila debe tener al menos 1 carta para poder intercambiar — no se puede hacer swap con una línea vacía.
- ACLARACIÓN: Las cartas committed permanecen comprometidas a su pila original cuando el swap ocurre — aterrizan en la pila a la que fueron comprometidas, no en la que quedó en su lugar tras el swap.

**Espejo 3**
- ACLARACIÓN: Si Espejo 3 se voltea a sí mismo primero, el segundo volteo no ocurre.

---

### ☮️ Paz (Peace)

**Paz 1**
- ACLARACIÓN: El propietario de la carta decide qué jugador descarta su mano primero.

---

### 💨 Humo (Smoke)

**Humo 0 y Humo 3**
- ACLARACIÓN: Ambas cartas cuentan las cartas boca abajo del **oponente** para determinar qué líneas son válidas. Una línea califica si cualquiera de los dos jugadores tiene al menos una carta boca abajo en ella.
- ✅ Implementado correctamente.

---

### ⏱️ Tiempo (Time) — actualización

**Tiempo 2**
- ERRATA (8/2025) — Comando superior: *"Después de que barajes tu mazo: Roba 1 carta. Luego, puedes desplazar esta carta."*
- ACLARACIÓN confirmada: Dispara con cualquier barajado de tu mazo, independientemente de quién lo cause (incluyendo barajados provocados por el oponente).

---


