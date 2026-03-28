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
let PROTOCOL_DEFS = {}; // cargado desde data/cards.json al iniciar

// Base de Datos de Cartas Incrustada (para evitar errores de CORS local)
let GLOBAL_CARDS = null; // cargado desde data/cards.json al iniciar


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
    selectionModeFaceUp: false, // true when selectionMode is for a face-up play (Espíritu 1)
    effectContext: null, // { type: 'discard'|'eliminate'|'flip', count: 1, target: 'player'|'ai', ... }
    effectQueue: [],
    currentEffectLine: null,
    preventCompile: { player: 0, ai: 0 }, // turns remaining where compile is blocked
    lastFlippedCard: null,   // last card flipped via interactive effect
    pendingPlayCard: false,  // waiting for player to play a card mid-effect
    ignoreEffectsLines: {},  // lines where effects are suppressed this turn
    pendingEndTurnFor: null,    // set when endTurn is waiting for interactive discard
    pendingTurnEnd: null,       // set when finalizePlay is waiting for effects to resolve
    pendingCompileShift: null,  // Velocidad 2: card to move after compile
    discardedSinceLastCheck: { player: false, ai: false },  // flag consumido por Plaga 1 al robar
    drawnSinceLastCheck: { player: false, ai: false },      // flag: robó cartas este turno
    drawnLastTurn: { player: false, ai: false },            // snapshot al inicio de turno (para Espíritu 3)
    eliminatedSinceLastCheck: { player: false, ai: false }, // flag: eliminó cartas este turno
    eliminatedLastTurn: { player: false, ai: false },       // snapshot al inicio de turno (para Odio 3)
    uncoveredThisTurn: new Set(),                           // IDs de cartas ya activadas por onUncovered este turno
    pendingLanding: null,                                   // carta en commit queue: aterriza tras resolver onCover
    refreshedThisTurn: null,                                // quién usó Refresh este turno (para Velocidad 1)
    currentTriggerCard: null,                               // nombre de la carta que disparó el efecto activo
    pendingCheckCompile: null,                              // set en startTurn; avanza a checkCompilePhase cuando la cola de efectos se vacía
    revealedPlayerCards: [],                                // cartas reveladas por Amor 4 — visibles para la IA
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
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const shuffled = deck;
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
        
        console.log('🎛️ Initializing modal buttons...');
        initializeModalButtons();
        console.log('  ✅ Modal buttons initialized');
        
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
        const handler = (e) => {
            if (e) e.stopPropagation();
            if (gameState.selectionMode) {
                finalizePlay(line, !gameState.selectionModeFaceUp);
                gameState.selectionModeFaceUp = false;
            } else if (gameState.effectContext && gameState.effectContext.type === 'pickHandFaceDown_lineSelect') {
                const ctx = gameState.effectContext;
                if (ctx.excludeLine && line === ctx.excludeLine) {
                    updateStatus('Debes elegir una línea diferente');
                    return;
                }
                if (ctx.allowedLines && !ctx.allowedLines.includes(line)) {
                    updateStatus('Esa línea no es válida para este efecto');
                    return;
                }
                if (gameState.selectedCardIndex === null) return;
                const card = gameState.player.hand.splice(gameState.selectedCardIndex, 1)[0];
                gameState.selectedCardIndex = null;
                gameState.effectContext = null;
                gameState.field[line].player.push({ card, faceDown: true });
                clearSelectionHighlights();
                updateUI();
                if (typeof processAbilityEffect === 'function') processAbilityEffect();
            } else if (gameState.effectContext && gameState.effectContext.type === 'pickFromDiscardToPlay_lineSelect') {
                // Tiempo 0: jugar carta del descarte bocarriba en línea elegida
                const ctx = gameState.effectContext;
                const revealed = gameState.player.hand.splice(ctx.handSizeBefore, ctx.revealedCount);
                const chosen = revealed[ctx.chosenRelIdx];
                revealed.forEach((c, i) => { if (i !== ctx.chosenRelIdx) gameState.player.trash.push(c); });
                gameState.effectContext = null;
                gameState.field[line].player.push({ card: chosen, faceDown: false });
                clearSelectionHighlights();
                updateUI();
                if (typeof processAbilityEffect === 'function') processAbilityEffect();
            } else if (gameState.effectContext && gameState.effectContext.type === 'pickFromDiscardFaceDown_lineSelect') {
                // Tiempo 3: jugar carta del descarte bocabajo en otra línea (carta ya elegida en modal)
                const ctx = gameState.effectContext;
                if (ctx.excludeLine && line === ctx.excludeLine) {
                    updateStatus('Tiempo 3: elige una línea diferente a la actual');
                    return;
                }
                const chosen = ctx.chosenCard;
                gameState.effectContext = null;
                gameState.field[line].player.push({ card: chosen, faceDown: true });
                clearSelectionHighlights();
                clearEffectHighlights();
                updateUI();
                if (typeof processAbilityEffect === 'function') processAbilityEffect();
            } else if (gameState.effectContext && gameState.effectContext.type === 'luckPlay_lineSelect') {
                // Suerte 0: jugar carta aleatoria de la mano si el valor coincide
                const ctx = gameState.effectContext;
                const card = gameState.player.hand.splice(ctx.handIdx, 1)[0];
                gameState.effectContext = null;
                gameState.field[line].player.push({ card, faceDown: ctx.faceDown });
                clearSelectionHighlights();
                updateUI();
                if (!ctx.faceDown) triggerCardEffect(card, 'onPlay', 'player');
                if (typeof processAbilityEffect === 'function') processAbilityEffect();
            } else if (gameState.effectContext && gameState.effectContext.type === 'rearrange') {
                handleFieldCardClick(line, 'player', 0); // rearrange solo usa line, target/idx irrelevantes
            } else if (gameState.effectContext && gameState.effectContext.waitingForLine) {
                handleShiftTargetLine(line);
            }
        };
        // Solo el padre — lineEl tiene display:contents y no genera caja visual.
        // Asignarlo a ambos causaba doble disparo cuando el click burbujea desde una carta.
        if (lineEl.parentElement) lineEl.parentElement.onclick = handler;
    });
}

function handleShiftTargetLine(destinationLine) {
    const ctx = gameState.effectContext;
    console.log(`🔀 handleShiftTargetLine: dest=${destinationLine}, selectedCard=${JSON.stringify(ctx?.selectedCard)}, currentEffectLine=${gameState.currentEffectLine}`);

    if (ctx.type === 'compileShift') {
        if (destinationLine === ctx.sourceLine) {
            updateStatus('Elige una línea diferente a la compilada');
            return;
        }
        ctx.cards.forEach(c => gameState.field[destinationLine].player.push(c));
        gameState.pendingCompileShift = null;
        gameState.effectContext = null;
        clearEffectHighlights();
        updateUI();
        setTimeout(() => endTurn(ctx.resumeFor), 2000);
        return;
    }

    if (ctx.type === 'playTopDeckFaceDownOpponentChooseLine') {
        // Asimilación 6: juega bocabajo tu carta top en el lado del rival, en la línea elegida
        if (gameState[ctx.owner].deck.length > 0) {
            const topCard = gameState[ctx.owner].deck.pop();
            gameState.field[destinationLine][ctx.opponent].push({ card: topCard, faceDown: true });
            updateUI();
        }
        finishEffect();
        return;
    }

    if (ctx.type === 'playTopDeckFaceDownChooseLine') {
        console.log(`  → playTopDeckFaceDownChooseLine: sourceLine=${ctx.sourceLine}, dest=${destinationLine}`);
        if (destinationLine === ctx.sourceLine) {
            updateStatus('Elige una línea diferente a la de Vida 3');
            return;
        }
        if (gameState[ctx.owner].deck.length > 0) {
            const topCard = gameState[ctx.owner].deck.pop();
            gameState.field[destinationLine][ctx.owner].push({ card: topCard, faceDown: true });
        }
        finishEffect();
        return;
    }

    if (ctx.type === 'moveAllFaceDown') {
        // Move all face-down cards from sourceLine to destinationLine
        const { sourceLine, owner } = ctx;
        if (sourceLine === destinationLine) return;
        const toMove = gameState.field[sourceLine][owner].filter(c => c.faceDown);
        gameState.field[sourceLine][owner] = gameState.field[sourceLine][owner].filter(c => !c.faceDown);
        toMove.forEach(c => gameState.field[destinationLine][owner].push(c));
        finishEffect();
        return;
    }

    if (ctx.type === 'shiftSelf') {
        // Mover la carta desde sourceLine a destinationLine (cancelar si misma línea)
        if (ctx.sourceLine !== destinationLine) {
            const stack = gameState.field[ctx.sourceLine][ctx.target];
            // Buscar por referencia directa si está disponible, si no por nombre
            const idx = ctx.cardRef
                ? stack.indexOf(ctx.cardRef)
                : stack.findIndex(c => c.card.nombre === (ctx.cardName || 'Espíritu 3'));
            if (idx !== -1) {
                const [cardObj] = stack.splice(idx, 1);
                gameState.field[destinationLine][ctx.target].push(cardObj);
            }
        }
        finishEffect();
        return;
    }

    const { line, target, cardIdx } = ctx.selectedCard;

    if (line === destinationLine) return; // Must move to a different line

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
            if (statusEl) statusEl.textContent = '';
            pCard.style.borderColor = pColor;
            pCard.style.boxShadow = `0 0 18px ${pColor}44`;
            if (_isV2Layout) {
                const imgUrl = getCardImageUrl(pProto, 1);
                if (imgUrl) pCard.classList.add('proto-img');
                if (imgUrl) pCard.style.backgroundImage = `url('${imgUrl}')`;
                const existingPTitle = pCard.querySelector('.slot-title');
                if (imgUrl && existingPTitle) {
                    existingPTitle.dataset.text = pProto;
                } else if (imgUrl && !existingPTitle) {
                    const t = document.createElement('div');
                    t.className = 'slot-title';
                    t.dataset.text = pProto;
                    pCard.appendChild(t);
                }
            }
        }

        // AI protocol card (top) - check if exists
        const aCard = document.getElementById(`proto-${line}-ai`);
        if (aCard) {
            const nameEl = aCard.querySelector('.proto-card-name');
            if (nameEl) nameEl.textContent = aProto;
            if (nameEl) nameEl.style.color = aColor;
            const statusEl = aCard.querySelector('.proto-card-status');
            if (statusEl) statusEl.textContent = '';
            aCard.style.borderColor = aColor;
            aCard.style.boxShadow = `0 0 18px ${aColor}44`;
            if (_isV2Layout) {
                const imgUrl = getCardImageUrl(aProto, 1);
                if (imgUrl) aCard.classList.add('proto-img');
                if (imgUrl) aCard.style.backgroundImage = `url('${imgUrl}')`;
                const existingATitle = aCard.querySelector('.slot-title');
                if (imgUrl && existingATitle) {
                    existingATitle.dataset.text = aProto;
                } else if (imgUrl && !existingATitle) {
                    const t = document.createElement('div');
                    t.className = 'slot-title';
                    t.dataset.text = aProto;
                    aCard.appendChild(t);
                }
            }
        }
    });
}

function drawCard(target) {
    // Hielo 6: si el oponente tiene preventDraw activo y el jugador tiene cartas en mano, no roba
    if (gameState[target].hand.length > 0 && typeof getPersistentModifiers === 'function') {
        const opp = target === 'player' ? 'ai' : 'player';
        const blocked = LINES.some(l => {
            const stack = gameState.field[l][opp];
            if (stack.length === 0) return false;
            const top = stack[stack.length - 1];
            return !top.faceDown && getPersistentModifiers(top.card).preventDraw;
        });
        if (blocked) {
            updateStatus(`Hielo 6: ${target === 'player' ? 'no puedes' : 'IA no puede'} robar cartas`);
            return false;
        }
    }
    let pState = gameState[target];
    if (pState.deck.length === 0) {
        if (pState.trash.length === 0) return false;
        const recycled = pState.trash;
        for (let i = recycled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [recycled[i], recycled[j]] = [recycled[j], recycled[i]];
        }
        pState.deck = recycled;
        pState.trash = [];
    }
    pState.hand.push(pState.deck.pop());
    return true;
}

function createFieldCardHTML(card) {
    const color = PROTOCOL_DEFS[card.protocol] ? PROTOCOL_DEFS[card.protocol].color : '#00d4ff';
    return `<div class="field-card" data-id="${card.id}" style="border-color:${color}; box-shadow: 0 0 10px ${color}33;">
        <span class="field-card-value" style="color:${color}">${card.valor}</span>
    </div>`;
}

function isSelectionActive() {
    // Check if any effect overlay is open
    const overlayIds = ['action-modal', 'command-confirm', 'reveal-modal', 'overlay-select'];
    const hasOverlay = overlayIds.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
    });
    if (hasOverlay) return true;
    return gameState.selectionMode ||
        (gameState.effectContext && (
            gameState.effectContext.waitingForLine ||
            gameState.effectContext.type === 'pickHandFaceDown_lineSelect' ||
            gameState.effectContext.type === 'playTopDeckFaceDownOpponentChooseLine' ||
            gameState.effectContext.type === 'pickFromDiscardToPlay' ||
            gameState.effectContext.type === 'pickFromDiscardToPlay_lineSelect' ||
            gameState.effectContext.type === 'pickFromDiscardFaceDown_lineSelect' ||
            gameState.effectContext.type === 'rearrange' ||
            gameState.effectContext.type === 'selectCardToCopy' ||
            gameState.effectContext.type === 'luckPlay_lineSelect'
        ));
}

function showCardPreview(card) {
    const panel = document.getElementById('card-preview-panel');
    if (!panel || isSelectionActive()) return;
    panel.classList.remove('hidden', 'stacked-view');
    panel.classList.add('single-card');
    panel.style.width = '370px';
    panel.style.height = '490px';
    panel.innerHTML = createCardHTML(card);
}


function hideCardPreview() {
    const panel = document.getElementById('card-preview-panel');
    if (panel) {
        panel.classList.add('hidden');
        panel.classList.remove('single-card', 'stacked-view');
    }
}

// Mapa protocolo español → nombre fichero imagen inglés
const PROTOCOL_IMG_MAP = {
    // Main 1
    'Espíritu': { en: 'spirit', ed: 1 },
    'Muerte':   { en: 'death',  ed: 1 },
    'Fuego':    { en: 'fire',   ed: 1 },
    'Gravedad': { en: 'gravity', ed: 1 },
    'Vida':     { en: 'life',   ed: 1 },
    'Luz':      { en: 'light',  ed: 1 },
    'Metal':    { en: 'metal',  ed: 1 },
    'Plaga':    { en: 'plague', ed: 1 },
    'Psique':   { en: 'psychic', ed: 1 },
    'Velocidad':{ en: 'speed',  ed: 1 },
    'Agua':     { en: 'water',  ed: 1 },
    'Oscuridad':{ en: 'darkness', ed: 1 },
    'Apatía':   { en: 'apathy', ed: 1 },
    'Odio':     { en: 'hate',   ed: 1 },
    'Amor':     { en: 'love',   ed: 1 },
    // Main 2
    'Asimilación': { en: 'assimilation', ed: 2 },
    'Caos':        { en: 'chaos',   ed: 2 },
    'Claridad':    { en: 'clarity', ed: 2 },
    'Corrupción':  { en: 'corruption', ed: 2 },
    'Valor':       { en: 'courage', ed: 2 },
    'Diversidad':  { en: 'diversity', ed: 2 },
    'Miedo':       { en: 'fear',   ed: 2 },
    'Hielo':       { en: 'ice',    ed: 2 },
    'Suerte':      { en: 'luck',   ed: 2 },
    'Espejo':      { en: 'mirror', ed: 2 },
    'Paz':         { en: 'peace',  ed: 2 },
    'Humo':        { en: 'smoke',  ed: 2 },
    'Tiempo':      { en: 'time',   ed: 2 },
    'Unidad':      { en: 'unity',  ed: 2 },
    'Guerra':      { en: 'war',    ed: 2 },
};

function getCardImageUrl(protocol, valor) {
    const info = PROTOCOL_IMG_MAP[protocol];
    if (!info) return '';
    const folder = info.ed === 1 ? 'Main_1' : 'Main_2';
    return `../images/cards/${folder}/${info.en}_${valor}.jpg`;
}

function getCardBackUrl(protocol) {
    const info = PROTOCOL_IMG_MAP[protocol];
    if (!info) return '../images/cards/Main_2/dorso.webp';
    return info.ed === 1
        ? '../images/cards/Main_1/rear.jpg'
        : '../images/cards/Main_2/dorso.webp';
}

// Detectar si estamos en v2
const _isV2Layout = !!document.querySelector('.vertical-stack');

function createCardHTML(card, faceDown = false) {
    if (faceDown) {
        if (_isV2Layout) {
            const backUrl = card ? getCardBackUrl(card.protocol) : '../images/cards/Main_2/dorso.webp';
            return `<div class="card face-down card-img" style="background-image: url('${backUrl}');">
            </div>`;
        }
        return `<div class="card face-down">
            <div class="card-back-value">2</div>
            <div class="card-back-title">COMPILE</div>
        </div>`;
    }
    if (!card) return '';

    const color = PROTOCOL_DEFS[card.protocol] ? PROTOCOL_DEFS[card.protocol].color : 'var(--accent-glow)';

    // Usamos campos segmentados del JSON
    const startText = card.h_inicio || '';
    const actionText = card.h_accion || '';
    const endText = card.h_final || '';

    // V2: carta con imagen de fondo + zonas de texto español en slots fijos
    if (_isV2Layout) {
        const imgUrl = getCardImageUrl(card.protocol, card.valor);
        return `
        <div class="card card-img" data-id="${card.id}" style="border-color: ${color}; box-shadow: 0 0 15px ${color}33; background-image: url('${imgUrl}');">
            <div class="slot-title" data-text="${card.nombre.replace(/\s+\d+$/, '')}"></div>
            ${startText  ? `<div class="card-img-zone slot-start"><div class="card-img-zone-text">${startText}</div></div>` : ''}
            ${actionText ? `<div class="card-img-zone slot-action"><div class="card-img-zone-text">${actionText}</div></div>` : ''}
            ${endText    ? `<div class="card-img-zone slot-end"><div class="card-img-zone-text">${endText}</div></div>` : ''}
        </div>
        `;
    }

    return `
        <div class="card" data-id="${card.id}" style="border-color: ${color}; box-shadow: 0 0 15px ${color}33;">
            <div class="card-header">
                <span class="card-value" style="color: ${color}">${card.valor}</span>
                <span class="card-title" style="color: ${color}">${card.nombre.replace(/\s+\d+$/, '')}</span>
            </div>
            <div class="card-body">
                <div class="zone zone-start">
                    <div class="zone-content">${startText}</div>
                </div>
                <div class="zone zone-action">
                    <div class="zone-content">${actionText}</div>
                </div>
                <div class="zone zone-end">
                    <div class="zone-content">${endText}</div>
                </div>
            </div>
        </div>
    `;
}

function updateUI() {
    if (!GLOBAL_CARDS) return; // Esperar a que carguen las cartas
    hideCardPreview(); // Limpiar preview flotante al re-renderizar el campo


    // Update deck/trash counts (query fresh to avoid stale references)
    const playerDeckEl = document.getElementById('player-deck-count');
    const playerTrashEl = document.getElementById('player-trash-count');
    const aiDeckEl = document.getElementById('ai-deck-count');
    const aiTrashEl = document.getElementById('ai-trash-count');
    if (playerDeckEl) playerDeckEl.innerText = gameState.player.deck.length;
    if (playerTrashEl) playerTrashEl.innerText = gameState.player.trash.length;
    if (aiDeckEl) aiDeckEl.innerText = gameState.ai.deck.length;
    if (aiTrashEl) aiTrashEl.innerText = gameState.ai.trash.length;

    // Update hands
    if (ui.playerHand) {
        ui.playerHand.innerHTML = gameState.player.hand.map(c => createCardHTML(c)).join('');
        // No hover preview for hand cards — stacked preview via protocol cards is sufficient
    }
    // AI hand: just show count
    const aiHandCountEl = document.getElementById('ai-hand-count');
    if (aiHandCountEl) {
        const n = gameState.ai.hand.length;
        aiHandCountEl.textContent = n;
        aiHandCountEl.style.color = n === 0 ? '#ef4444' : 'var(--ui-pink)';
    }
    // V2: update hand count badge
    const handBadge = document.getElementById('hand-count-badge');
    if (handBadge) handBadge.textContent = gameState.player.hand.length;
    
    // Attach events to player hand
    document.querySelectorAll('#player-hand .card').forEach((cardEl, index) => {
        cardEl.onclick = () => {
            console.log(`🖱️ Card clicked at index ${index}. gameState.turn=${gameState.turn}, phase=${gameState.phase}, effectContext=${gameState.effectContext ? gameState.effectContext.type : 'none'}`);
            if (gameState.effectContext && (gameState.effectContext.type === 'discard' || gameState.effectContext.type === 'discardAny' || gameState.effectContext.type === 'discardVariable' || gameState.effectContext.type === 'give')) {
                console.log(`   → Handling discard/give choice`);
                handleDiscardChoice(index);
            } else if (gameState.effectContext && gameState.effectContext.type === 'reveal') {
                handleRevealChoice(index);
            } else if (gameState.effectContext && gameState.effectContext.type === 'pickHandFaceDown') {
                gameState.selectedCardIndex = index;
                gameState.effectContext.type = 'pickHandFaceDown_lineSelect';
                const card = gameState.player.hand[index];
                const ctx = gameState.effectContext;
                const lineHint = ctx.allowedLines ? ' (solo líneas con carta bocabajo)' : ctx.excludeLine ? ' (no la línea actual)' : '';
                updateStatus(`Elige línea destino para "${card.nombre}"${lineHint}`);
            } else if (gameState.effectContext && gameState.effectContext.type === 'pickFromDiscardToPlay') {
                // Tiempo 0: elegir carta del descarte para jugar bocarriba
                const ctx = gameState.effectContext;
                if (index < ctx.handSizeBefore) {
                    updateStatus('Tiempo 0: elige una de las cartas del descarte (las últimas de tu mano)');
                    return;
                }
                ctx.chosenRelIdx = index - ctx.handSizeBefore;
                ctx.type = 'pickFromDiscardToPlay_lineSelect';
                const cardT0 = gameState.player.hand[index];
                updateStatus(`Tiempo 0: elige la línea donde jugar "${cardT0.nombre}"`);
                updateUI();
            } else if (gameState.effectContext && gameState.effectContext.type === 'playHandCard_valor1') {
                // Claridad 2 paso 2: jugar carta de Valor 1 con el modal normal (bocarriba/bocabajo)
                const card = gameState.player.hand[index];
                if (!card || card.valor !== 1) {
                    updateStatus('Claridad 2: solo puedes jugar cartas con Valor 1');
                    return;
                }
                // Limpiar contexto antes de abrir el modal para que fluya como jugada normal
                gameState.effectContext = null;
                gameState.pendingTurnEnd = null;
                showActionModal(index);
            } else if (gameState.effectContext && gameState.effectContext.type === 'playNonDiversity') {
                // Diversidad 0: jugador elige carta no-Diversidad para jugar bocarriba
                const card = gameState.player.hand[index];
                if (!card || card.nombre.startsWith('Diversidad')) {
                    updateStatus('Solo puedes elegir cartas que no sean Diversidad');
                    return;
                }
                const ctx = gameState.effectContext;
                const [played] = gameState.player.hand.splice(index, 1);
                const cardObj = { card: played, faceDown: false };
                gameState.field[ctx.line].player.push(cardObj);
                gameState.effectContext = null;
                updateStatus(`Juegas ${played.nombre} bocarriba en ${ctx.line} (Diversidad 0)`);
                updateUI();
                if (typeof triggerCardEffect === 'function') {
                    gameState.currentEffectLine = ctx.line;
                    triggerCardEffect(played, 'onPlay', 'player');
                }
                if (typeof processAbilityEffect === 'function') processAbilityEffect();
            } else if (gameState.effectContext) {
                console.log(`   → Blocked: effectContext=${gameState.effectContext.type}`);
            } else {
                console.log(`   → Showing action modal`);
                showActionModal(index);
            }
        };
    });

    // Update field lines and scores
    LINES.forEach(line => {
        renderStack(line, 'player');
        renderStack(line, 'ai');
        
        const pScore = calculateScore(gameState, line, 'player');
        const aiScore = calculateScore(gameState, line, 'ai');
        
        // Try to update score display if it exists
        const pScoreEl = document.querySelector(`#proto-${line}-player .player-score`);
        const aiScoreEl = document.querySelector(`#proto-${line}-ai .ai-score`);
        if (pScoreEl) pScoreEl.innerText = pScore;
        if (aiScoreEl) aiScoreEl.innerText = aiScore;

        // Visual blocking indicators
        const lineEl = document.getElementById(`line-${line}`);
        if (lineEl) {
            lineEl.classList.remove('line-blocked', 'line-blocked-facedown');
            
            // Plaga 0: Total block for player
            if (isPlayBlockedByPersistent(line, 'player', false)) {
                lineEl.classList.add('line-blocked');
            } 
            // Metal 2: Block face-down for player
            else if (isPlayBlockedByPersistent(line, 'player', true)) {
                lineEl.classList.add('line-blocked-facedown');
            }
        }

        // Mark compiled protocols if they exist
        if (gameState.field[line].compiledBy) {
            const compiledBy = gameState.field[line].compiledBy;
            const pCard = document.getElementById(`proto-${line}-player`);
            const aCard = document.getElementById(`proto-${line}-ai`);
            const cardToMark = compiledBy === 'player' ? pCard : aCard;
            if (cardToMark) {
                cardToMark.classList.add('compiled');
                cardToMark.classList.add(`compiled-${compiledBy}`);
            }
        }
    });

    initProtocolDisplay();
    checkWinCondition();
}

function calculateScore(state, line, target) {
    // Oscuridad 2: si hay una carta bocarriba con faceDownValueOverride en esta pila, bocabajo valen su valor override
    const faceDownOverride = (() => {
        if (typeof CARD_EFFECTS === 'undefined') return null;
        for (const cardObj of state.field[line][target]) {
            if (cardObj.faceDown) continue;
            const ef = CARD_EFFECTS[cardObj.card.nombre];
            if (ef && ef.persistent && ef.persistent.effect === 'faceDownValueOverride') return ef.persistent.value;
        }
        return null;
    })();

    // Calcular score base
    let score = state.field[line][target].reduce((sum, cardObj) => {
        if (cardObj.faceDown) return sum + (faceDownOverride !== null ? faceDownOverride : 2);
        return sum + cardObj.card.valor;
    }, 0);
    
    // Aplicar modificadores persistentes (Metal 0 reduce, Apatía 0 suma bono)
    if (typeof applyPersistentValueModifiers === 'function') {
        const netModifier = applyPersistentValueModifiers(state, line, target);
        // netModifier positivo = reducción; negativo = bono al score
        score = Math.max(0, score - netModifier);
    }
    
    return score;
}

// Exponer globalmente
window.calculateScore = calculateScore;

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
    const isV2 = stackEl.classList.contains('vertical-stack');

    // V2: dynamic offset — shrinks as stack grows to keep height manageable
    const V2_CARD_H = 277;
    const V2_EXTRA_GAP = 20; // extra gap from 2nd card onwards
    let v2Offset = 100;
    if (isV2 && stack.length > 3) {
        v2Offset = Math.max(40, Math.floor((600 - V2_CARD_H) / Math.max(stack.length - 1, 1)));
    }
    if (isV2) {
        const totalH = stack.length === 0 ? 0 : (stack.length - 1) * (v2Offset + V2_EXTRA_GAP) + V2_CARD_H;
        stackEl.style.minHeight = Math.max(totalH, 280) + 'px';
    }

    stack.forEach((cardObj, idx) => {
        const cEl = document.createElement('div');
        const isUncovered = idx === stack.length - 1;

        if (isV2) {
            // V2: all cards rendered as full cards, overlapping vertically
            cEl.innerHTML = cardObj.faceDown
                ? createCardHTML(null, true)
                : createCardHTML(cardObj.card);
        } else if (cardObj.faceDown) {
            // V1: chip face-down
            cEl.innerHTML = `<div class="field-card face-down" title="Carta bocabajo">
                <span class="field-card-value" style="color:#94a3b8">2</span>
            </div>`;
        } else {
            // V1: chip face-up
            cEl.innerHTML = createFieldCardHTML(cardObj.card);
        }

        const domCard = cEl.firstElementChild;

        if (isV2) {
            // V2: hover muestra la carta individual ampliada
            // Regla: bocabajo del jugador se revelan, bocabajo del rival se ocultan
            const canReveal = !cardObj.faceDown || target === 'player';
            if (canReveal) {
                domCard.addEventListener('mouseenter', () => showCardPreview(cardObj.card));
                domCard.addEventListener('mouseleave', hideCardPreview);
            }
        } else if (!cardObj.faceDown) {
            domCard.addEventListener('mouseenter', () => showCardPreview(cardObj.card));
            domCard.addEventListener('mouseleave', hideCardPreview);
        }

        // Add click handler for effects (eliminate/flip/shift/return)
        domCard.onclick = (e) => {
            // In selectionMode or line-select effects, let click bubble to line handler
            if (gameState.selectionMode) return;
            if (gameState.effectContext && (
                gameState.effectContext.type?.endsWith('_lineSelect') ||
                gameState.effectContext.waitingForLine
            )) return;
            // rearrange selecciona líneas — dejar que burbujee al line handler
            if (gameState.effectContext && gameState.effectContext.type === 'rearrange') return;
            e.stopPropagation();
            if (gameState.effectContext) {
                // Rule: Only uncovered cards can be manipulated unless "all" or coveredOnly is specified
                if (!isUncovered && !gameState.effectContext.targetAll && !gameState.effectContext.coveredOnly) {
                    console.warn("Only uncovered cards can be targeted.");
                    return;
                }
                handleFieldCardClick(line, target, idx);
            }
        };

        const wrapper = document.createElement('div');
        wrapper.className = 'card-field-wrapper';

        if (isV2) {
            // Position with absolute offset for overlap
            wrapper.style.top = (idx * (v2Offset + 20)) + 'px';
            wrapper.style.zIndex = idx + 1;
            // Mark field cards to prevent hand-card hover styles
            domCard.classList.add('card-in-field');
        } else {
            domCard.style.zIndex = idx;
        }

        if (isUncovered) domCard.classList.add('uncovered');

        wrapper.appendChild(domCard);
        stackEl.appendChild(wrapper);
    });
}

// Turn Cycle Functions
function startTurn(who) {
    gameState.turn = who;
    gameState.phase = 'start';
    gameState.ignoreEffectsLines = {};
    gameState.uncoveredThisTurn = new Set();
    // Snapshot del flag de robo del turno anterior (para Espíritu 3), luego resetear
    gameState.drawnLastTurn = { player: gameState.drawnSinceLastCheck.player, ai: gameState.drawnSinceLastCheck.ai };
    gameState.drawnSinceLastCheck = { player: false, ai: false };
    // Snapshot del flag de eliminación del turno anterior (para Odio 3), luego resetear
    gameState.eliminatedLastTurn = { player: gameState.eliminatedSinceLastCheck.player, ai: gameState.eliminatedSinceLastCheck.ai };
    gameState.eliminatedSinceLastCheck = { player: false, ai: false };
    gameState.refreshedThisTurn = null;
    // Limpiar cartas reveladas que ya no están en la mano del jugador
    gameState.revealedPlayerCards = gameState.revealedPlayerCards.filter(
        rc => gameState.player.hand.some(h => h.nombre === rc.nombre)
    );
    updateStatus(`--- Turno de ${who === 'player' ? 'Jugador' : 'IA'} ---`);

    // Disparar efectos de inicio de turno; la fase de compilación esperará a que terminen
    gameState.pendingCheckCompile = who;
    if (typeof onTurnStartEffects === 'function') {
        onTurnStartEffects(who);
    }
    // Si no hubo efectos (cola vacía), avanzar manualmente
    if (typeof processAbilityEffect === 'function') processAbilityEffect();
}

function checkCompilePhase(who) {
    gameState.phase = 'check_compile';
    console.log(`📋 Checking compile phase for ${who}`);
    updateStatus(`Comprobando compilaciones...`);
    
    // Metal 1: si el compilado está bloqueado este turno, consumir 1 turno y saltar toda la fase
    if (gameState.preventCompile[who] > 0) {
        console.log(`  🚫 Compile blocked for ${who} (${gameState.preventCompile[who]} turns left)`);
        gameState.preventCompile[who]--;
        updateStatus(`Compilado bloqueado por Metal 1`);
        // Saltar la fase de compilado completamente — ir directo a fase de acción
        setTimeout(() => actionPhase(who), 800);
        return;
    }

    let compiledAny = false;
    for (const line of LINES) {
        const myScore = calculateScore(gameState, line, who);
        const oppScore = calculateScore(gameState, line, who === 'player' ? 'ai' : 'player');

        console.log(`  Line ${line}: ${who}=${myScore} vs opp=${oppScore}`);

        if (myScore >= 10 && myScore > oppScore) {
            console.log(`  ✅ Compiled: ${line}`);
            compileLine(line, who);
            compiledAny = true;
            break; // Max 1 compile per turn as per rules
        }
    }

    if (compiledAny) {
        updateUI();
        if (gameState.pendingCompileShift) {
            const { cards, sourceLine } = gameState.pendingCompileShift;
            gameState.effectContext = { type: 'compileShift', cards, sourceLine, resumeFor: who, waitingForLine: true };
            updateStatus('Velocidad 2: elige línea donde cambiar la carta');
            highlightSelectableLines(sourceLine);
        } else {
            setTimeout(() => endTurn(who), 2000);
        }
    } else {
        console.log(`✅ No compilations, moving to action phase`);
        actionPhase(who);
    }
}

function actionPhase(who) {
    gameState.phase = 'action';
    console.log(`🎮 ACTION PHASE for ${who} - game is now playable`);
    updateStatus(who === 'player' ? 'Juega una carta o Recarga' : 'IA eligiendo acción...');

    if (who === 'ai') {
        setTimeout(playAITurn, 1500);
    }
}

function compileLine(line, who) {
    const rival = who === 'player' ? 'ai' : 'player';
    const previousOwner = gameState.field[line].compiledBy;

    console.log(`📦 compileLine: line=${line}, who=${who}, previousOwner=${previousOwner}, player cards=${gameState.field[line].player.length}, ai cards=${gameState.field[line].ai.length}`);

    if (previousOwner === who) {
        // Mismo jugador re-compila su propia línea: roba carta superior del mazo rival
        if (gameState[rival].deck.length > 0) {
            const stolenCard = gameState[rival].deck.pop();
            gameState[who].hand.push(stolenCard);
            updateStatus(`¡${who === 'player' ? 'Re-compilaste' : 'IA re-compiló'} ${line} y robó una carta rival!`);
        } else {
            updateStatus(`¡${who === 'player' ? 'Re-compilaste' : 'IA re-compiló'} ${line}! (mazo rival vacío)`);
        }
    } else {
        // Primera compilación o rival toma la línea: crédito normal, cambiar dueño
        gameState.field[line].compiledBy = who;
        updateStatus(`¡${who === 'player' ? 'Has' : 'IA ha'} compilado ${line}!`);
    }

    // Crédito de victoria: solo se cuenta una vez por línea por jugador
    if (!gameState[who].compiled.includes(line)) {
        gameState[who].compiled.push(line);
    }

    // Velocidad 2: extraer antes de descartar para mover a otra línea
    const otherLines = LINES.filter(l => l !== line);
    const v2Player = gameState.field[line].player.filter(c => c.card.nombre === 'Velocidad 2');
    const v2AI     = gameState.field[line].ai.filter(c => c.card.nombre === 'Velocidad 2');
    gameState.field[line].player = gameState.field[line].player.filter(c => c.card.nombre !== 'Velocidad 2');
    gameState.field[line].ai     = gameState.field[line].ai.filter(c => c.card.nombre !== 'Velocidad 2');

    // Descartar todas las cartas restantes de la línea en ambos lados
    gameState.field[line].player.forEach(c => gameState.player.trash.push(c.card));
    gameState.field[line].ai.forEach(c => gameState.ai.trash.push(c.card));
    gameState.field[line].player = [];
    gameState.field[line].ai = [];

    // IA: mover Velocidad 2 a línea aleatoria
    v2AI.forEach(c => {
        const dest = aiPickDestLine([line]) || otherLines[0];
        gameState.field[dest].ai.push(c);
        updateStatus(`IA desplaza Velocidad 2 a ${dest}`);
    });

    // Jugador: marcar pendiente para selección interactiva
    if (v2Player.length > 0) {
        gameState.pendingCompileShift = { cards: v2Player, sourceLine: line };
    }

    // Efectos reactivos: cartas del rival que reaccionan a compilar (ej: War 2)
    if (typeof onOpponentCompileEffects === 'function') onOpponentCompileEffects(who);
}

function showActionModal(handIndex) {
    console.log(`📋 showActionModal called. Check: turn=${gameState.turn}, phase=${gameState.phase}`);
    
    if (gameState.turn !== 'player') {
        console.warn(`❌ Not player's turn: ${gameState.turn}`);
        return;
    }
    
    if (gameState.phase !== 'action') {
        console.warn(`❌ Wrong phase: ${gameState.phase} (need 'action')`);
        return;
    }
    
    gameState.selectedCardIndex = handIndex;
    const card = gameState.player.hand[handIndex];
    
    console.log(`✅ Showing modal for: ${card.nombre}`);
    
    if (!ui.modalCardPreview) {
        console.error('❌ modalCardPreview not found in DOM');
        return;
    }
    
    ui.modalCardPreview.innerHTML = createCardHTML(card);
    
    // Check if face-up play is legal: card protocol must match the line's protocol
    // ERRATA Espíritu 1: if allowAnyProtocol is active, any line is valid
    // Unidad 1: cartas Unidad pueden jugarse bocarriba en la línea de Unidad 1
    const lineIndex = gameState.player.protocols.indexOf(card.protocol);
    const targetLine = lineIndex !== -1 ? LINES[lineIndex] : null;
    const forcedFaceDown = typeof hasForceOpponentFaceDown === 'function' && hasForceOpponentFaceDown('player');
    const unityLine = typeof getUnityPlayLine === 'function' ? getUnityPlayLine('player') : null;
    const canPlayUnity = unityLine && card.nombre.startsWith('Unidad') && targetLine !== unityLine;
    const cardPlayAnywhere = typeof canPlayAnywhere === 'function' && canPlayAnywhere(card);
    const canPlayUp = !forcedFaceDown && (targetLine !== null || (typeof hasAllowAnyProtocol === 'function' && hasAllowAnyProtocol('player')) || canPlayUnity || cardPlayAnywhere);
    
    console.log(`  Protocol: ${card.protocol}, Line: ${targetLine}, CanPlayUp: ${canPlayUp}`);
    
    if (ui.btnPlayUp) {
        ui.btnPlayUp.disabled = !canPlayUp;
        ui.btnPlayUp.style.opacity = canPlayUp ? "1" : "0.5";
        ui.btnPlayUp.style.cursor = canPlayUp ? "pointer" : "not-allowed";
    }
    
    if (ui.actionModal) {
        ui.actionModal.classList.remove('hidden');
        console.log(`✅ Modal displayed`);
    } else {
        console.error('❌ actionModal not found in DOM');
    }
}

ui.btnPlayUp.onclick = () => playSelectedCard(false);
ui.btnPlayDown.onclick = () => playSelectedCard(true);
ui.btnCancel.onclick = () => {
    ui.actionModal.classList.add('hidden');
    gameState.selectedCardIndex = null;
};

// Initialize modal button handlers with error checking
function initializeModalButtons() {
    if (ui.btnPlayUp) {
        ui.btnPlayUp.onclick = () => {
            console.log('🔘 btnPlayUp clicked');
            playSelectedCard(false);
        };
        console.log('✅ btnPlayUp handler attached');
    } else {
        console.error('❌ btnPlayUp not found');
    }
    
    if (ui.btnPlayDown) {
        ui.btnPlayDown.onclick = () => {
            console.log('🔘 btnPlayDown clicked');
            playSelectedCard(true);
        };
        console.log('✅ btnPlayDown handler attached');
    } else {
        console.error('❌ btnPlayDown not found');
    }
    
    if (ui.btnCancel) {
        ui.btnCancel.onclick = () => {
            console.log('🔘 btnCancel clicked');
            ui.actionModal.classList.add('hidden');
            gameState.selectedCardIndex = null;
        };
        console.log('✅ btnCancel handler attached');
    } else {
        console.error('❌ btnCancel not found');
    }
}

// --- Motor de Habilidades ---
function executeEffect(card, targetPlayer) {
    executeNewEffect(card, targetPlayer);
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

function startEffect(type, target, count, opts = {}) {
    // Determine if this should be interactive or automatic
    let isAIResolving = false;
    
    if (type === 'discard' || type === 'discardAny' || type === 'give' || type === 'reveal') {
        // Acciones sobre la mano: el dueño de la mano elige.
        isAIResolving = (target === 'ai');
    } else if (type === 'rearrange') {
        // Reorganizar protocolos: el dueño de los protocolos decide, no el jugador del turno.
        // Si la IA descubre una carta propia con "reorganiza tus protocolos", la IA lo resuelve
        // aunque sea el turno del jugador (y viceversa).
        isAIResolving = (target === 'ai');
    } else {
        // Acciones sobre el tablero: el jugador del turno elige.
        isAIResolving = (gameState.turn === 'ai');
    }

    if (isAIResolving) {
        resolveEffectAI(type, target, count, opts);
        return;
    }

    // Si es descarte/dar del jugador, limitar count a cartas disponibles
    if ((type === 'discard' || type === 'discardAny' || type === 'give') && target === 'player') {
        if (gameState.player.hand.length === 0) {
            console.log(`⏭️ Descarte omitido — mano vacía`);
            if (typeof processAbilityEffect === 'function') processAbilityEffect();
            return;
        }
        count = Math.min(count, gameState.player.hand.length);
    }

    // Si es eliminate/flip/return/shift y no hay cartas válidas en campo, saltar efecto
    if (type === 'eliminate' || type === 'flip' || type === 'return' || type === 'shift') {
        const filterCtx = { filter: opts.filter, maxVal: opts.maxVal, minVal: opts.minVal, exactVal: opts.exactVal };
        const baseLines = opts.allowedLines || (opts.forceLine ? [opts.forceLine] : LINES);
        const linesToCheck = baseLines.filter(l => l !== opts.excludeLine);
        const targets = target === 'any' ? ['player', 'ai'] : [target];
        const hasValid = linesToCheck.some(l =>
            targets.some(p => {
                const stack = gameState.field[l][p];
                if (opts.coveredOnly) {
                    if (stack.length < 2) return false;
                    // Con filtro + targetAll: verificar que alguna carta cubierta pase el filtro
                    if (opts.targetAll && filterCtx.filter) {
                        return stack.slice(0, -1).some(c => cardMatchesFilter(c, filterCtx));
                    }
                    return true;
                }
                if (stack.length === 0) return false;
                // targetAll: buscar en toda la pila con filtro genérico
                if (opts.targetAll) {
                    return stack.some(c => {
                        if (opts.excludeCardName && c.card.nombre === opts.excludeCardName) return false;
                        return cardMatchesFilter(c, filterCtx);
                    });
                }
                const topCard = stack[stack.length - 1];
                if (opts.excludeCardName && topCard.card.nombre === opts.excludeCardName) return false;
                if (type === 'flip' && typeof getPersistentModifiers === 'function' && getPersistentModifiers(topCard.card).preventFlip) return false;
                return cardMatchesFilter(topCard, filterCtx);
            })
        );
        if (!hasValid) {
            console.log(`⏭️ ${type} omitido — sin cartas válidas`);
            if (typeof processAbilityEffect === 'function') processAbilityEffect();
            return;
        }
    }

    gameState.effectContext = { type, target, count, selected: [], _triggerName: gameState.currentTriggerCard || '', ...opts };
    console.log(`🎯 startEffect: type=${type}, target=${target}, count=${count}`);

    let actionVerb = 'VOLTEAR';
    if (type === 'discard' || type === 'discardAny') actionVerb = 'DESCARTAR';
    else if (type === 'give') actionVerb = 'DAR AL OPONENTE';
    else if (type === 'eliminate') actionVerb = 'ELIMINAR';
    else if (type === 'return') actionVerb = 'DEVOLVER';
    else if (type === 'shift') actionVerb = 'CAMBIAR de línea';
    else if (type === 'swap') actionVerb = 'INTERCAMBIAR';
    else if (type === 'rearrange') actionVerb = 'REORGANIZAR protocolos';

    const targetDesc = target === 'ai' ? ' del OPONENTE' : target === 'player' ? ' TUYAS' : '';
    if (type === 'rearrange') {
        const ownerDesc = target === 'ai' ? 'del OPONENTE' : 'TUYOS';
        updateStatus(`Reorganizar protocolos ${ownerDesc}: intercambia líneas y pulsa Listo`);
        // Mostrar botón "Listo" para confirmar reorganización
        showRearrangeDoneButton();
    } else {
        updateStatus(`Efecto: elige ${count} carta(s)${targetDesc} para ${actionVerb}`);
    }
    highlightEffectTargets();
}

function highlightEffectTargets() {
    const ctx = gameState.effectContext;
    if (!ctx) return;

    if (ctx.type === 'discardVariable' || ctx.type === 'discardAny') {
        if (typeof showHandSelectOverlay === 'function') {
            showHandSelectOverlay(ctx.type, 0, ctx);
        }
    } else if (ctx.type === 'discard' || ctx.type === 'give') {
        if (typeof showHandSelectOverlay === 'function') {
            showHandSelectOverlay(ctx.type, ctx.count - ctx.selected.length, ctx);
        }
    } else if (ctx.type === 'eliminate' || ctx.type === 'flip' || ctx.type === 'return' || ctx.type === 'shift' || ctx.type === 'selectCardToCopy' || ctx.type === 'rearrange' || ctx.type === 'swap') {
        // Click directo en mesa — el jugador necesita ver el contexto del tablero
        // Las cartas del campo ya tienen onclick → handleFieldCardClick
    } else if (ctx.type === 'reveal') {
        if (typeof showHandSelectOverlay === 'function') {
            showHandSelectOverlay('reveal', 1, ctx);
        }
    } else if (ctx.type === 'playNonDiversity') {
        if (typeof showHandSelectOverlay === 'function') {
            showHandSelectOverlay('playNonDiversity', 1, ctx);
        }
    } else if (ctx.type === 'confirm') {
        // No highlighting needed, just the confirm dialog
    } else if (ctx.type === 'massDeleteByValueRange') {
        if (typeof showLineSelectOverlay === 'function') {
            showLineSelectOverlay(ctx);
        }
    }
}

function executeMassDeleteByValueRange(line) {
    const ctx = gameState.effectContext;
    if (!ctx || ctx.type !== 'massDeleteByValueRange') return;
    const { minVal, maxVal } = ctx;
    ['player', 'ai'].forEach(p => {
        const toKeep = [];
        gameState.field[line][p].forEach(c => {
            if (c.faceDown || (c.card.valor >= minVal && c.card.valor <= maxVal)) {
                gameState[p].trash.push(c.card);
            } else { toKeep.push(c); }
        });
        gameState.field[line][p] = toKeep;
    });
    finishEffect();
}

function cardMatchesFilter(cardObj, ctx) {
    if (!ctx.filter) return true;
    if (ctx.filter === 'faceDown') return cardObj.faceDown;
    if (ctx.filter === 'faceUp') return !cardObj.faceDown;
    if (ctx.filter === 'maxValue') return !cardObj.faceDown && cardObj.card.valor <= (ctx.maxVal ?? 99);
    if (ctx.filter === 'minValue') return !cardObj.faceDown && cardObj.card.valor >= (ctx.minVal ?? 0);
    if (ctx.filter === 'exactValue') return cardObj.card.valor === ctx.exactVal; // cubierta o descubierta
    return true;
}

function clearEffectHighlights() {
    document.querySelectorAll('.targeting').forEach(el => {
        el.classList.remove('targeting');
        el.style.cursor = '';
        if (el.id && (el.id.startsWith('proto-') || el.id.startsWith('line-'))) el.onclick = null;
    });
    document.querySelectorAll('.selectable-line').forEach(el => el.classList.remove('selectable-line'));
    document.getElementById('player-hand')?.classList.remove('discard-mode', 'reveal-mode');
    const banner = document.getElementById('discard-banner');
    if (banner) banner.classList.remove('visible');
    const stopBtn = document.getElementById('btn-stop-discard');
    if (stopBtn) stopBtn.classList.add('hidden');
    const cancelBtn = document.getElementById('btn-cancel-selection');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    // Close select overlay if open
    if (typeof closeHandSelectOverlay === 'function') closeHandSelectOverlay();
}

function handleDiscardChoice(handIndex) {
    const ctx = gameState.effectContext;
    if (!ctx || (ctx.type !== 'discard' && ctx.type !== 'discardAny' && ctx.type !== 'give' && ctx.type !== 'discardVariable')) return;

    const card = gameState.player.hand.splice(handIndex, 1)[0];
    if (ctx.type === 'give') {
        gameState.ai.hand.push(card);
    } else if (gameState._discardToOpponentTrash) {
        // Asimilación 1: descarta al trash del oponente
        gameState.ai.trash.push(card);
        gameState._discardToOpponentTrash = false;
    } else {
        gameState.player.trash.push(card);
        gameState.discardedSinceLastCheck.player = true;
    }
    ctx.selected.push(card);

    if (ctx.type === 'discardVariable') {
        if (gameState.player.hand.length === 0) {
            finalizeDiscardVariable();
        } else {
            highlightEffectTargets();
            updateUI();
        }
        return;
    }

    if (ctx.type === 'discardAny') {
        if (gameState.player.hand.length === 0) {
            finishEffect();
        } else {
            highlightEffectTargets();
            updateUI();
        }
        return;
    }

    if (ctx.selected.length >= ctx.count || gameState.player.hand.length === 0) {
        finishEffect();
    } else {
        const remaining = ctx.count - ctx.selected.length;
        const banner = document.getElementById('discard-banner');
        if (banner) {
            const msg = ctx.type === 'give'
                ? `🤝 Da ${remaining} carta${remaining > 1 ? 's' : ''} al oponente — haz clic en la que quieres dar`
                : `🗑 Descarta ${remaining} carta${remaining > 1 ? 's' : ''} — haz clic en la que quieres descartar`;
            banner.textContent = msg;
        }
        updateUI();
    }
}

function handleRevealChoice(handIndex) {
    const ctx = gameState.effectContext;
    if (!ctx || ctx.type !== 'reveal') return;
    const card = gameState.player.hand[handIndex]; // no se elimina de la mano, solo se muestra
    // Registrar carta revelada para que la IA la tenga en cuenta
    if (!gameState.revealedPlayerCards.some(c => c.nombre === card.nombre)) {
        gameState.revealedPlayerCards.push(card);
    }
    updateStatus(`Revelas: ${card.nombre}`);
    finishEffect();
    processAbilityEffect();
}

function finalizeDiscardVariable() {
    const ctx = gameState.effectContext;
    if (!ctx || ctx.type !== 'discardVariable') return;
    const n = ctx.selected.length;
    finishEffect();
    discard('ai', n + 1);
    updateStatus(`Plaga 2: descartaste ${n}, la IA descarta ${n + 1}`);
}

function handleFieldCardClick(line, target, cardIdx) {
    hideCardPreview();
    const ctx = gameState.effectContext;
    if (!ctx) return;

    // Validate target (rearrange selecciona líneas, no cartas de un lado)
    if (ctx.type !== 'rearrange' && ctx.target !== 'any' && ctx.target !== target) return;

    if (ctx.type === 'eliminate') {
        if (ctx.forceLine && line !== ctx.forceLine) return;
        if (ctx.allowedLines && !ctx.allowedLines.includes(line)) return;
        const cardObj = gameState.field[line][target][cardIdx];
        if (!cardMatchesFilter(cardObj, ctx)) return;
        gameState.field[line][target].splice(cardIdx, 1);
        gameState[target].trash.push(cardObj.card);
        gameState.eliminatedSinceLastCheck[gameState.turn] = true;
        ctx.selected.push(cardObj);
        // Odio 2 tie-break: if the chosen card is NOT Odio 2 itself, queue opponent phase
        if (ctx._checkSuicide) {
            const { triggerCardName, queueEffect } = ctx._checkSuicide;
            if (cardObj.card.nombre !== triggerCardName && queueEffect) {
                gameState.effectQueue.unshift(queueEffect);
            }
        }
        triggerUncovered(line, target);
    } else if (ctx.type === 'flip') {
        const cardObj = gameState.field[line][target][cardIdx];
        if (ctx.forceLine && line !== ctx.forceLine) return;
        if (ctx.excludeLine && line === ctx.excludeLine) return;
        if (ctx.excludeCardName && cardObj.card.nombre === ctx.excludeCardName) return;
        if (ctx.coveredOnly && cardIdx === gameState.field[line][target].length - 1) return;
        if (ctx.filter && !cardMatchesFilter(cardObj, ctx)) return;
        // preventFlip: Hielo 4 no puede ser volteada por ningún efecto
        if (typeof getPersistentModifiers === 'function' && getPersistentModifiers(cardObj.card).preventFlip) {
            updateStatus(`${cardObj.card.nombre} no puede ser volteada`);
            return;
        }
        const wasFaceDown = cardObj.faceDown;
        cardObj.faceDown = !cardObj.faceDown;
        gameState.lastFlippedCard = { cardObj, line };
        if (wasFaceDown) triggerFlipFaceUp(cardObj, line, target);
        ctx.selected.push(cardObj);
    } else if (ctx.type === 'shift') {
        const cardObj = gameState.field[line][target][cardIdx];
        // Bloquear línea excluida (ej. Gravedad 4: fuente no puede ser la propia línea)
        if (ctx.excludeLine && line === ctx.excludeLine) return;
        // Oscuridad 0: solo cartas cubiertas (no la top)
        if (ctx.coveredOnly && cardIdx === gameState.field[line][target].length - 1) return;
        // Bloquear si el filtro no pasa (ej. solo bocabajo)
        if (ctx.filter && !cardMatchesFilter(cardObj, ctx)) return;
        ctx.selectedCard = { line, target, cardIdx };
        ctx.waitingForLine = true;
        clearEffectHighlights();
        // Si la carta viene de OTRA línea con gravityConstraint, destino forzado a effectLine
        if (ctx.gravityConstraint && ctx.effectLine && line !== ctx.effectLine) {
            handleShiftTargetLine(ctx.effectLine);
            return;
        }
        // Si viene de la línea actual (o no hay restricción), elegir línea destino
        updateStatus("Elige la línea de destino para cambiar la carta...");
        highlightSelectableLines();
        return; 
    } else if (ctx.type === 'return') {
        // Filter: si hay filtro faceDown con targetAll, validar que la carta clicada sea bocabajo
        const cardObj = gameState.field[line][target][cardIdx];
        if (ctx.filter === 'faceDown' && !cardObj.faceDown) return;
        gameState.field[line][target].splice(cardIdx, 1);
        const dest = ctx.beneficiary || target;
        if (typeof applyReturnToHand === 'function') applyReturnToHand(dest, cardObj.card);
        else gameState[dest].hand.push(cardObj.card);
        ctx.selected.push(cardObj);
        triggerUncovered(line, target);
    } else if (ctx.type === 'rearrange') {
        const getColumn = (l) => { const el = document.getElementById(`line-${l}`); return el ? el.parentElement : null; };
        const owner = (ctx.target === 'opponent' || ctx.target === 'ai') ? 'ai' : 'player';
        const protoSide = owner === 'ai' ? 'ai' : 'player';
        const addCheck = (l) => {
            const col = getColumn(l);
            if (col) col.classList.add('rearrange-selected');
            const protoBox = document.getElementById(`proto-${l}-${protoSide}`);
            if (protoBox && !protoBox.querySelector('.rearrange-check')) {
                const chk = document.createElement('span');
                chk.className = 'rearrange-check';
                chk.textContent = '✓';
                protoBox.appendChild(chk);
            }
        };
        const removeCheck = (l) => {
            const col = getColumn(l);
            if (col) col.classList.remove('rearrange-selected');
            const protoBox = document.getElementById(`proto-${l}-${protoSide}`);
            if (protoBox) { const chk = protoBox.querySelector('.rearrange-check'); if (chk) chk.remove(); }
        };
        if (!ctx.firstProtocol) {
            if (line === ctx._lastDeselected) { delete ctx._lastDeselected; return; }
            ctx.firstProtocol = line;
            const p = gameState[owner].protocols;
            const idx = LINES.indexOf(line);
            updateStatus(`Reorganizar: ${p[idx]} (${line}) seleccionado. Elige otra línea o deselecciona.`);
            addCheck(line);
        } else if (ctx.firstProtocol === line) {
            ctx.firstProtocol = null;
            ctx._lastDeselected = line;
            removeCheck(line);
            updateStatus('Selección cancelada. Elige una línea o pulsa Listo.');
        } else {
            const first = ctx.firstProtocol;
            const second = line;
            removeCheck(first);
            ctx.firstProtocol = null;
            if (ctx.swapCards) {
                const tmp = gameState.field[first][owner];
                gameState.field[first][owner] = gameState.field[second][owner];
                gameState.field[second][owner] = tmp;
            } else {
                swapProtocols(first, second, owner);
            }
            updateUI();
            setRearrangeActiveColumns(true);
            updateStatus('Protocolos intercambiados. Elige otra pareja o pulsa Listo.');
        }
        return;
    } else if (ctx.type === 'selectCardToCopy') {
        // Espejo 1: copiar efecto de carta rival elegida
        const cardObj = gameState.field[line][target][cardIdx];
        if (cardObj.faceDown) return;
        if (typeof CARD_EFFECTS === 'undefined' || !CARD_EFFECTS[cardObj.card.nombre]?.onPlay) return;
        const copyLine = line;
        gameState.effectContext = null;
        clearEffectHighlights();
        updateUI();
        const prevLine = gameState.currentEffectLine;
        gameState.currentEffectLine = copyLine;
        triggerCardEffect(cardObj.card, 'onPlay', 'player');
        gameState.currentEffectLine = prevLine;
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    }

    if (ctx.selected.length >= ctx.count) {
        finishEffect();
    } else {
        updateUI();
    }
}

/**
 * Aterriza la carta en commit queue (pendingLanding) tras resolver onCover.
 * Dispara onPlay si es bocarriba, luego continúa el turno.
 */
/**
 * Metal 6: si la carta recién cubierta tiene deleteOnModify, eliminarla del stack.
 * Llamar DESPUÉS de hacer push de la nueva carta al stack.
 */
function checkDeleteOnCover(line, owner) {
    const stack = gameState.field[line][owner];
    if (stack.length < 2) return;
    const coveredObj = stack[stack.length - 2]; // la que acaba de quedar tapada
    if (coveredObj.faceDown) return;
    if (typeof getPersistentModifiers !== 'function') return;
    const mods = getPersistentModifiers(coveredObj.card);
    if (mods.deleteOnModify) {
        stack.splice(stack.length - 2, 1);
        gameState[owner].trash.push(coveredObj.card);
        updateUI();
    }
}

function landPendingCard() {
    const { line, cardObj, owner, isFaceDown } = gameState.pendingLanding;
    gameState.pendingLanding = null;
    gameState.field[line][owner].push(cardObj);
    checkDeleteOnCover(line, owner);
    updateUI();
    if (!isFaceDown) {
        gameState.currentEffectLine = line;
        if (owner === 'player') {
            executeEffect(cardObj.card, 'player');
            if (gameState.effectContext || gameState.effectQueue.length > 0) {
                gameState.pendingTurnEnd = 'player';
                return;
            }
            endTurn('player');
        } else {
            executeEffect(cardObj.card, 'ai');
        }
    } else {
        if (owner === 'player') endTurn('player');
        // AI face-down: endTurn se llama desde playAITurn al volver
    }
}

function setRearrangeActiveColumns(active) {
    LINES.forEach(l => {
        const lineEl = document.getElementById(`line-${l}`);
        const col = lineEl ? lineEl.parentElement : null;
        if (col) {
            if (active) col.classList.add('rearrange-active');
            else col.classList.remove('rearrange-active', 'rearrange-selected');
        }
        if (!active) {
            // Limpiar checks de proto-boxes
            document.querySelectorAll(`#proto-${l}-player .rearrange-check, #proto-${l}-ai .rearrange-check`).forEach(c => c.remove());
        }
    });
}

function showRearrangeDoneButton() {
    setRearrangeActiveColumns(true);
    let btn = document.getElementById('btn-rearrange-done');
    if (!btn) {
        const statusEl = document.getElementById('game-status');
        if (!statusEl) return;
        btn = document.createElement('button');
        btn.id = 'btn-rearrange-done';
        btn.textContent = 'LISTO';
        btn.style.cssText = 'margin-left: 8px; padding: 4px 16px; background: var(--ui-cyan); color: #0a0e27; font-family: var(--ui-font); font-size: 10px; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; letter-spacing: 1px;';
        statusEl.parentElement.insertBefore(btn, statusEl.nextSibling);
    }
    btn.classList.remove('hidden');
    btn.onclick = () => {
        btn.classList.add('hidden');
        setRearrangeActiveColumns(false);
        finishEffect();
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
    };
}

function hideRearrangeDoneButton() {
    const btn = document.getElementById('btn-rearrange-done');
    if (btn) btn.classList.add('hidden');
    setRearrangeActiveColumns(false);
}

function finishEffect() {
    hideRearrangeDoneButton();
    gameState.effectContext = null;
    clearEffectHighlights();
    updateUI();

    // Si hay carta en commit queue esperando aterrizar, aterrizarla ahora
    if (gameState.pendingLanding && gameState.effectQueue.length === 0) {
        landPendingCard();
        return;
    }

    // If this was the end-of-turn discard, resume end turn flow
    if (gameState.pendingEndTurnFor) {
        const who = gameState.pendingEndTurnFor;
        gameState.pendingEndTurnFor = null;
        continueEndTurn(who);
        return;
    }

    // Route to ability engine if queue items are in new format
    if (gameState.effectQueue.length > 0 && gameState.effectQueue[0].effect !== undefined) {
        processAbilityEffect();
    } else if (gameState.effectQueue.length === 0 && gameState.pendingCheckCompile) {
        const who = gameState.pendingCheckCompile;
        gameState.pendingCheckCompile = null;
        setTimeout(() => checkCompilePhase(who), 600);
    } else if (gameState.effectQueue.length === 0 && gameState.pendingStartTurn) {
        const next = gameState.pendingStartTurn;
        gameState.pendingStartTurn = null;
        setTimeout(() => startTurn(next), 500);
    } else if (gameState.effectQueue.length === 0 && gameState.pendingTurnEnd) {
        const who = gameState.pendingTurnEnd;
        gameState.pendingTurnEnd = null;
        endTurn(who);
    } else {
        processNextEffect();
    }
}

// ─── AI Decision Helpers ──────────────────────────────────────────────────

/** Line from `owner`'s field with highest current calculateScore */
function aiHighestScoreLine(owner, excludeLines = []) {
    return LINES
        .filter(l => !excludeLines.includes(l) && gameState.field[l][owner].length > 0)
        .sort((a, b) => calculateScore(gameState, b, owner) - calculateScore(gameState, a, owner))[0] || null;
}

/** Line from `owner`'s field with lowest current calculateScore (or any occupied line) */
function aiLowestScoreLine(owner, excludeLines = []) {
    return LINES
        .filter(l => !excludeLines.includes(l) && gameState.field[l][owner].length > 0)
        .sort((a, b) => calculateScore(gameState, a, owner) - calculateScore(gameState, b, owner))[0] || null;
}

/**
 * Best destination line for moving an AI card (excludes given lines).
 * Prefers lines where AI is closest to compiling and ahead of opponent.
 */
function aiPickDestLine(excludeLines = [], forOwner = 'ai') {
    const opp = forOwner === 'ai' ? 'player' : 'ai';
    return LINES
        .filter(l => !excludeLines.includes(l) && !gameState.field[l].compiledBy)
        .sort((a, b) => {
            const diff = (calculateScore(gameState, a, forOwner) - calculateScore(gameState, a, opp))
                       - (calculateScore(gameState, b, forOwner) - calculateScore(gameState, b, opp));
            return -diff; // higher advantage first
        })[0] || null;
}

/** Index of the lowest-value card in `owner`'s hand (-1 if empty) */
function aiLowestValueCardIdx(owner) {
    const hand = gameState[owner].hand;
    if (!hand.length) return -1;
    return hand.reduce((minI, c, i) => c.valor < hand[minI].valor ? i : minI, 0);
}

/**
 * Best line to eliminate from `target`'s field.
 * For opponent: line with highest score (hurts them most).
 * Respects filter/maxVal/minVal opts like cardMatchesFilter.
 */
function aiPickEliminateLine(target, opts = {}) {
    const filterCtx = { filter: opts.filter, maxVal: opts.maxVal, minVal: opts.minVal };
    const lines = (opts.forceLine ? [opts.forceLine] : LINES)
        .filter(l => {
            const stack = gameState.field[l][target];
            if (!stack.length) return false;
            return cardMatchesFilter(stack[stack.length - 1], filterCtx);
        })
        .sort((a, b) => calculateScore(gameState, b, target) - calculateScore(gameState, a, target));
    return lines[0] || null;
}

/**
 * Best line to flip a card in.
 * target='player': flip opponent's highest-score line top (face-up→down reduces their score).
 * target='ai':     flip own face-down card in line closest to compile.
 */
function aiPickFlipLine(target) {
    if (target === 'player') {
        return LINES
            .filter(l => {
                const s = gameState.field[l].player;
                return s.length > 0 && !s[s.length - 1].faceDown;
            })
            .sort((a, b) => calculateScore(gameState, b, 'player') - calculateScore(gameState, a, 'player'))[0] || null;
    } else {
        return LINES
            .filter(l => gameState.field[l].ai.some(c => c.faceDown))
            .sort((a, b) => calculateScore(gameState, b, 'ai') - calculateScore(gameState, a, 'ai'))[0] || null;
    }
}

function resolveEffectAI(type, target, count, opts = {}) {
    const actualTarget = (target === 'any') ? (type === 'discard' ? 'ai' : 'player') : target;

    if (type === 'discard') {
        for (let i = 0; i < count; i++) {
            if (gameState[actualTarget].hand.length > 0) {
                // AI discards its lowest value card; player discards randomly (IA no conoce la mano del jugador)
                const idx = actualTarget === 'ai'
                    ? aiLowestValueCardIdx('ai')
                    : Math.floor(Math.random() * gameState.player.hand.length);
                const [card] = gameState[actualTarget].hand.splice(idx >= 0 ? idx : gameState[actualTarget].hand.length - 1, 1);
                gameState[actualTarget].trash.push(card);
            }
        }
    } else if (type === 'eliminate') {
        for (let i = 0; i < count; i++) {
            const line = aiPickEliminateLine(actualTarget, opts);
            if (line !== null) {
                const cardObj = gameState.field[line][actualTarget].pop();
                gameState[actualTarget].trash.push(cardObj.card);
                gameState.eliminatedSinceLastCheck[gameState.turn] = true;
                triggerUncovered(line, actualTarget);
            }
        }
    } else if (type === 'flip') {
        for (let i = 0; i < count; i++) {
            if (opts.filter === 'faceDown') {
                // Solo puede voltear cartas bocabajo (face-down → face-up).
                // Preferir propias (activa valor/efecto); solo si no hay, voltear las del rival.
                const ownLine = LINES
                    .filter(l => gameState.field[l].ai.some(c => c.faceDown))
                    .sort((a, b) => calculateScore(gameState, b, 'ai') - calculateScore(gameState, a, 'ai'))[0] || null;
                if (ownLine !== null) {
                    const stack = gameState.field[ownLine].ai;
                    const fdIdx = [...stack].reverse().findIndex(c => c.faceDown);
                    if (fdIdx >= 0) {
                        const flipped = stack[stack.length - 1 - fdIdx];
                        flipped.faceDown = false;
                        triggerFlipFaceUp(flipped, ownLine, 'ai');
                    }
                } else if (target === 'any') {
                    // Fallback: voltear carta bocabajo del jugador (si existe)
                    const pLine = LINES
                        .filter(l => gameState.field[l].player.some(c => c.faceDown))
                        .sort((a, b) => calculateScore(gameState, b, 'player') - calculateScore(gameState, a, 'player'))[0] || null;
                    if (pLine !== null) {
                        const stack = gameState.field[pLine].player;
                        const fdIdx = [...stack].reverse().findIndex(c => c.faceDown);
                        if (fdIdx >= 0) {
                            const flipped = stack[stack.length - 1 - fdIdx];
                            flipped.faceDown = false;
                            triggerFlipFaceUp(flipped, pLine, 'player');
                        }
                    }
                }
            } else {
                // Sin filtro: voltear carta bocarriba del rival a bocabajo (le perjudica)
                const line = aiPickFlipLine(actualTarget);
                if (line !== null) {
                    const stack = gameState.field[line][actualTarget];
                    if (actualTarget === 'player') {
                        const topCard = stack[stack.length - 1];
                        topCard.faceDown = !topCard.faceDown;
                        if (!topCard.faceDown) triggerFlipFaceUp(topCard, line, actualTarget);
                    } else {
                        const fdIdx = [...stack].reverse().findIndex(c => c.faceDown);
                        if (fdIdx >= 0) {
                            const flipped = stack[stack.length - 1 - fdIdx];
                            flipped.faceDown = false;
                            triggerFlipFaceUp(flipped, line, actualTarget);
                        }
                    }
                }
            }
        }
    } else if (type === 'shift') {
        for (let i = 0; i < count; i++) {
            // Move top card from weakest line to where it helps most
            const sourceLine = aiLowestScoreLine(actualTarget);
            if (!sourceLine) continue;
            const destLine = aiPickDestLine([sourceLine], actualTarget);
            if (!destLine) continue;
            const cardObj = gameState.field[sourceLine][actualTarget].pop();
            gameState.field[destLine][actualTarget].push(cardObj);
            triggerUncovered(sourceLine, actualTarget);
        }
    } else if (type === 'return') {
        for (let i = 0; i < count; i++) {
            const dest = opts.beneficiary || actualTarget;
            if (opts.filter === 'faceDown') {
                // Buscar cualquier carta bocabajo del target (cubierta o no)
                let best = null, bestLine = null, bestIdx = -1;
                LINES.forEach(l => {
                    gameState.field[l][actualTarget].forEach((c, idx) => {
                        if (c.faceDown && (!best || c.card.valor > best.card.valor)) {
                            best = c; bestLine = l; bestIdx = idx;
                        }
                    });
                });
                if (best) {
                    gameState.field[bestLine][actualTarget].splice(bestIdx, 1);
                    if (typeof applyReturnToHand === 'function') applyReturnToHand(dest, best.card);
                    else gameState[dest].hand.push(best.card);
                    triggerUncovered(bestLine, actualTarget);
                }
            } else {
                const line = aiHighestScoreLine(actualTarget);
                if (line !== null) {
                    const cardObj = gameState.field[line][actualTarget].pop();
                    if (typeof applyReturnToHand === 'function') applyReturnToHand(dest, cardObj.card);
                    else gameState[dest].hand.push(cardObj.card);
                    triggerUncovered(line, actualTarget);
                }
            }
        }
    }

    if (type === 'rearrange') {
        // Swap protocols to maximise face-up playability:
        // align the protocol of AI's highest-value hand card with its best line
        const owner = actualTarget;
        const protos = gameState[owner].protocols;
        const hand = gameState[owner].hand;
        if (protos.length >= 2 && hand.length > 0) {
            // Find hand card with highest valor and its protocol
            const bestCard = hand.reduce((best, c) => c.valor > best.valor ? c : best, hand[0]);
            const bestProtoIdx = protos.indexOf(bestCard.protocol);
            if (bestProtoIdx >= 0) {
                // Find the best line (highest current score advantage) to assign it to
                const bestLineIdx = LINES
                    .map((l, idx) => ({ idx, score: calculateScore(gameState, l, owner) - calculateScore(gameState, l, owner === 'ai' ? 'player' : 'ai') }))
                    .sort((a, b) => b.score - a.score)[0].idx;
                if (bestProtoIdx !== bestLineIdx) {
                    [protos[bestProtoIdx], protos[bestLineIdx]] = [protos[bestLineIdx], protos[bestProtoIdx]];
                    swapCompiledState(LINES[bestProtoIdx], LINES[bestLineIdx], owner);
                    updateStatus('IA reorganizó sus Protocolos estratégicamente');
                    updateUI();
                }
            }
        }
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    }

    const typeLabels = { discard: 'descartó', eliminate: 'eliminó', flip: 'volteó', shift: 'cambió', return: 'devolvió a mano' };
    const whoLabel = actualTarget === 'player' ? 'tu carta' : 'su carta';
    updateStatus(`IA ${typeLabels[type] || type} ${whoLabel}`);
    if (typeof processAbilityEffect === 'function') processAbilityEffect();
}

function draw(target, count) {
    let drawn = 0;
    for (let i = 0; i < count; i++) {
        if (drawCard(target)) drawn++;
    }
    if (drawn > 0) {
        gameState.drawnSinceLastCheck[target] = true;
        updateStatus(`${target === 'player' ? 'Robas' : 'IA roba'} ${drawn} carta${drawn !== 1 ? 's' : ''}`);
        if (typeof onOpponentDrawEffects === 'function') onOpponentDrawEffects(target);
    } else if (count > 0) {
        updateStatus(`${target === 'player' ? 'No puedes robar' : 'IA no puede robar'} — mazo y descarte vacíos`);
    }
    return drawn;
}

function discard(target, count) {
    let discarded = 0;
    for (let i = 0; i < count; i++) {
        if (gameState[target].hand.length > 0) {
            const idx = target === 'ai' ? aiLowestValueCardIdx('ai') : Math.floor(Math.random() * gameState[target].hand.length);
            const card = gameState[target].hand.splice(idx, 1)[0];
            gameState[target].trash.push(card);
            gameState.discardedSinceLastCheck[target] = true;
            discarded++;
        }
    }
    if (discarded > 0) {
        updateStatus(`${target === 'player' ? 'Descartas' : 'IA descarta'} ${discarded} carta${discarded !== 1 ? 's' : ''}`);
        updateUI();
        if (typeof onOpponentDiscardEffects === 'function') onOpponentDiscardEffects(target);
        // onOwnDiscard: Corrupción 2 reactiva cuando el dueño descarta
        if (typeof onOwnDiscardEffects === 'function') onOwnDiscardEffects(target);
        // onForcedDiscard solo aplica cuando es el turno del oponente (descarte forzado por efecto)
        if (typeof onForcedDiscardEffects === 'function' && gameState.turn && gameState.turn !== target) {
            onForcedDiscardEffects(target);
        }
    }
}

function triggerUncovered(line, owner) {
    const stack = gameState.field[line][owner];
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    if (!top.faceDown && typeof triggerCardEffect === 'function') {
        const cardId = top.card.id;
        if (gameState.uncoveredThisTurn.has(cardId)) return;
        gameState.uncoveredThisTurn.add(cardId);
        gameState.currentEffectLine = line;
        triggerCardEffect(top.card, 'onPlay', owner);
    }
}

/**
 * Dispara onPlay si una carta acaba de voltearse bocarriba y es la top de su pila.
 * Regla CODEX: "Cuando un texto activo entra en juego (al jugarse, voltearse boca arriba o descubrirse)"
 */
function triggerFlipFaceUp(cardObj, line, owner) {
    if (cardObj.faceDown) return; // solo si quedó bocarriba
    const stack = gameState.field[line][owner];
    if (stack.length === 0) return;
    if (stack[stack.length - 1] !== cardObj) return; // solo top (descubierta)
    if (typeof triggerCardEffect !== 'function') return;
    const cardId = cardObj.card.id;
    if (gameState.uncoveredThisTurn.has(cardId)) return;
    gameState.uncoveredThisTurn.add(cardId);
    gameState.currentEffectLine = line;
    triggerCardEffect(cardObj.card, 'onPlay', owner);
}

function flipCardInField(cardId) {
    LINES.forEach(line => {
        ['player', 'ai'].forEach(p => {
            gameState.field[line][p].forEach(cardObj => {
                if (cardObj.card.id === cardId) {
                    const wasFaceDown = cardObj.faceDown;
                    cardObj.faceDown = !cardObj.faceDown;
                    if (wasFaceDown) triggerFlipFaceUp(cardObj, line, p);
                }
            });
        });
    });
}

function playSelectedCard(isFaceDown) {
    const card = gameState.player.hand[gameState.selectedCardIndex];
    ui.actionModal.classList.add('hidden');
    
    console.log(`🎮 playSelectedCard: ${card.nombre} - Face${isFaceDown ? 'Down' : 'Up'}`);
    
    if (isFaceDown) {
        // Enter selection mode for any non-compiled line
        gameState.selectionMode = true;
        showCancelButton();
        updateStatus("Elige línea para colocar la carta bocabajo...");
        console.log('📍 Selection mode ON - choose line for face-down play');
        highlightSelectableLines();
        return;
    }

    // Face-up play: protocol must match the line (compiled lines allowed)
    // Espíritu 1: si allowAnyProtocol está activo, el jugador elige línea libremente
    // Unidad 1: cartas Unidad pueden jugarse bocarriba en la línea de Unidad 1
    const idx = gameState.player.protocols.indexOf(card.protocol);
    const cardPlaysAnywhere = typeof canPlayAnywhere === 'function' && canPlayAnywhere(card);
    if (typeof hasAllowAnyProtocol === 'function' && hasAllowAnyProtocol('player')) {
        console.log(`✅ Playing face-up (any protocol allowed): ${card.nombre}`);
        gameState.selectionMode = true;
        gameState.selectionModeFaceUp = true;
        showCancelButton();
        updateStatus("Espíritu 1: elige línea para colocar la carta bocarriba...");
        highlightSelectableLines();
    } else if (cardPlaysAnywhere) {
        const cardOnAnySide = typeof canPlayOnAnySide === 'function' && canPlayOnAnySide(card);
        if (cardOnAnySide) {
            // Corrupción 0: preguntar lado antes de elegir línea
            console.log(`✅ Playing face-up (playOnAnySide): ${card.nombre}`);
            const confirmArea = document.getElementById('command-confirm');
            const confirmMsg = document.getElementById('confirm-msg');
            const btnYes = document.getElementById('btn-confirm-yes');
            const btnNo = document.getElementById('btn-confirm-no');
            if (confirmArea && btnYes && btnNo) {
                confirmArea.classList.remove('hidden');
                confirmMsg.textContent = `${card.nombre}: ¿Jugar en tu lado (SÍ) o en el lado rival (NO)?`;
                btnYes.onclick = () => {
                    confirmArea.classList.add('hidden');
                    gameState.selectionMode = true;
                    gameState.selectionModeFaceUp = true;
                    gameState.playOnSide = 'player';
                    showCancelButton();
                    updateStatus(`${card.nombre}: elige línea en tu lado...`);
                    highlightSelectableLines();
                };
                btnNo.onclick = () => {
                    confirmArea.classList.add('hidden');
                    gameState.selectionMode = true;
                    gameState.selectionModeFaceUp = true;
                    gameState.playOnSide = 'opponent';
                    showCancelButton();
                    updateStatus(`${card.nombre}: elige línea en el lado rival...`);
                    highlightSelectableLines();
                };
            }
        } else {
            // Caos 3: esta carta puede jugarse en cualquier línea (lado propio)
            console.log(`✅ Playing face-up (playAnywhere): ${card.nombre}`);
            gameState.selectionMode = true;
            gameState.selectionModeFaceUp = true;
            showCancelButton();
            updateStatus(`${card.nombre}: elige línea para colocar la carta bocarriba...`);
            highlightSelectableLines();
        }
    } else if (idx !== -1) {
        console.log(`✅ Playing face-up: ${card.nombre} on line ${LINES[idx]}`);
        finalizePlay(LINES[idx], false);
    } else {
        // Unidad 1: si la carta es Unidad y hay línea con allowUnityPlayInLine, jugar ahí
        const unityLine = typeof getUnityPlayLine === 'function' ? getUnityPlayLine('player') : null;
        if (unityLine && card.nombre.startsWith('Unidad')) {
            console.log(`✅ Playing face-up (Unidad 1 rule): ${card.nombre} on ${unityLine}`);
            finalizePlay(unityLine, false);
        } else {
            console.error("❌ Illegal face-up play: protocol has no matching line", {
                protocol: card.protocol,
            });
        }
    }
}

function showCancelButton() {
    const btn = document.getElementById('btn-cancel-selection');
    if (btn) btn.classList.remove('hidden');
}

function highlightSelectableLines(excludeLine, allowedLines) {
    const lines = allowedLines || LINES;
    lines.forEach(line => {
        if (excludeLine && line === excludeLine) return;
        const lineEl = document.getElementById(`line-${line}`);
        // line-* tiene display:contents, aplicar al padre (grid row visible)
        const target = lineEl ? lineEl.parentElement : null;
        if (target) target.classList.add('selectable-line');
    });
}

function clearSelectionHighlights() {
    document.querySelectorAll('.selectable-line').forEach(el => el.classList.remove('selectable-line'));
}

function finalizePlay(targetLine, isFaceDown) {
    // Corrupción 0: playOnSide indica en qué lado se juega la carta
    const targetSide = gameState.playOnSide === 'opponent' ? 'ai' : 'player';
    gameState.playOnSide = null; // consumir

    console.log(`🎲 finalizePlay: line=${targetLine}, faceDown=${isFaceDown}, side=${targetSide}`);

    // Psique 1: jugador forzado a jugar bocabajo
    if (!isFaceDown && typeof hasForceOpponentFaceDown === 'function' && hasForceOpponentFaceDown('player')) {
        updateStatus('Psique 1 activa — solo puedes jugar bocabajo');
        return;
    }

    // Comprobar si Plaga 0 (o Metal 2 bocabajo) del rival bloquea esta línea
    if (typeof isPlayBlockedByPersistent === 'function' && isPlayBlockedByPersistent(targetLine, 'player', isFaceDown)) {
        const reason = isFaceDown ? 'La IA tiene Metal 2 en esa línea — no puedes jugar bocabajo ahí' : 'La IA tiene Plaga 0 en esa línea — no puedes jugar ahí';
        updateStatus(reason);
        return;
    }

    // Compiled lines can still be played on (re-compile rules)

    gameState.selectionMode = false;
    clearSelectionHighlights();

    const card = gameState.player.hand[gameState.selectedCardIndex];
    // Guard: selectedCardIndex null (double-fire del handler de línea) o estado inválido
    if (!card) return;
    const playedCard = { card: card, faceDown: isFaceDown };

    // Detectar carta que quedará cubierta (commit queue: onCover debe resolver antes de aterrizar)
    const targetStack = gameState.field[targetLine][targetSide];
    const topCardBeforePush = (targetStack.length > 0 && !targetStack[targetStack.length - 1].faceDown)
        ? targetStack[targetStack.length - 1] : null;
    const topHasOnCover = topCardBeforePush &&
        typeof CARD_EFFECTS !== 'undefined' &&
        CARD_EFFECTS[topCardBeforePush.card.nombre]?.onCover;

    // Quitar de mano antes de disparar cualquier efecto
    gameState.player.hand.splice(gameState.selectedCardIndex, 1);
    gameState.selectedCardIndex = null;
    updateUI();

    if (topHasOnCover) {
        // Commit queue: carta entra en cola, aterriza solo tras resolver onCover
        gameState.pendingLanding = { line: targetLine, cardObj: playedCard, owner: targetSide, isFaceDown };
        gameState.currentEffectLine = targetLine;
        gameState.coveringCard = card; // carta que va a cubrir
        triggerCardEffect(topCardBeforePush.card, 'onCover', targetSide);
        // Si onCover fue no-interactivo y ya se resolvió, finishEffect lo aterrizará
        // Si hay efectos pendientes, pendingLanding espera en finishEffect
        if (gameState.effectContext || gameState.effectQueue.length > 0) {
            gameState.pendingTurnEnd = null; // landPendingCard gestiona el fin de turno
        }
        return;
    }

    // Sin onCover: aterriza inmediatamente (flujo original)
    if (topCardBeforePush) {
        gameState.currentEffectLine = targetLine;
        gameState.coveringCard = card; // carta que va a cubrir
        triggerCardEffect(topCardBeforePush.card, 'onCover', targetSide);
        gameState.coveringCard = null;
    }
    gameState.field[targetLine][targetSide].push(playedCard);
    checkDeleteOnCover(targetLine, targetSide);
    updateUI(); // Sincronizar DOM antes de disparar efectos (necesario para efectos interactivos como Agua 4)

    console.log(`✅ Card played: ${card.nombre} on ${targetLine} (${isFaceDown ? 'face-down' : 'face-up'})`);

    if (!isFaceDown) {
        console.log(`🔧 Executing card effect...`);
        gameState.currentEffectLine = targetLine;
        executeEffect(card, 'player');
        console.log(`🔍 tras executeEffect: effectContext=${gameState.effectContext ? gameState.effectContext.type : 'null'}, queueLen=${gameState.effectQueue.length}`);
    } else {
        // Face-down play has no immediate effects, just update UI
        console.log(`💤 Face-down play - no effects, updating UI`);
        updateUI();
    }

    // Efectos reactivos: cartas del rival en esta línea (ej: Ice 1)
    if (typeof onOpponentPlayInLineEffects === 'function') onOpponentPlayInLineEffects('player', targetLine);
    
    if (gameState.pendingPlayCard) {
        gameState.pendingPlayCard = false;
        console.log(`🎴 playCard effect resolved — continuing effect queue`);
        updateUI();
        if (gameState.effectQueue.length > 0) {
            processAbilityEffect();
        }
        return;
    }

    // Si hay efectos interactivos pendientes, esperar a que se resuelvan
    if (gameState.effectContext || gameState.effectQueue.length > 0) {
        gameState.pendingTurnEnd = 'player';
        console.log(`⏳ Efectos pendientes — turno del jugador pausado`);
        return;
    }

    console.log(`⏱️ Ending player turn...`);
    endTurn('player');
}

const btnCancelSelection = document.getElementById('btn-cancel-selection');
if (btnCancelSelection) btnCancelSelection.onclick = () => {
    if (gameState.selectionMode) {
        // Jugada bocabajo/bocarriba en espera de línea — la carta sigue en mano
        gameState.selectionMode = false;
        gameState.selectionModeFaceUp = false;
        gameState.selectedCardIndex = null;
        gameState.playOnSide = null;
        clearSelectionHighlights();
        clearEffectHighlights();
        updateStatus('Jugada cancelada');
        updateUI();
    }
};

const btnStopDiscard = document.getElementById('btn-stop-discard');
if (btnStopDiscard) btnStopDiscard.onclick = () => {
    const ctx = gameState.effectContext;
    if (ctx && ctx.type === 'discardAny') {
        finishEffect();
    } else {
        finalizeDiscardVariable();
    }
};

ui.btnRefresh.onclick = () => {
    console.log('🔘 btnRefresh clicked - checking conditions...');
    if (gameState.turn !== 'player' || gameState.phase !== 'action') {
        console.warn('❌ Cannot refresh - not player action phase');
        return;
    }
    if (gameState.player.hand.length >= 5) {
        console.warn('❌ Cannot refresh - hand too full');
        alert("No puedes recargar si tienes 5 o más cartas.");
        return;
    }
    console.log('✅ Refreshing hand...');
    while(gameState.player.hand.length < 5) {
        if(!drawCard('player')) break;
    }
    gameState.refreshedThisTurn = 'player';
    console.log('🔄 Hand refreshed, ending turn');
    endTurn('player');
}

function playAITurn() {
    // FASE 2: IA INTELIGENTE - Minimax + Evaluación Estratégica
    const diffDepth = parseInt(sessionStorage.getItem('aiDifficultyDepth') || '3');
    const diffName  = sessionStorage.getItem('aiDifficultyName') || 'NÚCLEO';

    console.log(`🤖 IA Turno iniciado (Dificultad: ${diffName}, Profundidad: ${diffDepth})`);

    if (gameState.ai.hand.length === 0) {
        while(gameState.ai.hand.length < 5) drawCard('ai');
        console.log('🤖 IA: Recarga (mano vacía)');
        updateStatus("IA recarga su mazo");
        endTurn('ai');
        return;
    }

    try {
        // Inicializar motores de IA (primera vez o si cambia profundidad)
        if (!window.aiEvaluator) {
            window.aiEvaluator = new AIEvaluator(gameState);
            // Aplicar perfil de comportamiento para este nivel (una vez por partida)
            if (typeof getRandomProfileForLevel === 'function') {
                const profile = getRandomProfileForLevel(diffDepth);
                if (profile) {
                    applyAIProfile(window.aiEvaluator, profile);
                    console.log(`✅ Perfil IA aplicado: ${profile.name}`);
                }
            }
            console.log('✅ Motor de Evaluación inicializado');
        }
        window.aiEvaluator.diffDepth = diffDepth;
        
        // Re-inicializar minimax si la profundidad actual es diferente a la deseada.
        // Nivel 5 usa depth 6 para mayor anticipación.
        const actualDepth = diffDepth === 5 ? 6 : diffDepth;
        if (!window.miniMax || window.miniMax.maxDepth !== actualDepth) {
            window.miniMax = new MiniMax(window.aiEvaluator, actualDepth);
            console.log(`✅ Minimax inicializado (depth=${actualDepth}, lore=${diffName})`);
        }

        // Generar todos los movimientos posibles
        const possibleMoves = generateAIPossibleMoves();
        console.log('Movimientos posibles generados:', possibleMoves);

        if (possibleMoves.length === 0) {
            // Sin movimientos disponibles, recargar
            while(gameState.ai.hand.length < 5) drawCard('ai');
            updateStatus("IA recarga su mazo (sin jugadas posibles)");
            endTurn('ai');
            return;
        }

        // Filtrar el descarte del jugador según la memoria de cada nivel.
        // Un jugador novato no recuerda lo que el rival descartó hace varios turnos.
        // Nivel 1: ninguna carta recordada. Nivel 2: solo la última. Nivel 3: últimas 3.
        // Nivel 4-5: descarte completo visible.
        const MEMORY_LIMITS = { 1: 0, 2: 1, 3: 3, 4: Infinity, 5: Infinity };
        const memoryLimit = MEMORY_LIMITS[diffDepth] ?? Infinity;
        const visiblePlayerTrash = memoryLimit === Infinity
            ? gameState.player.trash
            : gameState.player.trash.slice(-memoryLimit);
        const stateForAI = {
            ...gameState,
            player: { ...gameState.player, trash: visiblePlayerTrash }
        };

        // Usar minimax para encontrar el mejor movimiento
        const bestMoveResult = window.miniMax.findBestMove(stateForAI, possibleMoves);
        console.log('Resultado de Minimax:', bestMoveResult);

        if (!bestMoveResult || !bestMoveResult.bestMove) {
            throw new Error('Minimax no encontró movimiento válido');
        }

        // Epsilon-greedy: niveles 1-2 cometen errores reales ignorando minimax
        const EPSILON = { 1: 0.5, 2: 0.2 };
        const epsilon = EPSILON[diffDepth] ?? 0;
        const playRandom = epsilon > 0 && Math.random() < epsilon;

        let move;
        if (playRandom) {
            move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            console.log(`🎲 IA nivel ${diffDepth}: jugada aleatoria (epsilon=${epsilon})`);
        } else {
            move = bestMoveResult.bestMove;
        }

        // Log de decisión de IA
        console.log('🤖 IA Decision:', {
            line: move.line,
            cardName: move.card.nombre,
            faceUp: move.faceUp,
            score: playRandom ? 'random' : Math.round(bestMoveResult.score),
            stats: playRandom ? null : bestMoveResult.statistics,
        });

        // Ejecutar el movimiento elegido y terminar turno
        executeAIMove(move);
        console.log('Estado final del juego tras movimiento de IA:', JSON.stringify(gameState));
        endTurn('ai');

    } catch (error) {
        // Fallback: Si IA falla, juega aleatorio (playAITurnRandom llama endTurn)
        console.error('❌ IA Error:', error.message);
        playAITurnRandom();
    }
}

function playAITurnRandom() {
    console.log('🤖 IA usando fallback aleatorio');
    console.log('Estado inicial del juego (fallback):', JSON.stringify(gameState));

    const cardIdx = Math.floor(Math.random() * gameState.ai.hand.length);
    const card = gameState.ai.hand[cardIdx];
    const lineIndex = gameState.ai.protocols.indexOf(card.protocol);
    let targetLine = lineIndex !== -1 ? LINES[lineIndex] : null;

    let isFaceDown = true;
    const aiForced = typeof hasForceOpponentFaceDown === 'function' && hasForceOpponentFaceDown('ai');

    if (!aiForced && targetLine && !(typeof isPlayBlockedByPersistent === 'function' && isPlayBlockedByPersistent(targetLine, 'ai'))) {
        isFaceDown = false;
    } else {
        // Buscar línea libre para bocabajo (ni Plaga 0 ni Metal 2 del jugador)
        const freeLine = LINES.find(l =>
            !(typeof isPlayBlockedByPersistent === 'function' && isPlayBlockedByPersistent(l, 'ai', true))
        );
        targetLine = freeLine || LINES[0];
        isFaceDown = true;
    }

    if (targetLine) {
        const movedCard = gameState.ai.hand.splice(cardIdx, 1)[0];
        gameState.field[targetLine].ai.push({ card: movedCard, faceDown: isFaceDown });
        checkDeleteOnCover(targetLine, 'ai');
        updateStatus(`IA jugó 1 carta ${isFaceDown ? 'bocabajo' : movedCard.nombre + ' bocarriba'} en ${targetLine}`);
        console.log('Estado final del juego tras fallback aleatorio:', JSON.stringify(gameState));
    } else {
        console.error('❌ Fallback aleatorio falló: No hay líneas disponibles');
    }
    endTurn('ai');
}

/**
 * 🎯 Generar todos los movimientos posibles de IA
 */
function generateAIPossibleMoves() {
    const moves = [];
    
    gameState.ai.hand.forEach((card, cardIndex) => {
        LINES.forEach(line => {
            // Saltar líneas bloqueadas por Plaga 0 del jugador
            if (typeof isPlayBlockedByPersistent === 'function' && isPlayBlockedByPersistent(line, 'ai')) return;

            {
                // Movimiento bocarriba (si coincide protocolo, compiled lines allowed)
                // Unidad 1: cartas Unidad pueden jugarse bocarriba en la línea de Unidad 1
                // Caos 3 (playAnywhere): puede jugarse bocarriba en cualquier línea
                const lineIndex = gameState.ai.protocols.indexOf(card.protocol);
                const lineMatchesProtocol = lineIndex !== -1 && LINES[lineIndex] === line;
                const aiUnityLine = typeof getUnityPlayLine === 'function' ? getUnityPlayLine('ai') : null;
                const unityMatch = aiUnityLine === line && card.nombre.startsWith('Unidad');
                const cardPlaysAnywhere = typeof canPlayAnywhere === 'function' && canPlayAnywhere(card);

                const aiForcedDown = typeof hasForceOpponentFaceDown === 'function' && hasForceOpponentFaceDown('ai');
                if ((lineMatchesProtocol || unityMatch || cardPlaysAnywhere) && !aiForcedDown) {
                    moves.push({
                        cardIndex,
                        line,
                        faceUp: true,
                        card,
                        type: 'face-up',
                    });
                }

                // Corrupción 0: puede jugarse bocarriba en el lado del rival
                const cardOnAnySide = typeof canPlayOnAnySide === 'function' && canPlayOnAnySide(card);
                if (cardOnAnySide && !aiForcedDown) {
                    moves.push({
                        cardIndex,
                        line,
                        faceUp: true,
                        card,
                        type: 'face-up-opponent-side',
                        targetSide: 'player',
                    });
                }

                // Movimiento bocabajo (si Metal 2 del jugador no lo bloquea)
                if (!(typeof isPlayBlockedByPersistent === 'function' && isPlayBlockedByPersistent(line, 'ai', true))) {
                  moves.push({
                    cardIndex,
                    line,
                    faceUp: false,
                    card,
                    type: 'face-down',
                  });
                }
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
        gameState.refreshedThisTurn = 'ai';
        updateStatus('IA recarga su mazo');
        return; // endTurn se llama en el caller (playAITurn)
    }

    const movedCard = gameState.ai.hand.splice(move.cardIndex, 1)[0];

    // Corrupción 0: la IA puede jugar en el lado del rival
    const landSide = move.targetSide || 'ai';

    // Disparar onCover en la carta que quedará cubierta (si existe)
    const targetStack = gameState.field[move.line][landSide];
    if (targetStack.length > 0) {
        const topCard = targetStack[targetStack.length - 1];
        if (!topCard.faceDown) {
            gameState.currentEffectLine = move.line;
            gameState.coveringCard = movedCard; // carta que va a cubrir
            triggerCardEffect(topCard.card, 'onCover', landSide);
            gameState.coveringCard = null;
        }
    }

    gameState.field[move.line][landSide].push({
        card: movedCard,
        faceDown: !move.faceUp
    });
    checkDeleteOnCover(move.line, landSide);
    updateUI();

    const sideText = landSide !== 'ai' ? ' (lado rival)' : '';
    const faceText = move.faceUp ? 'bocarriba' : 'bocabajo';
    const cardNameText = move.faceUp ? movedCard.nombre : '1 carta';
    updateStatus(`IA jugó ${cardNameText} ${faceText} en ${move.line}${sideText}`);
    
    // Ejecutar efectos si es bocarriba
    if (move.faceUp) {
        gameState.currentEffectLine = move.line;
        executeEffect(movedCard, 'ai');
    }

    // Efectos reactivos: cartas del rival en esta línea (ej: Ice 1)
    if (typeof onOpponentPlayInLineEffects === 'function') onOpponentPlayInLineEffects('ai', move.line);
}

function endTurn(who) {
    console.log(`⏸️ Ending turn for ${who}`);
    gameState.phase = 'check_cache';

    if (gameState[who].skipNextCacheCheck) {
        console.log(`⏭️ ${who} salta Fase de Comprobar Caché (Espíritu 0)`);
        gameState[who].skipNextCacheCheck = false;
        continueEndTurn(who);
        return;
    }

    const excess = gameState[who].hand.length - 5;
    if (excess > 0) {
        if (who === 'player') {
            // Interactive: player chooses which cards to discard
            gameState.pendingEndTurnFor = who;
            updateStatus(`Borrar caché — descarta ${excess} carta${excess !== 1 ? 's' : ''}`);
            startEffect('discard', 'player', excess);
            return;
        } else {
            // AI discards randomly
            while(gameState.ai.hand.length > 5) {
                gameState.ai.trash.push(gameState.ai.hand.pop());
                gameState.discardedSinceLastCheck.ai = true;
            }
        }
    }

    continueEndTurn(who);
}

function continueEndTurn(who) {
    updateUI();
    gameState.phase = 'end';
    if (typeof onTurnEndEffects === 'function') {
        onTurnEndEffects(who);
    }

    // Velocidad 1: si este jugador usó Refresh este turno, roba 1 carta extra DESPUÉS del cache check
    if (gameState.refreshedThisTurn === who) {
        gameState.refreshedThisTurn = null;
        if (typeof onRefreshEffects === 'function') onRefreshEffects(who);
        if (typeof onOpponentRefreshEffects === 'function') onOpponentRefreshEffects(who);
    }

    // Si onTurnEnd/onRefresh dejó efectos interactivos pendientes, esperar a que se resuelvan
    if (gameState.effectContext || gameState.effectQueue.length > 0) {
        gameState.pendingStartTurn = (who === 'player' ? 'ai' : 'player');
        console.log(`⏳ onTurnEnd pendiente — inicio de turno pausado`);
        return;
    }

    console.log(`⏱️ Starting next turn...`);
    setTimeout(() => startTurn(who === 'player' ? 'ai' : 'player'), 1000);
}

function updateStatus(msg) {
    const log = document.getElementById('game-log');
    if (!log) return;

    // Detectar tipo de mensaje para icono y color
    let icon = '•';
    let color = '#FFD93D'; // Default player yellow
    let bgColor = 'transparent';
    const isAI = gameState.turn === 'ai';

    if (msg.includes('--- Turno')) {
        icon = '➔';
        color = isAI ? '#722E9A' : '#FFD93D';
        bgColor = isAI ? 'rgba(114, 46, 154, 0.1)' : 'rgba(255, 217, 61, 0.1)';
    } else if (msg.includes('¡Has compilado') || msg.includes('¡IA ha compilado')) {
        icon = '⚡';
        color = '#FFE150';
        bgColor = 'rgba(255, 225, 80, 0.15)';
    } else if (msg.includes('Robas') || msg.includes('IA roba')) {
        icon = '🎴';
    } else if (msg.includes('eliminó') || msg.includes('Eliminar')) {
        icon = '💀';
        color = '#ef4444';
    } else if (msg.includes('volteó') || msg.includes('Voltea')) {
        icon = '🔄';
    } else if (msg.includes('Descartas') || msg.includes('IA descarta')) {
        icon = '🗑️';
    } else if (msg.includes('Agua 4')) {
        icon = '💧';
    } else if (msg.includes('Plaga')) {
        icon = '☣️';
    } else if (isAI) {
        color = '#9b59b6'; // AI soft purple
    }

    const entry = document.createElement('div');
    entry.style.cssText = `
        color: ${color}; 
        background: ${bgColor};
        font-size: 0.85em; 
        line-height: 1.4; 
        padding: 4px 8px; 
        border-left: 3px solid ${color}; 
        margin-bottom: 2px;
        border-radius: 0 4px 4px 0;
        display: flex;
        gap: 8px;
        align-items: flex-start;
        animation: fadeInLog 0.3s ease-out;
    `;

    entry.innerHTML = `<span style="opacity:0.7; flex-shrink:0;">${icon}</span> <span style="flex:1;">${msg}</span>`;
    
    // Quitar clase 'latest' del anterior
    const prev = log.querySelector('.log-latest');
    if (prev) prev.classList.remove('log-latest');
    entry.classList.add('log-latest');

    log.appendChild(entry);
    
    // Auto-scroll al final
    log.scrollTo({
        top: log.scrollHeight,
        behavior: 'smooth'
    });
}

function checkWinCondition() {
    if (gameState.player.compiled.length >= 3) {
        showGameOver(true);
    } else if (gameState.ai.compiled.length >= 3) {
        showGameOver(false);
    }
}

function showGameOver(playerWon) {
    const modal = document.getElementById('game-over-modal');
    const titleEl = document.getElementById('game-over-title');
    const reasonEl = document.getElementById('win-reason');
    const statsEl = document.getElementById('win-stats');

    if (titleEl) titleEl.textContent = playerWon ? '¡VICTORIA!' : 'DERROTA';
    if (titleEl) titleEl.style.color = playerWon ? '#00ff41' : '#ef4444';

    if (reasonEl) reasonEl.textContent = playerWon
        ? 'Compilaste los 3 protocolos. ¡Bien jugado!'
        : 'La IA compiló sus 3 protocolos primero.';

    if (statsEl) {
        const pLines = gameState.player.compiled.join(', ') || '—';
        const aLines = gameState.ai.compiled.join(', ') || '—';
        statsEl.innerHTML = `
            <div>Tus compilados: <strong style="color:#00d4ff">${pLines}</strong></div>
            <div>Compilados IA: <strong style="color:#ef4444">${aLines}</strong></div>
        `;
    }

    if (modal) modal.classList.remove('hidden');
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
    // P1 pick[i] faces AI pick[i]: mismo índice = misma columna física (P2 construye de su derecha a izquierda)
    const aiOrdered = [...draftState.aiPicks];
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
        gameState.ai.protocols = [...draftState.aiPicks];
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

function swapProtocols(lineA, lineB, owner = 'player') {
    const p = gameState[owner].protocols;
    const idxA = LINES.indexOf(lineA);
    const idxB = LINES.indexOf(lineB);
    [p[idxA], p[idxB]] = [p[idxB], p[idxA]];
    swapCompiledState(lineA, lineB, owner);
    initProtocolDisplay();
}

// Mueve el estado de compilado del owner junto con sus protocolos reordenados.
// Solo toca las líneas compiladas por el owner — las del rival no se ven afectadas.
function swapCompiledState(lineA, lineB, owner) {
    const ownerCompiledA = gameState.field[lineA].compiledBy === owner;
    const ownerCompiledB = gameState.field[lineB].compiledBy === owner;

    if (ownerCompiledA && !ownerCompiledB) {
        gameState.field[lineA].compiledBy = null;
        gameState.field[lineB].compiledBy = owner;
    } else if (!ownerCompiledA && ownerCompiledB) {
        gameState.field[lineB].compiledBy = null;
        gameState.field[lineA].compiledBy = owner;
    }
    // Si el owner compiló ambas o ninguna, field.compiledBy no cambia

    // Actualizar array compiled del owner para reflejar los nuevos nombres de línea
    const arr = gameState[owner].compiled;
    const hasA = arr.includes(lineA);
    const hasB = arr.includes(lineB);
    if (hasA && !hasB) arr[arr.indexOf(lineA)] = lineB;
    else if (hasB && !hasA) arr[arr.indexOf(lineB)] = lineA;
}

// ========================== START ==========================
// Detectar si estamos en draft.html o game.html
const isDraft = document.getElementById('draft-screen') !== null;
const isGame = document.getElementById('game-container') !== null;

// Cargar datos directamente desde cards-data.js (variable CARDS_DATA)
if (typeof CARDS_DATA !== 'undefined') {
    PROTOCOL_DEFS = CARDS_DATA._protocolMeta || {};
    const { _protocolMeta, ...cards } = CARDS_DATA;
    GLOBAL_CARDS = cards;
    console.log('🎮 GLOBAL_CARDS cargados directamente:', Object.keys(GLOBAL_CARDS).length, 'protocolos');
    
    if (isDraft) {
        initDraft();
    } else if (isGame) {
        try {
            startGameFromDraft();
        } catch (error) {
            console.error('❌ Error initializing game:', error);
            console.error('Stack:', error.stack);
        }
    }
} else {
    console.error('❌ Error: CARDS_DATA no está definido. Asegúrate de cargar cards-data.js antes de logic.js');
}
