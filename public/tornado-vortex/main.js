// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 竜巻の渦を模したパーティクルシステム。
// 高さによって回転半径と速度が変化し、竜巻らしい形状を生成する。

const params = {
  count: 1200, // パーティクル数
  height: 0.85, // 竜巻の高さ比率
  baseRadius: 0.18, // 底部の半径比率
  topRadius: 0.03, // 頂部の半径比率
  rotSpeed: 1.8, // 回転速度
  riseSpeed: 0.6, // 上昇速度
  turbulence: 0.4, // 乱流強度
  hueBase: 200, // 基本色相（青系）
  hueRange: 60, // 色相の範囲
  fadeAlpha: 0.15, // フェード強度
  particleSize: 2.2, // パーティクルサイズ
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

/** @typedef {{ x: number, y: number, z: number, angle: number, speed: number, hue: number }} Particle */

/** @type {Particle[]} */
let particles = [];

/**
 * パーティクルを初期化する
 */
function initParticles() {
  particles = [];
  for (let i = 0; i < params.count; i++) {
    const z = Math.random(); // 0=底、1=上
    const angle = Math.random() * Math.PI * 2;
    const r = params.baseRadius + (params.topRadius - params.baseRadius) * z;
    const noise = (Math.random() - 0.5) * 0.05;
    particles.push({
      x: Math.cos(angle) * (r + noise),
      y: Math.sin(angle) * (r + noise),
      z,
      angle,
      speed: 0.5 + Math.random() * 0.5,
      hue: params.hueBase + Math.random() * params.hueRange,
    });
  }
}

initParticles();

/**
 * パーティクルを1ステップ更新する
 * @param {Particle} p
 */
function updateParticle(p) {
  // 高さに応じた回転半径（底が広く、上が狭い）
  const r = params.baseRadius + (params.topRadius - params.baseRadius) * p.z;
  // 高さに応じた角速度（上に行くほど速い）
  const omega = params.rotSpeed * (0.5 + p.z) * p.speed;
  p.angle += omega * 0.016;

  // 乱流ノイズ
  const nx = (Math.random() - 0.5) * params.turbulence * 0.01;
  const ny = (Math.random() - 0.5) * params.turbulence * 0.01;

  p.x = Math.cos(p.angle) * r + nx;
  p.y = Math.sin(p.angle) * r + ny;

  // 上昇
  p.z += params.riseSpeed * 0.002 * p.speed;
  if (p.z > 1) {
    // 底からリセット
    p.z = 0;
    p.angle = Math.random() * Math.PI * 2;
  }
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  // フェード
  ctx.fillStyle = `rgba(11, 10, 7, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const baseY = h * 0.9;
  const tornadoH = h * params.height;

  for (const p of particles) {
    updateParticle(p);

    // 3D -> 2D 投影
    const screenX = cx + p.x * w;
    const screenY = baseY - p.z * tornadoH;

    // 高さに応じて明るさと透明度変化
    const brightness = 45 + p.z * 35;
    const alpha = 0.5 + p.z * 0.5;
    ctx.fillStyle = `hsla(${p.hue}, 70%, ${brightness}%, ${alpha})`;
    const size = params.particleSize * (0.5 + p.z * 0.8);
    ctx.beginPath();
    ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Tornado Vortex',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 200, 3000, 100).onChange(initParticles);
gui.add(params, 'height', 0.3, 1.0, 0.01);
gui.add(params, 'baseRadius', 0.05, 0.4, 0.01);
gui.add(params, 'topRadius', 0.01, 0.15, 0.005);
gui.add(params, 'rotSpeed', 0.2, 5.0, 0.1);
gui.add(params, 'riseSpeed', 0.1, 2.0, 0.05);
gui.add(params, 'turbulence', 0, 2.0, 0.05);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 180, 1);
gui.add(params, 'fadeAlpha', 0.02, 0.5, 0.01);
gui.add(params, 'particleSize', 0.5, 6, 0.1);

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
  params.rotSpeed = rand(0.5, 4.0, 0.1);
  params.riseSpeed = rand(0.2, 1.5, 0.05);
  params.turbulence = rand(0.1, 1.5, 0.05);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(20, 120, 1);
  params.baseRadius = rand(0.08, 0.3, 0.01);
  params.topRadius = rand(0.01, 0.08, 0.005);
  params.particleSize = rand(0.8, 4.0, 0.1);
  initParticles();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initParticles();
  gui.updateDisplay();
});
