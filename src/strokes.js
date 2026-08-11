// strokes.js
// How each numeral is *written* — the path a hand takes, not the shape a font
// prints.
//
// A font glyph is an outline: it knows what a three looks like but not that you
// start at the top left, sweep right, come back to the middle, and only then
// make the second belly. Stroke order is the thing a child actually has to
// learn, and it cannot be recovered from a typeface, so it is written out here.
//
// Everything lives on a 100 x 150 grid that lines up with the guide rules:
//
//    y = 15   the top line
//    y = 75   the dashed middle line
//    y = 135  the baseline
//
// Each numeral is a list of strokes, in the order they are made. Every stroke
// is drawn with a thick round cap, which is what gives the finished numeral its
// soft edges — the letter *is* the trail the pen left.

export const TOP = 15;
export const MIDDLE = 75;
export const BASE = 135;

export const DIGIT_STROKES = {
  0: ['M50 18 C29 18 19 45 19 76 C19 107 29 132 50 132 C71 132 81 107 81 76 C81 45 71 18 50 18'],
  1: ['M28 42 L52 18 L52 132'],
  2: ['M22 42 C24 20 54 12 70 24 C88 38 78 64 58 82 L20 132 L82 132'],
  // The two bellies of a three, which is why worksheets number it 1 and 2.
  3: [
    'M24 38 C32 18 74 14 76 40 C78 60 58 74 46 74',
    'M46 74 C66 74 84 86 82 108 C80 130 34 136 22 114',
  ],
  4: ['M66 18 L18 94 L86 94', 'M66 18 L66 132'],
  // The stem and belly first, then the bar across the top — the way it's taught.
  5: ['M34 18 L27 68 C52 56 86 68 86 98 C86 126 46 138 24 118', 'M34 18 L78 18'],
  6: [
    'M74 20 C43 27 20 56 20 94 C20 120 37 134 51 134 C69 134 84 120 84 102 C84 84 68 72 52 72 C36 72 21 81 20 94',
  ],
  7: ['M18 20 L84 20 L44 132'],
  8: [
    'M50 74 C31 66 25 47 31 33 C39 15 63 15 71 33 C77 48 55 66 47 74 C29 84 19 98 23 114 C29 135 73 135 79 114 C85 96 69 82 50 74',
  ],
  // Bowl first, then a descender that stays to the right — swept left it reads
  // as a g rather than a nine.
  9: ['M79 60 C66 78 40 76 32 58 C24 40 36 22 56 22 C75 22 84 39 84 60 C84 92 82 114 72 134'],
  // Ten is two numerals side by side, so it is written as one then zero. The
  // grid is twice as wide for it; `padWidth` says so.
  10: [
    'M12 42 L30 18 L30 132',
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
