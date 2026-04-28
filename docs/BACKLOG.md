# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## Arquitectura / Plataforma

> Decisiones pendientes de validar con experiencia de juego real antes de comprometer trabajo.

---

## Polish & Social

- **Guardado de partida** — Persistir `gameState` completo en `localStorage` al final de cada turno y restaurarlo al recargar. Prerequisito: tener el refactor de `createGameState()` para saber qué campos son parte del estado jugable y cuáles son efímeros (timers, animQueue, etc.). Valorar también historial de resultados anteriores.

---

## Bugs

> Estimaciones: **Coste** = esfuerzo de implementación (Muy bajo / Bajo / Medio / Alto). **Valor** = impacto en experiencia de juego.

- Pendiente de validar posible error al compilar en misma línea donde rival juega Guerra 2

- Llegado un punto, dejan de pintarse las anotaciones de jugada en panel de mano
