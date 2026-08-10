// speech.js
// Spoken narration using the browser's built-in Web Speech API — no audio
// files, so it still works offline and inside a Capacitor app.
//
// Why: at this age many children are pre-readers. Hearing "five" while seeing
// five grouped objects and the numeral "5" ties the three representations
// together. Rhythmic counting aloud ("one, two, three...") is also central to
// how Waldorf classrooms teach counting.
//
// Every call is defensive: speech is a nice-to-have and must never break the
// calculator if the API is missing or blocked.

import { state } from './state.js';

let voice = null;
let voiceChosen = false;

function synth() {
  try {
    return window.speechSynthesis || null;
  } catch {
    return null;
  }
}

// Prefer a local English voice; fall back to whatever the browser gives us.
function pickVoice() {
  if (voiceChosen) return voice;
  const s = synth();
  if (!s) return null;
  try {
    const voices = s.getVoices();
    if (!voices || !voices.length) return null; // may not be loaded yet
    voice =
      voices.find((v) => v.localService && /^en[-_]/i.test(v.lang)) ||
      voices.find((v) => /^en[-_]/i.test(v.lang)) ||
      voices[0] ||
      null;
    voiceChosen = true;
  } catch {
    voice = null;
  }
  return voice;
}

// Voices load asynchronously in some browsers.
try {
  if (synth()) {
    synth().onvoiceschanged = () => {
      voiceChosen = false;
      pickVoice();
    };
  }
} catch {
  /* ignore */
}

function makeUtterance(text) {
  const u = new SpeechSynthesisUtterance(String(text));
  const v = pickVoice();
  if (v) u.voice = v;
  u.rate = 0.95; // a touch slower than default — easier for young ears
  u.pitch = 1.15; // slightly bright and friendly
  u.volume = 1;
  return u;
}

/** Stop anything currently being said. */
export function cancelSpeech() {
  const s = synth();
  if (!s) return;
  try {
    s.cancel();
  } catch {
    /* ignore */
  }
}

/** Say one phrase, interrupting whatever was being said. */
export function say(text) {
  if (!state.speechOn || text === '' || text === null || text === undefined) return;
  const s = synth();
  if (!s) return;
  try {
    s.cancel();
    s.speak(makeUtterance(text));
  } catch {
    /* never let narration break the app */
  }
}

/**
 * Say a list of phrases one after another. The browser queues them, which
 * gives counting a natural rhythm ("one... two... three...").
 */
export function saySequence(parts) {
  if (!state.speechOn || !parts || !parts.length) return;
  const s = synth();
  if (!s) return;
  try {
    s.cancel();
    parts.forEach((p) => s.speak(makeUtterance(p)));
  } catch {
    /* ignore */
  }
}

/** Read an operator the way a child would say it. */
export function opWord(op) {
  switch (op) {
    case '+':
      return 'plus';
    case '−':
      return 'minus';
    case '×':
      return 'times';
    default:
      return '';
  }
}

/** "5 plus 4 equals 9" */
export function equationPhrase(a, op, b, result) {
  const parts = [a, opWord(op), b];
  if (result !== null && result !== undefined) parts.push('equals', result);
  return parts.filter((p) => p !== '' && p !== null && p !== undefined).join(' ');
}
