# COMPILE - Digital Card Game

Versión digital del juego de cartas **COMPILE**, donde compites contra una IA en una carrera por compilar tus 3 protocolos antes que ella.

## Cómo ejecutar

```bash
# Servidor local con npx (recomendado)
npx serve . -p 8000
# Abre: http://localhost:8000/src/

# Alternativa con npm
npm run dev
```

## Cómo Jugar

### 1. Selección de nivel

En la pantalla principal elige el nivel de dificultad de la IA (1–5). Cada nivel aumenta la profundidad de análisis del minimax.

### 2. Draft (1-2-2-1)

Se muestran los 15 protocolos disponibles. Tú y la IA elegís alternativamente:
- Tú eliges 1 → IA elige 2 → Tú eliges 2 → IA elige 1.
- Cada jugador termina con 3 protocolos, que forman las 3 líneas de enfrentamiento.

### 3. Mesa de juego

**Objetivo:** ser el primero en compilar tus 3 protocolos.

**Compilación:** si tu valor en una línea es ≥ 10 Y mayor que el de tu oponente, **debes** compilar esa línea.

**Turno:**
1. **Inicio** — efectos persistentes de tus cartas boca arriba
2. **Verificar Compilación** — compilas si puedes (obligatorio)
3. **Acción** — juegas 1 carta o actualizas tu mano
4. **Verificar Caché** — descartas hasta tener máximo 5 cartas
5. **Fin** — efectos finales de tus cartas boca arriba

**Cartas:** cada carta tiene valor 0–6 y hasta 3 efectos (inicio, acción, fin). Jugadas boca arriba solo en su línea; boca abajo en cualquier línea con valor fijo 2.

## Estructura del proyecto

```
compile-project/
├── src/
│   ├── index.html          # Pantalla principal y selección de dificultad
│   ├── draft.html          # Fase de selección de protocolos
│   ├── game.html           # Mesa de juego
│   ├── logic.js            # Motor del juego (~2400 líneas)
│   ├── abilities-engine.js # Motor de habilidades (~2700 líneas)
│   ├── minimax.js          # IA minimax con alpha-beta (~675 líneas)
│   ├── ai-evaluator.js     # Evaluador de posición para IA (~405 líneas)
│   ├── cards-data.js       # Datos de las 90 cartas (15 protocolos × 6)
│   └── style.css           # Estilos globales (~1275 líneas)
├── docs/
│   ├── CODEX.md            # Fuente única de verdad: reglas, erratas, FAQ
│   └── BACKLOG.md          # Backlog de tareas pendientes
└── package.json
```

## Estado de implementación

| Componente | Estado |
|---|---|
| Motor de juego (ciclo de turno, compilación, mano) | ✅ Completo |
| 90 cartas con efectos (15 protocolos × 6 cartas) | ✅ Completo |
| Draft con selección alternada 1-2-2-1 | ✅ Completo |
| IA minimax con alpha-beta pruning (5 niveles) | ✅ Completo |
| Evaluador de posición (7 métricas) | ✅ Completo |
| Draft estratégico para IA (sinergias + contrapicks) | ✅ Completo |
| Información oculta respetada (IA no ve mano rival) | ✅ Completo |
| Control Component (regla avanzada) | ❌ No implementado |

## Estadísticas

| Métrica | Valor |
|---|---|
| Protocolos | 15 |
| Cartas totales | 90 (6 por protocolo) |
| Líneas de código | ~8500 |
| Niveles de dificultad | 5 |
| Métricas del evaluador IA | 7 |

## Documentación

- **[docs/CODEX.md](docs/CODEX.md)** — reglas completas, erratas y FAQ. Fuente única de verdad.
- **[docs/BACKLOG.md](docs/BACKLOG.md)** — tareas pendientes y decisiones de diseño.

---

Basado en el juego de cartas físico [COMPILE](https://www.malditogames.com/juegos/compile-unidad-principal-01-juego/) de Michael Yang.