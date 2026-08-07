// animate.js
// Little visual delights: a "pop" on the display, sparkles, and a confetti
// burst for correct answers. All pure DOM + CSS transforms, cleaned up after
// themselves so nothing piles up.

import { CONFETTI } from './config.js';

const fxLayer = () => document.getElementById('fxLayer');

// Respect users who prefer less motion.
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Bounce an element in with a happy little pop. */
export function pop(el) {
  if (!el || reduceMotion) return;
  el.classList.remove('pop-anim');
  // force reflow so the animation can restart every press
  void el.offsetWidth;
  el.classList.add('pop-anim');
}

/** Sprinkle a few sparkles around an element's center. */
export function sparkle(el, count = 8) {
  if (!el || reduceMotion) return;
  const layer = fxLayer();
  if (!layer) return;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.textContent = '✨';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 40 + Math.random() * 60;
    s.style.left = cx + 'px';
    s.style.top = cy + 'px';
    s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    s.style.fontSize = 14 + Math.random() * 16 + 'px';
    layer.appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  }
}

/** A celebratory confetti rain from the top of the screen. */
export function confetti(amount = 40) {
  const layer = fxLayer();
  if (!layer) return;
  if (reduceMotion) {
    // A single gentle burst of stars is enough when motion is reduced.
    amount = 10;
  }
  const w = window.innerWidth;
  for (let i = 0; i < amount; i++) {
    const bit = document.createElement('span');
    bit.className = 'confetti-bit';
    bit.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
    bit.style.left = Math.random() * w + 'px';
    bit.style.fontSize = 16 + Math.random() * 22 + 'px';
    bit.style.animationDelay = Math.random() * 0.3 + 's';
    bit.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
    bit.style.setProperty('--drift', (Math.random() * 2 - 1) * 160 + 'px');
    bit.style.setProperty('--spin', (Math.random() * 2 - 1) * 720 + 'deg');
    layer.appendChild(bit);
    bit.addEventListener('animationend', () => bit.remove(), { once: true });
  }
}

/** A quick squish press feedback on buttons. */
export function pressFeedback(el) {
  if (!el || reduceMotion) return;
  el.classList.remove('pressed');
  void el.offsetWidth;
  el.classList.add('pressed');
  el.addEventListener('animationend', () => el.classList.remove('pressed'), { once: true });
}
