// settings.js
// The settings sheet: a slider to choose the level, plus toggles for sounds
// and spoken narration. Emits changes through callbacks so main.js can re-wire
// the calculator.

import { LEVELS } from './config.js';
import { state, setLevel, setSound, setSpeech, setTheme } from './state.js';
import { playTap } from './sound.js';
import { say, cancelSpeech } from './speech.js';

let overlay, slider, levelValue, levelName, levelBlurb, soundToggle, speechToggle;
let themeBright, themeCalm;
let onLevelChange = () => {};
let onThemeChange = () => {};

export function initSettings(handlers = {}) {
  onLevelChange = handlers.onLevelChange || (() => {});
  onThemeChange = handlers.onThemeChange || (() => {});

  overlay = document.getElementById('settingsOverlay');
  slider = document.getElementById('levelSlider');
  levelValue = document.getElementById('levelValue');
  levelName = document.getElementById('levelSliderName');
  levelBlurb = document.getElementById('levelSliderBlurb');
  soundToggle = document.getElementById('soundToggle');
  speechToggle = document.getElementById('speechToggle');
  themeBright = document.getElementById('themeBright');
  themeCalm = document.getElementById('themeCalm');

  slider.min = '1';
  slider.max = String(LEVELS.length);
  slider.value = String(state.levelIndex + 1);
  syncSliderLabels(state.levelIndex);
  syncToggles();

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

  soundToggle.addEventListener('click', () => {
    setSound(!state.soundOn);
    syncToggles();
    if (state.soundOn) playTap();
  });

  speechToggle.addEventListener('click', () => {
    setSpeech(!state.speechOn);
    syncToggles();
    if (state.speechOn) say('Hello!');
    else cancelSpeech();
  });

  // The numeral and part colours are inline styles, so a theme change has to
  // redraw what's on screen — a class swap alone leaves them behind.
  const pickTheme = (name) => {
    setTheme(name);
    syncToggles();
    playTap();
    onThemeChange();
  };
  themeBright.addEventListener('click', () => pickTheme('bright'));
  themeCalm.addEventListener('click', () => pickTheme('calm'));
}

function open() {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  slider.value = String(state.levelIndex + 1);
  syncSliderLabels(state.levelIndex);
}

function close() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}

function syncSliderLabels(idx) {
  const lvl = LEVELS[idx];
  levelValue.textContent = String(idx + 1);
  levelName.textContent = lvl.name;
  levelBlurb.textContent = lvl.blurb;
}

function syncToggles() {
  soundToggle.setAttribute('aria-checked', state.soundOn ? 'true' : 'false');
  soundToggle.classList.toggle('on', state.soundOn);
  speechToggle.setAttribute('aria-checked', state.speechOn ? 'true' : 'false');
  speechToggle.classList.toggle('on', state.speechOn);

  const calm = state.theme === 'calm';
  themeCalm.classList.toggle('on', calm);
  themeBright.classList.toggle('on', !calm);
  themeCalm.setAttribute('aria-checked', calm ? 'true' : 'false');
  themeBright.setAttribute('aria-checked', calm ? 'false' : 'true');
}
