// calculator.js
// Builds the keypad for the current level and handles all button input:
// number-picking in "count" levels, and equation-building in "calc" levels.

import { state, currentLevel, freshCalc, resetRepresentation } from './state.js';
import { NUMBER_BUTTON_COLORS } from './config.js';
import { renderDisplay } from './display.js';
import { pop, sparkle, confetti, pressFeedback } from './animate.js';
import { playPop, playTap, playWin, playClear, unlockAudio } from './sound.js';

let keypadEl;
let displayEl;

export function initKeypad() {
  keypadEl = document.getElementById('keypad');
  displayEl = document.getElementById('display');
  rebuildKeypad();
  window.addEventListener('keydown', handlePhysicalKey);
}

// Longest operand allowed, based on the level's biggest number.
function maxLen() {
  return String(currentLevel().maxValue).length;
}

// -------------------------------------------------------------------------
// Building the keypad
// -------------------------------------------------------------------------

export function rebuildKeypad() {
  const level = currentLevel();
  keypadEl.innerHTML = '';
  keypadEl.className = 'keypad ' + (level.mode === 'count' ? 'keypad--count' : 'keypad--calc');

  if (level.mode === 'count') {
    buildCountKeypad(level);
  } else {
    buildCalcKeypad(level);
  }
}

function buildCountKeypad(level) {
  const numbers = document.createElement('div');
  numbers.className = 'keypad__numbers';
  level.keys.forEach((num, i) => {
    const b = makeButton(String(num), NUMBER_BUTTON_COLORS[i % NUMBER_BUTTON_COLORS.length]);
    b.classList.add('btn--num');
    b.addEventListener('click', () => pressCountNumber(num, b));
    numbers.appendChild(b);
  });
  keypadEl.appendChild(numbers);

  const clear = makeButton('🧹 Clear', 'btn-clear');
  clear.classList.add('btn--wide');
  clear.addEventListener('click', () => clearAll(clear));
  keypadEl.appendChild(clear);
}

function buildCalcKeypad(level) {
  const digits = document.createElement('div');
  digits.className = 'keypad__digits';

  const layout = [7, 8, 9, 4, 5, 6, 1, 2, 3, 'C', 0, '⌫'];
  layout.forEach((key) => {
    if (key === 'C') {
      const b = makeButton('C', 'btn-clear');
      b.setAttribute('aria-label', 'Clear');
      b.addEventListener('click', () => clearAll(b));
      digits.appendChild(b);
    } else if (key === '⌫') {
      const b = makeButton('⌫', 'btn-back');
      b.setAttribute('aria-label', 'Backspace');
      b.addEventListener('click', () => backspace(b));
      digits.appendChild(b);
    } else {
      const b = makeButton(String(key), 'btn-digit');
      b.classList.add('btn--num');
      b.addEventListener('click', () => pressDigit(key, b));
      digits.appendChild(b);
    }
  });
  keypadEl.appendChild(digits);

  const ops = document.createElement('div');
  ops.className = 'keypad__ops';
  level.ops.forEach((op) => {
    const b = makeButton(op, 'btn-op');
    b.setAttribute('aria-label', opName(op));
    b.addEventListener('click', () => pressOp(op, b));
    ops.appendChild(b);
  });
  const eq = makeButton('=', 'btn-equals');
  eq.classList.add('btn--equals');
  eq.setAttribute('aria-label', 'Equals');
  eq.addEventListener('click', () => pressEquals(eq));
  ops.appendChild(eq);
  keypadEl.appendChild(ops);
}

function makeButton(label, colorClass) {
  const b = document.createElement('button');
  b.className = 'btn ' + colorClass;
  b.type = 'button';
  b.textContent = label;
  return b;
}

function opName(op) {
  return op === '+' ? 'Plus' : op === '−' ? 'Minus' : op === '×' ? 'Times' : op;
}

// -------------------------------------------------------------------------
// Count-mode input
// -------------------------------------------------------------------------

function pressCountNumber(num, btn) {
  unlockAudio();
  markInteracted();
  state.countValue = num;
  resetRepresentation();
  renderDisplay(true);
  pressFeedback(btn);
  playPop();
  sparkle(displayEl, 8);
}

// -------------------------------------------------------------------------
// Calc-mode input
// -------------------------------------------------------------------------

function pressDigit(d, btn) {
  unlockAudio();
  markInteracted();
  const c = state.calc;

  if (c.phase === 'done') {
    // Typing after an answer starts a brand-new problem.
    state.calc = freshCalc();
  }
  const cc = state.calc;

  if (cc.phase === 'a') {
    if (cc.a.length < maxLen()) cc.a += String(d);
    // avoid leading-zero numbers like "05"
    cc.a = normalizeEntry(cc.a);
  } else if (cc.phase === 'b') {
    if (cc.b.length < maxLen()) cc.b += String(d);
    cc.b = normalizeEntry(cc.b);
  }

  resetRepresentation();
  renderDisplay(true);
  if (btn) pressFeedback(btn);
  playPop();
}

function normalizeEntry(str) {
  if (str.length > 1 && str[0] === '0') return String(Number(str));
  return str;
}

function pressOp(op, btn) {
  unlockAudio();
  markInteracted();
  const c = state.calc;

  if (c.phase === 'done' && c.result !== null) {
    // Continue calculating from the answer.
    state.calc = { a: String(c.result), op, b: '', result: null, phase: 'b' };
  } else if (c.phase === 'a') {
    if (c.a === '') return; // need a first number
    c.op = op;
    c.phase = 'b';
  } else if (c.phase === 'b') {
    if (c.b === '') {
      c.op = op; // just switch the operator
    } else {
      // Chain: compute what we have, keep going from the result.
      const r = compute(Number(c.a), c.op, Number(c.b));
      state.calc = { a: String(r), op, b: '', result: null, phase: 'b' };
    }
  }

  resetRepresentation();
  renderDisplay(false);
  if (btn) pressFeedback(btn);
  playTap();
}

function pressEquals(btn) {
  unlockAudio();
  markInteracted();
  const c = state.calc;
  if (c.phase !== 'b' || c.a === '' || c.b === '' || !c.op) {
    // Not enough to solve yet — a gentle nudge.
    if (btn) pressFeedback(btn);
    playTap();
    return;
  }
  c.result = compute(Number(c.a), c.op, Number(c.b));
  c.phase = 'done';
  resetRepresentation();
  renderDisplay(true);
  if (btn) pressFeedback(btn);

  // Celebrate!
  const resultEl = displayEl.querySelector('.equation__row--result');
  if (resultEl) pop(resultEl);
  playWin();
  confetti(44);
  sparkle(displayEl, 12);
}

function compute(a, op, b) {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    default:
      return a;
  }
}

// -------------------------------------------------------------------------
// Utility buttons
// -------------------------------------------------------------------------

function clearAll(btn) {
  markInteracted();
  const level = currentLevel();
  if (level.mode === 'count') {
    state.countValue = null;
  } else {
    state.calc = freshCalc();
  }
  resetRepresentation();
  renderDisplay(false);
  if (btn) pressFeedback(btn);
  playClear();
}

function backspace(btn) {
  markInteracted();
  const c = state.calc;
  if (c.phase === 'done') {
    // Undo the answer, back to editing the second number.
    c.result = null;
    c.phase = 'b';
  } else if (c.phase === 'b') {
    if (c.b !== '') {
      c.b = c.b.slice(0, -1);
    } else if (c.op) {
      c.op = null;
      c.phase = 'a';
    }
  } else if (c.phase === 'a') {
    c.a = c.a.slice(0, -1);
  }
  resetRepresentation();
  renderDisplay(false);
  if (btn) pressFeedback(btn);
  playClear();
}

// -------------------------------------------------------------------------
// Physical keyboard support (desktop friendliness)
// -------------------------------------------------------------------------

function handlePhysicalKey(e) {
  // Don't hijack typing inside the settings sliders / inputs.
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

  const level = currentLevel();

  if (level.mode === 'count') {
    if (/^[0-9]$/.test(e.key)) {
      // Map a keypress to the matching level key if it exists.
      const num = Number(e.key);
      if (level.keys.includes(num)) pressCountNumber(num, null);
    }
    if (e.key === 'Escape' || e.key.toLowerCase() === 'c') clearAll(null);
    return;
  }

  if (/^[0-9]$/.test(e.key)) {
    pressDigit(Number(e.key), null);
  } else if (e.key === '+' && level.ops.includes('+')) {
    pressOp('+', null);
  } else if ((e.key === '-') && level.ops.includes('−')) {
    pressOp('−', null);
  } else if ((e.key === '*' || e.key.toLowerCase() === 'x') && level.ops.includes('×')) {
    pressOp('×', null);
  } else if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    pressEquals(null);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    backspace(null);
  } else if (e.key === 'Escape') {
    clearAll(null);
  }
}

function markInteracted() {
  if (!state.hasInteracted) {
    state.hasInteracted = true;
    document.body.classList.add('has-interacted');
  }
}
