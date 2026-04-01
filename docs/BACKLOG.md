# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## 🔨 REFACTOR: Encapsulamiento de Efectos (REGLA DE ORO)

**Problema:** Lógica de efectos está dispersa en múltiples archivos/funciones → cambios pequeños requieren tocar 5+ sitios.

**Solución:** Patrón de Efecto Encapsulado en `src/card-effects.js`

### Principios:

1. **Un módulo por efecto complejo**
   ```javascript
   CardEffects.luz2 = {
       init(),      // Configura estado
       handlers{},  // Procesa interacciones
       complete()   // Limpia + continúa
   }
   ```

2. **Cero lógica hardcodeada en handlers genéricos**
   - `handleFieldCardClick()` debe delegar, no implementar
   - `finishEffect()` debe llamar callback, no decidir flujo

3. **Estado viaja con effectContext**
   ```javascript
   gameState.effectContext = {
       type: 'luz2',
       step: 'reveal',
       data: { cardObj, line, target },
       onComplete: () => CardEffects.luz2.complete()
   }
   ```

4. **Callback chain explícito**
   ```javascript
   // NO: if (ctx.type === 'shift') { ... finishEffect() }
   // SÍ: ctx.onComplete = () => CardEffects.luz2.complete()
   ```

### Efectos a refactorizar:

- [ ] **Luz 2** (prioridad alta) - Actualmente en 5 funciones distintas
- [ ] **Espíritu 1** - Confirmación de lado
- [ ] **Diversidad 0** - Jugar carta no-Diversidad
- [ ] **Plaga 2** - Descarte variable
- [ ] **Odio 3** - Eliminar por valor
- [ ] **Control Component** - Reorganizar protocolos

### Archivos:

- `src/card-effects.js` - NUEVO: Módulo de efectos encapsulados
- `src/abilities-engine.js` - Debe llamar CardEffects.init()
- `src/logic.js` - Debe delegar a CardEffects.handlers()

---

## 📝 REFINAMIENTO COPY DE MODALES

Listado completo de textos de modales/overlays para revisar y pulir. **Solo efectos con interacción UI**.

**Cómo trabajar:**
1. Elige una tarea (ej: `CMD-02`)
2. Propón el nuevo copy
3. Implementa el cambio
4. Marca como `✅ Completado (vX.X.X)`
5. Cuando todas las de una categoría estén completas, elimina la sección

---

### Confirm Dialog (`command-confirm`)

#### CMD-01 — Confirmación de Efecto ✅
- **Ubicación:** `logic.js:1373`, `game.html:showConfirmDialog()`
- **Trigger:** Efectos opcionales ("puedes...")
- **Mensaje:** `¿Quieres usar este efecto? "{texto}"`
- **Botones:** `SÍ` | `NO` ✅ Actualizado en v2.2.1
- **Estado:** ✅ Completado

---

#### CMD-02 — Control Component
- **Ubicación:** `logic.js:1065`
- **Trigger:** Control Component (≥2 líneas ganadas)
- **Mensaje:** `Control Component: ¿Reorganizas protocolos?`
- **Botones:** `MIS PROTOCOLOS` | `PROTOCOLOS RIVALES` | `SALTAR`
- **Nota:** 3 botones personalizados, no usa showConfirmDialog()
- **Estado:** ⏳ Pendiente

---

#### CMD-03 — Espíritu 1 (Confirmación de lado)
- **Ubicación:** `logic.js:2370`
- **Trigger:** Espíritu 1 al jugar carta
- **Mensaje:** `¿Quieres jugar esta carta en el lado del oponente?`
- **Botones:** `SÍ` | `NO`
- **Estado:** ⏳ Pendiente

---

### Hand Select Overlay (`overlay-select` — mano del jugador)

#### SEL-01 — Descartar (N cartas fijas)
- **Ubicación:** `game.html:1401`, `showHandSelectOverlay()`
- **Trigger:** Efectos de descarte (ej: "descarta 2 cartas")
- **Título:** `DESCARTAR`
- **Subtítulo:** `Elige {N} carta{s} de tu mano`
- **Botón:** `DESCARTAR`
- **Estado:** ⏳ Pendiente

---

#### SEL-02 — Descartar Cualquiera (0 o más)
- **Ubicación:** `game.html:1402`
- **Trigger:** `discardAny` (ej: "descarta las que quieras")
- **Título:** `DESCARTAR`
- **Subtítulo:** `Descarta las que quieras (0 o más)`
- **Botones:** `DESCARTAR` | `DETENER`
- **Estado:** ⏳ Pendiente

---

#### SEL-03 — Descartar Variable (rival descarta más)
- **Ubicación:** `game.html:1403`
- **Trigger:** `discardVariable` (ej: Plaga 1)
- **Título:** `DESCARTAR`
- **Subtítulo:** `Descarta cartas — el rival descartará más`
- **Botones:** `DESCARTAR` | `DETENER`
- **Estado:** ⏳ Pendiente

---

#### SEL-04 — Dar al Oponente
- **Ubicación:** `game.html:1404`
- **Trigger:** Efectos de dar cartas (ej: "da 1 carta al oponente")
- **Título:** `DAR AL OPONENTE`
- **Subtítulo:** `Elige {N} carta{s} para dar al oponente`
- **Botón:** `ENTREGAR`
- **Estado:** ⏳ Pendiente

---

#### SEL-05 — Revelar Carta (desde mano)
- **Ubicación:** `game.html:1405`
- **Trigger:** Efectos de revelar (ej: Amor 4)
- **Título:** `REVELAR CARTA`
- **Subtítulo:** `Elige 1 carta para revelar al oponente`
- **Botón:** `REVELAR`
- **Estado:** ⏳ Pendiente

---

#### SEL-06 — Jugar Carta (Diversidad 0)
- **Ubicación:** `game.html:1406`
- **Trigger:** Diversidad 0 al actualizar mano
- **Título:** `JUGAR CARTA`
- **Subtítulo:** `Elige 1 carta (no Diversidad) para jugar bocarriba`
- **Botón:** `JUGAR`
- **Estado:** ⏳ Pendiente

---

### Field Select Overlay (`overlay-select` — campo)

#### FLD-01 — Eliminar (campo)
- **Ubicación:** `game.html:1507, 1581`, `showFieldSelectOverlay()`
- **Trigger:** Efectos de eliminar del campo
- **Título:** `ELIMINAR`
- **Subtítulo:** `Elige {N} carta{s} {del oponente/tuyas}`
- **Botón:** `ELIMINAR`
- **Estado:** ⏳ Pendiente

---

#### FLD-02 — Voltear (campo)
- **Ubicación:** `game.html:1507, 1581`
- **Trigger:** Efectos de voltear cartas del campo
- **Título:** `VOLTEAR`
- **Subtítulo:** `Elige {N} carta{s} {del oponente/tuyas}`
- **Botón:** `VOLTEAR`
- **Estado:** ⏳ Pendiente

---

#### FLD-03 — Devolver a Mano
- **Ubicación:** `game.html:1507, 1581`
- **Trigger:** Efectos de devolver carta del campo a la mano
- **Título:** `DEVOLVER A MANO`
- **Subtítulo:** `Elige {N} carta{s} {del oponente/tuyas}`
- **Botón:** `DEVOLVER`
- **Estado:** ⏳ Pendiente

---

#### FLD-04 — Mover Carta (Velocidad 2)
- **Ubicación:** `game.html:1507, 1512`
- **Trigger:** Velocidad 2 al compilar
- **Título:** `MOVER CARTA`
- **Subtítulo:** `Elige 1 carta para mover a otra línea`
- **Botón:** `MOVER`
- **Estado:** ⏳ Pendiente

---

#### FLD-05 — Copiar Efecto (Espejo 1)
- **Ubicación:** `game.html:1507, 1513`
- **Trigger:** Espejo 1 al jugar
- **Título:** `COPIAR EFECTO`
- **Subtítulo:** `Elige 1 carta rival para copiar su efecto`
- **Botón:** `COPIAR`
- **Estado:** ⏳ Pendiente

---

#### FLD-06 — Eliminar por Valor (Odio 3)
- **Ubicación:** `game.html:1691-1692`, `showLineSelectOverlay()`
- **Trigger:** Odio 3 al descubrirse
- **Título:** `ELIMINAR POR VALOR`
- **Subtítulo:** `Elige una línea — se eliminarán cartas con valor {X}-{Y}`
- **Botón:** `ELIMINAR`
- **Estado:** ⏳ Pendiente

---

#### FLD-07 — Intercambiar Protocolos
- **Ubicación:** `game.html:1621-1622, 1655`, `showRearrangeProtocolOverlay()`
- **Trigger:** Reorganizar protocolos (Control Component o efecto)
- **Título:** `INTERCAMBIAR PROTOCOLOS`
- **Subtítulo:** `Elige 2 líneas para intercambiar`
- **Pasos:** 
  1. `Elige la primera línea`
  2. `Primera: {línea} — elige la segunda`
  3. `Listo para intercambiar`
- **Botón:** `INTERCAMBIAR`
- **Estado:** ⏳ Pendiente

---

### Line Select Overlay (`overlay-select` — selección de líneas)

#### LIN-01 — Seleccionar Línea (Odio 3)
- **Ubicación:** `game.html:showLineSelectOverlay()`
- **Trigger:** Odio 3 (misma carta que FLD-06)
- **Título:** `ELIMINAR POR VALOR`
- **Subtítulo:** `Elige una línea — se eliminarán cartas con valor {X}-{Y}`
- **Botón:** `ELIMINAR`
- **Nota:** Mismo efecto que FLD-06, diferente vista (líneas vs cartas)
- **Estado:** ⏳ Pendiente

---

### Reveal Modal (`reveal-modal`)

#### REV-01 — Revelar Carta (modal)
- **Ubicación:** `game.html:reveal-modal`, `showRevealModal()`
- **Trigger:** Varios efectos (ej: carta revelada del mazo)
- **Título:** `{nombre de la carta}`
- **Subtítulo:** `Puedes descartar esta carta` / `Carta revelada`
- **Botones:** `DESCARTAR` | `CERRAR`
- **Estado:** ⏳ Pendiente

---

## 📊 RESUMEN

| Categoría | ID | Total | Completados |
|-----------|-----|-------|-------------|
| Confirm Dialog | CMD-xx | 3 | 1 ✅ |
| Hand Select | SEL-xx | 6 | 0 |
| Field Select | FLD-xx | 7 | 0 |
| Line Select | LIN-xx | 1 | 0 |
| Reveal Modal | REV-xx | 1 | 0 |
| **TOTAL** | | **18** | **1** |

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
