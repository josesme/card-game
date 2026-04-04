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
    msg: '{name}: ¿Qué quieres hacer: Descartar 1 carta o Voltear esta carta?',
    yes: 'DESCARTAR', no: 'VOLTEAR'
  },
  optionalDiscardOrDeleteSelf: {
    msg: '{name}: ¿Descartas 1 carta? NO = esta carta es eliminada.',
    yes: 'SÍ', no: 'NO'
  },
  optionalDiscardThenOpponentDiscard: {
    msg: '{name}: ¿Descartas 1 carta? Si lo haces, tu oponente también descartará 1.',
    yes: 'SÍ', no: 'NO'
  },
  optionalDiscardThenFlipHighValue: {
    msg: 'Paz 3: ¿Descartas 1 carta? (opcional)',
    yes: 'SÍ', no: 'NO'
  },
  _discardForDrawLoop: {
    msg: '{name}: ¿Descartas otra carta? Robas {n} si paras ahora.',
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
    msg: '{name}: ¿Volteas una carta cubierta bocarriba?',
    yes: 'SÍ', no: 'NO'
  },
  mayFlipOrDrawIfUnityOnField: {
    msg: 'Unidad 0: ¿Volteas 1 carta (SÍ) o Robas 1 carta (NO)?',
    yes: 'SÍ', no: 'NO'
  },

  // ── Mover / Cambiar ──────────────────────────────────────────────────────
  mayShift: {
    msg: '¿Quieres cambiar de línea "{flipped}"?',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftSelf: {
    msg: '¿Quieres mover {name} a otra línea?',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftLastFlipped: {
    msg: '{name}: ¿Cambias {flipped} a otra línea?',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftOrFlip: {
    msg: '{name}: ¿qué quieres hacer? SÍ = Cambiar carta de línea · NO = Voltear carta',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftSelfIfCovered: {
    msg: '{name}: está cubierta. ¿Quieres cambiarla a otra línea?',
    yes: 'SÍ', no: 'NO'
  },
  mayShiftSelfToHighestOpponentLine: {
    msg: 'Valor 3: ¿Cambias esta carta a {line} (línea más fuerte del rival)?',
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
    msg: '{name}: ¿Robas 1 carta? (Si lo haces, elimina 1 carta rival y luego esta carta se destruye)',
    yes: 'SÍ', no: 'NO'
  },

  // ── Mazo ─────────────────────────────────────────────────────────────────
  mayShuffleDiscardIntoDeck: {
    msg: '{name}: ¿Barajes tu descarte ({count} cartas) en tu mazo?',
    yes: 'SÍ', no: 'NO'
  },

  // ── Jugar carta ──────────────────────────────────────────────────────────
  playHandFaceDown_may: {
    msg: '{name}: ¿Jugar 1 carta bocabajo?',
    yes: 'SÍ', no: 'NO'
  },
  playNonDiversityCard: {
    msg: 'Diversidad 0 Final: ¿Jugar 1 carta (no Diversidad) bocarriba en esta línea?',
    yes: 'SÍ', no: 'NO'
  },

  // ── Efectos especiales ───────────────────────────────────────────────────
  copyOpponentCardEffect: {
    msg: '{name}: ¿Copias el efecto de una carta del rival?',
    yes: 'SÍ', no: 'NO'
  },

  // ── Cartas con dropdown (el msg va en confirmMsg.innerHTML, los botones los lee el código) ──
  luckCallProtocolDiscard: {
    msg: '{name}: Declara un Protocolo',
    yes: 'SÍ', no: 'NO'
  },
  luckDraw3PickByValue: {
    msg: '{name}: ¿Qué número declaras? (0–6)',
    yes: 'SÍ', no: 'NO'
  },
};
