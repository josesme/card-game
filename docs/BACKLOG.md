# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## Mejora de IA — Evaluador (bajo valor, sin síntoma)

Ideas evaluadas en `docs/ai-improvement-analysis.md` y aplazadas por bajo valor residual. Registradas aquí para no perderlas.

- **AI-A — Escenarios multi-valor para cartas desconocidas del jugador** — Generar movimiento optimista y pesimista para cartas ocultas del jugador y elegir el mejor contra ambos. Coste medio-alto (árbol de búsqueda más grande). Bajo valor desde que `_buildPlayerPool` calibra el pool por protocolo.
- **AI-B — Extender quiescence search a eliminaciones de alto impacto** — Detectar en `isHotPosition` si hay una carta con `eliminate: highest` jugable en línea rival con score ≥ 7 y extender la búsqueda. Coste medio, sin riesgo de rotura, pero puede degradar rendimiento si dispara demasiado.
- **AI-C — Subir peso `opportunities` en nivel 5** — Cambiar cálculo en `ai-profiles.js:308` para perfiles con `compilationPriority >= 0.8`. Coste muy bajo (1 línea). Sin queja reportada que lo justifique.

---

## Arquitectura / Plataforma

> Decisiones pendientes de validar con experiencia de juego real antes de comprometer trabajo.

- **Modo entrenador** — Añadir un check en la pantalla de inicio que active el modo entrenador. Cuando está activo: botón "ver mano IA" visible en partida. Cuando está inactivo: botón oculto para juego normal. Actualmente el botón está siempre visible.

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

- **Luz 3 — no hace nada al jugarse:** Jugada en fila derecha, el efecto no se ejecutó. Pendiente: (1) reproducir el caso, (2) leer el texto literal en `GLOBAL_CARDS`, (3) buscar en CODEX y rules questions si hay aclaraciones sobre su comando (el texto genera dudas de interpretación). Investigar antes de tocar código.

