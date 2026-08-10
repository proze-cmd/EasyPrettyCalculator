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
import { MAX_DRAWN } from './config.js';

/** Dots inside a bond circle, in short rows so they read as a group. */
function bondDots(n, color) {
  const wrap = document.createElement('div');
  wrap.className = 'bond__dots';
  // Sized so the dots land in tidy rows inside the circle — three to a row for
  // the single digits, which puts nine up as three rows of three rather than a
  // clump nobody can read at a glance.
  wrap.style.setProperty('--bdot', n <= 4 ? '38%' : n <= 9 ? '26%' : n <= 12 ? '20%' : '16%');
  for (let i = 0; i < n; i++) {
    const dot = document.createElement('span');
    dot.className = 'bond__dot pop-in';
    dot.style.background = color;
    dot.style.animationDelay = Math.min(i * 45, 500) + 'ms';
    wrap.appendChild(dot);
  }
  return wrap;
}

function bondCircle(value, color, extraClass) {
  const cell = document.createElement('div');
  cell.className = 'bond__cell ' + (extraClass || '');

  const circle = document.createElement('div');
  circle.className = 'bond__circle';
  circle.style.borderColor = color;
  if (value <= MAX_DRAWN) {
    circle.appendChild(bondDots(value, color));
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
  top.appendChild(bondCircle(whole, wholeColor, 'bond__cell--whole'));
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
