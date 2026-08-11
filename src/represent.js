// represent.js
// Turns a number into a *structured* visual.
//
// The guiding rule: a child should be able to see how many there are without
// counting one-by-one. So items are never laid out in a long line or an
// arbitrary wrapping blob — they are always broken into small groups arranged
// in patterns the eye can take in at a glance (see arrange.js), with at most
// five items in any row.

import {
  OBJECT_THEMES,
  NUMERAL_STYLES,
  NUMERAL_STYLES_CALM,
  PART_COLORS,
  PART_COLORS_CALM,
  BEAD_COLORS,
  RESULT_COLOR,
  MAX_DRAWN,
  NUMBER_EMBLEMS,
} from './config.js';
import { groupsFor, pipCells, waysToMake } from './arrange.js';
import { state } from './state.js';
import { strokesFor, padWidth, TOP, MIDDLE, BASE } from './strokes.js';
import { confetti } from './animate.js';
import { playSwap, playWin } from './sound.js';
import { say } from './speech.js';

/**
 * Colours that live in JavaScript rather than CSS have to be picked per theme
 * at draw time. The Montessori bead colours are deliberately *not* themed —
 * they're a fixed language where the colour is the number.
 */
export function partColors() {
  return state.theme === 'calm' ? PART_COLORS_CALM : PART_COLORS;
}
function numeralStyles() {
  return state.theme === 'calm' ? NUMERAL_STYLES_CALM : NUMERAL_STYLES;
}
export function resultColor() {
  return state.theme === 'calm' ? RESULT_COLOR.calm : RESULT_COLOR.bright;
}

/**
 * Render a quantity.
 *
 * @param {number} n            the amount to draw
 * @param {object} opts
 *   mode          'objects' | 'tenframe' | 'rods' | 'numeral'
 *   groups        explicit group sizes (overrides the decomposition)
 *   decompIndex   which stored decomposition to use when groups aren't given
 *   size          'big' (a lone number) | 'small' (a row in an equation)
 *   themeIndex    which emoji set to use
 *   numeralIndex  which numeral colour style to use
 *   groupColors   explicit colour per group (used to keep addition parts visible)
 *   removedGroups group indices to draw as "taken away" (subtraction)
 */
export function renderQuantity(n, opts = {}) {
  const {
    mode = 'objects',
    groups = null,
    decompIndex = 0,
    size = 'big',
    themeIndex = 0,
    numeralIndex = 0,
    groupColors = null,
    uniformColor = null,
    removedGroups = null,
    forceChip = false,
    zeroNote = false,
    numeralColor = null,
  } = opts;

  const value = Math.round(n);

  if (!Number.isFinite(value) || value < 0) {
    return renderNumeral(value, { size, numeralIndex, negative: true, color: numeralColor });
  }
  // Zero is a quantity too, and a startling one at this age. An empty frame
  // says "none left" in a way the digit on its own never does.
  if (value === 0) {
    return mode === 'numeral'
      ? renderNumeral(0, { size, numeralIndex })
      : renderEmptyFrame(size, zeroNote);
  }
  // Too many to draw as separate things? Show it the way tens are meant to be
  // shown instead of shrinking the pieces until nobody can use them.
  if (value > MAX_DRAWN && mode === 'objects') {
    return renderTenFrames(value, size);
  }

  switch (mode) {
    case 'numeral':
      return renderNumeral(value, { size, numeralIndex, color: numeralColor });
    case 'tenframe':
      return renderTenFrames(value, size);
    case 'rods':
      return renderRods(value, size);
    case 'objects':
    default:
      return renderGrouped(value, {
        mode,
        groups: groups && groups.length ? groups : groupsFor(value, decompIndex),
        size,
        themeIndex,
        groupColors,
        uniformColor,
        removedGroups,
        forceChip,
      });
  }
}

// ---------------------------------------------------------------------------
// Grouped items (the main event)
// ---------------------------------------------------------------------------

function renderGrouped(n, o) {
  const { mode, groups, size, themeIndex, groupColors, uniformColor, removedGroups, forceChip } = o;
  const wrap = shell('rep--grouped', size);

  const list = groups && groups.length ? groups : [n];
  applyDensity(wrap, n, list.length, size);

  const multi = list.length > 1;
  // A tinted plate normally marks off one group from the next. Equation rows
  // ask for one anyway, even with a single group: it is what ties the pink 5
  // in the answer back to the pink 5 it came from.
  const chip = multi || forceChip;

  let drawn = 0; // running index, used to stagger the pop-in animation
  list.forEach((count, gi) => {
    const palette = partColors();
    const color =
      (groupColors && groupColors[gi]) || uniformColor || palette[gi % palette.length];
    const grp = document.createElement('div');
    grp.className = 'grp';
    if (chip) {
      grp.classList.add('grp--chip');
      grp.style.background = color.soft;
      grp.style.borderColor = color.solid;
    }
    if (removedGroups && removedGroups.includes(gi)) grp.classList.add('grp--removed');

    grp.appendChild(
      layoutGroup(count, (i) => {
        const el = makeItem(themeIndex);
        el.style.animationDelay = Math.min((drawn + i) * 32, 760) + 'ms';
        return el;
      })
    );
    drawn += count;
    wrap.appendChild(grp);
  });

  return wrap;
}

/**
 * Lay a single group out so it can be recognised at a glance:
 *   <= 6  -> a dice/domino pip pattern
 *   7-10  -> a row of five with the remainder underneath ("five and some more")
 * Anything larger is chunked into rows of five, so no row ever exceeds five.
 */
function layoutGroup(count, makeAt) {
  const cells = pipCells(count);

  if (cells) {
    const grid = document.createElement('div');
    grid.className = 'pipgrid';
    const lookup = new Map();
    cells.forEach((cell, i) => lookup.set(cell, i));
    for (let cell = 0; cell < 9; cell++) {
      const slot = document.createElement('span');
      slot.className = 'pip';
      if (lookup.has(cell)) slot.appendChild(makeAt(lookup.get(cell)));
      grid.appendChild(slot);
    }
    return grid;
  }

  // Rows of five, remainder last.
  const rows = document.createElement('div');
  rows.className = 'rows';
  let made = 0;
  while (made < count) {
    const inRow = Math.min(5, count - made);
    const row = document.createElement('div');
    row.className = 'row';
    for (let i = 0; i < inRow; i++) row.appendChild(makeAt(made + i));
    rows.appendChild(row);
    made += inRow;
  }
  return rows;
}

function makeItem(themeIndex) {
  const obj = document.createElement('span');
  obj.className = 'obj pop-in';
  obj.textContent = OBJECT_THEMES[themeIndex % OBJECT_THEMES.length].emoji;
  return obj;
}

// ---------------------------------------------------------------------------
// Ten-frames
// ---------------------------------------------------------------------------

function renderTenFrames(n, size) {
  const wrap = shell('rep--tenframe', size);
  applyDensity(wrap, n);
  const frames = Math.max(1, Math.ceil(n / 10));
  let remaining = n;
  for (let f = 0; f < frames; f++) {
    const frame = document.createElement('div');
    frame.className = 'tenframe';
    for (let c = 0; c < 10; c++) {
      const cell = document.createElement('span');
      cell.className = 'tf-cell';
      if (remaining > 0) {
        cell.classList.add('tf-filled', 'pop-in');
        cell.style.animationDelay = Math.min((f * 10 + c) * 32, 760) + 'ms';
        remaining--;
      }
      frame.appendChild(cell);
    }
    wrap.appendChild(frame);
  }
  return wrap;
}

/**
 * Zero as a picture. The words are worth saying when zero is the *answer* —
 * "we took them all away" — but inside an operand row they only clutter a sum
 * that already reads perfectly well.
 */
function renderEmptyFrame(size, withNote) {
  const wrap = shell('rep--tenframe rep--zero', size);
  const frame = document.createElement('div');
  frame.className = 'tenframe';
  for (let c = 0; c < 10; c++) {
    const cell = document.createElement('span');
    cell.className = 'tf-cell';
    frame.appendChild(cell);
  }
  wrap.appendChild(frame);
  if (withNote) {
    const label = document.createElement('div');
    label.className = 'zero-note';
    label.textContent = 'none left';
    wrap.appendChild(label);
  }
  return wrap;
}

// ---------------------------------------------------------------------------
// Make a ten — the bridging strategy
// ---------------------------------------------------------------------------

/**
 * Shows how an addition crosses ten: the first number takes just enough from
 * the second to fill a ten, and whatever is left over sits beside it. Seeing
 * 8 + 5 become 10 + 3 is the step that turns counting on from a total into
 * knowing it.
 */
export function renderMakeTen(a, b, need, rest) {
  const palette = partColors();
  const A = palette[0].solid;
  const B = palette[1].solid;

  const wrap = document.createElement('div');
  wrap.className = 'maketen';

  // Where the borrowed ones come from. The second number is drawn whole, with
  // the few that are about to move marked exactly as they will look once they
  // land in the frame — so the child can follow them across rather than being
  // told in a sentence that they went.
  const from = document.createElement('div');
  from.className = 'maketen__from';
  const fromLabel = document.createElement('span');
  fromLabel.className = 'maketen__fromnum';
  fromLabel.textContent = String(b);
  fromLabel.style.color = B;
  from.appendChild(fromLabel);
  const fromDots = document.createElement('div');
  fromDots.className = 'maketen__fromdots';
  for (let i = 0; i < b; i++) {
    const dot = document.createElement('span');
    dot.className = 'maketen__fromdot pop-in';
    dot.style.background = B;
    dot.style.animationDelay = Math.min(i * 50, 400) + 'ms';
    if (i < need) dot.classList.add('maketen__fromdot--moving');
    fromDots.appendChild(dot);
  }
  from.appendChild(fromDots);
  wrap.appendChild(from);

  const arrow = document.createElement('div');
  arrow.className = 'maketen__arrow';
  arrow.textContent = '↓';
  wrap.appendChild(arrow);

  const frames = document.createElement('div');
  frames.className = 'maketen__frames';

  // First frame: the original number, then just enough borrowed to fill it.
  const f1 = document.createElement('div');
  f1.className = 'tenframe';
  for (let i = 0; i < 10; i++) {
    const cell = document.createElement('span');
    cell.className = 'tf-cell';
    if (i < a) {
      cell.classList.add('tf-filled', 'pop-in');
      cell.style.background = A;
      cell.style.borderColor = A;
    } else if (i < a + need) {
      cell.classList.add('tf-filled', 'tf-moved', 'pop-in');
      cell.style.background = B;
      cell.style.borderColor = B;
      cell.style.animationDelay = 180 + (i - a) * 90 + 'ms';
    }
    f1.appendChild(cell);
  }
  frames.appendChild(f1);

  // Second frame: what was left over.
  const f2 = document.createElement('div');
  f2.className = 'tenframe';
  for (let i = 0; i < 10; i++) {
    const cell = document.createElement('span');
    cell.className = 'tf-cell';
    if (i < rest) {
      cell.classList.add('tf-filled', 'pop-in');
      cell.style.background = B;
      cell.style.borderColor = B;
      cell.style.animationDelay = 420 + i * 70 + 'ms';
    }
    f2.appendChild(cell);
  }
  frames.appendChild(f2);
  wrap.appendChild(frames);

  const sum = document.createElement('div');
  sum.className = 'maketen__sum';
  sum.append(strong(10, null), text(' + '), strong(rest, B), text(' = '), strong(10 + rest, null));
  wrap.appendChild(sum);

  return wrap;
}

function strong(n, color) {
  const el = document.createElement('b');
  el.textContent = String(n);
  if (color) el.style.color = color;
  return el;
}
function text(t) {
  return document.createTextNode(t);
}

// ---------------------------------------------------------------------------
// Bead bars / number rods — quantity as colour and as length
// ---------------------------------------------------------------------------

function renderRods(n, size) {
  const wrap = shell('rep--rods', size);
  applyDensity(wrap, n);
  // A rod is one unbroken row, so it is the widest thing the app draws. Inside
  // an equation on a narrow phone a ten-bar overruns the panel, so the beads
  // there are sized to fit the row rather than to match the other views.
  if (size === 'small') wrap.style.setProperty('--item', 'clamp(9px, 3.1vw, 18px)');

  // Unlike the other views, a rod is deliberately *not* broken into parts:
  // its whole job is to show how long the number itself is, in the one colour
  // that belongs to it. Past ten it becomes ten-bars plus a remainder, which
  // is how the golden bead material handles bigger numbers.
  const list = n <= 10 ? [n] : groupsFor(n, 0);
  let drawn = 0;

  // One bar has nothing to line up against, so it is centred with its numeral
  // above — the pairing every other view uses. Several bars keep their labels
  // alongside and their left edges flush, because that is what makes a short
  // bar visibly shorter than a long one.
  const solo = list.length === 1;
  if (solo) {
    wrap.classList.add('rep--rods-solo');
    const top = document.createElement('div');
    top.className = 'rod__total';
    top.textContent = String(n);
    const color = BEAD_COLORS[list[0]] || BEAD_COLORS[10];
    top.style.color = color.stroke || color.solid;
    wrap.appendChild(top);
  }

  list.forEach((count) => {
    const line = document.createElement('div');
    line.className = 'rodline';

    const bar = document.createElement('div');
    bar.className = 'rod';
    const color = BEAD_COLORS[count] || BEAD_COLORS[10];

    for (let i = 0; i < count; i++) {
      const bead = document.createElement('span');
      bead.className = 'bead pop-in';
      bead.style.background = color.solid;
      if (color.stroke) bead.style.boxShadow = `inset 0 0 0 2px ${color.stroke}`;
      // A small break after the fifth bead keeps the five-benchmark readable
      // even in a bar, so a seven still looks like "five and two".
      if (i === 5) bead.classList.add('bead--break');
      bead.style.animationDelay = Math.min((drawn + i) * 32, 760) + 'ms';
      bar.appendChild(bead);
    }
    drawn += count;
    line.appendChild(bar);

    // Montessori always pairs the material with its numeral. With one bar that
    // pairing has already happened above, so a second copy would just be noise.
    if (!solo) {
      const label = document.createElement('span');
      label.className = 'rod__label';
      label.textContent = String(count);
      label.style.color = color.stroke || color.solid;
      line.appendChild(label);
    }

    wrap.appendChild(line);
  });

  return wrap;
}

// ---------------------------------------------------------------------------
// "Ways to make N" — the whole family of number pairs at once
// ---------------------------------------------------------------------------

export function renderWays(n) {
  const wrap = document.createElement('div');
  wrap.className = 'ways';

  const title = document.createElement('div');
  title.className = 'ways__title';
  title.textContent = `${n} is…`;
  wrap.appendChild(title);

  const palette = partColors();
  const colorA = palette[0].solid;
  const colorB = palette[1].solid;

  waysToMake(n).forEach(([a, b], row) => {
    const way = document.createElement('div');
    way.className = 'way';

    // One strip per way: the first part in one colour, the rest in the other.
    // Stacked up they show one part growing as the other shrinks.
    const strip = document.createElement('span');
    strip.className = 'way__strip';
    for (let i = 0; i < n; i++) {
      const cell = document.createElement('span');
      cell.className = 'way__cell pop-in';
      cell.style.background = i < a ? colorA : colorB;
      cell.style.animationDelay = Math.min(row * 40 + i * 12, 700) + 'ms';
      strip.appendChild(cell);
    }
    way.appendChild(strip);

    const label = document.createElement('span');
    label.className = 'way__label';
    const sa = document.createElement('b');
    sa.textContent = String(a);
    sa.style.color = colorA;
    const sb = document.createElement('b');
    sb.textContent = String(b);
    sb.style.color = colorB;
    label.append(sa, document.createTextNode(' + '), sb);
    way.appendChild(label);

    wrap.appendChild(way);
  });

  return wrap;
}

// ---------------------------------------------------------------------------
// Plates — the "shared between" number, which counts containers not things
// ---------------------------------------------------------------------------

/**
 * In "12 shared between 3", the three is not three cats — it is three plates.
 * Drawing it as cats invites the child to read it as a quantity of the same
 * stuff, so it is drawn as the empty places the things will go into.
 */
export function renderPlates(n, size) {
  const wrap = shell('rep--plates', size);
  const count = Math.min(n, MAX_DRAWN);
  for (let i = 0; i < count; i++) {
    const plate = document.createElement('span');
    plate.className = 'plate pop-in';
    plate.style.animationDelay = Math.min(i * 60, 500) + 'ms';
    wrap.appendChild(plate);
  }
  return wrap;
}

// ---------------------------------------------------------------------------
// Pairs — odd and even, by trying to pair everything up
// ---------------------------------------------------------------------------

/**
 * Every number either pairs up exactly or has one left over. That is the whole
 * of odd and even, and it is a thing you do rather than a fact you are told —
 * so the app does it: two by two, and then you look at the end of the line.
 */
export function renderPairs(n, themeIndex) {
  const palette = partColors();
  const wrap = document.createElement('div');
  wrap.className = 'pairs';

  const whole = Math.floor(n / 2);
  const leftOver = n % 2;

  const grid = document.createElement('div');
  grid.className = 'pairs__grid';
  for (let i = 0; i < whole; i++) {
    const pair = document.createElement('div');
    pair.className = 'pair';
    pair.style.borderColor = palette[0].solid;
    pair.style.background = palette[0].soft;
    for (let k = 0; k < 2; k++) {
      const item = makeItem(themeIndex);
      item.style.animationDelay = Math.min((i * 2 + k) * 45, 700) + 'ms';
      pair.appendChild(item);
    }
    grid.appendChild(pair);
  }
  if (leftOver) {
    const lone = document.createElement('div');
    lone.className = 'pair pair--lone';
    const item = makeItem(themeIndex);
    item.style.animationDelay = Math.min(whole * 2 * 45, 700) + 'ms';
    lone.appendChild(item);
    grid.appendChild(lone);
  }
  wrap.appendChild(grid);

  const verdict = document.createElement('div');
  verdict.className = 'pairs__verdict ' + (leftOver ? 'pairs__verdict--odd' : 'pairs__verdict--even');
  verdict.textContent = leftOver ? 'odd' : 'even';
  wrap.appendChild(verdict);

  return wrap;
}

// ---------------------------------------------------------------------------
// Regrouping — where a new ten comes from
// ---------------------------------------------------------------------------

/** A short run of round counters, five to a row, for loose ones. */
function onesRow(n, color) {
  const wrap = document.createElement('div');
  wrap.className = 'ones';
  for (let i = 0; i < n; i++) {
    const one = document.createElement('span');
    one.className = 'one pop-in';
    one.style.background = color;
    one.style.animationDelay = Math.min(i * 40, 400) + 'ms';
    wrap.appendChild(one);
  }
  return wrap;
}

/**
 * Two-digit addition works because ten loose ones can be traded for a single
 * ten. That trade is the whole idea, and on paper it is a tiny "1" written
 * above a column — the one part children copy without understanding. Here the
 * ten ones are gathered into a frame and handed over as a ten bar.
 */
export function renderRegroup(r) {
  const palette = partColors();
  const gold = BEAD_COLORS[10].solid;
  const onesColor = palette[1].solid;

  const wrap = document.createElement('div');
  wrap.className = 'regroup';

  const goldBar = (delay) => {
    const bar = document.createElement('span');
    bar.className = 'regroup__tenbar pop-in';
    bar.style.animationDelay = delay + 'ms';
    for (let i = 0; i < 10; i++) {
      const bead = document.createElement('span');
      bead.className = 'bead';
      bead.style.background = gold;
      if (i === 5) bead.classList.add('bead--break');
      bar.appendChild(bead);
    }
    return bar;
  };

  // 1. The loose ones from both numbers, as themselves.
  const row1 = document.createElement('div');
  row1.className = 'regroup__row';
  row1.append(onesRow(r.onesA, onesColor), sign('+'), onesRow(r.onesB, onesColor));
  wrap.appendChild(row1);

  wrap.appendChild(arrowDown());

  // 2. Ten of them, gathered — and the five that didn't fit.
  const row2 = document.createElement('div');
  row2.className = 'regroup__row';
  const frame = document.createElement('div');
  frame.className = 'tenframe regroup__frame';
  for (let i = 0; i < 10; i++) {
    const cell = document.createElement('span');
    cell.className = 'tf-cell tf-filled pop-in';
    cell.style.background = onesColor;
    cell.style.borderColor = onesColor;
    cell.style.animationDelay = 300 + Math.min(i * 40, 400) + 'ms';
    frame.appendChild(cell);
  }
  row2.appendChild(frame);
  if (r.onesLeft > 0) row2.append(onesRow(r.onesLeft, onesColor));
  wrap.appendChild(row2);

  wrap.appendChild(arrowDown());

  // 3. The ten becomes a ten bar, standing with the tens already there, and
  //    the leftovers stay leftovers. This last line *is* the answer, drawn.
  const row3 = document.createElement('div');
  row3.className = 'regroup__row regroup__row--answer';
  const tens = document.createElement('div');
  tens.className = 'regroup__tens';
  for (let i = 0; i < r.tensTotal; i++) {
    const bar = goldBar(700 + i * 110);
    // The last ten is the one that was just traded for.
    if (i === r.tensTotal - 1) bar.classList.add('regroup__tenbar--new');
    tens.appendChild(bar);
  }
  row3.appendChild(tens);
  if (r.onesLeft > 0) row3.appendChild(onesRow(r.onesLeft, onesColor));
  wrap.appendChild(row3);

  const sum = document.createElement('div');
  sum.className = 'regroup__sum';
  sum.textContent = String(r.result);
  wrap.appendChild(sum);

  return wrap;
}

function sign(ch) {
  const el = document.createElement('span');
  el.className = 'regroup__sign';
  el.textContent = ch;
  return el;
}

function arrowDown() {
  const el = document.createElement('div');
  el.className = 'regroup__arrow';
  el.textContent = '↓';
  return el;
}

// ---------------------------------------------------------------------------
// Comparison bars — "how many more?"
// ---------------------------------------------------------------------------

/**
 * The Singapore bar model for comparison. Two bars lined up from the same edge
 * turn "nine take away four" into something you can see: the shorter bar plus
 * the gap is the longer one, and the gap is the answer.
 */
export function renderCompare(bigger, smaller, diff) {
  const palette = partColors();
  // Small enough to draw block by block? Then the difference is something the
  // child can count, not just something they can see is bigger. That is the
  // whole point of the question "how many more".
  const segmented = bigger <= MAX_DRAWN;

  const wrap = document.createElement('div');
  wrap.className = 'compare' + (segmented ? ' compare--blocks' : '');
  // Block width is left to the layout rather than computed from the viewport:
  // both rows hold exactly `bigger` blocks, so letting them share the track
  // keeps the two bars aligned and fits whatever width the panel actually has,
  // including the narrower column a landscape phone gets.

  const blocks = (count, color, cls, startDelay) => {
    const holder = document.createElement('div');
    holder.className = 'compare__blocks ' + (cls || '');
    for (let i = 0; i < count; i++) {
      const cell = document.createElement('span');
      cell.className = 'compare__block pop-in';
      if (color) cell.style.background = color;
      cell.style.animationDelay = Math.min(startDelay + i * 45, 900) + 'ms';
      holder.appendChild(cell);
    }
    return holder;
  };

  const makeRow = (value, color) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'compare__row';
    const num = document.createElement('span');
    num.className = 'compare__num';
    num.textContent = String(value);
    num.style.color = color;
    rowEl.appendChild(num);
    const track = document.createElement('div');
    track.className = 'compare__track';
    rowEl.appendChild(track);
    return { rowEl, track };
  };

  const top = makeRow(bigger, palette[0].solid);
  const bottom = makeRow(smaller, palette[1].solid);

  if (segmented) {
    top.track.appendChild(blocks(bigger, palette[0].solid, '', 0));
    bottom.track.appendChild(blocks(smaller, palette[1].solid, '', 0));
    // The gap is drawn as empty blocks of the same size, so the answer can be
    // counted straight off the picture.
    const gapBlocks = blocks(diff, null, 'compare__blocks--gap', 400);
    bottom.track.appendChild(gapBlocks);
  } else {
    const pct = bigger > 0 ? (smaller / bigger) * 100 : 0;
    const fillA = document.createElement('div');
    fillA.className = 'compare__fill';
    fillA.style.cssText = `width:100%;background:${palette[0].solid}`;
    top.track.appendChild(fillA);
    const fillB = document.createElement('div');
    fillB.className = 'compare__fill';
    fillB.style.cssText = `width:${pct}%;background:${palette[1].solid}`;
    bottom.track.appendChild(fillB);
    const gap = document.createElement('div');
    gap.className = 'compare__gap';
    gap.style.width = 100 - pct + '%';
    gap.appendChild(strong(diff, null));
    bottom.track.appendChild(gap);
  }

  wrap.append(top.rowEl, bottom.rowEl);

  // The symbol, introduced where it already means something: the child can
  // see which bar is longer, so ">" is just the name for what they can see.
  const symbolLine = document.createElement('div');
  symbolLine.className = 'compare__symbol';
  const gt = document.createElement('span');
  gt.className = 'compare__gt';
  gt.textContent = '>';
  symbolLine.append(strong(bigger, palette[0].solid), gt, strong(smaller, palette[1].solid));
  wrap.appendChild(symbolLine);

  const cap = document.createElement('div');
  cap.className = 'compare__cap';
  cap.append(strong(diff, null), text(' more'));
  wrap.appendChild(cap);

  return wrap;
}

// ---------------------------------------------------------------------------
// Numeral
// ---------------------------------------------------------------------------

export function renderNumeral(n, { size = 'big', numeralIndex = 0, negative = false, color = null } = {}) {
  const wrap = shell('rep--numeral', size);
  wrap.appendChild(numeralSpan(n, numeralIndex, color));
  if (negative || n < 0) wrap.classList.add('rep--negative');
  return wrap;
}

function numeralSpan(n, numeralIndex, color) {
  const styles = numeralStyles();
  const style = styles[numeralIndex % styles.length];
  const span = document.createElement('span');
  span.className = 'numeral';
  // An answer is written in the answer colour; everything else cycles.
  span.style.color = color || style.fg;
  span.style.background = style.bg;

  // The digit gets its own element inside the chip. Centring works by nudging
  // the digit against its background, so the two cannot be the same element —
  // moving that would carry the background along and change nothing.
  const glyph = document.createElement('span');
  glyph.className = 'numeral__glyph';
  glyph.textContent = String(n);
  span.appendChild(glyph);

  // Sizes come from clamp(), so they only exist once it is on the page.
  requestAnimationFrame(() => centreGlyph(glyph));
  return span;
}

/**
 * Sit a numeral in the middle of its own chip.
 *
 * Centring a line of text does not centre what you can see. The em box reserves
 * room for the parts of letters that hang below the baseline, and a digit uses
 * none of it, so the digit ends up riding high or low inside its background
 * depending on which font the device actually had. Measuring the ink and
 * shifting by the difference puts it where the eye expects it, on any font.
 *
 * Silently does nothing where the measurement isn't available, which leaves the
 * numeral exactly where it would have been anyway.
 */
function centreGlyph(el) {
  if (!el.isConnected) return;
  const cs = getComputedStyle(el);
  const ctx =
    centreGlyph.ctx || (centreGlyph.ctx = document.createElement('canvas').getContext('2d'));
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText(el.textContent);
  const line = parseFloat(cs.lineHeight);
  if (!m || typeof m.fontBoundingBoxAscent !== 'number' || !Number.isFinite(line)) return;

  // Where the baseline sits inside the line box, then where the ink sits
  // around that baseline.
  const leading = (line - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
  const baseline = leading + m.fontBoundingBoxAscent;
  const inkMiddle = baseline + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
  const shift = line / 2 - inkMiddle;
  if (Math.abs(shift) > 0.5) el.style.transform = `translateY(${shift.toFixed(2)}px)`;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function shell(modifier, size) {
  const el = document.createElement('div');
  const sizeClass = size === 'small' ? 'rep--small' : size === 'pair' ? 'rep--pair' : 'rep--big';
  el.className = `rep ${modifier} ${sizeClass}`;
  return el;
}

/**
 * Big quantities need smaller pieces, or ten groups of ten march off the
 * bottom of the screen and stop being one thing you can take in at a glance.
 * Shrinking the pieces keeps the whole amount visible at once, which is the
 * entire point of showing it.
 */
function applyDensity(el, total, groups = 1, size = 'big') {
  // Inside an equation three quantities share one panel, and each extra plate
  // costs its own padding — enough that an answer like 4 x 5 wraps onto a
  // second line of plates and drops off the bottom of the display. Charging for
  // the plates keeps it on one line, where a child can actually see it.
  const small = size === 'small';
  const weight = small ? total + Math.max(0, groups - 1) * 6 : total;
  let vars = null;
  if (small) {
    // An equation row starts smaller than a lone quantity, so its ladder has to
    // start below that too — otherwise a crowded answer ends up drawn *larger*
    // than the numbers it came from and wraps onto a line nobody can see.
    if (weight > 50) vars = { item: 'clamp(10px, 2.8vw, 15px)', gap: '2px', pad: '3px', group: '5px' };
    else if (weight > 20) vars = { item: 'clamp(12px, 3.4vw, 18px)', gap: '3px', pad: '4px', group: '6px' };
    else if (weight > 10) vars = { item: 'clamp(13px, 3.8vw, 20px)', gap: '3px', pad: '4px', group: '7px' };
  } else if (weight > 50) vars = { item: 'clamp(13px, min(3.9vw, 3.6vh), 34px)', gap: '3px', pad: '4px', group: '6px' };
  else if (weight > 20) vars = { item: 'clamp(16px, min(4.8vw, 4.4vh), 44px)', gap: '4px', pad: '5px', group: '8px' };
  else if (weight > 10) vars = { item: 'clamp(20px, min(5.8vw, 5.4vh), 56px)', gap: '5px', pad: '6px', group: '10px' };
  if (!vars) return;
  el.style.setProperty('--item', vars.item);
  el.style.setProperty('--gap', vars.gap);
  el.style.setProperty('--chip-pad', vars.pad);
  el.style.setProperty('--group-gap', vars.group);
}

function note(text) {
  const n = document.createElement('div');
  n.className = 'overflow-note';
  n.textContent = text;
  return n;
}


// ---------------------------------------------------------------------------
// Meeting the number in the world
// ---------------------------------------------------------------------------

/**
 * Waldorf introduces a number by its quality before its quantity: one sun, two
 * eyes, five fingers. The emblem is the whole lesson, so it is drawn big and
 * alone with its numeral, and there is nothing on the screen to read.
 */
export function renderEmblem(n, size) {
  const emblem = NUMBER_EMBLEMS[n];
  const wrap = shell('rep--emblem', size);
  if (!emblem) return wrap;

  const art = document.createElement('div');
  art.className = 'emblem__art';
  emblem.emoji.forEach((glyph, i) => {
    const span = document.createElement('span');
    span.className = 'emblem__glyph pop-in';
    span.textContent = glyph;
    span.style.animationDelay = i * 140 + 'ms';
    art.appendChild(span);
  });
  wrap.appendChild(art);

  const num = document.createElement('div');
  num.className = 'emblem__num';
  num.textContent = String(n);
  wrap.appendChild(num);

  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', `${n}: ${emblem.name}`);
  return wrap;
}

/** What this number is, in words — for narration only. */
export function emblemName(n) {
  return NUMBER_EMBLEMS[n] ? NUMBER_EMBLEMS[n].name : null;
}


// ---------------------------------------------------------------------------
// The symbol itself
// ---------------------------------------------------------------------------

/**
 * The numeral as a solid block of colour, big enough to fill the panel.
 *
 * Knowing a number means knowing its shape as well as its size, and the shape
 * deserves a screen of its own rather than a caption on someone else's. The
 * colour changes each time round, so the *number* is what stays the same while
 * everything about how it looks changes — which is the point being made.
 */
export function renderBlockNumeral(n, styleIndex) {
  const wrap = shell('rep--block', 'big');
  const styles = numeralStyles();
  const style = styles[Math.abs(styleIndex) % styles.length];

  const block = document.createElement('div');
  block.className = 'block-num pop-anim';
  block.style.color = style.fg;
  block.style.background = style.bg;
  // A hundred is three numerals wide. Sized for one, it runs off the side.
  block.style.setProperty('--digits', String(n).length);

  // The digit gets its own element: the block is already carrying the pop
  // animation's transform, and centring needs a transform of its own.
  const glyph = document.createElement('span');
  glyph.className = 'block-num__glyph';
  glyph.textContent = String(n);
  block.appendChild(glyph);
  wrap.appendChild(block);
  requestAnimationFrame(() => centreGlyph(glyph));

  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', String(n));
  return wrap;
}

/**
 * The number on a handwriting pad, the way it is actually written.
 *
 * Three things a printed numeral can't do. The rules are the ones on a real
 * writing pad — a solid line top and bottom with a dashed one down the middle
 * — so the numeral has somewhere to sit rather than floating. The numeral is
 * drawn as the trail a pen leaves, filling in stroke order with a numbered dot
 * where each stroke begins, so a child sees *where to start* and which way to
 * go. And then it empties again and hands over: drag the dot round the path
 * yourself, and it fills in behind your finger.
 *
 * Montessori gives children sandpaper numerals for exactly this. The shape of
 * a number is something the hand learns, not only the eye.
 */
export function renderPad(n) {
  const wrap = shell('rep--pad', 'big');
  const strokes = strokesFor(n);
  if (!strokes) return wrap;

  const W = padWidth(n);
  const H = 150;
  const NS = 'http://www.w3.org/2000/svg';

  const pad = document.createElement('div');
  pad.className = 'pad';
  // How wide the paper wants to be for its height — see `.pad` in the stylesheet.
  pad.style.setProperty('--pad-ar', String((W + 20) / H));

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `-10 0 ${W + 20} ${H}`);
  svg.setAttribute('class', 'pad__sheet');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Trace the number ${n}`);

  // The guide rules.
  [
    [TOP, 'pad__rule'],
    [MIDDLE, 'pad__rule pad__rule--mid'],
    [BASE, 'pad__rule'],
  ].forEach(([y, cls]) => {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', -10);
    line.setAttribute('x2', W + 10);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('class', cls);
    svg.appendChild(line);
  });

  // Each stroke twice over: the road underneath, and the ink laid along it.
  const ghosts = [];
  const inks = [];
  strokes.forEach((d) => {
    const ghost = document.createElementNS(NS, 'path');
    ghost.setAttribute('d', d);
    ghost.setAttribute('class', 'pad__ghost');
    svg.appendChild(ghost);
    ghosts.push(ghost);
  });
  strokes.forEach((d) => {
    const ink = document.createElementNS(NS, 'path');
    ink.setAttribute('d', d);
    ink.setAttribute('class', 'pad__ink');
    svg.appendChild(ink);
    inks.push(ink);
  });

  // Where each stroke begins, numbered — the worksheet's "1" and "2".
  strokes.forEach((d, i) => {
    const probe = document.createElementNS(NS, 'path');
    probe.setAttribute('d', d);
    svg.appendChild(probe);
    const start = probe.getPointAtLength(0);
    probe.remove();

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', start.x);
    dot.setAttribute('cy', start.y);
    dot.setAttribute('r', 9);
    dot.setAttribute('class', 'pad__start');
    svg.appendChild(dot);

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', start.x);
    label.setAttribute('y', start.y + 4.5);
    label.setAttribute('class', 'pad__startnum');
    label.textContent = String(i + 1);
    svg.appendChild(label);
  });

  // The knob the child drags.
  const knob = document.createElementNS(NS, 'circle');
  knob.setAttribute('r', 13);
  knob.setAttribute('class', 'pad__knob');
  svg.appendChild(knob);

  // A finger on the sheet is drawing, not asking for the next view — but only
  // once it is actually the child's turn. Swallowing every tap would trap them
  // on the pad with no way out; swallowing none would flip the screen away
  // mid-stroke. So the sheet only holds on to taps while it is being traced,
  // and the margin around it always turns the page like anywhere else.
  ['click', 'pointerdown', 'pointerup'].forEach((type) =>
    svg.addEventListener(type, (e) => {
      if (svg.classList.contains('pad--tracing') || svg.classList.contains('pad--hold')) {
        e.stopPropagation();
      }
    })
  );

  pad.appendChild(svg);
  wrap.appendChild(pad);

  // Sizes only exist once the SVG is in the document.
  requestAnimationFrame(() => runPad(svg, inks, ghosts, knob, n));
  return wrap;
}

/**
 * Show it being written, empty it again, then hand the pen over.
 *
 * The demonstration and the child's turn share one mechanism: how far along
 * each stroke the ink has reached. Showing it just animates that number;
 * tracing lets a finger drive it.
 */
function runPad(svg, inks, ghosts, knob, n) {
  const lengths = inks.map((p) => p.getTotalLength());
  lengths.forEach((len, i) => {
    inks[i].style.strokeDasharray = len;
    inks[i].style.strokeDashoffset = len;
    ghosts[i].style.strokeDasharray = 'none';
  });

  const place = (stroke, dist) => {
    const pt = inks[stroke].getPointAtLength(dist);
    knob.setAttribute('cx', pt.x);
    knob.setAttribute('cy', pt.y);
  };
  const fill = (stroke, dist) => {
    inks[stroke].style.strokeDashoffset = Math.max(0, lengths[stroke] - dist);
  };

  let cancelled = false;
  const stop = () => { cancelled = true; };
  svg.addEventListener('pad-stop', stop);

  const SPEED = 74; // grid units a second — the pace of a hand, not a machine
  const BACK = 150; // rubbing out is brisker than writing
  const BETWEEN = 420; // a beat between one stroke and the next
  const alive = () => !cancelled && svg.isConnected;
  const later = (ms, fn) => setTimeout(() => { if (alive()) fn(); }, ms);

  // The pen is visible while it writes, so what a child watches is a hand
  // making the shape rather than a line appearing by itself.
  svg.classList.add('pad--writing');

  // --- writing it ---
  let stroke = 0;
  let dist = 0;
  let last = null;

  function forward(now) {
    if (!alive()) return;
    if (last === null) last = now;
    dist += ((now - last) / 1000) * SPEED;
    last = now;

    if (dist >= lengths[stroke]) {
      fill(stroke, lengths[stroke]);
      place(stroke, lengths[stroke]);
      stroke += 1;
      dist = 0;
      last = null;
      if (stroke < inks.length) {
        // Lift the pen, move to where the next stroke starts, and begin again.
        place(stroke, 0);
        later(BETWEEN, () => requestAnimationFrame(forward));
        return;
      }
      // Written. Rest on the finished numeral before undoing it.
      later(1100, () => { stroke = inks.length - 1; dist = lengths[stroke]; last = null;
        requestAnimationFrame(backward); });
      return;
    }
    fill(stroke, dist);
    place(stroke, dist);
    requestAnimationFrame(forward);
  }

  // --- and then unwriting it, backwards along the same route ---
  //
  // Fading the whole numeral out at once looked like a glitch. Running the pen
  // back the way it came reads as "now you do it", and shows the route a second
  // time in reverse before the child is asked to follow it.
  function backward(now) {
    if (!alive()) return;
    if (last === null) last = now;
    dist -= ((now - last) / 1000) * BACK;
    last = now;

    if (dist <= 0) {
      fill(stroke, 0);
      place(stroke, 0);
      stroke -= 1;
      last = null;
      if (stroke < 0) {
        later(220, () => offerTrace(svg, inks, knob, lengths, place, fill, n));
        return;
      }
      dist = lengths[stroke];
      place(stroke, dist);
      requestAnimationFrame(backward);
      return;
    }
    fill(stroke, dist);
    place(stroke, dist);
    requestAnimationFrame(backward);
  }

  place(0, 0);
  requestAnimationFrame(forward);
}

/** The child's turn: drag the knob along and the ink follows the finger. */
function offerTrace(svg, inks, knob, lengths, place, fill, n) {
  let stroke = 0;
  let dist = 0;
  let dragging = false;
  svg.classList.remove('pad--writing');
  svg.classList.add('pad--tracing');
  place(0, 0);

  // Where along this stroke is the pointer? Sampling beats maths here: the
  // paths are short and this runs once per move.
  const nearest = (pt) => {
    const path = inks[stroke];
    const len = lengths[stroke];
    let best = dist;
    let bestD = Infinity;
    const from = Math.max(0, dist - len * 0.06);
    const to = Math.min(len, dist + len * 0.22);
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const at = from + ((to - from) * i) / steps;
      const p = path.getPointAtLength(at);
      const d = (p.x - pt.x) ** 2 + (p.y - pt.y) ** 2;
      if (d < bestD) { bestD = d; best = at; }
    }
    return { at: best, off: Math.sqrt(bestD) };
  };

  /**
   * Where on the sheet is this finger?
   *
   * Not a proportion of the element's box: an SVG whose box doesn't match its
   * viewBox letterboxes the drawing and centres it, and taking a proportion of
   * the box then lands somewhere the ink isn't — measured at up to 19 grid
   * units out on a landscape phone, against a tolerance of 30. Inside the
   * tolerance, so it still worked, but the ink followed a finger that was
   * visibly beside the line. `getScreenCTM()` already knows the real mapping,
   * letterboxing and all, so the finger and the ink agree exactly.
   *
   * The sheet no longer letterboxes either (see `--pad-ar` in the stylesheet),
   * which makes this exact today — but the two fixes are independent, and this
   * is the one that has to hold if the sheet's proportions ever change again.
   */
  const toGrid = (e) => {
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const g = pt.matrixTransform(ctm.inverse());
      return { x: g.x, y: g.y };
    }
    const box = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return {
      x: vb.x + ((e.clientX - box.left) / box.width) * vb.width,
      y: vb.y + ((e.clientY - box.top) / box.height) * vb.height,
    };
  };

  const onDown = (e) => {
    const pt = toGrid(e);
    const here = inks[stroke].getPointAtLength(dist);
    if ((pt.x - here.x) ** 2 + (pt.y - here.y) ** 2 > 34 ** 2) return;
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onMove = (e) => {
    if (!dragging) return;
    const { at, off } = nearest(toGrid(e));
    if (off > 30) return; // wandered off the road; wait for them to come back
    if (at > dist) {
      dist = at;
      fill(stroke, dist);
      place(stroke, dist);
    }
    if (dist >= lengths[stroke] - 1) {
      fill(stroke, lengths[stroke]);
      if (stroke < inks.length - 1) {
        stroke += 1;
        dist = 0;
        place(stroke, 0);
        playSwap();
      } else {
        dragging = false;
        svg.classList.add('pad--done');
        svg.classList.remove('pad--tracing');
        // The very tap that finished the numeral must not also turn the page —
        // the child has earned a moment to look at what they just wrote.
        svg.classList.add('pad--hold');
        setTimeout(() => svg.classList.remove('pad--hold'), 1500);
        playWin();
        confetti(26);
        say(`You wrote ${n}!`);
      }
    }
  };

  const onUp = () => { dragging = false; };

  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);
}


// ---------------------------------------------------------------------------
// Circling groups — the same things, looked at differently
// ---------------------------------------------------------------------------

/**
 * All the things together, and then a ring drawn round each handful.
 *
 * The plates view rearranges a nine into a pink five and a blue four, which
 * risks reading as "there are two kinds of thing here". This one doesn't move
 * anything and doesn't colour anything: the nine sits there, and a lasso is
 * laid down round five of them, then round the other four. Nothing changed but
 * the way we chose to look — which is the whole idea of a number having parts.
 *
 * The rings are drawn dash by dash rather than appearing, because a child needs
 * to see the circling *happen* to read it as an act rather than a decoration.
 */
export function renderCircled(n, groups, themeIndex) {
  const wrap = shell('rep--circled', 'big');
  applyDensity(wrap, n);

  const stage = document.createElement('div');
  stage.className = 'circle-stage';

  // Everything in ONE arrangement. This is the whole point of the view: the
  // things are not sorted into piles, they are left exactly where they are and
  // a ring is drawn round some of them. Small numbers go in a single line, so
  // four cats really are four cats in a row with three of them circled.
  const flat = n <= 5;
  const runs = []; // which items belong to which group

  if (flat) {
    const row = document.createElement('div');
    row.className = 'row circle-row';
    let made = 0;
    groups.forEach((count, gi) => {
      const mine = [];
      for (let i = 0; i < count; i++) {
        const el = makeItem(themeIndex);
        el.style.animationDelay = Math.min(made * 90, 700) + 'ms';
        // A little more air between one group and the next, so the two rings
        // have somewhere to sit without touching.
        if (i === 0 && gi > 0) el.classList.add('circle-gap');
        row.appendChild(el);
        mine.push(el);
        made++;
      }
      runs.push(mine);
    });
    stage.appendChild(row);
  } else {
    let made = 0;
    groups.forEach((count) => {
      const block = document.createElement('div');
      block.className = 'circle-block';
      const mine = [];
      let placed = 0;
      while (placed < count) {
        const inRow = Math.min(5, count - placed);
        const row = document.createElement('div');
        row.className = 'row circle-row';
        for (let i = 0; i < inRow; i++) {
          const el = makeItem(themeIndex);
          el.style.animationDelay = Math.min(made * 70, 700) + 'ms';
          row.appendChild(el);
          mine.push(el);
          made++;
        }
        block.appendChild(row);
        placed += inRow;
      }
      stage.appendChild(block);
      runs.push(mine);
    });
  }

  wrap.appendChild(stage);
  // The rings can only be placed once the things they go round have a size.
  requestAnimationFrame(() => drawRings(stage, runs, n));
  return wrap;
}

/**
 * Lay a ring round each run of things.
 *
 * Boxes come from offsetLeft/offsetTop rather than getBoundingClientRect: the
 * items are still popping in, and a rect measured through a live transform puts
 * the ring where the group briefly *appears* instead of where it is.
 */
function drawRings(stage, runs, itemCount) {
  if (!stage.isConnected) return;
  const NS = 'http://www.w3.org/2000/svg';
  const startAfter = Math.min(itemCount * 90, 700) + 320;

  runs.forEach((items, i) => {
    if (!items.length) return;
    let l = Infinity, t = Infinity, r = -Infinity, bm = -Infinity;
    items.forEach((el) => {
      l = Math.min(l, el.offsetLeft);
      t = Math.min(t, el.offsetTop);
      r = Math.max(r, el.offsetLeft + el.offsetWidth);
      bm = Math.max(bm, el.offsetTop + el.offsetHeight);
    });
    const pad = Math.max(9, items[0].offsetWidth * 0.36);
    const x = l - pad;
    const y = t - pad;
    const w = r - l + pad * 2;
    const h = bm - t + pad * 2;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ring');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.left = x + 'px';
    svg.style.top = y + 'px';
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', 2);
    rect.setAttribute('y', 2);
    rect.setAttribute('width', Math.max(0, w - 4));
    rect.setAttribute('height', Math.max(0, h - 4));
    rect.setAttribute('rx', Math.min(w, h) * 0.38);
    rect.setAttribute('pathLength', 100);
    rect.setAttribute('class', 'ring__path');
    // One dash as long as the whole outline, slid out of sight and then walked
    // back in. Stepping it is what makes it arrive dash by dash.
    rect.style.animationDelay = startAfter + i * 1000 + 'ms';
    svg.appendChild(rect);
    stage.appendChild(svg);
  });
}

// ---------------------------------------------------------------------------
// Where this number sits in the count
// ---------------------------------------------------------------------------

/**
 * The whole count laid out, with everything up to this number filled in.
 *
 * These levels are not really about *how many* — that is what Count to 10 is
 * for — they are about where a number falls in a sequence you say out loud.
 * Thirty-five means nothing on its own; it means "the seventh five".
 *
 * Drawn as stepping stones joined by a path, five to a row so the pattern in
 * the last digit is impossible to miss. The stones already counted are solid
 * with a solid path behind them, this one is standing on its stone, and the
 * road ahead is dashed. They arrive one after another, in counting order.
 *
 * Stones and a path rather than a row of buttons on purpose: the first version
 * was a five-across grid of rounded chips, which is precisely what the keypad
 * underneath it looks like, so it read as a second, broken keypad.
 */
export function renderTrack(keys, n) {
  const wrap = shell('rep--track', 'big');
  const grid = document.createElement('div');
  grid.className = 'track';
  const PER_ROW = 5;

  keys.forEach((k, i) => {
    const step = document.createElement('span');
    step.className = 'track__step';
    if (k < n) step.classList.add('track__step--done');
    if (k === n) step.classList.add('track__step--here');

    // The path runs between stones in a row — not off the end of one, and not
    // off the end of the count. It is solid behind the walker, dotted ahead.
    const endsRow = (i + 1) % PER_ROW === 0;
    if (!endsRow && i !== keys.length - 1) {
      step.classList.add('track__step--linked');
      if (k < n) step.classList.add('track__step--walked');
    }

    const num = document.createElement('span');
    num.className = 'track__num';
    num.style.setProperty('--digits', String(String(k).length));
    num.textContent = String(k);
    step.appendChild(num);
    step.style.animationDelay = Math.min(i * 70, 640) + 'ms';
    grid.appendChild(step);
  });

  wrap.appendChild(grid);
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', `${n} in the count: ${keys.filter((k) => k <= n).join(', ')}`);
  return wrap;
}
