# ANIMATIONS-DEV — Guía de desarrollo de animaciones

Worktree: `feature-animations-gsap`
Librería: GSAP 3.12.5 (local en `src/gsap.min.js`)
Módulo: `src/animations.js`

---

## Estado actual (Fase A)

| Efecto | Estado | Mecanismo |
|--------|--------|-----------|
| Carta IA entra al campo | ✅ | CSS `@keyframes cardEnter` + clase `.card-entering` |
| Carta jugador entra al campo | ⚠️ parcial | Idem — falla cuando `executeEffect` llama `updateUI()` antes del primer frame |
| Compilación de línea | ✅ | GSAP sobre `.battle-column` (sobrevive rebuilds) |
| Carta robada (mano) | ❌ pendiente | Fase B |
| Vuelo mano→campo | ❌ pendiente | Fase B — requiere FLIP |

### Por qué las cartas del jugador no siempre animan

`finalizePlay()` llama `updateUI()` (anima el elemento), luego `executeEffect()` puede llamar
otro `updateUI()` que destruye el elemento antes del primer frame pintado. El CSS keyframe
sobrevive si hay al menos 1 frame entre renders; si los renders son síncronos, no hay frame.
Solución pendiente: añadir delay antes de `executeEffect` para el jugador, igual que el delay
de 400ms que ya tiene la IA antes de `endTurn`.

---

## Snippets de consola para probar animaciones

Abrir DevTools (F12) → pestaña Console → pegar el snippet deseado.
Las animaciones se aplican sobre cartas existentes en mesa.

### Objetivo rápido

```javascript
// Carta más reciente en campo del jugador
const pCard = document.querySelector('.player-stack .card');
// Carta más reciente en campo de la IA
const aiCard = document.querySelector('.ai-stack .card');
// Primera carta de tu mano
const hCard = document.querySelector('#player-hand .card');
```

---

### A1 — Entrada actual (scale + bounce)
```javascript
const el = document.querySelector('.player-stack .card');
el.style.transition = 'none';
gsap.fromTo(el, { scale: 0.55, opacity: 0, y: -18 },
  { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.7)', clearProps: 'all' });
```

### A2 — Entrada suave (fade simple)
```javascript
const el = document.querySelector('.player-stack .card');
el.style.transition = 'none';
gsap.fromTo(el, { opacity: 0, y: -10 },
  { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'all' });
```

### A3 — Entrada desde el lado (slide)
```javascript
const el = document.querySelector('.player-stack .card');
el.style.transition = 'none';
gsap.fromTo(el, { opacity: 0, x: -40, scale: 0.9 },
  { opacity: 1, x: 0, scale: 1, duration: 0.3, ease: 'power3.out', clearProps: 'all' });
```

### A4 — Entrada con rotación (lanzamiento)
```javascript
const el = document.querySelector('.player-stack .card');
el.style.transition = 'none';
gsap.fromTo(el, { opacity: 0, rotation: -8, scale: 0.7, y: -20 },
  { opacity: 1, rotation: 0, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)', clearProps: 'all' });
```

### A5 — Volteo 3D (flip reveal)
```javascript
const el = document.querySelector('.player-stack .card');
el.style.transition = 'none';
gsap.fromTo(el, { rotationY: 90, opacity: 0.3 },
  { rotationY: 0, opacity: 1, duration: 0.4, ease: 'power2.out', clearProps: 'all' });
```

### A6 — Aparición dramática (escala grande → normal)
```javascript
const el = document.querySelector('.player-stack .card');
el.style.transition = 'none';
gsap.fromTo(el, { scale: 1.4, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out', clearProps: 'all' });
```

### A7 — Efecto compilación manual (para probar variantes)
```javascript
// Reemplaza 'izquierda' / 'centro' / 'derecha'
const col = document.querySelector('#line-centro').parentElement;
gsap.timeline()
  .to(col, { scale: 1.05, duration: 0.12, ease: 'power3.out' })
  .to(col, { scale: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.4)' });
const flash = document.createElement('div');
flash.style.cssText = 'position:absolute;inset:0;background:rgba(0,245,255,0.4);pointer-events:none;z-index:999;border-radius:8px;';
col.style.position = 'relative';
col.appendChild(flash);
gsap.to(flash, { opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: () => flash.remove() });
```

### A8 — Glow pulse en carta de mano
```javascript
const el = document.querySelector('#player-hand .card');
gsap.to(el, { boxShadow: '0 0 20px 6px rgba(0,245,255,0.8)', duration: 0.3, yoyo: true, repeat: 3, ease: 'power2.inOut' });
```

---

## Ajustar la animación activa

La animación de entrada de carta está en `src/game.html` (inline CSS, buscar `@keyframes cardEnter`):

```css
@keyframes cardEnter {
    from { transform: scale(0.55) translateY(-18px); opacity: 0; }
    to   { transform: none; opacity: 1; }
}
.card-entering {
    animation: cardEnter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
```

Parámetros ajustables:
- `0.35s` → duración
- `cubic-bezier(0.34, 1.56, 0.64, 1)` → easing con rebote (valores > 1 = overshoot)
- `scale(0.55)` → tamaño inicial (0 = invisible, 1 = tamaño final)
- `translateY(-18px)` → dirección de entrada (negativo = desde arriba)

---

## Próximos pasos (Fase B)

- **Vuelo mano→campo (FLIP):** capturar posición de la carta en mano antes de updateUI, crear clon, animar clon desde posición mano hasta posición campo.
- **Delay jugador:** añadir pequeño delay antes de `executeEffect` en `finalizePlay` para que el CSS keyframe tenga al menos 1 frame antes del rebuild.
- **Robo de carta:** animar entrada en mano desde el mazo.
