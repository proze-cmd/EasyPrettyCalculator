// represent.js
// Turns a single number into a visual: a fancy numeral, a group of shapes,
// a group of cute objects, or ten-frames. Returns a DOM element so the display
// module can arrange one number (count mode) or several (equation mode).

import { OBJECT_THEMES, DOT_SHAPES, DOT_COLORS, NUMERAL_STYLES } from './config.js';

// Keep giant counts fun rather than overwhelming: group into tens and cap.
const MAX_OBJECTS = 100;

/**
 * @param {number} value  the number to draw
 * @param {string} mode   'numeral' | 'dots' | 'objects' | 'tenframe'
 * @param {object} styleIdx  indices used to vary the look on each tap
 * @param {'big'|'small'} size  big for a lone number, small for equation rows
 */
export function renderNumber(value, mode, styleIdx = {}, size = 'big') {
  const n = Math.round(value);

  // Zero and negatives fall back to a friendly numeral in every mode.
  if (n <= 0 || !Number.isFinite(n)) {
    return numeral(n, styleIdx.numeral || 0, size, n < 0);
  }

  switch (mode) {
    case 'dots':
      return dots(n, styleIdx.dot || 0, size);
    case 'objects':
      return objects(n, styleIdx.object || 0, size);
    case 'tenframe':
      return tenFrame(n, size);
    case 'numeral':
    default:
      return numeral(n, styleIdx.numeral || 0, size, false);
  }
}

function numeral(n, styleIndex, size, negative) {
  const el = document.createElement('div');
  el.className = 'rep rep--numeral ' + (size === 'small' ? 'rep--small' : 'rep--big');
  const style = NUMERAL_STYLES[styleIndex % NUMERAL_STYLES.length];
  const span = document.createElement('span');
  span.className = 'numeral';
  span.textContent = String(n);
  span.style.color = style.fg;
  span.style.background = style.bg;
  span.style.backgroundClip = 'padding-box';
  el.appendChild(span);
  if (negative) el.classList.add('rep--negative');
  return el;
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

function dots(n, styleIndex, size) {
  const el = grid(size);
  el.classList.add('rep--dots');
  const shape = DOT_SHAPES[styleIndex % DOT_SHAPES.length];
  const glyph = shapeGlyph(shape);
  const count = Math.min(n, MAX_OBJECTS);
  fillGroups(el, count, (i) => {
    const dot = document.createElement('span');
    dot.className = 'dot pop-in';
    dot.textContent = glyph;
    dot.style.color = DOT_COLORS[(i + styleIndex) % DOT_COLORS.length];
    dot.style.animationDelay = Math.min(i * 25, 700) + 'ms';
    return dot;
  });
  if (n > MAX_OBJECTS) addOverflowNote(el, n);
  return el;
}

function objects(n, themeIndex, size) {
  const el = grid(size);
  el.classList.add('rep--objects');
  const theme = OBJECT_THEMES[themeIndex % OBJECT_THEMES.length];
  const count = Math.min(n, MAX_OBJECTS);
  fillGroups(el, count, (i) => {
    const o = document.createElement('span');
    o.className = 'obj pop-in';
    o.textContent = theme.emoji;
    o.style.animationDelay = Math.min(i * 30, 800) + 'ms';
    return o;
  });
  if (n > MAX_OBJECTS) addOverflowNote(el, n);
  return el;
}

// A ten-frame (or several) — the classic math tool: rows of 5, filled up.
function tenFrame(n, size) {
  const wrap = document.createElement('div');
  wrap.className = 'rep rep--tenframe ' + (size === 'small' ? 'rep--small' : 'rep--big');
  const frames = Math.ceil(Math.min(n, MAX_OBJECTS) / 10) || 1;
  let remaining = Math.min(n, MAX_OBJECTS);
  for (let f = 0; f < frames; f++) {
    const frame = document.createElement('div');
    frame.className = 'tenframe';
    for (let c = 0; c < 10; c++) {
      const cell = document.createElement('span');
      cell.className = 'tf-cell';
      if (remaining > 0) {
        cell.classList.add('tf-filled', 'pop-in');
        cell.style.animationDelay = Math.min((f * 10 + c) * 30, 800) + 'ms';
        remaining--;
      }
      frame.appendChild(cell);
    }
    wrap.appendChild(frame);
  }
  if (n > MAX_OBJECTS) addOverflowNote(wrap, n);
  return wrap;
}

// --- helpers ---

function grid(size) {
  const el = document.createElement('div');
  el.className = 'rep rep--grid ' + (size === 'small' ? 'rep--small' : 'rep--big');
  return el;
}

// Lay items out in groups of ten so big numbers stay countable.
function fillGroups(container, count, makeItem) {
  const groups = Math.ceil(count / 10);
  let made = 0;
  if (count <= 10) {
    // Small counts: a single tidy row/cluster, no group boxes.
    for (let i = 0; i < count; i++) container.appendChild(makeItem(i));
    return;
  }
  for (let g = 0; g < groups; g++) {
    const box = document.createElement('div');
    box.className = 'group';
    const inThis = Math.min(10, count - made);
    for (let i = 0; i < inThis; i++) {
      box.appendChild(makeItem(made));
      made++;
    }
    container.appendChild(box);
  }
}

function addOverflowNote(el, n) {
  const note = document.createElement('div');
  note.className = 'overflow-note';
  note.textContent = `…that's ${n}! 🤯`;
  el.appendChild(note);
}
