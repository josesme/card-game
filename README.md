# 🎮 COMPILE - Digital Card Game

Una versión digital del juego de cartas **COMPILE**, donde compites contra una IA en una carrera por compilar 3 protocolos.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Instalación](#instalación)
- [Cómo Jugar](#cómo-jugar)
- [Desarrollo](#desarrollo)
- [Arquitectura](#arquitectura)
- [Licencia](#licencia)

## ✨ Características

### ✅ Implementado (v2.0.0)

- **Motor de Habilidades Completo**
  - 72 cartas con efectos funcionales
  - Sistema de triggers (onPlay, onTurnStart, onTurnEnd)
  - Efectos persistentes
  - Interacción del jugador

- **Interfaz Visual Moderna**
  - Cartas visuales hermosas
  - Mesa clara con 3 líneas
  - Animaciones suaves
  - Colores por protocolo

- **Lógica de Juego Core**
  - Draft de protocolos
  - Sistema de turnos completo
  - Compilación automática
  - Puntuación con modificadores

### ⏳ En Desarrollo

- **Fase 2:** IA Inteligente (estrategia, minimax)
- **Fase 3:** Reglas Complejas (Control Component)
- **Fase 4:** Polish Final (guardado, historial)

## 🚀 Instalación

### Opción 1: Archivo Local

```bash
# Descargar proyecto
git clone https://github.com/your-username/compile-card-game.git
cd compile-card-game

# Abrir en navegador
# Simplemente abre src/index.html
```

### Opción 2: Servidor Local

```bash
# Con Python 3
python -m http.server 8000 --directory .

# Luego abre: http://localhost:8000/src/
```

## 🎯 Cómo Jugar

### 1. Draft (Selección de Protocolos)

- Se muestran 12 protocolos
- Selecciona 3 (tú y IA alternan)
- Estos forman tus "líneas de enfrentamiento"

### 2. Juego (Mesa)

- **Objetivo:** Compilar tus 3 protocolos
- **Compilación:** Cuando tu valor ≥ 10 Y > oponente en una línea
- **Acciones por turno:**
  1. Start (efectos iniciales)
  2. Check Compile (compilas si puedes)
  3. Action (juegas 1 carta o recargas)
  4. Check Cache (descartas a 5)
  5. End (efectos finales)

### 3. Cartas

Las cartas tienen 3 zonas:
- **Inicio (Persistente):** Siempre activa
- **Acción (Inmediata):** Se activa al jugar
- **Final (Auxiliar):** Efecto especial

Cada carta vale entre 0-6 puntos.

## 🔧 Desarrollo

### Estructura del Proyecto

```
compile-project/
├── src/                    # Código fuente
│   ├── index.html         # Interfaz HTML visual
│   ├── logic.js           # Motor de juego (1150+ líneas)
│   ├── abilities-engine.js # Motor de habilidades (700+ líneas)
│   └── style.css          # Estilos CSS modernos (915+ líneas)
├── data/
│   └── cards.json         # Base de datos de 72 cartas
├── docs/                  # Documentación
│   └── GUIA_GIT.md        # Guía completa de Git y flujos
├── .git/                  # Repositorio Git (historial)
└── package.json           # Configuración del proyecto
```

### Ejecución en Desarrollo

**Opción 1: Archivo Local**
```bash
# Simplemente abre en navegador
open src/index.html
# O haz doble click en src/index.html
```

**Opción 2: Servidor Local**
```bash
# Con Python 3
python -m http.server 8000 --directory .

# Luego abre: http://localhost:8000/src/
```

**Opción 3: Con npm**
```bash
npm run dev
# Abre src/index.html en navegador
```

### Editar y Crear Commits

**Ejemplo: Cambiar color del jugador**

1. Abre `src/style.css`
2. Busca: `--accent: #00d4ff;` (línea ~12)
3. Cambia a: `--accent: #00ff00;`
4. Guarda el archivo
5. Comitea:
```bash
git add src/style.css
git commit -m "style: cambiar color de jugador a verde"
```

**Ejemplo: Agregar nueva funcionalidad**

1. Edita `src/logic.js`
2. Haz cambios lógicos
3. Verifica en navegador (Ctrl+F5 para recargar sin caché)
4. Comitea:
```bash
git add src/logic.js
git commit -m "feat: nueva funcionalidad describiendo qué hace"
```

### Ver Cambios Antes de Commitear

```bash
# Ver qué cambió
git diff

# Ver cambios de un archivo específico
git diff src/style.css

# Ver cambios que no se han agregado
git status

# Ver cambios que ya se agregaron
git diff --staged
```

### Editar Cartas

Todas las cartas están en `data/cards.json`:

```json
{
  "Espíritu": [
    {
      "valor": 0,
      "nombre": "Espíritu 0",
      "h_inicio": "Efecto persistente",
      "h_accion": "Efecto al jugar",
      "h_final": "Efecto auxiliar"
    }
  ]
}
```

Cambiar una carta:

```bash
# 1. Edita data/cards.json
nano data/cards.json

# 2. Verifica cambios
git diff data/cards.json

# 3. Comitea
git add data/cards.json
git commit -m "balance: ajustar stats de Espíritu 2"
```

## 🏗️ Arquitectura

### Motor de Habilidades

```javascript
CARD_EFFECTS = {
  'Espíritu 0': {
    onPlay: [
      { action: 'refresh', target: 'self' },
      { action: 'draw', target: 'self', count: 1 }
    ],
    onTurnEnd: [
      { action: 'skipPhase', target: 'self', phase: 'checkCache' }
    ]
  }
}
```

### Sistema de Turnos

```
startTurn()
  ├─ onTurnStartEffects()
  ├─ checkCompilePhase()
  ├─ actionPhase()
  ├─ checkCache()
  └─ onTurnEndEffects()
```

### Cálculo de Puntuación

```javascript
calculateScore(line, player)
  // Suma valores base
  // + Aplica modificadores persistentes
  // = Puntuación total
```

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| Cartas | 72 |
| Protocolos | 12 |
| Líneas | 3 |
| Efectos por carta | 1-3 |
| Tipos de acciones | 10+ |
| Líneas de código | 2600+ |

## 🔄 Sistema de Control de Versiones

### Rama `main`
- Versión estable actual (v2.0.0)
- Código producción
- Documentación completa

### Rama `develop`
- Cambios en desarrollo
- Próximas features
- Testing

### Ramas `feature/*`
- Features específicas
- Fase 2 (IA Inteligente)
- Fase 3 (Reglas Complejas)

### Commits

Usar formato convencional:

```
feat: agregar IA inteligente
fix: corregir cálculo de puntuación
docs: actualizar README
style: reformatear código
refactor: simplificar motor de habilidades
```

## 📋 Próximas Versiones

### v2.1.0 (2 semanas)
- [ ] Animaciones mejoradas
- [ ] Sonidos opcionales
- [ ] Tema claro/oscuro

### v3.0.0 (4 semanas)
- [ ] IA con estrategia
- [ ] Evaluación de tablero
- [ ] Minimax básico

### v3.1.0 (5 semanas)
- [ ] Control Component
- [ ] Efectos complejos
- [ ] Cobertura avanzada

### v4.0.0 (6 semanas)
- [ ] Guardado de partida
- [ ] Historial de acciones
- [ ] Estadísticas

## 🤝 Contribuir

1. Fork el repositorio
2. Crea rama: `git checkout -b feature/tu-feature`
3. Haz cambios y commits
4. Push a la rama: `git push origin feature/tu-feature`
5. Abre Pull Request

## 📝 Licencia

MIT License - Ver LICENSE.md para detalles

## 👥 Autores

- **Desarrollo:** Compile Dev Team
- **Diseño de Juego:** [Basado en COMPILE oficial]
- **Implementación:** AI Assistant + Developer

## 📞 Soporte

Para problemas o sugerencias:

1. Abre una [Issue en GitHub](https://github.com/your-username/compile-card-game/issues)
2. Describe el problema
3. Incluye pasos para reproducir

## 🎊 Estado Actual

**v2.0.0** - ESTABLE

- ✅ Motor de habilidades (100%)
- ✅ Interfaz visual (100%)
- ⏳ IA inteligente (Próximo)

---

**Última actualización:** 7 de Marzo 2026

Para más información, ver `/docs` carpeta.
