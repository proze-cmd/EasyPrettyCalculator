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
- **Tap the display to transform it** — each tap shows the same amount a new way:
  the numeral paired with its quantity, different ways to split it apart
  (9 as 5+4, as 3+3+3, as 6+3), colored shapes, and ten-frames.
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
| **21–100** | groups of ten | place value (100 reads as *ten tens*) |
| **any** | never more than **5 in a row**; each group on its own tinted plate | keeps every amount countable at a glance |

Other pedagogy baked in:

- **Multiple decompositions.** Tapping cycles a number through different splits
  (9 → 5+4 → 3+3+3 → 6+3) so the same total can be seen more than one way.
- **Part–whole colouring.** In `5 + 4`, the 5 is pink and the 4 is blue — and
  the answer is that same pink 5 beside that same blue 4.
- **Number bonds.** The whole-and-two-parts diagram from Singapore Math.
- **Take-away made visible.** In `9 − 4`, the nine is drawn as 5 kept plus
  4 faded and dashed out.
- **Equal groups.** `3 × 4` is three groups of four, never a flat pile.
- **Counting aloud** with rhythm, and **natural "loose parts"** (acorns, shells,
  leaves) alongside the cartoon animals.

## 📚 Levels

| # | Name               | What it teaches                              |
|---|--------------------|----------------------------------------------|
| 1 | Count to 10        | Number buttons 1–10, no functions            |
| 2 | Count by 10s       | Buttons 10, 20, 30 … 100                     |
| 3 | Adding to 10       | Addition, answers up to 10                   |
| 4 | Add & Take Away    | Addition and subtraction to 10               |
| 5 | Numbers to 20      | Add/subtract within 20                       |
| 6 | Big Numbers to 100 | Two-digit add/subtract, place value          |
| 7 | Equal Groups       | Multiplication as repeated adding            |

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
styles.css          # all styling + animations (single bright theme)
src/
  config.js         # LEVELS, emoji themes, palettes  ← tweak content here
  arrange.js        # the grouping engine: how a number splits into groups (pure logic)
  state.js          # central state + localStorage persistence
  sound.js          # Web Audio blips (no audio files)
  speech.js         # spoken narration via the Web Speech API (no audio files)
  animate.js        # pop / sparkle / confetti
  represent.js      # draws a number as structured groups / ten-frame / numeral
  bond.js           # the part-part-whole number bond diagram
  display.js        # the tap-through view journey + stacked equations
  calculator.js     # builds the keypad + all input handling / math
  settings.js       # settings sheet (level slider + sound/narration toggles)
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
