// state.js
// A tiny central store for app state, with localStorage persistence for the
// things worth remembering between visits (level, sound, narration).

import { LEVELS } from './config.js';

const STORAGE_KEY = 'kidcalc.settings.v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

const saved = loadSaved();

export const state = {
  // --- persisted preferences ---
  levelIndex: clampLevel(saved.levelIndex ?? 0), // 0-based index into LEVELS
  soundOn: saved.soundOn !== undefined ? !!saved.soundOn : true,
  speechOn: saved.speechOn !== undefined ? !!saved.speechOn : true,
  theme: saved.theme === 'calm' ? 'calm' : 'bright',
  // Which objects the child is counting with, and whether they chose it
  // themselves. A chosen material stays put; an unchosen one keeps surprising.
  objectThemeIndex: saved.material ?? 0,
  materialPinned: !!saved.materialPinned,

  // --- live calculator state (not persisted) ---
  // For "count" mode: just the currently shown value (or null = empty).
  countValue: null,

  // For "calc" mode: the equation being built.
  calc: freshCalc(),

  // Which view the display is showing (advances on each tap).
  viewIndex: 0,
  numeralStyleIndex: 0,
  // Which way of splitting the number is on show. Bumped every time the
  // journey comes back round to the start, so going round again is a different
  // trip: ten is five and five, then six and four, then seven and three…
  splitIndex: 0,

  hasInteracted: false,
};

export function freshCalc() {
  return {
    a: '', // first operand, as typed
    op: null, // '+', '−', '×'
    b: '', // second operand, as typed
    result: null, // the answer, once it is settled
    // 'a' | 'b' | 'done', plus two the child has to do something in:
    // 'answer' — the sum is built and they are typing what it makes
    // 'guess'  — "?" asked for a missing part and they are hunting for it
    // Both hold exactly one unknown. Two at once is not a question.
    phase: 'a',
    // Set to 'b' when the child pressed "?" — the second part is the mystery.
    unknown: null,
    answer: '', // their answer to a finished sum, as typed
    // How many tries so far, so the app can offer more help rather than
    // repeating itself.
    tries: 0,
  };
}

export function currentLevel() {
  return LEVELS[state.levelIndex];
}

export function clampLevel(i) {
  return Math.max(0, Math.min(LEVELS.length - 1, i | 0));
}

export function setLevel(index) {
  state.levelIndex = clampLevel(index);
  // Changing level clears whatever was on the display.
  state.countValue = null;
  state.calc = freshCalc();
  resetView();
  persist();
}

export function setSound(on) {
  state.soundOn = !!on;
  persist();
}

export function setSpeech(on) {
  state.speechOn = !!on;
  persist();
}

export function setMaterial(index) {
  state.objectThemeIndex = index;
  state.materialPinned = true;
  persist();
}

export function surpriseMaterial() {
  state.materialPinned = false;
  persist();
}

export function setTheme(name) {
  state.theme = name === 'calm' ? 'calm' : 'bright';
  applyTheme();
  persist();
}

/** Themes are just a class on <body> that swaps the colour variables. */
export function applyTheme() {
  document.body.classList.toggle('theme-calm', state.theme === 'calm');
}

/** New content always starts at the beginning of the view journey. */
export function resetView() {
  state.viewIndex = 0;
}

export function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        levelIndex: state.levelIndex,
        soundOn: state.soundOn,
        speechOn: state.speechOn,
        theme: state.theme,
        material: state.objectThemeIndex,
        materialPinned: state.materialPinned,
      })
    );
  } catch {
    /* storage may be unavailable (private mode) — that's ok */
  }
}
