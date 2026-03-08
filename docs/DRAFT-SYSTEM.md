# 🎮 DRAFT SYSTEM - PROTOCOLO SELECTION FRAMEWORK

**Versión:** 1.0.0  
**Fecha:** 8 de Marzo 2026  
**Status:** 📋 DOCUMENTADO | 🔨 EN IMPLEMENTACIÓN  
**Parte de:** Pre-Game Phase (Antes del Motor de Juego)

---

## 📋 Descripción General

El **Draft System** es la **fase pre-juego** donde jugador e IA alternan para seleccionar **3 protocolos de los 12 disponibles**. Los protocolos seleccionados forman las "líneas de enfrentamiento" que definen qué cartas pueden jugar.

**Mecánica:**
- Comenzar el Draft (elige de los 12 protocolos disponibles)
- Turno alterno: Jugador → IA → Jugador → IA → Jugador → IA
- Cada selección reduce opciones disponibles
- Total: 6 selecciones (3 por jugador)

---

## 🎯 Objetivos Estratégicos

### De Jugador
- Elegir protocolos sinérgicos con carta iniciales
- Bloquear combos del oponente
- Adaptar a estilo de juego preferido

### De IA
- Usar Minimax para evaluar mejor selección
- Anticipar qué elige el jugador
- Equilibrar defensa vs ataque

---

## 📊 Los 12 Protocolos

```javascript
const ALL_PROTOCOLS = [
  'Espíritu',      // VOLTEAR, DESPLAZAR, ROBAR
  'Muerte',        // ELIMINAR, ROBAR
  'Fuego',         // DESCARTAR POR EFECTO
  'Gravedad',      // DESPLAZAR, VOLTEAR, ROBAR
  'Vida',          // VOLTEAR, JUGAR, ROBAR
  'Luz',           // ROBAR, VOLTEAR, DESPLAZAR
  'Metal',         // PREVENIR, ROBAR, VOLTEAR
  'Plaga',         // DESCARTAR, VOLTEAR
  'Psique',        // ROBAR, MANIPULAR, DESPLAZAR
  'Velocidad',     // ROBAR, JUGAR, DESPLAZAR
  'Agua',          // DEVOLVER, ROBAR, VOLTEAR
  'Oscuridad'      // ROBAR, DESPLAZAR, MANIPULAR
];
```

---

## 🏗️ Arquitectura del Draft System

### 1. **draft-system.js** (Nuevo - 300-400 líneas)

**Responsabilidad:** Gestionar estado y lógica del draft

```javascript
class DraftSystem {
  constructor() {
    this.availableProtocols = [...ALL_PROTOCOLS]; // 12 disponibles
    this.playerSelected = [];      // 3 selecciones del jugador
    this.aiSelected = [];          // 3 selecciones de IA
    this.turn = 'player';          // Quién elige (player/ai)
    this.round = 0;                // 0-5 (6 rondas totales)
    this.isComplete = false;
  }

  // ========== ESTADO ==========
  getAvailable() {
    return this.availableProtocols;
  }

  getCurrentTurn() {
    return this.turn;
  }

  getRound() {
    return this.round;
  }

  isPlayerTurn() {
    return this.turn === 'player';
  }

  isAITurn() {
    return this.turn === 'ai';
  }

  // ========== SELECCIÓN ==========
  selectProtocol(protocol) {
    if (!this.availableProtocols.includes(protocol)) {
      throw new Error(`Protocolo no disponible: ${protocol}`);
    }

    if (this.turn === 'player') {
      this.playerSelected.push(protocol);
    } else {
      this.aiSelected.push(protocol);
    }

    // Remover de disponibles
    this.availableProtocols.splice(
      this.availableProtocols.indexOf(protocol), 
      1
    );

    console.log(`📍 ${this.turn} seleccionó: ${protocol}`);
    console.log(`   Disponibles: ${this.availableProtocols.length}. Ronda: ${this.round + 1}/6`);

    // Cambiar turno
    this.turn = this.turn === 'player' ? 'ai' : 'player';
    this.round++;

    // Verificar fin
    if (this.playerSelected.length === 3 && this.aiSelected.length === 3) {
      this.isComplete = true;
      console.log('✅ Draft completado');
    }

    return this.isComplete;
  }

  getPlayerSelection() {
    return [...this.playerSelected];
  }

  getAISelection() {
    return [...this.aiSelected];
  }

  // ========== IA DECISIÓN ==========
  getAIDecision(evaluator) {
    // Usar Minimax para evaluar mejor selección
    const availableCopy = [...this.availableProtocols];
    
    const scores = availableCopy.map(protocol => ({
      protocol,
      score: evaluator.evaluateProtocolSelection(
        protocol, 
        this.playerSelected, 
        this.aiSelected,
        this.availableProtocols
      )
    }));

    // Ordenar por score (mayor primero)
    scores.sort((a, b) => b.score - a.score);

    // Elegir el mejor
    const bestChoice = scores[0];
    
    console.log(`🤖 IA evaluó: ${scores.slice(0,3)
      .map(s => `${s.protocol}(${s.score.toFixed(1)})`)
      .join(', ')}`);

    return bestChoice.protocol;
  }

  // ========== RESET ==========
  reset() {
    this.availableProtocols = [...ALL_PROTOCOLS];
    this.playerSelected = [];
    this.aiSelected = [];
    this.turn = 'player';
    this.round = 0;
    this.isComplete = false;
  }
}
```

---

### 2. **draft-evaluator.js** (Nuevo - 200-300 líneas)

**Responsabilidad:** Evaluar calidad de cada protocolo disponible en el contexto del draft

```javascript
class DraftEvaluator {
  constructor() {
    this.protocolScores = {
      'Espíritu': { cardAdvantage: 8, flexibility: 9, combo: 7 },
      'Muerte': { cardAdvantage: 7, flexibility: 6, combo: 8 },
      'Fuego': { cardAdvantage: 6, flexibility: 7, combo: 6 },
      'Gravedad': { cardAdvantage: 7, flexibility: 8, combo: 8 },
      'Vida': { cardAdvantage: 8, flexibility: 8, combo: 7 },
      'Luz': { cardAdvantage: 8, flexibility: 9, combo: 7 },
      'Metal': { cardAdvantage: 6, flexibility: 5, combo: 5 },
      'Plaga': { cardAdvantage: 6, flexibility: 6, combo: 5 },
      'Psique': { cardAdvantage: 7, flexibility: 8, combo: 7 },
      'Velocidad': { cardAdvantage: 7, flexibility: 7, combo: 6 },
      'Agua': { cardAdvantage: 7, flexibility: 8, combo: 7 },
      'Oscuridad': { cardAdvantage: 6, flexibility: 7, combo: 6 }
    };
  }

  evaluateProtocolSelection(protocol, playerSelected, aiSelected, available) {
    let score = 0;

    // 1. PUNTUACIÓN BASE del protocolo
    const baseScores = this.protocolScores[protocol];
    score += baseScores.cardAdvantage * 2;  // Peso: cartas
    score += baseScores.flexibility * 1.5;  // Peso: flexibilidad
    score += baseScores.combo * 2;           // Peso: combos

    // 2. SINERGIA: complementa lo ya seleccionado por IA
    const aiSynergy = this.calculateSynergy(protocol, aiSelected);
    score += aiSynergy * 2;

    // 3. BLOQUEO: impide combo del oponente
    const blockValue = this.calculateBlockValue(protocol, playerSelected, available);
    score += blockValue * 1.5;

    // 4. BALANCE: evitar demasiados de un tipo
    const diversityBonus = this.calculateDiversityBonus(protocol, aiSelected);
    score += diversityBonus;

    // 5. META: qué está ganado en el meta actual
    const metaScore = this.getMetaScore(protocol);
    score += metaScore;

    return score;
  }

  calculateSynergy(protocol, selectedProtocols) {
    // Protocolos que funcionan bien juntos
    const synergies = {
      'Espíritu': { 'Luz': 2, 'Velocidad': 2, 'Psique': 1 },
      'Muerte': { 'Fuego': 2, 'Oscuridad': 2 },
      'Fuego': { 'Muerte': 2, 'Metal': 1 },
      'Gravedad': { 'Espíritu': 2, 'Agua': 1, 'Velocidad': 1 },
      'Vida': { 'Luz': 2, 'Agua': 2 },
      'Luz': { 'Espíritu': 2, 'Vida': 2, 'Agua': 1 },
      'Metal': { 'Fuego': 1, 'Plaga': 1 },
      'Plaga': { 'Metal': 1, 'Oscuridad': 1 },
      'Psique': { 'Espíritu': 1, 'Agua': 2 },
      'Velocidad': { 'Espíritu': 2, 'Gravedad': 1 },
      'Agua': { 'Vida': 2, 'Luz': 1, 'Psique': 2 },
      'Oscuridad': { 'Muerte': 2, 'Plaga': 1 }
    };

    let totalSynergy = 0;
    if (synergies[protocol]) {
      for (const selected of selectedProtocols) {
        if (synergies[protocol][selected]) {
          totalSynergy += synergies[protocol][selected];
        }
      }
    }
    return totalSynergy;
  }

  calculateBlockValue(protocol, playerSelected, available) {
    // Cuánto bloquea lo que el jugador necesita
    // Protocolos que son "amenaza" si los elige el oponente
    const threats = {
      'Luz': ['Espíritu', 'Vida'],     // Luz es muy fuerte, bloquea draws
      'Vida': ['Luz', 'Agua'],         // Vida es fuerte
      'Espíritu': ['Luz', 'Velocidad'] // Espíritu es muy flexible
    };

    let blockScore = 0;
    if (threats[protocol]) {
      for (const threat of threats[protocol]) {
        if (available.includes(threat)) {
          blockScore += 1;
        }
      }
    }

    return blockScore;
  }

  calculateDiversityBonus(protocol, aiSelected) {
    // Bonus si el protocolo es diferente a los ya seleccionados
    if (aiSelected.length < 2) return 2; // Primeros picks: diversidad

    // Bonus decreciente si ya hay muchos del mismo tipo
    const similarity = this.protocolScores[protocol];
    const avgSelected = aiSelected.map(p => this.protocolScores[p]).reduce((a, b) => ({
      cardAdvantage: (a.cardAdvantage + b.cardAdvantage) / 2,
      flexibility: (a.flexibility + b.flexibility) / 2,
      combo: (a.combo + b.combo) / 2
    }));

    // Si es parecido: penalizar
    const diff = Math.abs(similarity.cardAdvantage - avgSelected.cardAdvantage);
    return 2 - (diff > 1 ? 0 : 1);
  }

  getMetaScore(protocol) {
    // Protocolo que está fuerte en el meta actual
    // (Puede cambiar según balance updates)
    const metaScores = {
      'Espíritu': 1.5,
      'Luz': 2,
      'Vida': 1.5,
      'Agua': 1,
      'Psique': 0.5,
      'Metal': -0.5,
      'Plaga': -0.5,
      'Oscuridad': 0
    };
    return metaScores[protocol] || 0;
  }
}
```

---

## 🎨 Interfaz Visual (HTML)

```html
<!-- DRAFT SCREEN (Mostrar antes de initGame()) -->
<div id="draft-screen" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%); padding: 20px;">
  
  <!-- HEADER -->
  <h1 style="color: #00d4ff; font-size: 2.5em; margin-bottom: 10px;">⚡ COMPILE ⚡</h1>
  <p style="color: #888; margin-bottom: 40px;">Selecciona Tus Protocolos</p>

  <!-- ESTADO -->
  <div style="color: #aaa; margin-bottom: 20px; font-size: 0.9em;">
    <div id="draft-status" style="text-align: center;">
      <!-- Turno actual, ronda, etc -->
    </div>
  </div>

  <!-- PROTOCOLOS DISPONIBLES (Grid 4x3) -->
  <div id="draft-protocols" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 40px; max-width: 1200px;">
    <!-- Generado dinámicamente por JS -->
  </div>

  <!-- SELECCIONES -->
  <div style="display: flex; gap: 100px; margin-bottom: 40px;">
    <!-- JUGADOR -->
    <div style="text-align: center;">
      <div style="color: #00d4ff; margin-bottom: 15px;">👤 TU SELECCIÓN</div>
      <div id="player-draft-selection" style="display: flex; gap: 10px; flex-direction: column; min-width: 200px;">
        <!-- Protocolos seleccionados -->
      </div>
    </div>

    <!-- IA -->
    <div style="text-align: center;">
      <div style="color: #ff1744; margin-bottom: 15px;">🤖 IA SELECCIÓN</div>
      <div id="ai-draft-selection" style="display: flex; gap: 10px; flex-direction: column; min-width: 200px;">
        <!-- Protocolos seleccionados -->
      </div>
    </div>
  </div>

  <!-- BOTÓN LISTO (solo cuando draft está completo) -->
  <button id="start-game-btn" style="display: none; background: linear-gradient(135deg, #00d4ff, #0099cc); color: #0a0e27; border: none; padding: 16px 32px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1.1em;">
    🎮 COMENZAR JUEGO
  </button>
</div>
```

---

## 🎯 Flow del Draft - Mecánica 1-2-2-1

```
0. PRE-DRAFT
   └─ Asignación al azar: ¿Quién es PRIMER JUGADOR?
      (50% Jugador Humano, 50% IA)

1. SETUP
   ├─ Mostrar "COMPILE - Selecciona Tus Protocolos"
   ├─ Mostrar quién es PRIMER JUGADOR
   ├─ Listar 12 protocoles disponibles
   └─ Iniciar secuencia de selecciones

2. RONDA 1: PRIMER JUGADOR elige 1 protocolo
   ├─ Si PRIMER = HUMANO:
   │  ├─ Mostrar "Tu turno - Elige 1 de 12 protocolos"
   │  ├─ Esperar click
   │  └─ Agregar a selección
   │
   └─ Si PRIMER = IA:
      ├─ Mostrar "IA está pensando..."
      ├─ Usar evaluador
      └─ Mostrar elección (delay 1-2s)

3. RONDA 2: SEGUNDO JUGADOR elige 2 protocolos
   ├─ Mostrar "Tu turno - Elige 2 de 11 protocolos"
   ├─ Esperar 2 clicks
   ├─ O: Usar evaluador (si IA)
   └─ Agregar a selección

4. RONDA 3: PRIMER JUGADOR elige 2 protocolos
   ├─ Mostrar "Tu turno - Elige 2 de 9 protocolos"
   ├─ Esperar 2 clicks
   └─ Agregar a selección

5. RONDA 4: SEGUNDO JUGADOR elige 1 protocolo
   ├─ Mostrar "Tu turno - Elige 1 de 7 protocolos"
   ├─ Esperar 1 click
   └─ Agregar a selección

6. FINAL
   ├─ Total: 6 selecciones (3 por jugador)
   ├─ Mostrar "✅ Draft Completado"
   ├─ Resumen de selecciones ambos jugadores
   ├─ Botón "🎮 COMENZAR JUEGO"
   └─ Click → startGame() con protocolos seleccionados

7. INICIO DEL JUEGO
   ├─ gameState.player.protocols = playerSelected (3)
   ├─ gameState.ai.protocols = aiSelected (3)
   ├─ initGame() con protocolos dinámicos
   └─ Juego normal desde aquí
```

**Patrón de Selecciones:**
```
Ronda 1: PRIMER elige 1   → (12 disponibles)
Ronda 2: SEGUNDO elige 2  → (11 disponibles)
Ronda 3: PRIMER elige 2   → (9 disponibles)
Ronda 4: SEGUNDO elige 1  → (7 disponibles)

Total: 1+2+2+1 = 6 selecciones
       3 por jugador
```

---

## 📝 Integración con logic.js

### 1. Remover Hardcoded Protocols
```javascript
// ANTES (hardcoded):
player: { 
  protocols: ['Espíritu', 'Muerte', 'Fuego'],
  ...
}

// DESPUÉS (dinámico):
player: { 
  protocols: [], // Se llena después del draft
  ...
}
```

### 2. Agregar Draft Phase
```javascript
let gamePhase = 'draft'; // 'draft' | 'game'

function startDraft() {
  draftSystem = new DraftSystem();
  draftEvaluator = new DraftEvaluator();
  showDraftUI();
  updateDraftDisplay();
}

function playerSelectProtocol(protocol) {
  const draftComplete = draftSystem.selectProtocol(protocol);
  updateDraftDisplay();
  
  if (!draftComplete) {
    setTimeout(() => aiSelectProtocol(), 800);
  } else {
    startGame();
  }
}

function aiSelectProtocol() {
  const choice = draftSystem.getAIDecision(draftEvaluator);
  const draftComplete = draftSystem.selectProtocol(choice);
  updateDraftDisplay();
  
  if (!draftComplete) {
    // Esperar siguiente turno del jugador
  }
}

function startGame() {
  // Transferir selecciones del draft al gameState
  gameState.player.protocols = draftSystem.getPlayerSelection();
  gameState.ai.protocols = draftSystem.getAISelection();
  
  gamePhase = 'game';
  hideDraftUI();
  initGame();
}
```

---

## 🎨 Estilos CSS para Cards

```css
.protocol-card {
  width: 200px;
  height: 140px;
  border: 2px solid;
  border-radius: 8px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(26, 31, 58, 0.9), rgba(10, 14, 39, 0.95));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
  color: #e0e0e0;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.protocol-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4);
}

.protocol-card.unavailable {
  opacity: 0.4;
  cursor: not-allowed;
}

.protocol-card.unavailable:hover {
  transform: none;
  box-shadow: none;
}

.protocol-name {
  font-size: 1.3em;
  font-weight: bold;
  margin-bottom: 8px;
}

.protocol-abilities {
  font-size: 0.75em;
  color: #aaa;
  line-height: 1.4;
  flex: 1;
}

.protocol-available {
  font-size: 0.7em;
  color: #00ff41;
  font-weight: bold;
  margin-top: 8px;
}
```

---

## 📈 Estimación de Esfuerzo

| Componente | Líneas | Tiempo |
|-----------|--------|--------|
| draft-system.js | 300-400 | 2-3h |
| draft-evaluator.js | 200-300 | 1.5-2h |
| draft-ui.html | 150-200 | 1-1.5h |
| draft-ui.css | 100-150 | 0.5-1h |
| logic.js integration | 100-150 | 1-1.5h |
| Testing | - | 2-3h |
| **TOTAL** | **850-1200** | **8-11 horas** |

---

## 🧪 Test Cases

### Test 1: Draft Alternado
```javascript
test('Draft alternates player/ai correctly', () => {
  const draft = new DraftSystem();
  
  assert.equal(draft.getCurrentTurn(), 'player');
  draft.selectProtocol('Espíritu');
  assert.equal(draft.getCurrentTurn(), 'ai');
  draft.selectProtocol('Vida');
  assert.equal(draft.getCurrentTurn(), 'player');
});
```

### Test 2: Evaluación de Protocolo
```javascript
test('AI evaluates protocols correctly', () => {
  const evaluator = new DraftEvaluator();
  const score = evaluator.evaluateProtocolSelection(
    'Espíritu',
    ['Muerte'],
    ['Vida'],
    ALL_PROTOCOLS
  );
  
  assert.isNumber(score);
  assert.isGreaterThan(score, 0);
});
```

### Test 3: Fin de Draft
```javascript
test('Draft completes after 6 selections', () => {
  const draft = new DraftSystem();
  
  for (let i = 0; i < 6; i++) {
    const protocol = draft.getAvailable()[0];
    const isComplete = draft.selectProtocol(protocol);
    if (i < 5) {
      assert.isFalse(isComplete);
    } else {
      assert.isTrue(isComplete);
    }
  }
  
  assert.equal(draft.getPlayerSelection().length, 3);
  assert.equal(draft.getAISelection().length, 3);
});
```

---

## ✅ Checklist de Implementación

### Fase 1: Estructura Base
- [ ] Crear draft-system.js
- [ ] Crear draft-evaluator.js
- [ ] Crear draft-ui.js (render)

### Fase 2: UI Visual
- [ ] Crear draft-screen HTML
- [ ] Agregar estilos CSS
- [ ] Implementar click handlers

### Fase 3: Lógica IA
- [ ] Implementar evaluador de protocolos
- [ ] Integrar con DraftSystem
- [ ] Agregar delays visuals

### Fase 4: Integración
- [ ] Modificar logic.js para draft phase
- [ ] Pasar protocolos del draft a gameState
- [ ] Remover hardcoded protocols

### Fase 5: Testing
- [ ] Unit tests para DraftSystem
- [ ] Unit tests para DraftEvaluator
- [ ] Integration tests (draft → game)

---

## 🔗 Archivos Involucrados

**Nuevos:**
```
src/draft-system.js        (300-400 líneas)
src/draft-evaluator.js     (200-300 líneas)
src/draft-ui.js            (100-150 líneas)
src/draft-styles.css       (100-150 líneas)
```

**Modificar:**
```
src/logic.js               (+100-150 líneas)
src/game.html              (agregar draft-screen)
```

---

## 🚀 Siguiente Acción

Una vez implementado el Draft:

1. Validar que draft → game flow funciona
2. Testar que protocolos dinámicos crean mazos correctos
3. Testar que IA elige protocolos estratégicos
4. Luego: **FASE 3 (Control Component)** o **FASE 4 (Polish)**

---

**Última actualización:** 8 Marzo 2026  
**Status:** 📋 DOCUMENTADO | 🔨 LISTO PARA IMPLEMENTAR

