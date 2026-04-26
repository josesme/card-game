'use strict';

(function () {

    let ctx          = null;   // AudioContext
    let gainNode     = null;   // master gain — mute sin detener
    let introBuffer  = null;
    let loopBuffer   = null;
    let introSource  = null;
    let loopSource   = null;
    let _loaded      = false;
    let _started     = false;
    let _muted       = false;

    // ── Carga ambos buffers en paralelo ──────────────────────────────────
    async function _load() {
        if (_loaded) return;
        ctx      = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        gainNode.gain.value = _muted ? 0 : 1;

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
    async function play() {
        if (_started) return;
        try {
            await _load();
            if (ctx.state === 'suspended') await ctx.resume();

            const now = ctx.currentTime;

            // Intro — se reproduce una sola vez
            introSource = ctx.createBufferSource();
            introSource.buffer = introBuffer;
            introSource.connect(gainNode);
            introSource.start(now);

            // Loop — empieza exactamente al terminar el intro
            loopSource = ctx.createBufferSource();
            loopSource.buffer = loopBuffer;
            loopSource.loop   = true;
            loopSource.connect(gainNode);
            loopSource.start(now + introBuffer.duration);

            _started = true;
        } catch (e) {
            console.warn('[Audio] play failed:', e);
        }
    }

    // ── Mute / unmute via GainNode — sin detener ni reiniciar ────────────
    function setMuted(muted) {
        _muted = muted;
        if (gainNode) gainNode.gain.value = muted ? 0 : 1;
        localStorage.setItem('bgm_muted', muted ? '1' : '0');
    }

    function toggleMute() {
        setMuted(!_muted);
        return _muted;
    }

    // ── Arranque en primera interacción del usuario ───────────────────────
    // Los navegadores bloquean audio hasta que hay un gesto explícito.
    function _attachAutostart() {
        const events = ['click', 'keydown', 'touchstart'];
        function onGesture() {
            events.forEach(ev => document.removeEventListener(ev, onGesture));
            play();
        }
        events.forEach(ev => document.addEventListener(ev, onGesture, { once: true }));
    }

    // ── Init público ──────────────────────────────────────────────────────
    function init() {
        _muted = localStorage.getItem('bgm_muted') === '1';
        _attachAutostart();
    }

    window.AudioManager = {
        init,
        play,
        toggleMute,
        getIsMuted: () => _muted,
    };

})();
