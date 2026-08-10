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
} from './config.js';
import { groupsFor, pipCells, waysToMake } from './arrange.js';
import { state } from './state.js';

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

  applyDensity(wrap, n);

  const list = groups && groups.length ? groups : [n];
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

    // Montessori always pairs the material with its numeral.
    const label = document.createElement('span');
    label.className = 'rod__label';
    label.textContent = String(count);
    label.style.color = color.stroke || color.solid;
    line.appendChild(label);

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
  span.textContent = String(n);
  // An answer is written in the answer colour; everything else cycles.
  span.style.color = color || style.fg;
  span.style.background = style.bg;
  return span;
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
function applyDensity(el, total) {
  let vars = null;
  if (total > 50) vars = { item: 'clamp(13px, 3.9vw, 20px)', gap: '3px', pad: '4px', group: '6px' };
  else if (total > 20) vars = { item: 'clamp(16px, 4.8vw, 26px)', gap: '4px', pad: '5px', group: '8px' };
  else if (total > 10) vars = { item: 'clamp(20px, 5.8vw, 30px)', gap: '5px', pad: '6px', group: '10px' };
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
