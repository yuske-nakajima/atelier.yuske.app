// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// クラドニ図形: u(x,y) = cos(m·π·x)·cos(n·π·y) - cos(n·π·x)·cos(m·π·y)
// |u| が 0 に近い点（節線）に砂が溜まる。

const params = {
  m: 3, // モード m
  n: 5, // モード n
  coupling: 1.0, // 2 項目の係数（0〜1 で混合）
  threshold: 0.05, // 節線として描画する閾値
  particleCount: 6000, // 粒子数
  step: 0.012, // 粒子の移動量
  hueBase: 40, // 砂の色相
  saturation: 40, // 彩度
  lightness: 88, // 明度
  background: 8, // 背景明度
  trail: 0.04, // フェード（小さいほど残る）
  animate: 0.0, // m, n の自動変化速度
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

/** @type {{x:number,y:number}[]} */
let particles = [];

function spawn() {
  particles = [];
  const count = Math.max(200, Math.floor(params.particleCount));
  for (let i = 0; i < count; i++) {
    particles.push({ x: Math.random(), y: Math.random() });
  }
}
spawn();

/**
 * クラドニ関数の値を返す（x, y は 0..1 正規化座標）。
 * @param {number} x
 * @param {number} y
 */
function u(x, y) {
  const m = params.m;
  const n = params.n;
  const c = params.coupling;
  const a = Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
  const b = Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y);
  return a - c * b;
}

let time = 0;

function step() {
  const thr = params.threshold;
  const st = params.step;
  for (const p of particles) {
    const v = Math.abs(u(p.x, p.y));
    if (v > thr) {
      // 節線からずれている → ランダムに揺らして探索
      p.x += (Math.random() - 0.5) * st * 2;
      p.y += (Math.random() - 0.5) * st * 2;
    } else {
      // 節線上 → 微小振動
      p.x += (Math.random() - 0.5) * st * 0.3;
      p.y += (Math.random() - 0.5) * st * 0.3;
    }
    // 境界で折り返し
    if (p.x < 0) p.x = -p.x;
    if (p.x > 1) p.x = 2 - p.x;
    if (p.y < 0) p.y = -p.y;
    if (p.y > 1) p.y = 2 - p.y;
  }
}

function render() {
  const w = canvas.width;
  const h = canvas.height;
  const bg = params.background;
  ctx.fillStyle = `hsla(0, 0%, ${bg}%, ${params.trail})`;
  ctx.fillRect(0, 0, w, h);
  const size = Math.min(w, h) * 0.9;
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  ctx.fillStyle = `hsl(${params.hueBase}, ${params.saturation}%, ${params.lightness}%)`;
  for (const p of particles) {
    const x = ox + p.x * size;
    const y = oy + p.y * size;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
}

function tick() {
  if (params.animate !== 0) {
    time += params.animate * 0.01;
    params.m = 2 + Math.abs(Math.sin(time) * 6);
    params.n = 2 + Math.abs(Math.cos(time * 0.7) * 6);
  }
  step();
  render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- GUI ---

const gui = new TileUI({
  title: 'Cymatics',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'm', 1, 12, 0.1);
gui.add(params, 'n', 1, 12, 0.1);
gui.add(params, 'coupling', 0, 1.5, 0.01);
gui.add(params, 'threshold', 0.005, 0.3, 0.005);
gui.add(params, 'particleCount', 500, 20000, 100).onChange(spawn);
gui.add(params, 'step', 0.002, 0.05, 0.001);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 30, 100, 1);
gui.add(params, 'background', 0, 30, 1);
gui.add(params, 'trail', 0.005, 0.3, 0.005);
gui.add(params, 'animate', 0, 2, 0.05);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.m = r(2, 9, 0.1);
  params.n = r(2, 9, 0.1);
  params.coupling = r(0.6, 1.2, 0.01);
  params.threshold = r(0.02, 0.12, 0.005);
  params.step = r(0.005, 0.025, 0.001);
  params.hueBase = r(0, 360, 1);
  params.saturation = r(0, 80, 1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  spawn();
  gui.updateDisplay();
});
