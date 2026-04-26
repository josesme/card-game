'use strict';

(function () {

    // ── BGM state ────────────────────────────────────────────────────────────
    let ctx         = null;
    let introBuffer = null;
    let loopBuffer  = null;
    let _loaded     = false;
    let _started    = false;
    let _stopped    = false;

    // ── SFX state ────────────────────────────────────────────────────────────
    const _sfxCache = new Map();   // name → AudioBuffer
    let   _sfxGain  = null;        // GainNode shared by all SFX

    // Sound slots — drop the matching .ogg file in sounds/sfx/ to activate each one.
    const SFX_FILES = {
        'card-play':    'sounds/sfx/card-play.ogg',
        'card-facedown':'sounds/sfx/card-facedown.ogg',
        'compile':      'sounds/sfx/compile.ogg',
        'victory':      'sounds/sfx/victory.ogg',
        'defeat':       'sounds/sfx/defeat.ogg',
        'draw':         'sounds/sfx/draw.ogg',
        'ability':      'sounds/sfx/ability.ogg',
        'turn-end':     'sounds/sfx/turn-end.ogg',
    };

    // ── BGM load + start ─────────────────────────────────────────────────────
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

    // ── BGM toggle ───────────────────────────────────────────────────────────
    async function toggle() {
        if (!_started) {
            _stopped = false;
            await _start();
            return _stopped;
        }

        if (ctx.state === 'running') {
            await ctx.suspend();
            _stopped = true;
        } else {
            await ctx.resume();
            _stopped = false;
        }

        localStorage.setItem('audio_stopped', _stopped ? '1' : '0');
        return _stopped;
    }

    // ── SFX helpers ──────────────────────────────────────────────────────────
    function _ensureSfxGain() {
        if (_sfxGain || !ctx) return;
        _sfxGain = ctx.createGain();
        _sfxGain.gain.value = 0.65;
        _sfxGain.connect(ctx.destination);
    }

    async function _loadSfx(name) {
        if (_sfxCache.has(name)) return _sfxCache.get(name);
        const path = SFX_FILES[name];
        if (!path || !ctx) return null;

        try {
            const res = await fetch(path);
            if (!res.ok) return null;           // file not yet present — silent skip
            const buf = await ctx.decodeAudioData(await res.arrayBuffer());
            _sfxCache.set(name, buf);
            return buf;
        } catch (_) {
            return null;                        // decode error — silent skip
        }
    }

    // Fire-and-forget one-shot SFX. Safe to call from anywhere in logic.js.
    function playSound(name) {
        if (_stopped || !ctx || ctx.state !== 'running') return;
        _ensureSfxGain();

        _loadSfx(name).then(buf => {
            if (!buf || !_sfxGain) return;
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(_sfxGain);
            src.start();
        });
    }

    // Call once when the game view initialises to warm up the cache.
    async function preloadSounds() {
        if (!ctx) return;
        _ensureSfxGain();
        await Promise.all(Object.keys(SFX_FILES).map(name => _loadSfx(name)));
    }

    // ── Autostart on first gesture ───────────────────────────────────────────
    function _attachAutostart() {
        if (_stopped) return;
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
        playSound,
        preloadSounds,
        isStopped: () => _stopped,
    };

})();
