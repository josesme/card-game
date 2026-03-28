# COMPILE - BACKLOG & ROADMAP

Documento para el seguimiento de bugs, mejoras y nuevas funcionalidades.

## Bugs & Tareas Pendientes

- [ ] **IA:** Mejorar evaluación de movimientos que disparan efectos complejos.
- [x] **UI:** Solapamiento de cartas en stacks grandes en pantallas pequeñas.
- [x] **UX:** Selección de cartas desde mazo/descarte con modal reveal (Tiempo 0/3, Claridad 3).
- [x] **Amor 4:** IA usa cartas reveladas del jugador para tomar decisiones.
- [x] **Comando central:** Voltear bocabajo→bocarriba y descubrirse activan onPlay (implementado).

## Completado recientemente

- [x] **Audit Main 2 completo:** 90 cartas auditadas, 12 bugs corregidos, 2 features implementados. Ver `AUDIT-MAIN2.md`.
- [x] **182 tests pasando** (100% pass rate).
- [x] **Hooks reactivos:** Solo disparan para carta top, no cubiertas.
- [x] **Server:** Manejo de EADDRINUSE, EISDIR y cierre limpio.
- [x] **Docs:** LEEME.md y README.md unificados + DEV_INSTRUCTIONS.md para IA.
- [x] **Modal Reveal:** Tiempo 0 (descarte), Tiempo 3 (descarte + línea), Claridad 3 (mazo) eligen cartas sin ir a mano.

## Próximas Versiones

### v2.1.0 — AI Overhaul: 5 niveles con diferencias reales

**Objetivo:** Que cada nivel de dificultad tenga un comportamiento cualitativamente distinto.
El nivel 5 debe suponer un reto real; el nivel 1 debe ser asequible para cualquiera.
Actualmente el único diferenciador es la profundidad de búsqueda minimax (1→5). Sin cambios de comportamiento ni lógica de evaluación.

**Principio fundamental:** La IA solo puede usar información que tendría disponible un jugador humano. Cartas en mano del rival: desconocidas. Cartas bocabajo en mesa: sabe que existen, no qué son. Descarte: visible (público). Mazo: no sabe el orden. Este principio es invariable en todos los niveles.

**Eje de dificultad — Memoria del rival:** Cuánto recuerda la IA del historial público del jugador para inferir su mano/estrategia.

| Nivel | Memoria del rival | Comportamiento global |
|-------|------------------|-----------------------|
| 1 · SUBRUTINA | Ninguna — ignora el descarte rival | 50% jugadas aleatorias, sin defensa |
| 2 · ALGORITMO | Solo la última carta descartada | 20% jugadas aleatorias, defensa reactiva mínima |
| 3 · NÚCLEO | Últimas 3 cartas del descarte | Sin aleatoriedad, evaluación estándar actual |
| 4 · CENTINELA | Todo el descarte visible | Defensa proactiva, detecta amenazas a 2 turnos |
| 5 · SINGULARIDAD | Todo el descarte + infiere mano probable | Evaluación reforzada, bloqueo agresivo |

**Tareas (orden de prioridad propuesto — cada una es revisable por separado):**

- [x] **AI-01 · Bug fix · simulateMove + opponentDiscard** — Dos bugs reales corregidos (el ReferenceError de `protocols` reportado inicialmente no existía): (a) cartas reveladas del jugador usaban `splice(undefined,1)` que extraía siempre la carta 0; (b) `opponentDiscard` usaba `Math.random()` dentro del árbol minimax produciendo evaluaciones no deterministas. Corregido: el jugador descarta determinísticamente su carta de menor valor.
- [x] **AI-07 · Fisher-Yates shuffle** — El barajado actual (`sort(() => Math.random() - 0.5)`) es estadísticamente sesgado. Reemplazar por Fisher-Yates. Sin riesgo, afecta a todos los niveles.
- [ ] **AI-02 · Niveles 1-2 · Epsilon-greedy** — Inyectar jugadas aleatorias reales en niveles 1 (50%) y 2 (20%) para que cometan errores tangibles, no solo busquen menos profundo.
- [x] **AI-09 · Memoria del descarte por nivel** — Pasar a la evaluación solo la parte del descarte rival que cada nivel "recuerda" (ninguna / última / últimas 3 / todo). Palanca principal de diferenciación entre niveles.
- [ ] **AI-03 · Niveles 1-2 · Sin defensa activa** — Nivel 1 ignora amenazas de compilado. Nivel 2 solo defiende si el jugador está a 1 carta de compilar.
- [ ] **AI-04 · Pesos de evaluación por nivel** — Ajustar los 7 pesos del `AIEvaluator` según nivel. Nivel 1: casi sin peso defensivo. Nivel 5: prioriza bloqueo sobre ataque.
- [x] **AI-05 · Niveles 4-5 · Detección de amenaza en 2 turnos** — Reconocer que el jugador está a 2 cartas de compilar una línea y marcarla como urgente.
- [ ] **AI-06 · Nivel 5 · Penalización por deck vacío** — La IA en nivel 5 debe valorar no quedarse sin cartas.
- [ ] **AI-08 · Nivel 5 · Reconocimiento de dead lines más preciso** — El detector actual asume que todas las cartas restantes valen 5. Mejorar con valor medio real del mazo.

**Fuera de alcance en esta versión (complejidad alta, posponer):**
- Tabla de transposición / memoización (permite depth 6-7)
- Simulación de los ~47 efectos de carta no cubiertos en minimax
- Modelado bayesiano completo del jugador

---

### v2.2.0 (Polish)
- [ ] Animaciones de descarte y robo.
- [ ] Sonidos básicos de interfaz.
- [ ] Refactorización del sistema de modales.

### v3.0.0 (Control Component)
- [ ] Implementación del componente de control (regla avanzada).
- [ ] Documentación de diseño en `docs/FASE-3-CONTROL.md`.

### v4.0.0 (Polish & Social)
- [ ] Sistema de guardado local (localStorage).
- [ ] Historial de partidas.
- [ ] Log de eventos detallado.
