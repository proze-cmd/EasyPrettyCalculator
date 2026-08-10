// main.js
// Boots the app: wires the display, keypad, and settings together and keeps the
// level badge in sync.

import { state, currentLevel, applyTheme } from './state.js';
import { initDisplay, renderDisplay } from './display.js';
import { initKeypad, rebuildKeypad } from './calculator.js';
import { initSettings } from './settings.js';
import { initMaterials, syncTrigger } from './materials.js';

function updateLevelBadge() {
  const lvl = currentLevel();
  const badge = document.getElementById('levelBadge');
  badge.querySelector('.level-badge__num').textContent = 'Level ' + lvl.id;
  badge.querySelector('.level-badge__name').textContent = lvl.name;
}

function onLevelChange() {
  updateLevelBadge();
  syncTrigger();
  rebuildKeypad();
  renderDisplay(false);
}

function boot() {
  applyTheme();
  initDisplay();
  initKeypad();
  initSettings({ onLevelChange, onThemeChange: () => renderDisplay(false) });
  initMaterials({ onPick: () => renderDisplay(true) });

  updateLevelBadge();
  renderDisplay(false);

  // Reveal the app once everything is ready (avoids a flash of unstyled DOM).
  document.body.classList.add('ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
