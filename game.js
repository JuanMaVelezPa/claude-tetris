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
const RECORDS_KEY = 'tetris-records';
const SKIN_KEY = 'tetris-skin';
const TOP_N = 5;
const MAX_START_LEVEL = 10;

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
  '#ff1744',
  '#2979ff',
  '#ff9100',
  '#ff77c8',
  '#00e5c0',
  '#e040fb',
  '#ffff8d',
  '#90a4ae',
  '#ff1744',
  '#ffea00',
  '#00e676',
  '#448aff',
  '#b388ff',
  '#ffffff',
];

const COLORS_PASTEL = [
  null,
  '#9adce6',
  '#ffe08a',
  '#d4a5e8',
  '#a8d8a8',
  '#f0a0a0',
  '#a0aee0',
  '#f0c090',
  '#f5b8d0',
  '#a0d8d0',
  '#d8b0e8',
  '#f5ecc0',
  '#c0c8d0',
  '#f08080',
  '#f0e080',
  '#90e0b8',
  '#a0c0f0',
  '#c8b0f0',
  '#f5f5f5',
];

const COLORS_PIXEL = COLORS_RETRO.slice();

const SKIN_COLORS = {
  retro: COLORS_RETRO,
  neon: COLORS_NEON,
  pastel: COLORS_PASTEL,
  pixel: COLORS_PIXEL,
};

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
const overlayHighlight = document.getElementById('overlay-highlight');
const overlayActions = document.getElementById('overlay-actions');
const overlayEndActions = document.getElementById('overlay-end-actions');
const overlayPauseActions = document.getElementById('overlay-pause-actions');
const overlayControlsView = document.getElementById('overlay-controls-view');
const recordsPanel = document.getElementById('records-panel');
const recordsList = document.getElementById('records-list');
const bestComboEl = document.getElementById('best-combo');
const maxLinesStatEl = document.getElementById('max-lines-stat');
const resetRecordsBtn = document.getElementById('reset-records-btn');
const skinPanel = document.getElementById('skin-panel');
const skinButtons = document.getElementById('skin-buttons');
const startLevelPanel = document.getElementById('start-level-panel');
const startLevelSelect = document.getElementById('start-level-select');
const nameEntry = document.getElementById('name-entry');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const pauseControlsBtn = document.getElementById('pause-controls-btn');
const controlsBackBtn = document.getElementById('controls-back-btn');
const modeClassicBtn = document.getElementById('mode-classic-btn');
const modeChallengeBtn = document.getElementById('mode-challenge-btn');
const modeArcadeBtn = document.getElementById('mode-arcade-btn');
const themeToggle = document.getElementById('theme-toggle');

let COLORS = COLORS_RETRO.slice();
let currentSkin = 'retro';
let startLevel = 1;
let board, current, next, hold, holdLocked;
let score, lines, level, paused, gameOver, won;
let lastTime, dropAccum, dropInterval, animId;
let mode, combo, maxCombo, lastAction, lastWasTetris, challengeElapsed;
let linesTowardPower, pendingPower, pendingSingle, freezeUntil;
let fxTimer = null;
let inMenu = true;
let pauseView = 'main'; // main | controls
let pendingRecord = null;
let highlightRank = -1;

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

function defaultRecords() {
  return { scores: [], bestCombo: 0, maxLines: 0 };
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return defaultRecords();
    const data = JSON.parse(raw);
    return {
      scores: Array.isArray(data.scores) ? data.scores.slice(0, TOP_N) : [],
      bestCombo: Number(data.bestCombo) || 0,
      maxLines: Number(data.maxLines) || 0,
    };
  } catch (_) {
    return defaultRecords();
  }
}

function saveRecords(data) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(data));
}

function qualifiesForTop(scoreValue, records) {
  if (records.scores.length < TOP_N) return true;
  return scoreValue > records.scores[records.scores.length - 1].score;
}

function rankForScore(scoreValue, records) {
  let rank = records.scores.findIndex(e => scoreValue > e.score);
  if (rank === -1) {
    if (records.scores.length < TOP_N) return records.scores.length;
    return -1;
  }
  return rank;
}

function addRecord(name, scoreValue, linesValue, comboValue) {
  const records = loadRecords();
  const entry = {
    name: (name || 'AAA').trim().slice(0, 12) || 'AAA',
    score: scoreValue,
    lines: linesValue,
    combo: comboValue,
  };
  records.scores.push(entry);
  records.scores.sort((a, b) => b.score - a.score);
  records.scores = records.scores.slice(0, TOP_N);
  if (comboValue > records.bestCombo) records.bestCombo = comboValue;
  if (linesValue > records.maxLines) records.maxLines = linesValue;
  saveRecords(records);
  return records;
}

function updateRecordsMeta(linesValue, comboValue) {
  const records = loadRecords();
  let changed = false;
  if (comboValue > records.bestCombo) {
    records.bestCombo = comboValue;
    changed = true;
  }
  if (linesValue > records.maxLines) {
    records.maxLines = linesValue;
    changed = true;
  }
  if (changed) saveRecords(records);
}

function renderRecords() {
  const records = loadRecords();
  bestComboEl.textContent = String(records.bestCombo);
  maxLinesStatEl.textContent = String(records.maxLines);
  recordsList.innerHTML = '';

  if (!records.scores.length) {
    const li = document.createElement('li');
    li.className = 'records-empty';
    li.textContent = 'No records yet';
    recordsList.appendChild(li);
    return;
  }

  records.scores.forEach((entry, i) => {
    const li = document.createElement('li');
    if (highlightRank === i) li.classList.add('record-highlight');
    li.innerHTML =
      `<span class="record-rank">${i + 1}.</span>` +
      `<span class="record-name">${escapeHtml(entry.name)}</span>` +
      `<span class="record-score">${entry.score.toLocaleString('en-US')}</span>`;
    recordsList.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applySkin(skin) {
  const nextSkin = SKIN_COLORS[skin] ? skin : 'retro';
  currentSkin = nextSkin;
  COLORS = SKIN_COLORS[nextSkin].slice();
  document.documentElement.setAttribute('data-skin', nextSkin);
  localStorage.setItem(SKIN_KEY, nextSkin);
  skinButtons.querySelectorAll('.skin-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.skin === nextSkin);
  });
  draw();
  drawNext();
  drawHold();
}

function loadSkin() {
  const saved = localStorage.getItem(SKIN_KEY);
  applySkin(saved && SKIN_COLORS[saved] ? saved : 'retro');
}

function fillStartLevelSelect() {
  startLevelSelect.innerHTML = '';
  for (let i = 1; i <= MAX_START_LEVEL; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = String(i);
    startLevelSelect.appendChild(opt);
  }
  startLevelSelect.value = String(startLevel);
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

function levelFromLines() {
  return Math.floor(lines / 10) + startLevel;
}

function dropIntervalForLevel(lv) {
  return Math.max(100, 1000 - (lv - 1) * 90);
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
  if (combo > maxCombo) maxCombo = combo;
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
  level = levelFromLines();
  dropInterval = dropIntervalForLevel(level);
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

function roundRectPath(context, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

function drawPixelTexture(context, px, py, size) {
  const step = Math.max(2, Math.floor(size / 4));
  context.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = 0; y < size - 2; y += step) {
    for (let x = 0; x < size - 2; x += step) {
      if ((x / step + y / step) % 2 === 0) {
        context.fillRect(px + 1 + x, py + 1 + y, step, step);
      }
    }
  }
  context.fillStyle = 'rgba(255,255,255,0.15)';
  for (let y = 0; y < size - 2; y += step) {
    for (let x = 0; x < size - 2; x += step) {
      if ((x / step + y / step) % 2 === 1) {
        context.fillRect(px + 1 + x, py + 1 + y, Math.max(1, step - 1), Math.max(1, step - 1));
      }
    }
  }
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex] || '#ffffff';
  const px = x * size;
  const py = y * size;
  context.globalAlpha = alpha ?? 1;

  if (currentSkin === 'neon') {
    context.shadowColor = color;
    context.shadowBlur = 12;
    context.fillStyle = color;
    context.fillRect(px + 2, py + 2, size - 4, size - 4);
    context.shadowBlur = 0;
    context.fillStyle = 'rgba(255,255,255,0.35)';
    context.fillRect(px + 2, py + 2, size - 4, 3);
  } else if (currentSkin === 'pastel') {
    context.fillStyle = color;
    roundRectPath(context, px + 1, py + 1, size - 2, size - 2, 6);
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.35)';
    roundRectPath(context, px + 3, py + 3, size - 6, Math.max(3, size / 5), 3);
    context.fill();
  } else if (currentSkin === 'pixel') {
    context.fillStyle = color;
    context.fillRect(px + 1, py + 1, size - 2, size - 2);
    drawPixelTexture(context, px, py, size);
  } else {
    context.fillStyle = color;
    context.fillRect(px + 1, py + 1, size - 2, size - 2);
    context.fillStyle = 'rgba(255,255,255,0.12)';
    context.fillRect(px + 1, py + 1, size - 2, 4);
  }

  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

function drawGrid() {
  if (currentSkin === 'neon') {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
  } else if (currentSkin === 'pastel') {
    ctx.strokeStyle = 'rgba(180, 160, 200, 0.25)';
  } else {
    ctx.strokeStyle = '#22222e';
  }
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
  if (currentSkin === 'neon') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawGrid();

  if (!board) return;

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
  if (currentSkin === 'neon') {
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvasEl.width, canvasEl.height);
  }
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

function setPanelVisibility(opts) {
  overlayActions.classList.toggle('hidden', !opts.modes);
  overlayEndActions.classList.toggle('hidden', !opts.end);
  overlayPauseActions.classList.toggle('hidden', !opts.pause);
  overlayControlsView.classList.toggle('hidden', !opts.controls);
  recordsPanel.classList.toggle('hidden', !opts.records);
  skinPanel.classList.toggle('hidden', !opts.skin);
  startLevelPanel.classList.toggle('hidden', !opts.startLevel);
}

function showOverlayView(kind) {
  overlay.classList.remove('hidden');
  overlayHighlight.classList.add('hidden');
  overlayHighlight.textContent = '';

  if (kind === 'menu') {
    inMenu = true;
    pauseView = 'main';
    overlayTitle.textContent = 'TETRIS';
    overlayScore.textContent = 'Choose a mode';
    nameEntry.classList.add('hidden');
    highlightRank = -1;
    pendingRecord = null;
    setPanelVisibility({
      modes: true, end: false, pause: false, controls: false,
      records: true, skin: true, startLevel: true,
    });
    renderRecords();
  } else if (kind === 'pause') {
    pauseView = 'main';
    overlayTitle.textContent = 'PAUSED';
    overlayScore.textContent = '';
    nameEntry.classList.add('hidden');
    setPanelVisibility({
      modes: false, end: false, pause: true, controls: false,
      records: false, skin: true, startLevel: true,
    });
  } else if (kind === 'pause-controls') {
    pauseView = 'controls';
    overlayTitle.textContent = 'CONTROLS';
    overlayScore.textContent = '';
    setPanelVisibility({
      modes: false, end: false, pause: false, controls: true,
      records: false, skin: false, startLevel: false,
    });
  } else {
    // end / victory
    setPanelVisibility({
      modes: false, end: true, pause: false, controls: false,
      records: true, skin: false, startLevel: false,
    });
    renderRecords();
  }
}

function hideOverlay() {
  overlay.classList.add('hidden');
  inMenu = false;
  pauseView = 'main';
}

function prepareScoreEntry() {
  updateRecordsMeta(lines, maxCombo);
  const records = loadRecords();
  pendingRecord = null;
  highlightRank = -1;
  nameEntry.classList.add('hidden');

  if (score <= 0 || !qualifiesForTop(score, records)) {
    overlayHighlight.classList.add('hidden');
    renderRecords();
    return;
  }

  const rank = rankForScore(score, records);
  pendingRecord = { score, lines, combo: maxCombo, rank };
  overlayHighlight.textContent = rank === 0 ? 'NEW HIGH SCORE!' : 'TOP 5!';
  overlayHighlight.classList.remove('hidden');
  nameEntry.classList.remove('hidden');
  playerNameInput.value = '';
  renderRecords();

  if (recordsList.querySelector('.records-empty')) {
    recordsList.innerHTML = '';
  }

  const ghost = document.createElement('li');
  ghost.className = 'record-highlight record-pending';
  ghost.innerHTML =
    `<span class="record-rank">${rank + 1}.</span>` +
    `<span class="record-name">???</span>` +
    `<span class="record-score">${score.toLocaleString('en-US')}</span>`;
  if (rank >= recordsList.children.length) {
    recordsList.appendChild(ghost);
  } else {
    recordsList.insertBefore(ghost, recordsList.children[rank]);
  }
  while (recordsList.children.length > TOP_N) {
    recordsList.removeChild(recordsList.lastChild);
  }
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
  prepareScoreEntry();
}

function winGame() {
  won = true;
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'VICTORY';
  overlayScore.textContent = `Score: ${score.toLocaleString('en-US')}`;
  showOverlayView('end');
  prepareScoreEntry();
}

function resumeGame() {
  if (!paused) return;
  paused = false;
  hideOverlay();
  lastTime = performance.now();
  animId = requestAnimationFrame(loop);
}

function togglePause() {
  if (gameOver || inMenu || won) return;
  if (paused) {
    if (pauseView === 'controls') {
      showOverlayView('pause');
      return;
    }
    resumeGame();
    return;
  }
  paused = true;
  cancelAnimationFrame(animId);
  showOverlayView('pause');
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
  startLevel = Math.min(MAX_START_LEVEL, Math.max(1, Number(startLevelSelect.value) || 1));
  startLevelSelect.value = String(startLevel);
  board = createBoard();
  score = 0;
  lines = 0;
  level = startLevel;
  paused = false;
  gameOver = false;
  won = false;
  dropInterval = dropIntervalForLevel(level);
  dropAccum = 0;
  lastTime = performance.now();
  hold = null;
  holdLocked = false;
  combo = 0;
  maxCombo = 0;
  lastAction = null;
  lastWasTetris = false;
  challengeElapsed = 0;
  linesTowardPower = 0;
  pendingPower = false;
  pendingSingle = false;
  freezeUntil = 0;
  current = null;
  next = randomPiece();
  pendingRecord = null;
  highlightRank = -1;

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

function inputsBlocked() {
  return paused || gameOver || inMenu || won;
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (inMenu) return;
    if (gameOver || won) return;
    e.preventDefault();
    togglePause();
    return;
  }

  if (inputsBlocked()) return;

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
resumeBtn.addEventListener('click', resumeGame);
pauseRestartBtn.addEventListener('click', () => init(mode || 'classic'));
pauseControlsBtn.addEventListener('click', () => showOverlayView('pause-controls'));
controlsBackBtn.addEventListener('click', () => showOverlayView('pause'));

startLevelSelect.addEventListener('change', () => {
  startLevel = Math.min(MAX_START_LEVEL, Math.max(1, Number(startLevelSelect.value) || 1));
});

skinButtons.addEventListener('click', e => {
  const btn = e.target.closest('.skin-btn');
  if (!btn) return;
  applySkin(btn.dataset.skin);
});

resetRecordsBtn.addEventListener('click', () => {
  saveRecords(defaultRecords());
  highlightRank = -1;
  pendingRecord = null;
  overlayHighlight.classList.add('hidden');
  nameEntry.classList.add('hidden');
  renderRecords();
});

saveScoreBtn.addEventListener('click', () => {
  if (!pendingRecord) return;
  const name = playerNameInput.value;
  const records = addRecord(name, pendingRecord.score, pendingRecord.lines, pendingRecord.combo);
  highlightRank = records.scores.findIndex(
    e => e.score === pendingRecord.score && e.name === ((name || 'AAA').trim().slice(0, 12) || 'AAA')
  );
  pendingRecord = null;
  nameEntry.classList.add('hidden');
  overlayHighlight.textContent = 'SAVED!';
  renderRecords();
  if (highlightRank >= 0 && recordsList.children[highlightRank]) {
    recordsList.children[highlightRank].classList.add('record-highlight');
  }
});

playerNameInput.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.code === 'Enter') {
    e.preventDefault();
    saveScoreBtn.click();
  }
});

fillStartLevelSelect();
loadSkin();
board = createBoard();
showMenu();
