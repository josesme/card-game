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

### Tests de integración

Los tests de integración prueban el flujo real del juego (startTurn → acción → endTurn), no funciones aisladas. La cobertura crece orgánicamente: **cada bug encontrado en el juego real debe dejar un test de integración** que garantice que no vuelve.

**Cuándo crear uno:**
- Al corregir un bug que los tests unitarios no detectaron.
- Al implementar un flujo que involucra dos o más funciones de motores distintos (`logic.js` + `abilities-engine.js`).
- Nunca de forma especulativa — solo cuando el escenario ya ha fallado en el juego real.

**Dónde van:** `tests/integration/` — un archivo por flujo o familia de carta (ej: `velocidad.integration.test.js`).

**Qué debe hacer un test de integración:**
1. Construir un `gameState` realista (con mazo, campo, mano).
2. Llamar a las funciones del motor en el orden real del juego (no mockear `drawCard`, `discard`, etc. — esas deben ejecutarse de verdad).
3. Afirmar el estado final observable (tamaño de mano, cartas en campo, etc.).

**Mantenimiento de tests — reglas para evitar deuda:**
- Si un test unitario queda absorbido por un test de integración que cubre el mismo escenario con más fidelidad, **eliminar el unitario**.
- Si al cambiar una función un test unitario empieza a fallar pero el test de integración sigue pasando, investigar si el unitario testea un detalle de implementación (no un comportamiento) — en ese caso, eliminarlo.
- Si un test necesita más de 3 mocks para funcionar, es señal de que debería ser un test de integración en su lugar.
- Revisar los tests existentes al cerrar cada bug: si alguno hubiera detectado el bug y no lo hizo, o si ya no aporta frente a los nuevos, actualizarlo o eliminarlo.

## Backlog

`docs/BACKLOG.md` es un backlog real: **solo contiene trabajo pendiente**. No hay secciones de "completado", "recientemente cerrado" ni historial.

- Cada entrada: título breve + una/dos líneas de descripción. Sin detalles de implementación.
- Antes de añadir algo, verificar que no esté ya implementado en el código.
- Al completar una tarea: **eliminarla del backlog** y distribuir la información según las reglas de documentación abajo.
- Tamaño de entrada: puede ser épica, user story o funcionalidad concreta — lo que corresponda.

## Documentación al cerrar tareas

Al terminar cualquier trabajo, seguir estas reglas según el tipo de cambio:

| Qué se cierra | Dónde va la información |
|---------------|------------------------|
| Regla de juego resuelta o FAQ aclarado | `docs/CODEX.md` — actualizar en el momento |
| Fix puntual o tarea menor | Solo el mensaje de commit. Nada más. |
| Cierre de bloque / milestone | `CHANGELOG.md` — nueva entrada con descripción + actualizar número de versión en `src/index.html` |
| Cambio mayor o redefinición de arquitectura | `README.md` — actualizar la sección correspondiente |

- Decisión técnica no obvia → comentario inline con contexto del porqué.
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
5. **Documentar** → Eliminar del BACKLOG. Distribuir info según tabla de "Documentación al cerrar tareas".
6. **Commit** → Mensaje descriptivo, push inmediato.

---

## 📝 Mantenimiento del CHANGELOG.md

El archivo `CHANGELOG.md` centraliza el historial del proyecto de forma resumida pero expandible.

### Cuándo Actualizar

Solo al cerrar un **bloque o milestone** (no por cada fix puntual — esos van solo en el commit).

| Situación | Acción |
|-----------|--------|
| **Milestone completado** | Nueva entrada en versión correspondiente + actualizar versión en `src/index.html` |
| **Nueva versión taggeada** | Crear nueva sección `<details>` para esa versión |
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

2. **Actualizar CHANGELOG.md** si cierra un bloque (sección de versión actual):
   ```markdown
   - ✅ **AI-06:** Penalización por deck vacío — nivel 5 gestiona recursos
   ```

3. **Eliminar la entrada del BACKLOG.md** (no mover, eliminar).

### Reglas

- ✅ **No duplicar** — Si ya está en git log, no hace falta detalle excesivo
- ✅ **Resumido pero útil** — Otra persona debe poder entender qué cambió
- ✅ **Enlaces a archivos** — Siempre listar archivos creados/modificados clave
- ✅ **Fecha aproximada** — Mes y año es suficiente
- ✅ **Inglés o Español** — Mensajes de commit en inglés, CHANGELOG en español
