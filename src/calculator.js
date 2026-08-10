// calculator.js
// Builds the keypad for the current level and handles all button input:
// number-picking in "count" levels, and equation-building in "calc" levels.

import { state, currentLevel, freshCalc, resetView } from './state.js';
import { NUMBER_BUTTON_COLORS } from './config.js';
import { renderDisplay } from './display.js';
import { pop, sparkle, confetti, pressFeedback } from './animate.js';
import { playPop, playTap, playWin, playClear, unlockAudio } from './sound.js';
import { say, saySequence, opWord, equationPhrase, cancelSpeech } from './speech.js';

let keypadEl;
let displayEl;

export function initKeypad() {
  keypadEl = document.getElementById('keypad');
  displayEl = document.getElementById('display');
  rebuildKeypad();
  window.addEventListener('keydown', handlePhysicalKey);
}

/**
 * The largest number that may be entered *right now*.
 *
 * For the first operand that's simply the level's ceiling. For the second it's
 * whatever keeps the answer inside the level too — so "Adding to 10" can't
 * reach 198, and, importantly, you can never take away more than you have:
 * subtraction is bounded by the first number, so the answer never goes
 * negative. The boundary is taught by the keypad rather than enforced by a
 * refusal after the fact.
 */
function maxAllowed() {
  const level = currentLevel();
  const c = state.calc;
  if (c.phase !== 'b' || !c.op) return level.maxValue;

  const a = Number(c.a || 0);
  switch (c.op) {
    case '+':
      return Math.max(0, level.maxValue - a);
    case '−':
      return a; // can't take away more than there is
    case '×':
      return a > 0 ? Math.floor(level.maxValue / a) : level.maxValue;
    default:
      return level.maxValue;
  }
}

/** What the operand would become if this digit were added. */
function candidate(current, digit) {
  return Number(normalizeEntry(String(current) + String(digit)));
}

/** Would pressing this digit take us outside the level? */
function digitBlocked(digit) {
  const c = state.calc;
  if (c.phase === 'done') return false; // a new problem is about to start
  const current = c.phase === 'a' ? c.a : c.b;
  return candidate(current, digit) > maxAllowed();
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
    refreshKeys();
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

/**
 * Counting out loud is how this age group actually learns to count — the
 * rhythm of the words carries the sequence. So pressing 5 says "one, two,
 * three, four, five" rather than just "five", and on the count-by-tens level
 * it says "ten, twenty, thirty". Longer sequences would outstay their welcome,
 * so anything past ten steps just states the number.
 */
function narrateCount(num) {
  const level = currentLevel();
  const upTo = level.keys.filter((k) => k <= num);
  if (upTo.length > 1 && upTo.length <= 10 && upTo[upTo.length - 1] === num) {
    saySequence(upTo.map(String));
  } else {
    say(String(num));
  }
}

function pressCountNumber(num, btn) {
  unlockAudio();
  markInteracted();
  state.countValue = num;
  resetView();
  renderDisplay(true);
  pressFeedback(btn);
  playPop();
  sparkle(displayEl, 8);
  narrateCount(num);
}

// -------------------------------------------------------------------------
// Calc-mode input
// -------------------------------------------------------------------------

function pressDigit(d, btn) {
  unlockAudio();
  markInteracted();
  const c = state.calc;

  // Out of range: say why, kindly, instead of silently doing nothing.
  if (c.phase !== 'done' && digitBlocked(d)) {
    refuse(btn, d);
    return;
  }

  if (c.phase === 'done') {
    // Typing after an answer starts a brand-new problem.
    state.calc = freshCalc();
  }
  const cc = state.calc;

  if (cc.phase === 'a') cc.a = normalizeEntry(cc.a + String(d));
  else if (cc.phase === 'b') cc.b = normalizeEntry(cc.b + String(d));

  resetView();
  renderDisplay(true);
  if (btn) pressFeedback(btn);
  playPop();
  say(cc.phase === 'a' ? cc.a : cc.b);
  refreshKeys();
}

/** A soft "not that one" — a wobble and a reason, never a dead button. */
function refuse(btn, digit) {
  const c = state.calc;
  if (btn) {
    btn.classList.remove('btn--refused');
    void btn.offsetWidth;
    btn.classList.add('btn--refused');
    btn.addEventListener('animationend', () => btn.classList.remove('btn--refused'), { once: true });
  }
  playClear();
  if (c.op === '−' && c.phase === 'b') say(`We only have ${c.a}`);
  else say('That one is too big for this level');
}

/**
 * Dim the digits that would leave the level, so the limit is visible before
 * it's hit rather than discovered by bumping into it.
 */
export function refreshKeys() {
  if (currentLevel().mode !== 'calc' || !keypadEl) return;
  keypadEl.querySelectorAll('.btn--num').forEach((b) => {
    const d = Number(b.textContent);
    if (Number.isNaN(d)) return;
    b.classList.toggle('btn--muted', digitBlocked(d));
  });
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

  resetView();
  renderDisplay(false);
  if (btn) pressFeedback(btn);
  playTap();
  say(opWord(op));
  refreshKeys();
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
  resetView();
  renderDisplay(true);
  if (btn) pressFeedback(btn);

  // Celebrate!
  const resultEl = displayEl.querySelector('.equation__row--result');
  if (resultEl) pop(resultEl);
  playWin();
  confetti(44);
  sparkle(displayEl, 12);
  say(equationPhrase(Number(c.a), c.op, Number(c.b), c.result));
  refreshKeys();
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
  resetView();
  renderDisplay(false);
  if (btn) pressFeedback(btn);
  playClear();
  cancelSpeech();
  refreshKeys();
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
  resetView();
  renderDisplay(false);
  if (btn) pressFeedback(btn);
  playClear();
  cancelSpeech();
  refreshKeys();
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
  } else if (e.key === '-' && level.ops.includes('−')) {
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
