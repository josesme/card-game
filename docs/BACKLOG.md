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

**Tareas (orden de prioridad propuesto — cada una es revisable por separado):**

- [ ] **AI-01 · Bug fix · sortMoves** — `protocols` no está en scope en `sortMoves()`, puede causar ReferenceError silencioso que degrada el ordenamiento de movimientos en todos los niveles.
- [ ] **AI-02 · Niveles 1-2 · Epsilon-greedy** — Inyectar jugadas aleatorias reales en niveles 1 (50%) y 2 (20%). Actualmente buscan menos profundo pero siempre eligen "lo mejor dentro de su alcance". Con esto el nivel 1 comete errores tangibles.
- [ ] **AI-03 · Niveles 1-2 · Sin defensa activa** — Nivel 1 ignora amenazas de compilado del jugador. Nivel 2 solo defiende si el jugador está a 1 carta de compilar.
- [ ] **AI-04 · Pesos de evaluación por nivel** — Ajustar los 7 pesos del `AIEvaluator` según nivel. Nivel 1: casi sin peso defensivo. Nivel 5: prioriza bloqueo sobre ataque.
- [ ] **AI-05 · Niveles 4-5 · Detección de amenaza en 2 turnos** — Reconocer que el jugador está a 2 cartas de compilar una línea y marcarla como urgente. Actualmente solo detecta amenaza inmediata (1 carta).
- [ ] **AI-06 · Nivel 5 · Penalización por deck vacío** — La IA en nivel 5 debe valorar no quedarse sin cartas. Actualmente el deck vacío no penaliza la evaluación.
- [ ] **AI-07 · Fisher-Yates shuffle** — El barajado actual (`sort(() => Math.random() - 0.5)`) es estadísticamente sesgado. Reemplazar por Fisher-Yates. Afecta a todos los niveles.
- [ ] **AI-08 · Nivel 5 · Reconocimiento de dead lines más preciso** — El detector actual asume que todas las cartas restantes valen 5 (optimismo excesivo). Mejorar con valor medio real del mazo.

**Fuera de alcance en esta versión (complejidad alta, posponer):**
- Tabla de transposición / memoización (permite depth 6-7)
- Simulación de los ~47 efectos de carta no cubiertos en minimax
- Modelado bayesiano del jugador

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
