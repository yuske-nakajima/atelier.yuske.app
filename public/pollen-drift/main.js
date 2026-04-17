// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 花粉の漂い：風に揺られて空中を漂う花粉粒子のビジュアル。
// ブラウン運動と微弱な風の効果で自然な浮遊感を表現する。

const params = {
  count: 400, // 花粉の数
  brownian: 0.6, // ブラウン運動の強さ
  windX: 0.3, // 風（X方向）
  windY: -0.1, // 風（Y方向、上向きが負）
  gravity: 0.02, // 重力
  pollenHue: 55, // 花粉の色相（黄）
  pollenSize: 3, // 花粉サイズ
  fadeAlpha: 0.05, // フェード強度
  spawnRate: 2, // 生成レート
  glowStrength: 0.6, // 発光強度
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

/** @typedef {{ x: number, y: number, vx: number, vy: number, size: number, hue: number, alpha: number, age: number }} Pollen */
/** @type {Pollen[]} */
let pollen = [];

/**
 * 花粉を初期化する
 */
function initPollen() {
  pollen = [];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < params.count; i++) {
    pollen.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: params.pollenSize * (0.5 + Math.random()),
      hue: params.pollenHue + (Math.random() - 0.5) * 30,
      alpha: 0.4 + Math.random() * 0.5,
      age: Math.random() * 1000,
    });
  }
}
initPollen();

/**
 * 花粉を1ステップ更新する
 * @param {Pollen} p
 */
function updatePollen(p) {
  const w = canvas.width;
  const h = canvas.height;

  // ブラウン運動
  p.vx += (Math.random() - 0.5) * params.brownian * 0.1;
  p.vy += (Math.random() - 0.5) * params.brownian * 0.1;

  // 風
  p.vx += params.windX * 0.01;
  p.vy += params.windY * 0.01;

  // 重力
  p.vy += params.gravity * 0.01;

  // 速度減衰
  p.vx *= 0.98;
  p.vy *= 0.98;

  p.x += p.vx;
  p.y += p.vy;
  p.age += 1;

  // 画面外から再出現
  if (p.x < -10) p.x = w + 10;
  if (p.x > w + 10) p.x = -10;
  if (p.y < -10) p.y = h + 10;
  if (p.y > h + 10) p.y = -10;

  // アルファの揺らぎ
  p.alpha = 0.3 + Math.sin(p.age * 0.03) * 0.2 + 0.2;
}

/**
 * 花粉を描く（球形＋発光）
 * @param {Pollen} p
 */
function drawPollen(p) {
  const s = p.size;

  if (params.glowStrength > 0) {
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 3);
    grd.addColorStop(
      0,
      `hsla(${p.hue}, 90%, 80%, ${p.alpha * params.glowStrength})`,
    );
    grd.addColorStop(1, `hsla(${p.hue}, 80%, 60%, 0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, ${p.alpha})`;
  ctx.beginPath();
  ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
  ctx.fill();

  // 花粉の表面テクスチャ（小さな突起）
  ctx.strokeStyle = `hsla(${p.hue + 20}, 70%, 55%, ${p.alpha * 0.5})`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(a) * s * 0.5, p.y + Math.sin(a) * s * 0.5);
    ctx.lineTo(p.x + Math.cos(a) * s * 1.3, p.y + Math.sin(a) * s * 1.3);
    ctx.stroke();
  }
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(8, 10, 5, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  // 新規花粉を生成
  for (let i = 0; i < params.spawnRate; i++) {
    if (pollen.length < params.count * 2) {
      pollen.push({
        x: Math.random() < 0.5 ? -5 : w + 5,
        y: Math.random() * h,
        vx: params.windX * (0.5 + Math.random()),
        vy: (Math.random() - 0.5) * 0.5,
        size: params.pollenSize * (0.5 + Math.random()),
        hue: params.pollenHue + (Math.random() - 0.5) * 30,
        alpha: 0.4 + Math.random() * 0.4,
        age: 0,
      });
    }
  }

  for (const p of pollen) {
    updatePollen(p);
    drawPollen(p);
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Pollen Drift',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 50, 1000, 25).onChange(initPollen);
gui.add(params, 'brownian', 0, 3, 0.05);
gui.add(params, 'windX', -2, 2, 0.05);
gui.add(params, 'windY', -1, 1, 0.05);
gui.add(params, 'gravity', 0, 0.3, 0.005);
gui.add(params, 'pollenHue', 0, 360, 1);
gui.add(params, 'pollenSize', 1, 10, 0.5);
gui.add(params, 'fadeAlpha', 0.01, 0.3, 0.005);
gui.add(params, 'glowStrength', 0, 2, 0.05);

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
  params.brownian = rand(0.1, 2.5, 0.05);
  params.windX = rand(-1.5, 1.5, 0.05);
  params.windY = rand(-0.8, 0.2, 0.05);
  params.gravity = rand(0, 0.2, 0.005);
  params.pollenHue = rand(30, 90, 1);
  params.pollenSize = rand(1.5, 7, 0.5);
  params.glowStrength = rand(0, 1.5, 0.05);
  initPollen();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initPollen();
  gui.updateDisplay();
});
