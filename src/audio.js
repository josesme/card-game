'use strict';

(function () {

    let ctx         = null;
    let introBuffer = null;
    let loopBuffer  = null;
    let _loaded     = false;
    let _started    = false;
    let _stopped    = false;   // true = usuario lo detuvo explícitamente

    // ── Carga ambos buffers en paralelo ──────────────────────────────────
    async function _load() {
        if (_loaded) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        const [introData, loopData] = await Promise.all([
            fetch('sounds/inicio.ogg').then(r => r.arrayBuffer()),
            fetch('sounds/bucle.ogg').then(r => r.arrayBuffer()),
        ]);
        [introBuffer, loopBuffer] = await Promise.all([
            ctx.decodeAudioData(introData),
            ctx.decodeAudioData(loopData),
        ]);
        _loaded = true;
    }

    // ── Inicia reproducción: intro → loop gapless ────────────────────────
    async function _start() {
        await _load();
        if (ctx.state === 'suspended') await ctx.resume();

        const now = ctx.currentTime;

        const intro = ctx.createBufferSource();
        intro.buffer = introBuffer;
        intro.connect(ctx.destination);
        intro.start(now);

        const loop = ctx.createBufferSource();
        loop.buffer = loopBuffer;
        loop.loop   = true;
        loop.connect(ctx.destination);
        loop.start(now + introBuffer.duration);

        _started = true;
    }

    // ── Toggle: suspend (pausa real, sin CPU) / resume ───────────────────
    async function toggle() {
        if (!_started) {
            // Primera vez: arrancar
            _stopped = false;
            await _start();
            return _stopped;
        }

        if (ctx.state === 'running') {
            await ctx.suspend();   // pausa real — libera CPU de audio
            _stopped = true;
        } else {
            await ctx.resume();
            _stopped = false;
        }

        localStorage.setItem('audio_stopped', _stopped ? '1' : '0');
        return _stopped;
    }

    // ── Arranque en primera interacción del usuario ───────────────────────
    function _attachAutostart() {
        if (_stopped) return;   // usuario lo desactivó — no arrancar
        const events = ['click', 'keydown', 'touchstart'];
        function onGesture() {
            events.forEach(ev => document.removeEventListener(ev, onGesture));
            _start().catch(() => {});
        }
        events.forEach(ev => document.addEventListener(ev, onGesture, { once: true }));
    }

    function init() {
        _stopped = localStorage.getItem('audio_stopped') === '1';
        _attachAutostart();
    }

    window.AudioManager = {
        init,
        toggle,
        isStopped: () => _stopped,
    };

})();
