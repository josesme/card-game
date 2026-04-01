/**
 * 🎵 COMPILE - Audio Manager
 * Control de música de fondo - Play/Pause (no auto-play)
 */

(function() {
    'use strict';

    const Audio = {
        bgm: null,
        _isPlaying: false,
        _initialized: false,

        // Inicializar el sistema de audio (sin reproducir)
        init: function() {
            if (this._initialized) return;
            
            console.log('[Audio] Initializing (paused, manual play)...');

            // Crear elemento de audio para BGM
            this.bgm = document.createElement('audio');
            // Ruta relativa desde src/ hacia sounds/
            this.bgm.src = '../sounds/bgm.ogg';
            this.bgm.loop = true;
            this.bgm.volume = 0.5; // Volumen al 50% por defecto
            this.bgm.preload = 'none'; // No cargar hasta que se reproduzca

            console.log('[Audio] BGM src:', this.bgm.src);

            // Manejar eventos
            this.bgm.addEventListener('canplaythrough', function() {
                console.log('[Audio] BGM ready to play');
            });

            this.bgm.addEventListener('error', function(e) {
                console.error('[Audio] Error loading BGM:', e);
                console.error('[Audio] Error details:', this.bgm.error);
            });

            this.bgm.addEventListener('playing', () => {
                this._isPlaying = true;
                console.log('[Audio] BGM is playing');
            });

            this.bgm.addEventListener('pause', () => {
                this._isPlaying = false;
                console.log('[Audio] BGM paused');
            });

            this._initialized = true;
            console.log('[Audio] Initialized (not playing)');
        },

        // Reproducir música (inicia la carga si es necesario)
        play: function() {
            if (!this.bgm) this.init();
            
            if (this.bgm && !this._isPlaying) {
                this.bgm.play().then(() => {
                    this._isPlaying = true;
                    console.log('[Audio] Playback started');
                }).catch(e => {
                    console.warn('[Audio] Playback failed:', e);
                    this._isPlaying = false;
                });
            }
        },

        // Pausar música (detiene la reproducción y libera recursos)
        pause: function() {
            if (!this.bgm || !this._isPlaying) return;
            
            this.bgm.pause();
            // Opcional: liberar recursos cargando nada
            // this.bgm.src = '';
            // this.bgm.load();
        },

        // Alternar play/pause
        togglePlayPause: function() {
            if (!this._initialized) {
                this.init();
                this.play();
            } else if (this._isPlaying) {
                this.pause();
            } else {
                this.play();
            }

            // Guardar estado
            localStorage.setItem('bgm_playing', String(this._isPlaying));

            return this._isPlaying;
        },

        // Obtener estado de reproducción
        getIsPlaying: function() {
            return this._isPlaying;
        },

        // Restaurar estado desde localStorage (solo si estaba playing)
        restoreState: function() {
            const savedPlaying = localStorage.getItem('bgm_playing');
            if (savedPlaying === 'true') {
                // Usuario quería música, pero no auto-play: mostrar botón en estado play
                // El usuario debe hacer clic para iniciar realmente
                console.log('[Audio] Previous state: playing (user must click to resume)');
            }
        },

        // Setear volumen (0.0 a 1.0)
        setVolume: function(vol) {
            if (!this.bgm) return;
            this.bgm.volume = Math.max(0, Math.min(1, vol));
        }
    };

    // Exportar globalmente
    window.AudioManager = Audio;
})();
