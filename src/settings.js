// settings.js
// The settings sheet: a slider to choose the level and a toggle for sound.
// Emits changes through callbacks so main.js can re-wire the calculator.

import { LEVELS } from './config.js';
import { state, setLevel, setSound } from './state.js';
import { playTap } from './sound.js';

let overlay, slider, levelValue, levelName, levelBlurb, soundToggle;
let onLevelChange = () => {};

export function initSettings(handlers = {}) {
  onLevelChange = handlers.onLevelChange || (() => {});

  overlay = document.getElementById('settingsOverlay');
  slider = document.getElementById('levelSlider');
  levelValue = document.getElementById('levelValue');
  levelName = document.getElementById('levelSliderName');
  levelBlurb = document.getElementById('levelSliderBlurb');
  soundToggle = document.getElementById('soundToggle');

  slider.min = '1';
  slider.max = String(LEVELS.length);
  slider.value = String(state.levelIndex + 1);
  syncSliderLabels(state.levelIndex);
  syncSoundToggle();

  // Open / close
  document.getElementById('settingsBtn').addEventListener('click', open);
  document.getElementById('settingsClose').addEventListener('click', close);
  document.getElementById('levelBadge').addEventListener('click', open);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) close();
  });

  // Slider changes the level live.
  slider.addEventListener('input', () => {
    const idx = Number(slider.value) - 1;
    syncSliderLabels(idx);
    setLevel(idx);
    onLevelChange();
  });

  // Sound toggle
  soundToggle.addEventListener('click', () => {
    setSound(!state.soundOn);
    syncSoundToggle();
    if (state.soundOn) playTap();
  });
}

function open() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('sheet-open');
  // keep the slider in sync in case level changed elsewhere
  slider.value = String(state.levelIndex + 1);
  syncSliderLabels(state.levelIndex);
}

function close() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('sheet-open');
}

function syncSliderLabels(idx) {
  const lvl = LEVELS[idx];
  levelValue.textContent = String(idx + 1);
  levelName.textContent = lvl.name;
  levelBlurb.textContent = lvl.blurb;
}

function syncSoundToggle() {
  soundToggle.setAttribute('aria-checked', state.soundOn ? 'true' : 'false');
  soundToggle.classList.toggle('on', state.soundOn);
}
