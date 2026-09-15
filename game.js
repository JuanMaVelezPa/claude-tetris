'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const CHALLENGE_LINES = 40;
const CHALLENGE_MS = 120000;
const FX_MS = 700;
const T_SPIN_BONUS = [0, 400, 800, 1200, 1600];
const PERFECT_CLEAR_BONUS = 2000;
const B2B_MULT = 1.5;
const POWERUP_EVERY_LINES = 8;
const FREEZE_MS = 5000;
const WILD = 18;

const TYPE_PLUS = 8;
const TYPE_U = 9;
const TYPE_Y = 10;
const TYPE_SINGLE = 11;
const TYPE_HOLLOW = 12;
const TYPE_BOMB = 13;
const TYPE_LIGHTNING = 14;
const TYPE_TINT = 15;
const TYPE_GRAVITY = 16;
const TYPE_FREEZE = 17;

const SKIN_KEY = 'tetris-skin';
const SKIN_IDS = ['retro', 'neon', 'pastel', 'pixel'];

const COLORS_RETRO = [
  null,
  '#4dd0e1', // I
  '#ffd54f', // O
  '#ba68c8', // T
  '#81c784', // S
  '#e57373', // Z
  '#7986cb', // J
  '#ffb74d', // L
  '#f48fb1', // +
  '#80cbc4', // U
  '#ce93d8', // Y
  '#fff59d', // single
  '#b0bec5', // hollow
  '#ff5252', // bomb
  '#ffee58', // lightning
  '#69f0ae', // tint
  '#82b1ff', // gravity
  '#b388ff', // freeze
  '#fafafa', // wild
];

const COLORS_NEON = [
  null,
  '#00f0ff',
  '#ffe600',
  '#ff00e5',
  '#39ff14',
  '#ff2a6d',
  '#4d7cff',
  '#ff9f1c',
  '#ff6ec7',
  '#00ffc8',
  '#d500f9',
  '#ffff66',
  '#90a4ae',
  '#ff1744',
  '#ffea00',
  '#00e676',
  '#2979ff',
  '#b388ff',
  '#ffffff',
];

const COLORS_PASTEL = [
  null,
  '#9fd9e8',
  '#ffe6a8',
  '#d7b4e0',
  '#b8dfb8',
  '#f0b4b4',
  '#b4bde0',
  '#f0d0a0',
  '#f0c0d0',
  '#b0ddd4',
  '#d8c0e8',
  '#f5ecc0',
  '#c8d0d4',
  '#f0a0a0',
  '#f0e8a0',
  '#a8e8c8',
  '#b0c8f0',
  '#d0b8f0',
  '#f5f5f5',
];

const COLORS_PIXEL = [
  null,
  '#18c8d0',
  '#e0b818',
  '#a848c0',
  '#48a848',
  '#d04040',
  '#4868b8',
  '#e07828',
  '#d07098',
  '#38a898',
  '#9860b0',
  '#d0c040',
  '#788890',
  '#c82828',
  '#d0c020',
  '#28a868',
  '#4070d0',
  '#7848c0',
  '#e8e8e8',
];

let COLORS = COLORS_RETRO;
let skinId = 'retro';
let gridColor = '#22222e';
let drawBlockFn = drawBlockRetro;

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[0,8,0],[8,8,8],[0,8,0]],                  // +
  [[9,0,9],[9,9,9]],                          // U
  [[0,10,0],[0,10,0],[10,10,0],[0,10,0]],     // Y
  [[11]],                                     // single
  [[12,12,12],[12,0,12],[12,12,12]],          // hollow 3x3
  [[13]],                                     // bomb
  [[14]],                                     // lightning
  [[15]],                                     // tint
  [[16]],                                     // gravity
  [[17]],                                     // freeze
];

const POWER_TYPES = [TYPE_BOMB, TYPE_LIGHTNING, TYPE_TINT, TYPE_GRAVITY, TYPE_FREEZE];
const PENTOMINO_TYPES = [TYPE_PLUS, TYPE_U, TYPE_Y];
const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold-canvas');
const holdCtx = holdCanvas.getContext('2d');
const holdSection = document.getElementById('hold-section');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const timeLeftEl = document.getElementById('time-left');
const challengeProgressEl = document.getElementById('challenge-progress');
const challengeHud = document.getElementById('challenge-hud');
const fxBanner = document.getElementById('fx-banner');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const overlayActions = document.getElementById('overlay-actions');
const overlayEndActions = document.getElementById('overlay-end-actions');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const modeClassicBtn = document.getElementById('mode-classic-btn');
const modeChallengeBtn = document.getElementById('mode-challenge-btn');
const modeArcadeBtn = document.getElementById('mode-arcade-btn');
const themeToggle = document.getElementById('theme-toggle');
const skinSelect = document.getElementById('skin-select');

let board, current, next, hold, holdLocked;
let score, lines, level, paused, gameOver, won;
let lastTime, dropAccum, dropInterval, animId;
let mode, combo, lastAction, lastWasTetris, challengeElapsed;
let linesTowardPower, pendingPower, pendingSingle, freezeUntil;
let fxTimer = null;
let inMenu = true;

function isArcade() {
  return mode === 'arcade';
}

function isPowerType(type) {
  return POWER_TYPES.includes(type);
}

function applyTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', nextTheme);
  const isLight = nextTheme === 'light';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', ariaLabelTheme(isLight));
}

function ariaLabelTheme(isLight) {
  return isLight ? 'Switch to dark mode' : 'Switch to light mode';
}

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  applyTheme(currentTheme === 'light' ? 'dark' : 'light');
});

applyTheme('dark');

function shadeColor(hex, amount) {
  if (!hex || hex[0] !== '#' || (hex.length !== 7 && hex.length !== 4)) return hex;
  let r, g, b;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  const clamp = v => Math.max(0, Math.min(255, v + amount));
  const toHex = v => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function drawBlockRetro(context, x, y, colorIndex, size, alpha) {
  const color = COLORS[colorIndex] || '#ffffff';
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

function drawBlockNeon(context, x, y, colorIndex, size, alpha) {
  const color = COLORS[colorIndex] || '#ffffff';
  const px = x * size + 1;
  const py = y * size + 1;
  const s = size - 2;
  const a = alpha ?? 1;
  context.save();
  context.globalAlpha = a;
  // Soft outer bloom so pieces read on near-black boards
  context.shadowBlur = Math.max(14, size * 0.7);
  context.shadowColor = color;
  context.fillStyle = color;
  context.fillRect(px, py, s, s);
  // Saturated mid layer
  context.shadowBlur = Math.max(6, size * 0.25);
  context.fillStyle = shadeColor(color, -25);
  context.fillRect(px + 1, py + 1, Math.max(1, s - 2), Math.max(1, s - 2));
  context.shadowBlur = 0;
  // Bright core
  context.fillStyle = 'rgba(255,255,255,0.55)';
  context.fillRect(px + 3, py + 3, Math.max(1, s - 6), Math.max(1, Math.floor(s * 0.28)));
  context.fillStyle = 'rgba(255,255,255,0.2)';
  context.fillRect(px + 3, py + 3, Math.max(1, Math.floor(s * 0.28)), Math.max(1, s - 6));
  context.restore();
}

function drawBlockPastel(context, x, y, colorIndex, size, alpha) {
  const color = COLORS[colorIndex] || '#ffffff';
  const px = x * size + 1;
  const py = y * size + 1;
  const s = size - 2;
  const radius = Math.max(3, Math.floor(size * 0.2));
  context.save();
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  if (typeof context.roundRect === 'function') {
    context.beginPath();
    context.roundRect(px, py, s, s, radius);
    context.fill();
  } else {
    context.fillRect(px, py, s, s);
  }
  context.fillStyle = 'rgba(255,255,255,0.28)';
  if (typeof context.roundRect === 'function') {
    context.beginPath();
    context.roundRect(px + 1, py + 1, s - 2, Math.max(3, size * 0.22), radius - 1);
    context.fill();
  } else {
    context.fillRect(px + 1, py + 1, s - 2, 5);
  }
  context.restore();
}

function drawBlockPixel(context, x, y, colorIndex, size, alpha) {
  const color = COLORS[colorIndex] || '#ffffff';
  const px = x * size + 1;
  const py = y * size + 1;
  const s = size - 2;
  const light = shadeColor(color, 40);
  const dark = shadeColor(color, -45);
  const cell = Math.max(2, Math.floor(size / 6));
  context.save();
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(px, py, s, s);
  for (let iy = 0; iy < s; iy += cell) {
    for (let ix = 0; ix < s; ix += cell) {
      const odd = ((ix / cell) + (iy / cell)) % 2 === 1;
      context.fillStyle = odd ? dark : light;
      context.fillRect(px + ix, py + iy, Math.min(cell, s - ix), Math.min(cell, s - iy));
    }
  }
  context.strokeStyle = dark;
  context.lineWidth = 1;
  context.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
  context.restore();
}

const SKINS = {
  retro: { colors: COLORS_RETRO, grid: '#22222e', draw: drawBlockRetro },
  neon: { colors: COLORS_NEON, grid: '#1a3a4a', draw: drawBlockNeon },
  pastel: { colors: COLORS_PASTEL, grid: '#8a8098', draw: drawBlockPastel },
  pixel: { colors: COLORS_PIXEL, grid: '#2a2a30', draw: drawBlockPixel },
};

function applySkin(id, persist) {
  const nextId = SKIN_IDS.includes(id) ? id : 'retro';
  const skin = SKINS[nextId];
  skinId = nextId;
  COLORS = skin.colors;
  gridColor = skin.grid;
  drawBlockFn = skin.draw;
  document.documentElement.setAttribute('data-skin', nextId);
  if (skinSelect) skinSelect.value = nextId;
  if (persist !== false) {
    try { localStorage.setItem(SKIN_KEY, nextId); } catch (_) { /* ignore */ }
  }
  if (board) draw();
  drawNext();
  drawHold();
}

function loadSavedSkin() {
  let saved = 'retro';
  try { saved = localStorage.getItem(SKIN_KEY) || 'retro'; } catch (_) { /* ignore */ }
  applySkin(saved, false);
}

if (skinSelect) {
  skinSelect.addEventListener('change', () => applySkin(skinSelect.value));
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function makePiece(type) {
  const shape = PIECES[type].map(row => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function randomStandardPiece() {
  return makePiece(Math.floor(Math.random() * 7) + 1);
}

function randomPowerPiece() {
  return makePiece(POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)]);
}

function randomPiece() {
  if (!isArcade()) return randomStandardPiece();

  if (pendingSingle) {
    pendingSingle = false;
    return makePiece(TYPE_SINGLE);
  }
  if (pendingPower) {
    pendingPower = false;
    return randomPowerPiece();
  }

  const roll = Math.random();
  if (roll < 0.05) return makePiece(TYPE_HOLLOW);
  if (roll < 0.17) {
    return makePiece(PENTOMINO_TYPES[Math.floor(Math.random() * PENTOMINO_TYPES.length)]);
  }
  return randomStandardPiece();
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      lastAction = 'rotate';
      return;
    }
  }
}

function tCornersFilled() {
  const corners = [
    [current.x, current.y],
    [current.x + 2, current.y],
    [current.x, current.y + 2],
    [current.x + 2, current.y + 2],
  ];
  let filled = 0;
  for (const [cx, cy] of corners) {
    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS || board[cy][cx]) filled++;
  }
  return filled;
}

function isTSpin() {
  return current.type === 3 && lastAction === 'rotate' && tCornersFilled() >= 3;
}

function boardEmpty() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) return false;
  return true;
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function showFx(text) {
  if (!text) return;
  fxBanner.textContent = text;
  fxBanner.classList.remove('hidden');
  if (fxTimer) clearTimeout(fxTimer);
  fxTimer = setTimeout(() => {
    fxBanner.classList.add('hidden');
    fxTimer = null;
  }, FX_MS);
}

function clearCell(r, c) {
  if (r >= 0 && r < ROWS && c >= 0 && c < COLS) board[r][c] = 0;
}

function applyBomb() {
  const cx = current.x;
  const cy = current.y;
  for (let r = cy - 1; r <= cy + 1; r++)
    for (let c = cx - 1; c <= cx + 1; c++)
      clearCell(r, c);
  showFx('BOMB');
}

function applyLightning() {
  const cx = current.x;
  const cy = current.y;
  for (let c = 0; c < COLS; c++) clearCell(cy, c);
  for (let r = 0; r < ROWS; r++) clearCell(r, cx);
  showFx('LIGHTNING');
}

function applyTint() {
  const counts = Object.create(null);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v && v !== WILD && !isPowerType(v)) counts[v] = (counts[v] || 0) + 1;
    }
  }
  const keys = Object.keys(counts).map(Number);
  if (!keys.length) {
    showFx('TINT');
    return;
  }
  const target = keys[Math.floor(Math.random() * keys.length)];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c] === target) board[r][c] = WILD;
  showFx('TINT');
}

function applyGravityEffect() {
  for (let c = 0; c < COLS; c++) {
    const stack = [];
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][c]) stack.push(board[r][c]);
    }
    for (let r = ROWS - 1; r >= 0; r--) {
      board[r][c] = stack.length ? stack.shift() : 0;
    }
  }
  showFx('GRAVITY');
}

function applyFreeze() {
  freezeUntil = performance.now() + FREEZE_MS;
  showFx('FREEZE');
}

function applyPowerUp(type) {
  switch (type) {
    case TYPE_BOMB: applyBomb(); break;
    case TYPE_LIGHTNING: applyLightning(); break;
    case TYPE_TINT: applyTint(); break;
    case TYPE_GRAVITY: applyGravityEffect(); break;
    case TYPE_FREEZE: applyFreeze(); break;
  }
}

function maybeQueueArcadeRewards(cleared, isTetris) {
  if (!isArcade() || !cleared) return;
  linesTowardPower += cleared;
  if (linesTowardPower >= POWERUP_EVERY_LINES) {
    linesTowardPower = 0;
    pendingPower = true;
  }
  if (isTetris) pendingSingle = true;
}

function clearLines(wasTSpin) {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }

  if (!cleared) {
    combo = 0;
    return 0;
  }

  combo += 1;
  let lineScore = (LINE_SCORES[cleared] || 0) * level * combo;

  const labels = [];
  if (combo > 1) labels.push(`COMBO x${combo}`);

  if (wasTSpin) {
    lineScore += (T_SPIN_BONUS[cleared] || T_SPIN_BONUS[4]) * level;
    labels.push('T-SPIN');
  }

  const isTetris = cleared === 4;
  if (isTetris && lastWasTetris) {
    lineScore = Math.floor(lineScore * B2B_MULT);
    labels.push('B2B');
  }
  lastWasTetris = isTetris;

  if (boardEmpty()) {
    lineScore += PERFECT_CLEAR_BONUS * level;
    labels.push('PERFECT CLEAR');
  }

  lines += cleared;
  score += lineScore;
  level = Math.floor(lines / 10) + 1;
  dropInterval = Math.max(100, 1000 - (level - 1) * 90);
  maybeQueueArcadeRewards(cleared, isTetris);
  updateHUD();
  if (labels.length) showFx(labels.join(' / '));
  return cleared;
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lastAction = 'drop';
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    lastAction = 'move';
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  const wasTSpin = !isPowerType(current.type) && isTSpin();

  if (isPowerType(current.type)) {
    applyPowerUp(current.type);
  } else {
    merge();
  }

  clearLines(wasTSpin);
  holdLocked = false;
  updateHoldLockUI();
  lastAction = null;

  if (mode === 'challenge' && lines >= CHALLENGE_LINES) {
    winGame();
    return;
  }

  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
    return;
  }
  drawNext();
}

function holdPiece() {
  if (holdLocked || !current || gameOver || paused || inMenu || won) return;

  const incoming = hold;
  hold = makePiece(current.type);
  holdLocked = true;
  updateHoldLockUI();
  drawHold();

  if (incoming) {
    current = makePiece(incoming.type);
  } else {
    current = next;
    next = randomPiece();
    drawNext();
  }

  if (collide(current.shape, current.x, current.y)) {
    endGame();
    return;
  }
  lastAction = null;
}

function updateHoldLockUI() {
  holdSection.classList.toggle('hold-locked', holdLocked);
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function freezeActive() {
  return freezeUntil > 0 && performance.now() < freezeUntil;
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString('en-US');
  linesEl.textContent = mode === 'challenge'
    ? `${lines} / ${CHALLENGE_LINES}`
    : String(lines);
  levelEl.textContent = level;
  if (mode === 'challenge') {
    const remaining = CHALLENGE_MS - challengeElapsed;
    timeLeftEl.textContent = formatTime(remaining);
    challengeProgressEl.textContent = `${lines} / ${CHALLENGE_LINES}`;
  }
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  drawBlockFn(context, x, y, colorIndex, size, alpha);
}

function drawGrid() {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  if (!current) return;

  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawPreview(context, piece, canvasEl) {
  const NB = 24;
  context.clearRect(0, 0, canvasEl.width, canvasEl.height);
  if (!piece) return;
  const shape = piece.shape;
  const rows = shape.length;
  const cols = shape[0].length;
  const offX = Math.floor((5 - cols) / 2);
  const offY = Math.floor((5 - rows) / 2);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      drawBlock(context, offX + c, offY + r, shape[r][c], NB);
}

function drawNext() {
  drawPreview(nextCtx, next, nextCanvas);
}

function drawHold() {
  drawPreview(holdCtx, hold, holdCanvas);
}

function showOverlayView(kind) {
  overlay.classList.remove('hidden');
  if (kind === 'menu') {
    inMenu = true;
    overlayTitle.textContent = 'TETRIS';
    overlayScore.textContent = 'Choose a mode';
    overlayActions.classList.remove('hidden');
    overlayEndActions.classList.add('hidden');
  } else {
    overlayActions.classList.add('hidden');
    overlayEndActions.classList.remove('hidden');
  }
}

function hideOverlay() {
  overlay.classList.add('hidden');
  inMenu = false;
}

function endGame(reason) {
  gameOver = true;
  cancelAnimationFrame(animId);
  if (reason === 'time') {
    overlayTitle.textContent = "TIME'S UP";
    overlayScore.textContent = `Lines: ${lines} / ${CHALLENGE_LINES} - Score: ${score.toLocaleString('en-US')}`;
  } else {
    overlayTitle.textContent = 'GAME OVER';
    overlayScore.textContent = `Score: ${score.toLocaleString('en-US')}`;
  }
  showOverlayView('end');
}

function winGame() {
  won = true;
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'VICTORY';
  overlayScore.textContent = `Score: ${score.toLocaleString('en-US')}`;
  showOverlayView('end');
}

function togglePause() {
  if (gameOver || inMenu || won) return;
  paused = !paused;
  if (!paused) {
    hideOverlay();
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSED';
    overlayScore.textContent = '';
    showOverlayView('end');
  }
}

function loop(ts) {
  if (gameOver || paused || inMenu) return;
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;

  if (mode === 'challenge') {
    challengeElapsed += dt;
    updateHUD();
    if (challengeElapsed >= CHALLENGE_MS) {
      endGame('time');
      return;
    }
  }

  if (freezeUntil && ts >= freezeUntil) freezeUntil = 0;

  if (!freezeActive() && dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
      lastAction = 'move';
    } else {
      lockPiece();
    }
  } else if (freezeActive()) {
    dropAccum = 0;
  }

  draw();
  if (!gameOver && !paused && !inMenu) {
    animId = requestAnimationFrame(loop);
  }
}

function init(selectedMode) {
  mode = selectedMode;
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  paused = false;
  gameOver = false;
  won = false;
  dropInterval = 1000;
  dropAccum = 0;
  lastTime = performance.now();
  hold = null;
  holdLocked = false;
  combo = 0;
  lastAction = null;
  lastWasTetris = false;
  challengeElapsed = 0;
  linesTowardPower = 0;
  pendingPower = false;
  pendingSingle = false;
  freezeUntil = 0;
  current = null;
  next = randomPiece();

  challengeHud.classList.toggle('hidden', mode !== 'challenge');
  updateHoldLockUI();
  drawHold();
  spawn();
  updateHUD();
  hideOverlay();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function showMenu() {
  cancelAnimationFrame(animId);
  gameOver = false;
  won = false;
  paused = false;
  current = null;
  board = createBoard();
  draw();
  hold = null;
  drawHold();
  updateHoldLockUI();
  challengeHud.classList.add('hidden');
  fxBanner.classList.add('hidden');
  showOverlayView('menu');
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') {
    if (!inMenu) togglePause();
    return;
  }
  if (paused || gameOver || inMenu || won) return;

  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) {
        current.x--;
        lastAction = 'move';
      }
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) {
        current.x++;
        lastAction = 'move';
      }
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
    case 'KeyC':
    case 'ShiftLeft':
    case 'ShiftRight':
      e.preventDefault();
      holdPiece();
      break;
  }
  updateHUD();
});

modeClassicBtn.addEventListener('click', () => init('classic'));
modeChallengeBtn.addEventListener('click', () => init('challenge'));
modeArcadeBtn.addEventListener('click', () => init('arcade'));
restartBtn.addEventListener('click', () => init(mode || 'classic'));
menuBtn.addEventListener('click', showMenu);

loadSavedSkin();
showMenu();
