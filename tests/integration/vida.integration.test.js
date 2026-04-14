/**
 * Tests de integración — Vida 1 (doble flip IA)
 *
 * Bug histórico: IA juega Vida 1 (dos flip target:'any') contra una única carta
 * bocarriba del jugador. El flip de la IA solo contemplaba bocarriba→bocabajo
 * para el jugador (unidireccional). No evaluaba voltear sus propias cartas
 * (ej. bocarriba valor 1 → bocabajo valor 2 = ganancia de 1 punto).
 *
 * Fix aplicado en resolveEffectAI:
 *   Para target:'any' (sin filtro), evaluar TODAS las cartas descubiertas con
 *   función de beneficio real (bidireccional, ambos lados):
 *     player bocarriba (V) → bocabajo (2):  +(V−2)
 *     player bocabajo  (2) → bocarriba (V): +(2−V)
 *     AI    bocarriba (V) → bocabajo  (2):  +(2−V)  [gana si V<2]
 *     AI    bocabajo  (2) → bocarriba (V):  +(V−2)  [gana si V>2]
 *   La IA elige siempre el flip de mayor beneficio.
 *
 * Escenario concreto (el que reportó el bug):
 *   Mesa: Vida 1 IA (bocarriba, valor 1) + Unidad 5 jugador (bocarriba, valor 5)
 *   1er flip → Unidad 5 jugador (bocarriba→bocabajo): beneficio +3
 *   2do flip → Vida 1 IA    (bocarriba→bocabajo): beneficio +1
 *   Resultado: player queda en valor 2, IA queda en valor 2
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

// ─── Replica mínima de aiPickFlipLine (idéntica a logic.js) ──────────────────
function aiPickFlipLine(target, gameState) {
  if (target === 'player') {
    return LINES_MOCK
      .filter(l => {
        const s = gameState.field[l].player;
        return s.length > 0 && !s[s.length - 1].faceDown;
      })
      .sort((a, b) => {
        const scoreA = gameState.field[a].player.reduce((s, c) => s + (c.faceDown ? 2 : c.card.valor), 0);
        const scoreB = gameState.field[b].player.reduce((s, c) => s + (c.faceDown ? 2 : c.card.valor), 0);
        return scoreB - scoreA;
      })[0] || null;
  } else {
    return LINES_MOCK
      .filter(l => gameState.field[l].ai.some(c => c.faceDown))
      .sort((a, b) => {
        const scoreA = gameState.field[a].ai.reduce((s, c) => s + (c.faceDown ? 2 : c.card.valor), 0);
        const scoreB = gameState.field[b].ai.reduce((s, c) => s + (c.faceDown ? 2 : c.card.valor), 0);
        return scoreB - scoreA;
      })[0] || null;
  }
}

// ─── Replica del bloque flip target:'any' de resolveEffectAI (post-fix) ───────
function simulateAIFlipAny(gameState, excludeCardName = null) {
  let bestCardObj = null, bestLine = null, bestSide = null, bestBenefit = -Infinity;

  ['player', 'ai'].forEach(side => {
    LINES_MOCK.forEach(line => {
      const stack = gameState.field[line][side];
      if (stack.length === 0) return;
      const topCard = stack[stack.length - 1];
      if (excludeCardName && topCard.card.nombre === excludeCardName) return;

      const benefit = !topCard.faceDown
        ? (side === 'player' ? topCard.card.valor - 2 : 2 - topCard.card.valor)
        : (side === 'ai'    ? topCard.card.valor - 2 : 2 - topCard.card.valor);

      if (benefit > bestBenefit) {
        bestBenefit = benefit;
        bestCardObj = topCard; bestLine = line; bestSide = side;
      }
    });
  });

  if (bestCardObj !== null) {
    bestCardObj.faceDown = !bestCardObj.faceDown;
    return { side: bestSide, line: bestLine, cardObj: bestCardObj, benefit: bestBenefit };
  }
  return null;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Vida 1 — función de beneficio para target:any (post-fix)', () => {

  test('aiPickFlipLine(player) devuelve null si la única carta del jugador está bocabajo', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: true }));
    expect(aiPickFlipLine('player', gs)).toBeNull();
  });

  test('aiPickFlipLine(player) devuelve la línea si la carta del jugador está bocarriba', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: false }));
    expect(aiPickFlipLine('player', gs)).toBe('alpha');
  });

  test('1er flip — Unidad 5 jugador (bocarriba V=5): beneficio +3, carta pasa a bocabajo', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: false }));
    gs.field.alpha.ai.push(makeCard('Vida 1', 1, { faceDown: false }));

    const result = simulateAIFlipAny(gs);
    expect(result).not.toBeNull();
    expect(result.side).toBe('player');       // target: carta del jugador
    expect(result.benefit).toBe(3);           // 5 - 2 = 3
    expect(gs.field.alpha.player[0].faceDown).toBe(true);  // ahora bocabajo
    expect(gs.field.alpha.ai[0].faceDown).toBe(false);     // Vida 1 sin tocar
  });

  test('2do flip — Vida 1 IA (bocarriba V=1): beneficio +1, carta pasa a bocabajo', () => {
    const gs = { field: makeEmptyField() };
    // Estado tras el 1er flip: Unidad 5 ya está bocabajo
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: true }));
    gs.field.alpha.ai.push(makeCard('Vida 1', 1, { faceDown: false }));

    const result = simulateAIFlipAny(gs);
    expect(result).not.toBeNull();
    expect(result.side).toBe('ai');           // target: propia carta de la IA
    expect(result.benefit).toBe(1);           // 2 - 1 = 1
    expect(gs.field.alpha.ai[0].faceDown).toBe(true);      // Vida 1 ahora bocabajo (valor 2)
    expect(gs.field.alpha.player[0].faceDown).toBe(true);  // Unidad 5 sin tocar
  });

  test('Vida 1 completo — ambos flips ocurren, resultado final correcto', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.player.push(makeCard('Unidad 5', 5, { faceDown: false }));
    gs.field.alpha.ai.push(makeCard('Vida 1', 1, { faceDown: false }));

    const flip1 = simulateAIFlipAny(gs);
    const flip2 = simulateAIFlipAny(gs);

    // Ambos flips ocurrieron (no se saltó ninguno)
    expect(flip1).not.toBeNull();
    expect(flip2).not.toBeNull();

    // El 1er flip cubrió Unidad 5 (player), el 2do cubrió Vida 1 (AI)
    expect(flip1.side).toBe('player');
    expect(flip2.side).toBe('ai');

    // Estado final: ambas cartas bocabajo (valor 2 cada una)
    expect(gs.field.alpha.player[0].faceDown).toBe(true);
    expect(gs.field.alpha.ai[0].faceDown).toBe(true);
  });

  test('Beneficio correcto — AI bocabajo V=4 → bocarriba: beneficio +2', () => {
    const gs = { field: makeEmptyField() };
    gs.field.alpha.ai.push(makeCard('Agua 4', 4, { faceDown: true }));

    const result = simulateAIFlipAny(gs);
    expect(result).not.toBeNull();
    expect(result.side).toBe('ai');
    expect(result.benefit).toBe(2);    // 4 - 2 = 2
    expect(gs.field.alpha.ai[0].faceDown).toBe(false); // revelada
  });

  test('Tie-break — si hay dos candidatos con el mismo beneficio, el orden es estable', () => {
    const gs = { field: makeEmptyField() };
    // Dos cartas con el mismo beneficio: player V=4 (benefit=2) vs AI V=0 (benefit=2)
    gs.field.alpha.player.push(makeCard('Plaga 4', 4, { faceDown: false }));
    gs.field.beta.ai.push(makeCard('Apatía 0', 0, { faceDown: false }));

    const result = simulateAIFlipAny(gs);
    expect(result).not.toBeNull();
    expect(result.benefit).toBe(2); // ambos tienen beneficio 2
    // El que encuentre primero (player primero en el forEach) gana el tie
    expect(result.side).toBe('player');
  });
});
