// ─── SHARED GAME STATE ────────────────────────────────────────────
// Single source of truth for all mutable game data.
// Modules import this and read/write directly (standard game pattern).

export const game = {
  state: 'title', // title | playing | paused | gameover | victory
  map: null,
  player: null,
  enemies: [],
  bullets: [],
  ammoPickups: [],
  score: 0,
  kills: 0,
  wave: 1,
  gameTime: 0,
  lastTime: 0,

  // Visual state
  gunBob: 0,
  gunShootFlash: 0,
  titleAngle: 0,

  // Debug
  _frames: 0,
  _lastDbg: performance.now(),
  _fps: 0,
  _ft: 0,
  _prev: 0,
};

// ─── CANVAS / RENDERER STATE ──────────────────────────────────────
export let canvas, ctx;
export let W = 0, H = 0, HALF_H = 0, SCALE = 1, COLS = 320;

export function initCanvas() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

export function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  SCALE = Math.max(1, Math.floor(Math.min(vw, vh * 1.6) / 320));
  W = Math.floor(vw / SCALE) * SCALE;
  H = Math.floor(vh / SCALE) * SCALE;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  HALF_H = H >> 1;
  COLS = Math.floor(W / SCALE);
}
