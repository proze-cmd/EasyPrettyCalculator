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

  hasInteracted: false,
};

export function freshCalc() {
  return {
    a: '', // first operand, as typed
    op: null, // '+', '−', '×'
    b: '', // second operand, as typed
    result: null, // number once '=' is pressed
    // 'a' | 'b' | 'done', plus two more once a mystery is asked for:
    // 'whole'  — the total is being typed, the second part is hidden
    // 'guess'  — the total is known and the child is hunting for the part
    phase: 'a',
    // Set to 'b' when the child pressed "?" — the second part is the mystery.
    unknown: null,
    total: '', // the total, as typed, while a mystery is being set up
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
