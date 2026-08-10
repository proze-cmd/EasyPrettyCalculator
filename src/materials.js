// materials.js
// Lets the child choose what they're counting with.
//
// Which things you count with is a real decision, and a small one a child can
// own. Left to itself the app keeps swapping the objects around; picking
// puppies means puppies stay until they say otherwise. "Surprise me" hands the
// choosing back.

import { OBJECT_THEMES } from './config.js';
import { state, setMaterial, surpriseMaterial } from './state.js';
import { playPop, playTap } from './sound.js';
import { say } from './speech.js';

let overlay, grid, trigger;
let onPick = () => {};

export function initMaterials(handlers = {}) {
  onPick = handlers.onPick || (() => {});

  overlay = document.getElementById('materialsOverlay');
  grid = document.getElementById('materialsGrid');
  trigger = document.getElementById('materialsBtn');

  buildGrid();
  syncTrigger();

  trigger.addEventListener('click', open);
  document.getElementById('materialsClose').addEventListener('click', close);
  document.getElementById('materialsSurprise').addEventListener('click', () => {
    surpriseMaterial();
    playTap();
    say('Surprise me!');
    syncGrid();
    syncTrigger();
    onPick();
    close();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) close();
  });
}

function buildGrid() {
  grid.innerHTML = '';
  OBJECT_THEMES.forEach((theme, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'material';
    b.dataset.index = String(i);
    b.setAttribute('aria-label', theme.name);

    const face = document.createElement('span');
    face.className = 'material__emoji';
    face.textContent = theme.emoji;
    const name = document.createElement('span');
    name.className = 'material__name';
    name.textContent = theme.name;

    b.append(face, name);
    b.addEventListener('click', () => {
      setMaterial(i);
      playPop();
      say(theme.name);
      syncGrid();
      syncTrigger();
      onPick();
      close();
    });
    grid.appendChild(b);
  });
  syncGrid();
}

function syncGrid() {
  const chosen = state.materialPinned ? state.objectThemeIndex % OBJECT_THEMES.length : -1;
  grid.querySelectorAll('.material').forEach((b) => {
    const on = Number(b.dataset.index) === chosen;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const surprise = document.getElementById('materialsSurprise');
  surprise.classList.toggle('on', !state.materialPinned);
}

/** The button in the top bar wears whatever the child is counting with. */
export function syncTrigger() {
  if (!trigger) return;
  const theme = OBJECT_THEMES[state.objectThemeIndex % OBJECT_THEMES.length];
  trigger.textContent = theme.emoji;
  trigger.setAttribute('aria-label', `Counting with ${theme.name}. Tap to change.`);
}

function open() {
  syncGrid();
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
}

function close() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
}
