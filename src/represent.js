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
  DOT_SHAPES,
  NUMERAL_STYLES,
  NUMERAL_STYLES_CALM,
  PART_COLORS,
  PART_COLORS_CALM,
  BEAD_COLORS,
  MAX_ITEMS,
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

/**
 * Render a quantity.
 *
 * @param {number} n            the amount to draw
 * @param {object} opts
 *   mode          'objects' | 'dots' | 'tenframe' | 'numeral'
 *   groups        explicit group sizes (overrides the decomposition)
 *   decompIndex   which stored decomposition to use when groups aren't given
 *   size          'big' (a lone number) | 'small' (a row in an equation)
 *   themeIndex    which emoji set to use
 *   shapeIndex    which dot glyph to use
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
    shapeIndex = 0,
    numeralIndex = 0,
    groupColors = null,
    uniformColor = null,
    removedGroups = null,
    forceChip = false,
  } = opts;

  const value = Math.round(n);

  // Zero, negatives and anything unreasonably large fall back to the numeral.
  if (!Number.isFinite(value) || value <= 0) {
    return renderNumeral(value, { size, numeralIndex, negative: value < 0 });
  }
  if (value > MAX_ITEMS && mode !== 'numeral') {
    const wrap = shell('rep--numeral', size);
    wrap.appendChild(numeralSpan(value, numeralIndex, size));
    wrap.appendChild(note(`that's ${value}! 🤯`));
    return wrap;
  }

  switch (mode) {
    case 'numeral':
      return renderNumeral(value, { size, numeralIndex });
    case 'tenframe':
      return renderTenFrames(value, size);
    case 'rods':
      return renderRods(value, size);
    case 'dots':
    case 'objects':
    default:
      return renderGrouped(value, {
        mode,
        groups: groups && groups.length ? groups : groupsFor(value, decompIndex),
        size,
        themeIndex,
        shapeIndex,
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
  const { mode, groups, size, themeIndex, shapeIndex, groupColors, uniformColor, removedGroups, forceChip } = o;
  const wrap = shell('rep--grouped', size);

  applyDensity(wrap, n);

  const list = groups && groups.length ? groups : [n];
  const multi = list.length > 1;
  // A tinted plate normally marks off one group from the next. Equation rows
  // ask for one anyway, even with a single group: it is what ties the pink 5
  // in the answer back to the pink 5 it came from.
  const chip = multi || forceChip;
  wrap.classList.toggle('rep--multi', multi);

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
        const el = makeItem(mode, color, themeIndex, shapeIndex, drawn + i);
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

function makeItem(mode, color, themeIndex, shapeIndex, absoluteIndex) {
  if (mode === 'dots') {
    const dot = document.createElement('span');
    dot.className = 'dot pop-in';
    dot.textContent = shapeGlyph(DOT_SHAPES[shapeIndex % DOT_SHAPES.length]);
    dot.style.color = color.solid;
    return dot;
  }
  const obj = document.createElement('span');
  obj.className = 'obj pop-in';
  obj.textContent = OBJECT_THEMES[themeIndex % OBJECT_THEMES.length].emoji;
  return obj;
}

function shapeGlyph(shape) {
  switch (shape) {
    case 'star':
      return '★';
    case 'heart':
      return '♥';
    case 'square':
      return '■';
    case 'circle':
    default:
      return '●';
  }
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

// ---------------------------------------------------------------------------
// Bead bars / number rods — quantity as colour and as length
// ---------------------------------------------------------------------------

function renderRods(n, size) {
  const wrap = shell('rep--rods', size);
  applyDensity(wrap, n);

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
// Numeral
// ---------------------------------------------------------------------------

export function renderNumeral(n, { size = 'big', numeralIndex = 0, negative = false } = {}) {
  const wrap = shell('rep--numeral', size);
  wrap.appendChild(numeralSpan(n, numeralIndex, size));
  if (negative || n < 0) wrap.classList.add('rep--negative');
  return wrap;
}

function numeralSpan(n, numeralIndex, size) {
  const styles = numeralStyles();
  const style = styles[numeralIndex % styles.length];
  const span = document.createElement('span');
  span.className = 'numeral';
  span.textContent = String(n);
  span.style.color = style.fg;
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
  if (total > 50) vars = { item: 'clamp(10px, 3.1vw, 16px)', gap: '3px', pad: '4px', group: '6px' };
  else if (total > 20) vars = { item: 'clamp(14px, 4.2vw, 22px)', gap: '4px', pad: '5px', group: '8px' };
  else if (total > 10) vars = { item: 'clamp(18px, 5.4vw, 29px)', gap: '5px', pad: '6px', group: '10px' };
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
