// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  emitRate: 12, // 1 フレームの粒子生成数
  buoyancy: 1.2, // 上昇の強さ
  turbulence: 0.8, // 渦の強さ
  turbScale: 0.005, // 渦のスケール
  drift: 0, // 横方向の流れ
  particleSize: 26, // 粒子の描画半径
  life: 3.0, // 粒子寿命（秒）
  maxParticles: 1500, // 粒子上限
  hue: 220, // 色相
  hueSpread: 30, // 色相のばらつき
  fadePower: 1.6, // 寿命のフェード曲線
  opacity: 0.18, // 1 粒子のアルファ
  glow: 0, // グロー
  emitterX: 0.5, // エミッター x 位置（正規化）
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

// --- パーティクル ---

/**
 * @typedef {{x: number, y: number, vx: number, vy: number, age: number, life: number, size: number, hue: number}} Particle
 */

/** @type {Particle[]} */
const particles = [];

function spawn() {
  if (particles.length >= params.maxParticles) return;
  const x = canvas.width * params.emitterX + (Math.random() - 0.5) * 20;
  const y = canvas.height - 10;
  particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 10,
    vy: -20 - Math.random() * 20,
    age: 0,
    life: params.life * (0.6 + Math.random() * 0.8),
    size: params.particleSize * (0.6 + Math.random() * 0.8),
    hue: params.hue + (Math.random() - 0.5) * params.hueSpread,
  });
}

// Simplex 風ではないが、連続感のある疑似ノイズ
/**
 * @param {number} x
 * @param {number} y
 * @param {number} t
 */
function curl(x, y, t) {
  const s = params.turbScale;
  const a = Math.sin(x * s + t * 0.7) + Math.cos(y * s * 1.3 - t * 0.5);
  const b = Math.cos(x * s * 1.1 - t * 0.6) + Math.sin(y * s + t * 0.4);
  return { x: a, y: b };
}

let time = 0;

function update(dt) {
  time += dt;
  for (let i = 0; i < Math.max(0, Math.round(params.emitRate)); i++) spawn();
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.life) {
      particles.splice(i, 1);
      continue;
    }
    const { x: cx, y: cy } = curl(p.x, p.y, time);
    p.vx += cx * params.turbulence * 30 * dt + params.drift * 60 * dt;
    p.vy += cy * params.turbulence * 20 * dt;
    p.vy -= params.buoyancy * 60 * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function render() {
  ctx.fillStyle = '#07080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowBlur = params.glow;
  for (const p of particles) {
    const t = p.age / p.life;
    const alpha = params.opacity * (1 - t) ** params.fadePower;
    const size = p.size * (0.5 + t * 1.2);
    const color = `hsla(${p.hue}, 50%, 60%, ${alpha})`;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
    ctx.fillStyle = grad;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// --- GUI ---

const gui = new TileUI({
  title: 'Smoke Plume',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'emitRate', 0, 40, 1);
gui.add(params, 'buoyancy', 0, 4, 0.05);
gui.add(params, 'turbulence', 0, 3, 0.05);
gui.add(params, 'turbScale', 0.001, 0.02, 0.0005);
gui.add(params, 'drift', -1, 1, 0.01);
gui.add(params, 'particleSize', 4, 80, 1);
gui.add(params, 'life', 0.5, 8, 0.1);
gui.add(params, 'maxParticles', 200, 4000, 50);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueSpread', 0, 180, 1);
gui.add(params, 'fadePower', 0.3, 4, 0.05);
gui.add(params, 'opacity', 0.02, 0.6, 0.01);
gui.add(params, 'glow', 0, 30, 0.5);
gui.add(params, 'emitterX', 0.05, 0.95, 0.01);

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
  params.emitRate = rand(4, 24, 1);
  params.buoyancy = rand(0.5, 2.5, 0.05);
  params.turbulence = rand(0.3, 2, 0.05);
  params.drift = rand(-0.3, 0.3, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueSpread = rand(10, 90, 1);
  params.particleSize = rand(14, 50, 1);
  params.opacity = rand(0.1, 0.3, 0.01);
  gui.updateDisplay();
});

gui.addButton('Clear', () => {
  particles.length = 0;
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  particles.length = 0;
  gui.updateDisplay();
});
