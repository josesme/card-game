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
- **CHANGELOG.md:** Actualizar al cerrar cada milestone o versión. Ver sección específica más abajo.

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
5. **Documentar** → Actualizar BACKLOG, CODEX, CHANGELOG, o comentarios según corresponda.
6. **Commit** → Mensaje descriptivo, push inmediato.

---

## 📝 Mantenimiento del CHANGELOG.md

El archivo `CHANGELOG.md` centraliza el historial del proyecto de forma resumida pero expandible.

### Cuándo Actualizar

| Situación | Acción |
|-----------|--------|
| **Cada milestone completado** | Añadir entrada en versión correspondiente |
| **Nueva versión taggeada** | Crear nueva sección `<details>` para esa versión |
| **Bug fix importante** | Listar en la versión actual bajo "Bugs Corregidos" |
| **Feature completada** | Listar en "Cambios Implementados" |
| **Documento nuevo creado** | Añadir en "Archivos Relacionados" |

### Formato de Entrada

```markdown
### v2.1.0 — Nombre de la Versión

**Fecha:** Mes 2026

#### Cambios Implementados

- ✅ **ID-01:** Descripción breve del cambio
- ✅ **ID-02:** Otro cambio importante

#### Archivos Relacionados

- `src/archivo.js` — descripción del propósito
- `docs/documento.md` — documentación relacionada
```

### Secciones Expandibles

Usar formato `<details>` para mantener el archivo limpio:

```markdown
<details>
<summary><strong>Ver detalles de v2.1.0</strong></summary>

... contenido detallado ...

</details>
```

### Ejemplo de Actualización Rápida

Al completar una tarea del backlog:

1. **Commit** con mensaje convencional:
   ```
   feat(ai): resource depletion penalty for level 5
   ```

2. **Actualizar CHANGELOG.md** (sección de versión actual):
   ```markdown
   - ✅ **AI-06:** Penalización por deck vacío — nivel 5 gestiona recursos
   ```

3. **Actualizar BACKLOG.md** (mover a "Completado"):
   ```markdown
   - [x] **AI-06 · Nivel 5 · Penalización por deck vacío**
   ```

### Reglas

- ✅ **No duplicar** — Si ya está en git log, no hace falta detalle excesivo
- ✅ **Resumido pero útil** — Otra persona debe poder entender qué cambió
- ✅ **Enlaces a archivos** — Siempre listar archivos creados/modificados clave
- ✅ **Fecha aproximada** — Mes y año es suficiente
- ✅ **Inglés o Español** — Mensajes de commit en inglés, CHANGELOG en español
