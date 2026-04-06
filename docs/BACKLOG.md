# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

---

## 🔨 REFACTOR: Efectos Atómicos + Composición (FUTURO/INVESTIGAR)

**Estado:** ⏸️ En pausa - Necesita más investigación y consenso

**Problema que intenta resolver:** Lógica de efectos está dispersa en múltiples archivos/funciones → cambios pequeños requieren tocar 5+ sitios.

**Solución propuesta:** Efectos atómicos reutilizables + composición

### Principios (teóricos):

1. **Efectos atómicos (reutilizables)**
   ```javascript
   AtomicEffects = {
       reveal: { setup(), execute() },
       shift: { setup(), execute() },
       flip: { setup(), execute() },
       discard: { setup(), execute() },
       choice: { setup(), execute() }
   }
   ```

2. **Composición para cartas específicas**
   ```javascript
   // Luz 2 = Revelar + Elegir (Shift o Flip)
   const luz2 = EffectBuilder.sequence(
       AtomicEffects.reveal({ target: 'faceDown' }),
       EffectBuilder.choice(
           "SÍ = Cambiar línea · NO = Voltear",
           () => AtomicEffects.shift(),
           () => AtomicEffects.flip()
       )
   );
   ```

### Pros (potenciales):

- ✅ 8 efectos atómicos cubrirían 180 cartas
- ✅ Cambiar "reveal" = tocar 1 sitio (no 10)
- ✅ Nuevas cartas = componer efectos (no crear código nuevo)
- ✅ DRY + testeable + mantenible

### Contras/riesgos (identificados):

- ⚠️ **Cambio muy grande** - Requiere refactorizar TODO el sistema de efectos
- ⚠️ **Riesgo de romper** - Efectos que funcionan podrían dejar de hacerlo
- ⚠️ **Curva de aprendizaje** - Nuevo patrón a entender
- ⚠️ **Over-engineering** - ¿Realmente necesario para este proyecto?
- ⚠️ **Tiempo** - Semanas de trabajo vs. horas de beneficio

### Alternativas a investigar:

1. **Refactor incremental** - Empezar con 1 efecto (ej: Luz 2) y ver si mejora
2. **Patrones más simples** - ¿Bastaría con mejor documentación + convenciones?
3. **Mantener estado actual** - ¿El coste/beneficio realmente vale la pena?

### Decisiones pendientes:

- [ ] ¿Realmente necesitamos este refactor?
- [ ] ¿Hay otros enfoques más simples?
- [ ] ¿Podemos hacer un MVP con 1-2 efectos para probar?
- [ ] ¿Cuál es el ROI real?

### Archivos existentes (para referencia):

- `src/card-effects.js` — Prototipo de efectos atómicos (NO USADO EN PRODUCCIÓN)

---

## Deuda Técnica

- [ ] **Tests de integración logic.js + abilities-engine.js** — Los tests actuales cargan solo un archivo a la vez; los bugs que surgen de la interacción entre los dos motores no se detectan automáticamente. `Coste: Medio` `Valor: Alto`
  > **Cuándo atacarlo:** cuando detectes una clase recurrente de bugs que los tests no pillan y que impliquen que un cambio en `logic.js` rompe algo en `abilities-engine.js` (o viceversa) sin aviso. Un ejemplo sería si `startTurn` se rompe de una manera que el test unitario del snapshot no simula. No hacerlo antes — el coste es infraestructura, no corrección de bug inmediato.

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
- **Mejoras zona mano 
    - Carrusel - https://demos.gsap.com/demo/flip-carousel/
    - Datos jugador - IA
    - Opción "ver descartes"
    - Detalles ampliados de la jugada actual??

---

## Polish & Social

- **Guardado local** — Persistir estado de partida en `localStorage`.
- **Historial de partidas** — Log de resultados anteriores.
- **Log de eventos detallado** — Registro por turno de todas las jugadas.

---

## Bugs

> Estimaciones: **Coste** = esfuerzo de implementación (Muy bajo / Bajo / Medio / Alto). **Valor** = impacto en experiencia de juego. Orden recomendado: Suerte 3 → Valor negativo → Cache como discard → Voltear cubierta → Gravedad 0 → Start simultáneos → Velocidad 0 → Diversidad/Unidad → Compilador borra todo → Cementerios UI.

### Compilación y Control
- [ ] **Al compilar, el compilador borra TODAS las cartas de la línea** (propias y del oponente). Actualmente cada jugador borra las suyas. Afecta a Odio 3: solo dispara cuando su propietario es quien borra. `Coste: Alto` `Valor: Alto`
- [ ] **Diversidad 0 y Unidad 1 no son compilaciones.** Unidad 1 borra cartas pero no es una compilación → no interactúa con Guerra 2, Velocidad 2, ni activa el Control Component. `Coste: Medio` `Valor: Medio`

### Fases y Efectos
- [ ] **Velocidad 0: al activarse, bloquea el aterrizaje de la carta desplazada** hasta que Speed 0 resuelve su efecto. Actualmente aparece el mensaje pero el juego no continúa correctamente. `Coste: Medio` `Valor: Medio`

### Palabras Clave

### Información
- [ ] **Los cementerios son públicos** — cualquier jugador puede consultarlos en cualquier momento (implementar acceso en UI). `Coste: Medio` `Valor: Medio`

