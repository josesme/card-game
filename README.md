# COMPILE - Digital Card Game

Versión digital del juego de cartas **COMPILE**, donde compites contra una IA en una carrera por compilar tus 3 protocolos antes que ella.

---

## 🚀 Cómo Ejecutar

### Opción 1: Sin terminal (la más fácil)

1. Abre la carpeta `compile-project/`
2. Haz doble clic en `launcher.html`
3. El juego se abre en tu navegador → clic en **"JUGAR AHORA"**

✅ No necesitas terminal, Python, Git ni Node.js.

### Opción 2: Con servidor local (desarrollo)

```bash
npx serve . -p 8000
# Abre: http://localhost:8000/src/
```

### Opción 3: Con scripts

- **Windows:** doble clic en `START.bat`
- **Mac/Linux:** doble clic en `START.sh`

---

## 🎮 Cómo Jugar

### 1. Selección de Modo y Dificultad

En la pantalla principal (**index.html**) configura tu partida:

#### **Nivel de Dificultad (1-5)**

| Nivel | Nombre | Profundidad IA | Comportamiento |
|-------|--------|----------------|----------------|
| **1** | SUBRUTINA | 1 | IA básica, jugadas aleatorias, sin defensa |
| **2** | ALGORITMO | 2 | IA táctica, defensa reactiva mínima |
| **3** | NÚCLEO | 3 | IA estándar, balance ataque/defensa |
| **4** | CENTINELA | 4 | IA avanzada, defensa proactiva, ve 2 turnos |
| **5** | SINGULARIDAD | 5 | IA total, gestión perfecta, casi sin errores |

Cada nivel tiene **2 variantes aleatorias** (A/B) con ligeros cambios de comportamiento.

#### **Set de Protocolos**

| Opción | Protocolos | Cartas | Dificultad |
|--------|------------|--------|------------|
| **MAIN 1** | 15 protocolos | 90 cartas | Base |
| **MAIN 2** | 15 protocolos | 90 cartas | Avanzado |
| **MAIN 1 + 2** | 30 protocolos | 180 cartas | Completo |

> **MAIN 2** introduce efectos más complejos y interacciones avanzadas.

### 2. Draft de Protocolos (1-2-2-1)

Se muestran los 15 (o 30) protocolos disponibles. Tú y la IA elegís alternativamente:

1. **Tú eliges 1** → colocas en tu espacio **izquierdo**
2. **IA elige 2** → coloca en sus espacios **izquierdo y medio**
3. **Tú eliges 2** → colocas en tus espacios **medio y derecho**
4. **IA elige 1** → coloca en su espacio **derecho**

✅ Cada jugador termina con **3 protocolos**, que forman las **3 líneas** de enfrentamiento.

> La IA usa draft estratégico: busca sinergias entre sus protocolos y contrapicks contra los tuyos.

### 3. Mesa de Juego

**Objetivo:** ser el primero en compilar tus **3 protocolos**.

**Compilación:** si tu valor en una línea es **≥ 10** Y **mayor** que el de tu oponente, **debes** compilar esa línea.

#### Turno (5 fases)

```
1. INICIO      → efectos persistentes de tus cartas boca arriba
2. COMPILACIÓN → compilas si puedes (obligatorio)
3. ACCIÓN      → juegas 1 carta O actualizas tu mano
4. CACHÉ       → descartas hasta tener máximo 5 cartas
5. FIN         → efectos finales de tus cartas boca arriba
```

#### Cartas

- **Valor:** 0–6
- **Efectos:** hasta 3 por carta (Inicio, Acción, Fin)
- **Boca arriba:** solo en su línea de protocolo (efectos activos)
- **Boca abajo:** cualquier línea, valor fijo = **2**

---

## 🏗️ Estructura del Proyecto

```
compile-project/
├── launcher.html           # Doble clic para jugar sin servidor
├── START.bat               # Lanzador Windows
├── START.sh                # Lanzador Mac/Linux
│
├── src/
│   ├── index.html          # Pantalla principal (modo + dificultad)
│   ├── draft.html          # Fase de draft 1-2-2-1
│   ├── game.html           # Mesa de juego
│   │
│   ├── logic.js            # Motor del juego
│   ├── abilities-engine.js # Motor de habilidades de cartas
│   ├── minimax.js          # IA con alpha-beta pruning
│   ├── ai-evaluator.js     # Evaluador de posición (7 métricas)
│   ├── ai-profiles.js      # 10 perfiles de IA (2×5 niveles)
│   ├── cards-data.js       # 180 cartas (Main 1 + Main 2)
│   │
│   ├── style.css           # Estilos globales
│   ├── design-tokens.css   # Variables de diseño
│   └── ui-components.css   # Componentes UI reutilizables
│
├── tests/
│   └── main2-cards.test.js # 139 tests del motor de habilidades
│
├── docs/
│   ├── CODEX.md            # Reglas oficiales, erratas, FAQ
│   ├── BACKLOG.md          # Tareas pendientes y roadmap
│   ├── CHANGELOG.md        # Historial de versiones
│   ├── FASE-2-IA.md        # Documentación técnica de IA
│   ├── FASE-3-CONTROL.md   # Diseño del Control Component
│   ├── DRAFT-SYSTEM.md     # Sistema de draft y estrategia
│   └── GUIA_GIT.md         # Guía de Git
│
├── AUDIT-MAIN2.md          # Auditoría completa de Main 2
├── CHANGELOG.md            # Historial de cambios
└── DEV_INSTRUCTIONS.md     # Instrucciones para desarrollo
```

---

## ✅ Estado de Implementación

| Componente | Estado |
|------------|--------|
| Motor de juego (ciclo de turno, compilación, mano) | ✅ Completo |
| 180 cartas con efectos (Main 1 + Main 2) | ✅ Completo |
| Draft con selección alternada 1-2-2-1 | ✅ Completo |
| IA minimax con alpha-beta pruning (5 niveles) | ✅ Completo |
| Evaluador de posición (7 métricas) | ✅ Completo |
| Draft estratégico para IA (sinergias + contrapicks) | ✅ Completo |
| 10 perfiles de IA (2 variantes × 5 niveles) | ✅ Completo |
| Información oculta respetada (IA no ve mano rival) | ✅ Completo |
| Modal reveal para selección de cartas (Tiempo 0/3, Claridad 3) | ✅ Completo |
| Fisher-Yates shuffle (barajado justo) | ✅ Completo |
| Dead line detection realista | ✅ Completo |
| Control Component (regla avanzada) | ❌ No implementado |

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| **Protocolos** | 30 (15 Main 1 + 15 Main 2) |
| **Cartas totales** | 180 (6 por protocolo) |
| **Niveles de dificultad** | 5 (con 2 variantes cada uno) |
| **Métricas del evaluador IA** | 7 |
| **Tests automatizados** | 139 (100% pass rate) |
| **Efectos de carta únicos** | 47+ |
| **Commits** | 70+ |

---

## 🧩 Solución de Problemas

| Problema | Solución |
|----------|----------|
| **Página en blanco** | Pulsa F5 o abre `launcher.html` directamente |
| **No puedo hacer clic** | Espera a que cargue completamente, pulsa Ctrl+F5 |
| **La IA no juega** | Abre F12 → Console para ver logs de decisión |
| **Estilos no se aplican** | Limpia caché del navegador (Ctrl+Shift+Supr) |
| **Sonidos no funcionan** | El juego no tiene sonidos implementados aún |

---

## 📚 Documentación

| Documento | Propósito |
|-----------|-----------|
| **[CHANGELOG.md](CHANGELOG.md)** | Historial de cambios y versiones (resumido con secciones expandibles) |
| **[docs/CODEX.md](docs/CODEX.md)** | Fuente única de verdad: reglas, erratas, FAQ |
| **[docs/BACKLOG.md](docs/BACKLOG.md)** | Tareas pendientes y roadmap |
| **[docs/FASE-2-IA.md](docs/FASE-2-IA.md)** | Documentación técnica de la IA (minimax, evaluador) |
| **[docs/DRAFT-SYSTEM.md](docs/DRAFT-SYSTEM.md)** | Sistema de draft y estrategia |
| **[docs/FASE-3-CONTROL.md](docs/FASE-3-CONTROL.md)** | Diseño del Control Component (regla avanzada) |
| **[AUDIT-MAIN2.md](AUDIT-MAIN2.md)** | Auditoría completa carta a carta de Main 2 |
| **[DEV_INSTRUCTIONS.md](DEV_INSTRUCTIONS.md)** | Instrucciones para desarrollo y mantenimiento |

---

## 🎯 Próximas Versiones

### v2.1.0 — AI Overhaul (En desarrollo)

- ✅ Perfiles de comportamiento por nivel
- ✅ Fisher-Yates shuffle
- ✅ Dead line detection realista
- ✅ Detección de amenaza en 2 turnos (niveles 4-5)
- ✅ Penalización por deck vacío (nivel 5)
- ⏳ Epsilon-greedy para niveles 1-2 (jugadas aleatorias)
- ⏳ Memoria del descarte por nivel

### v2.2.0 — Polish

- [ ] Animaciones de descarte y robo
- [ ] Sonidos básicos de interfaz
- [ ] Refactorización del sistema de modales

### v3.0.0 — Control Component

- [ ] Implementación del componente de control (regla avanzada)
- [ ] Fase "Verificar Control" en ciclo de turno
- [ ] Reorganización de protocolos

---

## 📝 Licencia

Basado en el juego de cartas físico [COMPILE](https://www.malditogames.com/juegos/compile-unidad-principal-01-juego/) de Michael Yang.

---

*Última actualización: 28 de Marzo 2026 · Versión actual: v2.1.0*
