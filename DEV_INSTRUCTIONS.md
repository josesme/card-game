# DEV_INSTRUCTIONS.md - Instrucciones de Desarrollo

> Este archivo contiene las reglas y convenciones que debe seguir cualquier asistente de IA durante el desarrollo del proyecto.

## Git

- No trabajar con ramas. Todo el trabajo se hace directamente en `master`.
- Hacer commit y push al terminar cada cambio.
- Usar mensajes de commit descriptivos y en inglés (convención: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`).
- Antes de commit, verificar `git status` y `git diff` para revisar cambios.

## Testing

- Crear tests para cada funcionalidad nueva o cambio realizado.
- Lanzar los tests (`npm test`) al terminar cada cambio para verificar que todo funciona.
- No mergear/pushear sin tests pasando.

## Backlog y documentación

- Antes de listar algo como "pendiente", verificar en el código si ya está implementado.
- Al cerrar una tarea, actualizar `docs/BACKLOG.md` y mover a "Completado".
- No duplicar en el backlog cosas que ya se pueden derivar del código o git history.

## Documentación durante el desarrollo

- Regla de juego resuelta o edge case aclarado → actualizar `docs/CODEX.md` en el momento.
- Decisión técnica o de diseño no obvia → documentar en comentario inline con contexto del porqué.
- No dejar la documentación para el final de la sesión; documentar al resolver.

## CSS — debugging de estilos que no se aplican

- **Nunca mover un elemento en el DOM para resolver un problema de estilo.** Cambia estilos, no estructura.
- Si una clase externa (`.ui-btn` de `ui-components.css`) no produce el resultado esperado: añadir una regla con selector ID (`#elemento`) en el `<style>` inline del mismo archivo. El ID tiene mayor especificidad que cualquier clase y garantiza que los valores se aplican.
- **Un diagnóstico, una verificación.** Hacer un solo cambio, confirmar si resolvió el problema, y solo entonces continuar. Los cambios especulativos en cadena sin verificación empeoran el estado y confunden la causa.
- Cuando el usuario muestra capturas indicando diferencia visual, asumir que tiene razón sobre el hecho aunque no sobre la causa. No descartar el problema como "sutil" o "de contexto" sin haber verificado con DevTools.

## Flujo de trabajo recomendado

1. **Entender la tarea** → Si hay ambigüedad, preguntar antes de actuar.
2. **Planificar** → Para tareas complejas, usar `todo_write` para trackear pasos.
3. **Implementar** → Hacer cambios mínimos y focalizados.
4. **Verificar** → `npm test` + revisar visualmente si aplica.
5. **Documentar** → Actualizar BACKLOG, CODEX, o comentarios según corresponda.
6. **Commit** → Mensaje descriptivo, push inmediato.
