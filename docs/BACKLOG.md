# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## Arquitectura / Plataforma

> Decisiones pendientes de validar con experiencia de juego real antes de comprometer trabajo.

- **SPA (Single Page Application)** — Unificar index, draft y game en un único documento HTML. Resuelve: pantalla completa persistente entre vistas, eliminación de recargas de página, transiciones animadas entre fases (fade, scan-line). Coste estimado: Alto (2-3 sesiones, riesgo de regresiones en lógica de juego). Prerequisito para audio continuo.

- **Migración a Unity** — Descartada en esta fase. Reevaluar solo si se decide distribución como aplicación nativa (Steam, mobile). Coste: reescritura completa.

---

## Polish & Social

- **Guardado local** — Persistir estado de partida en `localStorage`.
- **Historial de partidas** — Log de resultados anteriores.

---

## Bugs

> Estimaciones: **Coste** = esfuerzo de implementación (Muy bajo / Bajo / Medio / Alto). **Valor** = impacto en experiencia de juego.

- Pendiente de validar posible error al compilar en misma línea donde rival juega Guerra 2

- Llegado un punto, dejan de pintarse las anotaciones de jugada en panel de mano
