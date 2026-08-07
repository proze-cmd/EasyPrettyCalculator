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

// The representations the display cycles through when tapped, in order.
export const REPRESENTATIONS = ['numeral', 'dots', 'objects', 'tenframe'];

// Cute object emoji themes. Each tap into "objects" mode advances the theme,
// so the same 5 can be puppies, then bunnies, then stars…
export const OBJECT_THEMES = [
  { name: 'puppies', emoji: '🐶' },
  { name: 'bunnies', emoji: '🐰' },
  { name: 'kitties', emoji: '🐱' },
  { name: 'chicks', emoji: '🐥' },
  { name: 'apples', emoji: '🍎' },
  { name: 'stars', emoji: '⭐' },
  { name: 'balloons', emoji: '🎈' },
  { name: 'butterflies', emoji: '🦋' },
  { name: 'fish', emoji: '🐠' },
  { name: 'strawberries', emoji: '🍓' },
  { name: 'flowers', emoji: '🌸' },
  { name: 'turtles', emoji: '🐢' },
  { name: 'frogs', emoji: '🐸' },
  { name: 'ladybugs', emoji: '🐞' },
  { name: 'rockets', emoji: '🚀' },
];

// Colored "dot" shapes cycle through these hues + shapes for variety.
export const DOT_SHAPES = ['circle', 'star', 'heart', 'square'];
export const DOT_COLORS = [
  '#ff6b9d', // pink
  '#ffa64d', // orange
  '#ffd93d', // yellow
  '#6bcf7f', // green
  '#4dabf7', // blue
  '#9775fa', // purple
  '#ff8787', // coral
];

// Pretty pastel button colors (numbers rotate through these).
export const NUMBER_BUTTON_COLORS = [
  'btn-pink',
  'btn-orange',
  'btn-yellow',
  'btn-green',
  'btn-blue',
  'btn-purple',
];

// Fun fonts/backgrounds the "numeral" representation cycles through when tapped.
export const NUMERAL_STYLES = [
  { fg: '#ff4d94', bg: 'linear-gradient(135deg,#fff0f6,#ffd6ec)', font: 'var(--font-round)' },
  { fg: '#7048e8', bg: 'linear-gradient(135deg,#f3f0ff,#d0bfff)', font: 'var(--font-round)' },
  { fg: '#0ca678', bg: 'linear-gradient(135deg,#e6fcf5,#c3fae8)', font: 'var(--font-round)' },
  { fg: '#f76707', bg: 'linear-gradient(135deg,#fff4e6,#ffd8a8)', font: 'var(--font-round)' },
  { fg: '#1c7ed6', bg: 'linear-gradient(135deg,#e7f5ff,#a5d8ff)', font: 'var(--font-round)' },
];

// Little celebration emoji used for confetti bursts.
export const CONFETTI = ['🎉', '⭐', '✨', '🎊', '🌟', '💫', '🎈', '💖', '🌈'];
