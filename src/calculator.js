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
  // Typing the total of a mystery is bounded only by the level. How big the
  // missing part may be is the same question as how big a second operand may
  // be, so a guess is bounded exactly as 'b' would be — which is the level's
  // rule, already in force, and gives nothing away.
  if (c.phase === 'whole') return level.maxValue;
  if ((c.phase !== 'b' && c.phase !== 'guess') || !c.op) return level.maxValue;

  const a = Number(c.a || 0);
  switch (c.op) {
    case '+':
      return Math.max(0, level.maxValue - a);
    case '−':
      return a; // can't take away more than there is
    case '×':
      return a > 0 ? Math.floor(level.maxValue / a) : level.maxValue;
    case '÷':
      return a; // you can share a pile between at most that many
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
  const current = c.phase === 'a' ? c.a : c.phase === 'whole' ? c.total : c.b;
  const value = candidate(current, digit);
  if (value > maxAllowed()) return true;

  // Sharing only makes sense when it comes out even — leftovers are a later
  // idea. So the keypad offers exactly the numbers this pile shares between,
  // which is a quiet first look at factors.
  if (c.phase === 'b' && c.op === '÷') {
    const total = Number(c.a || 0);
    if (value === 0) return true;
    if (total % value !== 0) return true;
  }
  return false;
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
  if (level.mystery) {
    const q = makeButton('?', 'btn-mystery');
    q.setAttribute('aria-label', 'Mystery number');
    q.addEventListener('click', () => pressMystery(q));
    ops.appendChild(q);
  }
  const eq = makeButton('=', 'btn-equals');
  eq.classList.add('btn--equals');
  eq.setAttribute('aria-label', 'Equals');
  eq.addEventListener('click', () => pressEquals(eq));
  ops.appendChild(eq);
  keypadEl.appendChild(ops);
}

/**
 * "?" hides the second part and asks for the total instead, turning 5 + 4 = 9
 * into 5 + ? = 9. The child then has to find the part rather than be told it —
 * which is the number bond asked as a question, and the one place in the app
 * where the answer comes from them instead of from us.
 */
function pressMystery(btn) {
  unlockAudio();
  markInteracted();
  const c = state.calc;
  if (c.phase !== 'b' || !c.op || c.a === '') {
    refuseSoftly(btn, 'Pick a number and a sign first');
    return;
  }
  c.b = '';
  c.unknown = 'b';
  c.phase = 'whole';
  c.tries = 0;
  resetView();
  renderDisplay(false);
  if (btn) pressFeedback(btn);
  playTap();
  say(c.op === '−' ? `${c.a} take away what, to leave how many?` : `${c.a} and what makes how many?`);
  refreshKeys();
}

function makeButton(label, colorClass) {
  const b = document.createElement('button');
  b.className = 'btn ' + colorClass;
  b.type = 'button';
  b.textContent = label;
  return b;
}

function opName(op) {
  if (op === '+') return 'Plus';
  if (op === '−') return 'Minus';
  if (op === '×') return 'Times';
  if (op === '÷') return 'Shared between';
  return op;
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
  else if (cc.phase === 'whole') cc.total = normalizeEntry(cc.total + String(d));
  else cc.b = normalizeEntry(cc.b + String(d));

  resetView();
  renderDisplay(true);
  if (btn) pressFeedback(btn);
  playPop();
  say(cc.phase === 'a' ? cc.a : cc.phase === 'whole' ? cc.total : cc.b);
  refreshKeys();
}

/** A wobble and a spoken reason — used wherever a press can't be honoured. */
function refuseSoftly(btn, message) {
  if (btn) {
    btn.classList.remove('btn--refused');
    void btn.offsetWidth;
    btn.classList.add('btn--refused');
    btn.addEventListener('animationend', () => btn.classList.remove('btn--refused'), { once: true });
  }
  playClear();
  say(message);
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
  else if (c.op === '÷' && c.phase === 'b') say(`${c.a} does not share evenly that way`);
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
    // Deliberately no ARIA state here. The key is not disabled — it answers,
    // it just answers "not that one", out loud, the moment it's pressed. A
    // name that changes underneath you is worse for a screen reader than a
    // stable one, and aria-disabled would be a lie about a working button.
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
    if (c.a === '') {
      // Nothing to operate on yet — say so rather than being a dead button.
      refuseSoftly(btn, 'Pick a number first');
      return;
    }
    c.op = op;
    c.phase = 'b';
  } else if (c.phase === 'b') {
    if (c.b === '') {
      c.op = op; // just switch the operator
    } else {
      // The sum is already complete. Pressing another operator used to solve it
      // in silence and sweep the answer away unseen. Show the answer instead —
      // pressing the operator again carries on from it.
      pressEquals(btn);
      return;
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

  if (c.phase === 'whole') return commitWhole(btn);
  if (c.phase === 'guess') return checkGuess(btn);

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

/**
 * The total of a mystery is now settled, so the hunt begins.
 *
 * A total the sum can't reach is refused here rather than by dimming keys:
 * while "12" is being typed it passes through "1", and dimming everything
 * below the first number would make a perfectly good total impossible to type.
 */
function commitWhole(btn) {
  const c = state.calc;
  if (c.total === '') {
    if (btn) pressFeedback(btn);
    playTap();
    return;
  }
  const a = Number(c.a);
  const total = Number(c.total);
  if (c.op === '+' && total < a) {
    refuseSoftly(btn, `We already have ${a}, so the total has to be bigger`);
    return;
  }
  if (c.op === '−' && total > a) {
    refuseSoftly(btn, `We only have ${a}, so what is left has to be smaller`);
    return;
  }
  c.result = total;
  c.phase = 'guess';
  c.tries = 0;
  resetView();
  renderDisplay(true);
  if (btn) pressFeedback(btn);
  playTap();
  say(
    c.op === '−'
      ? `${a} take away what, leaves ${total}?`
      : `${a} and what makes ${total}?`
  );
  refreshKeys();
}

/**
 * Control of error, the way the materials do it: the child tries, and the app
 * says what their answer actually makes rather than simply "no". Getting it
 * wrong is how you find out, so a wrong guess is answered with the truth about
 * itself and the picture stays there to be counted.
 */
function checkGuess(btn) {
  const c = state.calc;
  if (c.b === '') {
    if (btn) pressFeedback(btn);
    playTap();
    return;
  }
  const a = Number(c.a);
  const guess = Number(c.b);
  const makes = compute(a, c.op, guess);

  if (makes === c.result) {
    c.phase = 'done';
    c.unknown = null;
    resetView();
    renderDisplay(true);
    if (btn) pressFeedback(btn);
    const resultEl = displayEl.querySelector('.equation__row--result');
    if (resultEl) pop(resultEl);
    playWin();
    confetti(44);
    sparkle(displayEl, 12);
    saySequence(['Yes!', equationPhrase(a, c.op, guess, c.result)]);
    refreshKeys();
    return;
  }

  c.tries += 1;
  const tried = c.b;
  c.b = '';
  renderDisplay(false);
  if (btn) pressFeedback(btn);
  playClear();
  // First a plain statement of what they made. If it keeps not working, point
  // at the picture rather than saying the same sentence louder.
  const truth = `${a} ${opWord(c.op)} ${tried} makes ${makes}`;
  if (c.tries >= 2) {
    saySequence([truth, `We want ${c.result}. Tap the picture and count the empty ones.`]);
  } else {
    saySequence([truth, `We want ${c.result}. Try again!`]);
  }
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
    case '÷':
      return b === 0 ? a : a / b;
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
  } else if (c.phase === 'guess') {
    // Back out of a guess, and then out of the mystery itself.
    if (c.b !== '') c.b = c.b.slice(0, -1);
    else c.phase = 'whole';
  } else if (c.phase === 'whole') {
    if (c.total !== '') {
      c.total = c.total.slice(0, -1);
    } else {
      c.unknown = null;
      c.phase = 'b';
    }
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

  // Shortcuts belong to the browser, not the calculator.
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  // With a sheet open the keys belong to the sheet — otherwise Escape would
  // close settings and wipe the child's half-built sum on the way out.
  if (document.querySelector('.overlay:not(.hidden)')) return;

  // Enter and Space are how you press whatever already has focus. Let the
  // focused control handle them instead of also firing "=" behind its back.
  const focused = document.activeElement;
  if ((e.key === 'Enter' || e.key === ' ') && focused && focused !== document.body) return;

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
  } else if (e.key === '/' && level.ops.includes('÷')) {
    e.preventDefault();
    pressOp('÷', null);
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
