/**
 * MODAL_COPY — Textos centralizados de todos los modales de confirmación.
 *
 * Cada entrada: { msg, yes, no }
 *   msg  — texto del modal. Usa {name} para el nombre de la carta activa,
 *           {flipped} para la carta volteada, {n} para contadores, {line} para líneas.
 *   yes  — etiqueta del botón izquierdo (acción principal)
 *   no   — etiqueta del botón derecho (acción secundaria / cancelar)
 *
 * Para editar un texto: cambia el valor aquí. Sin tocar abilities-engine.js.
 */
const MODAL_COPY = {

  // ── Descarte ─────────────────────────────────────────────────────────────
  optionalDiscard: {
    msg: '{name}: ¿Descartas 1 carta para activar el efecto?',
    yes: 'SÍ', no: 'NO'
  },
  optionalDiscardOrFlipSelf: {
    msg: '{name}: ¿Qué quieres hacer: Descartar 1 carta o voltear esta carta?',
    yes: 'DESCARTAR', no: 'VOLTEAR'
  },
  optionalDiscardOrDeleteSelf: {
    msg: '{name}: ¿Descartas 1 carta o eliminas esta carta?',
    yes: 'DESCARTAR', no: 'ELIMINAR'
  },
  optionalDiscardThenOpponentDiscard: {
    msg: '{name}: ¿Quieres descartar 1 carta? Si lo haces, tu oponente también descartará 1.',
    yes: 'SÍ', no: 'NO'
  },
  optionalDiscardThenFlipHighValue: {
    msg: '{name}: ¿Quieres descartar 1 carta?',
    yes: 'SÍ', no: 'NO'
  },
  _discardForDrawLoop: {
    msg: '{name}: ¿Quieres descartar otra carta? Robas {n} si paras ahora.',
    yes: 'SÍ', no: 'NO'
  },

  // ── Voltear ──────────────────────────────────────────────────────────────
  mayFlip_self: {
    msg: '{name}: ¿Quieres voltear esta carta?',
    yes: 'SÍ', no: 'NO'
  },
  mayFlip_faceDown: {
    msg: '{name}: ¿Quieres voltear 1 carta bocabajo?',
    yes: 'SÍ', no: 'NO'
  },
  mayFlip_any: {
    msg: '{name}: ¿Quieres voltear 1 carta?',
    yes: 'SÍ', no: 'NO'
  },
  mayFlipSelf: {
    msg: '{name}: ¿Voltear esta carta?',
    yes: 'SÍ', no: 'NO'
  },
  mayFlipCovered: {
    msg: '{name}: ¿Quieres voltear una carta cubierta de esta línea?',
    yes: 'SÍ', no: 'NO'
  },
  mayFlipOwnCovered: {
    msg: '{name}: ¿Quieres voltear una de tus cartas bocarriba cubiertas?',
    yes: 'SÍ', no: 'NO'
  },
  mayFlipCoveredFaceUp: {
    msg: '{name}: ¿Quieres voltear una carta cubierta bocarriba?',
    yes: 'SÍ', no: 'NO'
  },
  mayFlipOrDrawIfUnityOnField: {
    msg: '{name}: ¿Volteas 1 carta o Robas 1 carta?',
    yes: 'VOLTEAR', no: 'ROBAR'
  },

  // ── Cambiar ──────────────────────────────────────────────────────
  mayShift: {
    msg: '¿Quieres cambiar de línea "{flipped}"?',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftSelf: {
    msg: '¿Quieres cambiar {name} a otra línea?',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftLastFlipped: {
    msg: '{name}: ¿Cambias {flipped} a otra línea?',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftOrFlip: {
    msg: '{name}: ¿Qué quieres hacer: Cambiar carta de línea o Voltear carta?',
    yes: 'CAMBIAR', no: 'VOLTEAR'
  },
  mayShiftSelfIfCovered: {
    msg: '{name}: Está cubierta. ¿Quieres cambiarla a otra línea?',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftSelfToHighestOpponentLine: {
    msg: '{name}: ¿Cambias esta carta a {line} (línea más fuerte del rival)?',
    yes: 'SÍ', no: 'NO'
  },
  optionalShiftThenFlipSelf: {
    msg: '¿Cambias 1 de tus cartas de línea? ({name} se volteará si lo haces)',
    yes: 'SÍ', no: 'NO'
  },

  // ── Devolver / Dar ───────────────────────────────────────────────────────
  mayReturnAndFlip: {
    msg: '¿Quieres devolver 1 carta del oponente? (Si lo haces, {name} se voltea)',
    yes: 'SÍ', no: 'NO'
  },
  mayGiveCardForDraw: {
    msg: '{name}: ¿Das 1 carta a tu oponente para robar {count} cartas?',
    yes: 'SÍ', no: 'NO'
  },

  // ── Robar / Eliminar ─────────────────────────────────────────────────────
  optionalDrawThenDelete: {
    msg: '{name}: ¿Robas 1 carta? (Si lo haces, elimina 1 carta rival y luego esta carta se elimina)',
    yes: 'SÍ', no: 'NO'
  },

  // ── Mazo ─────────────────────────────────────────────────────────────────
  mayShuffleDiscardIntoDeck: {
    msg: '{name}: ¿Barajes tu descarte ({count} cartas) en tu mazo?',
    yes: 'SÍ', no: 'NO'
  },

  // ── Jugar carta ──────────────────────────────────────────────────────────
  playOnAnySide: {
    msg: '{name}: ¿Jugar en tu lado o en el lado rival?',
    yes: 'MI LADO', no: 'LADO RIVAL'
  },
  playHandFaceDown_may: {
    msg: '{name}: ¿Quieres jugar 1 carta bocabajo?',
    yes: 'SÍ', no: 'NO'
  },
  playNonDiversityCard: {
    msg: 'Diversidad 0 Final: ¿Quieres jugar 1 carta (no Diversidad) bocarriba en esta línea?',
    yes: 'SÍ', no: 'NO'
  },

  // ── Efectos especiales ───────────────────────────────────────────────────
  copyOpponentCardEffect: {
    msg: '{name}: ¿Quieres copiar el efecto de una carta del rival?',
    yes: 'SÍ', no: 'NO'
  },

  // ── Cartas con dropdown (el msg va en confirmMsg.innerHTML, los botones los lee el código) ──
  luckCallProtocolDiscard: {
    msg: '{name}: Elige un Protocolo',
    yes: 'CONFIRMAR', no: 'CANCELAR'
  },
  luckDraw3PickByValue: {
    msg: '{name}: Elige un valor numérico (0–6)',
    yes: 'CONFIRMAR', no: 'CANCELAR'
  },
};
