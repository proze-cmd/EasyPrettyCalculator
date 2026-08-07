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
- **Tap the display to transform the number** — each tap shows it a new way:
  - a big number in a fun color/font,
  - **shapes** (e.g. 5 circles / stars / hearts),
  - **cute objects** (5 🐶, then 5 🐰, then 5 ⭐ …),
  - **ten-frames** (the classic math tool).
- **Numbers pop in** with bouncy animations, sparkles, and confetti on answers.
- **Gentle sounds** (made with the Web Audio API — no files), with a mute toggle.
- **Stacked equations** once functions appear:

  ```
      5
  +   5
  ───────
  =  10
  ```

  Tap the whole equation to see it as 5 🐰 on top of 5 🐰, a line, then 10 🐰.

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
  state.js          # central state + localStorage persistence
  sound.js          # Web Audio blips (no audio files)
  animate.js        # pop / sparkle / confetti
  represent.js      # renders a number as numeral / dots / objects / ten-frame
  display.js        # arranges a number or a stacked equation + tap-to-transform
  calculator.js     # builds the keypad + all input handling / math
  settings.js       # settings sheet (level slider + sound toggle)
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
