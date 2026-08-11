# 🧮 Kid Calc — EasyPrettyCalculator

A cute, colorful calculator webapp for kids, with math that grows with them —
from *counting to 10* all the way to *equal groups & multiplication* (a 2nd-grade
level of understanding).

It's a **zero-dependency static web app** (plain HTML/CSS/ES modules), so it runs
anywhere a static site can, and it's ready to be wrapped into a native **iOS app
with Capacitor** later.

---

## ✨ What it does

- **Cute buttons, normal calculator layout.** Big, tappable, candy-colored keys.
- **Adjustable complexity by level** via a slider in **Settings** (⚙️).
- **Quantities are always shown in structured groups** — never a long line to
  count one-by-one. See [How numbers are drawn](#-how-numbers-are-drawn).
- **Tap the display to transform it.** *Count to 10* — the level a child spends
  longest on — gives eight ways to see the same number: paired with its quantity,
  split onto coloured plates, the same split ringed instead, the numeral as a
  block of colour, the numeral on a ruled pad to trace, where the number lives in
  the world, a bead bar, and a ten-frame. Later levels give fewer, all
  conditional. A row of dots shows how many there are and jumps to any of them,
  and every view has to earn its tap.
- **Numbers pop in** with bouncy animations, sparkles, and confetti on answers.
- **Gentle sounds** (Web Audio, no files) and **spoken narration** (Web Speech,
  no files) — it counts aloud "one, two, three…" and reads equations out loud.
  Both have toggles.
- **Stacked equations** once functions appear:

  ```
      5
  +   4
  ───────
  =   9
  ```

  Tap it to see 5 🐰 above 4 🐰, a line, then the answer showing **those same
  5 and 4** side by side inside the 9 — so the parts stay visible in the whole.

## 🔢 How numbers are drawn

The visuals follow how children this age actually build number sense — seeing
*how many* without counting (subitizing), anchored on the benchmarks 5 and 10.

| Amount | How it's arranged | Why |
|---|---|---|
| **1–6** | dice / domino pip patterns | already familiar; recognised instantly |
| **7–10** | a row of five + the remainder | builds the "five and some more" benchmark |
| **11–20** | a full ten + the rest | ten becomes a unit |
| **21–100** | ten-frames | place value (100 reads as *ten tens*) |
| **any** | never more than **5 in a row**; each group on its own tinted plate | keeps every amount countable at a glance |

Past **20** we stop drawing separate things altogether and switch to ten-frames.
A hundred tiny puppies is wallpaper, not a quantity — nobody is going to touch
them one at a time, and tens are what ten-frames are for.

Other pedagogy baked in:

- **A different split every time round.** The journey is a loop, and coming
  back to the start shows the number split another way: ten is five and five,
  then six and four, then seven and three, eight and two, nine and one. The
  total never changes; only the pair does.
- **Grouped by colour, then grouped by a ring.** The same split is shown twice
  — once on tinted plates where each part has an identity of its own, and once
  as plain identical things with a rounded container drawn round each handful.
  The second is the one that says the nine didn't change; only the way we chose
  to look at it did.
- **Part–whole colouring.** In `5 + 4`, the 5 is pink and the 4 is blue — and
  the answer is that same pink 5 beside that same blue 4.
- **Number bonds.** The whole-and-two-parts diagram from Singapore Math — and
  the circles hold the actual things, not just numerals. The nine on top is
  drawn as the same pink five and the same blue four sitting in the circles
  below it, so the parts are visible inside the whole rather than asserted.
  A circle draws its dots whenever they can still be read and shows its numeral
  when they can't — decided from how the dots actually land, not from a rule
  about how big the number is.
- **The mystery number.** Press **?** and the sum turns around: instead of
  `5 + 4 = ?` you get **`5 + ? = 9`**, and the child has to find the part. This
  is the one place in the app where the answer comes from them. A wrong guess
  isn't marked wrong — it's told what it actually makes ("5 plus 3 makes 8"),
  and the bond shows the nine as five solid dots and **four empty places**, so
  the answer is sitting there waiting to be counted. That's control of error the
  way the materials do it: the child checks themselves.
- **Meeting the number.** One sun, two eyes, three corners, five fingers, seven
  colours in a rainbow. Waldorf introduces a number by its character before its
  quantity, so on *Count to 10* one tap shows where that number lives in the
  world. No words — just the thing and the numeral.
- **The symbol, twice.** Once as a block of colour big enough to fill the panel
  — a new colour each time round, so the numeral is the thing that stays the
  same while everything about how it looks changes. And once on a **ruled pad**,
  one solid numeral to copy and two hollow ones to trace, the way a handwriting
  page lays it out. Knowing a number means knowing the shape your hand makes,
  which is why Montessori hands children sandpaper numerals.
- **Take-away made visible.** In `9 − 4`, the nine is drawn as 5 kept plus
  4 faded and dashed out.
- **Equal groups.** `3 × 4` is three groups of four, never a flat pile.
- **Counting aloud** with rhythm, and **natural "loose parts"** (acorns, shells,
  leaves) alongside the cartoon animals.
- **Bead bars / number rods.** Each number gets its own Montessori colour — a
  five is always light blue, a nine always dark blue — drawn as a bar whose
  *length* is the number, so nine is visibly longer than four. In an equation
  the two addend bars laid against the answer bar show the sum as length.
- **All the ways to make a number.** Once a sum is solved and the answer is ten
  or less, one more tap shows the whole family of pairs (1+8, 2+7, 3+6 …) as
  stacked two-colour strips; as one part grows the other shrinks, in a
  staircase. It lives with the sums, not in front of the youngest children.
- **Two colour worlds.** A **Bright** candy palette and a **Calm** one in muted
  watercolour tones, for children who find the bright version busy.
- **Touch each thing to count it.** Tapping an object rings it and says its
  number — one-to-one correspondence, the way children actually learn to count.
  Finishing the set is celebrated. Only offered while there are few enough to
  actually count; past that a tap just turns to the next view, and the hint
  underneath says so.
- **Make a ten.** When an addition crosses ten, `8 + 5` shows the 8 borrowing
  just 2 to fill a ten-frame, leaving 3 — so the child sees `10 + 3`.
- **Where a new ten comes from.** In `27 + 18`, the ones make 15; ten of them
  gather into a frame and are handed over as a single gold ten bar, with 5 left
  over — "4 tens and 5 ones = 45". The carry on paper is a tiny "1" children
  copy without understanding; here they watch the trade happen.
- **How many more?** Subtraction also reads as a comparison: two bars from the
  same edge, the shorter one plus a dashed gap, and the gap labelled with the
  answer — the Singapore bar model. `9 − 4` becomes "9 is 5 more than 4".
- **Every level holds its range.** Digits that would take you outside the level
  dim, and pressing one wobbles and says why. You can never take away more than
  you have, so the answer never goes negative.
- **Zero has a picture** — an empty ten-frame, spoken as "none left".
- **Odd and even, by doing it.** On the count-by-2s level, one tap pairs
  everything up. Either it pairs exactly, or one is left over in a dashed ring —
  which is the whole of odd and even, done rather than told.
- **Fair shares.** `12 ÷ 3` draws twelve things and three *empty plates*, then
  deals them out: three plates of four. The keypad only offers numbers the pile
  shares evenly between, so a child bumping along it is meeting factors.
- **More than.** The comparison screen names what the bars already show: `9 > 4`.
- **Pick your own things to count.** Puppies, shells, acorns, rockets — chosen
  materials stay put, or "surprise me" keeps them changing.

See [`TESTING.md`](TESTING.md) for what to check when play-testing, the
invariants that must never break, and the measurement traps that have fooled us.

## 📚 Levels

| #  | Name               | What it teaches                              |
|----|--------------------|----------------------------------------------|
| 1  | Count to 10        | Number buttons 1–10, no functions            |
| 2  | Count by 2s        | Skip counting in pairs — and odd vs even     |
| 3  | Count by 5s        | Skip counting to 50                          |
| 4  | Count by 10s       | Buttons 10, 20, 30 … 100                     |
| 5  | Adding to 10       | Addition, answers up to 10                   |
| 6  | Add & Take Away    | Addition and subtraction to 10               |
| 7  | Numbers to 20      | Add/subtract within 20                       |
| 8  | Big Numbers to 100 | Two-digit add/subtract, place value          |
| 9  | Equal Groups       | Multiplication as equal groups, up to 20     |
| 10 | Fair Shares        | Division as sharing out evenly               |

Levels are **data-driven** — see [`src/config.js`](src/config.js). Add an object
to the `LEVELS` array and the slider, keypad, and display update automatically.

## 🏃 Run it locally

No install required (uses only Node's built-ins):

```bash
npm run dev
# → http://localhost:5173
```

(Any static server works too, e.g. `python3 -m http.server`.)

## 🧩 How it's organized

```
index.html          # app shell
styles.css          # all styling, animations, and the bright/calm themes
src/
  config.js         # LEVELS, emoji themes, palettes  ← tweak content here
  arrange.js        # the grouping engine: how a number splits into groups (pure logic)
  materials.js      # choosing what to count with
  state.js          # central state + localStorage persistence
  sound.js          # Web Audio blips (no audio files)
  speech.js         # spoken narration via the Web Speech API (no audio files)
  animate.js        # pop / sparkle / confetti
  represent.js      # draws a number as groups / rods / ten-frame / numeral / all-the-ways
  bond.js           # the part-part-whole number bond diagram
  display.js        # the tap-through view journey + stacked equations
  calculator.js     # builds the keypad + all input handling / math
  settings.js       # settings sheet (level slider, sound/narration, colour theme)
  main.js           # wires it all together
scripts/
  serve.mjs         # zero-dep dev server
  build-www.mjs     # copies the app into www/ for Capacitor
```

## 🚀 Deploy (Vercel)

This is a static site at the repo root, so on Vercel it needs **no build step**:

- **New Project → import this repo**
- Framework preset: **Other**
- Build command: *(none)* · Output directory: *(root)*

Use a **new, separate Vercel project** so it never overwrites other apps.

## 📱 Later: iOS via Capacitor

The pieces are already in place (`capacitor.config.json`, `www/` build script):

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npm run build            # copies the app into www/
npx cap add ios
npx cap sync
npx cap open ios         # opens Xcode
```

`webDir` is set to `www`, which `npm run build` regenerates from the root files.

---

Made with 💗 for little mathematicians.
