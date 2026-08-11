// strokes.js
// How each numeral is *written* — the path a hand takes, not the shape a font
// prints.
//
// A font glyph is an outline: it knows what a three looks like but not that you
// start at the top left and sweep right. Stroke order is the thing a child
// actually has to learn, and it cannot be recovered from a typeface, so it is
// written out here, following a standard handwriting worksheet:
//
//   1  one stroke   straight down
//   2  two strokes  the curve, then the line along the bottom
//   3  one stroke   both bellies without lifting
//   4  two strokes  down-and-across, then the stem — with an open top
//   5  two strokes  down-and-round the belly, then the bar across the top
//   6  one stroke   from the top, left and down, round the loop
//   7  one stroke   across, then down
//   8  one stroke   from the top, left, and round both loops
//   9  one stroke   from the top, left round the bowl, then straight down
//   0  one stroke   from the top, left, all the way round
//
// Everything lives on a 100 x 150 grid that lines up with the guide rules:
//
//    y = 15   the top line
//    y = 75   the dashed middle line
//    y = 135  the baseline
//
// Each stroke is drawn with a thick round cap, which is what gives the finished
// numeral its soft edges — the numeral *is* the trail the pen left.

export const TOP = 15;
export const MIDDLE = 75;
export const BASE = 135;

export const DIGIT_STROKES = {
  // From the top, leftwards, all the way round.
  0: ['M50 18 C29 18 19 45 19 76 C19 107 29 132 50 132 C71 132 81 107 81 76 C81 45 71 18 50 18'],
  // A straight line down. No flag: that is how it is taught, and how a
  // worksheet prints it.
  1: ['M50 18 L50 132'],
  // The curve first, then the line along the bottom, left to right.
  2: ['M22 40 C25 20 52 12 68 22 C86 33 80 58 60 78 L24 132', 'M24 132 L82 132'],
  // Both bellies in one movement — the pen never lifts.
  3: [
    'M24 38 C32 18 74 14 76 40 C78 60 58 74 46 74 C66 74 84 86 82 108 C80 130 34 136 22 114',
  ],
  // Down and across, then the stem. The two tops stay apart, which is the
  // "open" four a child is taught before the closed triangle.
  4: ['M54 18 L18 92 L84 92', 'M68 18 L68 132'],
  // Down the stem and round the belly, then back up for the bar across the top.
  5: ['M32 20 L26 70 C50 58 86 68 86 98 C86 126 46 138 24 118', 'M32 20 L80 20'],
  // From the top, leftwards and down, then round the loop.
  6: [
    'M74 20 C43 27 20 56 20 94 C20 120 37 134 51 134 C69 134 84 120 84 102 C84 84 68 72 52 72 C36 72 21 81 20 94',
  ],
  7: ['M18 20 L84 20 L44 132'],
  // From the top, leftwards, down through the middle and round both loops.
  8: [
    'M56 19 C38 17 27 30 32 45 C36 58 52 66 62 74 C74 84 80 98 77 112 C73 132 32 134 23 117 C15 101 33 82 47 74 C59 66 71 56 72 42 C73 28 66 20 56 19',
  ],
  // From the top, leftwards round the bowl, and then straight down. One
  // movement: the bowl runs into the stem without the pen lifting.
  // Start halfway between the headline and the midline — which is the circle's
  // own right-hand edge — circle all the way back to the left, and then pull
  // straight down to the baseline.
  //
  // Closing the circle exactly where it started means the pen finishes on the
  // line the stem runs along, so the stem is a true tangent: dead straight from
  // the circle down to the baseline, joined to the bowl rather than reaching
  // across to it. Any other closing point leaves a diagonal through the counter,
  // and that diagonal is what makes a nine look like it is leaning.
  9: [
    'M80 45 C80 28 67 15 50 15 C33 15 20 28 20 45 C20 62 33 75 50 75 C67 75 80 62 80 45 L80 135',
  ],
};

/**
 * How far apart two numerals sit. A digit's ink spans about x=14..86 of its own
 * hundred-wide grid, so this leaves a clear gap between one and the next.
 */
const ADVANCE = 96;

/**
 * Shift a path sideways by rewriting its numbers.
 *
 * The obvious way — an SVG transform — would be wrong here: `getPointAtLength`
 * reports untransformed coordinates, and the tracing works by comparing a
 * finger's position against exactly those. Moving the numbers themselves keeps
 * the path and the maths in the same space.
 *
 * Safe because every stroke in this file is absolute M / L / C, so every
 * coordinate pair is (x, y) and every even number is an x.
 */
function shiftPath(d, dx) {
  return d
    .replace(/([MLC])([^MLCZ]*)/g, (_, cmd, nums) => {
      const parts = nums.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      return cmd + parts.map((v, i) => (i % 2 === 0 ? v + dx : v)).join(' ') + ' ';
    })
    .trim();
}

const digitsOf = (n) => String(Math.round(n)).split('').map(Number);

/**
 * The strokes for a whole number, in the order a hand makes them.
 *
 * A two-digit number is just its digits written left to right, so twenty is a
 * two and then a zero — three movements in all. That is exactly what the
 * skip-counting levels are asking a child to learn to write.
 */
export function strokesFor(n) {
  const digits = digitsOf(n);
  const out = [];
  digits.forEach((d, i) => {
    const strokes = DIGIT_STROKES[d];
    if (!strokes) return;
    strokes.forEach((path) => out.push(i === 0 ? path : shiftPath(path, i * ADVANCE)));
  });
  return out.length ? out : null;
}

/** How wide the writing grid is — one hundred per digit, less the overlap. */
export function padWidth(n) {
  return (digitsOf(n).length - 1) * ADVANCE + 100;
}
