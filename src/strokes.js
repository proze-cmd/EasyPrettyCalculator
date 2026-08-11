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
  9: [
    'M62 21 C44 21 26 32 22 50 C18 68 30 82 48 82 C66 82 80 70 81 52 C82 38 74 26 62 21 L81 66 L81 134',
  ],
  // Ten is two numerals side by side, so it is written as one then zero. The
  // grid is wider for it; `padWidth` says so.
  10: [
    'M30 18 L30 132',
    'M82 18 C61 18 51 45 51 76 C51 107 61 132 82 132 C103 132 113 107 113 76 C113 45 103 18 82 18',
  ],
};

/** How wide the writing grid is for this numeral (two digits need more room). */
export function padWidth(n) {
  return n === 10 ? 130 : 100;
}

export function strokesFor(n) {
  return DIGIT_STROKES[n] || null;
}
