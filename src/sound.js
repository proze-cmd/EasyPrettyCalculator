// sound.js
// Gentle, cute sound effects made with the Web Audio API — no audio files to
// download, so it works offline and inside a Capacitor app. Everything is
// wrapped in try/catch because audio can be blocked and should never break the
// calculator.

import { state } from './state.js';

let ctx = null;

// A friendly pentatonic scale (C major pentatonic) so random notes always
// sound nice together.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

// Call this from the first real user gesture so audio is unlocked on mobile.
export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') {
    c.resume().catch(() => {});
  }
}

function blip(freq, { type = 'sine', dur = 0.16, gain = 0.18, delay = 0 } = {}) {
  if (!state.soundOn) return;
  const c = ensureCtx();
  if (!c) return;
  try {
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    // Soft attack + gentle exponential release = a rounded "pop".
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch {
    /* never let a sound crash the app */
  }
}

let noteStep = 0;

// A playful pop when a number button is pressed. Walks up the scale a bit so
// repeated taps feel musical instead of monotonous.
export function playPop() {
  const f = SCALE[noteStep % SCALE.length];
  noteStep = (noteStep + 1) % SCALE.length;
  blip(f, { type: 'triangle', dur: 0.18, gain: 0.2 });
}

// A soft click for operators / utility buttons.
export function playTap() {
  blip(392.0, { type: 'sine', dur: 0.1, gain: 0.12 });
}

// A little rising arpeggio to celebrate an answer.
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => blip(n, { type: 'triangle', dur: 0.22, gain: 0.2, delay: i * 0.09 }));
}

// A gentle woosh/pop when the display changes its look.
export function playSwap() {
  blip(659.25, { type: 'sine', dur: 0.12, gain: 0.12 });
  blip(880.0, { type: 'sine', dur: 0.12, gain: 0.1, delay: 0.05 });
}

// A soft low "aw" for clear / backspace.
export function playClear() {
  blip(329.63, { type: 'sine', dur: 0.14, gain: 0.12 });
}
