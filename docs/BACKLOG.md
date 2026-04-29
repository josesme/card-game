# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## Arquitectura / Plataforma

> Decisiones pendientes de validar con experiencia de juego real antes de comprometer trabajo.

---

## Expansión de producto — Ideas exploradas

### Alcance inmediato
- **Registro de partidas** — Al terminar cada partida, guardar datos clave en Supabase (duración, ganador, protocolos jugados, cartas eliminadas). Base para estadísticas y reto diario. Prerequisito del reto diario.
- **Replay de partida** — Guardar cada acción en un array durante la partida y reproducirla al terminar. Reutiliza el motor sin modificarlo.
- **Draft con restricciones** — Modos alternativos: "solo Main 2", "mínimo 3 protocolos de expansión", "carta prohibida". Sin cambios en el motor de juego.
- **Estadísticas de la IA** — Mostrar al terminar qué protocolos eligió la IA y por qué ganó o perdió.

### Medio plazo
- **Reto diario** — Mismo mazo semilla para todos los jugadores ese día, resultado compartible estilo Wordle. Requiere registro de partidas como prerequisito. No necesita multijugador real.
- **Modo campaña / progresión** — Serie de partidas contra IA de dificultad creciente con mazo que evoluciona. Añade narrativa sin cambiar las reglas.
- **IA con personalidad** — Perfiles con nombres y estrategias reconocibles (agresivo, defensivo, caótico). Base en ai-profiles.js ya existente, añadir identidad visual y narrativa.
- **Modo puzzle** — Estado de juego predefinido, mano concreta, ganar en X turnos. Formato ideal para tutoriales o retos.
- **Editor de mazos personalizados** — El jugador construye su pool antes del draft. Requiere persistencia (localStorage o Supabase).

### Ambicioso
- **Multijugador por turnos asíncrono** — Cada jugador hace su turno, se guarda el estado, el rival recibe notificación y juega cuando puede. Mucho más simple que multijugador en tiempo real.
- **Multijugador en tiempo real** — Sala con enlace compartido vía Supabase Realtime o PartyKit. Requiere refactor profundo del motor (fuente de verdad, desconexiones, sincronización). Proyecto en sí mismo.
- **Modo espectador / análisis** — Cargar partida guardada y analizarla movimiento a movimiento con comentarios de la IA sobre decisiones clave.
- **Torneos asíncronos** — Bracket entre amigos, cada uno juega con el mismo mazo semilla contra la IA y se comparan resultados.

---

## Polish & Social

- **Guardado de partida** — Persistir `gameState` completo en `localStorage` al final de cada turno y restaurarlo al recargar. Prerequisito: tener el refactor de `createGameState()` para saber qué campos son parte del estado jugable y cuáles son efímeros (timers, animQueue, etc.). Valorar también historial de resultados anteriores.

---

## Bugs

> Estimaciones: **Coste** = esfuerzo de implementación (Muy bajo / Bajo / Medio / Alto). **Valor** = impacto en experiencia de juego.

- Pendiente de validar posible error al compilar en misma línea donde rival juega Guerra 2

- Llegado un punto, dejan de pintarse las anotaciones de jugada en panel de mano
