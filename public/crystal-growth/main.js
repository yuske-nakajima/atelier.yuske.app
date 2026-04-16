// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  cellSize: 3, // 1 セルの描画サイズ（px）
  walkersPerFrame: 400, // フレームあたりの拡散粒子数
  stickiness: 1, // 結晶に付着する確率（0-1）
  symmetry: 1, // 対称数（1 で対称なし）
  seedCount: 1, // 初期シード数
  hueBase: 200, // 基本色相
  hueShift: 0.6, // 成長に応じた色相変化
  glow: 8, // グロー強度
  lineBlend: 0.7, // 近接付着時のブレンド強度
  stepBias: 0, // 中心への引力 (0-1)
  showSeeds: true, // シードハイライト
  animate: true, // 自動成長
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

let gridW = 0;
let gridH = 0;
/** @type {Uint16Array} */
let grid = new Uint16Array(0); // 0: 空, >0: 成長時刻+1

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  reset();
}

function reset() {
  const cs = Math.max(1, params.cellSize);
  gridW = Math.floor(canvas.width / cs);
  gridH = Math.floor(canvas.height / cs);
  grid = new Uint16Array(gridW * gridH);
  const seeds = Math.max(1, Math.round(params.seedCount));
  for (let i = 0; i < seeds; i++) {
    const sx = Math.floor(gridW / 2 + (Math.random() - 0.5) * gridW * 0.2);
    const sy = Math.floor(gridH / 2 + (Math.random() - 0.5) * gridH * 0.2);
    placeStick(sx, sy, 1);
  }
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawAll();
}

window.addEventListener('resize', resize);
resize();

// --- DLA ロジック ---

let tick = 1;

/**
 * 対称位置にセルを結晶化
 * @param {number} x
 * @param {number} y
 * @param {number} age
 */
function placeStick(x, y, age) {
  const sym = Math.max(1, Math.round(params.symmetry));
  const cx = gridW / 2;
  const cy = gridH / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.hypot(dx, dy);
  const baseAngle = Math.atan2(dy, dx);
  for (let s = 0; s < sym; s++) {
    const a = baseAngle + (Math.PI * 2 * s) / sym;
    const sx = Math.round(cx + Math.cos(a) * r);
    const sy = Math.round(cy + Math.sin(a) * r);
    if (sx < 0 || sx >= gridW || sy < 0 || sy >= gridH) continue;
    if (grid[sy * gridW + sx] !== 0) continue;
    grid[sy * gridW + sx] = age;
    drawCell(sx, sy, age);
  }
}

function hasNeighbor(x, y) {
  if (x > 0 && grid[y * gridW + x - 1]) return true;
  if (x < gridW - 1 && grid[y * gridW + x + 1]) return true;
  if (y > 0 && grid[(y - 1) * gridW + x]) return true;
  if (y < gridH - 1 && grid[(y + 1) * gridW + x]) return true;
  return false;
}

function walk() {
  let x = Math.floor(Math.random() * gridW);
  let y = Math.floor(Math.random() * gridH);
  if (grid[y * gridW + x] !== 0) return;
  for (let i = 0; i < 500; i++) {
    if (hasNeighbor(x, y)) {
      if (Math.random() < params.stickiness) {
        placeStick(x, y, tick++);
      }
      return;
    }
    const cx = gridW / 2;
    const cy = gridH / 2;
    const bx = Math.sign(cx - x) * params.stepBias;
    const by = Math.sign(cy - y) * params.stepBias;
    const r = Math.random();
    if (r < 0.25 + bx * 0.25) x++;
    else if (r < 0.5) x--;
    else if (r < 0.75 + by * 0.25) y++;
    else y--;
    if (x < 0) x = gridW - 1;
    if (x >= gridW) x = 0;
    if (y < 0) y = gridH - 1;
    if (y >= gridH) y = 0;
  }
}

// --- 描画 ---

function drawCell(x, y, age) {
  const cs = Math.max(1, params.cellSize);
  const hue = (params.hueBase + age * params.hueShift) % 360;
  ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
  ctx.shadowBlur = params.glow;
  ctx.shadowColor = ctx.fillStyle;
  ctx.fillRect(x * cs, y * cs, cs, cs);
  ctx.shadowBlur = 0;
}

function drawAll() {
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const v = grid[y * gridW + x];
      if (v !== 0) drawCell(x, y, v);
    }
  }
}

function loop() {
  if (params.animate) {
    const n = Math.max(0, Math.round(params.walkersPerFrame));
    for (let i = 0; i < n; i++) walk();
  }
  requestAnimationFrame(loop);
}

loop();

// --- GUI ---

const gui = new TileUI({
  title: 'Crystal Growth',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'cellSize', 1, 8, 1).onChange(reset);
gui.add(params, 'walkersPerFrame', 0, 2000, 50);
gui.add(params, 'stickiness', 0.05, 1, 0.01);
gui.add(params, 'symmetry', 1, 12, 1).onChange(reset);
gui.add(params, 'seedCount', 1, 12, 1).onChange(reset);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueShift', 0, 2, 0.01);
gui.add(params, 'glow', 0, 20, 0.5);
gui.add(params, 'lineBlend', 0, 1, 0.01);
gui.add(params, 'stepBias', 0, 1, 0.01);
gui.add(params, 'showSeeds');
gui.add(params, 'animate');

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.symmetry = rand(1, 10, 1);
  params.seedCount = rand(1, 6, 1);
  params.stickiness = rand(0.2, 1, 0.05);
  params.walkersPerFrame = rand(200, 1000, 50);
  params.hueBase = rand(0, 360, 1);
  params.hueShift = rand(0, 1.5, 0.05);
  params.glow = rand(0, 14, 0.5);
  params.stepBias = rand(0, 0.4, 0.01);
  reset();
  gui.updateDisplay();
});

gui.addButton('Clear', () => reset());

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  gui.updateDisplay();
});
