// display.js
// Draws the big display panel, handles "tap to see it another way", and lets a
// child count the things on screen by touching them one at a time.
//
// The tap order is a deliberate journey rather than a random shuffle. In the
// counting levels it starts by pairing the numeral with a structured quantity
// (symbol + amount together, the association those levels exist to build),
// then explores different ways to break the same total apart. In the
// calculation levels it starts with the equation as symbols — that's what the
// child just typed — and taps down into what those symbols mean.

import { state, currentLevel } from './state.js';
import { OBJECT_THEMES } from './config.js';
import {
  renderQuantity,
  renderNumeral,
  renderWays,
  renderMakeTen,
  partColors,
} from './represent.js';
import { renderBond } from './bond.js';
import {
  groupsFor,
  decompositionCount,
  groupsForProduct,
  describeGroups,
} from './arrange.js';
import { pop, sparkle, confetti } from './animate.js';
import { playSwap, playPop } from './sound.js';
import { say, saySequence } from './speech.js';

let displayEl;
let journeyEl;

// How many things the child has touched in the current picture.
let counted = 0;

const COUNTABLE = '.obj, .dot, .tf-filled, .bead';

export function initDisplay() {
  displayEl = document.getElementById('display');
  journeyEl = document.getElementById('journey');
  displayEl.addEventListener('click', onDisplayClick);
  displayEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cycleView();
    }
  });
}

// ---------------------------------------------------------------------------
// Touching things to count them
// ---------------------------------------------------------------------------

/**
 * Children learn to count by touching each thing as they say its number —
 * one-to-one correspondence. Touching an object counts it; touching the space
 * around them moves on to the next way of seeing the number.
 */
function onDisplayClick(e) {
  const item = e.target.closest(COUNTABLE);
  if (item) {
    if (!item.classList.contains('counted')) countOne(item);
    return;
  }
  cycleView();
}

function countables() {
  return displayEl.querySelectorAll(COUNTABLE);
}

function countOne(item) {
  item.classList.add('counted');
  counted += 1;
  playPop();

  const total = countables().length;
  if (counted >= total && total > 0) {
    saySequence([String(counted), `${total} altogether!`]);
    sparkle(displayEl, 10);
    confetti(18);
    displayEl.classList.add('all-counted');
  } else {
    say(String(counted));
  }
}

function resetCounting() {
  counted = 0;
  if (displayEl) displayEl.classList.remove('all-counted');
}

// ---------------------------------------------------------------------------
// What views are available right now
// ---------------------------------------------------------------------------

function calcParts() {
  const c = state.calc;
  const a = c.a === '' ? null : Number(c.a);
  const b = c.b === '' ? null : Number(c.b);
  return { c, a, b, result: c.result };
}

/** Addition and subtraction both describe a whole and two parts. */
function bondNumbers() {
  const { c, a, b, result } = calcParts();
  if (result === null || a === null || b === null) return null;
  if (c.op === '+') return { whole: result, partA: a, partB: b };
  if (c.op === '−' && result >= 0) return { whole: a, partA: result, partB: b };
  return null;
}

/** Only worth showing when the sum actually crosses ten. */
function makeTenNumbers() {
  const { c, a, b, result } = calcParts();
  if (c.op !== '+' || result === null || a === null || b === null) return null;
  if (a <= 0 || b <= 0 || a >= 10 || b >= 10) return null;
  if (result <= 10 || result > 20) return null;
  return { a, b, need: 10 - a, rest: result - 10 };
}

function viewCycle() {
  const level = currentLevel();

  if (level.mode === 'count') {
    const n = state.countValue;
    const views = [{ mode: 'paired' }];
    const alts = Math.min(decompositionCount(n), 3);
    for (let i = 0; i < alts; i++) views.push({ mode: 'objects', decomp: i });
    views.push({ mode: 'dots', decomp: 0 });
    views.push({ mode: 'rods' });
    views.push({ mode: 'tenframe' });
    // The full family of pairs is only legible for small numbers; past ten it
    // would be a wall of strips.
    if (n <= 10) views.push({ mode: 'ways' });
    return views;
  }

  const views = [{ mode: 'numeral' }, { mode: 'objects' }];
  if (makeTenNumbers()) views.push({ mode: 'maketen' });
  views.push({ mode: 'dots' }, { mode: 'rods' });
  if (bondNumbers()) views.push({ mode: 'bond' });
  views.push({ mode: 'tenframe' });
  return views;
}

function currentView() {
  const cycle = viewCycle();
  return cycle[state.viewIndex % cycle.length];
}

function hasContent() {
  const level = currentLevel();
  if (level.mode === 'count') return state.countValue !== null;
  const c = state.calc;
  return c.a !== '' || c.op !== null || c.result !== null;
}

// ---------------------------------------------------------------------------
// Tapping
// ---------------------------------------------------------------------------

function cycleView() {
  if (!hasContent()) return;
  goToView((state.viewIndex + 1) % viewCycle().length);
}

function goToView(index) {
  const cycle = viewCycle();
  const next = ((index % cycle.length) + cycle.length) % cycle.length;

  // Coming back around to the start earns a fresh set of objects — unless the
  // child has chosen their own, in which case it stays as they left it.
  if (next === 0 && !state.materialPinned) {
    state.objectThemeIndex = (state.objectThemeIndex + 1) % OBJECT_THEMES.length;
    state.shapeIndex = state.shapeIndex + 1;
    state.numeralStyleIndex = state.numeralStyleIndex + 1;
  }

  state.viewIndex = next;
  playSwap();
  renderDisplay(true);
  sparkle(displayEl, 6);
  narrateView();
}

/** Say what is now on screen, so the picture and the words arrive together. */
function narrateView() {
  const level = currentLevel();
  const view = currentView();

  if (level.mode === 'count') {
    const n = state.countValue;
    if (view.mode === 'ways') {
      say(`Here are all the ways to make ${n}`);
    } else if (view.mode === 'objects' || view.mode === 'dots' || view.mode === 'rods') {
      const groups = groupsFor(n, view.decomp || 0);
      say(groups.length > 1 ? `${describeGroups(groups)}. That's ${n}.` : String(n));
    } else {
      say(String(n));
    }
    return;
  }

  if (view.mode === 'maketen') {
    const m = makeTenNumbers();
    if (m) say(`${m.a} needs ${m.need} more to make 10. Then ${m.rest} more makes ${10 + m.rest}.`);
    return;
  }
  const bond = bondNumbers();
  if (view.mode === 'bond' && bond) {
    say(`${bond.whole} is ${bond.partA} and ${bond.partB}`);
  }
}

/** A dot per way of seeing this number, so the journey has a visible map. */
function renderJourney() {
  if (!journeyEl) return;
  journeyEl.innerHTML = '';
  const cycle = viewCycle();
  if (!hasContent() || cycle.length < 2) {
    journeyEl.classList.add('is-hidden');
    return;
  }
  journeyEl.classList.remove('is-hidden');

  const here = state.viewIndex % cycle.length;
  cycle.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'journey__dot' + (i === here ? ' on' : '');
    dot.setAttribute('aria-label', `Way ${i + 1} of ${cycle.length}`);
    dot.setAttribute('aria-current', i === here ? 'true' : 'false');
    dot.addEventListener('click', () => goToView(i));
    journeyEl.appendChild(dot);
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderDisplay(animate = false) {
  const level = currentLevel();
  displayEl.innerHTML = '';
  displayEl.classList.remove('is-empty');
  resetCounting();

  if (level.mode === 'count') {
    renderCountMode();
  } else {
    renderCalcMode();
  }

  displayEl.classList.toggle('tappable', hasContent());
  renderJourney();

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

const styleOpts = () => ({
  themeIndex: state.objectThemeIndex,
  shapeIndex: state.shapeIndex,
  numeralIndex: state.numeralStyleIndex,
});

// ---- counting levels ----

function renderCountMode() {
  const n = state.countValue;
  if (n === null) {
    showPlaceholder();
    return;
  }

  const view = currentView();

  if (view.mode === 'ways') {
    displayEl.appendChild(renderWays(n));
    return;
  }

  if (view.mode === 'paired') {
    // Numeral and quantity side by side: "this symbol means this many".
    const wrap = document.createElement('div');
    wrap.className = 'paired';
    wrap.appendChild(renderNumeral(n, { size: 'pair', numeralIndex: state.numeralStyleIndex }));
    wrap.appendChild(
      renderQuantity(n, { mode: 'objects', decompIndex: 0, size: 'pair', ...styleOpts() })
    );
    displayEl.appendChild(wrap);
    return;
  }

  displayEl.appendChild(
    renderQuantity(n, {
      mode: view.mode,
      decompIndex: view.decomp || 0,
      size: 'big',
      ...styleOpts(),
    })
  );
}

// ---- calculating levels ----

function renderCalcMode() {
  const { c, a, b, result } = calcParts();

  if (c.a === '' && c.op === null && c.result === null) {
    showPlaceholder();
    return;
  }

  const view = currentView();

  if (view.mode === 'maketen') {
    const m = makeTenNumbers();
    if (m) {
      displayEl.appendChild(renderMakeTen(m.a, m.b, m.need, m.rest));
      return;
    }
  }

  if (view.mode === 'bond') {
    const bond = bondNumbers();
    if (bond) {
      displayEl.appendChild(renderBond(bond.whole, bond.partA, bond.partB));
      return;
    }
  }

  const visual = view.mode === 'objects' || view.mode === 'dots' || view.mode === 'tenframe';
  const table = document.createElement('div');
  table.className = 'equation ' + (visual ? 'equation--visual' : 'equation--numeral');

  const palette = partColors();
  const colorA = palette[0];
  const colorB = palette[1];

  // Is the first row showing a quantity we are about to take from?
  const subtracting = c.op === '−' && result !== null && result >= 0 && b > 0 && a > 0;

  // Row 1 — the first number.
  table.appendChild(
    row('', a, view, {
      // In subtraction the child should see the part that leaves: the top row
      // is split into "what stays" and "what goes", with the latter faded.
      groups: subtracting ? [result, b].filter((x) => x > 0) : null,
      groupColors: subtracting ? [colorA, colorB] : null,
      uniformColor: subtracting ? null : colorA,
      removedGroups: subtracting && result > 0 ? [1] : subtracting ? [0] : null,
    })
  );

  if (c.op) {
    // Row 2 — the operator and the second number.
    const showB = c.b === '' && c.phase === 'b' ? null : b;
    table.appendChild(row(c.op, showB, view, { uniformColor: colorB }));

    const line = document.createElement('div');
    line.className = 'equation__line';
    table.appendChild(line);

    // Row 3 — the answer, with the parts still visible inside the whole.
    table.appendChild(row('=', result, view, resultOptions(c, a, b, result), true));
  }

  displayEl.appendChild(table);
}

/**
 * How the answer should be grouped. This is where addition earns its keep:
 * 5 + 4 = 9 draws the nine as five pink and four blue, so the parts remain
 * visible inside the total. Multiplication draws equal groups instead.
 */
function resultOptions(c, a, b, result) {
  const palette = partColors();
  const colorA = palette[0];
  const colorB = palette[1];

  if (result === null) return {};

  if (c.op === '+' && a > 0 && b > 0) {
    return { groups: [a, b], groupColors: [colorA, colorB], gather: true };
  }
  if (c.op === '×' && a > 0 && b > 0) {
    const groups = groupsForProduct(a, b);
    return { groups, groupColors: groups.map((_, i) => palette[i % palette.length]) };
  }
  return { uniformColor: colorA };
}

function row(sign, value, view, opts = {}, isResult = false) {
  const el = document.createElement('div');
  el.className = 'equation__row' + (isResult ? ' equation__row--result' : '');

  const signEl = document.createElement('div');
  signEl.className = 'equation__sign';
  signEl.textContent = sign || '';
  el.appendChild(signEl);

  const valEl = document.createElement('div');
  valEl.className = 'equation__val';

  if (value === null || value === undefined) {
    const blank = document.createElement('span');
    blank.className = 'equation__blank';
    blank.textContent = isResult ? '?' : '';
    valEl.appendChild(blank);
  } else {
    const mode = view.mode === 'bond' || view.mode === 'maketen' ? 'numeral' : view.mode;
    const quantity = renderQuantity(value, {
      mode,
      size: 'small',
      decompIndex: 0,
      groups: opts.groups || null,
      groupColors: opts.groupColors || null,
      uniformColor: opts.uniformColor || null,
      removedGroups: opts.removedGroups || null,
      // Give each row of a visual equation its own coloured plate so the parts
      // stay traceable from the numbers above into the answer below.
      forceChip: mode === 'objects' || mode === 'dots',
      ...styleOpts(),
    });
    if (opts.gather) quantity.classList.add('gather');
    valEl.appendChild(quantity);
  }

  el.appendChild(valEl);
  return el;
}
