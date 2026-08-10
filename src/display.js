// display.js
// Draws the big display panel and handles "tap to see it another way".
//
// The tap order is a deliberate journey rather than a random shuffle. In the
// counting levels it starts by pairing the numeral with a structured quantity
// (symbol + amount together, the association those levels exist to build),
// then explores different ways to break the same total apart. In the
// calculation levels it starts with the equation as symbols — that's what the
// child just typed — and taps down into what those symbols mean.

import { state, currentLevel } from './state.js';
import { OBJECT_THEMES } from './config.js';
import { renderQuantity, renderNumeral, renderWays, partColors } from './represent.js';
import { renderBond } from './bond.js';
import {
  groupsFor,
  decompositionCount,
  groupsForProduct,
  describeGroups,
} from './arrange.js';
import { pop, sparkle } from './animate.js';
import { playSwap } from './sound.js';
import { say } from './speech.js';

let displayEl;

export function initDisplay() {
  displayEl = document.getElementById('display');
  displayEl.addEventListener('click', cycleView);
  displayEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cycleView();
    }
  });
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

  const views = [{ mode: 'numeral' }, { mode: 'objects' }, { mode: 'dots' }, { mode: 'rods' }];
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
  const cycle = viewCycle();
  state.viewIndex = (state.viewIndex + 1) % cycle.length;

  // Coming back around to the start earns a fresh set of objects, so the same
  // number can be five puppies one moment and five acorns the next.
  if (state.viewIndex === 0) {
    state.objectThemeIndex = (state.objectThemeIndex + 1) % OBJECT_THEMES.length;
    state.shapeIndex = state.shapeIndex + 1;
    state.numeralStyleIndex = state.numeralStyleIndex + 1;
  }

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

  const bond = bondNumbers();
  if (view.mode === 'bond' && bond) {
    say(`${bond.whole} is ${bond.partA} and ${bond.partB}`);
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export function renderDisplay(animate = false) {
  const level = currentLevel();
  displayEl.innerHTML = '';
  displayEl.classList.remove('is-empty');

  if (level.mode === 'count') {
    renderCountMode();
  } else {
    renderCalcMode();
  }

  displayEl.classList.toggle('tappable', hasContent());

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
    const mode = view.mode === 'bond' ? 'numeral' : view.mode;
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
