# COMPILE - BACKLOG & ROADMAP

Documento para el seguimiento de bugs, mejoras y nuevas funcionalidades.

## Bugs & Tareas Pendientes

- [ ] **IA:** Mejorar evaluación de movimientos que disparan efectos complejos.
- [ ] **Log:** Log avanzado con todas las fases de juego. Actualmente falta información de algunas jugadas y se muestran acciones de la IA que deberían estar ocultas.
- [ ] **Regla:** Documentar en CODEX la casuística de mazo vacío — algunos efectos se interrumpen (jugar/descartar/revelar desde mazo) vs barajar descarte (robo). ✅ Implementación validada.
- [x] **UI:** Solapamiento de cartas en stacks grandes en pantallas pequeñas.
- [x] **Amor 4:** IA usa cartas reveladas del jugador para tomar decisiones.
- [x] **Comando central:** Voltear bocabajo→bocarriba y descubrirse activan onPlay (implementado).
- [x] **UX:** Selección de cartas desde mazo/descarte con modal reveal (Tiempo 0/3, Claridad 3).

## Completado recientemente

- [x] **Audit Main 2 completo:** 90 cartas auditadas, 12 bugs corregidos, 2 features implementados. Ver `AUDIT-MAIN2.md`.
- [x] **182 tests pasando** (100% pass rate).
- [x] **Hooks reactivos:** Solo disparan para carta top, no cubiertas.
- [x] **Server:** Manejo de EADDRINUSE, EISDIR y cierre limpio.
- [x] **Docs:** LEEME.md y README.md unificados.
- [x] **UI Draft:** Logo COMPILE en miniaturas, slot-title, número oculto, caja de cristal.
- [x] **UI Index:** Paleta de colores por dificultad (morado→amarillo), botón comenzar deshabilitado hasta seleccionar protocolo.
- [x] **Game:** Botón CANCELAR para efectos interactivos pendientes.
- [x] **Logic:** Corregido doble disparo en handler de línea.
- [x] **Log IA:** Mensajes de cartas jugadas bocabajo no revelan información (`IA jugó 1 carta bocabajo`).
- [x] **Modal Reveal:** Tiempo 0, Tiempo 3 y Claridad 3 usan modal para elegir cartas (no van a mano).
- [x] **Modal Narrativo IA (MVP):** Turnos de IA muestran acciones en modal con ritmo pausado (1s/jugada).

## Próximas Versiones

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

### v5.0.0 (Distribución)
- [ ] **Instalable/Ejecutable:** Empaquetado como app nativa (Electron/Tauri) o PWA instalable. Lanzar sin localhost ni navegador manual.

### v6.0.0 (Multijugador Local)
- [ ] **2 jugadores mismo ordenador:** Modo hotseat con turnos alternos en pantalla compartida.

### v7.0.0 (Multijugador Online)
- [ ] **2 jugadores online:** Partidas en tiempo real con WebSockets, salas y matchmaking básico.
