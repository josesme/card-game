'use strict';

(function () {

    let ctx      = null;
    let _stopped = false;

    // ── BGM state ────────────────────────────────────────────────────────────
    const BGM_BASE_VOL  = 0.11;
    const BGM_DUCK_VOL  = 0.06;
    const DUCK_DOWN_MS  = 50;
    const DUCK_UP_MS    = 400;

    const AMBIENT_INDEX = 'sounds/sfx/ambient/index.json';
    let   _ambientList  = null;   // cargado una vez, luego cacheado
    const _bgmCache  = new Map();
    let   _bgmSource = null;
    let   _bgmGain   = null;   // GainNode for BGM — ducked by SFX
    let   _duckTimer = null;   // pending return-to-base timeout
    let   _bgmGen    = 0;      // generación — aborta llamadas async obsoletas

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
        'transition':      'sounds/sfx/transition.ogg',
    };

    // Volumen individual por slot (relativo al _sfxGain global de 0.65).
    // Slots sin entrada usan 1.0 (sin cambio).
    const SFX_VOL = {
        'card-play':       0.7,
        'card-flip':       0.5,
        'card-eliminated': 0.8,
        'compile':         1.0,
        'victory':         1.0,
        'defeat':          1.0,
        'draw':            0.7,
        'transition':      0.8,
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
    async function _resolveAmbientPath() {
        if (!_ambientList) {
            try {
                const res = await fetch(AMBIENT_INDEX);
                _ambientList = res.ok ? await res.json() : [];
            } catch (_) { _ambientList = []; }
        }
        if (!_ambientList.length) return null;
        const file = _ambientList[Math.floor(Math.random() * _ambientList.length)];
        return `sounds/sfx/ambient/${file}`;
    }

    async function playBGM() {
        if (_stopped) return;
        const gen = ++_bgmGen;

        _ensureContext();
        if (ctx.state === 'suspended') await ctx.resume();
        if (gen !== _bgmGen) return;
        _ensureBgmGain();

        if (_bgmSource) {
            try { _bgmSource.stop(); } catch (_) {}
            _bgmSource = null;
        }

        const path = await _resolveAmbientPath();
        if (!path || gen !== _bgmGen) return;

        let buf = _bgmCache.get(path);
        if (!buf) {
            try {
                const res = await fetch(path);
                if (!res.ok) return;
                buf = await ctx.decodeAudioData(await res.arrayBuffer());
                _bgmCache.set(path, buf);
            } catch (_) { return; }
        }
        if (gen !== _bgmGen) return;

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
        if (!ctx) {
            // ctx nunca se creó: o nunca hubo gesto, o la página se recargó con audio muted.
            // Si estaba silenciado, interpretamos el click como "activar" — arrancamos.
            if (_stopped) {
                _stopped = false;
                localStorage.setItem('audio_stopped', '0');
                await playBGM();
            }
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
            const vol = SFX_VOL[name] ?? 1.0;
            if (vol !== 1.0) {
                const slotGain = ctx.createGain();
                slotGain.gain.value = vol;
                src.connect(slotGain);
                slotGain.connect(_sfxGain);
            } else {
                src.connect(_sfxGain);
            }
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
            playBGM().catch(() => {});
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
