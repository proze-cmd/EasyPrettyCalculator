// main.js
// Boots the app: wires the display, keypad, and settings together and keeps the
// level badge in sync.

import { state, currentLevel, applyTheme } from './state.js';
import { initDisplay, renderDisplay } from './display.js';
import { initKeypad, rebuildKeypad } from './calculator.js';
import { initSettings } from './settings.js';

function updateLevelBadge() {
  const lvl = currentLevel();
  const badge = document.getElementById('levelBadge');
  badge.querySelector('.level-badge__num').textContent = 'Level ' + lvl.id;
  badge.querySelector('.level-badge__name').textContent = lvl.name;
}

function onLevelChange() {
  updateLevelBadge();
  rebuildKeypad();
  renderDisplay(false);
  updateTapHint();
}

// The icons carry the message for children who aren't reading yet; the words
// underneath are really for the grown-up sitting next to them.
function updateTapHint() {
  const lvl = currentLevel();
  const icons = document.querySelector('#tapHint .tap-hint__icons');
  const text = document.querySelector('#tapHint .tap-hint__text');
  if (lvl.mode === 'count') {
    icons.textContent = '👆 ✨ 🐰';
    text.textContent = 'Tap it to see it a new way';
  } else {
    icons.textContent = '🔢 👆 ✨';
    text.textContent = 'Build a problem, then tap it';
  }
}

function boot() {
  applyTheme();
  initDisplay();
  initKeypad();
  initSettings({ onLevelChange });

  updateLevelBadge();
  updateTapHint();
  renderDisplay(false);

  // Reveal the app once everything is ready (avoids a flash of unstyled DOM).
  document.body.classList.add('ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
