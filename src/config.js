// config.js
// All the "content" of the app lives here so it is easy to tweak or extend:
// the level progression, the representation cycle, emoji themes and palettes.

/**
 * Levels are data-driven. Add a new object to grow the app.
 *
 * mode: "count" -> literal number buttons, pressing one just shows that number.
 *       "calc"  -> a 0-9 digit keypad plus operators; builds a stacked equation.
 *
 * keys:  (count mode) the literal numbers shown on the buttons.
 * ops:   (calc mode)  which operators are available.
 * maxValue: the biggest number this level is really about (used to size things,
 *           cap how many digits can be typed, and pick representations).
 */
export const LEVELS = [
  {
    id: 1,
    name: 'Count to 10',
    blurb: 'Tap the numbers 1 to 10.',
    mode: 'count',
    keys: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    ops: [],
    maxValue: 10,
  },
  {
    id: 2,
    name: 'Count by 10s',
    blurb: '10, 20, 30 … all the way to 100!',
    mode: 'count',
    keys: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    ops: [],
    maxValue: 100,
  },
  {
    id: 3,
    name: 'Adding to 10',
    blurb: 'Add numbers together, up to 10.',
    mode: 'calc',
    ops: ['+'],
    maxValue: 10,
  },
  {
    id: 4,
    name: 'Add & Take Away',
    blurb: 'Adding and subtracting, up to 10.',
    mode: 'calc',
    ops: ['+', '−'],
    maxValue: 10,
  },
  {
    id: 5,
    name: 'Numbers to 20',
    blurb: 'Add and take away, all the way to 20.',
    mode: 'calc',
    ops: ['+', '−'],
    maxValue: 20,
  },
  {
    id: 6,
    name: 'Big Numbers to 100',
    blurb: 'Two-digit adding and subtracting, up to 100.',
    mode: 'calc',
    ops: ['+', '−'],
    maxValue: 100,
  },
  {
    id: 7,
    name: 'Equal Groups',
    blurb: 'Meet multiplication — adding equal groups!',
    mode: 'calc',
    ops: ['+', '−', '×'],
    maxValue: 100,
  },
];

/**
 * Colors used to tint each *group* within a quantity, so "9 as 3 groups of 3"
 * reads instantly as three distinct clusters. Also used to color the two parts
 * of an addition so the parts stay visible inside the whole.
 */
export const PART_COLORS = [
  { solid: '#ff6b9d', soft: 'rgba(255,107,157,0.16)', name: 'pink' },
  { solid: '#4dabf7', soft: 'rgba(77,171,247,0.16)', name: 'blue' },
  { solid: '#6bcf7f', soft: 'rgba(107,207,127,0.18)', name: 'green' },
  { solid: '#ffa64d', soft: 'rgba(255,166,77,0.18)', name: 'orange' },
  { solid: '#9775fa', soft: 'rgba(151,117,250,0.16)', name: 'purple' },
];

// Cute object emoji themes. Each trip back through "objects" advances the
// theme, so the same 5 can be puppies, then bunnies, then acorns…
// The natural items (stones, shells, leaves) are deliberately included:
// Reggio Emilia settings favour real "loose parts" over cartoon characters.
export const OBJECT_THEMES = [
  { name: 'puppies', emoji: '🐶' },
  { name: 'bunnies', emoji: '🐰' },
  { name: 'kitties', emoji: '🐱' },
  { name: 'acorns', emoji: '🌰' },
  { name: 'shells', emoji: '🐚' },
  { name: 'chicks', emoji: '🐥' },
  { name: 'apples', emoji: '🍎' },
  { name: 'leaves', emoji: '🍂' },
  { name: 'stars', emoji: '⭐' },
  { name: 'flowers', emoji: '🌸' },
  { name: 'butterflies', emoji: '🦋' },
  { name: 'strawberries', emoji: '🍓' },
  { name: 'turtles', emoji: '🐢' },
  { name: 'ladybugs', emoji: '🐞' },
  { name: 'rockets', emoji: '🚀' },
];

/**
 * The Montessori bead-stair colours. In a Montessori classroom every quantity
 * has its own colour — a five is always light blue, a three is always pink —
 * so the colour itself comes to mean the number, long before the numeral does.
 * Drawn as bars, they also make size visible: nine is plainly longer than four.
 */
export const BEAD_COLORS = {
  1: { solid: '#e03131', name: 'red' },
  2: { solid: '#2f9e44', name: 'green' },
  3: { solid: '#f06595', name: 'pink' },
  4: { solid: '#fab005', name: 'yellow' },
  5: { solid: '#74c0fc', name: 'light blue' },
  6: { solid: '#9775fa', name: 'purple' },
  7: { solid: '#f8f9fa', stroke: '#adb5bd', name: 'white' },
  8: { solid: '#a1622f', name: 'brown' },
  9: { solid: '#1864ab', name: 'dark blue' },
  10: { solid: '#e8a90c', name: 'gold' },
};

// Colored "dot" shapes cycle through these shapes for variety.
export const DOT_SHAPES = ['circle', 'star', 'heart', 'square'];

// Pretty pastel button colors (numbers rotate through these).
export const NUMBER_BUTTON_COLORS = [
  'btn-pink',
  'btn-orange',
  'btn-yellow',
  'btn-green',
  'btn-blue',
  'btn-purple',
];

// Fun fonts/backgrounds the "numeral" representation cycles through.
export const NUMERAL_STYLES = [
  { fg: '#ff4d94', bg: 'linear-gradient(135deg,#fff0f6,#ffd6ec)' },
  { fg: '#7048e8', bg: 'linear-gradient(135deg,#f3f0ff,#d0bfff)' },
  { fg: '#0ca678', bg: 'linear-gradient(135deg,#e6fcf5,#c3fae8)' },
  { fg: '#f76707', bg: 'linear-gradient(135deg,#fff4e6,#ffd8a8)' },
  { fg: '#1c7ed6', bg: 'linear-gradient(135deg,#e7f5ff,#a5d8ff)' },
];

// Muted equivalents for the calm theme. These are set as inline styles from
// JavaScript, so unlike everything else they can't be swapped by a CSS class —
// they have to be chosen at draw time.
export const NUMERAL_STYLES_CALM = [
  { fg: '#b5654e', bg: 'linear-gradient(135deg,#fdf3ec,#f2ddcf)' },
  { fg: '#6f7f5c', bg: 'linear-gradient(135deg,#f1f4ec,#dde5d2)' },
  { fg: '#7b6a8d', bg: 'linear-gradient(135deg,#f3f0f6,#e0d8e8)' },
  { fg: '#a5824a', bg: 'linear-gradient(135deg,#faf3e4,#ecdcbd)' },
  { fg: '#5b7f8a', bg: 'linear-gradient(135deg,#eef4f6,#d5e4e9)' },
];

export const PART_COLORS_CALM = [
  { solid: '#c2705a', soft: 'rgba(194,112,90,0.15)', name: 'terracotta' },
  { solid: '#6f8f9e', soft: 'rgba(111,143,158,0.15)', name: 'dusty blue' },
  { solid: '#7f9668', soft: 'rgba(127,150,104,0.16)', name: 'sage' },
  { solid: '#c2a05a', soft: 'rgba(194,160,90,0.16)', name: 'honey' },
  { solid: '#8d7a9c', soft: 'rgba(141,122,156,0.15)', name: 'heather' },
];

// The colour an answer is written in — green for "this is the result".
export const RESULT_COLOR = { bright: '#0ca678', calm: '#5c8a5e' };

// Little celebration emoji used for confetti bursts.
export const CONFETTI = ['🎉', '⭐', '✨', '🎊', '🌟', '💫', '🎈', '💖', '🌈'];

// Never draw more individual items than this — beyond it we show the numeral
// with a friendly note instead of an unreadable carpet of icons.
export const MAX_ITEMS = 100;
