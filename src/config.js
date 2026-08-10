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

// Little celebration emoji used for confetti bursts.
export const CONFETTI = ['🎉', '⭐', '✨', '🎊', '🌟', '💫', '🎈', '💖', '🌈'];

// Never draw more individual items than this — beyond it we show the numeral
// with a friendly note instead of an unreadable carpet of icons.
export const MAX_ITEMS = 100;
