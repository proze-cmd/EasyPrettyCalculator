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
  PART_COLORS,
  MAX_ITEMS,
} from './config.js';
import { groupsFor, pipCells } from './arrange.js';

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
        removedGroups,
        forceChip,
      });
  }
}

// ---------------------------------------------------------------------------
// Grouped items (the main event)
// ---------------------------------------------------------------------------

function renderGrouped(n, o) {
  const { mode, groups, size, themeIndex, shapeIndex, groupColors, removedGroups, forceChip } = o;
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
    const color = (groupColors && groupColors[gi]) || PART_COLORS[gi % PART_COLORS.length];
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
// Numeral
// ---------------------------------------------------------------------------

export function renderNumeral(n, { size = 'big', numeralIndex = 0, negative = false } = {}) {
  const wrap = shell('rep--numeral', size);
  wrap.appendChild(numeralSpan(n, numeralIndex, size));
  if (negative || n < 0) wrap.classList.add('rep--negative');
  return wrap;
}

function numeralSpan(n, numeralIndex, size) {
  const style = NUMERAL_STYLES[numeralIndex % NUMERAL_STYLES.length];
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
