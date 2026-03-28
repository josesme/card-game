# COMPILE - Digital Card Game

Versión digital del juego de cartas **COMPILE**, donde compites contra una IA en una carrera por compilar tus 3 protocolos antes que ella.

## Cómo ejecutar

### Opción 1: Sin terminal (la más fácil)

1. Descomprime `compile-project-git.tar.gz`
2. Abre la carpeta `compile-project/`
3. Haz doble clic en `launcher.html` (o `JUGAR.html`)
4. El juego abre en tu navegador — clic en "JUGAR AHORA"

No necesitas terminal, Python, Git ni Node.js.

### Opción 2: Con servidor local (recomendado para desarrollo)

```bash
npx serve . -p 8000
# Abre: http://localhost:8000/src/
```

### Opción 3: Con scripts

- **Windows:** doble clic en `START.bat`
- **Mac/Linux:** doble clic en `START.sh` (o `./START.sh`)

Espera a que diga "Iniciando servidor..." y abre `http://localhost:8000`.

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
├── launcher.html         # Doble clic para jugar sin servidor
├── JUGAR.html            # Alternativa a launcher.html
├── START.bat             # Lanzador Windows
├── START.sh              # Lanzador Mac/Linux
├── src/
│   ├── index.html          # Pantalla principal y selección de dificultad
│   ├── draft.html          # Fase de selección de protocolos
│   ├── game.html           # Mesa de juego
│   ├── logic.js            # Motor del juego
│   ├── abilities-engine.js # Motor de habilidades de cartas
│   ├── minimax.js          # IA minimax con alpha-beta
│   ├── ai-evaluator.js     # Evaluador de posición para IA
│   ├── cards-data.js       # Datos de las 180 cartas (Main 1 + Main 2)
│   └── style.css           # Estilos globales
├── tests/
│   └── main2-cards.test.js # Tests del motor de habilidades
├── docs/
│   ├── CODEX.md            # Fuente única de verdad: reglas, erratas, FAQ
│   └── BACKLOG.md          # Backlog de tareas pendientes
└── package.json
```

## Estado de implementación

| Componente | Estado |
|---|---|
| Motor de juego (ciclo de turno, compilación, mano) | ✅ Completo |
| 180 cartas con efectos (Main 1 + Main 2, 30 protocolos × 6) | ✅ Completo |
| Draft con selección alternada 1-2-2-1 | ✅ Completo |
| IA minimax con alpha-beta pruning (5 niveles) | ✅ Completo |
| Evaluador de posición (7 métricas) | ✅ Completo |
| Draft estratégico para IA (sinergias + contrapicks) | ✅ Completo |
| Información oculta respetada (IA no ve mano rival) | ✅ Completo |
| Control Component (regla avanzada) | ❌ No implementado |

## Estadísticas

| Métrica | Valor |
|---|---|
| Protocolos | 30 (15 Main 1 + 15 Main 2) |
| Cartas totales | 180 (6 por protocolo) |
| Niveles de dificultad | 5 |
| Métricas del evaluador IA | 7 |

## Solución de problemas

- **Página en blanco:** pulsa F5 o abre `launcher.html`
- **No puedo hacer clic:** espera a que cargue y pulsa Ctrl+F5
- **La IA no juega:** abre F12 > Console para ver los logs

## Documentación

- **[CHANGELOG.md](CHANGELOG.md)** — Historial de cambios y versiones (resumido con secciones expandibles).
- **[docs/CODEX.md](docs/CODEX.md)** — Fuente única de verdad: reglas, erratas y FAQ.
- **[docs/BACKLOG.md](docs/BACKLOG.md)** — Tareas pendientes y roadmap.
- **[docs/FASE-2-IA.md](docs/FASE-2-IA.md)** — Documentación técnica de la IA.
- **[DEV_INSTRUCTIONS.md](DEV_INSTRUCTIONS.md)** — Instrucciones para desarrollo y mantenimiento.

---

Basado en el juego de cartas físico [COMPILE](https://www.malditogames.com/juegos/compile-unidad-principal-01-juego/) de Michael Yang.
