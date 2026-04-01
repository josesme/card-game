# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## 📝 REFINAMIENTO COPY DE MODALES

Listado completo de textos de modales para revisar y pulir. Completar uno a uno y eliminar del backlog.

### Confirmación de Efecto
- **ID:** `CMD-01`
- **Ubicación:** `logic.js:1373`
- **Texto actual:** `¿Quieres usar este efecto? "{texto del efecto}"`
- **Botones:** `SÍ` | `NO` ✅ Actualizado
- **Estado:** ✅ Completado (v2.2.1)

---

### Control Component
- **ID:** `CMD-02`
- **Ubicación:** `logic.js:1065`
- **Texto actual:** `Control Component: ¿Reorganizas protocolos?`
- **Botones:** `ACEPTAR` | `CANCELAR`
- **Estado:** ⏳ Pendiente

---

### Descartar (N cartas)
- **ID:** `SEL-01`
- **Ubicación:** `game.html:1401`
- **Título:** `DESCARTAR`
- **Subtítulo actual:** `Elige {N} carta{s} de tu mano`
- **Botón:** `DESCARTAR`
- **Estado:** ⏳ Pendiente

---

### Descartar Cualquiera (0 o más)
- **ID:** `SEL-02`
- **Ubicación:** `game.html:1402`
- **Título:** `DESCARTAR`
- **Subtítulo actual:** `Descarta las que quieras (0 o más)`
- **Botones:** `DESCARTAR` | `DETENER`
- **Estado:** ⏳ Pendiente

---

### Descartar Variable (rival descarta más)
- **ID:** `SEL-03`
- **Ubicación:** `game.html:1403`
- **Título:** `DESCARTAR`
- **Subtítulo actual:** `Descarta cartas — el rival descartará más`
- **Botones:** `DESCARTAR` | `DETENER`
- **Estado:** ⏳ Pendiente

---

### Dar al Oponente
- **ID:** `SEL-04`
- **Ubicación:** `game.html:1404`
- **Título:** `DAR AL OPONENTE`
- **Subtítulo actual:** `Elige {N} carta{s} para dar al oponente`
- **Botón:** `ENTREGAR`
- **Estado:** ⏳ Pendiente

---

### Revelar Carta
- **ID:** `SEL-05`
- **Ubicación:** `game.html:1405`
- **Título:** `REVELAR CARTA`
- **Subtítulo actual:** `Elige 1 carta para revelar al oponente`
- **Botón:** `REVELAR`
- **Estado:** ⏳ Pendiente

---

### Jugar Carta (Diversidad 0)
- **ID:** `SEL-06`
- **Ubicación:** `game.html:1406`
- **Título:** `JUGAR CARTA`
- **Subtítulo actual:** `Elige 1 carta (no Diversidad) para jugar bocarriba`
- **Botón:** `JUGAR`
- **Estado:** ⏳ Pendiente

---

### Eliminar (campo)
- **ID:** `FLD-01`
- **Ubicación:** `game.html:1507, 1581`
- **Título:** `ELIMINAR`
- **Subtítulo actual:** `Elige {N} carta{s} {del oponente/tuyas}`
- **Botón:** `ELIMINAR`
- **Estado:** ⏳ Pendiente

---

### Voltear (campo)
- **ID:** `FLD-02`
- **Ubicación:** `game.html:1507, 1581`
- **Título:** `VOLTEAR`
- **Subtítulo actual:** `Elige {N} carta{s} {del oponente/tuyas}`
- **Botón:** `VOLTEAR`
- **Estado:** ⏳ Pendiente

---

### Devolver a Mano
- **ID:** `FLD-03`
- **Ubicación:** `game.html:1507, 1581`
- **Título:** `DEVOLVER A MANO`
- **Subtítulo actual:** `Elige {N} carta{s} {del oponente/tuyas}`
- **Botón:** `DEVOLVER`
- **Estado:** ⏳ Pendiente

---

### Mover Carta (Velocidad 2)
- **ID:** `FLD-04`
- **Ubicación:** `game.html:1507, 1512`
- **Título:** `MOVER CARTA`
- **Subtítulo actual:** `Elige 1 carta para mover a otra línea`
- **Botón:** `MOVER`
- **Estado:** ⏳ Pendiente

---

### Copiar Efecto (Espejo 1)
- **ID:** `FLD-05`
- **Ubicación:** `game.html:1507, 1513`
- **Título:** `COPIAR EFECTO`
- **Subtítulo actual:** `Elige 1 carta rival para copiar su efecto`
- **Botón:** `COPIAR`
- **Estado:** ⏳ Pendiente

---

### Eliminar por Valor (Odio 3)
- **ID:** `FLD-06`
- **Ubicación:** `game.html:1691-1692`
- **Título:** `ELIMINAR POR VALOR`
- **Subtítulo actual:** `Elige una línea — se eliminarán cartas con valor {X}-{Y}`
- **Botón:** `ELIMINAR`
- **Estado:** ⏳ Pendiente

---

### Intercambiar Protocolos
- **ID:** `FLD-07`
- **Ubicación:** `game.html:1621-1622, 1655`
- **Título:** `INTERCAMBIAR PILAS` / `INTERCAMBIAR PROTOCOLOS`
- **Subtítulo actual:** `Elige 2 líneas para intercambiar`
- **Pasos:** `Elige la primera línea` → `Primera: {línea} — elige la segunda` → `Listo para intercambiar`
- **Botón:** `INTERCAMBIAR`
- **Estado:** ⏳ Pendiente

---

### Revelar Carta (Modal)
- **ID:** `REV-01`
- **Ubicación:** `game.html` (buscar)
- **Título:** `{nombre de la carta}`
- **Subtítulo actual:** `Puedes descartar esta carta` / `Carta revelada`
- **Botones:** `DESCARTAR` | `CERRAR`
- **Estado:** ⏳ Pendiente

---

### Espíritu 1 (Confirmación de lado)
- **ID:** `CMD-03`
- **Ubicación:** `logic.js:2370`
- **Texto actual:** `¿Quieres jugar esta carta en el lado del oponente?`
- **Botones:** `SÍ` | `NO`
- **Estado:** ⏳ Pendiente

---

## IA

- **Mejorar evaluación de efectos complejos** — La IA no evalúa correctamente jugadas que disparan cadenas de efectos (por ejemplo, cartas que encadenan robo, descarte o volteo). Impacta la calidad de decisión en niveles 4-5.

- **Estrategia de draft** — La lógica actual de `aiScoreDraftProtocol` no tiene en cuenta el estado de la partida en curso (qué protocolos ya tiene el rival, cuáles son más probables de compilar antes). Mejorar para considerar contexto de partida real.

---

## UI/UX

- **Animaciones de descarte y robo** — Sin animación al mover cartas entre zonas.
    (gsap.com/docs/v3/Eases - codepen.io/GreenSock)
    - Flip para reordenacion de draft tras seleccion
    - Drag para cartas
    - MorphSVG para eliminar carta papelera
    - Card stack para mazo
    - Infinite card slider para mano
- **Sonidos básicos de interfaz** — Sin feedback sonoro.


---

## Polish & Social

- **Guardado local** — Persistir estado de partida en `localStorage`.
- **Historial de partidas** — Log de resultados anteriores.
- **Log de eventos detallado** — Registro por turno de todas las jugadas.
