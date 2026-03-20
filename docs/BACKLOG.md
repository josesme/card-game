# COMPILE - BACKLOG & ROADMAP

Documento para el seguimiento de bugs, mejoras y nuevas funcionalidades.

## Bugs & Tareas Pendientes

- [ ] **IA:** Mejorar evaluación de movimientos que disparan efectos complejos.
- [ ] **UI:** Solapamiento de cartas en stacks grandes en pantallas pequeñas.
- [x] **Amor 4:** IA usa cartas reveladas del jugador para tomar decisiones.
- [x] **Comando central:** Voltear bocabajo→bocarriba y descubrirse activan onPlay (implementado).

## Completado recientemente

- [x] **Audit Main 2 completo:** 90 cartas auditadas, 12 bugs corregidos, 2 features implementados. Ver `AUDIT-MAIN2.md`.
- [x] **176 tests pasando** (100% pass rate).
- [x] **Hooks reactivos:** Solo disparan para carta top, no cubiertas.
- [x] **Server:** Manejo de EADDRINUSE, EISDIR y cierre limpio.
- [x] **Docs:** LEEME.md y README.md unificados.

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
