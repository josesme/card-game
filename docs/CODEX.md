# 📖 CODEX DE COMPILE
**Fuente única de verdad para reglas, erratas y aclaraciones.**
Basado en: Compile Rules V2 (reglamento oficial) + Códice Oficial (rev. 16 DIC 2024).
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
1. Elimina todas las cartas de esa línea en tu lado → van a tu descarte.
2. Tu oponente elimina todas las cartas de esa línea en su lado → van a su descarte.
3. Voltea tu carta de protocolo en esa línea al lado "Compiled".

**Restricciones:**
- Solo puedes compilar **una línea por turno**, aunque cumplas condiciones en varias.
- Compilar es **obligatorio** si puedes hacerlo.

**Recompilar:** Si compilas una línea con tu protocolo que ya está compilada:
- Se eliminan todas las cartas como de costumbre.
- En lugar de voltear el protocolo (ya está compilado), **robas la carta superior del mazo de tu oponente**. Ahora eres su propietario.

> Durante la compilación, **todas las cartas se eliminan simultáneamente** sin activar efectos.

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

> El Control Component se restablece al compilar o actualizar **incluso si no se usa** para reorganizar.

**Estado en el juego digital:** ❌ **NO IMPLEMENTADO**. Falta la fase "Verificar Control" en el ciclo de turno y toda la mecánica de reorganización vinculada al Control Component.

---

## 📋 Reglas Generales

### Pilas y Cobertura
- Las cartas jugadas en líneas que ya tienen cartas las **cubren**.
- La carta **descubierta** (uncovered) es la que está en el extremo de la pila, más alejada del protocolo — es la **única que puede ser manipulada** en esa línea, salvo que un efecto especifique "cartas cubiertas" o "todas las cartas".
- Una carta cubierta **no puede descubrirse** mientras está en una pila. Solo la carta superior está descubierta.
- El valor y el comando superior (Persistent) son siempre visibles aunque la carta esté cubierta.
- **Comando superior con "Inicial:" o "Final:"**: estos efectos están en el slot persistente (h_inicio) y aplican aunque la carta esté cubierta.
  - **"Inicial:"** se dispara al inicio del turno para todas las cartas bocarriba (cubiertas o no).
  - **"Final:"** se **arma** al inicio del turno (se registran las cartas con onTurnEnd presentes en ese momento). Solo se dispara al final del turno si la carta sigue en juego y bocarriba. Consecuencias:
    - Una carta jugada durante la fase de acción **no** dispara su "Final:" ese turno (no estaba al inicio).
    - Una carta armada al inicio pero eliminada/compilada antes del final **no** dispara su "Final:" (ya no está en juego).
  - Implementación: `onTurnStartEffects` registra IDs en `gameState.armedEndEffects`; `onTurnEndEffects` solo dispara para IDs armados y aún presentes.

### Activación del Comando Central
El comando central (texto del medio) de una carta se activa en **3 casos**:
1. **Al jugarse boca arriba** — durante la fase de acción.
2. **Al voltearse de bocabajo a bocarriba** — por cualquier efecto de volteo.
3. **Al descubrirse** — cuando la carta que la cubría es eliminada, desplazada o devuelta.

> **Excepción:** Suerte 1 voltea la carta "sin comandos centrales" (regla de carta).

> Solo se activa si la carta es la **descubierta** (top de la pila). Una carta cubierta que se voltea bocarriba no activa su comando central.

### Resolución de Efectos (LIFO)
- Cuando un texto activo entra en juego (al jugarse, voltearse boca arriba o descubrirse), se resuelve **interrumpiendo cualquier otro texto hasta completarse**.
- **Último en entrar, primero en salir (LIFO).**
- Si varios efectos se resolverían simultáneamente, el jugador en turno decide el orden.
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
- Solo el robo desencadena esta reconstrucción — los efectos que involucran la carta superior del mazo (sin robar) **no pueden resolverse** si el mazo está vacío.

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

**¿Qué significa "revelar"?**
Mostrar a ambos jugadores la información revelada y devolverla a su estado anterior. No tiene efecto permanente.

**¿Puede una carta con comando superior eliminarse a sí misma si está cubierta?**
Sí. Mientras esté boca arriba, sus efectos aplican aunque esté cubierta.

**¿Puedo mirar cartas que juego desde la parte superior del mazo antes de colocarlas boca abajo?**
No. Solo puedes verlas después de estar en el campo.

**¿Si un efecto descarta una carta que no está en la mano, se activa Plaga 1 u efectos similares?**
Sí. "Descartar" incluye cualquier descarte, salvo que se especifique lo contrario.

**¿Cuándo se reconstruye el mazo?**
Cuando está vacío y necesitas robar. Se baraja el descarte para formar uno nuevo.

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

**Espíritu 1**
- ERRATA (10/2024) — Comando superior: *"Cuando juegas cartas boca arriba, pueden jugarse sin coincidir con protocolos."*
- Mientras esté boca arriba y descubierta, permite jugar cualquier carta boca arriba en cualquier línea.

---

### 🔴 Muerte (Death)

**Muerte 1**
- ERRATA (10/2024) — Comando superior: *"Inicio: Puedes robar 1 carta. Si lo haces, elimina 1 carta adicional. Luego, elimina esta carta."*
- No puede ser movida, volteada ni eliminada por otros efectos.

---

### 🟠 Fuego (Fire)

**Fuego 0**
- ERRATA (12/2024) — Comando inferior: *"Cuando esta carta vaya a ser cubierta: primero, roba 1 carta. Luego, voltea 1 carta."*
- Efecto `onCover`: se activa cuando otra carta entra en la misma línea y va a cubrirla. El efecto se resuelve antes de que la carta cubriente aterrice.

---

### 🟢 Vida (Life)

**Vida 0**
- ERRATA (10/2024) — Comando superior: *"Fin: Si esta carta está cubierta, elimínala."* No tiene comando inferior.
- Jugar desde la parte superior del mazo no obliga a barajar si el mazo está vacío.

---

### 🟡 Luz (Light)

**Luz 0**
- ACLARACIÓN: Voltea 1 carta descubierta. Luego, roba cartas igual a su **valor actual** (tras el volteo).
- FALLO: Si la carta es eliminada durante este proceso, aún se usa como referencia para el número de cartas a robar.

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

**Plaga 3**
- ACLARACIÓN: *"Voltea cada otra carta descubierta."* — Solo afecta cartas **descubiertas**, no cubiertas.

---

### 🔵 Velocidad (Speed)

**Velocidad 2**
- ACLARACIÓN: Durante la compilación, se eliminan todas las cartas simultáneamente. Velocidad 2 **se desplaza a otra línea en lugar de eliminarse**.

---

### 🔵 Agua (Water)

**Agua 1**
- ACLARACIÓN: No fuerza el barajado del descarte si el mazo está vacío.

---

### ⚔️ Odio (Hate)

**Odio 2**
- ERRATA (10/2024) — Comando medio: *"Elimina tu carta descubierta de mayor valor. Elimina la del oponente de mayor valor."*
- ACLARACIÓN: Si Odio 2 es tu carta de mayor valor descubierta, se elimina a sí misma. El segundo efecto (eliminar carta del oponente) **no se activa**.

---

## 🖥️ Estado de Implementación

| Mecánica | Estado |
|---|---|
| Ciclo de turno (5 fases base) | ✅ Implementado |
| Compilación y recompilación | ✅ Implementado |
| Mazo vacío → reconstruir desde descarte | ✅ Implementado |
| Cartas boca abajo valor = 2 | ✅ Implementado |
| LIFO para resolución de efectos | ✅ Implementado |
| Metal 1 bloquea compilación (solo si visible al activar) | ✅ Implementado |
| Espíritu 1 — jugar sin protocolo | ✅ Implementado |
| Fuego 0 — efecto `onCover` | ✅ Implementado |
| Odio 2 — se elimina a sí mismo si es el más alto | ✅ Implementado |
| Velocidad 2 — se desplaza en lugar de eliminarse en compilación | ✅ Implementado |
| **Control Component** (fase Verificar Control + reorganización) | ❌ No implementado |
