'use strict';

// ── Confirm Dialog ──────────────────────────────────────────────────────────
window.showConfirmDialog = function(message, onYes, onNo, yesText, noText) {
    var confirmArea = document.getElementById('command-confirm');
    var confirmMsg  = document.getElementById('confirm-msg');
    var actionsDiv  = confirmArea && confirmArea.querySelector('.effect-actions');
    if (!confirmArea || !confirmMsg || !actionsDiv) return;
    confirmMsg.innerHTML = '';
    confirmMsg.removeAttribute('data-scr-last');
    if (window.scrTxt) {
        window.scrTxt(confirmMsg, message, { duration: 1.0 });
    } else {
        confirmMsg.textContent = message;
    }
    yesText = yesText || 'SÍ';
    noText  = noText  || 'NO';
    actionsDiv.innerHTML =
        '<button class="ui-btn" id="btn-confirm-yes">' + yesText + '</button>' +
        '<button class="ui-btn ui-btn--danger" id="btn-confirm-no">' + noText + '</button>';
    confirmArea.classList.remove('hidden');
    document.getElementById('btn-confirm-yes').onclick = function() {
        confirmArea.classList.add('hidden');
        if (onYes) onYes();
    };
    document.getElementById('btn-confirm-no').onclick = function() {
        confirmArea.classList.add('hidden');
        if (onNo) onNo();
    };
};

// ── Notify Toast ────────────────────────────────────────────────────────────
window.showNotify = function(title, detail, cardHTML, duration) {
    var toast = document.getElementById('notify-toast');
    if (!toast) return;
    toast.className = 'effect-notify';
    toast.innerHTML =
        '<div class="notify-title">' + title + '</div>' +
        (detail  ? '<div class="notify-detail">'   + detail  + '</div>' : '') +
        (cardHTML ? '<div class="notify-card-row">' + cardHTML + '</div>' : '');
    toast.classList.add('active');
    setTimeout(function() {
        toast.classList.remove('active');
        toast.className = 'effect-notify';
    }, duration || 2500);
};

// ── Hand Select Overlay ─────────────────────────────────────────────────────
window.showHandSelectOverlay = function(type, count, ctx) {
    var ov = document.getElementById('overlay-select');
    var isDiscard  = type === 'discard' || type === 'discardAny' || type === 'discardVariable';
    var isGive     = type === 'give';
    var isReveal   = type === 'reveal';
    var isVariable = type === 'discardVariable' || type === 'discardAny';

    ov.className = 'effect-overlay' + (isDiscard ? ' theme-discard' : '');

    var titleMap = { discard: 'DESCARTAR', discardAny: 'DESCARTAR', discardVariable: 'DESCARTAR', give: 'DAR AL OPONENTE', reveal: 'REVELAR CARTA', playNonDiversity: 'JUGAR CARTA' };
    document.getElementById('select-title').textContent = titleMap[type] || 'SELECCIONAR';
    var subtitleMap = {
        discard: 'Elige ' + count + ' carta' + (count > 1 ? 's' : '') + ' de tu mano',
        discardAny: 'Descarta las que quieras (0 o más)',
        discardVariable: 'Descarta cartas — el rival descartará más',
        give: 'Elige ' + count + ' carta' + (count > 1 ? 's' : '') + ' para dar al oponente',
        reveal: 'Elige 1 carta para revelar al oponente',
        playNonDiversity: 'Elige 1 carta (no Diversidad) para jugar bocarriba'
    };
    document.getElementById('select-subtitle').textContent = subtitleMap[type] || '';
    document.getElementById('select-source').textContent = ctx._triggerName || '';

    var selected = new Set();
    var hand = gameState.player.hand;
    var isPlayNonDiv = type === 'playNonDiversity';

    function render() {
        var cardsEl = document.getElementById('select-cards');
        cardsEl.innerHTML = hand.map(function(card, i) {
            var blocked = isPlayNonDiv && card.nombre.startsWith('Diversidad');
            var cls = blocked ? 'disabled' : (selected.has(i) ? 'selected' : 'selectable');
            var cardHTML = typeof createCardHTML === 'function' ? createCardHTML(card) : '<span>' + card.nombre + '</span>';
            return '<div class="effect-card ' + cls + '" data-idx="' + i + '"' + (blocked ? ' style="opacity:0.4;pointer-events:none;"' : '') + '>' + cardHTML + '</div>';
        }).join('');

        cardsEl.querySelectorAll('.effect-card').forEach(function(el) {
            el.onclick = function() {
                var idx = parseInt(el.dataset.idx);
                if (selected.has(idx)) {
                    selected.delete(idx);
                } else if (isVariable || selected.size < count) {
                    selected.add(idx);
                } else if (count === 1) {
                    selected.clear();
                    selected.add(idx);
                }
                render();
            };
        });

        var counterEl = document.getElementById('select-counter');
        counterEl.innerHTML = isVariable
            ? 'Seleccionadas: <strong>' + selected.size + '</strong>'
            : 'Seleccionadas: <strong>' + selected.size + '</strong> / ' + count;

        var minRequired = (type === 'discardVariable') ? 1 : 0;
        var canConfirm = isVariable ? selected.size >= minRequired : (isReveal || isPlayNonDiv ? selected.size === 1 : selected.size >= count);
        var canStop = isVariable && selected.size >= minRequired;
        var actionsEl = document.getElementById('select-actions');
        var btnLabel = isDiscard ? 'DESCARTAR' : isGive ? 'ENTREGAR' : isPlayNonDiv ? 'JUGAR' : 'REVELAR';
        var btnClass = isDiscard ? 'ui-btn ui-btn--danger' : 'ui-btn';
        actionsEl.innerHTML =
            '<button class="' + btnClass + '" id="ov-select-confirm"' + (!canConfirm ? ' disabled' : '') + '>' + btnLabel + '</button>' +
            (isVariable ? '<button class="ui-btn ui-btn--danger" id="ov-select-stop"' + (!canStop ? ' disabled' : '') + '>DETENER</button>' : '');

        document.getElementById('ov-select-confirm').onclick = function() {
            if (!canConfirm) return;
            window.closeHandSelectOverlay();
            processHandSelection(type, selected, ctx);
        };
        var stopBtn = document.getElementById('ov-select-stop');
        if (stopBtn) stopBtn.onclick = function() {
            if (!canStop) return;
            window.closeHandSelectOverlay();
            processHandSelection(type, selected, ctx);
        };
    }

    render();
    ov.classList.remove('hidden');
    setTimeout(function() {
        if (window.scrTxt) {
            document.querySelectorAll('#overlay-select .slot-title-text, #overlay-select .card-img-zone-text').forEach(function(el) {
                var text = el.textContent.trim();
                if (text) window.scrTxt(el, text, { duration: 1.0, chars: el.classList.contains('slot-title-text') ? 'upperCase' : 'upperAndLowerCase' });
            });
        }
    }, 50);
};

window.closeHandSelectOverlay = function() {
    var ov = document.getElementById('overlay-select');
    if (ov) ov.classList.add('hidden');
};

// ── Field Select Overlay ────────────────────────────────────────────────────
window.showFieldSelectOverlay = function(type, count, ctx) {
    var ov = document.getElementById('overlay-select');
    var isEliminate = type === 'eliminate';
    var isFlip      = type === 'flip';
    var isReturn    = type === 'return';

    ov.className = 'effect-overlay' + (isEliminate ? ' theme-discard' : '');

    var titleMap = { eliminate: 'ELIMINAR', flip: 'VOLTEAR', return: 'DEVOLVER A MANO', shift: 'MOVER CARTA', selectCardToCopy: 'COPIAR EFECTO' };
    document.getElementById('select-title').textContent = titleMap[type] || type.toUpperCase();

    var targetDesc = ctx.target === 'ai' ? 'del oponente' : ctx.target === 'player' ? 'tuyas' : '';
    var subtitleMap = {
        shift: 'Elige 1 carta para mover a otra línea',
        selectCardToCopy: 'Elige 1 carta rival para copiar su efecto'
    };
    document.getElementById('select-subtitle').textContent = subtitleMap[type] || ('Elige ' + count + ' carta' + (count > 1 ? 's' : '') + ' ' + targetDesc);
    document.getElementById('select-source').textContent = ctx._triggerName || '';

    var eligible = [];
    var LINES = ['izquierda', 'centro', 'derecha'];
    var baseLines = ctx.allowedLines || (ctx.forceLine ? [ctx.forceLine] : LINES);
    var linesToCheck = baseLines.filter(function(l) { return l !== ctx.excludeLine; });
    var targets = ctx.target === 'any' ? ['player', 'ai'] : [ctx.target];

    linesToCheck.forEach(function(l) {
        targets.forEach(function(p) {
            var stack = gameState.field[l][p];
            stack.forEach(function(cardObj, idx) {
                var isUncovered = idx === stack.length - 1;
                if (!isUncovered && !ctx.targetAll && !ctx.coveredOnly) return;
                if (ctx.excludeCardName && cardObj.card.nombre === ctx.excludeCardName) return;
                if (ctx.coveredOnly && isUncovered) return;
                if (!cardMatchesFilter(cardObj, ctx)) return;
                if (isFlip && typeof getPersistentModifiers === 'function' && getPersistentModifiers(cardObj).preventFlip) return;
                if (type === 'selectCardToCopy') {
                    if (cardObj.faceDown) return;
                    if (typeof CARD_EFFECTS === 'undefined' || !CARD_EFFECTS[cardObj.card.nombre] || !CARD_EFFECTS[cardObj.card.nombre].onPlay) return;
                }
                eligible.push({ cardObj: cardObj, line: l, player: p, idx: idx });
            });
        });
    });

    var selected = new Set();

    function render() {
        var cardsEl = document.getElementById('select-cards');
        cardsEl.innerHTML = eligible.map(function(item, i) {
            var cls = selected.has(i) ? 'selected' : 'selectable';
            var cardHTML = typeof createCardHTML === 'function'
                ? createCardHTML(item.cardObj.card, item.cardObj.faceDown)
                : '<span>' + item.cardObj.card.nombre + '</span>';
            var lineLabel = item.line.charAt(0).toUpperCase() + item.line.slice(0, 3);
            return '<div class="effect-card ' + cls + '" data-idx="' + i + '">' +
                cardHTML +
                '<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);padding:2px 4px;font-size:8px;color:var(--ui-cyan);text-align:center;letter-spacing:1px;">' + lineLabel + ' · ' + (item.player === 'ai' ? 'IA' : 'JUG') + '</div>' +
                '</div>';
        }).join('');

        cardsEl.querySelectorAll('.effect-card').forEach(function(el) {
            el.onclick = function() {
                var idx = parseInt(el.dataset.idx);
                if (selected.has(idx)) {
                    selected.delete(idx);
                } else if (selected.size < count) {
                    selected.add(idx);
                } else if (count === 1) {
                    selected.clear();
                    selected.add(idx);
                }
                render();
            };
        });

        document.getElementById('select-counter').innerHTML = 'Seleccionadas: <strong>' + selected.size + '</strong> / ' + count;
        var btnLabelMap = { eliminate: 'ELIMINAR', flip: 'VOLTEAR', return: 'DEVOLVER', shift: 'MOVER', selectCardToCopy: 'COPIAR' };
        var btnLabel = btnLabelMap[type] || 'CONFIRMAR';
        var btnClass = isEliminate ? 'ui-btn ui-btn--danger' : 'ui-btn';
        document.getElementById('select-actions').innerHTML =
            '<button class="' + btnClass + '" id="ov-select-confirm"' + (selected.size < count ? ' disabled' : '') + '>' + btnLabel + '</button>';

        var confirmBtn = document.getElementById('ov-select-confirm');
        if (confirmBtn) confirmBtn.onclick = function() {
            if (selected.size < count) return;
            window.closeHandSelectOverlay();
            processFieldSelection(type, selected, eligible, ctx);
        };
    }

    render();
    ov.classList.remove('hidden');
    setTimeout(function() {
        if (window.scrTxt) {
            document.querySelectorAll('#overlay-select .slot-title-text, #overlay-select .card-img-zone-text').forEach(function(el) {
                var text = el.textContent.trim();
                if (text) window.scrTxt(el, text, { duration: 1.0, chars: el.classList.contains('slot-title-text') ? 'upperCase' : 'upperAndLowerCase' });
            });
        }
    }, 50);
};

// ── Rearrange Overlay ───────────────────────────────────────────────────────
window.showRearrangeOverlay = function(ctx) {
    var ov = document.getElementById('overlay-select');
    ov.className = 'effect-overlay';
    var isSwapCards = ctx.swapCards;
    document.getElementById('select-title').textContent = isSwapCards ? 'INTERCAMBIAR PILAS' : 'INTERCAMBIAR PROTOCOLOS';
    document.getElementById('select-subtitle').textContent = 'Elige 2 líneas para intercambiar';
    document.getElementById('select-source').textContent = ctx._triggerName || '';

    var LINES = ['izquierda', 'centro', 'derecha'];
    var owner = (ctx.target === 'opponent' || ctx.target === 'ai') ? 'ai' : 'player';
    var first = null, second = null;

    function render() {
        var cardsEl = document.getElementById('select-cards');
        cardsEl.innerHTML = LINES.map(function(l, i) {
            var proto = gameState[owner].protocols[i] || '—';
            var cls = (first === i || second === i) ? 'selected' : 'selectable';
            return '<div class="effect-card ' + cls + '" data-idx="' + i + '" style="width:160px;height:80px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;">' +
                '<div style="font-size:11px;font-weight:700;color:var(--ui-cyan);letter-spacing:1px;">' + proto + '</div>' +
                '<div style="font-size:9px;color:#8899aa;text-transform:uppercase;">' + l + '</div>' +
                '</div>';
        }).join('');

        cardsEl.querySelectorAll('.effect-card').forEach(function(el) {
            el.onclick = function() {
                var idx = parseInt(el.dataset.idx);
                if (first === null) { first = idx; }
                else if (first === idx) { first = null; }
                else { second = idx; }
                render();
            };
        });

        var step = first === null ? 'Elige la primera línea' : (second === null ? 'Primera: ' + LINES[first] + ' — elige la segunda' : 'Listo para intercambiar');
        document.getElementById('select-counter').innerHTML = step;
        var canConfirm = first !== null && second !== null;
        document.getElementById('select-actions').innerHTML =
            '<button class="ui-btn" id="ov-select-confirm"' + (!canConfirm ? ' disabled' : '') + '>INTERCAMBIAR</button>';

        var btn = document.getElementById('ov-select-confirm');
        if (btn) btn.onclick = function() {
            if (!canConfirm) return;
            window.closeHandSelectOverlay();
            var firstLine  = LINES[first];
            var secondLine = LINES[second];
            if (isSwapCards) {
                var tmp = gameState.field[firstLine][owner];
                gameState.field[firstLine][owner]  = gameState.field[secondLine][owner];
                gameState.field[secondLine][owner] = tmp;
            } else if (typeof swapProtocols === 'function') {
                swapProtocols(firstLine, secondLine, owner);
            }
            ctx.selected.push({ first: firstLine, second: secondLine });
            finishEffect();
        };
    }
    render();
    ov.classList.remove('hidden');
};

// ── Line Select Overlay (massDeleteByValueRange) ────────────────────────────
window.showLineSelectOverlay = function(ctx) {
    var ov = document.getElementById('overlay-select');
    ov.className = 'effect-overlay theme-discard';
    document.getElementById('select-title').textContent = 'ELIMINAR POR VALOR';
    document.getElementById('select-subtitle').textContent = 'Elige una línea — se eliminarán cartas con valor ' + ctx.minVal + '-' + ctx.maxVal;
    document.getElementById('select-source').textContent = ctx._triggerName || '';

    var LINES = ['izquierda', 'centro', 'derecha'];
    var eligibleLines = LINES.filter(function(l) {
        return ['player', 'ai'].some(function(p) {
            return gameState.field[l][p].some(function(c) { return c.faceDown || (c.card.valor >= ctx.minVal && c.card.valor <= ctx.maxVal); });
        });
    });
    var selected = null;

    function render() {
        var cardsEl = document.getElementById('select-cards');
        cardsEl.innerHTML = eligibleLines.map(function(l, i) {
            var cls = selected === i ? 'selected' : 'selectable';
            var count = ['player', 'ai'].reduce(function(n, p) {
                return n + gameState.field[l][p].filter(function(c) { return c.faceDown || (c.card.valor >= ctx.minVal && c.card.valor <= ctx.maxVal); }).length;
            }, 0);
            return '<div class="effect-card ' + cls + '" data-idx="' + i + '" style="width:160px;height:80px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;">' +
                '<div style="font-size:11px;font-weight:700;color:var(--ui-cyan);letter-spacing:1px;text-transform:uppercase;">' + l + '</div>' +
                '<div style="font-size:9px;color:#8899aa;">' + count + ' carta' + (count !== 1 ? 's' : '') + ' afectada' + (count !== 1 ? 's' : '') + '</div>' +
                '</div>';
        }).join('');

        cardsEl.querySelectorAll('.effect-card').forEach(function(el) {
            el.onclick = function() { selected = parseInt(el.dataset.idx); render(); };
        });

        document.getElementById('select-counter').innerHTML = selected !== null ? 'Línea: <strong>' + eligibleLines[selected] + '</strong>' : 'Elige una línea';
        document.getElementById('select-actions').innerHTML =
            '<button class="ui-btn ui-btn--danger" id="ov-select-confirm"' + (selected === null ? ' disabled' : '') + '>ELIMINAR</button>';

        var btn = document.getElementById('ov-select-confirm');
        if (btn) btn.onclick = function() {
            if (selected === null) return;
            window.closeHandSelectOverlay();
            if (typeof executeMassDeleteByValueRange === 'function') executeMassDeleteByValueRange(eligibleLines[selected]);
        };
    }
    render();
    ov.classList.remove('hidden');
};

// ── Return-by-value overlays ────────────────────────────────────────────────
window.showReturnByValueLineOverlay = function(ctx) {
    var ov = document.getElementById('overlay-select');
    ov.className = 'effect-overlay';
    document.getElementById('select-title').textContent = 'DEVOLVER A MANO';
    document.getElementById('select-subtitle').textContent = 'Elige una línea — se devuelven cartas con valor ' + ctx.value + ' del oponente';
    document.getElementById('select-source').textContent = ctx._triggerName || '';

    var LINES = ['izquierda', 'centro', 'derecha'];
    var eligibleLines = LINES.filter(function(l) {
        return gameState.field[l][ctx.target].some(function(c) { return !c.faceDown && c.card.valor === ctx.value; });
    });

    if (eligibleLines.length === 0) {
        window.closeHandSelectOverlay();
        if (typeof logEvent === 'function') logEvent('Agua 3: No hay cartas con valor ' + ctx.value + ' boca arriba en el lado del oponente');
        if (typeof finishEffect === 'function') finishEffect();
        return;
    }

    var selected = null;
    function render() {
        var cardsEl = document.getElementById('select-cards');
        cardsEl.innerHTML = eligibleLines.map(function(l, i) {
            var cls = selected === i ? 'selected' : 'selectable';
            var count = gameState.field[l][ctx.target].filter(function(c) { return !c.faceDown && c.card.valor === ctx.value; }).length;
            return '<div class="effect-card ' + cls + '" data-idx="' + i + '" style="width:160px;height:80px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;">' +
                '<div style="font-size:11px;font-weight:700;color:var(--ui-cyan);letter-spacing:1px;text-transform:uppercase;">' + l + '</div>' +
                '<div style="font-size:9px;color:#8899aa;">' + count + ' carta' + (count !== 1 ? 's' : '') + ' a devolver</div>' +
                '</div>';
        }).join('');
        cardsEl.querySelectorAll('.effect-card').forEach(function(el) {
            el.onclick = function() { selected = parseInt(el.dataset.idx); render(); };
        });
        document.getElementById('select-counter').innerHTML = selected !== null ? 'Línea: <strong>' + eligibleLines[selected] + '</strong>' : 'Elige una línea';
        document.getElementById('select-actions').innerHTML =
            '<button class="ui-btn" id="ov-select-confirm"' + (selected === null ? ' disabled' : '') + '>DEVOLVER</button>';
        var btn = document.getElementById('ov-select-confirm');
        if (btn) btn.onclick = function() {
            if (selected === null) return;
            window.closeHandSelectOverlay();
            if (typeof executeReturnByValueFromLine === 'function') executeReturnByValueFromLine(eligibleLines[selected]);
        };
    }
    render();
    ov.classList.remove('hidden');
};

window.showReturnByValueLineOverlayBoth = function(ctx) {
    var ov = document.getElementById('overlay-select');
    ov.className = 'effect-overlay';
    document.getElementById('select-title').textContent = 'DEVOLVER A MANO';
    document.getElementById('select-subtitle').textContent = 'Elige una línea — se devuelven TODAS las cartas con valor ' + ctx.value + ' (ambos jugadores)';
    document.getElementById('select-source').textContent = ctx._triggerName || '';

    var eligibleLines = ctx.lines || ['izquierda', 'centro', 'derecha'];
    var selected = null;

    function render() {
        var cardsEl = document.getElementById('select-cards');
        cardsEl.innerHTML = eligibleLines.map(function(l, i) {
            var cls = selected === i ? 'selected' : 'selectable';
            var playerCount = gameState.field[l].player.filter(function(c) { return !c.faceDown && c.card.valor === ctx.value; }).length;
            var aiCount     = gameState.field[l].ai.filter(function(c)     { return !c.faceDown && c.card.valor === ctx.value; }).length;
            var totalCount  = playerCount + aiCount;
            return '<div class="effect-card ' + cls + '" data-idx="' + i + '" style="width:160px;height:80px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;">' +
                '<div style="font-size:11px;font-weight:700;color:var(--ui-cyan);letter-spacing:1px;text-transform:uppercase;">' + l + '</div>' +
                '<div style="font-size:9px;color:#8899aa;">' + totalCount + ' carta' + (totalCount !== 1 ? 's' : '') + ' a devolver</div>' +
                '</div>';
        }).join('');
        cardsEl.querySelectorAll('.effect-card').forEach(function(el) {
            el.onclick = function() { selected = parseInt(el.dataset.idx); render(); };
        });
        document.getElementById('select-counter').innerHTML = selected !== null ? 'Línea: <strong>' + eligibleLines[selected] + '</strong>' : 'Elige una línea';
        document.getElementById('select-actions').innerHTML =
            '<button class="ui-btn" id="ov-select-confirm"' + (selected === null ? ' disabled' : '') + '>DEVOLVER</button>';
        var btn = document.getElementById('ov-select-confirm');
        if (btn) btn.onclick = function() {
            if (selected === null) return;
            window.closeHandSelectOverlay();
            if (typeof executeReturnByValueFromLineBoth === 'function') executeReturnByValueFromLineBoth(eligibleLines[selected]);
        };
    }
    render();
    ov.classList.remove('hidden');
};

// ── processFieldSelection ───────────────────────────────────────────────────
window.processFieldSelection = function(type, selectedSet, eligible, ctx) {
    var items = Array.from(selectedSet).map(function(i) { return eligible[i]; });
    items.forEach(function(item) {
        var cardObj = item.cardObj, line = item.line, player = item.player;
        var stack  = gameState.field[line][player];
        var curIdx = stack.indexOf(cardObj);
        if (curIdx === -1) return;

        if (type === 'eliminate') {
            stack.splice(curIdx, 1);
            gameState[player].trash.push(cardObj.card);
            gameState[gameState.turn].eliminatedSinceLastCheck = true;
            ctx.selected.push(cardObj);
            if (ctx._checkSuicide) {
                var triggerCardName = ctx._checkSuicide.triggerCardName;
                var queueEffect    = ctx._checkSuicide.queueEffect;
                if (cardObj.card.nombre !== triggerCardName && queueEffect) {
                    gameState.effectQueue.unshift(queueEffect);
                }
            }
            if (typeof triggerUncovered === 'function') triggerUncovered(line, player);
        } else if (type === 'flip') {
            var wasFaceDown = cardObj.faceDown;
            cardObj.faceDown = !cardObj.faceDown;
            gameState.lastFlippedCard = { cardObj: cardObj, line: line };
            if (wasFaceDown && typeof triggerFlipFaceUp === 'function') triggerFlipFaceUp(cardObj, line, player);
            ctx.selected.push(cardObj);
        } else if (type === 'return') {
            stack.splice(curIdx, 1);
            var dest = ctx.beneficiary || player;
            if (typeof applyReturnToHand === 'function') applyReturnToHand(dest, cardObj.card);
            else gameState[dest].hand.push(cardObj.card);
            ctx.selected.push(cardObj);
            if (typeof triggerUncovered === 'function') triggerUncovered(line, player);
        } else if (type === 'shift') {
            ctx.selectedCard = { line: line, target: player, cardIdx: curIdx };
            ctx.waitingForLine = true;
            if (ctx.gravityConstraint && ctx.effectLine && line !== ctx.effectLine) {
                if (typeof handleShiftTargetLine === 'function') handleShiftTargetLine(ctx.effectLine);
                return;
            }
            if (typeof highlightSelectableLines === 'function') highlightSelectableLines(line, player);
            updateUI();
            return;
        } else if (type === 'selectCardToCopy') {
            if (cardObj.faceDown) return;
            if (typeof CARD_EFFECTS === 'undefined' || !CARD_EFFECTS[cardObj.card.nombre] || !CARD_EFFECTS[cardObj.card.nombre].onPlay) return;
            var copyLine = line;
            gameState.effectContext = null;
            if (typeof clearEffectHighlights === 'function') clearEffectHighlights();
            updateUI();
            var prevLine = gameState.currentEffectLine;
            gameState.currentEffectLine = copyLine;
            if (typeof triggerCardEffect === 'function') triggerCardEffect(cardObj.card, 'onPlay', 'player');
            gameState.currentEffectLine = prevLine;
            if (typeof processAbilityEffect === 'function') processAbilityEffect();
            return;
        }
    });
    finishEffect();
};

// ── processHandSelection ────────────────────────────────────────────────────
window.processHandSelection = function(type, selectedSet, ctx) {
    var indices = Array.from(selectedSet).sort(function(a, b) { return b - a; });
    var cards   = indices.map(function(i) { return gameState.player.hand[i]; });

    if (type === 'reveal') {
        var card = cards[0];
        if (card && !gameState.revealedPlayerCards.some(function(c) { return c.nombre === card.nombre; })) {
            gameState.revealedPlayerCards.push(card);
        }
        if (typeof logEvent === 'function') logEvent('Revelas: ' + card.nombre);
        finishEffect();
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    }

    if (type === 'playNonDiversity') {
        var idx  = indices[0];
        var pCard = gameState.player.hand.splice(idx, 1)[0];
        var effectLine = ctx.line || gameState.currentEffectLine || 'izquierda';
        gameState.field[effectLine].player.push({ card: pCard, faceDown: false });
        gameState.effectContext = null;
        if (typeof logEvent === 'function') logEvent('Juegas ' + pCard.nombre + ' bocarriba en ' + effectLine + ' (Diversidad 0)');
        updateUI();
        if (typeof triggerCardEffect === 'function') {
            gameState.currentEffectLine = effectLine;
            triggerCardEffect(pCard, 'onPlay', 'player');
        }
        if (typeof processAbilityEffect === 'function') processAbilityEffect();
        return;
    }

    indices.forEach(function(i) {
        var c = gameState.player.hand.splice(i, 1)[0];
        if (type === 'give') {
            gameState.ai.hand.push(c);
        } else if (gameState._discardToOpponentTrash) {
            gameState.ai.trash.push(c);
            gameState._discardToOpponentTrash = false;
        } else {
            gameState.player.trash.push(c);
            gameState.player.discardedSinceLastCheck = true;
        }
        ctx.selected.push(c);
    });

    var didDiscard = type !== 'give' && !gameState._discardToOpponentTrash;
    if (didDiscard && indices.length > 0) {
        if (typeof onOpponentDiscardEffects === 'function') onOpponentDiscardEffects('player');
        if (typeof onOwnDiscardEffects === 'function') onOwnDiscardEffects('player');
    }

    if (type === 'discardVariable') {
        var n = ctx.selected.length;
        var isAIInitiated = !!ctx._aiFollowUp;
        gameState._plaga2PlayerDiscarded = n;
        finishEffect();
        if (!isAIInitiated) discard('ai', n + 1);
    } else {
        finishEffect();
    }
};

// ── Game zoom ───────────────────────────────────────────────────────────────
var DESIGN_WIDTH  = 1500;
var DESIGN_HEIGHT = 920;

function updateGameZoom() {
    if (!document.body.classList.contains('in-game')) return;
    var scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
    document.documentElement.style.zoom = scale.toFixed(4);
}
window.addEventListener('resize', updateGameZoom);

// ── Card preview ────────────────────────────────────────────────────────────
window.showCardPreview = function(card) {
    var panel = document.getElementById('card-preview-panel');
    var inner = document.getElementById('card-preview-inner');
    if (!panel || !inner || !card) return;
    if (typeof createCardHTML === 'function') inner.innerHTML = createCardHTML(card);
    panel.classList.add('visible');
};
window.hideCardPreview = function() {
    var panel = document.getElementById('card-preview-panel');
    if (panel) panel.classList.remove('visible');
};

// ── MTX-2 background (starts once) ─────────────────────────────────────────
var _mtxStarted = false;
function startMtxBg() {
    if (_mtxStarted) return;
    _mtxStarted = true;
    var canvas = document.getElementById('mtx-bg');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var FS = 20;
    var drops, speeds, frozen, frozenT;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    function init() {
        var numCols = Math.floor(canvas.width / FS);
        drops = []; speeds = []; frozen = []; frozenT = [];
        for (var i = 0; i < numCols; i++) {
            drops[i]  = Math.random() * -(canvas.height / FS * 1.5);
            speeds[i] = 0.12 + Math.random() * 0.22;
            frozen[i] = false; frozenT[i] = 0;
        }
        ctx.fillStyle = '#0b0f1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    init();
    window.addEventListener('resize', init);

    var staticBurst = 0;
    function draw() {
        requestAnimationFrame(draw);
        var W = canvas.width, H = canvas.height, now = Date.now();
        ctx.fillStyle = 'rgba(11,15,26,0.07)';
        ctx.fillRect(0, 0, W, H);
        if (now - staticBurst > 4000 && Math.random() > 0.995) {
            staticBurst = now;
            ctx.fillStyle = 'rgba(0,245,255,0.06)';
            ctx.fillRect(0, Math.random() * H, W, 4 + Math.random() * 18);
        }
        ctx.font = FS + 'px "JetBrains Mono", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        var numCols = Math.floor(W / FS);
        for (var i = 0; i < numCols; i++) {
            if (!frozen[i] && Math.random() > 0.9985) { frozen[i] = true; frozenT[i] = now + 600 + Math.random() * 1400; }
            if (frozen[i] && now > frozenT[i]) frozen[i] = false;
            var y = Math.floor(drops[i]) * FS;
            if (y < -FS || y > H) {
                if (y > H && Math.random() > 0.985) drops[i] = Math.random() * -40;
                if (!frozen[i]) drops[i] += speeds[i];
                continue;
            }
            if (frozen[i]) {
                if (Math.random() > 0.7) {
                    ctx.shadowBlur = 4; ctx.shadowColor = '#00f5ff';
                    ctx.fillStyle = 'rgba(0,200,220,' + (0.15 + Math.random() * 0.35) + ')';
                    ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * FS, y);
                    ctx.shadowBlur = 0;
                }
                continue;
            }
            ctx.shadowBlur = 10; ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', i * FS, y);
            ctx.shadowBlur = 0;
            drops[i] += speeds[i];
        }
    }
    draw();
}

// ── Hand slider ─────────────────────────────────────────────────────────────
var HAND_WINDOW = 5;
var handSliderIdx = 0;

window.slideHand = function(dir) {
    var hand = document.getElementById('player-hand');
    if (!hand) return;
    var total  = hand.children.length;
    var maxIdx = Math.max(0, total - HAND_WINDOW);
    handSliderIdx = Math.max(0, Math.min(handSliderIdx + dir, maxIdx));
    _applySlider();
};

window.updateSlider = function() {
    var hand = document.getElementById('player-hand');
    if (!hand) return;
    var total  = hand.children.length;
    var maxIdx = Math.max(0, total - HAND_WINDOW);
    handSliderIdx = Math.min(handSliderIdx, maxIdx);
    _applySlider();
};

window._applySlider = function() {
    var hand = document.getElementById('player-hand');
    var vp   = document.getElementById('hand-slider-vp');
    var dots = document.getElementById('hand-slider-dots');
    var prev = document.getElementById('hand-slider-prev');
    var next = document.getElementById('hand-slider-next');
    if (!hand || !vp) return;

    var total  = hand.children.length;
    var maxIdx = Math.max(0, total - HAND_WINDOW);
    var cardW  = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hand-card-w')) || 215;
    var gapW   = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hand-card-gap')) || 10;
    var step   = cardW + gapW;

    hand.style.transform      = 'translateX(-' + (handSliderIdx * step) + 'px)';
    hand.style.justifyContent = total <= HAND_WINDOW ? 'center' : 'flex-start';

    vp.classList.toggle('has-prev', handSliderIdx > 0);
    vp.classList.toggle('has-next', handSliderIdx < maxIdx);
    if (prev) prev.disabled = handSliderIdx <= 0;
    if (next) next.disabled = handSliderIdx >= maxIdx;

    if (dots) {
        if (total <= HAND_WINDOW) {
            dots.innerHTML = '';
        } else {
            var html = '';
            for (var i = 0; i <= maxIdx; i++) {
                html += '<span class="slider-dot' + (i === handSliderIdx ? ' active' : '') + '" onclick="handSliderIdx=' + i + ';_applySlider()"></span>';
            }
            dots.innerHTML = html;
        }
    }
};

// Mouse wheel on slider viewport
document.addEventListener('DOMContentLoaded', function() {
    var vp = document.getElementById('hand-slider-vp');
    if (!vp) return;
    vp.addEventListener('wheel', function(e) {
        var hand = document.getElementById('player-hand');
        if (!hand || hand.children.length <= HAND_WINDOW) return;
        e.preventDefault();
        window.slideHand(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
});

// ── Hand mode ────────────────────────────────────────────────────────────────
window.setHandMode = function(mode) {
    var overlay = document.getElementById('hand-overlay');
    if (!overlay) return;
    overlay.classList.toggle('peek-mode', mode === 'peek');
    localStorage.setItem('handMode', mode);
    if (mode === 'peek' && typeof updateHandSidePanels === 'function') updateHandSidePanels();
};

// ── Hand overlay hover behavior ──────────────────────────────────────────────
(function() {
    var overlay = document.getElementById('hand-overlay');
    if (!overlay) return;
    var bar = overlay.querySelector('.hand-bar');

    function hasActiveModal() {
        return ['action-modal', 'command-confirm', 'reveal-modal', 'overlay-select'].some(function(id) {
            var el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        });
    }

    bar.addEventListener('mouseenter', function() {
        overlay.classList.add('open');
        if (typeof updateHandSidePanels === 'function') updateHandSidePanels();
    });
    overlay.addEventListener('mouseenter', function() {
        if (overlay.classList.contains('peek-mode')) {
            overlay.classList.add('open');
            if (typeof updateHandSidePanels === 'function') updateHandSidePanels();
        }
    });

    var closeTimer;
    overlay.addEventListener('mouseleave', function(e) {
        if (e.clientY >= window.innerHeight - 2) return;
        closeTimer = setTimeout(function() {
            if (!hasActiveModal()) overlay.classList.remove('open');
        }, 80);
    });
    overlay.addEventListener('mouseenter', function() { clearTimeout(closeTimer); });
})();

// Auto-open hand when action modals appear
(function() {
    var overlay = document.getElementById('hand-overlay');
    if (!overlay) return;
    ['action-modal', 'command-confirm', 'reveal-modal', 'overlay-select'].forEach(function(id) {
        var modal = document.getElementById(id);
        if (!modal) return;
        new MutationObserver(function() {
            if (!modal.classList.contains('hidden')) overlay.classList.add('open');
        }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    });
})();

// Close log when clicking outside
document.addEventListener('click', function(e) {
    var logOverlay = document.getElementById('log-overlay');
    var logToggle  = document.getElementById('log-toggle');
    if (logOverlay && logOverlay.classList.contains('open')) {
        if (!logOverlay.contains(e.target) && logToggle && !logToggle.contains(e.target)) {
            logOverlay.classList.remove('open');
        }
    }
});

// ── initGameUI — called once when game view is first shown ───────────────────
var _gameUIReady = false;

window.initGameUI = function() {
    // Apply zoom immediately on show
    updateGameZoom();

    if (_gameUIReady) return;
    _gameUIReady = true;

    // Start matrix background
    startMtxBg();

    // Apply saved hand mode
    var saved = localStorage.getItem('handMode') !== null ? localStorage.getItem('handMode') : 'peek';
    if (saved === 'peek') {
        var overlay = document.getElementById('hand-overlay');
        if (overlay) overlay.classList.add('peek-mode');
    }

    // ScrambleText static labels
    if (typeof window._initModalScramble === 'function') window._initModalScramble();
    if (typeof window.scrTxt === 'function') {
        var delay = 0;
        function stagger(el, dur, chars) {
            if (!el) return;
            var txt = (el.value !== undefined ? el.value : el.textContent || '').trim();
            if (!txt) return;
            setTimeout(function() { window.scrTxt(el, txt, { duration: dur || 1.0, chars: chars || 'upperCase' }); }, delay);
            delay += 60;
        }
        document.querySelectorAll('.stat-label').forEach(function(e) { stagger(e, 0.5); });
        document.querySelectorAll('#hand-overlay .hand-bar-inner span[style*="color"]:not(.stat-value)').forEach(function(e) {
            if (e.textContent.trim().length <= 4) stagger(e, 0.5);
        });
        ['player-deck-btn', 'btn-stop-discard'].forEach(function(id) { stagger(document.getElementById(id), 0.6); });
        document.querySelectorAll('#game-container .ui-btn').forEach(function(e) { stagger(e, 0.6); });
        ['btn-play-up', 'btn-play-down', 'btn-cancel'].forEach(function(id) { stagger(document.getElementById(id), 0.6); });
        document.querySelectorAll('#action-modal .effect-title').forEach(function(e) { stagger(e, 0.6); });
        ['btn-confirm-yes', 'btn-confirm-no'].forEach(function(id) { stagger(document.getElementById(id), 0.6); });
        document.querySelectorAll('#command-confirm .effect-title').forEach(function(e) { stagger(e, 0.6); });
        stagger(document.getElementById('btn-reveal-close'), 0.6);
        document.querySelectorAll('.log-header').forEach(function(e) { stagger(e, 0.5); });
    }
};

// ── teardownGameUI — called when leaving game view ───────────────────────────
window.teardownGameUI = function() {
    document.body.classList.remove('in-game');
    document.documentElement.style.zoom = '';
};
