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
        gsap.fromTo(el,
            { scale: 0.6, opacity: 0, y: fromTop ? -24 : 24 },
            { scale: 1, opacity: 1, y: 0, duration: 0.32, ease: 'back.out(1.7)', clearProps: 'transform,opacity' }
        );
    }

    function animCardEnterHand(el, delay) {
        if (!el || typeof gsap === 'undefined') return;
        gsap.fromTo(el,
            { x: 36, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.22, delay: delay || 0, ease: 'power2.out', clearProps: 'transform,opacity' }
        );
    }

    function animCompileLine(lineId) {
        if (typeof gsap === 'undefined') return;
        // Animar el proto-box compilado (el que acababa de cerrarse)
        const lineEl = document.getElementById(`line-${lineId}`);
        if (!lineEl) return;
        const parent = lineEl.parentElement || lineEl;
        gsap.timeline()
            .to(parent, { scale: 1.05, duration: 0.12, ease: 'power3.out' })
            .to(parent, { scale: 1, duration: 0.35, ease: 'elastic.out(1.2, 0.4)' });

        // Flash blanco sobre la línea
        const flash = document.createElement('div');
        flash.style.cssText = 'position:absolute;inset:0;background:#fff;pointer-events:none;z-index:999;border-radius:8px;';
        parent.style.position = 'relative';
        parent.appendChild(flash);
        gsap.to(flash, { opacity: 0, duration: 0.4, ease: 'power2.out', onComplete: () => flash.remove() });
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

    window.flushAnimQueue = function () {
        var q = window._animQueue;
        if (!q || !q.length) return;
        window._animQueue = [];

        q.forEach(function (anim) {
            if (anim.type === 'fieldCard') {
                var stackEl = document.querySelector('#line-' + anim.line + ' .' + anim.target + '-stack');
                if (!stackEl) return;
                // La última carta del stack es la recién jugada
                var cards = stackEl.querySelectorAll('.field-card, .card');
                var last = cards[cards.length - 1];
                if (last) animCardEnterField(last, anim.target === 'ai');
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
                for (var i = start; i < hCards.length; i++) {
                    animCardEnterHand(hCards[i], (i - start) * 0.06);
                }
            }
        });
    };

})();
