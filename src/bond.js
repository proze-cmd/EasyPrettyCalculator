// bond.js
// A "number bond" — the part-part-whole picture used throughout Singapore Math.
//
// The version of this diagram you see in a textbook is three circles with
// numerals in them, joined by two lines. That works for a reader who already
// knows what nine means. A child who doesn't get it sees three circles.
//
// So the circles hold the actual things. The nine dots on top are visibly the
// five dots and the four dots below, and the numeral sits underneath each one
// where it can be read off rather than relied upon.

import { partColors, resultColor } from './represent.js';
import { rowsFor, pipCells } from './arrange.js';

/**
 * The most dots a bond circle can hold and still be read. A circle is a poor
 * container for a grid: past ten the rows no longer fit inside the curve and
 * the quantity turns into a smudge, so the numeral is the honest picture.
 *
 * Ten is also where the bond belongs. Number bonds are the to-ten structure;
 * once an addition crosses ten, make-a-ten and regrouping are the views that
 * actually explain it, and both are already offered.
 */
const BOND_MAX_DOTS = 10;

const GAP = 6; // percent, between dots and between rows

/**
 * Dots inside a bond circle.
 *
 * `segments` is one or more {n, color} pieces. The whole is passed both of its
 * parts, so the nine on top is drawn as the same five and the same four that
 * sit in the circles below it — the parts stay visible inside the whole.
 *
 * Rows come from the same grouping engine as the rest of the app, so the rule
 * that nothing is ever more than five in a row holds here too.
 */
function bondDots(segments) {
  const wrap = document.createElement('div');
  wrap.className = 'bond__dots';

  // A single small quantity gets the dice face the rest of the app draws, so a
  // four in a circle is the same four a child already recognises everywhere.
  const single = segments.length === 1 ? pipCells(segments[0].n) : null;
  if (single) return pipGrid(wrap, single, segments[0].color);

  const rows = [];
  segments.forEach((seg) => {
    // Each part keeps its own shape inside the whole; it is the colour that
    // says which part a dot belongs to, so the split can stay square.
    rowsFor(seg.n).forEach((count) => rows.push({ count, color: seg.color }));
  });

  // Dots are sized by whichever way round the circle runs out first, so a tall
  // stack shrinks just as a wide row does and neither escapes the curve.
  const cols = Math.max(...rows.map((r) => r.count));
  const byWidth = (100 - (cols - 1) * GAP) / cols;
  const byHeight = (100 - (rows.length - 1) * GAP) / rows.length;
  wrap.style.setProperty('--bdot', `${Math.min(byWidth, byHeight)}%`);
  wrap.style.setProperty('--bgap', `${GAP}%`);

  let drawn = 0;
  rows.forEach((row) => {
    const line = document.createElement('div');
    line.className = 'bond__row';
    for (let i = 0; i < row.count; i++) {
      line.appendChild(makeDot(row.color, drawn++));
    }
    wrap.appendChild(line);
  });
  return wrap;
}

function makeDot(color, index) {
  const dot = document.createElement('span');
  dot.className = 'bond__dot pop-in';
  dot.style.background = color;
  dot.style.animationDelay = Math.min(index * 45, 500) + 'ms';
  return dot;
}

/** A dice face: nine cells, filled at the positions that make the pattern. */
function pipGrid(wrap, cells, color) {
  wrap.classList.add('bond__dots--pips');
  wrap.style.setProperty('--bdot', `${(100 - 2 * GAP) / 3}%`);
  wrap.style.setProperty('--bgap', `${GAP}%`);
  const filled = new Set(cells);
  let drawn = 0;
  for (let i = 0; i < 9; i++) {
    if (filled.has(i)) {
      wrap.appendChild(makeDot(color, drawn++));
    } else {
      const blank = document.createElement('span');
      blank.className = 'bond__blank';
      wrap.appendChild(blank);
    }
  }
  return wrap;
}

function bondCircle(value, color, extraClass, segments) {
  const cell = document.createElement('div');
  cell.className = 'bond__cell ' + (extraClass || '');

  const circle = document.createElement('div');
  circle.className = 'bond__circle';
  circle.style.borderColor = color;
  if (value <= BOND_MAX_DOTS) {
    circle.appendChild(bondDots(segments || [{ n: value, color }]));
  } else {
    // Past the draw limit a circle full of dots is a smudge, not a quantity.
    const big = document.createElement('span');
    big.className = 'bond__big';
    big.textContent = String(value);
    big.style.color = color;
    circle.appendChild(big);
    cell.classList.add('bond__cell--numeral');
  }
  cell.appendChild(circle);

  const num = document.createElement('div');
  num.className = 'bond__num';
  num.textContent = String(value);
  num.style.color = color;
  cell.appendChild(num);

  return cell;
}

/**
 * @param {number} whole  the total
 * @param {number} partA  first part
 * @param {number} partB  second part
 */
export function renderBond(whole, partA, partB) {
  const palette = partColors();
  const wholeColor = resultColor();
  const colorA = palette[0].solid;
  const colorB = palette[1].solid;

  const wrap = document.createElement('div');
  wrap.className = 'bond';
  wrap.setAttribute('role', 'img');
  wrap.setAttribute('aria-label', `${whole} is made of ${partA} and ${partB}`);

  const top = document.createElement('div');
  top.className = 'bond__top';
  // The whole is drawn out of its own two parts, in the parts' colours, so the
  // answer is visibly made of the things it came from rather than a new pile.
  top.appendChild(
    bondCircle(whole, wholeColor, 'bond__cell--whole', [
      { n: partA, color: colorA },
      { n: partB, color: colorB },
    ])
  );
  wrap.appendChild(top);

  // The two branches, stretched to whatever width the parts end up at.
  const links = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  links.setAttribute('class', 'bond__links');
  links.setAttribute('viewBox', '0 0 100 24');
  links.setAttribute('preserveAspectRatio', 'none');
  links.setAttribute('aria-hidden', 'true');
  [
    [50, 0, 22, 24],
    [50, 0, 78, 24],
  ].forEach(([x1, y1, x2, y2]) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', 'bond__link');
    links.appendChild(line);
  });
  wrap.appendChild(links);

  const bottom = document.createElement('div');
  bottom.className = 'bond__bottom';
  bottom.appendChild(bondCircle(partA, colorA));
  bottom.appendChild(bondCircle(partB, colorB));
  wrap.appendChild(bottom);

  return wrap;
}
