# Playtest notes

What to check, and what "right" means. This exists so a playtest is measured
against the app's principles rather than against whatever the app currently
happens to do.

Run `npm run dev` and drive the real thing. Automated suites live in the
session scratchpad, not the repo; they cover structure, not judgement.

---

## The principles everything is tested against

1. **Preschool to 2nd grade.** If a four-year-old wouldn't do it, it shouldn't
   be there. If a 2nd grader would find it babyish, it should be gated behind a
   level.
2. **Never a line to count.** Quantities are always in structured groups — dice
   patterns to 6, five-and-some-more to 10, tens beyond. **Never more than five
   in a row.**
3. **Every view earns its tap.** If a screen teaches nothing the screen before
   it didn't, delete it. Counting levels: ~4 views. Sums: 3–6, all conditional.
4. **Nothing draws more than `MAX_DRAWN` (20) separate things.** Past that it's
   ten-frames. Nobody counts 100 tiny puppies.
5. **A level means what its name says.** "Adding to 10" cannot reach 18.
   Subtraction never goes negative. Out-of-range keys dim and say why.
6. **The parts stay visible in the whole.** The pink 5 in the answer is the
   same pink 5 it came from.
7. **Say it, don't just show it.** Numbers, splits and equations are spoken.
   Pre-readers get icons; the words underneath are for the grown-up.
8. **The child chooses.** Materials are theirs; a chosen one stays put.

Frameworks: **Montessori** (bead colours, rods, numeral↔quantity, one idea per
view) · **Singapore** (CPA, number bonds, ten-frames, make-a-ten, regrouping,
bar model) · **Waldorf** (counting aloud with rhythm, whole-to-parts, the calm
palette) · **Reggio** (natural loose parts, child's choice, many representations).

---

## Invariants — these must never break

| # | Invariant | How to check |
|---|---|---|
| I1 | No row of items exceeds 5 | `.rows .row` child count ≤ 5 everywhere |
| I2 | Nothing draws > 20 loose items | `.obj` count ≤ 20; above that expect `.tenframe` |
| I3 | Smallest touchable thing ≥ ~15px | measure `.obj` / `.tf-filled` / `.bead` widths |
| I4 | No level can exceed its `maxValue` | try to type past it on every level |
| I5 | Subtraction never negative | try `3 − 9` |
| I6 | No horizontal scroll, ever | `display.scrollWidth ≤ clientWidth` |
| I7 | Keypad never clipped | `keypad.bottom ≤ window.innerHeight` |
| I8 | No console errors | listen for `pageerror` throughout |
| I9 | Counting only in quantity views | explanation views must not mark `.counted` |
| I10 | Counting is per row in an equation | 5 + 4 = 9 must say "5", then "4", then "9" — never 18 |

---

## ⚠️ Measurement traps (I've been fooled by all of these)

- **Animations.** `pop-in` staggers up to ~760ms and holds a transform;
  `pop-anim` scales to 1.12. Measuring before it settles reports width 0 or a
  false horizontal overflow. **Wait ≥ 1500ms before measuring anything visual.**
  Three separate "bugs" this session were this.
- **Passing tests ≠ correct visuals.** A whole CSS block once failed to apply
  and every test still passed, because the tests asserted classes and behaviour.
  For anything visual, assert *computed styles and sizes*, and look at a
  screenshot.
- **Clicking the display centre now hits an object** (and counts it). Click a
  corner — `{position:{x:14,y:14}}` — to change view.
- **`aria-disabled` makes Playwright treat a button as disabled** and time out.
- **Accessible names change what selectors match.** `getByRole('button',{name:'9'})`
  breaks if the label becomes "9, too big".
- **Hand-computed layout claims are unreliable** — one review "proved" the
  keypad was clipped; measuring showed it fits. Always measure.

---

## The walk-through

Do this on **390×844** first, then repeat the shaded rows on 320×568,
740×380 (landscape) and 820×1180 (tablet), in **both themes**.

### Level 1 — Count to 10
- Press **9** → numeral **9** paired with **5 + 4** in dice patterns (I1).
- Expect **4 views**: paired → one other split (3+3+3) → rods → ten-frame.
  *Not* three different splits.
- Touch each puppy: rings green, shrinks, counts aloud, celebrates at 9 (I9).
- Miss an object inside a group → picture must **not** change, count survives.
- Press **1** → no "ways to make 1" (there are none).
- Rods: one 9-long dark-blue bar with a break after the fifth. Not 5+4.

### Level 2 — Count by 2s
- Press **14** → pairs view offered (it is not offered on Count to 10).
- 14 → **7 pairs, none left, "even"**. 7 → 3 pairs + one in a dashed ring, "odd".

### Level 3 — Count by 5s
- Press **35** → seven ten-frames' worth; no loose things to touch.

### Level 4 — Count by 10s
- Press **100** → numeral + **ten ten-frames**, no loose objects (I2).
- **2 views only** (paired, rods) — no duplicate ten-frame view.
- Touching a cell must **turn the page**, not count (I2/I9). Hint must say
  "Tap to see it another way", not "Touch each one".

### Level 5 — Adding to 10
- `5 + 4 =` → stacked equation, `=` under the line, answer green.
- Objects view: pink 5 above blue 4; the answer is that **same** pink 5 beside
  that **same** blue 4 (principle 6).
- Bond: 9 on top, 5 and 4 below, colours matching the equation.
- Ways: 8 strips, `1 + 8` … `8 + 1`, a clean staircase.
- Type `9` then `+` → every digit above 1 dims. Press one → wobble + "too big".

### Level 6 — Add & Take Away
- `9 − 4 =` → top row shows 5 kept + 4 faded and dashed.
- **Compare view**: two proportional bars, dashed gap labelled **5**,
  caption "9 is 5 more than 4". Bar ratio ≈ 4/9.
- `5 − 5 =` → answer is an **empty ten-frame** labelled "none left"; the taken
  part matches the row below in colour.
- `0 + 5 =` → zero row is an empty frame with **no** "none left" clutter.
- `3 − 9` must be impossible to build (I5).

### Level 7 — Numbers to 20
- `8 + 5 =` → **make-a-ten**: first frame fills 8 pink + 2 blue, second frame
  3 blue, "10 + 3 = 13". Borrowed beads land *after* the rest.

### Level 8 — Big Numbers to 100
- `27 + 18 =` → **regrouping**: "7 ones and 8 ones make 15", ten ones in a
  frame, ↓, a gold ten bar "a new ten!", "and 5 left over",
  "4 tens and 5 ones = 45".
- `21 + 13 =` → regrouping must be **absent** (nothing was traded).
- `45` as a quantity → ten-frames, not 45 loose things.

### Level 9 — Equal Groups
- `4 × 5 =` → answer is **4 groups of 5**, each on its own coloured plate.
- `9 × 9` must be **impossible** — level caps at 20 (I4).

### Level 10 — Fair Shares
- `12 ÷` → only **1, 2, 3, 4, 6** stay lit. Pressing 5 wobbles and says it
  doesn't share evenly. Leftovers are a later idea; the dimming is a first
  look at factors.
- `12 ÷ 3 =` → the divisor draws as **three empty plates**, not three things,
  and the answer is three plates of four.

### Settings & chrome
- Level slider 1→7 mid-problem: display clears, keypad rebuilds, no errors.
- Theme switch **with a number on screen** → repaints immediately.
- Materials: pick shells → shells appear and **stay** through a full cycle and
  a reload. "Surprise me" resumes rotation.
- Both sheets: reachable and closable in **landscape** (they once weren't).
- Escape with a sheet open closes the sheet and **keeps** the sum.

### Reach
- Tab through: visible focus everywhere; focus never lands inside a hidden sheet.
- `prefers-reduced-motion`: no confetti, no wobble, no sheet slide.
- Pinch-zoom works (must not be disabled).
- Corrupt `localStorage` → app still boots.

---

## The word/picture test

The concept screens are the ones a struggling child needs most, and they were
the ones leaning hardest on reading. Count them: for each explanation view,
how many *words* and how many *shapes* are on screen?

| Screen | words | what carries the idea |
|---|---|---|
| Bond | 0 | dots inside all three circles |
| Make a ten | 0 | the 5 drawn whole with the movers marked |
| Regrouping | 0 | ones → a gathered ten → tens and ones |
| Comparison | 1 | blocks, the gap drawn as empty ones, plus `9 > 4` |
| Pairs | 1 | everything paired, or one left in a dashed ring |
| Fair shares | 0 | things, empty plates, then plates with things on |
| Ways to make | 1 | the staircase |

**If a screen's word count creeps up, it has stopped explaining and started
telling.** A pre-reader must be able to get it with the sound off.

## Judgement questions — ask these every pass

1. Which screen would a four-year-old skip? Why is it still there?
2. Does any view teach the same thing as the one before it?
3. Is anything on screen that a child would try to touch and get nothing from?
4. Would a Montessori/Waldorf/Reggio/Singapore teacher recognise the material,
   or is it a decoration wearing its name?
5. What's the longest path to something useful? (Should be ~2 taps.)
6. Is any text doing work an icon or a voice should do?
7. Cover the words with your thumb. Does the screen still teach?
8. Can the child see *where a number came from*, or only that it appeared?

---

## Deliberate decisions — don't "fix" these

- Out-of-range keys have **no** `aria-disabled` and a **stable** name. They are
  not disabled: they answer out loud. A shifting accessible name is worse.
- Bead colours are **not** themed. They're a language where the colour *is* the
  number, not a style choice.
- Rods show the **whole** number, never split into parts — that's their job, and
  the grouped views already cover splitting.
- "Ways to make" lives on **solved sums**, not the counting levels.
- Pressing a second operator **shows the answer** rather than chaining silently.
