/**
 * <compile-card> — Web Component basado en el diseño Pencil "cards"
 *
 * Atributos:
 *   valor      — número de valor (0-6)
 *   protocolo  — nombre del elemento (Apatía, Fuego, etc.)
 *   h-inicio   — texto de la fase de inicio
 *   h-accion   — texto de la fase de acción
 *   h-final    — texto de la fase final
 *   face-down  — (booleano) muestra la carta bocabajo
 *   img-base   — ruta base para las imágenes (default: "../images")
 *   accent     — color hex del borde/acento del elemento
 *
 * Uso:
 *   <compile-card
 *     valor="2"
 *     protocolo="Apatía"
 *     h-inicio=""
 *     h-accion="Ignora todos los comandos de acción de las cartas en esta línea."
 *     h-final="Si se cubre esta carta: Primero, voltea esta carta."
 *     accent="#6b7280">
 *   </compile-card>
 */
class CompileCard extends HTMLElement {
  static get observedAttributes() {
    return ['valor', 'protocolo', 'h-inicio', 'h-accion', 'h-final', 'face-down', 'img-base', 'accent'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback()              { this._render(); }
  attributeChangedCallback()       { this._render(); }

  _render() {
    const valor     = this.getAttribute('valor')     ?? '?';
    const proto     = this.getAttribute('protocolo') ?? '';
    const hInicio   = this.getAttribute('h-inicio')  ?? '';
    const hAccion   = this.getAttribute('h-accion')  ?? '';
    const hFinal    = this.getAttribute('h-final')   ?? '';
    const faceDown  = this.hasAttribute('face-down');
    const imgBase   = this.getAttribute('img-base')  ?? '../images';
    const accent    = this.getAttribute('accent')    ?? '#7C818B';

    const imgUrl    = proto
      ? `${imgBase}/${proto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.png`
      : '';

    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&display=swap');

        :host {
          display: inline-block;
          width: 520px;
          height: 760px;
          font-size: 16px;
        }

        /* ── Outer frame ─────────────────────────────────────────── */
        .outer {
          width: 520px;
          height: 760px;
          padding: 32px;
          box-sizing: border-box;
          display: flex;
          align-items: stretch;
          position: relative;
          overflow: hidden;
        }

        .outer::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('${imgUrl}');
          background-size: cover;
          background-position: center;
        }

        .outer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: #1B1D22CC;
        }

        /* ── Inner card ──────────────────────────────────────────── */
        .inner {
          position: relative;
          z-index: 1;
          flex: 1;
          border: 1px solid ${accent};
          box-shadow: 0 0 24px ${accent}55;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 20px 18px 20px;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* ── Header ──────────────────────────────────────────────── */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }

        .num-box {
          width: 86px;
          height: 126px;
          border-radius: 4px;
          border: 2px solid ${accent};
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }

        .num-text {
          font-family: 'Orbitron', sans-serif;
          font-size: 86px;
          font-weight: 700;
          color: #F5F5F5;
          line-height: 1;
        }

        .title-chip {
          border-radius: 4px;
          border: 2px solid ${accent};
          padding: 8px 14px;
        }

        .title-text {
          font-family: 'Orbitron', sans-serif;
          font-size: 34px;
          font-weight: 700;
          color: #F5F5F5;
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        /* ── Zones ───────────────────────────────────────────────── */
        .zone {
          width: 100%;
          flex: 1;
          min-height: 0;
          background: #141820CC;
          border: 1px solid #676E79;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 14px;
          box-sizing: border-box;
          overflow: hidden;
        }

        .zone-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 2px;
          color: #B3BAC4;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .zone-body {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12.5px;
          font-weight: 400;
          line-height: 1.45;
          color: #E2E6ED;
          overflow: hidden;
        }

        .zone.empty .zone-label {
          opacity: 0.3;
        }

        /* ── Divider ─────────────────────────────────────────────── */
        .rule {
          height: 1px;
          background: #59616D;
          flex-shrink: 0;
        }

        /* ── Face-down ───────────────────────────────────────────── */
        .face-down-overlay {
          display: none;
          position: absolute;
          inset: 0;
          z-index: 10;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #10121800;
        }

        .inner.is-face-down .header,
        .inner.is-face-down .zone,
        .inner.is-face-down .rule {
          visibility: hidden;
        }

        .inner.is-face-down .face-down-overlay {
          display: flex;
        }

        .face-down-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 110px;
          font-weight: 700;
          color: #F5F5F5;
          line-height: 1;
        }

        .face-down-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 4px;
          color: #B3BAC4;
          text-transform: uppercase;
        }
      </style>

      <div class="outer">
        <div class="inner${faceDown ? ' is-face-down' : ''}">

          <!-- Header -->
          <div class="header">
            <div class="num-box">
              <span class="num-text">${valor}</span>
            </div>
            <div class="title-chip">
              <span class="title-text">${proto}</span>
            </div>
          </div>

          <!-- Zona INICIO -->
          <div class="zone${hInicio ? '' : ' empty'}">
            <div class="zone-label">Inicio</div>
            <div class="zone-body">${hInicio}</div>
          </div>

          <div class="rule"></div>

          <!-- Zona ACCIÓN -->
          <div class="zone${hAccion ? '' : ' empty'}">
            <div class="zone-label">Acción</div>
            <div class="zone-body">${hAccion}</div>
          </div>

          <div class="rule"></div>

          <!-- Zona FINAL -->
          <div class="zone${hFinal ? '' : ' empty'}">
            <div class="zone-label">Final</div>
            <div class="zone-body">${hFinal}</div>
          </div>

          <!-- Face-down overlay -->
          <div class="face-down-overlay">
            <span class="face-down-value">2</span>
            <span class="face-down-label">Compile</span>
          </div>

        </div>
      </div>
    `;
  }
}

customElements.define('compile-card', CompileCard);
