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
    pendingEndTurnFor: null, // set when endTurn is waiting for interactive discard
    pendingTurnEnd: null,    // set when finalizePlay is waiting for effects to resolve
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
        lineEl.onclick = () => {
            if (gameState.selectionMode) {
                finalizePlay(line, !gameState.selectionModeFaceUp);
                gameState.selectionModeFaceUp = false;
            } else if (gameState.effectContext && gameState.effectContext.waitingForLine) {
                handleShiftTargetLine(line);
            }
        };
    });
}

function handleShiftTargetLine(destinationLine) {
    const ctx = gameState.effectContext;

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
        // Espíritu 3: mover la carta desde sourceLine a destinationLine (cancelar si misma línea)
        if (ctx.sourceLine !== destinationLine) {
            const stack = gameState.field[ctx.sourceLine][ctx.target];
            const idx = stack.findIndex(c => c.card.nombre === 'Espíritu 3');
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
            <div class="card-back-title">COMPILE</div>
            <div class="card-back-value">2</div>
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
    if (ui.playerHand) ui.playerHand.innerHTML = gameState.player.hand.map(c => createCardHTML(c)).join('');
    // AI hand: just show count
    const aiHandCountEl = document.getElementById('ai-hand-count');
    if (aiHandCountEl) {
        const n = gameState.ai.hand.length;
        aiHandCountEl.textContent = n;
        aiHandCountEl.style.color = n === 0 ? '#ef4444' : '#00ff41';
    }
    
    // Attach events to player hand
    document.querySelectorAll('#player-hand .card').forEach((cardEl, index) => {
        cardEl.onclick = () => {
            console.log(`🖱️ Card clicked at index ${index}. gameState.turn=${gameState.turn}, phase=${gameState.phase}, effectContext=${gameState.effectContext ? gameState.effectContext.type : 'none'}`);
            if (gameState.effectContext && gameState.effectContext.type === 'discard') {
                console.log(`   → Handling discard choice`);
                handleDiscardChoice(index);
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

function calculateScore(state, line, target) {
    // Calcular score base
    let score = state.field[line][target].reduce((sum, cardObj) => {
        return sum + (cardObj.faceDown ? 2 : cardObj.card.valor);
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
    stack.forEach((cardObj, idx) => {
        const cEl = document.createElement('div');
        
        if (cardObj.faceDown) {
            cEl.innerHTML = `<div class="card face-down card-in-field" title="Cara oculta">
                <div class="card-back-title">COMPILE</div>
                <div class="card-back-value">2</div>
            </div>`;
        }
 else {
            cEl.innerHTML = createCardHTML(cardObj.card);
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
    gameState.ignoreEffectsLines = {};
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
    console.log(`📋 Checking compile phase for ${who}`);
    updateStatus(`Fase: Comprobar Compilación`);
    
    let compiledAny = false;
    for (const line of LINES) {
        const myScore = calculateScore(gameState, line, who);
        const oppScore = calculateScore(gameState, line, who === 'player' ? 'ai' : 'player');

        console.log(`  Line ${line}: ${who}=${myScore} vs opp=${oppScore}`);

        if (myScore >= 10 && myScore > oppScore) {
            if (gameState.preventCompile[who] > 0) {
                console.log(`  🚫 Compile blocked for ${who} (${gameState.preventCompile[who]} turns left)`);
                gameState.preventCompile[who]--;
                continue;
            }
            console.log(`  ✅ Compiled: ${line}`);
            compileLine(line, who);
            compiledAny = true;
            break; // Max 1 compile per turn as per rules
        }
    }

    if (compiledAny) {
        updateUI();
        setTimeout(() => endTurn(who), 2000);
    } else {
        console.log(`✅ No compilations, moving to action phase`);
        actionPhase(who);
    }
}

function actionPhase(who) {
    gameState.phase = 'action';
    console.log(`🎮 ACTION PHASE for ${who} - game is now playable`);
    updateStatus(who === 'player' ? 'Tu Turno: Juega una carta o Recarga' : 'IA pensando...');
    
    if (who === 'ai') {
        setTimeout(playAITurn, 1500);
    }
}

function compileLine(line, who) {
    const rival = who === 'player' ? 'ai' : 'player';
    const isFirstCompile = gameState.field[line].compiledBy === null;

    if (isFirstCompile) {
        // Primera compilación de la línea: crédito normal
        gameState.field[line].compiledBy = who;
        updateStatus(`¡${who === 'player' ? 'Has' : 'IA ha'} compilado ${line}!`);
    } else {
        // Compilaciones sucesivas: robar carta superior del mazo rival
        if (gameState[rival].deck.length > 0) {
            const stolenCard = gameState[rival].deck.pop();
            gameState[who].hand.push(stolenCard);
            updateStatus(`¡${who === 'player' ? 'Compilaste' : 'IA compiló'} ${line} y robó una carta rival!`);
        } else {
            updateStatus(`¡${who === 'player' ? 'Compilaste' : 'IA compiló'} ${line}! (mazo rival vacío)`);
        }
    }

    // Crédito de victoria: solo se cuenta una vez por línea por jugador
    if (!gameState[who].compiled.includes(line)) {
        gameState[who].compiled.push(line);
    }

    // Descartar todas las cartas de la línea en ambos lados
    gameState.field[line].player.forEach(c => gameState.player.trash.push(c.card));
    gameState.field[line].ai.forEach(c => gameState.ai.trash.push(c.card));
    gameState.field[line].player = [];
    gameState.field[line].ai = [];
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
    const lineIndex = gameState.player.protocols.indexOf(card.protocol);
    const targetLine = lineIndex !== -1 ? LINES[lineIndex] : null;
    const canPlayUp = targetLine !== null || (typeof hasAllowAnyProtocol === 'function' && hasAllowAnyProtocol('player'));
    
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

function startEffect(type, target, count, opts = {}) {
    // Determine if this should be interactive or automatic
    let isAIResolving = false;
    
    if (type === 'discard' || type === 'give') {
        // En "descartar/dar", el dueño de la mano (target) elige.
        isAIResolving = (target === 'ai');
    } else {
        // En "eliminar/voltear" (tablero), el jugador del turno elige el objetivo en la zona permitida.
        isAIResolving = (gameState.turn === 'ai');
    }

    if (isAIResolving) {
        resolveEffectAI(type, target, count, opts);
        return;
    }

    // Si es descarte/dar del jugador y no tiene cartas, saltar efecto
    if ((type === 'discard' || type === 'give') && target === 'player' && gameState.player.hand.length === 0) {
        console.log(`⏭️ Descarte omitido — mano vacía`);
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    }

    // Si es eliminate/flip/return/shift y no hay cartas válidas en campo, saltar efecto
    if (type === 'eliminate' || type === 'flip' || type === 'return' || type === 'shift') {
        const filterCtx = { filter: opts.filter, maxVal: opts.maxVal, minVal: opts.minVal };
        const linesToCheck = opts.forceLine ? [opts.forceLine] : LINES;
        const targets = target === 'any' ? ['player', 'ai'] : [target];
        const hasValid = linesToCheck.some(l =>
            targets.some(p => {
                const stack = gameState.field[l][p];
                return stack.length > 0 && cardMatchesFilter(stack[stack.length - 1], filterCtx);
            })
        );
        if (!hasValid) {
            console.log(`⏭️ ${type} omitido — sin cartas válidas`);
            if (typeof processAbilityEffect === 'function') processAbilityEffect();
            return;
        }
    }

    gameState.effectContext = { type, target, count, selected: [], ...opts };
    console.log(`🎯 startEffect: type=${type}, target=${target}, count=${count}`);

    let actionVerb = 'VOLTEAR';
    if (type === 'discard') actionVerb = 'DESCARTAR';
    else if (type === 'give') actionVerb = 'DAR AL OPONENTE';
    else if (type === 'eliminate') actionVerb = 'ELIMINAR';
    else if (type === 'return') actionVerb = 'DEVOLVER';
    else if (type === 'shift') actionVerb = 'DESPLAZAR';
    else if (type === 'swap') actionVerb = 'INTERCAMBIAR';
    else if (type === 'rearrange') actionVerb = 'REORGANIZAR';
    
    const targetDesc = target === 'ai' ? ' del OPONENTE' : target === 'player' ? ' TUYAS' : '';
    updateStatus(`COMANDO: Elige ${count} carta(s)${targetDesc} para ${actionVerb}`);
    highlightEffectTargets();
}

function highlightEffectTargets() {
    const ctx = gameState.effectContext;
    if (!ctx) return;

    if (ctx.type === 'discard' || ctx.type === 'give') {
        const hand = document.getElementById('player-hand');
        hand.classList.add('targeting', 'discard-mode');
        const remaining = ctx.count - ctx.selected.length;
        const banner = document.getElementById('discard-banner');
        if (banner) {
            const msg = ctx.type === 'give'
                ? `🤝 Da ${remaining} carta${remaining > 1 ? 's' : ''} al oponente — haz clic en la que quieres dar`
                : `🗑 Descarta ${remaining} carta${remaining > 1 ? 's' : ''} — haz clic en la que quieres descartar`;
            banner.textContent = msg;
            banner.classList.add('visible');
        }
    } else if (ctx.type === 'eliminate' || ctx.type === 'flip' || ctx.type === 'return') {
        const linesToCheck = ctx.forceLine ? [ctx.forceLine] : LINES;
        linesToCheck.forEach(l => {
            ['player', 'ai'].forEach(p => {
                if (ctx.target !== 'any' && ctx.target !== p) return;
                const stack = gameState.field[l][p];
                if (stack.length === 0) return;
                const topCard = stack[stack.length - 1];
                if (cardMatchesFilter(topCard, ctx)) {
                    const stackEl = document.querySelector(`#line-${l} .${p}-stack`);
                    if (stackEl) stackEl.classList.add('targeting');
                }
            });
        });
        const banner = document.getElementById('discard-banner');
        if (banner) {
            const verb = ctx.type === 'flip' ? 'VOLTEAR' : ctx.type === 'return' ? 'DEVOLVER a mano' : 'ELIMINAR';
            const targetDesc = ctx.target === 'any' ? '' : ctx.target === 'ai' ? ' del oponente' : ' tuya';
            banner.textContent = `⚡ Elige ${ctx.count} carta${ctx.count > 1 ? 's' : ''}${targetDesc} para ${verb} — haz clic en la carta del campo`;
            banner.classList.add('visible');
        }
    } else if (ctx.type === 'rearrange') {
        const owner = (ctx.target === 'opponent' || ctx.target === 'ai') ? 'ai' : 'player';
        const suffix = owner === 'player' ? 'player' : 'ai';
        LINES.forEach(l => {
            const protoEl = document.getElementById(`proto-${l}-${suffix}`);
            if (protoEl) {
                protoEl.classList.add('targeting');
                protoEl.style.cursor = 'pointer';
                protoEl.onclick = () => handleFieldCardClick(l, owner, 0);
            }
        });
        const banner = document.getElementById('discard-banner');
        if (banner) {
            banner.textContent = ctx.firstProtocol
                ? `🔀 Protocolo seleccionado: ${ctx.firstProtocol} — elige el segundo para intercambiar`
                : `🔀 Elige el primer protocolo a intercambiar`;
            banner.classList.add('visible');
        }
    } else if (ctx.type === 'massDeleteByValueRange') {
        LINES.forEach(l => {
            const lineEl = document.getElementById(`line-${l}`);
            if (lineEl) {
                lineEl.classList.add('targeting');
                lineEl.style.cursor = 'pointer';
                lineEl.onclick = () => executeMassDeleteByValueRange(l);
            }
        });
        const banner = document.getElementById('discard-banner');
        if (banner) {
            banner.textContent = `💀 Elige una línea — se eliminarán todas las cartas con valor ${ctx.minVal}-${ctx.maxVal} (incluye bocabajos)`;
            banner.classList.add('visible');
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
    if (ctx.filter === 'maxValue') return !cardObj.faceDown && cardObj.card.valor <= (ctx.maxVal ?? 99);
    if (ctx.filter === 'minValue') return !cardObj.faceDown && cardObj.card.valor >= (ctx.minVal ?? 0);
    return true;
}

function clearEffectHighlights() {
    document.querySelectorAll('.targeting').forEach(el => {
        el.classList.remove('targeting');
        el.style.cursor = '';
        if (el.id && (el.id.startsWith('proto-') || el.id.startsWith('line-'))) el.onclick = null;
    });
    document.getElementById('player-hand')?.classList.remove('discard-mode');
    const banner = document.getElementById('discard-banner');
    if (banner) banner.classList.remove('visible');
}

function handleDiscardChoice(handIndex) {
    const ctx = gameState.effectContext;
    if (!ctx || (ctx.type !== 'discard' && ctx.type !== 'give')) return;

    const card = gameState.player.hand.splice(handIndex, 1)[0];
    if (ctx.type === 'give') {
        gameState.ai.hand.push(card); // dar: va a la mano del rival
    } else {
        gameState.player.trash.push(card); // descartar: va al descarte
    }
    ctx.selected.push(card);

    if (ctx.selected.length >= ctx.count) {
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

function handleFieldCardClick(line, target, cardIdx) {
    const ctx = gameState.effectContext;
    if (!ctx) return;

    // Validate target
    if (ctx.target !== 'any' && ctx.target !== target) return;

    if (ctx.type === 'eliminate') {
        if (ctx.forceLine && line !== ctx.forceLine) return;
        const cardObj = gameState.field[line][target][cardIdx];
        if (!cardMatchesFilter(cardObj, ctx)) return;
        gameState.field[line][target].splice(cardIdx, 1);
        gameState[target].trash.push(cardObj.card);
        ctx.selected.push(cardObj);
    } else if (ctx.type === 'flip') {
        const cardObj = gameState.field[line][target][cardIdx];
        if (ctx.excludeCardName && cardObj.card.nombre === ctx.excludeCardName) return;
        cardObj.faceDown = !cardObj.faceDown;
        gameState.lastFlippedCard = { cardObj, line };
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
        if (!ctx.firstProtocol) {
            ctx.firstProtocol = line;
            highlightEffectTargets(); // actualiza banner con el protocolo seleccionado
            const lineEl = document.getElementById(`line-${line}`);
            if (lineEl) lineEl.classList.add('selected');
        } else {
            const first = ctx.firstProtocol;
            const second = line;
            const firstEl = document.getElementById(`line-${first}`);
            if (firstEl) firstEl.classList.remove('selected');
            if (first !== second) {
                const owner = (ctx.target === 'opponent' || ctx.target === 'ai') ? 'ai' : 'player';
                swapProtocols(first, second, owner);
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
    updateUI();

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

function resolveEffectAI(type, target, count, opts = {}) {
    const actualTarget = (target === 'any') ? (type === 'discard' ? 'ai' : 'player') : target;

    if (type === 'discard') {
        for (let i = 0; i < count; i++) {
            if (gameState[actualTarget].hand.length > 0) {
                gameState[actualTarget].trash.push(gameState[actualTarget].hand.pop());
            }
        }
    } else if (type === 'eliminate') {
        for (let i = 0; i < count; i++) {
            // Construir contexto de filtro temporal para reutilizar cardMatchesFilter
            const filterCtx = { filter: opts.filter, maxVal: opts.maxVal, minVal: opts.minVal };
            const linesToCheck = opts.forceLine ? [opts.forceLine] : LINES;
            const validLines = linesToCheck.filter(l => {
                const stack = gameState.field[l][actualTarget];
                if (stack.length === 0) return false;
                return cardMatchesFilter(stack[stack.length - 1], filterCtx);
            });
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
    if (typeof onDrawEffects === 'function') onDrawEffects(target);
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
    
    console.log(`🎮 playSelectedCard: ${card.nombre} - Face${isFaceDown ? 'Down' : 'Up'}`);
    
    if (isFaceDown) {
        // Enter selection mode for any non-compiled line
        gameState.selectionMode = true;
        updateStatus("Elige una línea para jugar bocabajo...");
        console.log('📍 Selection mode ON - choose line for face-down play');
        highlightSelectableLines();
        return;
    }

    // Face-up play: protocol must match the line (compiled lines allowed)
    // ERRATA Espíritu 1: if allowAnyProtocol is active, any line is valid
    const idx = gameState.player.protocols.indexOf(card.protocol);
    if (idx !== -1) {
        console.log(`✅ Playing face-up: ${card.nombre} on line ${LINES[idx]}`);
        finalizePlay(LINES[idx], false);
    } else if (typeof hasAllowAnyProtocol === 'function' && hasAllowAnyProtocol('player')) {
        console.log(`✅ Playing face-up (any protocol allowed): ${card.nombre}`);
        gameState.selectionMode = true;
        gameState.selectionModeFaceUp = true;
        updateStatus("Espíritu 1 activo — elige cualquier línea para jugar bocarriba...");
        highlightSelectableLines();
    } else {
        console.error("❌ Illegal face-up play: protocol has no matching line", {
            protocol: card.protocol,
        });
    }
}

function highlightSelectableLines() {
    console.log('🎯 Highlighting selectable lines for face-down play');
    LINES.forEach(line => {
        const lineEl = document.getElementById(`line-${line}`);
        if (!lineEl) {
            console.warn(`  ⚠️ Line element not found: line-${line}`);
            return;
        }
        lineEl.classList.add('selectable-line');
        console.log(`  ✅ Highlighted: ${line}`);
    });
}

function clearSelectionHighlights() {
    document.querySelectorAll('.selectable-line').forEach(el => {
        el.classList.remove('selectable-line');
    });
}

function finalizePlay(targetLine, isFaceDown) {
    console.log(`🎲 finalizePlay: line=${targetLine}, faceDown=${isFaceDown}`);
    
    // Compiled lines can still be played on (re-compile rules)
    
    gameState.selectionMode = false;
    clearSelectionHighlights();

    const card = gameState.player.hand[gameState.selectedCardIndex];
    const playedCard = { card: card, faceDown: isFaceDown };

    // Mover carta a campo y quitar de mano antes de disparar cualquier efecto
    const playerStack = gameState.field[targetLine].player;
    const topCardBeforePush = (playerStack.length > 0 && !playerStack[playerStack.length - 1].faceDown)
        ? playerStack[playerStack.length - 1] : null;

    gameState.field[targetLine].player.push(playedCard);
    gameState.player.hand.splice(gameState.selectedCardIndex, 1);
    gameState.selectedCardIndex = null;
    updateUI(); // asegurar que la carta jugada desaparece de la mano antes de cualquier prompt

    // Disparar onCover ahora que la mano ya está actualizada
    if (topCardBeforePush) {
        gameState.currentEffectLine = targetLine;
        triggerCardEffect(topCardBeforePush.card, 'onCover', 'player');
    }

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
    console.log('🔄 Hand refreshed, ending turn');
    endTurn('player');
}

function playAITurn() {
    // FASE 2: IA INTELIGENTE - Minimax + Evaluación Estratégica
    console.log('🤖 IA Turno iniciado');
    console.log('Estado inicial del juego:', JSON.stringify(gameState));

    if (gameState.ai.hand.length === 0) {
        while(gameState.ai.hand.length < 5) drawCard('ai');
        console.log('🤖 IA: Recarga (mano vacía)');
        updateStatus("IA hizo Recarga");
        endTurn('ai');
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
        console.log('Movimientos posibles generados:', possibleMoves);

        if (possibleMoves.length === 0) {
            // Sin movimientos disponibles, recargar
            while(gameState.ai.hand.length < 5) drawCard('ai');
            updateStatus("IA hizo Recarga (sin movimientos)");
            endTurn('ai');
            return;
        }

        // Usar minimax para encontrar el mejor movimiento
        const bestMoveResult = window.miniMax.findBestMove(gameState, possibleMoves);
        console.log('Resultado de Minimax:', bestMoveResult);

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

    if (targetLine) {
        isFaceDown = false;
    } else {
        targetLine = LINES[0]; // fallback: cualquier línea
        isFaceDown = true;
    }

    if (targetLine) {
        const movedCard = gameState.ai.hand.splice(cardIdx, 1)[0];
        gameState.field[targetLine].ai.push({ card: movedCard, faceDown: isFaceDown });
        updateStatus(`IA jugó ${movedCard.nombre} ${isFaceDown ? 'bocabajo' : 'bocarriba'} en ${targetLine}`);
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
            {
                // Movimiento bocarriba (si coincide protocolo, compiled lines allowed)
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
        return; // endTurn se llama en el caller (playAITurn)
    }

    const card = gameState.ai.hand[move.cardIndex];
    const movedCard = gameState.ai.hand.splice(move.cardIndex, 1)[0];

    // Disparar onCover en la carta que quedará cubierta (si existe)
    const aiStack = gameState.field[move.line].ai;
    if (aiStack.length > 0) {
        const topCard = aiStack[aiStack.length - 1];
        if (!topCard.faceDown) {
            gameState.currentEffectLine = move.line;
            triggerCardEffect(topCard.card, 'onCover', 'ai');
        }
    }

    gameState.field[move.line].ai.push({
        card: movedCard,
        faceDown: !move.faceUp
    });
    
    const faceText = move.faceUp ? 'bocarriba' : 'bocabajo';
    updateStatus(`IA jugó ${movedCard.nombre} ${faceText} en ${move.line}`);
    
    // Ejecutar efectos si es bocarriba
    if (move.faceUp) {
        gameState.currentEffectLine = move.line;
        executeEffect(movedCard, 'ai');
    }
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
            updateStatus(`Tienes ${gameState.player.hand.length} cartas — descarta ${excess}`);
            startEffect('discard', 'player', excess);
            return;
        } else {
            // AI discards randomly
            while(gameState.ai.hand.length > 5) {
                gameState.ai.trash.push(gameState.ai.hand.pop());
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

    // Si onTurnEnd dejó efectos interactivos pendientes, esperar a que se resuelvan
    if (gameState.effectContext || gameState.effectQueue.length > 0) {
        gameState.pendingStartTurn = (who === 'player' ? 'ai' : 'player');
        console.log(`⏳ onTurnEnd pendiente — inicio de turno pausado`);
        return;
    }

    console.log(`⏱️ Starting next turn...`);
    setTimeout(() => startTurn(who === 'player' ? 'ai' : 'player'), 1000);
}

function updateStatus(msg) {
    if (gameState.turn === 'player') ui.playerStatus.innerText = msg;
    else ui.aiStatus.innerText = msg;
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

    if (modal) modal.style.display = 'flex';
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

function swapProtocols(lineA, lineB, owner = 'player') {
    const p = gameState[owner].protocols;
    const idxA = LINES.indexOf(lineA);
    const idxB = LINES.indexOf(lineB);
    [p[idxA], p[idxB]] = [p[idxB], p[idxA]];
    initProtocolDisplay();
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
