// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 磁性粉のパターン：磁石の周りに鉄粉が磁力線に沿って集まるパターン。
// 磁場の磁力線に沿って動くパーティクルで表現する。

const params = {
  particleCount: 2000, // 鉄粉の数
  magnetCount: 3, // 磁石の数
  fieldStrength: 1.5, // 磁場の強さ
  damping: 0.92, // 速度減衰
  maxSpeed: 3.0, // 最高速度
  hueBase: 30, // 基本色相（茶・金属色）
  hueRange: 60, // 色相レンジ
  brightness: 55, // 明度
  fadeAlpha: 0.15, // フェード強度
  dustSize: 2.0, // 鉄粉サイズ
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initMagnets();
  initDust();
}
window.addEventListener('resize', resize);

/** @typedef {{ x: number, y: number, polarity: number }} Magnet */
/** @typedef {{ x: number, y: number, vx: number, vy: number }} Dust */

/** @type {Magnet[]} */
let magnets = [];
/** @type {Dust[]} */
let dust = [];

/**
 * 磁石を初期化する
 */
function initMagnets() {
  magnets = [];
  const n = Math.max(1, Math.round(params.magnetCount));
  for (let i = 0; i < n; i++) {
    magnets.push({
      x: canvas.width * 0.15 + (canvas.width * 0.7 * i) / (n - 1 || 1),
      y: canvas.height / 2,
      polarity: i % 2 === 0 ? 1 : -1,
    });
  }
}

/**
 * 鉄粉を初期化する
 */
function initDust() {
  dust = [];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < params.particleCount; i++) {
    dust.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0,
      vy: 0,
    });
  }
}

resize();

/**
 * 鉄粉を1ステップ更新する
 * @param {Dust} p
 */
function updateDust(p) {
  const w = canvas.width;
  const h = canvas.height;
  let fx = 0;
  let fy = 0;

  for (const mag of magnets) {
    const dx = p.x - mag.x;
    const dy = p.y - mag.y;
    const dist = Math.max(5, Math.hypot(dx, dy));
    const force = (params.fieldStrength * mag.polarity) / (dist * dist * 0.01);

    // 磁力線に沿う方向（接線方向）
    const angle = Math.atan2(dy, dx);
    const tangentX = -Math.sin(angle) * mag.polarity;
    const tangentY = Math.cos(angle) * mag.polarity;

    fx += tangentX * force * 0.5 + (dx / dist) * force * 0.1;
    fy += tangentY * force * 0.5 + (dy / dist) * force * 0.1;
  }

  p.vx = (p.vx + fx * 0.01) * params.damping;
  p.vy = (p.vy + fy * 0.01) * params.damping;

  const speed = Math.hypot(p.vx, p.vy);
  if (speed > params.maxSpeed) {
    p.vx = (p.vx / speed) * params.maxSpeed;
    p.vy = (p.vy / speed) * params.maxSpeed;
  }

  p.x += p.vx;
  p.y += p.vy;

  // 画面折り返し
  if (p.x < 0) p.x += w;
  if (p.x > w) p.x -= w;
  if (p.y < 0) p.y += h;
  if (p.y > h) p.y -= h;
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(11, 10, 7, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  for (const p of dust) {
    updateDust(p);
    const speed = Math.hypot(p.vx, p.vy) / params.maxSpeed;
    const hue = params.hueBase + speed * params.hueRange;
    const lig = params.brightness + speed * 20;
    ctx.fillStyle = `hsl(${hue}, 60%, ${lig}%)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, params.dustSize * (0.5 + speed * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  // 磁石を描画
  for (const mag of magnets) {
    ctx.beginPath();
    ctx.arc(mag.x, mag.y, 12, 0, Math.PI * 2);
    ctx.fillStyle =
      mag.polarity > 0 ? 'hsl(0, 80%, 55%)' : 'hsl(220, 80%, 55%)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Magnetic Dust',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'particleCount', 200, 5000, 200).onChange(initDust);
gui.add(params, 'magnetCount', 1, 8, 1).onChange(() => {
  initMagnets();
  initDust();
});
gui.add(params, 'fieldStrength', 0.1, 5, 0.1);
gui.add(params, 'damping', 0.8, 0.99, 0.01);
gui.add(params, 'maxSpeed', 0.5, 8, 0.1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 180, 1);
gui.add(params, 'brightness', 10, 90, 1);
gui.add(params, 'dustSize', 0.5, 6, 0.1);

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
  params.magnetCount = rand(1, 6, 1);
  params.fieldStrength = rand(0.3, 4, 0.1);
  params.damping = rand(0.85, 0.98, 0.01);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(20, 150, 1);
  params.brightness = rand(25, 75, 1);
  initMagnets();
  initDust();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initMagnets();
  initDust();
  gui.updateDisplay();
});
