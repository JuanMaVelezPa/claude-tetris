# Tetris

A classic **Tetris** implementation in vanilla JavaScript with HTML5 Canvas and CSS. No external dependencies, no frameworks, no build step: open and play.

![Tech](https://img.shields.io/badge/HTML5-Canvas-orange)
![Tech](https://img.shields.io/badge/CSS3-blueviolet)
![Tech](https://img.shields.io/badge/JavaScript-Vanilla-yellow)

---

## Table of contents

- [Tetris](#tetris)
  - [Table of contents](#table-of-contents)
  - [What this project does](#what-this-project-does)
  - [How to run](#how-to-run)
    - [Option 1: open the file directly](#option-1-open-the-file-directly)
    - [Option 2: local server (recommended)](#option-2-local-server-recommended)
  - [Game modes](#game-modes)
  - [Controls](#controls)
  - [How it works](#how-it-works)
    - [1. `index.html`](#1-indexhtml)
    - [2. `style.css`](#2-stylecss)
    - [3. `game.js`](#3-gamejs)
    - [Game flow](#game-flow)
  - [Tech](#tech)
  - [Project layout](#project-layout)
  - [Customization](#customization)
  - [License](#license)

---

## What this project does

A playable classic Tetris with a few modern extras:

- Board size **10 x 20**.
- The **7 standard pieces** (I, O, T, S, Z, J, L) with distinct colors.
- **Rotation** with basic wall kicks.
- **Soft drop** and **hard drop**.
- **Ghost piece** showing where the current piece will land.
- **Next** preview and **Hold** slot.
- Classic **scoring** (100 / 300 / 500 / 800 x level) plus **combo**, **T-spin**, **B2B Tetris**, and **Perfect Clear**.
- **Levels** every 10 lines that speed up gravity.
- **Classic** (endless standard), **Challenge** (40 lines in 2 minutes), and **Arcade** (power-ups + special pieces).
- **Pause**, **Game Over**, Challenge victory, and return to menu.

---

## How to run

Nothing to install or compile. Two options:

### Option 1: open the file directly

```bash
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

### Option 2: local server (recommended)

Any static server works. Examples:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx serve .

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in the browser.

---

## Game modes

On start, a menu asks you to pick a mode:

| Mode | Goal |
| ---- | ---- |
| **Classic** | Endless with the 7 standard pieces |
| **Challenge** | Clear **40 lines** within **2 minutes** |
| **Arcade** | Endless with power-ups and special pieces |

In Challenge, the panel shows remaining time and goal progress. Pause freezes the timer.

### Arcade extras

**Power-ups** (queued about every 8 lines cleared; activate on lock):

| Power-up | Effect |
| -------- | ------ |
| Bomb | Clears a 3x3 area |
| Lightning | Clears the full row and column |
| Tint | Turns all blocks of one color into wildcards |
| Gravity | Compacts holes downward per column |
| Freeze | Stops gravity for 5 seconds (soft/hard drop still work) |

**Special pieces** (occasional):

- Pentominoes: `+`, `U`, `Y`
- Hollow `3x3` (rare challenge piece)
- `1x1` single after a Tetris (4-line clear)

Classic and Challenge never spawn these.

---

## Controls

| Key | Action |
| --- | ------ |
| `<-` / `->` | Move piece horizontally |
| `Up` or `X` | Rotate clockwise |
| `Down` | Soft drop |
| `Space` | Hard drop |
| `C` or `Shift` | Hold: store / swap piece (once per piece) |
| `P` | Pause / resume |

---

## How it works

Three cooperating files:

### 1. `index.html`

- `<canvas id="board">` at **300 x 600** for the playfield.
- Side panel: `SCORE`, `LINES`, `LEVEL`, `HOLD`, `NEXT`, Challenge HUD, controls.
- Overlay for mode menu, **PAUSED**, **GAME OVER**, and **VICTORY**.

### 2. `style.css`

Dark / retro arcade look, monospace HUD, dimmed hold when locked, combo banner, overlay blur, light/dark theme.

### 3. `game.js`

All game logic:

- Board model: `ROWS x COLS` matrix; `0` empty or color index `1-7`.
- Pieces as matrices; rotation via transpose + reverse (`rotateCW`).
- Collision (`collide`) and wall kicks (`tryRotate`).
- Hold (`holdPiece`): store or swap; locked until the piece settles.
- Game loop (`loop`): `requestAnimationFrame`; Challenge also accumulates time.
- Line clears (`clearLines`): combo / T-spin / B2B / Perfect Clear.
- Level and speed: level every 10 lines; `max(100, 1000 - (level - 1) * 90)` ms.
- Ghost piece (`ghostY`) drawn at `globalAlpha = 0.2`.

### Game flow

```
showMenu()
  - Classic / Challenge / Arcade -> init(mode)
        - createBoard()
        - next = randomPiece()
        - spawn()
        - requestAnimationFrame(loop)

loop(timestamp)
  - accumulate dt (and Challenge timer if needed)
  - if dt >= dropInterval -> drop or lockPiece()
  - draw()
  - requestAnimationFrame(loop)

keydown -> move / rotate / soft-drop / hard-drop / hold / pause
```

If a spawned piece already collides, `endGame()` runs. In Challenge, 40 lines wins (`VICTORY`); running out of time shows `TIME'S UP`.

---

## Tech

- **HTML5** - markup and canvases (board, next, hold).
- **CSS3** - flexbox, color variables, `backdrop-filter`, `box-shadow`.
- **JavaScript (ES6+) vanilla** - no modules or bundler.
- **Canvas 2D API** - rendering.
- **`requestAnimationFrame`** - browser-synced loop.

**No dependencies.** No `package.json`, bundler, or transpiler.

---

## Project layout

```
claude-tetris/
  index.html      # DOM structure and canvases
  style.css       # Styles (dark/light themes)
  game.js         # Full Tetris logic
  README.md
```

---

## Customization

Easy knobs in `game.js`:

| Constant | Meaning | Default |
| -------- | ------- | ------- |
| `COLS` | Board columns | `10` |
| `ROWS` | Board rows | `20` |
| `BLOCK` | Cell size in pixels | `30` |
| `COLORS` | Palette per piece type | 7 colors |
| `LINE_SCORES` | Points for 1-4 lines | `[0,100,300,500,800]` |
| `CHALLENGE_LINES` | Challenge line goal | `40` |
| `CHALLENGE_MS` | Challenge time limit (ms) | `120000` |
| `POWERUP_EVERY_LINES` | Arcade lines between power-ups | `8` |
| `FREEZE_MS` | Arcade freeze duration (ms) | `5000` |
| `dropInterval` | Initial drop speed (ms) | `1000` |

> If you change `COLS`, `ROWS`, or `BLOCK`, also update `width` and `height` on `<canvas id="board">` in `index.html` (`COLS * BLOCK` x `ROWS * BLOCK`).

---

## License

Free for educational and practice use.
