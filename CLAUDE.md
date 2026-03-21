# CLAUDE.md - Instrucciones del proyecto

## Git
- No trabajar con ramas. Todo el trabajo se hace directamente en master.
- Hacer commit y push al terminar cada cambio.

## Testing
- Crear tests para cada funcionalidad nueva o cambio realizado.
- Lanzar los tests al terminar cada cambio para verificar que todo funciona.

## Backlog y documentación
- Antes de listar algo como "pendiente", verificar en el código si ya está implementado.
- Al cerrar una tarea, actualizar `docs/BACKLOG.md` y mover a "Completado".
- No duplicar en el backlog cosas que ya se pueden derivar del código o git history.

## Documentación durante el desarrollo
- Regla de juego resuelta o edge case aclarado → actualizar `docs/CODEX.md` en el momento.
- Decisión técnica o de diseño no obvia → documentar en comentario inline con contexto del porqué.
- No dejar la documentación para el final de la sesión; documentar al resolver.