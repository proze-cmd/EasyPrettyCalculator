// main.js
// Boots the app: wires the display, keypad, and settings together and keeps the
// level badge in sync.

import { state, currentLevel } from './state.js';
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

function updateTapHint() {
  const hint = document.getElementById('tapHint');
  const lvl = currentLevel();
  hint.textContent =
    lvl.mode === 'count'
      ? 'Tap the number to see it a fun new way! 👆'
      : 'Build a problem, then tap it to see it a fun new way! 👆';
}

function boot() {
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
