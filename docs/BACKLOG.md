# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## IA

- **Mejorar evaluación de efectos complejos** — La IA no evalúa correctamente jugadas que disparan cadenas de efectos (por ejemplo, cartas que encadenan robo, descarte o volteo). Impacta la calidad de decisión en niveles 4-5.

- **Estrategia de draft** — La lógica actual de `aiScoreDraftProtocol` no tiene en cuenta el estado de la partida en curso (qué protocolos ya tiene el rival, cuáles son más probables de compilar antes). Mejorar para considerar contexto de partida real.

---

## UI/UX

- Cambiar mazo por mano en informacion visible de la IA

### Animaciones

- **Animaciones laser para selección protocolo draft (misma eliminar en juego)
- **Efecto deshabilitado en draft, cuando no hay zonas clickables (mismo en mano con cartas no clickables)
- **Animaciones actualizar en mano con bug (primero se cargan y despues se pintan con laser) 


### Paneles texto (log de jugadas jugador / IA)

- **Tipo de acción diferenciado visualmente** — Todas las entradas del log tienen el mismo peso visual. Diferenciar categorías con color/icono consistente: robo (azul/🎴), compilación (amarillo/⚡), descarte (rojo/🗑️), efecto de carta (gris/✦), turno de IA (púrpura). Actualmente los iconos se asignan por detección de cadena de texto en `updateStatus`, frágil y difícil de mantener.

- **Número de entradas visible ampliado** — El panel muestra solo las últimas 5 entradas del bando filtradas. Con un log más compacto (solo texto + icono, sin fondo de color por entrada) se podrían mostrar 8-10 sin aumentar el espacio del panel.

- **Scroll interno del log** — Si el panel muestra más entradas, necesita scroll interno suave (actualmente `overflow: hidden` corta sin scroll). Añadir scroll con fade-out en el borde superior para indicar que hay más contenido.

- **Timestamp relativo por entrada** — Añadir al objeto `actionLog` el número de turno en que se registró la acción (`{ isAI, icon, msg, turn }`). Mostrarlo como etiqueta discreta (ej. "T3") al inicio de cada entrada en el panel lateral.

---

## Animación de victoria

- **Secuencia cinematográfica al compilar** — Reemplazar el modal de victoria por una animación de 2–4 segundos, saltable con click. Secuencia: fade a negro → texto glitch "¿Qué eres?" → 3 protocolos flotando en el centro → cada carta se activa (brillo → se descompone en partículas) → partículas se fusionan en el centro → flash suave → texto final "COMPILATION COMPLETE / REALITY REWRITTEN". Requiere definir motor de animación (actualmente el juego es web; si se migra a Unity: C#, Canvas UI, coroutines/tween). Parámetros a exponer: colores según jugador/mazo, duración, skip. Arquitectura: clase controladora de estados + timeline de pasos desacoplados de la lógica de juego.

---

## Polish & Social

- **Guardado local** — Persistir estado de partida en `localStorage`.
- **Historial de partidas** — Log de resultados anteriores.

---

## Bugs

> Estimaciones: **Coste** = esfuerzo de implementación (Muy bajo / Bajo / Medio / Alto). **Valor** = impacto en experiencia de juego.

### Compilación y Control
