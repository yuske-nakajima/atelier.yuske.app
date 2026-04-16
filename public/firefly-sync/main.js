// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  count: 180, // 蛍の数
  coupling: 1.2, // 結合強度 K（大きいほど同期しやすい）
  meanFreq: 1.4, // 平均固有周波数 ω
  freqSpread: 0.35, // 固有周波数のばらつき
  radius: 220, // 近傍半径（この距離以内の蛍同士が結合）
  size: 2.8, // 蛍のサイズ
  glow: 28, // グロー半径
  hue: 55, // 色相（黄緑〜黄）
  wander: 0.4, // 蛍のランダム移動速度
  speed: 1, // 時間の進む速度
  trail: 0.18, // 背景の残像（小さいほど尾が長い）
  bgColor: '#05070a', // 背景色
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

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

// --- 蛍の状態 ---

/**
 * @typedef {{ x: number, y: number, vx: number, vy: number, phase: number, freq: number }} Firefly
 */

/** @type {Firefly[]} */
let fireflies = [];

/**
 * 正規分布っぽい乱数（Box-Muller 近似）
 * @returns {number}
 */
function randn() {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function createFirefly() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * params.wander,
    vy: (Math.random() - 0.5) * params.wander,
    phase: Math.random() * Math.PI * 2,
    freq: params.meanFreq + randn() * params.freqSpread,
  };
}

function reinitFireflies() {
  fireflies = Array.from({ length: params.count }, createFirefly);
}

reinitFireflies();

// --- 更新 ---

const dt = 1 / 60;

/**
 * 蛍の位置を更新する（緩やかにブラウン運動し画面端で跳ね返る）
 * @param {Firefly} f
 */
function movePosition(f) {
  f.vx += (Math.random() - 0.5) * 0.05 * params.wander;
  f.vy += (Math.random() - 0.5) * 0.05 * params.wander;
  const maxV = params.wander;
  f.vx = Math.max(-maxV, Math.min(maxV, f.vx));
  f.vy = Math.max(-maxV, Math.min(maxV, f.vy));
  f.x += f.vx;
  f.y += f.vy;
  if (f.x < 0 || f.x > canvas.width) f.vx *= -1;
  if (f.y < 0 || f.y > canvas.height) f.vy *= -1;
}

/**
 * 蔵本モデルで位相を更新する（近傍の蛍とのみ結合）
 * @param {Firefly} f
 * @param {number} idx
 */
function updatePhase(f, idx) {
  const r2 = params.radius * params.radius;
  let sumSin = 0;
  let neighbors = 0;
  for (let j = 0; j < fireflies.length; j++) {
    if (j === idx) continue;
    const g = fireflies[j];
    const dx = g.x - f.x;
    const dy = g.y - f.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;
    sumSin += Math.sin(g.phase - f.phase);
    neighbors += 1;
  }
  const coupling = neighbors > 0 ? (params.coupling / neighbors) * sumSin : 0;
  f.phase += (f.freq + coupling) * dt * params.speed;
}

function step() {
  for (let i = 0; i < fireflies.length; i++) {
    movePosition(fireflies[i]);
  }
  for (let i = 0; i < fireflies.length; i++) {
    updatePhase(fireflies[i], i);
  }
}

// --- 描画 ---

/**
 * 位相から明るさ（0〜1）を計算する。sin を鋭いパルスに変形。
 * @param {number} phase
 */
function brightness(phase) {
  const s = (Math.sin(phase) + 1) / 2; // 0〜1
  return s ** 4; // 鋭いフラッシュ
}

/**
 * 蛍 1 匹を描画する
 * @param {Firefly} f
 */
function drawFirefly(f) {
  const b = brightness(f.phase);
  if (b < 0.01) return;
  const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, params.glow);
  grad.addColorStop(0, `hsla(${params.hue}, 100%, 70%, ${b})`);
  grad.addColorStop(0.3, `hsla(${params.hue}, 100%, 60%, ${b * 0.4})`);
  grad.addColorStop(1, `hsla(${params.hue}, 100%, 50%, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(f.x, f.y, params.glow, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsla(${params.hue}, 100%, 90%, ${b})`;
  ctx.beginPath();
  ctx.arc(f.x, f.y, params.size, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  // 残像を残しつつフェード
  const fade = Math.max(0.02, Math.min(1, params.trail));
  ctx.fillStyle = hexWithAlpha(params.bgColor, fade);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'lighter';
  for (const f of fireflies) {
    drawFirefly(f);
  }
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * #rrggbb を rgba(..., alpha) 形式に変換
 * @param {string} hex
 * @param {number} alpha
 */
function hexWithAlpha(hex, alpha) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

function tick() {
  step();
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'Firefly Sync',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 20, 500, 10).onChange(reinitFireflies);
gui.add(params, 'coupling', 0, 5, 0.05);
gui.add(params, 'meanFreq', 0.2, 4, 0.05);
gui.add(params, 'freqSpread', 0, 1.5, 0.01);
gui.add(params, 'radius', 40, 600, 10);
gui.add(params, 'size', 0.5, 8, 0.1);
gui.add(params, 'glow', 4, 80, 1);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'wander', 0, 2, 0.05);
gui.add(params, 'speed', 0, 3, 0.05);
gui.add(params, 'trail', 0.02, 1, 0.01);
gui.addColor(params, 'bgColor');

/**
 * 乱数ヘルパー
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.coupling = rand(0.3, 3, 0.05);
  params.meanFreq = rand(0.6, 3, 0.05);
  params.freqSpread = rand(0.05, 0.8, 0.01);
  params.radius = rand(80, 400, 10);
  params.size = rand(1.5, 5, 0.1);
  params.glow = rand(12, 50, 1);
  params.hue = rand(0, 360, 1);
  params.wander = rand(0.1, 1, 0.05);
  params.speed = rand(0.5, 2, 0.05);
  params.trail = rand(0.05, 0.4, 0.01);
  // 固有周波数を新しい分布で再抽選
  for (const f of fireflies) {
    f.freq = params.meanFreq + randn() * params.freqSpread;
  }
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reinitFireflies();
  gui.updateDisplay();
});

gui.addButton('Resync', () => {
  // 全ての蛍の位相を揃えた状態からスタートしてバラけていく様子を観察
  for (const f of fireflies) {
    f.phase = 0;
  }
});
