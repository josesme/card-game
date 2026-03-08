/**
 * ⚡ COMPILE - Digital Card Game Engine
 * Version: 2.0.0
 * Last Updated: 2026-03-07
 * 
 * Core Game Logic - Motor de Juego Principal
 * - Sistema de turnos completo
 * - Lógica de compilación automática
 * - Integración con abilities-engine.js
 * - Efectos persistentes y modificadores
 */

// Core Game Logic for Compile - Official Rules Updated
const ui = {
    playerDeckCount: document.getElementById('player-deck-count'),
    playerTrashCount: document.getElementById('player-trash-count'),
    aiDeckCount: document.getElementById('ai-deck-count'),
    aiTrashCount: document.getElementById('ai-trash-count'),
    playerHand: document.getElementById('player-hand'),
    aiHand: document.getElementById('ai-hand'),
    playerStatus: document.getElementById('player-status'),
    aiStatus: document.getElementById('ai-status'),
    actionModal: document.getElementById('action-modal'),
    modalCardPreview: document.getElementById('modal-card-preview'),
    btnPlayUp: document.getElementById('btn-play-up'),
    btnPlayDown: document.getElementById('btn-play-down'),
    btnCancel: document.getElementById('btn-cancel'),
    confirmArea: document.getElementById('command-confirm'),
    confirmMsg: document.getElementById('confirm-msg'),
    btnConfirmYes: document.getElementById('btn-confirm-yes'),
    btnConfirmNo: document.getElementById('btn-confirm-no'),
    btnRefresh: document.getElementById('player-deck-btn'),
    gameOverModal: document.getElementById('game-over-modal'),
    winnerText: document.getElementById('winner-text'),
    btnRestart: document.getElementById('btn-restart'),
};

const LINES = ['izquierda', 'centro', 'derecha'];

// Protocol Data from PDF - Traducido (12 Oficiales)
const PROTOCOL_DEFS = {
    'Espíritu': { color: '#8b5cf6', abilities: 'VOLTEAR, DESPLAZAR, ROBAR' },
    'Muerte': { color: '#ef4444', abilities: 'ELIMINAR, ROBAR' },
    'Fuego': { color: '#f97316', abilities: 'DESCARTAR POR EFECTO' },
    'Gravedad': { color: '#6366f1', abilities: 'DESPLAZAR, VOLTEAR, ROBAR' },
    'Vida': { color: '#10b981', abilities: 'VOLTEAR, JUGAR, ROBAR' },
    'Luz': { color: '#facc15', abilities: 'ROBAR, VOLTEAR, DESPLAZAR' },
    'Metal': { color: '#94a3b8', abilities: 'PREVENIR, ROBAR, VOLTEAR' },
    'Plaga': { color: '#a855f7', abilities: 'DESCARTAR, VOLTEAR' },
    'Psique': { color: '#ec4899', abilities: 'ROBAR, MANIPULAR, DESPLAZAR' },
    'Velocidad': { color: '#06b6d4', abilities: 'ROBAR, JUGAR, DESPLAZAR' },
    'Agua': { color: '#3b82f6', abilities: 'DEVOLVER, ROBAR, VOLTEAR' },
    'Oscuridad': { color: '#64748b', abilities: 'ROBAR, DESPLAZAR, MANIPULAR' }
};

// Base de Datos de Cartas Incrustada (para evitar errores de CORS local)
const GLOBAL_CARDS = {  "Espíritu": [
    {"valor": 0, "nombre": "Espíritu 0", "fase": "Action", "h_inicio": "", "h_accion": "Actualiza. Roba 1 carta.", "h_final": "Sáltate tu fase de comprobar caché."},
    {"valor": 1, "nombre": "Espíritu 1", "fase": "Start", "h_inicio": "Ignora los efectos de las otras cartas en esta línea.", "h_accion": "", "h_final": ""},
    {"valor": 2, "nombre": "Espíritu 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta para cada una de tus cartas bocarriba en esta línea.", "h_final": ""},
    {"valor": 3, "nombre": "Espíritu 3", "fase": "Action", "h_inicio": "Cuando juegues esta carta: Primero, puedes cambiarla.", "h_accion": "", "h_final": ""},
    {"valor": 4, "nombre": "Espíritu 4", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Espíritu 5", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta.", "h_final": ""}
  ],
  "Muerte": [
    {"valor": 0, "nombre": "Muerte 0", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 de tus cartas bocarriba. Roba 3 cartas.", "h_final": ""},
    {"valor": 1, "nombre": "Muerte 1", "fase": "Start", "h_inicio": "Esta carta no se puede mover, voltear ni eliminar.", "h_accion": "", "h_final": ""},
    {"valor": 2, "nombre": "Muerte 2", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 de las cartas de tu oponente. Si lo haces, descarta 1 carta.", "h_final": ""},
    {"valor": 3, "nombre": "Muerte 3", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 de tus cartas bocarriba. Elimina 1 de las cartas de tu oponente.", "h_final": ""},
    {"valor": 4, "nombre": "Muerte 4", "fase": "Action", "h_inicio": "", "h_accion": "Elimina esta carta. Roba 2 cartas.", "h_final": ""},
    {"valor": 5, "nombre": "Muerte 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Fuego": [
    {"valor": 0, "nombre": "Fuego 0", "fase": "Action", "h_inicio": "Puedes descartar 1 carta para resolver este efecto:", "h_accion": "Elimina 1 de las cartas de tu oponente.", "h_final": ""},
    {"valor": 1, "nombre": "Fuego 1", "fase": "Action", "h_inicio": "Puedes descartar 1 carta para resolver este efecto:", "h_accion": "Descarta 1 carta. Tu oponente descarta 2 cartas.", "h_final": ""},
    {"valor": 2, "nombre": "Fuego 2", "fase": "Action", "h_inicio": "Puedes descartar 1 carta para resolver este efecto:", "h_accion": "Roba 2 cartas.", "h_final": ""},
    {"valor": 3, "nombre": "Fuego 3", "fase": "Action", "h_inicio": "Puedes descartar 1 carta para resolver este efecto:", "h_accion": "Cambia 1 carta.", "h_final": ""},
    {"valor": 4, "nombre": "Fuego 4", "fase": "Action", "h_inicio": "Puedes descartar 1 carta para resolver este efecto:", "h_accion": "Voltea 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Fuego 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Gravedad": [
    {"valor": 0, "nombre": "Gravedad 0", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Intercambia 2 de tus protocolos.", "h_final": ""},
    {"valor": 1, "nombre": "Gravedad 1", "fase": "Action", "h_inicio": "", "h_accion": "Mueve todas las cartas de esta línea a otra línea.", "h_final": ""},
    {"valor": 2, "nombre": "Gravedad 2", "fase": "Action", "h_inicio": "", "h_accion": "Mueve 1 de tus cartas a otra de tus líneas.", "h_final": ""},
    {"valor": 4, "nombre": "Gravedad 4", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 de tus cartas. Descarta 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Gravedad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Gravedad 6", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 de tus cartas.", "h_final": ""}
  ],
  "Vida": [
    {"valor": 0, "nombre": "Vida 0", "fase": "Action", "h_inicio": "", "h_accion": "Juega la carta superior de tu mazo.", "h_final": ""},
    {"valor": 1, "nombre": "Vida 1", "fase": "Action", "h_inicio": "", "h_accion": "Juega la carta superior de tu mazo bocabajo.", "h_final": ""},
    {"valor": 2, "nombre": "Vida 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Puedes devolver 1 de tus cartas.", "h_final": ""},
    {"valor": 3, "nombre": "Vida 3", "fase": "Action", "h_inicio": "", "h_accion": "Juega la carta superior de tu mazo. Puedes voltear esta carta.", "h_final": ""},
    {"valor": 4, "nombre": "Vida 4", "fase": "Action", "h_inicio": "", "h_accion": "Revela la carta superior de tu mazo. Si es de un Protocolo de esta línea, juégala.", "h_final": ""},
    {"valor": 5, "nombre": "Vida 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Luz": [
    {"valor": 0, "nombre": "Luz 0", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta. Roba tantas cartas como el Valor de la carta volteada.", "h_final": ""},
    {"valor": 1, "nombre": "Luz 1", "fase": "End", "h_inicio": "", "h_accion": "", "h_final": "Final: Roba 1 carta."},
    {"valor": 2, "nombre": "Luz 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Revela 1 carta bocabajo. Puedes cambiar o voltear esa carta.", "h_final": ""},
    {"valor": 3, "nombre": "Luz 3", "fase": "Action", "h_inicio": "", "h_accion": "Cambia todas las cartas bocabajo de esta línea a otra línea.", "h_final": ""},
    {"valor": 4, "nombre": "Luz 4", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente te revela su mano.", "h_final": ""},
    {"valor": 5, "nombre": "Luz 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Metal": [
    {"valor": 0, "nombre": "Metal 0", "fase": "Start", "h_inicio": "El Valor total de tu oponente en esta línea se reduce en 2.", "h_accion": "Voltea 1 carta.", "h_final": ""},
    {"valor": 1, "nombre": "Metal 1", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Tu oponente no puede Compilar en el siguiente turno.", "h_final": ""},
    {"valor": 2, "nombre": "Metal 2", "fase": "Start", "h_inicio": "Tu oponente no puede jugar cartas bocabajo en esta línea.", "h_accion": "", "h_final": ""},
    {"valor": 3, "nombre": "Metal 3", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Elimina todas las cartas de otra línea que tenga 8 o más cartas.", "h_final": ""},
    {"valor": 5, "nombre": "Metal 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Metal 6", "fase": "Start", "h_inicio": "Si se cubre o se voltea esta carta: Primero, elimina esta carta.", "h_accion": "", "h_final": ""}
  ],
  "Plaga": [
    {"valor": 0, "nombre": "Plaga 0", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Revela 1 de tus cartas bocabajo. Si lo haces, tu oponente la devuelve.", "h_final": ""},
    {"valor": 1, "nombre": "Plaga 1", "fase": "Start", "h_inicio": "Tu oponente no puede mover este protocolo.", "h_accion": "Roba 1 carta.", "h_final": ""},
    {"valor": 2, "nombre": "Plaga 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Tu oponente elige e intercambia 2 de sus protocolos.", "h_final": ""},
    {"valor": 3, "nombre": "Plaga 3", "fase": "End", "h_inicio": "", "h_accion": "", "h_final": "Final: Tu oponente debe devolver 1 de sus cartas si tiene más cartas que tú en esta línea."},
    {"valor": 4, "nombre": "Plaga 4", "fase": "Action", "h_inicio": "", "h_accion": "Mueve 1 de las cartas de tu oponente a la misma línea en su otro protocolo.", "h_final": ""},
    {"valor": 5, "nombre": "Plaga 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Psique": [
    {"valor": 0, "nombre": "Psique 0", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Tu oponente descarta 2 cartas y, luego, revela su mano.", "h_final": ""},
    {"valor": 1, "nombre": "Psique 1", "fase": "Start", "h_inicio": "Tu oponente solo puede jugar cartas bocabajo.", "h_accion": "", "h_final": "Inicial: Voltea esta carta."},
    {"valor": 2, "nombre": "Psique 2", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente descarta 2 cartas. Reorganiza sus Protocolos.", "h_final": ""},
    {"valor": 3, "nombre": "Psique 3", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente descarta 1 carta. Cambia 1 de sus cartas.", "h_final": ""},
    {"valor": 4, "nombre": "Psique 4", "fase": "End", "h_inicio": "", "h_accion": "", "h_final": "Final: Puedes devolver 1 de las cartas de tu oponente. Si lo haces, voltea esta carta."},
    {"valor": 5, "nombre": "Psique 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Velocidad": [
    {"valor": 0, "nombre": "Velocidad 0", "fase": "Action", "h_inicio": "", "h_accion": "Actualiza. Roba 1 carta. Juega 1 carta.", "h_final": ""},
    {"valor": 1, "nombre": "Velocidad 1", "fase": "End", "h_inicio": "", "h_accion": "", "h_final": "Final: Roba 1 carta. Juega 1 carta."},
    {"valor": 2, "nombre": "Velocidad 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Desplaza todas las cartas de esta línea a otra línea. Juega 1 carta.", "h_final": ""},
    {"valor": 3, "nombre": "Velocidad 3", "fase": "Action", "h_inicio": "", "h_accion": "Intercambia esta carta con otra de tus cartas. Juega 1 carta.", "h_final": ""},
    {"valor": 4, "nombre": "Velocidad 4", "fase": "Action", "h_inicio": "", "h_accion": "Mueve 1 de tus cartas. Juega 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Velocidad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Agua": [
    {"valor": 0, "nombre": "Agua 0", "fase": "Action", "h_inicio": "", "h_accion": "Voltea otra carta. Voltea esta carta.", "h_final": ""},
    {"valor": 1, "nombre": "Agua 1", "fase": "Action", "h_inicio": "", "h_accion": "En cada una de tus otras líneas, juega bocabajo la carta superior de tu mazo.", "h_final": ""},
    {"valor": 2, "nombre": "Agua 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Reorganiza tus Protocolos.", "h_final": ""},
    {"valor": 3, "nombre": "Agua 3", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve todas las cartas con Valor 2 de 1 línea.", "h_final": ""},
    {"valor": 4, "nombre": "Agua 4", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve 1 de tus cartas.", "h_final": ""},
    {"valor": 5, "nombre": "Agua 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Oscuridad": [
    {"valor": 0, "nombre": "Oscuridad 0", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta. Roba 1 carta para cada carta bocabajo en esta línea.", "h_final": ""},
    {"valor": 1, "nombre": "Oscuridad 1", "fase": "End", "h_inicio": "", "h_accion": "", "h_final": "Final: Roba 1 carta."},
    {"valor": 2, "nombre": "Oscuridad 2", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 de tus cartas por 1 de las cartas de tu oponente.", "h_final": ""},
    {"valor": 3, "nombre": "Oscuridad 3", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 de tus cartas. Puedes voltearla.", "h_final": ""},
    {"valor": 4, "nombre": "Oscuridad 4", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta. Tu oponente descarta 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Oscuridad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ]
};

// Game State
let gameState = {
    player: { 
        deck: [], trash: [], hand: [], 
        protocols: JSON.parse(sessionStorage.getItem('playerProtocols') || '["Espíritu", "Muerte", "Fuego"]'),
        compiled: [] 
    },
    ai: { 
        deck: [], trash: [], hand: [], 
        protocols: JSON.parse(sessionStorage.getItem('aiProtocols') || '["Vida", "Luz", "Oscuridad"]'),
        compiled: [] 
    },
    field: {
        izquierda: { player: [], ai: [], compiledBy: null },
        centro: { player: [], ai: [], compiledBy: null },
        derecha: { player: [], ai: [], compiledBy: null },
    },
    turn: 'player', // 'player' or 'ai'
    phase: 'start', // 'start', 'check_compile', 'action', 'check_cache', 'end'
    selectedCardIndex: null,
    selectionMode: false,
    effectContext: null, // { type: 'discard'|'eliminate'|'flip', count: 1, target: 'player'|'ai', ... }
    effectQueue: [],
};

function createDeckForPlayer(target) {
    let deck = [];
    const protocols = gameState[target].protocols;
    
    console.log(`🎴 Building deck for ${target}. Protocols:`, protocols);
    
    protocols.forEach(proto => {
        // Encontrar el nombre real en GLOBAL_CARDS
        if (GLOBAL_CARDS[proto]) {
            const cardsForProto = GLOBAL_CARDS[proto];
            console.log(`  ✅ Found ${proto}: ${cardsForProto.length} cards`);
            cardsForProto.forEach(cardData => {
                deck.push({
                    id: Math.random().toString(36).substr(2, 9),
                    ...cardData,
                    protocol: proto
                });
            });
        } else {
            console.warn(`  ⚠️ Protocol not found in GLOBAL_CARDS: ${proto}`);
        }
    });
    
    console.log(`  📊 Total cards in deck before shuffle: ${deck.length}`);
    const shuffled = deck.sort(() => Math.random() - 0.5);
    console.log(`  📊 Deck ready: ${shuffled.length} cards`);
    
    return shuffled;
}

function initGame() {
    console.log('=== initGame() START ===');
    
    try {
        console.log('📦 Creating decks...');
        gameState.player.deck = createDeckForPlayer('player');
        console.log(`  ✅ Player deck created: ${gameState.player.deck.length} cards`);
        
        gameState.ai.deck = createDeckForPlayer('ai');
        console.log(`  ✅ AI deck created: ${gameState.ai.deck.length} cards`);
        
        console.log('🃏 Drawing 5 cards for each player...');
        for(let i=0; i<5; i++) {
            drawCard('player');
            drawCard('ai');
        }
        console.log(`  ✅ Player hand: ${gameState.player.hand.length} cards`);
        console.log(`  ✅ AI hand: ${gameState.ai.hand.length} cards`);
        
        console.log('🎨 Initializing protocol display...');
        initProtocolDisplay();
        console.log('  ✅ Protocol display initialized');
        
        console.log('🔗 Initializing line listeners...');
        initLineListeners();
        console.log('  ✅ Line listeners initialized');
        
        console.log('🖼️ Updating UI...');
        updateUI();
        console.log('  ✅ UI updated');
        
        console.log('🎬 Starting player turn...');
        startTurn('player');
        console.log('  ✅ Turn started');
        
        console.log('=== initGame() END - SUCCESS ===');
    } catch (error) {
        console.error('❌ Error in initGame():', error);
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    }
}

function initLineListeners() {
    LINES.forEach(line => {
        const lineEl = document.getElementById(`line-${line}`);
        if (!lineEl) {
            console.warn(`Line element not found: line-${line}`);
            return;
        }
        lineEl.onclick = () => {
            if (gameState.selectionMode) {
                finalizePlay(line, true);
            } else if (gameState.effectContext && gameState.effectContext.waitingForLine) {
                handleShiftTargetLine(line);
            }
        };
    });
}

function handleShiftTargetLine(destinationLine) {
    const ctx = gameState.effectContext;
    const { line, target, cardIdx } = ctx.selectedCard;
    
    if (line === destinationLine) return; // Must move to a different line
    if (gameState.field[destinationLine].compiledBy) return;

    const cardObj = gameState.field[line][target].splice(cardIdx, 1)[0];
    gameState.field[destinationLine][target].push(cardObj);
    
    ctx.selected.push(cardObj);
    if (ctx.selected.length >= ctx.count) {
        finishEffect();
    } else {
        updateUI();
    }
}

function initProtocolDisplay() {
    LINES.forEach((line, idx) => {
        const pProto = gameState.player.protocols[idx];
        const aProto = gameState.ai.protocols[idx];

        const pColor = PROTOCOL_DEFS[pProto] ? PROTOCOL_DEFS[pProto].color : 'var(--accent-glow)';
        const aColor = PROTOCOL_DEFS[aProto] ? PROTOCOL_DEFS[aProto].color : 'var(--accent-red)';

        // Player protocol card (bottom) - check if exists
        const pCard = document.getElementById(`proto-${line}-player`);
        if (pCard) {
            const nameEl = pCard.querySelector('.proto-card-name');
            if (nameEl) nameEl.textContent = pProto;
            if (nameEl) nameEl.style.color = pColor;
            const statusEl = pCard.querySelector('.proto-card-status');
            if (statusEl) statusEl.textContent = PROTOCOL_DEFS[pProto].abilities;
            pCard.style.borderColor = pColor;
            pCard.style.boxShadow = `0 0 18px ${pColor}44`;
        }

        // AI protocol card (top) - check if exists
        const aCard = document.getElementById(`proto-${line}-ai`);
        if (aCard) {
            const nameEl = aCard.querySelector('.proto-card-name');
            if (nameEl) nameEl.textContent = aProto;
            if (nameEl) nameEl.style.color = aColor;
            const statusEl = aCard.querySelector('.proto-card-status');
            if (statusEl) statusEl.textContent = PROTOCOL_DEFS[aProto].abilities;
            aCard.style.borderColor = aColor;
            aCard.style.boxShadow = `0 0 18px ${aColor}44`;
        }
    });
}

function drawCard(target) {
    let pState = gameState[target];
    if (pState.deck.length === 0) {
        if (pState.trash.length === 0) return false;
        pState.deck = pState.trash.sort(() => Math.random() - 0.5);
        pState.trash = [];
    }
    pState.hand.push(pState.deck.pop());
    return true;
}

function createCardHTML(card, faceDown = false) {
    if (!card) return '';
    
    if (faceDown) {
        return `<div class="card face-down">
            <div class="card-header">
                <span class="card-value">2</span>
            </div>
        </div>`;
    }
    
    const color = PROTOCOL_DEFS[card.protocol] ? PROTOCOL_DEFS[card.protocol].color : 'var(--accent-glow)';
    
    // Usamos campos segmentados del JSON
    const startText = card.h_inicio || '';
    const actionText = card.h_accion || '';
    const endText = card.h_final || '';
    
    return `
        <div class="card" data-id="${card.id}" style="border-color: ${color}; box-shadow: 0 0 15px ${color}33;">
            <div class="card-header">
                <span class="card-value" style="color: ${color}">${card.valor}</span>
                <span class="card-title" style="color: ${color}">${card.nombre}</span>
            </div>
            <div class="card-body">
                <div class="zone zone-start">
                    <span class="zone-label">Inicio</span>
                    <div class="zone-content">${startText}</div>
                </div>
                <div class="zone zone-action">
                    <span class="zone-label">Acción</span>
                    <div class="zone-content">${actionText}</div>
                </div>
                <div class="zone zone-end">
                    <span class="zone-label">Final</span>
                    <div class="zone-content">${endText}</div>
                </div>
            </div>
        </div>
    `;
}

function updateUI() {
    if (!GLOBAL_CARDS) return; // Esperar a que carguen las cartas

    // Update deck/trash counts (with null checks)
    if (ui.playerDeckCount) ui.playerDeckCount.innerText = gameState.player.deck.length;
    if (ui.playerTrashCount) ui.playerTrashCount.innerText = gameState.player.trash.length;
    if (ui.aiDeckCount) ui.aiDeckCount.innerText = gameState.ai.deck.length;
    if (ui.aiTrashCount) ui.aiTrashCount.innerText = gameState.ai.trash.length;

    // Update hands
    if (ui.playerHand) ui.playerHand.innerHTML = gameState.player.hand.map(c => createCardHTML(c)).join('');
    if (ui.aiHand) ui.aiHand.innerHTML = gameState.ai.hand.map(c => createCardHTML(c, true)).join('');
    
    // Attach events to player hand
    document.querySelectorAll('#player-hand .card').forEach((cardEl, index) => {
        cardEl.onclick = () => {
            if (gameState.effectContext && gameState.effectContext.type === 'discard') {
                handleDiscardChoice(index);
            } else {
                showActionModal(index);
            }
        };
    });

    // Update field lines and scores
    LINES.forEach(line => {
        renderStack(line, 'player');
        renderStack(line, 'ai');
        
        const pScore = calculateScore(line, 'player');
        const aiScore = calculateScore(line, 'ai');
        
        // Try to update score display if it exists
        const scoreEl = document.getElementById(`score-${line}`);
        if (scoreEl) {
            const pScoreEl = scoreEl.querySelector('.player-score');
            const aiScoreEl = scoreEl.querySelector('.ai-score');
            if (pScoreEl) pScoreEl.innerText = pScore;
            if (aiScoreEl) aiScoreEl.innerText = aiScore;
        }

        // Mark compiled protocols if they exist
        if (gameState.field[line].compiledBy) {
            const compiledBy = gameState.field[line].compiledBy;
            const pCard = document.getElementById(`proto-${line}-player`);
            const aCard = document.getElementById(`proto-${line}-ai`);
            const cardToMark = compiledBy === 'player' ? pCard : aCard;
            if (cardToMark) {
                cardToMark.classList.add('compiled');
                const statusEl = cardToMark.querySelector('.proto-card-status');
                if (statusEl) {
                    const winner = compiledBy === 'player' ? 'COMPILADO ✓' : 'COMPILADO ✗';
                    statusEl.textContent = winner;
                }
            }
        }
    });

    checkWinCondition();
}

function calculateScore(line, target) {
    // Calcular score base
    let score = gameState.field[line][target].reduce((sum, cardObj) => {
        return sum + (cardObj.faceDown ? 2 : cardObj.card.valor);
    }, 0);
    
    // NUEVO: Aplicar modificadores persistentes si está disponible el motor de habilidades
    if (typeof applyPersistentValueModifiers === 'function') {
        const reduction = applyPersistentValueModifiers(line, target);
        score = Math.max(0, score - reduction);
    }
    
    return score;
}

function renderStack(line, target) {
    const lineEl = document.getElementById(`line-${line}`);
    if (!lineEl) {
        console.warn(`Line element not found: line-${line}`);
        return;
    }
    
    // Try to find a stack container, or use the line element itself
    let stackEl = lineEl.querySelector(`.${target}-stack`);
    if (!stackEl) {
        // Create structure if it doesn't exist
        // For game.html, we'll append directly to the line
        if (!lineEl.dataset[`${target}StackReady`]) {
            const stackDiv = document.createElement('div');
            stackDiv.className = `${target}-stack`;
            stackDiv.style.minHeight = '100px';
            stackDiv.style.position = 'relative';
            lineEl.appendChild(stackDiv);
            lineEl.dataset[`${target}StackReady`] = 'true';
        }
        stackEl = lineEl.querySelector(`.${target}-stack`);
    }
    
    stackEl.innerHTML = '';
    
    const stack = gameState.field[line][target];
    stack.forEach((cardObj, idx) => {
        const cEl = document.createElement('div');
        
        if (cardObj.faceDown) {
            // Carta bocabajo - mostrar solo valor
            cEl.innerHTML = `
                <div class="card-in-field face-down" data-value="2" title="Cara oculta">
                </div>
            `;
        } else {
            // Carta bocarriba - mostrar completa
            const color = PROTOCOL_DEFS[cardObj.card.protocol] ? 
                PROTOCOL_DEFS[cardObj.card.protocol].color : '#888';
            
            cEl.innerHTML = `
                <div class="card-in-field" style="border-color: ${color}; background: linear-gradient(135deg, rgba(26, 31, 58, 0.9), rgba(10, 14, 39, 0.95)), linear-gradient(to bottom, ${color}22, ${color}11);">
                    <div class="card-header" style="color: ${color}">
                        ${cardObj.card.protocol.toUpperCase().substring(0, 3)}
                    </div>
                    <div class="card-name" title="${cardObj.card.nombre}">
                        ${cardObj.card.nombre}
                    </div>
                    <div class="card-value" style="color: ${color}">
                        +${cardObj.card.valor}
                    </div>
                    <div class="card-effect">
                        ${cardObj.card.h_accion ? cardObj.card.h_accion.substring(0, 30) + '...' : '—'}
                    </div>
                </div>
            `;
        }
        
        const domCard = cEl.firstElementChild;
        
        const isUncovered = idx === stack.length - 1;

        // Add click handler for effects (eliminate/flip/shift/return)
        domCard.onclick = (e) => {
            e.stopPropagation();
            if (gameState.effectContext) {
                // Rule: Only uncovered cards can be manipulated unless "all" is specified
                if (!isUncovered && !gameState.effectContext.targetAll) {
                    console.warn("Only uncovered cards can be targeted.");
                    return;
                }
                handleFieldCardClick(line, target, idx);
            }
        };

        if (target === 'ai') {
            domCard.style.bottom = `${idx * 20}px`;
        } else {
            domCard.style.top = `${idx * 20}px`;
        }
        domCard.style.zIndex = idx;
        
        
        if (isUncovered) domCard.classList.add('uncovered');
        
        stackEl.appendChild(domCard);
    });
}

// Turn Cycle Functions
function startTurn(who) {
    gameState.turn = who;
    gameState.phase = 'start';
    updateStatus(`${who === 'player' ? 'Tu' : 'IA'} Turno: Fase Inicio`);
    
    // NUEVO: Disparar efectos de inicio de turno
    if (typeof onTurnStartEffects === 'function') {
        onTurnStartEffects(who);
    }
    
    // Auto proceed to Check Compile after 1s
    setTimeout(() => checkCompilePhase(who), 1000);
}

function checkCompilePhase(who) {
    gameState.phase = 'check_compile';
    updateStatus(`Fase: Comprobar Compilación`);
    
    let compiledAny = false;
    for (const line of LINES) {
        if (gameState.field[line].compiledBy) continue;
        
        const myScore = calculateScore(line, who);
        const oppScore = calculateScore(line, who === 'player' ? 'ai' : 'player');
        
        if (myScore >= 10 && myScore > oppScore) {
            compileLine(line, who);
            compiledAny = true;
            break; // Max 1 compile per turn as per rules
        }
    }

    if (compiledAny) {
        updateUI();
        setTimeout(() => endTurn(who), 2000);
    } else {
        actionPhase(who);
    }
}

function actionPhase(who) {
    gameState.phase = 'action';
    updateStatus(who === 'player' ? 'Tu Turno: Juega una carta o Recarga' : 'IA pensando...');
    
    if (who === 'ai') {
        setTimeout(playAITurn, 1500);
    }
}

function compileLine(line, who) {
    gameState.field[line].compiledBy = who;
    gameState[who].compiled.push(line);
    
    // rules: delete all cards in line on BOTH sides
    gameState.field[line].player.forEach(c => gameState.player.trash.push(c.card));
    gameState.field[line].ai.forEach(c => gameState.ai.trash.push(c.card));
    
    gameState.field[line].player = [];
    gameState.field[line].ai = [];
    
    updateStatus(`¡${who === 'player' ? 'Has' : 'IA ha'} compilado el protocolo del ${line}!`);
}

function showActionModal(handIndex) {
    if (gameState.turn !== 'player' || gameState.phase !== 'action') return;
    gameState.selectedCardIndex = handIndex;
    const card = gameState.player.hand[handIndex];
    ui.modalCardPreview.innerHTML = createCardHTML(card);
    
    // Check if face-up play is legal: card protocol must match the line's protocol
    // AND the line must not be compiled.
    const lineIndex = gameState.player.protocols.indexOf(card.protocol);
    const targetLine = lineIndex !== -1 ? LINES[lineIndex] : null;
    const canPlayUp = targetLine && !gameState.field[targetLine].compiledBy;
    
    ui.btnPlayUp.disabled = !canPlayUp;
    ui.btnPlayUp.style.opacity = canPlayUp ? "1" : "0.5";
    ui.btnPlayUp.style.cursor = canPlayUp ? "pointer" : "not-allowed";
    
    ui.actionModal.classList.remove('hidden');
}

ui.btnPlayUp.onclick = () => playSelectedCard(false);
ui.btnPlayDown.onclick = () => playSelectedCard(true);
ui.btnCancel.onclick = () => {
    ui.actionModal.classList.add('hidden');
    gameState.selectedCardIndex = null;
};

// --- Motor de Habilidades ---
function executeEffect(card, targetPlayer) {
    // NUEVO MOTOR DE HABILIDADES: Intenta usar el sistema moderno
    if (typeof executeNewEffect === 'function') {
        executeNewEffect(card, targetPlayer);
        return;
    }
    
    // FALLBACK: Si abilities-engine.js no está cargado, usar texto plano (legacy)
    const combinedText = ((card.h_inicio || "") + ". " + (card.h_accion || "") + ". " + (card.h_final || "")).toLowerCase();
    const sentences = combinedText.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    gameState.effectQueue = sentences.map(s => ({ text: s, targetPlayer }));
    processNextEffect();
}

function processNextEffect() {
    if (gameState.effectQueue.length === 0) {
        updateUI();
        return;
    }

    const effect = gameState.effectQueue.shift();
    const { text, targetPlayer } = effect;
    const opponent = targetPlayer === 'player' ? 'ai' : 'player';

    // Check for "puedes" (optional)
    if (text.includes("puedes") && targetPlayer === 'player') {
        ui.confirmArea.classList.remove('hidden');
        ui.confirmMsg.innerText = `¿Quieres usar este efecto? "${text}"`;
        ui.btnConfirmYes.onclick = () => {
            ui.confirmArea.classList.add('hidden');
            resolveSentence(text, targetPlayer, opponent);
        };
        ui.btnConfirmNo.onclick = () => {
            ui.confirmArea.classList.add('hidden');
            processNextEffect(); // Skip to next
        };
        return;
    }

    // Default: resolve immediately (IA or mandatory)
    resolveSentence(text, targetPlayer, opponent);
}

function resolveSentence(text, targetPlayer, opponent) {
    let waitNeeded = false;

    // Dispatch commands
    if (text.includes("roba")) {
        const count = parseInt(text.match(/roba (\d+)/)?.[1]) || (text.includes("tantas cartas como") ? 0 : 1);
        // Note: Special "tantas cartas como" logic would go here if needed
        draw(targetPlayer, count || 1);
    }
    
    if (text.includes("descarta")) {
        const count = parseInt(text.match(/descarta (\d+)/)?.[1]) || 1;
        const target = text.includes("tu oponente") ? opponent : targetPlayer;
        startEffect('discard', target, count);
        waitNeeded = true;
    } else if (text.includes("elimina")) {
        const count = parseInt(text.match(/elimina (\d+)/)?.[1]) || 1;
        const target = text.includes("tu oponente") ? opponent : targetPlayer;
        startEffect('eliminate', target, count);
        waitNeeded = true;
    } else if (text.includes("voltea")) {
        startEffect('flip', 'any', 1);
        waitNeeded = true;
    } else if (text.includes("mueve") || text.includes("desplaza")) {
        startEffect('shift', targetPlayer, 1);
        waitNeeded = true;
    } else if (text.includes("devuelve") || text.includes("devolver")) {
        startEffect('return', targetPlayer, 1);
        waitNeeded = true;
    } else if (text.includes("reorganiza") || text.includes("intercambia 2 de tus protocolos")) {
        startEffect('rearrange', 'any', 1);
        waitNeeded = true;
    }

    if (!waitNeeded) {
        processNextEffect();
    }
}

function startEffect(type, target, count) {
    // Determine if this should be interactive or automatic
    let isAIResolving = false;
    
    if (type === 'discard') {
        // En "descartar", el dueño de la zona (target) elige.
        isAIResolving = (target === 'ai');
    } else {
        // En "eliminar/voltear" (tablero), el jugador del turno elige el objetivo en la zona permitida.
        isAIResolving = (gameState.turn === 'ai');
    }

    if (isAIResolving) {
        resolveEffectAI(type, target, count);
        return;
    }

    gameState.effectContext = { type, target, count, selected: [] };
    const actionVerb = type === 'discard' ? 'DESCARTAR' : type === 'eliminate' ? 'ELIMINAR' : 'VOLTEAR';
    const targetDesc = target === 'ai' ? ' del OPONENTE' : target === 'player' ? ' TUYAS' : '';
    updateStatus(`COMANDO: Elige ${count} carta(s)${targetDesc} para ${actionVerb}`);
    highlightEffectTargets();
}

function highlightEffectTargets() {
    const ctx = gameState.effectContext;
    if (!ctx) return;

    if (ctx.type === 'discard') {
        document.getElementById('player-hand').classList.add('targeting');
    } else if (ctx.type === 'eliminate' || ctx.type === 'flip') {
        // Add visual cues to relevant field stacks
        if (ctx.target === 'any' || ctx.target === 'player') document.querySelectorAll('.player-stack').forEach(s => s.classList.add('targeting'));
        if (ctx.target === 'any' || ctx.target === 'ai') document.querySelectorAll('.ai-stack').forEach(s => s.classList.add('targeting'));
    }
}

function clearEffectHighlights() {
    document.querySelectorAll('.targeting').forEach(el => el.classList.remove('targeting'));
}

function handleDiscardChoice(handIndex) {
    const ctx = gameState.effectContext;
    if (!ctx || ctx.type !== 'discard') return;

    const card = gameState.player.hand.splice(handIndex, 1)[0];
    gameState.player.trash.push(card);
    ctx.selected.push(card);

    if (ctx.selected.length >= ctx.count) {
        finishEffect();
    } else {
        updateUI(); // Keep choosing
    }
}

function handleFieldCardClick(line, target, cardIdx) {
    const ctx = gameState.effectContext;
    if (!ctx) return;

    // Validate target
    if (ctx.target !== 'any' && ctx.target !== target) return;

    if (ctx.type === 'eliminate') {
        const cardObj = gameState.field[line][target].splice(cardIdx, 1)[0];
        gameState[target].trash.push(cardObj.card);
        ctx.selected.push(cardObj);
    } else if (ctx.type === 'flip') {
        const cardObj = gameState.field[line][target][cardIdx];
        cardObj.faceDown = !cardObj.faceDown;
        ctx.selected.push(cardObj);
    } else if (ctx.type === 'shift') {
        // Shift needs a second step: pick target line
        ctx.selectedCard = { line, target, cardIdx };
        ctx.waitingForLine = true;
        updateStatus("Ahora elige la línea de destino...");
        clearEffectHighlights();
        highlightSelectableLines(); // Reuse existing line highlight logic
        return; 
    } else if (ctx.type === 'return') {
        const cardObj = gameState.field[line][target].splice(cardIdx, 1)[0];
        gameState[target].hand.push(cardObj.card);
        ctx.selected.push(cardObj);
    } else if (ctx.type === 'rearrange') {
        const lineKey = line === 'izquierda' ? 'left' : line === 'centro' ? 'middle' : 'right';
        if (!ctx.firstProtocol) {
            ctx.firstProtocol = line;
            updateStatus(`Seleccionado protocolo ${line}. Elige el segundo para intercambiar.`);
            const lineEl = document.getElementById(`line-${lineKey}`);
            if (lineEl) lineEl.classList.add('selected');
        } else {
            const first = ctx.firstProtocol;
            const second = line;
            const firstKey = first === 'izquierda' ? 'left' : first === 'centro' ? 'middle' : 'right';
            const firstEl = document.getElementById(`line-${firstKey}`);
            if (firstEl) firstEl.classList.remove('selected');
            if (first !== second) {
                swapProtocols(first, second);
                ctx.selected.push({ first, second });
            } else {
                ctx.firstProtocol = null;
                updateStatus("Selección cancelada. Elige el primer protocolo.");
                return;
            }
        }
    }

    if (ctx.selected.length >= ctx.count) {
        finishEffect();
    } else {
        updateUI();
    }
}

function finishEffect() {
    gameState.effectContext = null;
    clearEffectHighlights();
    processNextEffect();
}

function resolveEffectAI(type, target, count) {
    const actualTarget = (target === 'any') ? (type === 'discard' ? 'ai' : 'player') : target;
    
    if (type === 'discard') {
        for (let i = 0; i < count; i++) {
            if (gameState[actualTarget].hand.length > 0) {
                gameState[actualTarget].trash.push(gameState[actualTarget].hand.pop());
            }
        }
    } else if (type === 'eliminate') {
        for (let i = 0; i < count; i++) {
            const validLines = LINES.filter(l => gameState.field[l][actualTarget].length > 0);
            if (validLines.length > 0) {
                const line = validLines[Math.floor(Math.random() * validLines.length)];
                const cardObj = gameState.field[line][actualTarget].pop();
                gameState[actualTarget].trash.push(cardObj.card);
            }
        }
    } else if (type === 'flip') {
        for (let i = 0; i < count; i++) {
            const validLines = LINES.filter(l => gameState.field[l][actualTarget].length > 0);
            if (validLines.length > 0) {
                const line = validLines[Math.floor(Math.random() * validLines.length)];
                const stack = gameState.field[line][actualTarget];
                const cardObj = stack[stack.length - 1]; // Only uncovered
                cardObj.faceDown = !cardObj.faceDown;
            }
        }
    } else if (type === 'shift') {
        for (let i = 0; i < count; i++) {
            const validLines = LINES.filter(l => gameState.field[l][actualTarget].length > 0 && !gameState.field[l].compiledBy);
            if (validLines.length > 1) {
                const startLine = validLines[Math.floor(Math.random() * validLines.length)];
                const otherLines = validLines.filter(l => l !== startLine);
                const endLine = otherLines[Math.floor(Math.random() * otherLines.length)];
                
                const cardObj = gameState.field[startLine][actualTarget].pop();
                gameState.field[endLine][actualTarget].push(cardObj);
            }
        }
    } else if (type === 'return') {
        for (let i = 0; i < count; i++) {
            const validLines = LINES.filter(l => gameState.field[l][actualTarget].length > 0);
            if (validLines.length > 0) {
                const line = validLines[Math.floor(Math.random() * validLines.length)];
                const cardObj = gameState.field[line][actualTarget].pop();
                gameState[actualTarget].hand.push(cardObj.card);
            }
        }
    }
    updateStatus(`IA resolvió comando: ${type} sobre ${actualTarget}`);
}

function draw(target, count) {
    for (let i = 0; i < count; i++) {
        drawCard(target);
    }
    updateStatus(`${target === 'player' ? 'Has' : 'IA ha'} robado ${count} carta(s)`);
}

function discard(target, count) {
    for (let i = 0; i < count; i++) {
        if (gameState[target].hand.length > 0) {
            const idx = Math.floor(Math.random() * gameState[target].hand.length);
            const card = gameState[target].hand.splice(idx, 1)[0];
            gameState[target].trash.push(card);
        }
    }
    updateStatus(`${target === 'player' ? 'Has' : 'IA ha'} descartado ${count} carta(s)`);
}

function flipCardInField(cardId) {
    LINES.forEach(line => {
        ['player', 'ai'].forEach(p => {
            gameState.field[line][p].forEach(cardObj => {
                if (cardObj.card.id === cardId) {
                    cardObj.faceDown = !cardObj.faceDown;
                }
            });
        });
    });
}

function playSelectedCard(isFaceDown) {
    const card = gameState.player.hand[gameState.selectedCardIndex];
    ui.actionModal.classList.add('hidden');
    
    if (isFaceDown) {
        // Enter selection mode for any non-compiled line
        gameState.selectionMode = true;
        updateStatus("Elige una línea para jugar bocabajo...");
        highlightSelectableLines();
        return;
    }

    // Face-up play logic remains largely same but uses finalizePlay
    const idx = gameState.player.protocols.indexOf(card.protocol);
    if (idx !== -1 && !gameState.field[LINES[idx]].compiledBy) {
        finalizePlay(LINES[idx], false);
    } else {
        console.error("Illegal face-up play attempt");
    }
}

function highlightSelectableLines() {
    LINES.forEach(line => {
        const lineKey = line === 'izquierda' ? 'left' : line === 'centro' ? 'middle' : 'right';
        const lineEl = document.getElementById(`line-${lineKey}`);
        if (!gameState.field[line].compiledBy) {
            lineEl.classList.add('selectable-line');
        }
    });
}

function clearSelectionHighlights() {
    document.querySelectorAll('.selectable-line').forEach(el => {
        el.classList.remove('selectable-line');
    });
}

function finalizePlay(targetLine, isFaceDown) {
    if (gameState.field[targetLine].compiledBy) return;
    
    gameState.selectionMode = false;
    clearSelectionHighlights();

    const card = gameState.player.hand[gameState.selectedCardIndex];
    const playedCard = { card: card, faceDown: isFaceDown };
    
    gameState.field[targetLine].player.push(playedCard);
    gameState.player.hand.splice(gameState.selectedCardIndex, 1);
    gameState.selectedCardIndex = null;
    
    if (!isFaceDown) {
        executeEffect(card, 'player');
    }
    
    endTurn('player');
}

ui.btnRefresh.onclick = () => {
    if (gameState.turn !== 'player' || gameState.phase !== 'action') return;
    if (gameState.player.hand.length >= 5) {
        alert("No puedes recargar si tienes 5 o más cartas.");
        return;
    }
    while(gameState.player.hand.length < 5) {
        if(!drawCard('player')) break;
    }
    endTurn('player');
}

function playAITurn() {
    // FASE 2: IA INTELIGENTE - Minimax + Evaluación Estratégica
    
    if (gameState.ai.hand.length === 0) {
        while(gameState.ai.hand.length < 5) drawCard('ai');
        console.log('🤖 IA: Recarga (mano vacía)');
        updateStatus("IA hizo Recarga");
        return;
    }

    try {
        // Inicializar motores de IA (primera vez)
        if (!window.aiEvaluator) {
            window.aiEvaluator = new AIEvaluator(gameState);
            console.log('✅ Motor de Evaluación inicializado');
        }
        if (!window.miniMax) {
            window.miniMax = new MiniMax(window.aiEvaluator, 2);
            console.log('✅ Minimax inicializado (depth=2)');
        }

        // Generar todos los movimientos posibles
        const possibleMoves = generateAIPossibleMoves();
        
        if (possibleMoves.length === 0) {
            // Sin movimientos disponibles, recargar
            while(gameState.ai.hand.length < 5) drawCard('ai');
            updateStatus("IA hizo Recarga (sin movimientos)");
            return;
        }

        // Usar minimax para encontrar el mejor movimiento
        const bestMoveResult = window.miniMax.findBestMove(gameState, possibleMoves);
        
        if (!bestMoveResult || !bestMoveResult.bestMove) {
            throw new Error('Minimax no encontró movimiento válido');
        }

        const move = bestMoveResult.bestMove;
        
        // Log de decisión de IA
        console.log('🤖 IA Decision (Minimax):', {
            line: move.line,
            cardName: move.card.nombre,
            faceUp: move.faceUp,
            score: Math.round(bestMoveResult.score),
            stats: bestMoveResult.statistics,
        });

        // Ejecutar el movimiento elegido
        executeAIMove(move);

    } catch (error) {
        // Fallback: Si IA falla, juega aleatorio
        console.error('❌ IA Error:', error.message);
        playAITurnRandom();
    }
}

/**
 * 🎲 Respuesta aleatoria (fallback)
 */
function playAITurnRandom() {
    const cardIdx = Math.floor(Math.random() * gameState.ai.hand.length);
    const card = gameState.ai.hand[cardIdx];
    const lineIndex = gameState.ai.protocols.indexOf(card.protocol);
    let targetLine = lineIndex !== -1 ? LINES[lineIndex] : null;
    
    let isFaceDown = true;
    
    if (targetLine && !gameState.field[targetLine].compiledBy) {
        isFaceDown = false;
    } else {
        targetLine = LINES.find(l => !gameState.field[l].compiledBy);
        isFaceDown = true;
    }
    
    if (targetLine) {
        const movedCard = gameState.ai.hand.splice(cardIdx, 1)[0];
        gameState.field[targetLine].ai.push({ card: movedCard, faceDown: isFaceDown });
        updateStatus(`IA jugó ${movedCard.nombre} ${isFaceDown ? 'bocabajo' : 'bocarriba'} en ${targetLine}`);
        
        if (!isFaceDown) {
            executeEffect(movedCard, 'ai');
        }
    }
}

/**
 * 🎯 Generar todos los movimientos posibles de IA
 */
function generateAIPossibleMoves() {
    const moves = [];
    
    gameState.ai.hand.forEach((card, cardIndex) => {
        LINES.forEach(line => {
            if (!gameState.field[line].compiledBy) {
                // Movimiento bocarriba (si coincide protocolo)
                const lineIndex = gameState.ai.protocols.indexOf(card.protocol);
                const lineMatchesProtocol = lineIndex !== -1 && LINES[lineIndex] === line;
                
                if (lineMatchesProtocol) {
                    moves.push({
                        cardIndex,
                        line,
                        faceUp: true,
                        card,
                        type: 'face-up',
                    });
                }
                
                // Movimiento bocabajo (siempre posible)
                moves.push({
                    cardIndex,
                    line,
                    faceUp: false,
                    card,
                    type: 'face-down',
                });
            }
        });
    });

    // Opción: Recargar si mazo tiene cartas
    if (gameState.ai.deck.length > 0) {
        moves.push({
            action: 'refresh',
            type: 'refresh',
        });
    }

    return moves;
}

/**
 * ⚙️ Ejecutar movimiento de IA elegido por minimax
 */
function executeAIMove(move) {
    if (move.action === 'refresh') {
        while(gameState.ai.hand.length < 5 && gameState.ai.deck.length > 0) {
            drawCard('ai');
        }
        updateStatus('IA hizo Recarga');
        return;
    }

    const card = gameState.ai.hand[move.cardIndex];
    const movedCard = gameState.ai.hand.splice(move.cardIndex, 1)[0];
    
    gameState.field[move.line].ai.push({ 
        card: movedCard, 
        faceDown: !move.faceUp 
    });
    
    const faceText = move.faceUp ? 'bocarriba' : 'bocabajo';
    updateStatus(`IA jugó ${movedCard.nombre} ${faceText} en ${move.line}`);
    
    // Ejecutar efectos si es bocarriba
    if (move.faceUp) {
        executeEffect(movedCard, 'ai');
    }
}

function endTurn(who) {
    gameState.phase = 'check_cache';
    // Discard down to 5
    while(gameState[who].hand.length > 5) {
        gameState[who].trash.push(gameState[who].hand.pop());
    }
    
    updateUI();
    gameState.phase = 'end';
    
    // NUEVO: Disparar efectos de fin de turno
    if (typeof onTurnEndEffects === 'function') {
        onTurnEndEffects(who);
    }
    
    setTimeout(() => startTurn(who === 'player' ? 'ai' : 'player'), 1000);
}

function updateStatus(msg) {
    if (gameState.turn === 'player') ui.playerStatus.innerText = msg;
    else ui.aiStatus.innerText = msg;
}

function checkWinCondition() {
    if (gameState.player.compiled.length >= 3) {
        showGameOver("¡Has Ganado!");
    } else if (gameState.ai.compiled.length >= 3) {
        showGameOver("Perdiste", "La IA compiló 3 protocolos primero.");
    }
}

function showGameOver(title, reason = "Has compilado 3 protocolos.") {
    ui.winnerText.innerText = title;
    document.getElementById('win-reason').innerText = reason;
    ui.gameOverModal.classList.remove('hidden');
}

// Set restart button only if it exists (game mode)
if (ui.btnRestart) {
    ui.btnRestart.onclick = () => initDraft();
}

// ========================== DRAFT LOGIC ==========================

// Pick order: P1 picks 1, AI picks 2, P1 picks 2, AI picks 1
// 'p' = player picks, 'a' = ai picks
const DRAFT_ORDER = ['p', 'a', 'a', 'p', 'p', 'a'];

let draftState = {
    step: 0,
    playerPicks: [],
    aiPicks: [],
    pickedSet: new Set(),
    active: false,
};

function initDraft() {
    // Reset draft state
    draftState = { step: 0, playerPicks: [], aiPicks: [], pickedSet: new Set(), active: true };

    // Hide game, show draft screen
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('draft-screen').classList.remove('hidden');
    document.getElementById('draft-footer').classList.add('hidden');

    // Build protocol cards grid
    const grid = document.getElementById('protocol-grid');
    grid.innerHTML = '';

    Object.entries(PROTOCOL_DEFS).forEach(([name, def]) => {
        const card = document.createElement('div');
        card.className = 'draft-proto-card';
        card.dataset.proto = name;
        card.style.borderColor = def.color;
        card.style.color = def.color;
        card.innerHTML = `
            <div class="draft-proto-name">${name}</div>
            <div class="draft-proto-abilities">${def.abilities}</div>
            <div class="draft-proto-badge" style="color:${def.color}">▷ Disponible</div>
        `;
        card.onclick = () => onPlayerPick(name);
        grid.appendChild(card);
    });

    updateDraftUI();
}

function onPlayerPick(proto) {
    if (!draftState.active) return;
    if (draftState.pickedSet.has(proto)) return;
    if (DRAFT_ORDER[draftState.step] !== 'p') return; // Not player's turn

    applyPick('p', proto);
    advanceDraft();
}

function applyPick(who, proto) {
    draftState.pickedSet.add(proto);
    if (who === 'p') {
        draftState.playerPicks.push(proto);
    } else {
        draftState.aiPicks.push(proto);
    }
    // Visual update on the card
    const card = document.querySelector(`.draft-proto-card[data-proto="${proto}"]`);
    if (card) {
        card.classList.add(who === 'p' ? 'picked-player' : 'picked-ai');
        const badge = card.querySelector('.draft-proto-badge');
        if (badge) {
            badge.textContent = who === 'p' ? '✓ Tú' : '✗ IA';
            badge.style.color = who === 'p' ? 'var(--accent-glow)' : 'var(--accent-red)';
        }
        card.onclick = null;
    }
    // Fill pick slot
    fillPickSlot(who, proto);
}

function fillPickSlot(who, proto) {
    const containerId = who === 'p' ? 'player-slots' : 'ai-slots';
    const container = document.getElementById(containerId);
    const emptySlots = container.querySelectorAll('.pick-slot.empty');
    if (emptySlots.length === 0) return;
    const slot = emptySlots[0];
    const def = PROTOCOL_DEFS[proto];
    slot.classList.remove('empty');
    slot.classList.add('filled');
    slot.style.borderColor = def.color;
    slot.style.background = def.color + '22';
    slot.style.color = def.color;
    slot.textContent = proto.substring(0, 4).toUpperCase();
}

function advanceDraft() {
    draftState.step++;

    if (draftState.step >= DRAFT_ORDER.length) {
        // Draft complete
        draftState.active = false;
        showDraftResult();
        return;
    }

    updateDraftUI();

    // If next turn is AI, auto-pick after delay
    if (DRAFT_ORDER[draftState.step] === 'a') {
        setTimeout(aiAutoPick, 700);
    }
}

function aiAutoPick() {
    // Pick a random available protocol
    const available = Object.keys(PROTOCOL_DEFS).filter(p => !draftState.pickedSet.has(p));
    if (available.length === 0) return;
    const choice = available[Math.floor(Math.random() * available.length)];
    applyPick('a', choice);
    advanceDraft();
}

function updateDraftUI() {
    const step = draftState.step;
    if (step >= DRAFT_ORDER.length) return;

    const who = DRAFT_ORDER[step];
    const indicator = document.getElementById('draft-turn-indicator');
    const text = document.getElementById('draft-turn-text');

    // Count consecutive picks for current player
    let consecutivePicks = 0;
    for (let i = step; i < DRAFT_ORDER.length && DRAFT_ORDER[i] === who; i++) consecutivePicks++;
    const pickWord = consecutivePicks === 1 ? 'Elige 1' : `Elige ${consecutivePicks}`;

    if (who === 'p') {
        indicator.classList.remove('ai-turn');
        text.textContent = `Tu turno — ${pickWord}`;
    } else {
        indicator.classList.add('ai-turn');
        text.textContent = `IA eligiendo...`;
    }
}

function showDraftResult() {
    const indicator = document.getElementById('draft-turn-indicator');
    indicator.classList.remove('ai-turn');
    document.getElementById('draft-turn-text').textContent = '¡Draft completo!';

    // Build matchup preview
    // Player protocols: [0,1,2] → face AI protocols reversed: [2,1,0]
    const aiOrdered = [...draftState.aiPicks].reverse();
    const matchupsEl = document.getElementById('line-matchups');
    matchupsEl.innerHTML = '';
    const lineNames = ['Izquierda', 'Centro', 'Derecha'];

    for (let i = 0; i < 3; i++) {
        const pProto = draftState.playerPicks[i];
        const aProto = aiOrdered[i];
        const pColor = PROTOCOL_DEFS[pProto].color;
        const aColor = PROTOCOL_DEFS[aProto].color;

        const row = document.createElement('div');
        row.className = 'matchup-row';
        row.innerHTML = `
            <span class="matchup-proto" style="border-color:${pColor};color:${pColor}">${pProto}</span>
            <span class="matchup-vs">⟵ ${lineNames[i]} ⟶</span>
            <span class="matchup-proto" style="border-color:${aColor};color:${aColor}">${aProto}</span>
        `;
        matchupsEl.appendChild(row);
    }

    const draftFooter = document.getElementById('draft-footer');
    if (draftFooter) {
        draftFooter.classList.remove('hidden');
    }

    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) {
        btnStartGame.onclick = startGameFromDraft;
    }
}

function startGameFromDraft() {
    console.log('=== startGameFromDraft() START ===');
    
    // En game.html, obtener protocolos del sessionStorage
    // En draft.html, usarlos del draftState
    // IMPORTANTE: Verificar que draftState.playerPicks NO esté vacío (length > 0)
    if (draftState && draftState.playerPicks && draftState.playerPicks.length > 0) {
        // Viene del draft (tiene cartas seleccionadas)
        gameState.player.protocols = [...draftState.playerPicks];
        gameState.ai.protocols = [...draftState.aiPicks].reverse();
        console.log('✅ Loaded from draftState:', { 
            player: gameState.player.protocols,
            ai: gameState.ai.protocols 
        });
    } else {
        // Viene del sessionStorage (game.html path)
        const playerProtos = JSON.parse(sessionStorage.getItem('playerProtocols') || '["Espíritu", "Muerte", "Fuego"]');
        const aiProtos = JSON.parse(sessionStorage.getItem('aiProtocols') || '["Vida", "Luz", "Oscuridad"]');
        gameState.player.protocols = playerProtos;
        gameState.ai.protocols = aiProtos;
        console.log('✅ Loaded from sessionStorage:', { 
            player: gameState.player.protocols,
            ai: gameState.ai.protocols,
            rawPlayer: sessionStorage.getItem('playerProtocols'),
            rawAI: sessionStorage.getItem('aiProtocols')
        });
    }

    // Reset game state
    gameState.player.deck = [];
    gameState.player.hand = [];
    gameState.player.trash = [];
    gameState.player.compiled = [];
    gameState.ai.deck = [];
    gameState.ai.hand = [];
    gameState.ai.trash = [];
    gameState.ai.compiled = [];
    gameState.field = {
        izquierda: { player: [], ai: [], compiledBy: null },
        centro: { player: [], ai: [], compiledBy: null },
        derecha: { player: [], ai: [], compiledBy: null },
    };

    console.log('✅ Game state initialized');

    // Show game, hide draft (si existen en el DOM)
    const draftScreen = document.getElementById('draft-screen');
    if (draftScreen) {
        draftScreen.classList.add('hidden');
        console.log('✅ Hid draft-screen');
    }
    
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.classList.remove('hidden');
        console.log('✅ Showed game-container');
    } else {
        console.error('❌ game-container not found in DOM');
    }

    console.log('📞 Calling initGame()...');
    try {
        initGame();
        console.log('✅ initGame() completed successfully');
    } catch (error) {
        console.error('❌ Error in initGame():', error);
        console.error('Stack:', error.stack);
        throw error;
    }
    
    console.log('=== startGameFromDraft() END ===');
}

function swapProtocols(lineA, lineB) {
    const p = gameState.player.protocols;
    const idxA = LINES.indexOf(lineA);
    const idxB = LINES.indexOf(lineB);
    [p[idxA], p[idxB]] = [p[idxB], p[idxA]];
}

// ========================== START ==========================
// Detectar si estamos en draft.html o game.html
const isDraft = document.getElementById('draft-screen') !== null;
const isGame = document.getElementById('game-container') !== null;

console.log('🔍 Auto-detection:', { isDraft, isGame });
console.log('🎮 GLOBAL_CARDS loaded:', !!GLOBAL_CARDS, 'Keys:', Object.keys(GLOBAL_CARDS || {}).length);

if (isDraft) {
    // En draft.html: iniciar draft
    console.log('📋 Draft mode detected - calling initDraft()');
    initDraft();
} else if (isGame) {
    // En game.html: iniciar juego con protocolos del sessionStorage
    console.log('🎮 Game mode detected - calling startGameFromDraft()');
    try {
        startGameFromDraft();
    } catch (error) {
        console.error('❌ Error initializing game:', error);
        console.error('Stack:', error.stack);
    }
} else {
    console.warn('⚠️ Neither draft nor game mode detected. isDraft=%s, isGame=%s', isDraft, isGame);
}
