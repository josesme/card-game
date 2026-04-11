# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## IA

- **Mejorar evaluación de efectos complejos** — La IA no evalúa correctamente jugadas que disparan cadenas de efectos (por ejemplo, cartas que encadenan robo, descarte o volteo). Impacta la calidad de decisión en niveles 4-5.

- **Estrategia de draft** — La lógica actual de `aiScoreDraftProtocol` no tiene en cuenta el estado de la partida en curso (qué protocolos ya tiene el rival, cuáles son más probables de compilar antes). Mejorar para considerar contexto de partida real.

---

## UI/UX

### Animaciones

- **Animaciones de descarte y robo** — Sin animación al mover cartas entre zonas.
    (gsap.com/docs/v3/Eases - codepen.io/GreenSock)
    - Flip para reordenacion de draft tras seleccion
    - Drag para cartas
    - MorphSVG para eliminar carta papelera
    - Card stack para mazo
    - Infinite card slider para mano

- **Sonidos básicos de interfaz** — Sin feedback sonoro.

### Zona mano

- **Mazo con dorso carta real y contador** — Replicar el mismo diseño que la pila de descartes: dorso de carta real escalado al 41% en contenedor 76×100, badge contador arriba a la derecha. Actualmente el mazo muestra un placeholder genérico.

- **Carrusel de mano** — Sustituir el slider básico por un carrusel con física real.
    Referencia: https://demos.gsap.com/demo/flip-carousel/

### Paneles laterales (log de jugadas jugador / IA)

- **Datos de turno por jugador** — Añadir encabezado en cada panel con: turno actual, cartas en mano y cartas en mazo del jugador correspondiente. Permite ver el estado de recursos sin abrir otra vista.

- **Separadores de turno en el log** — Las entradas del log no distinguen visualmente a qué turno pertenecen. Insertar un separador fino con el número de turno cada vez que `startTurn` registra un nuevo turno, para facilitar la lectura de la historia de jugadas.

- **Tipo de acción diferenciado visualmente** — Todas las entradas del log tienen el mismo peso visual. Diferenciar categorías con color/icono consistente: robo (azul/🎴), compilación (amarillo/⚡), descarte (rojo/🗑️), efecto de carta (gris/✦), turno de IA (púrpura). Actualmente los iconos se asignan por detección de cadena de texto en `updateStatus`, frágil y difícil de mantener.

- **Número de entradas visible ampliado** — El panel muestra solo las últimas 5 entradas del bando filtradas. Con un log más compacto (solo texto + icono, sin fondo de color por entrada) se podrían mostrar 8-10 sin aumentar el espacio del panel.

- **Scroll interno del log** — Si el panel muestra más entradas, necesita scroll interno suave (actualmente `overflow: hidden` corta sin scroll). Añadir scroll con fade-out en el borde superior para indicar que hay más contenido.

- **Timestamp relativo por entrada** — Añadir al objeto `actionLog` el número de turno en que se registró la acción (`{ isAI, icon, msg, turn }`). Mostrarlo como etiqueta discreta (ej. "T3") al inicio de cada entrada en el panel lateral.

---

## Polish & Social

- **Guardado local** — Persistir estado de partida en `localStorage`.
- **Historial de partidas** — Log de resultados anteriores.
- **Log de eventos detallado** — Registro por turno de todas las jugadas.

---

## Bugs

> Estimaciones: **Coste** = esfuerzo de implementación (Muy bajo / Bajo / Medio / Alto). **Valor** = impacto en experiencia de juego.

### Compilación y Control
- [ ] **Al compilar, el compilador borra TODAS las cartas de la línea** (propias y del oponente). Actualmente cada jugador borra las suyas. Afecta a Odio 3: solo dispara cuando su propietario es quien borra. `Coste: Alto` `Valor: Alto`
- [ ] **Diversidad 0 y Unidad 1 no son compilaciones.** Unidad 1 borra cartas pero no es una compilación → no interactúa con Guerra 2, Velocidad 2, ni activa el Control Component. `Coste: Medio` `Valor: Medio`

### Información
- [ ] **Los cementerios son públicos** — cualquier jugador puede consultarlos en cualquier momento (implementar acceso en UI). `Coste: Medio` `Valor: Medio`
