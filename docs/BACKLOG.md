# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## Mejora de IA — Evaluador estratégico

Plan iterativo para mejorar la calidad de decisiones de ISMCTS conectando y enriqueciendo `AIEvaluator`. Cada historia es independiente y aporta valor incremental. Fuente: `docs/compile-estrategy-es.md`.

### Alto valor, bajo coste
- **AI-E15 — Bocabajo defensivo como bloqueo:** Cuando el rival está cerca de compilar una línea, permitir a la IA jugar una carta bocabajo en esa línea aunque tenga opción face-up en otro sitio. Requiere definir umbral de amenaza, qué cartas son sacrificables, y si aplica solo en late game. Muchas casuísticas — definir antes de implementar.


- **AI-E3 — Bocabajo con criterio:** Mejorar `evaluateFaceDownBalance()`: penalización dura si bocabajo va en línea perdida estructuralmente. Bonus si la IA tiene Life/Water/Smoke/Darkness/Apathy en sus protocolos. Penalización leve si ninguna condición estratégica aplica.

- **AI-E8 — Presión multi-línea refinada:** Refinar el bonus de amenazar compile en 2+ líneas simultáneamente. Actualmente existe pero infraponderado. Hacerlo dependiente de la fase: en late game es casi decisivo.

- **AI-E6 — Amenaza del rival basada en protocolos públicos:** Mejorar `evaluateOpponentThreat()`: protocolos del rival son públicos desde el draft. Gravity+Death con tablero lleno, Speed 3 visible en campo, Psychic 1 activo — cada uno tiene una ponderación específica de peligro.

### Alto valor, medio coste
- **AI-E5 — Sinergias entre protocolos:** Añadir `evaluateProtocolSynergies()`: detectar combinaciones conocidas (Life+Water, Gravity+Death, Speed+Fire, Spirit+X, Darkness+bocabajo) y aplicar bonus cuando las condiciones en mesa las activan.

- **AI-E12 — Contraestrategia activa:** Detectar setups peligrosos del rival visibles en campo: Psychic 1 face-up y cubierto, Speed 3 activo, Gravity 0 jugado con tablero lleno. Cuando se detectan, priorizar interrumpir sobre cualquier desarrollo propio.

- **AI-E14 — Comportamiento específico por protocolo:** Speed 0 no debe jugarse sin Speed 3 en mano o campo; Spirit 3 debe protegerse; Gravity 0 maximiza valor con retriggers; Death en mano con tablero rival vacío vale menos.

### Medio valor, medio coste
- **AI-E4 — Refresh timing:** Añadir `evaluateHandPlayability()`: si la mano tiene mayoría de cartas situacionales (valor 4 con texto situacional, 5s) y el mazo tiene cartas, valorar positivamente el acceso a refrescar en lugar de jugar mal.

- **AI-E9 — Interacción vs desarrollo:** Si la amenaza del rival supera un umbral, inclinar la evaluación hacia interacción (eliminate, discard, flip) aunque el desarrollo propio sea subóptimo.

- **AI-E13 — Meta-reglas:** (1) si la jugada no mejora el estado en ninguna dimensión, penalizarla; (2) si rompe una sinergia propia activa, penalizarla; (3) priorizar opciones futuras sobre valor inmediato cuando la diferencia de score es pequeña.

### Medio valor, alto coste
- **AI-E7 — Valor real de cartas por protocolo:** Cartas débiles situacionales (Speed 2/4, Apathy 0/2) y cartas fuertes (Fire 4, Water 3, Speed 3) deben distinguirse en la evaluación de mano.

- **AI-E10 — Tempo:** `evaluateTempo()`: opciones propias vs opciones del rival. Penalizar jugadas que reducen opciones futuras, bonus a jugadas que las amplían.

- **AI-E11 — Future potential:** Bonus a jugadas que abren combos conocidos. Penalizar jugadas que cierran líneas propias o eliminan piezas de combo propias.

### Pendiente (sin Control component activo)
- **AI-E2 — Fase de juego como modificador global:** ✅ Completado.

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

