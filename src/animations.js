// animations.js — COMPILE Fase A
// Requiere GSAP 3 cargado antes de este script.
// No contiene lógica de juego. Solo capa visual.

(function () {
    'use strict';

    // ------------------------------------------------------------------
    // Efectos individuales
    // ------------------------------------------------------------------

    function animCardEnterField(el, fromTop) {
        if (!el || typeof gsap === 'undefined') return;
        // Desactivar CSS transition durante GSAP — evita conflicto con "transition: all 0.3s"
        var prevTransition = el.style.transition;
        el.style.transition = 'none';
        gsap.fromTo(el,
            { scale: 0.6, opacity: 0, y: fromTop ? -24 : 24 },
            {
                scale: 1, opacity: 1, y: 0, duration: 0.32, ease: 'back.out(1.7)',
                clearProps: 'transform,opacity',
                onComplete: function () { el.style.transition = prevTransition; }
            }
        );
    }

    // Expuesta globalmente para llamada directa desde renderStack
    window.animCardEnter = animCardEnterField;

    // Anima la carta directamente en su contexto DOM, luego ejecuta el callback
    // para que el splice y updateUI ocurran DESPUÉS de que la animación termine.
    function animCardEliminate(cardId, onDone) {
        if (typeof gsap === 'undefined') { if (onDone) onDone(); return; }
        var el = document.querySelector('.card-in-field[data-id="' + cardId + '"]');
        if (!el) { if (onDone) onDone(); return; }
        el.style.transition = 'none';
        gsap.fromTo(el,
            { clipPath: 'inset(0 0 0% 0)' },
            { clipPath: 'inset(0 0 100% 0)', duration: 0.4, ease: 'power2.in',
              onComplete: function () { if (onDone) onDone(); } }
        );
    }

    window.animCardEliminate = animCardEliminate;

    console.log('[ANIM] Flip available:', typeof Flip);
    if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);

    gsap.registerEffect({
        name: 'pulse',
        effect: function (targets, config) {
            return gsap.timeline()
                .to(targets, { scale: config.scale, duration: config.duration * 0.4, ease: 'power2.out' })
                .to(targets, { scale: 1, duration: config.duration * 0.6, ease: 'elastic.out(1.2, 0.4)' });
        },
        defaults: { scale: 1.12, duration: 0.7 },
        extendTimeline: true
    });

    function animCompileLine(lineId) {
        if (typeof gsap === 'undefined') return;
        var lineEl = document.getElementById('line-' + lineId);
        if (!lineEl) return;
        var col = lineEl.parentElement; // div.battle-column (#line-* tiene display:contents)
        if (!col) return;
        gsap.effects.pulse(col);
    }

    // ------------------------------------------------------------------
    // Cola de animaciones pendientes
    // Lógica de juego llama window.queueAnim({type, ...}) antes de updateUI().
    // updateUI() llama window.flushAnimQueue() al final.
    // ------------------------------------------------------------------

    window.queueAnim = function (anim) {
        if (!window._animQueue) window._animQueue = [];
        window._animQueue.push(anim);
    };

    // ------------------------------------------------------------------
    // scrTxt — ScrambleText helper
    // Aplica GSAP ScrambleText a un elemento. Si el valor no cambió, no
    // re-anima (evita scramble continuo en updateUI). Fallback: textContent.
    // ------------------------------------------------------------------

    window.scrTxt = function (el, text, opts) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return;
        var t = (text === undefined || text === null) ? '' : String(text);
        // Evitar re-animar si el valor no cambió
        if (el.getAttribute('data-scr-last') === t) return;
        el.setAttribute('data-scr-last', t);
        if (typeof ScrambleTextPlugin === 'undefined' || typeof gsap === 'undefined') {
            el.textContent = t; return;
        }
        var dur   = (opts && opts.duration !== undefined) ? opts.duration : 1.0;
        var chars = (opts && opts.chars)   || 'upperCase';
        var speed = (opts && opts.speed)   || 0.5;
        gsap.to(el, { duration: dur, scrambleText: { text: t, chars: chars, speed: speed, revealDelay: 0 } });
    };

    // ------------------------------------------------------------------
    // _initModalScramble — Observa los modales y aplica scrTxt cuando
    // se hacen visibles (clase 'hidden' eliminada). El texto ya está puesto
    // antes de removeClass en todos los casos de reveal y overlay-select.
    // ------------------------------------------------------------------

    window._initModalScramble = function () {
        function watchModal(modalId, targets) {
            var modal = document.getElementById(modalId);
            if (!modal) return;
            new MutationObserver(function () {
                if (!modal.classList.contains('hidden')) {
                    targets.forEach(function (id) {
                        var el = document.getElementById(id);
                        if (el && el.textContent.trim()) {
                            window.scrTxt(el, el.textContent.trim(), { duration: 1.0 });
                        }
                    });
                }
            }).observe(modal, { attributes: true, attributeFilter: ['class'] });
        }
        watchModal('reveal-modal',   ['reveal-title', 'reveal-subtitle', 'reveal-source']);
        watchModal('overlay-select', ['select-title',  'select-subtitle',  'select-source']);
    };

    window.flushAnimQueue = function () {
        var q = window._animQueue;
        if (!q || !q.length) return;
        window._animQueue = [];

        q.forEach(function (anim) {
            if (anim.type === 'fieldCard') {
                // fieldCard ahora se anima directamente desde renderStack via window.animCardEnter
                // Este path ya no se usa para fieldCard pero se mantiene por compatibilidad
            }

            if (anim.type === 'compile') {
                animCompileLine(anim.line);
            }

            if (anim.type === 'handCard') {
                var handEl = document.getElementById('player-hand');
                if (!handEl) return;
                var hCards = handEl.querySelectorAll('.card');
                var count = anim.count || 1;
                var start = Math.max(0, hCards.length - count);
                var newCards = Array.from(hCards).slice(start);
                window._handAnimating = true;
                var stagger = 120; // ms entre cartas
                var animDuration = 700; // ms — igual que card-entering en campo
                newCards.forEach(function (el, i) {
                    setTimeout(function () {
                        el.classList.add('card-entering');
                        el.addEventListener('animationend', function () {
                            el.classList.remove('card-entering');
                        }, { once: true });
                    }, i * stagger);
                });
                setTimeout(function () {
                    window._handAnimating = false;
                    if (typeof updateUI === 'function') updateUI();
                }, animDuration + (newCards.length - 1) * stagger + 50);
            }
        });
    };

})();
