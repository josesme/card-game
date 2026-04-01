/**
 * 🎴 COMPILE - Card Effects Engine (REFACTORED)
 * Efectos atómicos reutilizables + composición
 * 
 * REGLA DE ORO:
 * 1. Efectos atómicos (reveal, shift, flip, discard, draw, eliminate)
 * 2. Composición de efectos para cartas específicas
 * 3. Handlers genéricos delegan a efectos atómicos
 */

/**
 * Efectos atómicos reutilizables
 * Cada efecto tiene:
 * - setup(ctx, config) → configura effectContext
 * - execute(params) → ejecuta el efecto
 * - onComplete(callback) → callback cuando completa
 */
const AtomicEffects = {
    
    /**
     * REVEAL: Revelar carta bocabajo (muestra identidad sin cambiar estado)
     */
    reveal: {
        setup: function(ctx, config) {
            return {
                type: 'reveal',
                target: config.target || 'any',      // 'any' | 'player' | 'ai'
                filter: config.filter || 'faceDown', // 'faceDown' | 'covered'
                onSelect: config.onSelect            // Callback cuando selecciona carta
            };
        },
        
        execute: function(cardObj, line, target, ctx) {
            if (!cardObj.faceDown) return false;
            
            // Mostrar preview bocarriba
            if (typeof showCardPreview === 'function') {
                showCardPreview(cardObj.card, true);
            }
            
            // Callback personalizado (ej: mostrar modal de elección)
            if (ctx.onSelect) {
                ctx.onSelect(cardObj, line, target);
            }
            
            return true;
        }
    },
    
    /**
     * SHIFT: Mover carta de una línea a otra
     */
    shift: {
        setup: function(ctx, config) {
            return {
                type: 'shift',
                target: config.target,           // 'player' | 'ai' | 'any'
                count: config.count || 1,
                filter: config.filter,           // 'faceDown' | etc.
                excludeLine: config.excludeLine, // Línea que no puede ser destino
                onComplete: config.onComplete    // Callback cuando completa shift
            };
        },
        
        execute: function(cardObj, line, target, cardIdx, ctx) {
            // Setup para esperar selección de línea destino
            ctx.selectedCard = { line, target, cardIdx };
            ctx.waitingForLine = true;
            
            if (typeof clearEffectHighlights === 'function') {
                clearEffectHighlights();
            }
            
            updateStatus(`Elige línea destino para mover la carta...`);
            if (typeof highlightSelectableLines === 'function') {
                highlightSelectableLines();
            }
            
            // Handler se ejecutará en handleShiftTargetLine
            return 'pending'; // Indica que espera más input
        },
        
        onLineSelected: function(cardObj, sourceLine, destLine, target, ctx) {
            if (sourceLine === destLine) return false;
            
            // Mover carta
            const stack = gameState.field[sourceLine][target];
            const idx = stack.indexOf(cardObj);
            if (idx === -1) return false;
            
            stack.splice(idx, 1);
            gameState.field[destLine][target].push(cardObj);
            
            if (ctx.onComplete) {
                ctx.onComplete();
            }
            
            return true;
        }
    },
    
    /**
     * FLIP: Voltear carta (faceDown ↔ faceUp)
     */
    flip: {
        setup: function(ctx, config) {
            return {
                type: 'flip',
                target: config.target,
                filter: config.filter,           // 'faceDown' (solo bocabajo)
                animate: config.animate !== false,
                onComplete: config.onComplete
            };
        },
        
        execute: function(cardObj, line, target, ctx) {
            cardObj.faceDown = !cardObj.faceDown;
            
            if (ctx.animate && cardObj.faceDown === false) {
                cardObj._animateFlip = true;
                if (typeof triggerFlipFaceUp === 'function') {
                    triggerFlipFaceUp(cardObj, line, target);
                }
            }
            
            if (typeof updateUI === 'function') updateUI();
            
            if (ctx.onComplete) {
                ctx.onComplete();
            }
            
            return true;
        }
    },
    
    /**
     * DISCARD: Descartar carta de la mano
     */
    discard: {
        setup: function(ctx, config) {
            return {
                type: 'discard',
                target: config.target,           // 'player' | 'ai'
                count: config.count || 1,
                any: config.any || false,        // true = descarta 0 o más
                onComplete: config.onComplete
            };
        },
        
        execute: function(ctx) {
            const target = ctx.target;
            const count = ctx.count;
            
            if (gameState[target].hand.length === 0) {
                if (ctx.onComplete) ctx.onComplete();
                return true;
            }
            
            // IA: descarta carta de menor valor
            // Jugador: muestra overlay de selección
            if (target === 'ai') {
                const idx = aiLowestValueCardIdx('ai');
                const card = gameState.ai.hand.splice(idx, 1)[0];
                gameState.ai.trash.push(card);
                
                if (ctx.onComplete) ctx.onComplete();
                return true;
            } else {
                // Jugador: delegar a showHandSelectOverlay
                if (typeof showHandSelectOverlay === 'function') {
                    showHandSelectOverlay('discard', count, ctx);
                }
                return 'pending';
            }
        }
    },
    
    /**
     * CHOICE: Modal de elección SÍ/NO con callbacks personalizados
     */
    choice: {
        setup: function(ctx, config) {
            return {
                type: 'choice',
                message: config.message,
                yesText: config.yesText || 'SÍ',
                noText: config.noText || 'NO',
                onYes: config.onYes,
                onNo: config.onNo
            };
        },
        
        execute: function(ctx) {
            const confirmArea = document.getElementById('command-confirm');
            const confirmMsg = document.getElementById('confirm-msg');
            const btnYes = document.getElementById('btn-confirm-yes');
            const btnNo = document.getElementById('btn-confirm-no');
            
            if (!confirmArea || !btnYes || !btnNo) {
                if (ctx.onNo) ctx.onNo();
                return false;
            }
            
            confirmArea.classList.remove('hidden');
            confirmMsg.textContent = ctx.message;
            btnYes.textContent = ctx.yesText;
            btnNo.textContent = ctx.noText;
            
            const self = this;
            
            btnYes.onclick = () => {
                confirmArea.classList.add('hidden');
                if (ctx.onYes) ctx.onYes();
            };
            
            btnNo.onclick = () => {
                confirmArea.classList.add('hidden');
                if (ctx.onNo) ctx.onNo();
            };
            
            return 'pending';
        }
    }
};

/**
 * Builder para componer efectos
 */
const EffectBuilder = {
    /**
     * Crea un efecto compuesto con pasos secuenciales
     * @param  {...object} steps - Pasos de efecto
     */
    sequence: function(...steps) {
        return {
            type: 'sequence',
            steps: steps,
            currentStep: 0,
            
            execute: function(ctx) {
                if (this.currentStep >= this.steps.length) {
                    return 'complete';
                }
                
                const step = this.steps[this.currentStep];
                const result = step.execute(ctx);
                
                if (result === true || result === 'complete') {
                    this.currentStep++;
                    return this.execute(ctx);
                }
                
                return result; // 'pending' o algo más
            }
        };
    },
    
    /**
     * Crea un efecto con elección (if/else)
     * @param {string} message - Mensaje del modal
     * @param {function} onYes - Callback si elige SÍ
     * @param {function} onNo - Callback si elige NO
     */
    choice: function(message, onYes, onNo) {
        return AtomicEffects.choice.setup(null, {
            message: message,
            onYes: onYes,
            onNo: onNo
        });
    }
};

// Exportar globalmente
window.AtomicEffects = AtomicEffects;
window.EffectBuilder = EffectBuilder;
