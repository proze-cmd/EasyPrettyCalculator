// bond.js
// A "number bond" — the part-part-whole diagram used throughout Singapore
// Math. The whole sits on top, joined by two branches to the parts that make
// it. It's the clearest way to show that 9 *is* 5 and 4, and that the same
// three numbers describe both 5 + 4 = 9 and 9 − 4 = 5.

import { PART_COLORS } from './config.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function node(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
}

function circleWithLabel(svg, cx, cy, r, value, color) {
  svg.appendChild(
    node('circle', {
      cx,
      cy,
      r,
      fill: '#ffffff',
      stroke: color,
      'stroke-width': 5,
    })
  );
  const text = node('text', {
    x: cx,
    y: cy,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    fill: color,
    'font-size': r * 1.05,
    'font-weight': '800',
    'font-family': 'inherit',
  });
  text.textContent = String(value);
  svg.appendChild(text);
}

/**
 * @param {number} whole  the total
 * @param {number} partA  first part
 * @param {number} partB  second part
 */
export function renderBond(whole, partA, partB) {
  const wrap = document.createElement('div');
  wrap.className = 'rep rep--bond rep--big';

  const svg = node('svg', {
    viewBox: '0 0 320 215',
    class: 'bond-svg',
    role: 'img',
    'aria-label': `${whole} is made of ${partA} and ${partB}`,
  });

  const wholeColor = '#0ca678';
  const colorA = PART_COLORS[0].solid;
  const colorB = PART_COLORS[1].solid;

  // Branches first so the circles paint over their ends.
  svg.appendChild(
    node('line', {
      x1: 160, y1: 52, x2: 76, y2: 163,
      stroke: '#c9bcd6', 'stroke-width': 5, 'stroke-linecap': 'round',
    })
  );
  svg.appendChild(
    node('line', {
      x1: 160, y1: 52, x2: 244, y2: 163,
      stroke: '#c9bcd6', 'stroke-width': 5, 'stroke-linecap': 'round',
    })
  );

  circleWithLabel(svg, 160, 52, 44, whole, wholeColor);
  circleWithLabel(svg, 76, 163, 38, partA, colorA);
  circleWithLabel(svg, 244, 163, 38, partB, colorB);

  wrap.appendChild(svg);
  return wrap;
}
