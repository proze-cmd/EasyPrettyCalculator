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
   it didn't, delete it. *Count to 10* is the exception and carries eight,
   because it is the level a child stays on longest and every one of the eight
   shows something the others can't. Other counting levels: ~4. Sums: 3–6, all
   conditional.
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
| I3 | Nothing under ~15px is offered for counting | measure `offsetWidth`; if any is under, the hint must read "tap to see it another way" |
| I4 | No level can exceed its `maxValue` | try to type past it on every level |
| I5 | Subtraction never negative | try `3 − 9` |
| I6 | No horizontal scroll, ever | `display.scrollWidth ≤ clientWidth` |
| I7 | Keypad never clipped | `keypad.bottom ≤ window.innerHeight` |
| I8 | No console errors | listen for `pageerror` throughout |
| I9 | Counting only in quantity views | explanation views must not mark `.counted` |
| I10 | Counting is per row in an equation | 5 + 4 = 9 must say "5", then "4", then "9" — never 18 |
| I11 | **The answer is visible without scrolling** | `display.scrollHeight ≤ clientHeight` on every solved sum |

**I2 is per quantity, not per screen.** `8 + 5 = 13` draws 26 things, and that is
fine — each row is its own countable amount and counting is scoped to a row
(I10). Measure `.obj` inside each `.rep`, not inside `#display`.

**I3 is about things you touch.** Bond dots and regrouping cells are diagram
parts, not touch targets — `COUNTABLE_VIEWS` is the list of views where touching
counts. Judge a diagram on whether it is *structured and legible* (≥10px and in
rows), not against the 15px finger rule.

A crowded equation is *allowed* to draw below 15px — that is how the answer
stays on screen. What it may not do is still invite taps. `countingOffered()`
decides for the whole screen at once, from `offsetWidth`, and the hint, the tap
handler and the fumble guard all read it. Check they agree: **the hint is a
promise, and a tap must keep it.**

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
- **`.equation__row` is `display: contents`** — it has no box, so
  `getBoundingClientRect()` on it returns all zeros. An "answer is cut off"
  verdict built on that is meaningless. Measure the row's *children*, or use
  `display.scrollHeight`.
- **Guessed selectors fail open.** `.key--muted` (not a real class) reported
  "no keys dim" and `/🐚/` against a list of *word* labels reported "no natural
  materials" — both were wrong, and both looked like real regressions. Grep the
  source for the class name before asserting on it.
- **A percentage `gap` in a flex *column* resolves against height**, which is
  indefinite unless something gives the container one. It silently becomes 0.
- **A percentage `width` inside a sized grid cell is a fraction of a fraction.**
  Bond pips came out 5px this way.
- **Centring a line of text does not centre what you can see.** The em box
  reserves room for descenders and a digit uses none of it, so a numeral rides
  off-centre inside its own background — by 14px on a phone, more on a tablet.
  `centreGlyph()` measures the ink with `measureText().actualBoundingBox*` and
  nudges it. Two things to know:
  - **The ink and the background must be different elements.** Shifting an
    element that carries both moves them together and changes nothing.
  - **A rect already includes the transform.** Adding the shift again when
    checking double-counts it, and reports a miscentring that isn't there —
    which is exactly how this fix first looked like it had failed.
- **A view that passes every check can still be the wrong picture.** The track
  passed everything — right steps, right colours, fits the panel — and was a
  copy of the keypad six inches below it. Nothing measurable was wrong with it.
  **Screenshot the whole page, not the panel**: the panel crop hid the very
  thing that made it wrong.
- **`vw`/`vh` are a bad guess at how big something in a panel is.** The track's
  numerals were sized from the viewport and came out small in landscape, where
  the panel is wide but the viewport is short. Size from the element's own
  container (`container-type: inline-size` + `cqw`) and it holds everywhere.
- **An SVG's box is not its drawing.** `.pad__sheet` used to be capped in height
  only, so its box stopped matching its viewBox and the drawing was letterboxed
  and centred inside it. Mapping a pointer to SVG coordinates by proportion of
  `getBoundingClientRect()` was then wrong by up to **19 grid units** on a
  landscape phone — inside the 30-unit "is the finger on the line" tolerance, so
  it still worked, which is why it went unnoticed: the ink followed a finger
  that was visibly beside the line. `getScreenCTM().inverse()` knows the real
  mapping. **Measure the error, don't infer it from the letterbox slack** — the
  slack was 84px and the actual error was a fifth of that.
- **A test that drives the pad must map its points the same way.** Driving it
  through `.pad`'s box (which has padding) makes strokes silently fail to fill
  and looks exactly like an app bug — that cost an hour.

---

## The walk-through

Do this on **390×844** first, then repeat the shaded rows on 320×568,
740×380 (landscape) and 820×1180 (tablet), in **both themes**.

### Level 1 — Count to 10
This level is the one a child spends longest on, so it carries the most ways of
seeing a number. **8 views**, in this order:

| # | View | What only it does |
|---|---|---|
| 1 | paired | the numeral and the quantity together |
| 2 | split on plates | the parts have identities: 9 is 5 and 4 |
| 3 | circled | *same* things, not moved — rings drawn round subsets of one arrangement |
| 4 | block numeral | the shape of the symbol, a new colour each lap |
| 5 | writing pad | stroke order, then the child traces it themselves |
| 6 | emblem | where the number lives in the world |
| 7 | rods | quantity as length, in its bead-stair colour |
| 8 | ten-frame | the gap to ten |

- **Numerals sit in the middle of their chip.** Check the paired chip, the block
  numeral and an equation's answer: the gap above the visible digit and the gap
  below it must match.

- **Go round again** and the split changes: ten as 5+5, then 6+4, 7+3, 8+2,
  9+1. The numeral's colour changes too. Only the objects stay put, and only if
  the child pinned them.
- **Circling is one arrangement, not two piles.** Press 4 → four things in a
  single row, then a ring drawn *dash by dash* round the first group, then
  another round the rest. If the things are sorted into separate clusters it has
  become the plates view again and the point is lost. Every thing must end up
  inside exactly one ring, and the rings must not touch.
  - Measure ring boxes with `offsetLeft`/`offsetTop`: the things are still
    popping in, and a rect read through a live transform puts the ring where the
    group briefly *appears*.

### The writing pad — check all of this
- **The paper is the shape of the number.** A three sits on a tall sheet, a
  hundred on a wide one, and the guide rules reach both edges. If the rules stop
  short of the paper, `--pad-ar` isn't reaching the CSS and the drawing is
  letterboxed inside a box that doesn't match it.
- **Trace it on a landscape phone**, not just upright, and watch *where the ink
  appears relative to the finger*. That is where the sheet is furthest out of
  proportion with its box, and where the finger and the ink drifted apart.
- **Guides**: three rules, top and bottom solid, the middle one dashed.
- **Stroke counts** (from a handwriting worksheet, not a typeface):

  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 | 10 |
  |---|---|---|---|---|---|---|---|---|---|---|
  | 1 | **2** | **1** | **2** | **2** | 1 | 1 | 1 | **1** | 1 | 2 |

  The bolded ones have been got wrong before. **4 has an open top** — the
  diagonal and the stem must not meet. **9 is one movement**: start halfway
  between the headline and the midline, circle all the way back to the left,
  then pull straight down to the baseline.
- **The nine's stem must be dead straight and joined to the bowl.** The circle
  has to close at its *own rightmost point*, because that is the line the stem
  runs down. Close it anywhere else and the pen has to reach across to reach the
  stem — that reach gets drawn as a diagonal through the counter, and it is what
  makes the stem look like it is leaning. It has been wrong this way twice.
- Each start has a numbered pink dot. The ink has round caps.
- **Check direction, not just shape.** `getPointAtLength(0)` and at 12% tells
  you where a stroke starts and which way it sets off; a nine that starts on the
  right and goes *up* draws correctly and is still wrong.
- It writes itself with the pen visible, pauses on the finished numeral, then
  runs **backwards along the same path** to unwrite it — not a fade, which read
  as a glitch — and then shows the draggable knob (`pad--tracing`).
- **Drag the knob**: the ink follows the finger and never runs ahead of it. Go
  off the line and it waits. Finish stroke 1 and the knob jumps to stroke 2's
  start. Finish both → green, confetti, "You wrote 3!".
- **Two traps this feature has already fallen into:**
  1. Swallowing every tap on the pad **trapped the child on the view** with no
     way out. It may only swallow while actually being traced.
  2. Not swallowing the tap that *completes* the trace flipped the page
     instantly, so the child never saw what they wrote. Hence `pad--hold`.
- Sanity-check the paths themselves by rendering all eleven on one sheet with a
  start dot and an end arrow on each. A 9 whose tail sweeps left reads as a `g`;
  a 9 whose bowl doesn't close reads as a `q`.
  - When building that sheet: `insertAdjacentHTML` on an SVG node makes **HTML**
    elements, which never render. Use `createElementNS`.
- **Rods**: one bar → centred with its numeral **above**. Several bars (levels
  2–4) → left edges flush with a label beside each, because that's what makes a
  short bar visibly shorter.
- **Emblem**: press 5 → a hand and a `5`, no words. 1 → a sun. 9 → three
  triangles ("three threes"). Nothing on the skip-counting levels.
- Touch each puppy: rings green, shrinks, counts aloud, celebrates at 9 (I9).
- Miss an object inside a group → picture must **not** change, count survives.
- Press **1** → no "ways to make 1" (there are none).
- Rods: one 9-long dark-blue bar with a break after the fifth. Not 5+4.

### Levels 2–4 — the skip-counting levels

These share the block numeral, the writing pad and the **track** with Level 1.
Anything checked under "The writing pad" applies here too — with more digits.

- **The track.** Stepping stones, five to a row. Stones before the pressed
  number are solid with a solid path behind them; the pressed one is filled and
  pulsing; the rest are **dashed outlines on a dotted path**. Stones arrive one
  after another in counting order, not all at once.
- The track must **not** look like the keypad underneath it. That was the first
  version — a five-across grid of rounded chips, which a child reads as a
  second, broken keypad. If it ever drifts back towards squares in a grid with
  no path between them, it has regressed.
- No path stub hangs off the right-hand end of a row, or off the last stone.
- Narration says the steps aloud, up to the one pressed.
- **Multi-digit pad.** Press **35** → three strokes: the 3 (one), then the 5
  (two). **100** → three strokes, one per digit. Both digits sit on the same
  ruled sheet, written left to right. The numbered start dots for the 5 sit on
  top of each other — both its strokes start at the same corner — which matches
  the worksheet and is not a bug.

### Level 2 — Count by 2s
- Press **14** → pairs view offered (it is not offered on Count to 10).
- 14 → **7 pairs, none left, "even"**. 7 → 3 pairs + one in a dashed ring, "odd".

### Level 3 — Count by 5s
- Press **35** → seven ten-frames' worth; no loose things to touch.
- Rods: three gold ten-bars and one light-blue five — not seven fives.

### Level 4 — Count by 10s
- Press **100** → numeral + **ten ten-frames**, no loose objects (I2).
- **Five views** (paired, block, pad, track, rods). It used to be two. Writing a
  hundred and placing it in the count don't depend on drawing a hundred things,
  so they're offered here even though the quantity views aren't.
- Touching a cell must **turn the page**, not count (I2/I9). Hint must say
  "Tap to see it another way", not "Touch each one".

### Level 5 — Adding to 10

This is the level that **asks** (`askAnswer` in `config.js`). Everything that
depends on a finished sum — the bond, make-a-ten, "ways to make", the green
answer — only arrives once the child has answered correctly. A test that builds
a sum here and expects an answer without typing one is testing the old app.

- **The child answers.** `5` `+` `5` `=` → the answer row is a **waiting slot**
  that blinks, not the number 10. The hint reads "Type your answer".
  - Type `8` `=` → wobble, "**8 is not enough**", the slot empties. 8 must not
    become the answer, and the app must never say the answer.
  - Type `12` on this level → refused, it is outside the level (I4).
  - Two wrong answers in a row → "Tap the picture and count them all."
  - Type `10` `=` → "Yes! 5 plus 5 equals 10", confetti, and the answer turns
    green. Until then it is in the ordinary numeral colour: an answer is not an
    answer until it has been checked.
  - `⌫` on an empty slot backs out to editing the sum. Pressing `+` mid-answer
    is refused ("Finish this one first") — changing the sum under an open
    question leaves the child answering something that is no longer being asked.
  - The screen-reader label must be the *question* ("5 plus 5 equals what?"),
    never the finished sum.
- **The mystery.** `5` `+` `?` → **the app supplies the total**: the screen reads
  `5 + ? = 10` straight away, with the missing part as a dashed `?` box and
  nothing else blank. One unknown, never two.
  - It used to ask for the total as well — "5 and what makes how many?" — which
    is two unknowns in one breath. If narration ever says "how many" again, or a
    second empty slot appears, it has regressed.
  - The total is picked fresh each press, is always reachable, and always leaves
    at least one to find. Ten and the tens come up more often than the rest.
  - Guess `3` `=` → wobble, "**5 plus 3 makes 8. We want 10.**" It must never
    just say "wrong", and 8 must not become the answer.
  - Two wrong guesses in a row → it points at the picture instead of repeating.
  - Tap through → the bond shows the total as **5 solid dots and the rest empty
    rings**, and a dashed circle holding `?`. The answer is countable on screen.
    That is deliberate: the material is what tells them, not us.
  - Guess the part `=` → "Yes!", confetti, the sum completes.
  - Only three views while a question is open (question, objects, bond).
    Make-a-ten and the rest assume a finished sum and several would answer it.
- **The number line.** `5 + 4 = 9` → a road 0–10, pink from 0 to 5, four blue
  hops **over** the road labelled `+4`, a green 9 where they land.
  - The hops must arc **above** the line. Below it means the arc sweep flag is
    backwards, which is what the first version did.
  - `8 + 5 = 13` → the road stops at **15**, not 20, and only 0, 5, 8, 10, 13
    and 15 are named. The road is drawn the same width whatever its span — if a
    longer sum makes the whole picture shrink, the step is being scaled instead
    of the gap.
  - `9 − 4` → four hops **backwards**, still over the road, labelled `−4`.
  - Mid-mystery → the hops are hollow and dashed with a `?` over them, and there
    are exactly as many as the answer. That is the answer, countable, which is
    the point.
  - Offered while an answer is being worked out, too. Counting on is how a child
    of this age finds 5 + 4; withholding the tool and then asking for the answer
    would be a trick.
- **The addition strip board.** On the *second* lap — it and the bond say the
  same thing in two media, so they take turns, the way the counting levels
  alternate their two ways of splitting. Six views a lap, not seven.
  `5 + 4` → a light-blue 5 and a yellow 4 nose to tail, a dark-blue 9 underneath. **The two rows must end at the same pixel** —
  that is the entire lesson. Anything that adds width to one row and not the
  other (a gap, a border, a label beside the strip instead of above it) breaks
  it silently. Check `endGap`, don't eyeball it.
  - `8 + 5` → the whole row is a **gold ten-bar and a three**, not thirteen of
    one colour.
  - `9 − 4` → the 9 on top; underneath, the 5 that stays beside the 4 that went,
    drawn as empty rings of the same size, ends still aligned.
  - Bead size comes from `cqw`, not a percentage. A percentage resolves against
    the strip, which is sized by its beads — the beads collapse to nothing.
- `10` `+` `?` on a level that stops at ten is refused with a reason — there is
  no missing part to find.
- No `?` key on **Fair Shares** (levels 9 and 10 have × and ÷).
- Objects view: pink 5 above blue 4; the answer is that **same** pink 5 beside
  that **same** blue 4 (principle 6).
- Bond: 5 as a dice five, 4 as a dice four, and the 9 on top drawn as **that
  pink five above that blue four**. No row over five. Past ten the circle shows
  a numeral, and the bond is not offered at all once both parts are over ten.
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
- `4 × 5 =` → answer is **4 groups of 5**, each on its own coloured plate, all
  four **on one line and fully visible** (I11). This level's keypad is a row
  taller than most, so its display is the shortest in the app (~324px on a
  390×844 phone) — it is where an equation runs out of room first.
- The answer's plates must never be drawn **bigger** than the operands' above
  them; if they are, the density ladder has overridden `.rep--small` upward.
- `9 × 9` must be **impossible** — level caps at 20 (I4).

### Level 10 — Fair Shares
- `12 ÷` → only **1, 2, 3, 4, 6** stay lit. Pressing 5 wobbles and says it
  doesn't share evenly. Leftovers are a later idea; the dimming is a first
  look at factors.
- `12 ÷ 3 =` → the divisor draws as **three empty plates**, not three things,
  and the answer is three plates of four.

### Materials
- **16** things to count with, and **Surprise me** — which is the **default**,
  so an unattended app keeps changing the objects by itself.
- Pick shells → shells stay through a full lap and a reload. Surprise resumes
  the rotation.

### The keypad
- **Every label sits in the middle of the key it is on.** Not the middle of its
  box: `box-shadow: 0 6px 0` is the *side* of a 3D key, so what a child sees is
  6px taller than the element and its middle is 3px lower. Both halves matter —
  the lip (CSS, `--btn-lip`) and the ink inside the line box (`centreGlyph`, for
  glyphs like `?` whose bowl is heavy and whose dot is small).
- Worst offset should be **~1px** on a 52px key. It was 5.6px.
- Measuring this: put the baseline probe *inside* the existing `.btn__label`.
  Replacing the label throws away the transform being measured, and reports a
  working fix as having done nothing.

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
| Mystery bond | 0 | solid dots, empty rings, and a `?` |
| Meeting a number | 0 | the sun, the hand, the rainbow |
| Block numeral | 0 | the shape of the symbol |
| Ruled pad | 0 | one to copy, two to trace |
| Split by ring | 0 | the same things, in rounded containers |

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
- **A bond falls back to a numeral by measurement, not by size of number.**
  Thirteen lands as four tidy rows and draws; eighteen splits into six rows of
  three, collapses to 7px, and shows `18` instead. Don't replace that with a
  count-based cap — the count doesn't predict the layout.
- **Rods and bar models are lines on purpose.** I1 is about quantities you count
  one by one. A Montessori rod, a golden ten-bar and a Singapore comparison bar
  all mean *length*, and breaking them into groups of five would destroy the one
  thing they exist to show. They keep the break after the fifth bead instead.
- "Ways to make" lives on **solved sums**, not the counting levels.
- Pressing a second operator **shows the answer** rather than chaining silently.
- **The track's stones are circles joined by a path, not chips in a grid.** The
  keypad is chips in a grid; a second one of those in the panel above reads as
  a broken keypad, not as a count. Any redesign has to stay obviously unlike it.
- **The block numeral and the writing pad are on every counting level**, even
  where the quantity can't be drawn. Writing a hundred, and knowing where it
  falls in the count, don't depend on drawing a hundred things.

---

## Known, not yet fixed

- **320×568 (iPhone SE), Level 8, `27 + 18`.** The ten-frame views of the
  answer overflow the display by ~17–40px — the panel is only 200px tall there,
  because that level's keypad is the tallest in the app. Content is centred, so
  it spills equally top and bottom rather than cutting off the end. Predates
  the level 2–4 work; reproduced identically on the previous commit.
