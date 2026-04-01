/**
 * 🎴 COMPILE - Card Effects Engine
 * Efectos de cartas encapsulados para evitar lógica dispersa
 * 
 * REGLA DE ORO: Cada efecto complejo tiene:
 * 1. init() - Configura estado inicial
 * 2. handlers - Procesan interacciones (click, select, etc.)
 * 3. complete() - Limpia y llama a processAbilityEffect()
 */

/**
 * Luz 2: Revelar carta bocabajo, luego cambiar o voltear
 * 
 * Uso:
 *   CardEffects.luz2.init(line, target, cardObj)
 *   CardEffects.luz2.onCardRevealed(cardObj, line, target)
 *   CardEffects.luz2.onChoice(choice, cardObj, line, target)
 */
const CardEffects = {
    luz2: {
        /**
         * Inicia efecto Luz 2
         * @param {string} owner - 'player' | 'ai' (dueño del efecto)
         */
        init: function(owner) {
            gameState.effectContext = {
                type: 'luz2',
                owner: owner,
                step: 'reveal' // 'reveal' | 'choice' | 'complete'
            };
        },

        /**
         * Callback cuando se revela la carta
         * @param {object} cardObj - Carta revelada {card, faceDown, ...}
         * @param {string} line - Línea del campo
         * @param {string} target - 'player' | 'ai'
         */
        onCardRevealed: function(cardObj, line, target) {
            gameState.effectContext.step = 'choice';
            gameState.effectContext.luz2Data = { cardObj, line, target };
            
            // Mostrar preview bocarriba
            if (typeof showCardPreview === 'function') {
                showCardPreview(cardObj.card, true);
            }
            
            // Mostrar modal de elección
            this.showChoiceModal(cardObj, line, target);
        },

        /**
         * Muestra modal de elección (SÍ=shift, NO=flip)
         */
        showChoiceModal: function(cardObj, line, target) {
            const confirmArea = document.getElementById('command-confirm');
            const confirmMsg = document.getElementById('confirm-msg');
            const btnYes = document.getElementById('btn-confirm-yes');
            const btnNo = document.getElementById('btn-confirm-no');

            if (!confirmArea || !btnYes || !btnNo) {
                this.complete();
                return;
            }

            confirmArea.classList.remove('hidden');
            confirmMsg.textContent = `Luz 2 — ${cardObj.card.nombre}: SÍ = Cambiar de línea (bocabajo) · NO = Voltear bocarriba`;

            const self = this;
            
            btnYes.onclick = () => {
                confirmArea.classList.add('hidden');
                if (typeof hideCardPreview === 'function') hideCardPreview();
                self.onChoice('shift', cardObj, line, target);
            };

            btnNo.onclick = () => {
                confirmArea.classList.add('hidden');
                if (typeof hideCardPreview === 'function') hideCardPreview();
                self.onChoice('flip', cardObj, line, target);
            };
        },

        /**
         * Procesa elección del jugador
         * @param {string} choice - 'shift' | 'flip'
         */
        onChoice: function(choice, cardObj, line, target) {
            if (choice === 'shift') {
                // Preparar shift
                const currentIdx = gameState.field[line][target].indexOf(cardObj);
                gameState.effectContext = {
                    type: 'shift',
                    target: target,
                    count: 1,
                    selected: [],
                    selectedCard: { line, target, cardIdx: currentIdx },
                    waitingForLine: true,
                    onComplete: () => this.complete() // Callback cuando complete
                };
                
                if (typeof highlightSelectableLines === 'function') {
                    highlightSelectableLines(line);
                }
                updateStatus(`Elige línea destino para mover "${cardObj.card.nombre}" (bocabajo)`);
                
            } else if (choice === 'flip') {
                // Voltear bocarriba
                cardObj.faceDown = false;
                cardObj._animateFlip = true;
                
                if (typeof updateUI === 'function') updateUI();
                if (typeof triggerFlipFaceUp === 'function') triggerFlipFaceUp(cardObj, line, target);
                
                this.complete();
            }
        },

        /**
         * Completa el efecto y continúa con la cadena
         */
        complete: function() {
            gameState.effectContext = null;
            if (typeof clearEffectHighlights === 'function') clearEffectHighlights();
            if (typeof updateUI === 'function') updateUI();
            if (typeof processAbilityEffect === 'function') processAbilityEffect();
        }
    },

    /**
     * Helper: Ejecuta efecto genérico con callback
     * @param {string} type - Tipo de efecto
     * @param {function} onComplete - Callback al completar
     */
    withCallback: function(type, onComplete) {
        return function(...args) {
            const result = type.apply(this, args);
            if (onComplete) onComplete();
            return result;
        };
    }
};

// Exportar globalmente
window.CardEffects = CardEffects;
