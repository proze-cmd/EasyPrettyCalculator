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

import { state, currentLevel, persist } from './state.js';
import { OBJECT_THEMES, MAX_DRAWN } from './config.js';
import {
  renderQuantity,
  renderNumeral,
  renderWays,
  renderMakeTen,
  renderRegroup,
  renderCompare,
  partColors,
  resultColor,
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

const COUNTABLE = '.obj, .tf-filled, .bead';
const COUNTED = '.obj.counted, .tf-filled.counted, .bead.counted';

/**
 * Views that are *a quantity* and so can be counted by touching. The others —
 * make-a-ten, regrouping, the bond, the bar model, the ways — are explanations
 * that happen to contain circles. Counting the circles in an explanation
 * teaches nothing and gets in the way of reading it.
 */
const COUNTABLE_VIEWS = new Set(['paired', 'objects', 'tenframe', 'rods']);

function viewIsCountable() {
  return COUNTABLE_VIEWS.has(currentView().mode);
}

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
  const item = viewIsCountable() ? e.target.closest(COUNTABLE) : null;
  if (item) {
    // Counting one at a time is only a real activity while there are few
    // enough to bother with. Past that the picture is there to be seen, not
    // poked, so a tap moves on like anywhere else.
    if (countScope(item).querySelectorAll(COUNTABLE).length > MAX_DRAWN) {
      cycleView();
      return;
    }
    if (!item.classList.contains('counted')) countOne(item);
    return;
  }
  // A near miss inside a cluster of things is a fumbled tap, not a request to
  // change the picture — changing it would throw away the counting so far.
  // The space outside the clusters, and the dots, still move things on.
  if (e.target.closest('.grp, .rod, .rodline, .tenframe, .pipgrid, .rows, .way, .ways')) return;
  cycleView();
}

/**
 * Counting belongs to one set of things, not to the screen. In an equation
 * each row is its own set — counting the five, then the four, then the nine.
 * Without this the child would count straight across all three rows and be
 * told nine plus four plus five is eighteen.
 */
function countScope(item) {
  return item.closest('.equation__row') || displayEl;
}

function countOne(item) {
  const scope = countScope(item);
  // pop-in finishes holding its final transform, which would outrank the
  // counted state's shrink. It has long since played, so let it go.
  item.classList.remove('pop-in');
  item.classList.add('counted');
  playPop();

  const total = scope.querySelectorAll(COUNTABLE).length;
  const done = scope.querySelectorAll(COUNTED).length;

  if (done >= total && total > 0) {
    saySequence([String(done), `${total} altogether!`]);
    sparkle(scope === displayEl ? displayEl : item, 10);
    confetti(18);
    // An equation row is display:contents and paints nothing, so the "done"
    // glow goes on the quantity inside it.
    (scope === displayEl ? displayEl : scope.querySelector('.rep') || scope)
      .classList.add('all-counted');
  } else {
    say(String(done));
  }
}

function resetCounting() {
  if (!displayEl) return;
  displayEl.classList.remove('all-counted');
  displayEl.querySelectorAll('.all-counted').forEach((el) => el.classList.remove('all-counted'));
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

/**
 * A carry to show. Only when ten loose ones actually have to be traded for a
 * ten — and only for two-digit work, since a single-digit crossing is what
 * make-a-ten already explains.
 */
function regroupNumbers() {
  const { c, a, b, result } = calcParts();
  if (c.op !== '+' || result === null || a === null || b === null) return null;
  if (a < 10 && b < 10) return null; // make-a-ten's job
  if (a <= 0 || b <= 0 || result > 100) return null;
  const onesA = a % 10;
  const onesB = b % 10;
  const onesSum = onesA + onesB;
  if (onesSum < 10) return null; // nothing was traded
  return {
    a, b, result, onesA, onesB, onesSum,
    onesLeft: onesSum - 10,
    tensTotal: Math.floor(result / 10),
  };
}

/** Subtraction read as a comparison: how much longer is one than the other? */
function compareNumbers() {
  const { c, a, b, result } = calcParts();
  if (c.op !== '−' || result === null || a === null || b === null) return null;
  if (a <= 0 || b <= 0 || result <= 0) return null;
  return { bigger: a, smaller: b, diff: result };
}

/** All the pairs that make the answer — worth showing once it's small enough. */
function waysNumber() {
  const { c, result } = calcParts();
  if (result === null || c.op === '−') return null;
  return result >= 2 && result <= 10 ? result : null;
}

function viewCycle() {
  const level = currentLevel();

  // Every view has to earn its tap. Four ways of seeing a number is plenty for
  // a child of this age; eight is a chore, and several of the eight were the
  // same picture with a different sticker on it.
  if (level.mode === 'count') {
    const n = state.countValue;
    const drawable = n <= MAX_DRAWN;
    const views = [{ mode: 'paired' }];
    // One alternative split — enough to show a total can be seen more than one
    // way, without turning it into a slideshow.
    if (drawable && decompositionCount(n) > 1) views.push({ mode: 'objects', decomp: 1 });
    views.push({ mode: 'rods' });
    // Past the draw limit the paired view is already showing ten-frames, so a
    // second ten-frame view would just be the same picture again.
    if (drawable) views.push({ mode: 'tenframe' });
    return views;
  }

  // Same reasoning: once the numbers are too big to draw as separate things,
  // "objects" quietly becomes a ten-frame, so it stops being its own view.
  const { a, b, result } = calcParts();
  const biggest = Math.max(a || 0, b || 0, result || 0);
  const views = [{ mode: 'numeral' }];
  if (biggest <= MAX_DRAWN) views.push({ mode: 'objects' });
  if (makeTenNumbers()) views.push({ mode: 'maketen' });
  if (regroupNumbers()) views.push({ mode: 'regroup' });
  if (compareNumbers()) views.push({ mode: 'compare' });
  if (bondNumbers()) views.push({ mode: 'bond' });
  // The whole family of pairs belongs where a child is actually making sums,
  // not in front of a four-year-old who is still learning what five looks like.
  if (waysNumber()) views.push({ mode: 'ways' });
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

  // Wrapping past the end earns a fresh set of objects — unless the child has
  // chosen their own, in which case it stays as they left it. Re-selecting the
  // dot you're already on is not a wrap and shouldn't change anything.
  const from = state.viewIndex % cycle.length;
  if (next === 0 && from !== 0 && !state.materialPinned) {
    state.objectThemeIndex = (state.objectThemeIndex + 1) % OBJECT_THEMES.length;
    state.numeralStyleIndex = state.numeralStyleIndex + 1;
    persist();
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
    if (view.mode === 'objects' || view.mode === 'rods') {
      const groups = groupsFor(n, view.decomp || 0);
      say(groups.length > 1 ? `${describeGroups(groups)}. That's ${n}.` : String(n));
    } else {
      say(String(n));
    }
    return;
  }

  if (view.mode === 'ways') {
    const w = waysNumber();
    if (w) say(`Here are all the ways to make ${w}`);
    return;
  }
  if (view.mode === 'maketen') {
    const m = makeTenNumbers();
    if (m) say(`${m.a} needs ${m.need} more to make 10. Then ${m.rest} more makes ${10 + m.rest}.`);
    return;
  }
  if (view.mode === 'regroup') {
    const r = regroupNumbers();
    if (r) {
      say(
        `${r.onesA} ones and ${r.onesB} ones make ${r.onesSum}. ` +
          `Ten of them make a new ten, with ${r.onesLeft} left over. ` +
          `${r.tensTotal} tens and ${r.onesLeft} ones is ${r.result}.`
      );
    }
    return;
  }
  if (view.mode === 'compare') {
    const cmp = compareNumbers();
    if (cmp) say(`${cmp.bigger} is ${cmp.diff} more than ${cmp.smaller}`);
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
  describeDisplay();
  updateHint();
  renderJourney();

  if (animate) {
    const content = displayEl.firstElementChild;
    if (content) pop(content);
  }
}

/**
 * The hint has to describe what this screen actually offers. Telling a child
 * to touch each one in front of a hundred ten-frame dots is a small lie, and
 * they will try it.
 */
function updateHint() {
  const icons = document.querySelector('#tapHint .tap-hint__icons');
  const text = document.querySelector('#tapHint .tap-hint__text');
  if (!icons || !text) return;

  const material = OBJECT_THEMES[state.objectThemeIndex % OBJECT_THEMES.length].emoji;

  if (!hasContent()) {
    icons.textContent = '👆 ✨';
    text.textContent = currentLevel().mode === 'count' ? 'Pick a number' : 'Build a problem';
    return;
  }

  // Each equation row is counted on its own, so judge them separately.
  const rows = [...displayEl.querySelectorAll('.equation__row')];
  const scopes = rows.length ? rows : [displayEl];
  const counts = scopes.map((s) => s.querySelectorAll(COUNTABLE).length).filter((n) => n > 0);
  const canCount =
    viewIsCountable() && counts.length > 0 && counts.every((n) => n <= MAX_DRAWN);

  if (canCount) {
    icons.textContent = `👆 ${material}`;
    text.textContent = 'Touch each one to count it';
  } else {
    icons.textContent = '👆 ✨';
    text.textContent = 'Tap to see it another way';
  }
}

/** Keep the display's label saying what is actually on it. */
function describeDisplay() {
  const level = currentLevel();
  if (!hasContent()) {
    displayEl.setAttribute('aria-label', 'Nothing yet. Pick a number to begin.');
    return;
  }
  if (level.mode === 'count') {
    displayEl.setAttribute('aria-label', `Showing ${state.countValue}. Tap to see it another way.`);
    return;
  }
  const { c, a, b, result } = calcParts();
  const parts = [a];
  if (c.op) parts.push(c.op === '+' ? 'plus' : c.op === '−' ? 'minus' : 'times', b === null ? '' : b);
  if (result !== null) parts.push('equals', result);
  displayEl.setAttribute(
    'aria-label',
    `${parts.filter((x) => x !== null && x !== '').join(' ')}. Tap to see it another way.`
  );
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

  if (view.mode === 'ways') {
    const w = waysNumber();
    if (w) {
      displayEl.appendChild(renderWays(w));
      return;
    }
  }

  if (view.mode === 'maketen') {
    const m = makeTenNumbers();
    if (m) {
      displayEl.appendChild(renderMakeTen(m.a, m.b, m.need, m.rest));
      return;
    }
  }

  if (view.mode === 'regroup') {
    const r = regroupNumbers();
    if (r) {
      displayEl.appendChild(renderRegroup(r));
      return;
    }
  }

  if (view.mode === 'compare') {
    const cmp = compareNumbers();
    if (cmp) {
      displayEl.appendChild(renderCompare(cmp.bigger, cmp.smaller, cmp.diff));
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

  const visual = view.mode === 'objects' || view.mode === 'tenframe';
  const table = document.createElement('div');
  table.className = 'equation ' + (visual ? 'equation--visual' : 'equation--numeral');

  const palette = partColors();
  const colorA = palette[0];
  const colorB = palette[1];

  // Is the first row showing a quantity we are about to take from?
  const subtracting = c.op === '−' && result !== null && result >= 0 && b > 0 && a > 0;

  // Row 1 — the first number. In subtraction it splits into "what stays" and
  // "what goes", with the latter faded. Sizes, colours and which part is going
  // are built together so dropping an empty part can't shift them apart.
  const topParts = subtracting
    ? [
        { size: result, color: colorA, going: false },
        { size: b, color: colorB, going: true },
      ].filter((part) => part.size > 0)
    : null;

  table.appendChild(
    row('', a, view, {
      groups: topParts ? topParts.map((part) => part.size) : null,
      groupColors: topParts ? topParts.map((part) => part.color) : null,
      uniformColor: topParts ? null : colorA,
      removedGroups: topParts
        ? topParts.map((part, i) => (part.going ? i : -1)).filter((i) => i >= 0)
        : null,
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

const visualModes = new Set(['objects', 'tenframe']);

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
    const mode = visualModes.has(view.mode) ? view.mode : 'numeral';
    const quantity = renderQuantity(value, {
      mode,
      size: 'small',
      decompIndex: 0,
      groups: opts.groups || null,
      groupColors: opts.groupColors || null,
      uniformColor: opts.uniformColor || null,
      removedGroups: opts.removedGroups || null,
      zeroNote: isResult,
      // Give each row of a visual equation its own coloured plate so the parts
      // stay traceable from the numbers above into the answer below.
      forceChip: mode === 'objects',
      numeralColor: isResult ? resultColor() : null,
      ...styleOpts(),
    });
    if (opts.gather) quantity.classList.add('gather');
    valEl.appendChild(quantity);
  }

  el.appendChild(valEl);
  return el;
}
