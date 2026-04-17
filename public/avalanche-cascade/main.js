// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 雪崩のカスケードをパーティクルで表現する。
// 上部から粒子が生まれ、斜面を流れ落ちながら分岐・衝突する。

const params = {
  spawnRate: 8, // 1フレームの生成数
  gravity: 0.25, // 重力加速度
  bounce: 0.35, // 反発係数
  spread: 1.2, // 横への広がり
  slopeAngle: 35, // 斜面角度（度）
  snowHue: 210, // 雪の色相
  trailFade: 0.12, // 軌跡フェード
  maxParticles: 2000, // 最大パーティクル数
  windStrength: 0.3, // 風の強さ
  snowSize: 2.0, // 雪粒サイズ
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

/** @typedef {{ x: number, y: number, vx: number, vy: number, life: number, size: number }} Snowflake */

/** @type {Snowflake[]} */
let flakes = [];

let time = 0;

/**
 * 新しい雪粒を生成する
 */
function spawnFlake() {
  const w = canvas.width;
  const x = w * 0.2 + Math.random() * w * 0.3;
  const angle = (params.slopeAngle * Math.PI) / 180;
  const speed = 1 + Math.random() * 2;
  flakes.push({
    x,
    y: canvas.height * 0.08 + Math.random() * canvas.height * 0.05,
    vx: Math.cos(angle) * speed * (Math.random() - 0.3),
    vy: Math.sin(angle) * speed,
    life: 1.0,
    size: params.snowSize * (0.5 + Math.random() * 0.8),
  });
}

/**
 * 雪粒を1ステップ更新する
 * @param {Snowflake} f
 * @returns {boolean} 生存していればtrue
 */
function updateFlake(f) {
  // 風の揺れ
  const wind = Math.sin(time * 1.3 + f.x * 0.01) * params.windStrength * 0.02;
  f.vx += wind + (Math.random() - 0.5) * params.spread * 0.05;
  f.vy += params.gravity * 0.05;

  f.x += f.vx;
  f.y += f.vy;

  // 斜面との反発（斜面=Y方向に傾いた面）
  const angle = (params.slopeAngle * Math.PI) / 180;
  const slopeY =
    canvas.height * 0.15 + Math.tan(angle) * (f.x - canvas.width * 0.2);
  if (f.y > slopeY) {
    f.y = slopeY;
    // 斜面法線で反発
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const dot = f.vx * nx + f.vy * ny;
    f.vx = (f.vx - 2 * dot * nx) * params.bounce + (Math.random() - 0.5) * 0.5;
    f.vy = (f.vy - 2 * dot * ny) * params.bounce;
  }

  f.life -= 0.004;
  return f.life > 0 && f.y < canvas.height + 20;
}

function draw() {
  time += 0.016;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, w, h);

  // 斜面ライン描画
  const angle = (params.slopeAngle * Math.PI) / 180;
  const slopeStartX = w * 0.05;
  const slopeStartY = h * 0.12;
  const slopeEndX = w * 0.75;
  const slopeEndY = slopeStartY + Math.tan(angle) * (slopeEndX - slopeStartX);
  ctx.strokeStyle = 'rgba(150, 180, 220, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(slopeStartX, slopeStartY);
  ctx.lineTo(slopeEndX, slopeEndY);
  ctx.stroke();

  // 雪粒スポーン
  for (let i = 0; i < params.spawnRate; i++) {
    if (flakes.length < params.maxParticles) spawnFlake();
  }

  // 更新と描画
  flakes = flakes.filter((f) => {
    const alive = updateFlake(f);
    if (alive) {
      const brightness = 70 + f.life * 25;
      ctx.fillStyle = `hsla(${params.snowHue}, 30%, ${brightness}%, ${f.life})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }
    return alive;
  });
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Avalanche Cascade',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'spawnRate', 1, 30, 1);
gui.add(params, 'gravity', 0.05, 1.0, 0.01);
gui.add(params, 'bounce', 0.0, 0.9, 0.01);
gui.add(params, 'spread', 0, 3.0, 0.05);
gui.add(params, 'slopeAngle', 10, 70, 1);
gui.add(params, 'snowHue', 0, 360, 1);
gui.add(params, 'trailFade', 0.02, 0.5, 0.01);
gui.add(params, 'windStrength', 0, 2.0, 0.05);
gui.add(params, 'snowSize', 0.5, 5.0, 0.1);

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
  params.gravity = rand(0.1, 0.8, 0.01);
  params.bounce = rand(0.1, 0.8, 0.01);
  params.spread = rand(0.2, 2.5, 0.05);
  params.slopeAngle = rand(15, 60, 1);
  params.snowHue = rand(180, 240, 1);
  params.windStrength = rand(0.1, 1.5, 0.05);
  params.snowSize = rand(0.8, 3.5, 0.1);
  flakes = [];
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  flakes = [];
  gui.updateDisplay();
});
