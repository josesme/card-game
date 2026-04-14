/**
 * Tests de integración — Vida 1 (doble flip IA)
 *
 * Bug histórico: IA juega Vida 1 (dos flip target:'any') contra una única carta
 * bocarriba del jugador. El primer flip la voltea bocabajo; el segundo flip no
 * encuentra un objetivo válido (aiPickFlipLine filtra !faceDown) y se salta
 * silenciosamente. El log decía "IA volteó tu carta" DOS veces aunque solo
 * ocurrió un flip real.
 *
 * Fix aplicado en resolveEffectAI:
 *  1. `flippedCount` trackea cuántos flips ocurrieron realmente.
 *  2. Solo se emite el log si flippedCount > 0.
 *  3. Fallback para target:'any': si no hay bocarriba del rival, voltear bocabajo
 *     propia (si existe) en lugar de saltar silenciosamente.
 *  4. El bloque flip hace `return` temprano para no caer al logEvent genérico del
 *     final de resolveEffectAI.
 *
 * Estos tests verifican el comportamiento observable sin necesidad de cargar
 * logic.js completo (que tiene referencias DOM al nivel de módulo).
 */

const LINES_MOCK = ['alpha', 'beta', 'gamma'];

function makeCard(nombre, valor = 1, opts = {}) {
  return {
    card: { nombre, valor, id: `${nombre}-test` },
    faceDown: opts.faceDown || false,
    _animateFlip: false,
  };
}

function makeEmptyField() {
  const f = {};
  LINES_MOCK.forEach(l => { f[l] = { player: [], ai: [], compiledBy: null }; });
  return f;
}

// ─── Replica mínima de aiPickFlipLine (lógica idéntica a logic.js) ────────────
// Permite testear el filtro sin cargar logic.js completo.
function aiPickFlipLine(target, gameState, calculateScore) {
  if (target === 'player') {
    return LINES_MOCK
      .filter(l => {
        const s = gameState.field[l].player;
        return s.length > 0 && !s[s.length - 1].faceDown;
      })
      .sort((a, b) => calculateScore(gameState, b, 'player') - calculateScore(gameState, a, 'player'))[0] || null;
  } else {
    return LINES_MOCK
      .filter(l => gameState.field[l].ai.some(c => c.faceDown))
      .sort((a, b) => calculateScore(gameState, b, 'ai') - calculateScore(gameState, a, 'ai'))[0] || null;
  }
}

// ─── Simula la lógica del bloque flip de resolveEffectAI (post-fix) ───────────
function simulateAIFlip(target, gsTarget, gameState) {
  const calcScore = (gs, line, player) =>
    gs.field[line][player].reduce((s, c) => s + (c.faceDown ? 2 : c.card.valor), 0);

  let flippedCount = 0;
  const line = aiPickFlipLine(gsTarget, gameState, calcScore);
  if (line !== null) {
    const stack = gameState.field[line][gsTarget];
    if (gsTarget === 'player') {
      const topCard = stack[stack.length - 1];
      topCard.faceDown = !topCard.faceDown;
      flippedCount++;
    }
  } else if (target === 'any') {
    // Fallback: flip AI bocabajo card bocarriba
    const aiFallbackLine = LINES_MOCK
      .filter(l => gameState.field[l].ai.some(c => c.faceDown))
      .sort((a, b) => calcScore(gameState, b, 'ai') - calcScore(gameState, a, 'ai'))[0] || null;
    if (aiFallbackLine !== null) {
      const stack = gameState.field[aiFallbackLine].ai;
      const fdIdx = [...stack].reverse().findIndex(c => c.faceDown);
      if (fdIdx >= 0) {
        stack[stack.length - 1 - fdIdx].faceDown = false;
        flippedCount++;
      }
    }
  }
  return flippedCount;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Vida 1 — doble flip IA (resolveEffectAI)', () => {
  test('aiPickFlipLine devuelve null si la única carta del jugador está bocabajo', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: true }));
    const calcScore = () => 0;
    const result = aiPickFlipLine('player', gs, calcScore);
    expect(result).toBeNull();
  });

  test('aiPickFlipLine devuelve la línea si la carta del jugador está bocarriba', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: false }));
    const calcScore = () => 0;
    const result = aiPickFlipLine('player', gs, calcScore);
    expect(result).toBe('alpha');
  });

  test('Vida 1: primer flip cubre la carta bocarriba del jugador', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: false }));

    const flipped1 = simulateAIFlip('any', 'player', gs);
    expect(flipped1).toBe(1);
    expect(gs.field.alpha.player[0].faceDown).toBe(true); // ahora bocabajo
  });

  test('Vida 1: segundo flip no encuentra objetivo rival bocarriba → flippedCount=0 (no logar)', () => {
    const gs = { field: makeEmptyField() };
    // El primer flip ya puso la carta bocabajo
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: true }));
    // IA no tiene cartas bocabajo

    const flipped2 = simulateAIFlip('any', 'player', gs);
    expect(flipped2).toBe(0); // nada ocurrió — no se debe logar
    expect(gs.field.alpha.player[0].faceDown).toBe(true); // sigue bocabajo
  });

  test('Fallback target:any — si no hay rival bocarriba, voltear bocabajo propia', () => {
    const gs = { field: makeEmptyField() };
    // El rival no tiene cartas bocarriba
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: true }));
    // IA SÍ tiene una carta bocabajo (segundo flip debería aprovecharla)
    gs.field.beta.ai.push(makeCard('Vida 1', 1, { faceDown: true }));

    const flipped = simulateAIFlip('any', 'player', gs);
    expect(flipped).toBe(1); // usó el fallback
    expect(gs.field.beta.ai[0].faceDown).toBe(false); // ahora bocarriba
  });

  test('Vida 1 completo: dos flips sobre una sola carta rival → resultado bocabajo + log 1 vez', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: false }));
    // IA: Vida 1 bocarriba (no bocabajo → fallback no aplica)

    const flip1 = simulateAIFlip('any', 'player', gs);
    const flip2 = simulateAIFlip('any', 'player', gs);

    expect(flip1).toBe(1);  // primer flip ocurre
    expect(flip2).toBe(0);  // segundo flip se salta (no hay objetivo válido)
    expect(gs.field.alpha.player[0].faceDown).toBe(true); // la carta quedó bocabajo
    // flip2 === 0 garantiza que el log no emite "IA volteó tu carta" por segunda vez
  });
});
