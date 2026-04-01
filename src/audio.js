/**
 * 🎵 COMPILE - Audio Manager
 * Control de música de fondo
 */

(function() {
    'use strict';

    const Audio = {
        bgm: null,
        _isMuted: false,

        // Inicializar el sistema de audio
        init: function() {
            console.log('[Audio] Initializing...');

            // Crear elemento de audio para BGM
            this.bgm = document.createElement('audio');
            // Ruta relativa desde src/ hacia sounds/
            // Usamos OGG (mejor compresión) con fallback a MP3
            this.bgm.src = '../sounds/bgm.ogg';
            this.bgm.loop = true;
            this.bgm.volume = 0.5; // Volumen al 50% por defecto

            console.log('[Audio] BGM src:', this.bgm.src);

            // Cargar preferencia de mute desde localStorage
            const savedMute = localStorage.getItem('bgm_muted');
            this._isMuted = (savedMute === 'true');
            
            if (this._isMuted) {
                this.bgm.muted = true;
                console.log('[Audio] Mute preference loaded: muted');
            } else {
                console.log('[Audio] Mute preference loaded: unmuted');
            }

            // Manejar eventos
            this.bgm.addEventListener('canplaythrough', function() {
                console.log('[Audio] BGM ready to play');
            });

            this.bgm.addEventListener('error', function(e) {
                console.error('[Audio] Error loading BGM:', e);
                console.error('[Audio] Error details:', this.bgm.error);
            });

            this.bgm.addEventListener('playing', function() {
                console.log('[Audio] BGM is playing');
            });

            // Intentar reproducir (puede fallar si no hay interacción del usuario)
            this.play();
        },

        // Reproducir música
        play: function() {
            if (!this.bgm) return;

            // Los navegadores requieren interacción del usuario para reproducir audio
            this.bgm.play().catch(function(e) {
                console.log('[Audio] Autoplay bloqueado, se iniciará con la primera interacción');
            });
        },

        // Pausar música (no usar en este juego, solo para completar API)
        pause: function() {
            if (!this.bgm) return;
            this.bgm.pause();
        },

        // Alternar mute/unmute
        toggleMute: function() {
            this._isMuted = !this._isMuted;

            if (this.bgm) {
                this.bgm.muted = this._isMuted;
            }

            // Guardar preferencia
            localStorage.setItem('bgm_muted', String(this._isMuted));

            return this._isMuted;
        },

        // Obtener estado actual de mute
        getIsMuted: function() {
            return this._isMuted;
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
