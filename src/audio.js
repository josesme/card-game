'use strict';

(function () {

    let ctx      = null;
    let _stopped = false;

    // ── BGM state ────────────────────────────────────────────────────────────
    const BGM_BASE_VOL  = 0.22;
    const BGM_DUCK_VOL  = 0.06;
    const DUCK_DOWN_MS  = 50;
    const DUCK_UP_MS    = 400;

    const BGM_FILES = {
        'init': 'sounds/sfx/Init.ogg',
        'game': 'sounds/sfx/Game.ogg',
    };
    const _bgmCache = new Map();
    let   _bgmSource = null;
    let   _bgmGain   = null;   // GainNode for BGM — ducked by SFX
    let   _duckTimer = null;   // pending return-to-base timeout

    // ── SFX state ────────────────────────────────────────────────────────────
    const _sfxCache  = new Map();
    let   _sfxGain   = null;
    const _activeSfx = new Set();

    const SFX_FILES = {
        'card-play':       'sounds/sfx/card-play.ogg',
        'card-flip':       'sounds/sfx/card-flip.ogg',
        'card-eliminated': 'sounds/sfx/card-eliminated.ogg',
        'compile':         'sounds/sfx/compile.ogg',
        'victory':         'sounds/sfx/victory.ogg',
        'defeat':          'sounds/sfx/defeat.ogg',
        'draw':            'sounds/sfx/draw.ogg',
    };

    // ── Context ──────────────────────────────────────────────────────────────
    function _ensureContext() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    }

    // ── BGM gain node ────────────────────────────────────────────────────────
    function _ensureBgmGain() {
        if (_bgmGain || !ctx) return;
        _bgmGain = ctx.createGain();
        _bgmGain.gain.value = BGM_BASE_VOL;
        _bgmGain.connect(ctx.destination);
    }

    // ── BGM ──────────────────────────────────────────────────────────────────
    async function _loadBGM(name) {
        if (_bgmCache.has(name)) return _bgmCache.get(name);
        const path = BGM_FILES[name];
        if (!path) return null;
        try {
            const res = await fetch(path);
            if (!res.ok) return null;
            const buf = await _ensureContext().decodeAudioData(await res.arrayBuffer());
            _bgmCache.set(name, buf);
            return buf;
        } catch (_) { return null; }
    }

    async function playBGM(name) {
        if (_stopped) return;
        _ensureContext();
        if (ctx.state === 'suspended') await ctx.resume();
        _ensureBgmGain();

        if (_bgmSource) {
            try { _bgmSource.stop(); } catch (_) {}
            _bgmSource = null;
        }

        const buf = await _loadBGM(name);
        if (!buf) return;

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop   = true;
        src.connect(_bgmGain);
        src.start();
        _bgmSource = src;
    }

    function stopBGM() {
        if (_bgmSource) {
            try { _bgmSource.stop(); } catch (_) {}
            _bgmSource = null;
        }
    }

    // ── Ducking ──────────────────────────────────────────────────────────────
    function _duck() {
        if (!_bgmGain || !ctx) return;
        clearTimeout(_duckTimer);

        const g   = _bgmGain.gain;
        const now = ctx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(BGM_DUCK_VOL, now + DUCK_DOWN_MS / 1000);

        _duckTimer = setTimeout(() => {
            if (!_bgmGain || !ctx) return;
            const t = ctx.currentTime;
            _bgmGain.gain.cancelScheduledValues(t);
            _bgmGain.gain.setValueAtTime(_bgmGain.gain.value, t);
            _bgmGain.gain.linearRampToValueAtTime(BGM_BASE_VOL, t + DUCK_UP_MS / 1000);
        }, DUCK_DOWN_MS + 80);
    }

    // ── BGM toggle (mute / unmute everything) ────────────────────────────────
    async function toggle() {
        if (!ctx) return _stopped;
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
            if (!res.ok) return null;
            const buf = await ctx.decodeAudioData(await res.arrayBuffer());
            _sfxCache.set(name, buf);
            return buf;
        } catch (_) { return null; }
    }

    function playSound(name) {
        if (_stopped || !ctx || ctx.state !== 'running') return;
        _ensureSfxGain();

        _loadSfx(name).then(buf => {
            if (!buf || !_sfxGain) return;
            _duck();
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(_sfxGain);
            src.onended = () => _activeSfx.delete(src);
            _activeSfx.add(src);
            src.start();
        });
    }

    async function preloadSounds() {
        if (!ctx) return;
        _ensureSfxGain();
        await Promise.all(Object.keys(SFX_FILES).map(name => _loadSfx(name)));
    }

    // ── Autostart BGM on first gesture (home screen) ─────────────────────────
    function _attachAutostart() {
        if (_stopped) return;
        const events = ['click', 'keydown', 'touchstart'];
        function onGesture() {
            events.forEach(ev => document.removeEventListener(ev, onGesture));
            playBGM('init').catch(() => {});
        }
        events.forEach(ev => document.addEventListener(ev, onGesture, { once: true }));
    }

    function init() {
        _stopped = localStorage.getItem('audio_stopped') === '1';
        _attachAutostart();
    }

    function stopSounds() {
        _activeSfx.forEach(src => { try { src.stop(); } catch (_) {} });
        _activeSfx.clear();
    }

    window.AudioManager = {
        init,
        toggle,
        playBGM,
        stopBGM,
        playSound,
        stopSounds,
        preloadSounds,
        isStopped: () => _stopped,
    };

})();
