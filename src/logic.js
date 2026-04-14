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
        compiled: [],
        discardedSinceLastCheck: false,
        drawnSinceLastCheck: false,
        drawnLastTurn: false,
        eliminatedSinceLastCheck: false,
        eliminatedLastTurn: false,
    },
    ai: {
        deck: [], trash: [], hand: [],
        protocols: JSON.parse(sessionStorage.getItem('aiProtocols') || '["Vida", "Luz", "Oscuridad"]'),
        compiled: [],
        discardedSinceLastCheck: false,
        drawnSinceLastCheck: false,
        drawnLastTurn: false,
        eliminatedSinceLastCheck: false,
        eliminatedLastTurn: false,
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
    uncoveredThisTurn: new Set(),                           // IDs de cartas ya activadas por onUncovered este turno
    pendingLanding: null,                                   // carta en commit queue: aterriza tras resolver onCover
    refreshedThisTurn: null,                                // quién usó Refresh este turno (para Velocidad 1)
    currentTriggerCard: null,                               // nombre de la carta que disparó el efecto activo
    pendingCheckCompile: null,                              // set en startTurn; avanza a checkCompilePhase cuando la cola de efectos se vacía
    revealedPlayerCards: [],                                // cartas reveladas por Amor 4 — visibles para la IA
    controlComponent: null,                                 // null = neutral, 'player' o 'ai' = dueño actual
    pendingControlResume: null,                             // { who, action } — resume tras rearrange de Control Component
    isProcessing: false,                                    // ⚠️ BLOQUEO: true mientras se resuelve una acción del jugador
    _lastScrambleTime: 0,                                   // ⏱️ COOLDOWN GLOBAL: timestamp último scramble
    actionLog: [],                                          // ring buffer para paneles laterales de la mano: [{isAI, icon, msg}], max 20
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
                gameState.currentEffectLine = line;
                updateUI();
                logEvent(`${chosen.nombre} en ${line} (desde descarte)`, { isAI: false });
                executeEffect(chosen, 'player');
                if (typeof onOpponentPlayInLineEffects === 'function') onOpponentPlayInLineEffects('player', line);
                // Catch-all: si la carta jugada no tiene efectos, triggerCardEffect no llama a
                // processAbilityEffect — esta llamada lo recoge y dispara pendingTurnEnd → endTurn.
                // Si sí hay efectos, effectContext estará activo y processAbilityEffect retorna de inmediato.
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
    clearSelectionHighlights(); // === STACK TARGETING ===
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

    // Determinar si la carta era la descubierta (top) antes de moverla
    const wasTop = cardIdx === gameState.field[line][target].length - 1;
    const cardObj = gameState.field[line][target].splice(cardIdx, 1)[0];
    gameState.field[destinationLine][target].push(cardObj);

    ctx.selected.push(cardObj);
    if (ctx.selected.length >= ctx.count) {
        // Activar el comando de la carta que queda expuesta:
        // - Si la desplazada era la top → trigger en origen (carta de debajo queda descubierta)
        // - Si era cubierta y está bocarriba → trigger en destino (la propia carta queda descubierta)
        // Pattern idéntico al eliminate handler: triggerUncovered encola el efecto y processAbilityEffect
        // sale pronto (effectContext activo); finishEffect/processAbilityEffect lo procesa después.
        if (wasTop) {
            triggerUncovered(line, target);
        } else if (!cardObj.faceDown) {
            triggerUncovered(destinationLine, target);
        }

        if (ctx.luz2Complete) {
            gameState.effectContext = null;
            clearEffectHighlights();
            updateUI();
            if (typeof processAbilityEffect === 'function') processAbilityEffect();
        } else {
            finishEffect();
        }
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
                    let textEl = existingPTitle.querySelector('.slot-title-text');
                    if (!textEl) {
                        textEl = document.createElement('span');
                        textEl.className = 'slot-title-text';
                        existingPTitle.appendChild(textEl);
                    }
                    textEl.textContent = pProto;
                } else if (imgUrl && !existingPTitle) {
                    const t = document.createElement('div');
                    t.className = 'slot-title';
                    const textEl = document.createElement('span');
                    textEl.className = 'slot-title-text';
                    textEl.textContent = pProto;
                    t.appendChild(textEl);
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
                    let textEl = existingATitle.querySelector('.slot-title-text');
                    if (!textEl) {
                        textEl = document.createElement('span');
                        textEl.className = 'slot-title-text';
                        existingATitle.appendChild(textEl);
                    }
                    textEl.textContent = aProto;
                } else if (imgUrl && !existingATitle) {
                    const t = document.createElement('div');
                    t.className = 'slot-title';
                    const textEl = document.createElement('span');
                    textEl.className = 'slot-title-text';
                    textEl.textContent = aProto;
                    t.appendChild(textEl);
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
            return getPersistentModifiers(top).preventDraw;
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
        // I-01: defer onDeckShuffle trigger until after the full draw+cache cycle
        if (!gameState.pendingDeckShuffle) gameState.pendingDeckShuffle = [];
        if (!gameState.pendingDeckShuffle.includes(target)) gameState.pendingDeckShuffle.push(target);
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

function showCardPreview(card, forceFaceUp) {
    const panel = document.getElementById('card-preview-panel');
    const inner = document.getElementById('card-preview-inner');
    if (!panel || !inner || isSelectionActive()) return;
    
    // Si forceFaceUp es true, mostrar carta bocarriba aunque esté bocabajo
    const cardObj = forceFaceUp ? { card: card, faceDown: false } : card;
    inner.innerHTML = createCardHTML(cardObj);
    panel.classList.add('visible');
}

function hideCardPreview() {
    const panel = document.getElementById('card-preview-panel');
    if (panel) panel.classList.remove('visible');
}

function luz2ShowPostRevealModal(cardObj, line, revSide) {
    const confirmArea = document.getElementById('command-confirm');
    const confirmMsg  = document.getElementById('confirm-msg');
    const btnYes      = document.getElementById('btn-confirm-yes');
    const btnNo       = document.getElementById('btn-confirm-no');
    if (!confirmArea || !btnYes || !btnNo) {
        hideCardPreview();
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    }
    // Mantener contexto para saber que Luz 2 está en progreso
    gameState.effectContext = { type: 'confirm', luz2: true, line, revSide, cardObj };
    updateTurnVisuals();
    confirmArea.classList.remove('hidden');
    confirmMsg.textContent = `Luz 2 — ${cardObj.card.nombre}: SÍ = Cambiar de línea (bocabajo) · NO = Voltear bocarriba`;

    btnYes.onclick = () => {
        confirmArea.classList.add('hidden');
        hideCardPreview();
        const currentIdx = gameState.field[line][revSide].indexOf(cardObj);
        if (currentIdx === -1) { if (typeof processAbilityEffect === 'function') processAbilityEffect(); return; }
        // Shift pre-seleccionado sobre la carta revelada (sigue bocabajo)
        gameState.effectContext = {
            type: 'shift', target: revSide, count: 1, selected: [],
            selectedCard: { line, target: revSide, cardIdx: currentIdx },
            waitingForLine: true,
            luz2Complete: true // Marcar para llamar a processAbilityEffect después
        };
        updateTurnVisuals();
        highlightSelectableLines(line, 'player');
        updateStatus(`Elige línea destino para mover "${cardObj.card.nombre}" (bocabajo)`);
    };

    btnNo.onclick = () => {
        confirmArea.classList.add('hidden');
        hideCardPreview();
        // Voltear bocarriba: ahora sí cambia el estado
        cardObj.faceDown = false;
        cardObj._animateFlip = true;
        updateUI();
        triggerFlipFaceUp(cardObj, line, revSide);
        // Luz 2 completado, continuar con efectos
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
    };
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
            <div class="slot-title"><span class="slot-title-text">${card.nombre.replace(/\s+\d+$/, '')}</span></div>
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


    // Control Component indicator
    const controlEl = document.getElementById('control-indicator');
    if (controlEl) {
        if (sessionStorage.getItem('ruleControlComponent') !== '1') {
            controlEl.style.display = 'none';
        } else {
            controlEl.style.display = '';
            if (gameState.controlComponent === 'player') {
                window.scrTxt ? window.scrTxt(controlEl, 'CTRL △', { duration: 1.0 }) : (controlEl.textContent = 'CTRL △');
                controlEl.style.color = 'var(--player-primary)';
            } else if (gameState.controlComponent === 'ai') {
                window.scrTxt ? window.scrTxt(controlEl, 'CTRL △', { duration: 1.0 }) : (controlEl.textContent = 'CTRL △');
                controlEl.style.color = 'var(--ui-purple)';
            } else {
                window.scrTxt ? window.scrTxt(controlEl, '△', { duration: 1.0 }) : (controlEl.textContent = '△');
                controlEl.style.color = '#2a3050';
            }
        }
    }

    // Update deck/trash counts (query fresh to avoid stale references)
    const playerDeckEl = document.getElementById('player-deck-count');
    const playerTrashEl = document.getElementById('player-trash-count');
    const aiDeckEl = document.getElementById('ai-deck-count');
    const aiTrashEl = document.getElementById('ai-trash-count');
    const _s = (el, v) => window.scrTxt ? window.scrTxt(el, String(v), { duration: 1.0, chars: '0123456789' }) : (el.innerText = v);
    if (playerDeckEl)  _s(playerDeckEl,  gameState.player.deck.length);
    if (playerTrashEl) _s(playerTrashEl, gameState.player.trash.length);
    if (aiDeckEl)      _s(aiDeckEl,      gameState.ai.deck.length);
    if (aiTrashEl)     _s(aiTrashEl,     gameState.ai.trash.length);

    // Update hands — skip rebuild si animación de entrada está corriendo
    if (ui.playerHand && !window._handAnimating) {
        ui.playerHand.innerHTML = gameState.player.hand
            .map(c => createCardHTML(c))
            .join('');
    }
    // updateSlider siempre: no toca innerHTML, solo sincroniza estado de flechas/dots
    if (typeof updateSlider === 'function') updateSlider();
    // AI hand: just show count
    const aiHandCountEl = document.getElementById('ai-hand-count');
    if (aiHandCountEl) {
        const n = gameState.ai.hand.length;
        window.scrTxt ? window.scrTxt(aiHandCountEl, String(n), { duration: 1.0, chars: '0123456789' }) : (aiHandCountEl.textContent = n);
        aiHandCountEl.style.color = n === 0 ? '#ef4444' : 'var(--ui-pink)';
    }
    // V2: update hand count badge
    const handBadge = document.getElementById('hand-count-badge');
    if (handBadge) { window.scrTxt ? window.scrTxt(handBadge, String(gameState.player.hand.length), { duration: 1.0, chars: '0123456789' }) : (handBadge.textContent = gameState.player.hand.length); }
    
    // Attach events to player hand
    document.querySelectorAll('#player-hand .card').forEach((cardEl, index) => {
        cardEl.onclick = () => {
            console.log(`🖱️ Card clicked at index ${index}. gameState.turn=${gameState.turn}, phase=${gameState.phase}, effectContext=${gameState.effectContext ? gameState.effectContext.type : 'none'}, isProcessing=${gameState.isProcessing}`);
            
            // ⚠️ BLOQUEO: Si ya hay una acción en proceso, ignorar clicks normales
            if (gameState.isProcessing && !gameState.effectContext) {
                console.warn('⛔ Card click blocked — already processing');
                return;
            }
            
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
                window._animPendingField = { line: ctx.line, target: 'player' };
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
        if (pScoreEl)  { window.scrTxt ? window.scrTxt(pScoreEl,  String(pScore),  { duration: 1.0, chars: '0123456789' }) : (pScoreEl.innerText  = pScore);  }
        if (aiScoreEl) { window.scrTxt ? window.scrTxt(aiScoreEl, String(aiScore), { duration: 1.0, chars: '0123456789' }) : (aiScoreEl.innerText = aiScore); }

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

    // Apply scramble effect to card text zones (slot-title-text and card-img-zone-text)
    // ⚠️ COOLDOWN GLOBAL: Evitar re-animar si updateUI() se llamó recientemente
    // Esto previene múltiples scrambles cuando updateUI() se llama 2-3 veces en rápida sucesión
    if (window.scrTxt) {
        const now = Date.now();
        const COOLDOWN_MS = 1500; // No re-animar en 1.5s
        
        // Check cooldown global primero
        if (!gameState._lastScrambleTime || (now - gameState._lastScrambleTime) > COOLDOWN_MS) {
            gameState._lastScrambleTime = now;
            
            document.querySelectorAll('.slot-title-text').forEach(el => {
                const text = el.textContent.trim();
                if (text) window.scrTxt(el, text, { duration: 1.0, chars: 'upperCase' });
            });
            document.querySelectorAll('.card-img-zone-text').forEach(el => {
                const text = el.textContent.trim();
                if (text) window.scrTxt(el, text, { duration: 1.0, chars: 'upperAndLowerCase' });
            });
        }
    }

    checkWinCondition();
    if (typeof window.flushAnimQueue === 'function') window.flushAnimQueue();
    updateHandSidePanels();
    updateTurnVisuals();
    markFieldTargets(); // === FIELD TARGETING: reaplica clases tras reconstrucción del DOM ===
}

function updateTurnVisuals() {
    const overlay = document.getElementById('hand-overlay');
    const statusEl = document.getElementById('game-status');
    if (!overlay) return;

    // effectContext siempre requiere input del jugador (la IA resuelve sin pasar por effectContext)
    const needsPlayerInput = !!gameState.effectContext;
    const isAITurn = gameState.turn === 'ai' && !needsPlayerInput;
    const isPlayerTurn = gameState.turn === 'player' && gameState.phase === 'action' && !needsPlayerInput;

    overlay.classList.toggle('ai-turn', isAITurn);
    overlay.classList.toggle('effect-pending', needsPlayerInput);

    const btnRefreshEl = document.getElementById('player-deck-btn');
    if (btnRefreshEl) btnRefreshEl.disabled = !isPlayerTurn;

    if (!statusEl) return;
    if (needsPlayerInput) {
        statusEl.textContent = '← ACCIÓN REQUERIDA';
        statusEl.className = 'gs-effect';
    } else if (isAITurn) {
        statusEl.textContent = 'IA →';
        statusEl.className = 'gs-ai';
    } else if (isPlayerTurn) {
        statusEl.textContent = 'TU TURNO';
        statusEl.className = 'gs-player';
    } else {
        statusEl.textContent = '—';
        statusEl.className = '';
    }
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
        score = score - netModifier;
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

        // Preview: click abre, mouseleave cierra. Solo cartas visibles (no bocabajo rival).
        const canPreview = !cardObj.faceDown || target === 'player';
        if (canPreview) {
            domCard.addEventListener('mouseleave', hideCardPreview);
        }

        // Add click handler for effects (eliminate/flip/shift/return) and preview
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
            } else if (canPreview) {
                // Sin efecto activo: mostrar preview de la carta
                showCardPreview(cardObj.card);
            }
        };

        const wrapper = document.createElement('div');
        wrapper.className = 'card-field-wrapper';
        wrapper.dataset.line = line;
        wrapper.dataset.target = target;
        wrapper.dataset.idx = idx;

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

        // Animar entrada: (a) nueva carta jugada — _animPendingField en última posición
        //                 (b) carta volteada — _animate en el cardObj directamente
        if (idx === stack.length - 1 && window._animPendingField &&
            window._animPendingField.line === line && window._animPendingField.target === target) {
            window._animPendingField = null;
            domCard.classList.add('card-entering');
        } else if (cardObj._animateFlip) {
            console.log('[FLIP ANIM] applying card-entering-h to', cardObj.card.nombre);
            delete cardObj._animateFlip;
            domCard.classList.add('card-entering-h');
        }
    });
}

// Turn Cycle Functions
function startTurn(who) {
    if (gameState.phase === 'game_over') return;
    gameState.turn = who;
    gameState.phase = 'start';
    gameState.ignoreEffectsLines = {};
    gameState.uncoveredThisTurn = new Set();
    // Snapshot solo del jugador ACTUAL: captura lo que hizo en SU turno anterior.
    // No tocar el flag del oponente — su snapshot se hará cuando arranque su propio turno.
    gameState[who].drawnLastTurn = gameState[who].drawnSinceLastCheck;
    gameState[who].drawnSinceLastCheck = false;
    gameState[who].eliminatedLastTurn = gameState[who].eliminatedSinceLastCheck;
    gameState[who].eliminatedSinceLastCheck = false;
    gameState.refreshedThisTurn = null;
    // Limpiar cartas reveladas que ya no están en la mano del jugador
    gameState.revealedPlayerCards = gameState.revealedPlayerCards.filter(
        rc => gameState.player.hand.some(h => h.nombre === rc.nombre)
    );
    logEvent(`--- Turno de ${who === 'player' ? 'Jugador' : 'IA'} ---`, { isAI: who === 'ai' });

    // Disparar efectos de inicio de turno; la fase de compilación esperará a que terminen
    gameState.pendingCheckCompile = who;
    if (typeof onTurnStartEffects === 'function') {
        onTurnStartEffects(who);
    }
    if (gameState.pendingStartTriggers && gameState.pendingStartTriggers.length > 0) {
        gameState.pendingStartTurnWho = who;
        if (typeof processNextStartTrigger === 'function') processNextStartTrigger(who);
    } else {
        // Sin efectos Start, avanzar directamente
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
    }
}

function resumeControlAction(action, who) {
    if (action === 'endTurn') {
        setTimeout(() => endTurn(who), 300);
    } else if (action === 'doRefreshAndContinue') {
        if (typeof onRefreshEffects === 'function') onRefreshEffects(who);
        if (typeof onOpponentRefreshEffects === 'function') onOpponentRefreshEffects(who);
        if (gameState.effectContext || gameState.effectQueue.length > 0) {
            gameState.pendingStartTurn = (who === 'player' ? 'ai' : 'player');
            return;
        }
        setTimeout(() => startTurn(who === 'player' ? 'ai' : 'player'), 1000);
    }
}

/**
 * Decide si la IA debe reorganizar sus propios protocolos o los del rival.
 * Devuelve 'ai', 'player' o null (saltar).
 */
function aiShouldRearrangeControl() {
    // --- Ganancia propia: ¿cuántas cartas de mano se pueden jugar bocarriba antes y después? ---
    const countPlayable = (owner) => {
        const protos = gameState[owner].protocols;
        return gameState[owner].hand.filter(c => protos.includes(c.protocol)).length;
    };
    const findBestSwap = (owner) => {
        const protos = [...gameState[owner].protocols];
        const hand = gameState[owner].hand;
        if (hand.length === 0 || protos.length < 2) return 0;
        const best = hand.reduce((b, c) => c.valor > b.valor ? c : b, hand[0]);
        const bestProtoIdx = protos.indexOf(best.protocol);
        if (bestProtoIdx < 0) return 0;
        const bestLineIdx = LINES
            .map((l, i) => ({ i, score: calculateScore(gameState, l, owner) - calculateScore(gameState, l, owner === 'ai' ? 'player' : 'ai') }))
            .sort((a, b) => b.score - a.score)[0].i;
        if (bestProtoIdx === bestLineIdx) return 0; // ya alineado
        // Simular swap
        [protos[bestProtoIdx], protos[bestLineIdx]] = [protos[bestLineIdx], protos[bestProtoIdx]];
        const after = gameState['ai'].hand.filter(c => protos.includes(c.protocol)).length;
        const before = countPlayable('ai');
        return after - before;
    };

    const ownGain = findBestSwap('ai');

    // --- Disrupción rival: ¿cuántas de sus cartas conocidas dejarían de ser jugables? ---
    const oppPlayable = countPlayable('player');
    const oppProtos = [...gameState.player.protocols];
    let maxDisruption = 0;
    for (let i = 0; i < oppProtos.length - 1; i++) {
        for (let j = i + 1; j < oppProtos.length; j++) {
            [oppProtos[i], oppProtos[j]] = [oppProtos[j], oppProtos[i]];
            const after = gameState.player.hand.filter(c => oppProtos.includes(c.protocol)).length;
            const disruption = oppPlayable - after;
            if (disruption > maxDisruption) maxDisruption = disruption;
            [oppProtos[i], oppProtos[j]] = [oppProtos[j], oppProtos[i]]; // revert
        }
    }

    if (ownGain <= 0 && maxDisruption <= 0) return null;
    return ownGain >= maxDisruption ? 'ai' : 'player';
}

function offerControlRearrange(who, resumeAction) {
    gameState.controlComponent = null;
    updateUI();

    if (who === 'ai') {
        const target = aiShouldRearrangeControl();
        if (target) {
            updateStatus(`IA usa el Control Component para reorganizar protocolos ${target === 'ai' ? 'propios' : 'rivales'}`);
            resolveEffectAI('rearrange', target, 1, {});
        }
        resumeControlAction(resumeAction, who);
        return;
    }

    // Jugador: mostrar diálogo de elección
    const confirmArea = document.getElementById('command-confirm');
    if (!confirmArea) { resumeControlAction(resumeAction, who); return; }
    const confirmMsg = document.getElementById('confirm-msg');
    const actionsDiv = confirmArea.querySelector('.effect-actions');

    if (confirmMsg) { window.scrTxt ? window.scrTxt(confirmMsg, 'Control Component: ¿Reorganizas protocolos?', { duration: 1.0 }) : (confirmMsg.textContent = 'Control Component: ¿Reorganizas protocolos?'); }
    if (actionsDiv) actionsDiv.innerHTML = `
        <button class="ui-btn" id="btn-ctrl-mine">MIS PROTOCOLOS</button>
        <button class="ui-btn ui-btn--danger" id="btn-ctrl-rival">PROTOCOLOS RIVALES</button>
        <button class="ui-btn" id="btn-ctrl-skip">SALTAR</button>
    `;
    confirmArea.classList.remove('hidden');

    gameState.pendingControlResume = { who, action: resumeAction };

    const hideConfirm = () => {
        confirmArea.classList.add('hidden');
    };

    document.getElementById('btn-ctrl-mine').onclick = () => { hideConfirm(); startEffect('rearrange', 'player', 1); };
    document.getElementById('btn-ctrl-rival').onclick = () => { hideConfirm(); startEffect('rearrange', 'ai', 1); };
    document.getElementById('btn-ctrl-skip').onclick = () => {
        hideConfirm();
        const resume = gameState.pendingControlResume;
        gameState.pendingControlResume = null;
        if (resume) resumeControlAction(resume.action, resume.who);
    };
}

function checkControlPhase(who) {
    // Regla opcional: si está deshabilitada, saltar directamente a compile
    if (sessionStorage.getItem('ruleControlComponent') !== '1') {
        checkCompilePhase(who);
        return;
    }

    const opp = who === 'player' ? 'ai' : 'player';
    const linesWon = LINES.filter(line =>
        calculateScore(gameState, line, who) > calculateScore(gameState, line, opp)
    ).length;

    if (linesWon >= 2) {
        const gained = gameState.controlComponent !== who;
        gameState.controlComponent = who;
        if (gained) {
            updateStatus(`${who === 'player' ? 'Obtienes' : 'IA obtiene'} el Control Component`);
            updateUI();
        }
    }
    // Si el jugador activo no gana ≥2 líneas, el control queda como estaba

    checkCompilePhase(who);
}

function checkCompilePhase(who) {
    gameState.phase = 'check_compile';
    console.log(`📋 Checking compile phase for ${who}`);
    // "Comprobando compilaciones..." — instrucción interna, no va al log
    
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
    let compiledLine = null;
    for (const line of LINES) {
        const myScore = calculateScore(gameState, line, who);
        const oppScore = calculateScore(gameState, line, who === 'player' ? 'ai' : 'player');

        console.log(`  Line ${line}: ${who}=${myScore} vs opp=${oppScore}`);

        if (myScore >= 10 && myScore > oppScore) {
            console.log(`  ✅ Compiled: ${line}`);
            compileLine(line, who);
            compiledAny = true;
            compiledLine = line;
            break; // Max 1 compile per turn as per rules
        }
    }

    if (compiledAny) {
        window.queueAnim?.({ type: 'compile', line: compiledLine });
        updateUI();
        if (gameState.pendingCompileShift) {
            const { cards, sourceLine } = gameState.pendingCompileShift;
            gameState.effectContext = { type: 'compileShift', cards, sourceLine, resumeFor: who, waitingForLine: true };
            updateTurnVisuals();
            updateStatus('Velocidad 2: elige línea donde cambiar la carta');
            highlightSelectableLines(sourceLine, 'player');
        } else {
            setTimeout(() => {
                if (gameState.controlComponent === who) {
                    offerControlRearrange(who, 'endTurn');
                } else {
                    endTurn(who);
                }
            }, 2000);
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
    updateTurnVisuals();

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
        // C-03 + I-02: si el mazo rival está vacío, barajar su descarte antes del robo
        // shuffleDiscardIntoDeck dispara onDeckShuffle del rival (Tiempo 2)
        const rivalState = gameState[rival];
        if (rivalState.deck.length === 0 && rivalState.trash.length > 0) {
            if (typeof shuffleDiscardIntoDeck === 'function') shuffleDiscardIntoDeck(rival);
        }
        if (rivalState.deck.length > 0) {
            const stolenCard = rivalState.deck.pop();
            gameState[who].hand.push(stolenCard);
            logEvent(`Re-compilación en ${line} — roba carta rival`, { isAI: who === 'ai' });
        } else {
            logEvent(`Re-compilación en ${line} — mazo rival vacío`, { isAI: who === 'ai' });
        }
    } else {
        // Primera compilación o rival toma la línea: crédito normal, cambiar dueño
        gameState.field[line].compiledBy = who;
        logEvent(`${who === 'player' ? 'compilado' : 'IA compiló'} ${line}`, { isAI: who === 'ai' });
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
        logEvent(`IA desplaza Velocidad 2 a ${dest}`, { isAI: true });
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

    // ⚠️ BLOQUEO: Si ya hay una acción en proceso, ignorar
    if (gameState.isProcessing) {
        console.warn('⛔ Action blocked — already processing');
        return;
    }

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
    
    // Apply scramble effect to card text in modal
    setTimeout(function() {
        if (window.scrTxt) {
            ui.modalCardPreview.querySelectorAll('.slot-title-text, .card-img-zone-text').forEach(function(el) {
                const text = el.textContent.trim();
                if (text) {
                    window.scrTxt(el, text, { duration: 1.0, chars: el.classList.contains('slot-title-text') ? 'upperCase' : 'upperAndLowerCase' });
                }
            });
        }
    }, 50);
    
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
        showConfirmDialog(
            `¿Quieres usar este efecto? "${text}"`,
            () => resolveSentence(text, targetPlayer, opponent),  // onYes
            () => processNextEffect(),  // onNo
            'SÍ',
            'NO'
        );
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
        // Efectos de mano: el dueño de la mano elige qué descartar/dar/revelar.
        isAIResolving = (target === 'ai');
    } else {
        // Efectos de campo: el dueño de la carta (opts.owner) decide quién interactúa.
        // Fallback: gameState.turn — cubre llamadas sin opts.owner explícito.
        isAIResolving = opts.owner !== undefined ? (opts.owner === 'ai') : (gameState.turn === 'ai');
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

    // revealField: solo necesita que haya alguna carta bocabajo en campo
    if (type === 'revealField') {
        const targets = target === 'any' ? ['player', 'ai'] : [target];
        const hasFD = LINES.some(l => targets.some(p => gameState.field[l][p].some(c => c.faceDown)));
        if (!hasFD) {
            console.log(`⏭️ revealField omitido — sin cartas bocabajo`);
            if (typeof processAbilityEffect === 'function') processAbilityEffect();
            return;
        }
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
                    // Si hay filtro, verificar que alguna carta cubierta lo pase
                    if (filterCtx.filter) {
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
                if (typeof getPersistentModifiers === 'function') {
                    const mods = getPersistentModifiers(topCard);
                    if (type === 'flip' && mods.preventFlip) return false;
                    if (type === 'shift' && mods.preventShift) return false;
                    if (type === 'eliminate' && mods.preventEliminate) return false;
                }
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
    else if (type === 'revealField') actionVerb = 'REVELAR';

    const targetDesc = target === 'ai' ? ' del OPONENTE' : target === 'player' ? ' TUYAS' : '';
    if (type === 'rearrange') {
        const ownerDesc = target === 'ai' ? 'del OPONENTE' : 'TUYOS';
        updateStatus(`Reorganizar protocolos ${ownerDesc}: intercambia líneas y pulsa Listo`);
        // Mostrar botón "Listo" para confirmar reorganización
        showRearrangeDoneButton();
    } else if (opts.statusMsg) {
        updateStatus(`Efecto: elige ${count} carta(s)${targetDesc} para ${opts.statusMsg}`);
    } else {
        updateStatus(`Efecto: elige ${count} carta(s)${targetDesc} para ${actionVerb}`);
    }
    highlightEffectTargets();
    updateTurnVisuals();
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
        markFieldTargets();    // === FIELD TARGETING ===
        _fieldTooltipAttach(); // === FIELD TARGETING ===
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
    } else if (ctx.type === 'massReturnByValue') {
        if (typeof showReturnByValueLineOverlay === 'function') {
            showReturnByValueLineOverlay(ctx);
        }
    } else if (ctx.type === 'massReturnByValueBoth') {
        // Agua 3: return cards from both players in selected line
        if (typeof showReturnByValueLineOverlayBoth === 'function') {
            showReturnByValueLineOverlayBoth(ctx);
        }
    }
}

function executeReturnByValueFromLine(line) {
    const ctx = gameState.effectContext;
    if (!ctx || ctx.type !== 'massReturnByValue') return;
    const { value, target } = ctx;
    const remaining = [];
    gameState.field[line][target].forEach(c => {
        if (!c.faceDown && c.card.valor === value) {
            gameState[target].hand.push(c.card);
        } else {
            remaining.push(c);
        }
    });
    gameState.field[line][target] = remaining;
    finishEffect();
}

function executeReturnByValueFromLineBoth(line) {
    // Agua 3: return cards with value 2 from BOTH players in selected line
    const ctx = gameState.effectContext;
    if (!ctx || ctx.type !== 'massReturnByValueBoth') return;
    const { value } = ctx;
    
    ['player', 'ai'].forEach(p => {
        const remaining = [];
        gameState.field[line][p].forEach(c => {
            if (!c.faceDown && c.card.valor === value) {
                gameState[p].hand.push(c.card);
            } else {
                remaining.push(c);
            }
        });
        gameState.field[line][p] = remaining;
    });
    
    finishEffect();
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
    // Close select overlay if open
    if (typeof closeHandSelectOverlay === 'function') closeHandSelectOverlay();
    clearFieldTargets(); // === FIELD TARGETING ===
}

// === FIELD TARGETING — revertir: borrar markFieldTargets + clearFieldTargets + _fieldTooltip* + llamadas ===

const _FIELD_TOOLTIP_LABELS = {
    eliminate:        'Eliminar',
    flip:             'Voltear',
    return:           'Devolver',
    shift:            'Cambiar',
    revealField:      'Revelar',
    selectCardToCopy: 'Copiar efecto',
    swap:             'Intercambiar',
};

// Event delegation: un solo listener en #game-container, sobrevive reconstrucciones del DOM
function _tooltipCoords(e) {
    // CSS zoom on <html> (used for responsive scaling) causes clientX/Y to be
    // in pre-zoom space while position:fixed renders in zoomed space — divide to align.
    const z = parseFloat(document.documentElement.style.zoom) || 1;
    return { x: e.clientX / z, y: e.clientY / z };
}

function _fieldTooltipOnMove(e) {
    const tip = document.getElementById('field-cursor-tooltip');
    if (tip && tip.classList.contains('visible')) {
        const { x, y } = _tooltipCoords(e);
        tip.style.left = x + 'px';
        tip.style.top  = y + 'px';
    }
}

function _fieldTooltipShow(tip, e, label, trackKey) {
    const { x, y } = _tooltipCoords(e);
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
    tip.classList.add('visible');
    // Re-scramble solo si cambió el elemento sobre el que estamos (trackKey distingue cartas/columnas)
    if (tip.dataset.tooltipKey === trackKey) return;
    tip.dataset.tooltipKey = trackKey;
    tip.textContent = '';
    if (window.gsap && typeof ScrambleTextPlugin !== 'undefined') {
        gsap.to(tip, { duration: 0.9, scrambleText: { text: label, chars: 'upperCase', speed: 0.4, revealDelay: 0 } });
    } else {
        tip.textContent = label;
    }
}

function _fieldTooltipOnOver(e) {
    const tip = document.getElementById('field-cursor-tooltip');
    if (!tip) return;

    const wrapper = e.target.closest('.card-field-wrapper.field-target');
    if (wrapper) {
        const ctx = gameState.effectContext;
        const label = ctx ? (_FIELD_TOOLTIP_LABELS[ctx.type] || ctx.type) : '';
        if (!label) return;
        _fieldTooltipShow(tip, e, label, wrapper.dataset.line + wrapper.dataset.target + wrapper.dataset.idx);
        return;
    }

    const col = e.target.closest('.battle-column.rearrange-active');
    if (col) {
        // trackKey por columna: usar el id del line-* hijo (display:contents) como identificador
        const lineEl = col.querySelector('[id^="line-"]');
        const colKey = lineEl ? lineEl.id : 'rearrange-col';
        _fieldTooltipShow(tip, e, 'Reorganizar', colKey);
        return;
    }

    tip.classList.remove('visible');
    delete tip.dataset.tooltipKey;
}

function _fieldTooltipAttach() {
    const gc = document.getElementById('game-container');
    if (!gc) return;
    gc.addEventListener('mouseover', _fieldTooltipOnOver);
    gc.addEventListener('mousemove', _fieldTooltipOnMove);
}

function _fieldTooltipDetach() {
    const gc = document.getElementById('game-container');
    if (gc) {
        gc.removeEventListener('mouseover', _fieldTooltipOnOver);
        gc.removeEventListener('mousemove', _fieldTooltipOnMove);
    }
    const tip = document.getElementById('field-cursor-tooltip');
    if (tip) {
        tip.classList.remove('visible');
        tip.removeAttribute('data-scr-last');
    }
}
function markFieldTargets() {
    const ctx = gameState.effectContext;
    const gc = document.getElementById('game-container');
    if (!gc || !ctx) return;

    const fieldTypes = ['eliminate', 'flip', 'return', 'shift', 'revealField', 'selectCardToCopy', 'swap'];
    if (!fieldTypes.includes(ctx.type)) return;

    gc.classList.add('field-targeting');

    document.querySelectorAll('.card-field-wrapper[data-line]').forEach(wrapper => {
        const line   = wrapper.dataset.line;
        const target = wrapper.dataset.target;
        const idx    = parseInt(wrapper.dataset.idx);
        const stack  = gameState.field[line]?.[target];
        if (!stack) return;
        const cardObj = stack[idx];
        if (!cardObj) return;

        const isUncovered = idx === stack.length - 1;

        // Target side
        if (ctx.target !== 'any' && ctx.target !== target) return;
        // Coverage
        if (!isUncovered && !ctx.targetAll && !ctx.coveredOnly) return;
        if (ctx.coveredOnly && isUncovered) return;
        // Line restrictions
        if (ctx.forceLine && line !== ctx.forceLine) return;
        if (ctx.allowedLines && !ctx.allowedLines.includes(line)) return;
        if (ctx.excludeLine && line === ctx.excludeLine) return;
        // Filter
        if (ctx.filter && !cardMatchesFilter(cardObj, ctx)) return;
        // Persistent modifiers (prevent*)
        if (typeof getPersistentModifiers === 'function') {
            const mods = getPersistentModifiers(cardObj);
            if (ctx.type === 'eliminate' && mods.preventEliminate) return;
            if (ctx.type === 'flip'      && mods.preventFlip)      return;
            if (ctx.type === 'shift'     && mods.preventShift)     return;
        }

        wrapper.classList.add('field-target');
    });
}

function clearFieldTargets() {
    _fieldTooltipDetach();
    document.getElementById('game-container')?.classList.remove('field-targeting');
    document.querySelectorAll('.card-field-wrapper.field-target').forEach(el => el.classList.remove('field-target'));
}
// === FIN FIELD TARGETING ===

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
        gameState.player.discardedSinceLastCheck = true;
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
    logEvent(`Revelas: ${card.nombre}`, { isAI: false });
    finishEffect();
    processAbilityEffect();
}

function finalizeDiscardVariable() {
    const ctx = gameState.effectContext;
    if (!ctx || ctx.type !== 'discardVariable') return;
    const n = ctx.selected.length;
    const isAIInitiated = !!ctx._aiFollowUp;
    gameState._plaga2PlayerDiscarded = n;
    finishEffect();
    if (!isAIInitiated) {
        discard('ai', n + 1);
        logEvent(`Plaga 2: descartaste ${n}, la IA descarta ${n + 1}`, { isAI: false });
    }
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
        // preventEliminate: Muerte 1 no puede ser eliminada por efectos externos (solo bocarriba)
        if (typeof getPersistentModifiers === 'function' && getPersistentModifiers(cardObj).preventEliminate) {
            updateStatus(`${cardObj.card.nombre} no puede ser eliminada por efectos externos`);
            return;
        }
        const _doElim = () => {
            gameState.field[line][target].splice(cardIdx, 1);
            gameState[target].trash.push(cardObj.card);
            gameState[gameState.turn].eliminatedSinceLastCheck = true;
            ctx.selected.push(cardObj);
            // Odio 2 tie-break: if the chosen card is NOT Odio 2 itself, queue opponent phase
            if (ctx._checkSuicide) {
                const { triggerCardName, queueEffect } = ctx._checkSuicide;
                if (cardObj.card.nombre !== triggerCardName && queueEffect) {
                    gameState.effectQueue.unshift(queueEffect);
                }
            }
            triggerUncovered(line, target);
            if (ctx.selected.length >= ctx.count) finishEffect();
            else updateUI();
        };
        if (window.animCardEliminate) {
            window.animCardEliminate(cardObj.card.id, _doElim);
        } else {
            _doElim();
        }
        return;
    } else if (ctx.type === 'flip') {
        const cardObj = gameState.field[line][target][cardIdx];
        if (ctx.forceLine && line !== ctx.forceLine) return;
        if (ctx.excludeLine && line === ctx.excludeLine) return;
        if (ctx.excludeCardName && cardObj.card.nombre === ctx.excludeCardName) return;
        if (ctx.coveredOnly && cardIdx === gameState.field[line][target].length - 1) return;
        if (ctx.filter && !cardMatchesFilter(cardObj, ctx)) return;
        // preventFlip: Hielo 4 no puede ser volteada por ningún efecto (solo bocarriba)
        if (typeof getPersistentModifiers === 'function' && getPersistentModifiers(cardObj).preventFlip) {
            updateStatus(`${cardObj.card.nombre} no puede ser volteada`);
            return;
        }
        const wasFaceDown = cardObj.faceDown;
        cardObj.faceDown = !cardObj.faceDown;
        gameState.lastFlippedCard = { cardObj, line, target };
        cardObj._animateFlip = true;
        updateUI(); // inicia animación — finishEffect debe esperar
        const _isTop = cardIdx === gameState.field[line][target].length - 1;
        setTimeout(() => {
            ctx.selected.push(cardObj);
            if (ctx.selected.length >= ctx.count) {
                finishEffect();
            } else {
                updateUI();
            }
            // Disparar onPlay de la carta volteada DESPUÉS de cerrar el efecto actual
            if (wasFaceDown && _isTop) {
                triggerFlipFaceUp(cardObj, line, target);
            }
        }, 700);
        return;
    } else if (ctx.type === 'shift') {
        const cardObj = gameState.field[line][target][cardIdx];
        // Bloquear línea excluida (ej. Gravedad 4: fuente no puede ser la propia línea)
        if (ctx.excludeLine && line === ctx.excludeLine) return;
        // Oscuridad 0: solo cartas cubiertas (no la top)
        if (ctx.coveredOnly && cardIdx === gameState.field[line][target].length - 1) return;
        // Bloquear si el filtro no pasa (ej. solo bocabajo)
        if (ctx.filter && !cardMatchesFilter(cardObj, ctx)) return;
        // preventShift: Muerte 1 no puede ser cambiada de línea por efectos externos (solo bocarriba)
        if (typeof getPersistentModifiers === 'function' && getPersistentModifiers(cardObj).preventShift) {
            updateStatus(`${cardObj.card.nombre} no puede ser movida por efectos externos`);
            return;
        }
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
        highlightSelectableLines(ctx.selectedCard.line, ctx.selectedCard.target);
        return; 
    } else if (ctx.type === 'revealField') {
        // Revelar: mostrar la identidad de la carta bocabajo sin cambiar su estado
        const cardObj = gameState.field[line][target][cardIdx];
        if (!cardObj.faceDown) return; // solo bocabajo
        // NO establecer effectContext = null aquí - Luz 2 aún no ha terminado
        clearEffectHighlights();
        // Mostrar carta revelada (bocarriba) en el preview
        showCardPreview(cardObj.card, true); // true = forzar bocarriba
        // Mostrar modal directamente sin cola
        luz2ShowPostRevealModal(cardObj, line, target);
        return;
    } else if (ctx.type === 'return') {
        // Filter: si hay filtro faceDown con targetAll, validar que la carta clicada sea bocabajo
        const cardObj = gameState.field[line][target][cardIdx];
        if (ctx.filter === 'faceDown' && !cardObj.faceDown) return;
        const _doReturn = () => {
            gameState.field[line][target].splice(cardIdx, 1);
            const dest = ctx.beneficiary || target;
            if (typeof applyReturnToHand === 'function') applyReturnToHand(dest, cardObj.card);
            else gameState[dest].hand.push(cardObj.card);
            ctx.selected.push(cardObj);
            triggerUncovered(line, target);
            if (ctx.selected.length >= ctx.count) finishEffect();
            else updateUI();
        };
        if (window.animCardEliminate) {
            window.animCardEliminate(cardObj.card.id, _doReturn);
        } else {
            _doReturn();
        }
        return;
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
    const mods = getPersistentModifiers(coveredObj);
    if (mods.deleteOnModify) {
        stack.splice(stack.length - 2, 1);
        gameState[owner].trash.push(coveredObj.card);
        updateUI();
    }
}

/**
 * Inserts a card into a stack respecting Gravedad 0's rule:
 * if Gravedad 0 is face-up anywhere in the stack, new cards land just below it.
 */
function insertCardIntoStack(stack, cardObj) {
    const g0Idx = stack.findIndex(c => !c.faceDown && c.card.nombre === 'Gravedad 0');
    if (g0Idx >= 0) {
        stack.splice(g0Idx, 0, cardObj);
    } else {
        stack.push(cardObj);
    }
}

function landPendingCard() {
    const { line, cardObj, owner, isFaceDown } = gameState.pendingLanding;
    gameState.pendingLanding = null;
    insertCardIntoStack(gameState.field[line][owner], cardObj);
    checkDeleteOnCover(line, owner);
    window._animPendingField = { line, target: owner };
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
            document.querySelectorAll(`#proto-${l}-player .rearrange-check, #proto-${l}-ai .rearrange-check`).forEach(c => c.remove());
        }
    });
    // === STACK TARGETING ===
    if (active) {
        // Dimear el lado que NO se reorganiza
        const ctx = gameState.effectContext;
        const owner = ctx ? ((ctx.target === 'opponent' || ctx.target === 'ai') ? 'ai' : 'player') : 'player';
        const gc = document.getElementById('game-container');
        if (gc) gc.classList.add(owner === 'player' ? 'side-targeting-ai' : 'side-targeting-player');
        _fieldTooltipAttach();
    } else {
        clearSelectionHighlights();
        _fieldTooltipDetach();
    }
}

function showRearrangeDoneButton() {
    setRearrangeActiveColumns(true);
    // Asegurar que el drawer está abierto para que el jugador vea el botón
    const overlay = document.getElementById('hand-overlay');
    if (overlay) overlay.classList.add('open');

    let btn = document.getElementById('btn-rearrange-done');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btn-rearrange-done';
        btn.textContent = 'LISTO';
        btn.className = 'ui-btn ui-btn--sm';
        btn.style.cssText = 'background: var(--ui-cyan); color: #0a0e27; font-weight: 700;';
        // Insertar en el header del log unificado o en el bar como fallback
        const logHeader = document.getElementById('hs-log-header');
        const fallback = document.getElementById('game-status');
        if (logHeader) logHeader.appendChild(btn);
        else if (fallback) fallback.parentElement.insertBefore(btn, fallback.nextSibling);
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
        // Cache discard cuenta como descartar — disparar efectos reactivos + onCacheClear (ej. Velocidad 1)
        if (typeof onOpponentDiscardEffects === 'function') onOpponentDiscardEffects(who);
        if (typeof onOwnDiscardEffects === 'function') onOwnDiscardEffects(who);
        if (typeof onCacheClearEffects === 'function') onCacheClearEffects(who);
        continueEndTurn(who);
        return;
    }

    // If this was a Control Component rearrange, resume the original flow
    if (gameState.pendingControlResume) {
        const { who, action } = gameState.pendingControlResume;
        gameState.pendingControlResume = null;
        resumeControlAction(action, who);
        return;
    }

    // Route to ability engine if queue items are in new format
    if (gameState.effectQueue.length > 0 && gameState.effectQueue[0].effect !== undefined) {
        processAbilityEffect();
    } else if (gameState.effectQueue.length === 0 && gameState.pendingCheckCompile) {
        const who = gameState.pendingCheckCompile;
        gameState.pendingCheckCompile = null;
        setTimeout(() => checkControlPhase(who), 600);
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
            const topCard = stack[stack.length - 1];
            if (typeof getPersistentModifiers === 'function' && getPersistentModifiers(topCard).preventEliminate) return false;
            return cardMatchesFilter(topCard, filterCtx);
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
                const cardObj = gameState.field[line][actualTarget][gameState.field[line][actualTarget].length - 1];
                if (window.animCardEliminate) window.animCardEliminate(cardObj.card.id, null);
                gameState.field[line][actualTarget].pop();
                gameState[actualTarget].trash.push(cardObj.card);
                gameState[gameState.turn].eliminatedSinceLastCheck = true;
                triggerUncovered(line, actualTarget);
            }
        }
    } else if (type === 'flip') {
        let flippedCount = 0;
        let lastFlippedSide = actualTarget; // para el log: qué lado se volteó realmente
        for (let i = 0; i < count; i++) {
            if (opts.filter === 'faceDown') {
                // Solo puede voltear cartas bocabajo → bocarriba.
                // Preferir propias (activa valor/efecto); fallback al rival si target:'any'.
                const ownLine = LINES
                    .filter(l => gameState.field[l].ai.some(c => c.faceDown))
                    .sort((a, b) => calculateScore(gameState, b, 'ai') - calculateScore(gameState, a, 'ai'))[0] || null;
                if (ownLine !== null) {
                    const stack = gameState.field[ownLine].ai;
                    const fdIdx = [...stack].reverse().findIndex(c => c.faceDown);
                    if (fdIdx >= 0) {
                        const flipped = stack[stack.length - 1 - fdIdx];
                        flipped.faceDown = false;
                        flippedCount++;
                        lastFlippedSide = 'ai';
                        if (fdIdx === 0) flipped._animateFlip = true;
                        triggerFlipFaceUp(flipped, ownLine, 'ai');
                    }
                } else if (target === 'any') {
                    const pLine = LINES
                        .filter(l => gameState.field[l].player.some(c => c.faceDown))
                        .sort((a, b) => calculateScore(gameState, b, 'player') - calculateScore(gameState, a, 'player'))[0] || null;
                    if (pLine !== null) {
                        const stack = gameState.field[pLine].player;
                        const fdIdx = [...stack].reverse().findIndex(c => c.faceDown);
                        if (fdIdx >= 0) {
                            const flipped = stack[stack.length - 1 - fdIdx];
                            flipped.faceDown = false;
                            flippedCount++;
                            lastFlippedSide = 'player';
                            if (fdIdx === 0) flipped._animateFlip = true;
                            triggerFlipFaceUp(flipped, pLine, 'player');
                        }
                    }
                }
            } else if (target === 'any') {
                // Sin filtro + target:'any': evaluar TODAS las cartas descubiertas con función
                // de beneficio para la IA (bidireccional, ambos lados).
                //
                // Beneficio por tipo de flip:
                //   player bocarriba (V) → bocabajo (2):  +(V−2)  [cubre carta de alto valor]
                //   player bocabajo  (2) → bocarriba (V): +(2−V)  [descubre rival, malo si V>2]
                //   AI    bocarriba (V) → bocabajo  (2):  +(2−V)  [gana si V<2, ej. valor 0 o 1]
                //   AI    bocabajo  (2) → bocarriba (V):  +(V−2)  [gana si V>2]
                let bestCardObj = null, bestLine = null, bestSide = null, bestBenefit = -Infinity;

                ['player', 'ai'].forEach(side => {
                    LINES.forEach(line => {
                        const stack = gameState.field[line][side];
                        if (stack.length === 0) return;
                        const topCard = stack[stack.length - 1];
                        if (opts.excludeCardName && topCard.card.nombre === opts.excludeCardName) return;
                        if (typeof getPersistentModifiers === 'function' && getPersistentModifiers(topCard).preventFlip) return;

                        const benefit = !topCard.faceDown
                            ? (side === 'player' ? topCard.card.valor - 2 : 2 - topCard.card.valor)
                            : (side === 'ai'     ? topCard.card.valor - 2 : 2 - topCard.card.valor);

                        if (benefit > bestBenefit) {
                            bestBenefit = benefit;
                            bestCardObj = topCard; bestLine = line; bestSide = side;
                        }
                    });
                });

                if (bestCardObj !== null) {
                    bestCardObj.faceDown = !bestCardObj.faceDown;
                    flippedCount++;
                    lastFlippedSide = bestSide;
                    if (!bestCardObj.faceDown) {
                        bestCardObj._animateFlip = true;
                        triggerFlipFaceUp(bestCardObj, bestLine, bestSide);
                    }
                }
            } else {
                // Sin filtro + target específico: usar lógica existente (aiPickFlipLine).
                const line = aiPickFlipLine(actualTarget);
                if (line !== null) {
                    const stack = gameState.field[line][actualTarget];
                    if (actualTarget === 'player') {
                        const topCard = stack[stack.length - 1];
                        if (!(typeof getPersistentModifiers === 'function' && getPersistentModifiers(topCard).preventFlip)) {
                            topCard.faceDown = !topCard.faceDown;
                            flippedCount++;
                            if (!topCard.faceDown) {
                                topCard._animateFlip = true;
                                triggerFlipFaceUp(topCard, line, actualTarget);
                            }
                        }
                    } else {
                        const fdIdx = [...stack].reverse().findIndex(c => c.faceDown);
                        if (fdIdx >= 0) {
                            const flipped = stack[stack.length - 1 - fdIdx];
                            flipped.faceDown = false;
                            flippedCount++;
                            if (fdIdx === 0) flipped._animateFlip = true;
                            triggerFlipFaceUp(flipped, line, actualTarget);
                        }
                    }
                }
            }
        }
        // Solo logar si realmente ocurrió al menos un flip.
        // El log genérico del final de la función no se debe emitir para flip.
        updateUI();
        if (flippedCount > 0) {
            const triggerLabel = gameState.currentTriggerCard ? ` [${gameState.currentTriggerCard}]` : '';
            const whoLabel = lastFlippedSide === 'player' ? 'tu carta' : 'su carta';
            logEvent(`IA volteó ${flippedCount > 1 ? `${flippedCount} cartas` : whoLabel}${triggerLabel}`, { isAI: true });
        }
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    } else if (type === 'shift') {
        for (let i = 0; i < count; i++) {
            // Move top card from weakest line to where it helps most
            const sourceLine = aiLowestScoreLine(actualTarget);
            if (!sourceLine) continue;
            const sourceStack = gameState.field[sourceLine][actualTarget];
            const sourceTop = sourceStack[sourceStack.length - 1];
            if (sourceTop && typeof getPersistentModifiers === 'function' && getPersistentModifiers(sourceTop).preventShift) continue;
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
                    if (window.animCardEliminate) window.animCardEliminate(best.card.id, null);
                    gameState.field[bestLine][actualTarget].splice(bestIdx, 1);
                    if (typeof applyReturnToHand === 'function') applyReturnToHand(dest, best.card);
                    else gameState[dest].hand.push(best.card);
                    triggerUncovered(bestLine, actualTarget);
                }
            } else {
                const line = aiHighestScoreLine(actualTarget);
                if (line !== null) {
                    const cardObj = gameState.field[line][actualTarget].pop();
                    if (window.animCardEliminate) window.animCardEliminate(cardObj.card.id, null);
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
                    logEvent('IA reorganizó sus Protocolos estratégicamente', { isAI: true });
                    updateUI();
                }
            }
        }
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    }

    if (type === 'revealField') {
        // IA revela una carta bocabajo: preferir las del rival para ganar info
        const targets = target === 'any' ? ['player', 'ai'] : [actualTarget];
        let best = null, bestLine = null, bestSide = null;
        // Primero intentar carta bocabajo del jugador (más info para la IA)
        for (const p of ['player', 'ai']) {
            if (!targets.includes(p)) continue;
            LINES.forEach(l => {
                gameState.field[l][p].forEach(c => {
                    if (c.faceDown && (!best || c.card.valor > best.card.valor)) {
                        best = c; bestLine = l; bestSide = p;
                    }
                });
            });
            if (best) break;
        }
        if (best) {
            gameState.lastRevealedCard = { cardObj: best, line: bestLine, target: bestSide };
            logEvent(`IA revela ${best.card.nombre} (bocabajo) [${gameState.currentTriggerCard || ''}]`, { isAI: true });
        }
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    }

    const typeLabels = { discard: 'descartó', eliminate: 'eliminó', flip: 'volteó', shift: 'cambió de línea', return: 'devolvió a mano' };
    const whoLabel = actualTarget === 'player' ? 'tu carta' : 'su carta';
    const triggerLabel = gameState.currentTriggerCard ? ` [${gameState.currentTriggerCard}]` : '';
    logEvent(`IA ${typeLabels[type] || type} ${whoLabel}${triggerLabel}`, { isAI: true });
    if (typeof processAbilityEffect === 'function') processAbilityEffect();
}

function draw(target, count) {
    let drawn = 0;
    for (let i = 0; i < count; i++) {
        if (drawCard(target)) drawn++;
    }
    if (drawn > 0) {
        gameState[target].drawnSinceLastCheck = true;
        const drawOrigin = gameState.currentTriggerCard ? `${gameState.currentTriggerCard}: ` : '';
        logEvent(`${drawOrigin}${target === 'player' ? 'robas' : 'IA roba'} ${drawn} carta${drawn !== 1 ? 's' : ''}`, { isAI: target === 'ai' });
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
            gameState[target].discardedSinceLastCheck = true;
            discarded++;
        }
    }
    if (discarded > 0) {
        const discardOrigin = gameState.currentTriggerCard ? `${gameState.currentTriggerCard}: ` : '';
        logEvent(`${discardOrigin}${target === 'player' ? 'descartas' : 'IA descarta'} ${discarded} carta${discarded !== 1 ? 's' : ''}`, { isAI: target === 'ai' });
        updateUI();
        if (typeof onOpponentDiscardEffects === 'function') onOpponentDiscardEffects(target);
        // onOwnDiscard: Corrupción 2 reactiva cuando el dueño descarta
        if (typeof onOwnDiscardEffects === 'function') onOwnDiscardEffects(target);
        // onForcedDiscard solo aplica cuando es el turno del oponente (descarte forzado por efecto)
        if (typeof onForcedDiscardEffects === 'function' && gameState.turn && gameState.turn !== target) {
            onForcedDiscardEffects(target);
        }
    }
    // El llamador es responsable de continuar la cadena (processAbilityEffect o finishEffect)
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
        updateStatus("Elige línea para colocar la carta bocabajo...");
        console.log('📍 Selection mode ON - choose line for face-down play');
        highlightSelectableLines(null, 'player');
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
        updateStatus("Espíritu 1: elige línea para colocar la carta bocarriba...");
        highlightSelectableLines(null, 'player');
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
                window.scrTxt ? window.scrTxt(confirmMsg, `${card.nombre}: ¿Jugar en tu lado (SÍ) o en el lado rival (NO)?`, { duration: 1.0 }) : (confirmMsg.textContent = `${card.nombre}: ¿Jugar en tu lado (SÍ) o en el lado rival (NO)?`);
                btnYes.onclick = () => {
                    confirmArea.classList.add('hidden');
                    gameState.selectionMode = true;
                    gameState.selectionModeFaceUp = true;
                    gameState.playOnSide = 'player';
                    updateStatus(`${card.nombre}: elige línea en tu lado...`);
                    highlightSelectableLines(null, 'player');
                };
                btnNo.onclick = () => {
                    confirmArea.classList.add('hidden');
                    gameState.selectionMode = true;
                    gameState.selectionModeFaceUp = true;
                    gameState.playOnSide = 'opponent';
                    updateStatus(`${card.nombre}: elige línea en el lado rival...`);
                    highlightSelectableLines(null, 'ai');
                };
            }
        } else {
            // Caos 3: esta carta puede jugarse en cualquier línea (lado propio)
            console.log(`✅ Playing face-up (playAnywhere): ${card.nombre}`);
            gameState.selectionMode = true;
            gameState.selectionModeFaceUp = true;
            updateStatus(`${card.nombre}: elige línea para colocar la carta bocarriba...`);
            highlightSelectableLines(null, 'player');
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

// === STACK TARGETING — revertir: borrar highlightSelectableLines + clearSelectionHighlights + llamadas ===
// side: 'player' | 'ai' | null — dimea el lado que NO es objetivo mediante side-targeting-*
// excludeLine: línea a excluir (shift); si es null, solo se usa side-targeting (jugar carta)
function highlightSelectableLines(excludeLine, side, allowedLines) {
    const gc = document.getElementById('game-container');
    if (!gc) return;
    if (excludeLine != null) {
        // Shift: dimea columna excluida completa + el lado contrario en columnas válidas
        gc.classList.add('stack-targeting');
        const lines = allowedLines || LINES;
        lines.forEach(line => {
            if (line === excludeLine) return;
            const lineEl = document.getElementById(`line-${line}`);
            const col = lineEl ? lineEl.closest('.battle-column') : null;
            if (col) col.classList.add('stack-target');
        });
    }
    // Dimear el lado incorrecto (visual, no bloquea clicks de columna)
    if (side === 'ai')     gc.classList.add('side-targeting-player');
    if (side === 'player') gc.classList.add('side-targeting-ai');
}

function clearSelectionHighlights() {
    const gc = document.getElementById('game-container');
    gc?.classList.remove('stack-targeting', 'side-targeting-ai', 'side-targeting-player'); // === STACK TARGETING ===
    document.querySelectorAll('.battle-column.stack-target').forEach(el => el.classList.remove('stack-target')); // === STACK TARGETING ===
    document.querySelectorAll('.selectable-line').forEach(el => el.classList.remove('selectable-line'));
}

function finalizePlay(targetLine, isFaceDown) {
    // ⚠️ BLOQUEO: Marcar como en proceso para evitar doble click
    if (gameState.isProcessing) {
        console.warn('⛔ finalizePlay blocked — already processing');
        return;
    }
    gameState.isProcessing = true;
    
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
    insertCardIntoStack(gameState.field[targetLine][targetSide], playedCard);
    checkDeleteOnCover(targetLine, targetSide);
    window._animPendingField = { line: targetLine, target: targetSide };
    updateUI(); // Sincronizar DOM antes de disparar efectos — animación de entrada empieza aquí

    // Delay para que la animación de entrada sea visible antes de que aparezca el modal
    setTimeout(() => {
        console.log(`✅ Card played: ${card.nombre} on ${targetLine} (${isFaceDown ? 'face-down' : 'face-up'})`);
        logEvent(`${isFaceDown ? '[bocabajo]' : card.nombre} en ${targetLine}`, { isAI: false });

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
            gameState.isProcessing = false; // desbloquear UI para que el jugador pueda jugar la carta extra
            console.log(`🎴 playCard effect resolved — player can now play extra card`);
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
    }, 1000);
}

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
    const handBefore = gameState.player.hand.length;
    while(gameState.player.hand.length < 5) {
        if(!drawCard('player')) break;
    }
    const drawn = gameState.player.hand.length - handBefore;
    if (drawn > 0) window.queueAnim?.({ type: 'handCard', count: drawn });
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
        logEvent("IA recarga su mazo", { isAI: true });
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
            logEvent("IA recarga su mazo (sin jugadas posibles)", { isAI: true });
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
        // Delay de 400ms: da tiempo a la animación CSS de entrada de carta y mejora legibilidad de la jugada
        executeAIMove(move);
        console.log('Estado final del juego tras movimiento de IA:', JSON.stringify(gameState));
        setTimeout(() => endTurn('ai'), 1200);

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
        window._animPendingField = { line: targetLine, target: 'ai' };
        updateUI();
        logEvent(`IA: ${isFaceDown ? '[bocabajo]' : movedCard.nombre + ' bocarriba'} en ${targetLine}`, { isAI: true });
        console.log('Estado final del juego tras fallback aleatorio:', JSON.stringify(gameState));
    } else {
        console.error('❌ Fallback aleatorio falló: No hay líneas disponibles');
    }
    setTimeout(() => endTurn('ai'), 600);
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

    insertCardIntoStack(gameState.field[move.line][landSide], {
        card: movedCard,
        faceDown: !move.faceUp
    });
    checkDeleteOnCover(move.line, landSide);
    window._animPendingField = { line: move.line, target: landSide };
    updateUI();

    const sideText = landSide !== 'ai' ? ' (lado rival)' : '';
    const faceText = move.faceUp ? 'bocarriba' : 'bocabajo';
    const cardNameText = move.faceUp ? movedCard.nombre : '[bocabajo]';
    logEvent(`IA: ${cardNameText} ${faceText} en ${move.line}${sideText}`, { isAI: true });
    
    // Delay para que la animación de entrada sea visible antes de ejecutar efectos
    setTimeout(() => {
        if (move.faceUp) {
            gameState.currentEffectLine = move.line;
            executeEffect(movedCard, 'ai');
        }
        if (typeof onOpponentPlayInLineEffects === 'function') onOpponentPlayInLineEffects('ai', move.line);
    }, 600);
}

function endTurn(who) {
    if (gameState.phase === 'game_over') return;
    console.log(`⏸️ Ending turn for ${who}`);

    // ⚠️ BLOQUEO: Resetear isProcessing al terminar el turno
    gameState.isProcessing = false;
    
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
                gameState.ai.discardedSinceLastCheck = true;
            }
            // I-03: cache discard fires reactive discard effects + onCacheClear (ej. Velocidad 1)
            if (typeof onOpponentDiscardEffects === 'function') onOpponentDiscardEffects('ai');
            if (typeof onOwnDiscardEffects === 'function') onOwnDiscardEffects('ai');
            if (typeof onCacheClearEffects === 'function') onCacheClearEffects('ai');
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

    if (gameState.pendingEndTriggers && gameState.pendingEndTriggers.length > 0) {
        gameState.pendingEndTurnWho = who;
        if (typeof processNextEndTrigger === 'function') processNextEndTrigger(who);
        return;
    }

    continueAfterEndEffects(who);
}

function continueAfterEndEffects(who) {
    // I-01: Tiempo 2 onDeckShuffle — dispara DESPUÉS del refresh+caché, no durante el robo
    if (gameState.pendingDeckShuffle && gameState.pendingDeckShuffle.length > 0) {
        const pending = gameState.pendingDeckShuffle;
        gameState.pendingDeckShuffle = [];
        if (typeof onDeckShuffleEffects === 'function') {
            pending.forEach(p => onDeckShuffleEffects(p));
        }
    }

    // Actualizar (Refresh): dispara onRefresh + onOpponentRefresh para cartas en mesa (Guerra 0, Amor 4, etc.)
    if (gameState.refreshedThisTurn === who) {
        gameState.refreshedThisTurn = null;
        // Control Component: ofrecer reorganización al actualizar antes de los efectos de refresh
        if (gameState.controlComponent === who) {
            offerControlRearrange(who, 'doRefreshAndContinue');
            return;
        }
        if (typeof onRefreshEffects === 'function') onRefreshEffects(who);
        if (typeof onOpponentRefreshEffects === 'function') onOpponentRefreshEffects(who);
        // Refresh cuenta como draw — disparar onOpponentDraw de cartas del oponente (ej. Espejo 4, Guerra 0)
        if (typeof onOpponentDrawEffects === 'function') onOpponentDrawEffects(who);
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

/**
 * Muestra un mensaje en el status bar.
 * Las instrucciones interactivas usan setInstruction() — alias de esta función.
 * No escribe en #game-log: el log solo recibe eventos permanentes (logEvent).
 */
function updateStatus(msg) {
    updateTurnVisuals(); // actualiza overlay classes + texto genérico del bar
    const bar = document.getElementById('game-status');
    if (!bar) return;
    // Sobreescribir el texto genérico con el mensaje específico
    if (typeof window.scrTxt === 'function') window.scrTxt(bar, msg, { duration: 0.8, chars: 'upperCase' });
    else bar.textContent = msg;
}

/**
 * Fase "pending" del status bar: muestra instrucción interactiva con estilo de espera.
 * Alias de updateStatus — el pulsing lo activa automáticamente gs-effect (vía updateTurnVisuals)
 * cuando hay un effectContext activo.
 */
function setInstruction(msg) {
    updateStatus(msg);
}
window.setInstruction = setInstruction;

/**
 * Fase "resolved" del status bar: muestra confirmación breve del resultado de una acción.
 * Se borra automáticamente tras 1.5s restaurando el estado normal del turno.
 *
 * @param {string} msg - Mensaje de confirmación (ej. "Fuego 3 → izquierda")
 */
function confirmAction(msg) {
    const bar = document.getElementById('game-status');
    if (!bar) return;
    if (typeof window.scrTxt === 'function') window.scrTxt(bar, msg, { duration: 0.6, chars: 'upperCase' });
    else bar.textContent = msg;
    bar.className = 'gs-confirm';
    if (window._gsConfirmTimer) clearTimeout(window._gsConfirmTimer);
    window._gsConfirmTimer = setTimeout(() => {
        updateTurnVisuals(); // restaura estado de turno apropiado
    }, 1500);
}
window.confirmAction = confirmAction;

/**
 * Registra un evento permanente en el log del juego.
 * A diferencia de updateStatus(), logEvent():
 * - Solo escribe en el log (no llama a updateTurnVisuals)
 * - Los mensajes siempre incluyen el nombre de carta cuando hay una involucrada
 * - Usar gameState.currentTriggerCard como prefijo de origen cuando corresponda
 *
 * @param {string} msg       - Mensaje del evento
 * @param {object} [opts]    - { icon?: string, isAI?: boolean }
 */
function logEvent(msg, { icon, isAI } = {}) {
    const log = document.getElementById('game-log');
    if (!log) return;

    const _isAI = isAI !== undefined ? isAI : gameState.turn === 'ai';
    let _icon = icon || (_isAI ? '▸' : '▹');
    let color  = _isAI ? '#9b59b6' : '#FFD93D';

    if (msg.includes('compiló') || msg.includes('compilaste') || msg.includes('compilado')) {
        _icon = '⚡'; color = '#FFE150';
    } else if (msg.includes('roba') || msg.includes('Robas')) {
        _icon = '🎴';
    } else if (msg.includes('descarta') || msg.includes('Descartas')) {
        _icon = '🗑️';
    } else if (msg.includes('elimina') || msg.includes('Elimina')) {
        _icon = '💀'; color = '#ef4444';
    } else if (msg.includes('voltea') || msg.includes('Voltea')) {
        _icon = '🔄';
    }

    const entry = document.createElement('div');
    entry.style.cssText = `color:${color};font-size:0.85em;line-height:1.4;padding:4px 8px;border-left:3px solid ${color};margin-bottom:2px;border-radius:0 4px 4px 0;display:flex;gap:8px;align-items:flex-start;animation:fadeInLog 0.3s ease-out;`;
    entry.innerHTML = `<span style="opacity:0.7;flex-shrink:0;">${_icon}</span> <span style="flex:1;">${msg}</span>`;

    const prev = log.querySelector('.log-latest');
    if (prev) prev.classList.remove('log-latest');
    entry.classList.add('log-latest');
    log.appendChild(entry);
    log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });

    gameState.actionLog.push({ isAI: _isAI, icon: _icon, msg });
    if (gameState.actionLog.length > 50) gameState.actionLog.shift();

    // Actualiza el status bar directamente, pero solo si no hay instrucción interactiva pendiente.
    // Cuando hay effectContext activo el jugador está eligiendo — no pisar la instrucción.
    if (!gameState.effectContext) {
        const bar = document.getElementById('game-status');
        if (bar) {
            if (typeof window.scrTxt === 'function') window.scrTxt(bar, msg, { duration: 1.0, chars: 'upperCase' });
            else bar.textContent = msg;
            bar.className = _isAI ? 'gs-ai' : 'gs-player';
            if (window._gsConfirmTimer) { clearTimeout(window._gsConfirmTimer); window._gsConfirmTimer = null; }
        }
    }
}
window.logEvent = logEvent;

function updateHandSidePanels() {
    const overlay = document.getElementById('hand-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    _updateHandSidePanel('player');
    _updateHandSidePanel('ai');
    _updateUnifiedLog();
}

function _updateHandSidePanel(side) {
    const isAI = side === 'ai';
    const fanEl = document.getElementById(isAI ? 'hs-fan-ai' : 'hs-fan-player');
    if (!fanEl) return;

    const trash = gameState[side].trash;
    const accentVar = isAI ? 'var(--ui-pink)' : 'var(--player-primary)';

    // --- Pila de descarte: carta superior real + badge contador ---
    const discardBlock = trash.length === 0
        ? `<div class="hs-fan-title" style="color:${accentVar};">DESCARTE</div>
           <div class="hs-fan-empty">vacío</div>`
        : `<div class="hs-fan-title" style="color:${accentVar};">DESCARTE</div>
           <div class="hs-discard-card-wrap" title="Ver cementerio completo">
               <div class="hs-discard-card-clip">${createCardHTML(trash[trash.length - 1])}</div>
               <div class="hs-discard-badge" style="border-color:${accentVar};color:${accentVar};">${trash.length}</div>
           </div>`;

    // --- Mazo: dorso real + badge contador ---
    const deck = gameState[side].deck;
    const topDeckCard = deck.length > 0 ? deck[deck.length - 1] : null;
    const deckBlock = deck.length === 0
        ? `<div class="hs-fan-title" style="color:${accentVar};">MAZO</div>
           <div class="hs-fan-empty">vacío</div>`
        : `<div class="hs-fan-title" style="color:${accentVar};">MAZO</div>
           <div class="hs-discard-card-wrap">
               <div class="hs-discard-card-clip">${createCardHTML(topDeckCard, true)}</div>
               <div class="hs-discard-badge" style="border-color:${accentVar};color:${accentVar};">${deck.length}</div>
           </div>`;

    fanEl.innerHTML = discardBlock + deckBlock;
    const discardWrap = fanEl.querySelector('.hs-discard-card-wrap');
    if (discardWrap && trash.length > 0) {
        discardWrap.onclick = () => showDiscardModal(side);
    }
}

function _updateUnifiedLog() {
    const entriesEl = document.getElementById('hs-unified-entries');
    if (!entriesEl) return;
    const log = gameState.actionLog;
    if (log.length === 0) {
        entriesEl.innerHTML = `<div class="hs-log-entry" style="color:var(--ui-dim);">—</div>`;
        return;
    }
    entriesEl.innerHTML = log.map((e, i) => {
        const color = e.isAI ? 'rgba(155,89,182,0.9)' : 'rgba(255,217,61,0.9)';
        const latest = i === log.length - 1 ? 'hs-log-latest' : '';
        return `<div class="hs-log-entry ${latest}" style="border-left-color:${color};color:${color};">
            ${e.icon} ${e.msg}
        </div>`;
    }).join('');
    entriesEl.scrollTop = entriesEl.scrollHeight;
}

function showDiscardModal(side) {
    const trash = gameState[side].trash;
    const modal     = document.getElementById('reveal-modal');
    const title     = document.getElementById('reveal-title');
    const subtitle  = document.getElementById('reveal-subtitle');
    const container = document.getElementById('reveal-cards-container');
    const closeBtn  = document.getElementById('btn-reveal-close');
    if (!modal || !container) return;

    title.textContent    = side === 'player' ? 'CEMENTERIO — JUGADOR' : 'CEMENTERIO — IA';
    subtitle.textContent = `${trash.length} carta${trash.length !== 1 ? 's' : ''} descartadas`;
    container.innerHTML  = trash.length === 0
        ? `<div style="color:var(--ui-dim);padding:20px;font-family:'JetBrains Mono',monospace;font-size:12px;">Vacío</div>`
        : [...trash].reverse().map(c => `<div class="reveal-card-select no-select">${createCardHTML(c)}</div>`).join('');

    closeBtn.textContent = 'CERRAR';
    closeBtn.onclick = () => modal.classList.add('hidden');
    modal.classList.remove('hidden');
}
window.showDiscardModal = showDiscardModal;

function checkWinCondition() {
    if (gameState.phase === 'game_over') return;
    if (gameState.player.compiled.length >= 3) {
        gameState.phase = 'game_over';
        showGameOver(true);
    } else if (gameState.ai.compiled.length >= 3) {
        gameState.phase = 'game_over';
        showGameOver(false);
    }
}

function showGameOver(playerWon) {
    const modal = document.getElementById('game-over-modal');
    const titleEl = document.getElementById('game-over-title');
    const reasonEl = document.getElementById('win-reason');
    const statsEl = document.getElementById('win-stats');

    if (titleEl) { window.scrTxt ? window.scrTxt(titleEl, playerWon ? '¡VICTORIA!' : 'DERROTA', { duration: 1.0, chars: 'upperCase' }) : (titleEl.textContent = playerWon ? '¡VICTORIA!' : 'DERROTA'); }
    if (titleEl) titleEl.style.color = playerWon ? '#00ff41' : '#ef4444';

    const _reasonText = playerWon ? 'Compilaste los 3 protocolos. ¡Bien jugado!' : 'La IA compiló sus 3 protocolos primero.';
    if (reasonEl) { window.scrTxt ? window.scrTxt(reasonEl, _reasonText, { duration: 1.0, chars: 'upperCase' }) : (reasonEl.textContent = _reasonText); }

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
    const available = Object.keys(PROTOCOL_DEFS).filter(p => !draftState.pickedSet.has(p));
    if (available.length === 0) return;

    const choice = aiScoreDraftProtocol(available);
    applyPick('a', choice);
    advanceDraft();
}

function aiScoreDraftProtocol(available) {
    // Tier list basada en el canal de estrategia de la comunidad.
    // Fuente: Discord strategy chat — análisis de jugadores experimentados.
    const META_TIER = {
        // Tier S — consistentemente fuertes
        'Velocidad': 30, 'Psique': 28, 'Plaga': 26, 'Luz': 25, 'Fuego': 24, 'Vida': 24,
        // Tier A — fuertes con contexto
        'Gravedad': 18, 'Espíritu': 16, 'Agua': 18, 'Oscuridad': 15,
        'Muerte': 14, 'Odio': 14, 'Amor': 14,
        // Main 2 conocidos
        'Corrupción': 20, 'Miedo': 18, 'Asimilación': 16, 'Caos': 15,
        'Claridad': 16, 'Diversidad': 14, 'Valor': 15, 'Hielo': 13,
        'Espejo': 18, 'Tiempo': 13, 'Unidad': 14, 'Guerra': 13,
        'Paz': 8, 'Humo': 12, 'Suerte': 10,
        // Tier B/C — situacionales o débiles
        'Metal': 8, 'Apatía': 9,
    };

    // Sinergias explícitas del chat de estrategia.
    // Par A+B → bonus cuando la IA ya tiene A y considera B (o viceversa).
    const SYNERGIES = [
        { pair: ['Fuego', 'Luz'],        bonus: 20 }, // "Fire needs to discard, Light gives draw"
        { pair: ['Fuego', 'Corrupción'], bonus: 22 }, // "So strong" — discard heavy
        { pair: ['Psique', 'Plaga'],     bonus: 20 }, // classic discard synergy
        { pair: ['Vida', 'Agua'],        bonus: 16 }, // pacing control
        { pair: ['Vida', 'Metal'],       bonus: 14 }, // designer's combo
        { pair: ['Agua', 'Metal'],       bonus: 14 }, // idem
        { pair: ['Amor', 'Asimilación'], bonus: 16 }, // "strongest deck stealer combo"
        { pair: ['Amor', 'Gravedad'],    bonus: 14 }, // idem
        { pair: ['Asimilación', 'Gravedad'], bonus: 14 },
        { pair: ['Luz', 'Psique'],       bonus: 14 }, // draw + discard
        { pair: ['Luz', 'Plaga'],        bonus: 14 }, // draw + discard
    ];

    // Contrapicks identificados en el chat.
    // Si el jugador tiene A, coger B para contrarrestarlo.
    const COUNTERPICKS = [
        { playerHas: 'Gravedad', aiPick: 'Metal',   bonus: 20 }, // "Metal best counter to Gravity"
        { playerHas: 'Gravedad', aiPick: 'Muerte',  bonus: 14 }, // "Death 2 best play vs Grav 0"
        { playerHas: 'Espíritu', aiPick: 'Oscuridad', bonus: 12 }, // Darkness disrupts Spirit combos
    ];

    const scores = available.map(proto => {
        let score = 0;

        // 1. Tier base del meta
        score += META_TIER[proto] ?? 12;

        // 2. Sinergias con picks propios ya realizados
        SYNERGIES.forEach(({ pair, bonus }) => {
            if (pair.includes(proto)) {
                const partner = pair.find(p => p !== proto);
                if (draftState.aiPicks.includes(partner)) score += bonus;
            }
        });

        // 3. Contrapicks según lo que tiene el jugador
        COUNTERPICKS.forEach(({ playerHas, aiPick, bonus }) => {
            if (aiPick === proto && draftState.playerPicks.includes(playerHas)) score += bonus;
        });

        // 4. Penalizar si el jugador ya tiene este protocolo (no podemos cogérselo,
        //    pero sí evitar elegir uno con misma función si él ya la cubre)
        if (draftState.playerPicks.includes(proto)) score -= 50; // no debería ocurrir pero salvaguarda

        // 5. Evitar solapamiento funcional con picks propios
        //    (tres protocolos de robo puro sin control = mano llena, sin presencia en mesa)
        const ownDrawCount = draftState.aiPicks.filter(p =>
            (META_TIER[p] ?? 0) >= 20 && ['Luz', 'Fuego', 'Psique', 'Velocidad', 'Oscuridad'].includes(p)
        ).length;
        if (ownDrawCount >= 2 && ['Luz', 'Fuego', 'Psique', 'Velocidad', 'Oscuridad'].includes(proto)) {
            score -= 15;
        }

        // 6. Ruido pequeño para variedad entre partidas (no predecible 100%)
        score += Math.random() * 6;

        return { proto, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0].proto;
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

    // Resetear contadores a "0" y limpiar data-scr-last para que el primer updateUI()
    // anime desde un estado conocido (evita valores de sesión anterior visibles al arrancar)
    ['player-deck-count','player-trash-count','ai-deck-count','ai-trash-count','ai-hand-count','hand-count-badge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = '0'; el.removeAttribute('data-scr-last'); }
    });
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
