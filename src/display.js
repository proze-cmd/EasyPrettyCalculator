// display.js
// Draws whatever should be in the big display panel and handles the
// "tap to see it a new way" behaviour. Two shapes:
//   - count mode: a single number, shown big
//   - calc mode : a stacked equation  (a / op b / ——— / = result)

import { state, currentLevel } from './state.js';
import { REPRESENTATIONS, OBJECT_THEMES } from './config.js';
import { renderNumber } from './represent.js';
import { pop, sparkle } from './animate.js';
import { playSwap } from './sound.js';

let displayEl;

export function initDisplay() {
  displayEl = document.getElementById('display');
  // Tap / click / keyboard to cycle the representation.
  displayEl.addEventListener('click', cycleRepresentation);
  displayEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cycleRepresentation();
    }
  });
}

function currentMode() {
  return REPRESENTATIONS[state.reprIndex % REPRESENTATIONS.length];
}

function styleIndices() {
  return {
    numeral: state.numeralStyleIndex,
    object: state.objectThemeIndex,
    dot: state.dotStyleIndex,
  };
}

// Is there anything on the display worth transforming?
function hasContent() {
  const level = currentLevel();
  if (level.mode === 'count') return state.countValue !== null;
  const c = state.calc;
  return c.a !== '' || c.op !== null || c.result !== null;
}

function cycleRepresentation() {
  if (!hasContent()) return;
  state.reprIndex = (state.reprIndex + 1) % REPRESENTATIONS.length;
  // When we land on a mode, also advance its sub-style so it feels fresh.
  const mode = currentMode();
  if (mode === 'objects') state.objectThemeIndex = (state.objectThemeIndex + 1) % OBJECT_THEMES.length;
  if (mode === 'numeral') state.numeralStyleIndex = state.numeralStyleIndex + 1;
  if (mode === 'dots') state.dotStyleIndex = state.dotStyleIndex + 1;
  playSwap();
  renderDisplay(true);
  sparkle(displayEl, 6);
}

/**
 * Redraw the display from current state.
 * @param {boolean} animate  pop the content in
 */
export function renderDisplay(animate = false) {
  const level = currentLevel();
  displayEl.innerHTML = '';
  displayEl.classList.remove('is-empty');

  const mode = currentMode();
  const idx = styleIndices();

  if (level.mode === 'count') {
    if (state.countValue === null) {
      showPlaceholder();
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'single';
      wrap.appendChild(renderNumber(state.countValue, mode, idx, 'big'));
      displayEl.appendChild(wrap);
      markTappable();
    }
  } else {
    renderEquation(mode, idx);
  }

  if (animate) {
    const content = displayEl.firstElementChild;
    if (content) pop(content);
  }
}

function showPlaceholder() {
  displayEl.classList.add('is-empty');
  const p = document.createElement('div');
  p.className = 'placeholder';
  p.textContent = currentLevel().mode === 'count' ? '👆 Pick a number!' : '👆 Build a math problem!';
  displayEl.appendChild(p);
}

function markTappable() {
  // Only advertise tappability once there is something to tap.
  displayEl.classList.toggle('tappable', hasContent());
}

// ---- equation rendering (calc mode) ----

function renderEquation(mode, idx) {
  const c = state.calc;

  if (c.a === '' && c.op === null && c.result === null) {
    showPlaceholder();
    return;
  }

  const table = document.createElement('div');
  table.className = 'equation ' + (mode === 'numeral' ? 'equation--numeral' : 'equation--visual');

  // Row 1: first operand
  table.appendChild(equationRow('', valueOf(c.a), mode, idx));

  // Row 2: operator + second operand (show as soon as an operator is chosen)
  if (c.op) {
    const bShown = c.b === '' && c.phase === 'b' ? null : valueOf(c.b);
    table.appendChild(equationRow(c.op, bShown, mode, idx));

    // Underline
    const line = document.createElement('div');
    line.className = 'equation__line';
    table.appendChild(line);

    // Row 3: = result
    const resultVal = c.result !== null ? c.result : null;
    table.appendChild(equationRow('=', resultVal, mode, idx, true));
  }

  displayEl.appendChild(table);
  markTappable();
}

function valueOf(str) {
  if (str === '' || str === null || str === undefined) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : null;
}

function equationRow(sign, value, mode, idx, isResult = false) {
  const row = document.createElement('div');
  row.className = 'equation__row' + (isResult ? ' equation__row--result' : '');

  const signEl = document.createElement('div');
  signEl.className = 'equation__sign';
  signEl.textContent = sign || '';
  row.appendChild(signEl);

  const valEl = document.createElement('div');
  valEl.className = 'equation__val';
  if (value === null) {
    // Waiting for input / result: show a soft blank.
    const q = document.createElement('span');
    q.className = 'equation__blank';
    q.textContent = isResult ? '?' : '';
    valEl.appendChild(q);
  } else {
    valEl.appendChild(renderNumber(value, mode, idx, 'small'));
  }
  row.appendChild(valEl);
  return row;
}
