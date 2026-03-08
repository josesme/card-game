# 🎮 FASE 3: CONTROL COMPONENT - REGLAS COMPLEJAS

**Versión:** 3.0.0 (Planificado)  
**Fecha:** 8 de Marzo 2026  
**Status:** 📋 DOCUMENTADO | ⏳ SIN COMENZAR  
**Dependencia:** Fase 2 (IA Inteligente) ✅ Completa

---

## 📋 Resumen Ejecutivo

Fase 3 implementa el **Control Component** - un sistema avanzado de efectos persistentes, restricciones de acciones y validaciones complejas que permiten reglas sofisticadas como:

- "Tu oponente no puede Compilar el próximo turno"
- "Cada vez que juegas una carta, roba 1"
- "Voltea todas las cartas sin efecto de inicio"
- Efectos que persisten múltiples turnos
- Stack de efectos con orden de resolución

---

## 🏗️ Arquitectura del Control Component

### 3 Módulos Nuevos

#### 1. **control-system.js** (Nuevo) - Gestor de Control

**Responsabilidad:** Gestionar efectos persistentes, restricciones y validaciones

**Métodos principales:**
```javascript
class ControlSystem {
  // Efectos persistentes: cartas que duran múltiples turnos
  addPersistentEffect(type, target, duration, condition)
  removePersistentEffect(effectId)
  hasPersistentEffect(target, type)
  getActivePersistentEffects(target)
  
  // Restricciones de acción: qué puede/no puede hacer un jugador
  addActionRestriction(player, restriction, duration)
  canPerformAction(player, action)
  getRestrictions(player)
  
  // Validaciones: validar movimientos legales
  isValidMove(move, gameState)
  isValidCardPlay(card, line, faceUp, gameState)
  
  // Limpieza: remover efectos expirados al fin de turno
  cleanupExpiredEffects(player)
  
  // Queries: preguntar estado
  isCompileBlocked(player)
  isPlayBlocked(player)
  canRefresh(player)
}
```

**Ejecución:** Al fin de cada turno:
```javascript
// Decrementar duraciones
controlSystem.cleanupExpiredEffects('player');
controlSystem.cleanupExpiredEffects('ai');
```

---

#### 2. **persistent-effects.js** (Nuevo) - Definición de Efectos

**Catálogo de efectos persistentes:**

```javascript
const PERSISTENT_EFFECTS = {
  // Block Compile: "Tu oponente no puede Compilar el siguiente turno"
  'blockCompile': {
    id: 'block-compile',
    name: 'Bloqueo de Compilación',
    type: 'restriction',
    duration: 1, // turnos
    target: 'opponent',
    onApply: ({ gameState, target }) => {
      return {
        blocked: true,
        reason: 'Compilación bloqueada por efecto'
      };
    },
    description: 'El oponente no puede compilar'
  },

  // Repeated Draw: "Al inicio de tu turno, roba 1 carta"
  'repeatedDraw': {
    id: 'repeated-draw',
    name: 'Robo Repetido',
    type: 'passive',
    duration: 3, // turnos
    trigger: 'onTurnStart',
    effect:({ gameState, target }) => {
      drawCard(target);
      updateStatus(`${target} roba 1 carta (efecto persistente)`);
    },
    description: 'Roba 1 carta cada turno'
  },

  // Flip All: "Voltea todas tus cartas sin efecto de inicio"
  'flipAll': {
    id: 'flip-all',
    name: 'Voltea Todo',
    type: 'immediate',
    duration: 'immediate',
    effect: ({ gameState, target }) => {
      LINES.forEach(line => {
        gameState.field[line][target].forEach(card => {
          if (!card.h_inicio) {
            card.faceDown = !card.faceDown;
          }
        });
      });
      updateStatus(`Todas las cartas sin efecto inicial volteadas`);
    },
    description: 'Voltea cartas sin efecto inicial'
  },

  // No Hand Limit: "Tu límite de mano es infinito este turno"
  'noHandLimit': {
    id: 'no-hand-limit',
    name: 'Sin Límite de Mano',
    type: 'restriction_removal',
    duration: 1, // turnos
    effect: () => {
      // Solo se usa en validación
    },
    description: 'Ignora límite de 5 cartas'
  },

  // Can'tPlay: "No puedes jugar cartas el siguiente turno"
  'cantPlay': {
    id: 'cant-play',
    name: 'Bloqueo de Juego',
    type: 'restriction',
    duration: 1,
    target: 'opponent',
    effect: () => {},
    description: 'No puedes jugar cartas'
  },

  // Forced Discard: "Tu oponente descarta 2 cartas"
  'forcedDiscard': {
    id: 'forced-discard',
    name: 'Descarte Forzado',
    type: 'immediate',
    duration: 'immediate',
    amount: 2,
    effect: ({ gameState, target, amount }) => {
      for (let i = 0; i < amount && gameState[target].hand.length > 0; i++) {
        const idx = Math.floor(Math.random() * gameState[target].hand.length);
        gameState[target].trash.push(gameState[target].hand.splice(idx, 1)[0]);
      }
      updateStatus(`${target} descarta ${amount} cartas`);
    },
    description: 'Descarta N cartas'
  }
};
```

---

#### 3. **effect-stack.js** (Nuevo) - Stack de Efectos

**Responsabilidad:** Resolver efectos en orden correcto (LIFO - Last In, First Out)

```javascript
class EffectStack {
  constructor() {
    this.stack = [];
    this.isResolving = false;
  }

  push(effect) {
    // Agregar efecto al stack
    this.stack.push(effect);
    console.log(`📚 Efecto agregado al stack: ${effect.name} (Total: ${this.stack.length})`);
  }

  async resolveAll(gameState) {
    // Resolver todos los efectos en orden
    this.isResolving = true;
    
    while (this.stack.length > 0) {
      const effect = this.stack.pop(); // LIFO
      console.log(`⚙️ Resolviendo: ${effect.name}`);
      
      try {
        await effect.execute(gameState);
        await this.delay(300); // Visual feedback
      } catch (e) {
        console.error(`❌ Error resolviendo ${effect.name}:`, e);
      }
    }
    
    this.isResolving = false;
    console.log(`✅ Stack vacío`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 📊 Tipos de Efectos Introducidos

### 1. **Efectos Persistentes (Persistent Effects)**

Duran múltiples turnos:

```javascript
// Metal 1: "Tu oponente no puede Compilar en el siguiente turno"
'Metal 1': {
  onPlay: [
    {
      type: 'persistent',
      effect: 'blockCompile',
      duration: 1,
      target: 'opponent'
    }
  ]
}
```

**Características:**
- ✅ Duran N turnos
- ✅ Se decrementan automáticamente
- ✅ Se aplican en fase correcta
- ✅ Pueden afectar múltiples aspectos

**Ejemplos:**
- Bloqueo de compilación (Metal 1)
- Robo repetido (Luz 1)
- Sin límite de mano (Agua 2)

---

### 2. **Restricciones de Acción (Action Restrictions)**

Impiden o permiten ciertas acciones:

```javascript
// Fuego 1: "Puedes descartar 1 carta para resolver este efecto: 
//          Descarta 1 carta. Tu oponente descarta 2 cartas."

// Si no descartas:
isValidMove(move) {
  if (this.controlSystem.hasRestriction('mustDiscard')) {
    if (move.action !== 'discard') {
      return false; // Movimiento inválido
    }
  }
}
```

**Restricciones posibles:**
- `mustDiscard` - Debes descartar
- `cantPlay` - No puedes jugar cartas
- `cantCompile` - No puedes compilar
- `cantCompileInLine` - No puedes compilar en línea X
- `mustPlayX` - Debes jugar X cartas

---

### 3. **Efectos Condicionales (Conditional Effects)**

Se aplican solo si se cumple condición:

```javascript
// Vida 4: "Revela la carta superior de tu mazo. 
//        Si es de un Protocolo de esta línea, juégala."

onEffect: {
  condition: (card, line) => card.protocol === gameState[player].protocols[line],
  ifTrue: 'playCard',
  ifFalse: 'addToHand'
}
```

**Condiciones comunes:**
- Protocolo coincide con línea
- Valor de carta > N
- Hay X cartas bocarriba
- Oponente tiene < N cartas

---

### 4. **Efectos en Cadena (Chained Effects)**

Un efecto dispara otro:

```javascript
// Cuando juegas Espíritu 2: "Roba 1 carta para cada una de 
// tus cartas bocarriba en esta línea"

// Esto dispara:
// 1. Contar cartas bocarriba
// 2. Robar N veces
// 3. Aplicar efectos de inicio de cada carta robada
```

**Stack de ejecución:**
```
1. Play card (Espíritu 2)
   ├─ onPlay effects
   │  ├─ Count face-up cards
   │  └─ Draw N cards
   │     ├─ onDraw effects (si existen)
   │     └─ onStart effects (de cartas robadas)
   ├─ Line value recalculate
   └─ Check compile
```

---

## 🔄 Ciclo de Vida de Efectos Persistentes

### Fase 1: Aplicación (onPlay)
```javascript
gameState.player.turn;
play('Metal 1', 'izquierda', true);

// En logic.js:
// Ejecutar onPlay effects
// → Agregar 'blockCompile' a efectos persistentes
// → Duración: 1 turno
```

### Fase 2: Duración
```
Turno 1 (IA - Turno actual de compilación bloqueado ❌)
├─ checkCompile → bloqueado por efecto
├─ action → puede jugar
└─ End → Duraciones se decrementan

Turno 2 (Jugador - Efecto expirado, puede compilar ✅)
├─ checkCompile → puede compilar
└─ ...
```

### Fase 3: Limpieza (onCleanup)
```javascript
function endTurn(player) {
  // ... normal turn end logic
  
  // NEW: Limpiar efectos expirados
  controlSystem.cleanupExpiredEffects(player);
  
  // Log
  const expired = controlSystem.getExpiredEffects(player);
  if (expired.length > 0) {
    console.log(`🧹 Efectos expirados:`, expired.map(e => e.name));
  }
}
```

---

## 📝 Casos de Uso Principales

### 1. Metal 1 - Bloqueo de Compilación
```javascript
// Actuación:
CARD_EFFECTS['Metal 1'] = {
  onPlay: [
    {
      type: 'persistent',
      effect: 'blockCompile',
      duration: 1, // next opponent turn
      target: 'opponent'
    }
  ]
}

// En checkCompilePhase():
if (controlSystem.isCompileBlocked('ai')) {
  updateStatus('🚫 Compilación bloqueada');
  startPhase('action'); // Saltar a acción
  return;
}
```

### 2. Luz 1 - Efecto al Fin de Turno
```javascript
// Actuación:
CARD_EFFECTS['Luz 1'] = {
  onTurnEnd: [
    {
      type: 'action',
      action: 'draw',
      count: 1
    }
  ]
}

// En endTurn():
const effects = gameState.field[line][player]
  .filter(card => card.card.h_final);
  
effects.forEach(card => {
  executeCardEffect(card.card, 'h_final');
});
```

### 3. Espíritu 1 - Ignorar Efectos en Línea
```javascript
// Actuación:
CARD_EFFECTS['Espíritu 1'] = {
  onPlay: [
    {
      type: 'persistent',
      effect: 'ignoreEffects',
      duration: 'turn',
      scope: 'line', // Solo esta línea
      target: 'all' // Todas las cartas
    }
  ]
}

// En executeCardEffect():
if (controlSystem.hasEffect(line, 'ignoreEffects')) {
  console.log('⚠️ Efecto ignorado por Espíritu 1');
  return; // No ejecutar
}
```

---

## 🎯 Validaciones Nuevas

### 1. Validar Juego Legal

```javascript
function isValidCardPlay(card, line, faceUp) {
  // Existentes:
  if (!canPlayInLine(card, line)) return false;
  
  // NEW: Control System Validations
  if (!controlSystem.canPerformAction('player', 'play')) {
    console.error('❌ Acción bloqueada');
    return false;
  }
  
  if (gameState.player.hand.length > 5 && 
      !controlSystem.hasEffect('noHandLimit')) {
    console.error('❌ Mano llena (límite: 5)');
    return false;
  }
  
  if (controlSystem.hasRestriction('mustPlaySpecific', card.protocol)) {
    if (card.protocol !== restriction.value) {
      console.error('❌ Debes jugar protocolo específico');
      return false;
    }
  }
  
  return true;
}
```

### 2. Validar Compilación

```javascript
function canCompile(player, line) {
  // Existentes:
  if (gameState.field[line].compiledBy) return false;
  
  const playerScore = calculateLineScore('player', line);
  const aiScore = calculateLineScore('ai', line);
  
  if (playerScore < 10 || playerScore <= aiScore) return false;
  
  // NEW: Control System Validations
  if (controlSystem.isCompileBlocked(player)) {
    console.log('❌ Compilación bloqueada por efecto');
    return false;
  }
  
  if (controlSystem.hasRestriction('cantCompileInLine', line)) {
    console.log('❌ No puedes compilar en esta línea');
    return false;
  }
  
  return true;
}
```

---

## 📊 Cambios en Archivos Existentes

### logic.js - Modificaciones

**1. Importar Control System**
```javascript
// Al inicio
const controlSystem = new ControlSystem();
const effectStack = new EffectStack();
```

**2. Modificar checkCompilePhase()**
```javascript
function checkCompilePhase(who) {
  updateStatus(`Fase: Comprobar Compilación`);
  
  // NEW: Validar restricciones
  if (controlSystem.isCompileBlocked(who)) {
    updateStatus('🚫 Compilación bloqueada');
    startPhase('action');
    return;
  }
  
  // ... resto del código
}
```

**3. Modificar endTurn()**
```javascript
function endTurn(player) {
  // ... efectos finales
  
  // NEW: Limpiar efectos persistentes expirados
  controlSystem.cleanupExpiredEffects(player);
  
  // NEW: Ejecutar efectos onTurnEnd de cartas
  executeOnTurnEndEffects(player);
  
  // ... cambiar turno
}
```

**4. Modificar executeOAuthEffect()**
```javascript
function executeCardEffect(card, phase, context) {
  // NEW: Agregar efecto al stack
  const effect = createEffectObject(card, phase, context);
  effectStack.push(effect);
  
  // NEW: Resolver en orden
  effectStack.resolveAll(gameState);
}
```

---

## 🧪 Testing Recomendado

### Test 1: Metal 1 - Bloqueo Simple
```javascript
// Setup: IA juega Metal 1 en línea izquierda
// Expected: Próximo turno del jugador, compilación bloqueada

test('Metal 1 blocks compile', () => {
  aiPlayCard('Metal 1', 'izquierda', true);
  startPlayerTurn();
  
  assert.isFalse(canCompile('player', 'izquierda'));
  assert.isTrue(controlSystem.isCompileBlocked('player'));
});
```

### Test 2: Efectos en Cadena
```javascript
// Setup: Jugador juega Espíritu 2 (roba por cartas bocarriba)
// Con 2 cartas bocarriba en la línea
// Expected: Roba 2 cartas

test('Espíritu 2 chains draw effect', () => {
  gameState.field['izquierda']['player'].push(faceDownCard);
  gameState.field['izquierda']['player'].push(faceDownCard);
  
  const initialHand = gameState.player.hand.length;
  playerPlayCard('Espíritu 2', 'izquierda', true);
  
  assert.equal(gameState.player.hand.length, initialHand + 2);
});
```

### Test 3: Duración de Efectos
```javascript
// Setup: Metal 1 aplicado en turno 1
// Expected: Bloqueado en turno 1, desbloqueado en turno 2

test('Persistent effect duration expires', () => {
  aiPlayCard('Metal 1', 'izquierda', true);
  assert.isTrue(controlSystem.isCompileBlocked('player'));
  
  endTurn('ai');
  assert.isTrue(controlSystem.isCompileBlocked('player')); // Aún activo
  
  endTurn('player');
  assert.isFalse(controlSystem.isCompileBlocked('player')); // Expirado
});
```

---

## 📈 Estimación de Esfuerzo

| Componente | Líneas | Tiempo | Dificultad |
|-----------|--------|--------|-----------|
| control-system.js | 400-500 | 4-5h | Media |
| persistent-effects.js | 200-300 | 2-3h | Baja |
| effect-stack.js | 150-200 | 2h | Media |
| logic.js modifications | 200-300 | 3-4h | Media |
| abilities-engine integration | 100-150 | 1-2h | Baja |
| Testing & debugging | 200-300 | 4-6h | Media |
| **TOTAL** | **1250-1550** | **16-23 horas** | **Media** |

---

## 🔗 Dependencias

- ✅ Fase 1: Motor de Juego Core
- ✅ Fase 2: IA Inteligente
- 📋 Fase 3: Control Component (Este)
- ⏳ Fase 4: Polish Final (Después)

---

## 📌 Referencias

### Archivos Involucrados (Nuevos)

```
src/
├─ control-system.js (400-500 líneas)
├─ persistent-effects.js (200-300 líneas)
├─ effect-stack.js (150-200 líneas)
├─ logic.js (MODIFICAR - +200-300 líneas)
└─ abilities-engine.js (REVISAR - posibles cambios)

docs/
└─ FASE-3-CONTROL.md (Este archivo)
```

### Configuración en game.html

```html
<!-- Agregar después de logic.js -->
<script src="control-system.js"></script>
<script src="persistent-effects.js"></script>
<script src="effect-stack.js"></script>
```

---

## ✅ Checklist de Implementación

### Semana 1: Estructura Base
- [ ] Crear control-system.js con métodos core
- [ ] Crear persistent-effects.js con catálogo inicial
- [ ] Crear effect-stack.js 
- [ ] Integrar en logic.js

### Semana 2: Lógica de Juego
- [ ] Implementar checkCompilePhase validations
- [ ] Implementar endTurn cleanup
- [ ] Implementar effect stacking en executeCardEffect
- [ ] Actualizar isValidCardPlay

### Semana 3: Testing & Bugs
- [ ] Unit tests para cada efecto
- [ ] Integration tests para cadenas
- [ ] Validar Metal 1, Luz 1, Espíritu 2, etc.
- [ ] Debug y edge cases

---

## 🚀 Next Steps (Después de Fase 3)

**Fase 4: Polish Final**
- Sistema de guardado de partidas
- Historial de movimientos/efectos
- Replay de partidas
- Mejoras de UX/animaciones

---

**Última actualización:** 8 Marzo 2026  
**Autor:** COMPILE Development Team  
**Status:** 📋 DOCUMENTADO | ⏳ LISTO PARA IMPLEMENTAR
