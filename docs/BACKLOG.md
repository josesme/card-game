# COMPILE - BACKLOG

Trabajo pendiente. Una vez completado, eliminar la entrada y distribuir la información según DEV_INSTRUCTIONS.md.

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

### Palabras Clave

### Información
- [ ] **Los cementerios son públicos** — cualquier jugador puede consultarlos en cualquier momento (implementar acceso en UI). `Coste: Medio` `Valor: Medio`


- [ ] **Psique 2 no ofrece reorganizar protocolos del rival** — Al jugar Psique 2, no aparece la opción de reorganizar. `Coste: Bajo` `Valor: Bajo`
- [ ] **Psique 4 no deja elegir qué carta devolver** — La carta a devolver la elige quien juega la carta, debería elegirla el dueño. `Coste: Bajo` `Valor: Bajo`
