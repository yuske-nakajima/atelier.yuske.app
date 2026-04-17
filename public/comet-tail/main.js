// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 彗星の尾：楕円軌道を描く彗星と太陽風による輝く尾。
// 太陽に近いほど尾が長く明るくなる物理法則を模倣する。

const params = {
  orbitA: 0.7, // 楕円長半径（画面幅比）
  orbitB: 0.4, // 楕円短半径（画面高比）
  orbitSpeed: 0.004, // 軌道速度
  tailLength: 120, // 尾の長さ
  tailWidth: 12, // 尾の幅（最大）
  cometHue: 200, // 彗星色相（青白）
  tailHue: 40, // 尾の色相（黄橙）
  brightness: 75, // 明度
  trailCount: 500, // 粒子数
  dustHue: 50, // 塵の色相
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

/** @type {{x: number, y: number}[]} */
let trail = [];
let angle = 0;

/**
 * 楕円軌道上の位置を計算する（ケプラー運動近似）
 * @param {number} t 角度パラメータ
 * @returns {{x: number, y: number, speed: number}}
 */
function orbitPosition(t) {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w * 0.5;
  const cy = h * 0.5;
  const a = w * params.orbitA * 0.5;
  const b = h * params.orbitB * 0.5;
  const x = cx + a * Math.cos(t);
  const y = cy + b * Math.sin(t);
  // 速度は近点で速く（ケプラー第二法則近似）
  const r = Math.hypot(x - cx, y - cy);
  const maxR = Math.max(a, b);
  const speed = 0.5 + 1.5 * (1 - r / maxR);
  return { x, y, speed };
}

/** @typedef {{ x: number, y: number, vx: number, vy: number, life: number, size: number }} TailParticle */
/** @type {TailParticle[]} */
let dustParticles = [];

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const pos = orbitPosition(angle);

  // 近点に近いほど速く動く
  angle += params.orbitSpeed * (0.5 + pos.speed);

  ctx.fillStyle = 'rgba(5, 5, 12, 0.2)';
  ctx.fillRect(0, 0, w, h);

  // 軌跡を更新
  trail.unshift({ x: pos.x, y: pos.y });
  if (trail.length > params.tailLength) trail.pop();

  // 尾を描く（グラデーション線）
  for (let i = 1; i < trail.length; i++) {
    const t = 1 - i / trail.length;
    const width = params.tailWidth * t;
    const alpha = t * 0.8;
    const hue = params.cometHue + (1 - t) * (params.tailHue - params.cometHue);
    ctx.strokeStyle = `hsla(${hue}, 90%, ${params.brightness}%, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }

  // 塵のパーティクルを生成
  if (dustParticles.length < params.trailCount && trail.length > 1) {
    const idx = Math.floor(Math.random() * Math.min(20, trail.length - 1));
    const p = trail[idx];
    const spread = (20 - idx) * 0.5;
    dustParticles.push({
      x: p.x + (Math.random() - 0.5) * spread,
      y: p.y + (Math.random() - 0.5) * spread,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5 - 0.2,
      life: 0.8 + Math.random() * 0.2,
      size: 0.5 + Math.random() * 1.5,
    });
  }

  // 塵を更新・描画
  dustParticles = dustParticles.filter((dp) => {
    dp.x += dp.vx;
    dp.y += dp.vy;
    dp.life -= 0.012;
    if (dp.life > 0) {
      ctx.fillStyle = `hsla(${params.dustHue}, 80%, 70%, ${dp.life})`;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, dp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    return dp.life > 0;
  });

  // 彗星本体（光る核）
  const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 15);
  grd.addColorStop(0, `hsla(${params.cometHue}, 90%, 98%, 1)`);
  grd.addColorStop(0.4, `hsla(${params.cometHue}, 80%, 80%, 0.8)`);
  grd.addColorStop(1, `hsla(${params.cometHue}, 70%, 60%, 0)`);
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
  ctx.fill();

  // 太陽
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 20, 0, Math.PI * 2);
  ctx.fillStyle = 'hsl(50, 100%, 70%)';
  ctx.fill();
  ctx.shadowColor = 'hsl(40, 100%, 60%)';
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Comet Tail',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'orbitA', 0.2, 0.95, 0.01);
gui.add(params, 'orbitB', 0.1, 0.9, 0.01);
gui.add(params, 'orbitSpeed', 0.001, 0.02, 0.0005);
gui.add(params, 'tailLength', 20, 300, 5);
gui.add(params, 'tailWidth', 2, 30, 1);
gui.add(params, 'cometHue', 0, 360, 1);
gui.add(params, 'tailHue', 0, 360, 1);
gui.add(params, 'brightness', 40, 100, 1);
gui.add(params, 'dustHue', 0, 360, 1);

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
  params.orbitA = rand(0.3, 0.9, 0.01);
  params.orbitB = rand(0.2, 0.8, 0.01);
  params.tailLength = rand(40, 200, 5);
  params.tailWidth = rand(4, 20, 1);
  params.cometHue = rand(0, 360, 1);
  params.tailHue = rand(0, 360, 1);
  trail = [];
  dustParticles = [];
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  trail = [];
  dustParticles = [];
  gui.updateDisplay();
});
