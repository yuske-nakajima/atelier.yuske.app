// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 砂嵐：激しい風に舞う砂塵のビジュアル。
// 複数の風の層が砂粒を異なる速度で運ぶ様子を表現する。

const params = {
  particleCount: 3000, // 砂粒の数
  windSpeed: 5.0, // 基本風速
  windAngle: 15, // 風の角度（度）
  turbulence: 1.5, // 乱流強度
  gustFreq: 0.8, // 突風の周期
  gustStrength: 3.0, // 突風の強さ
  hueBase: 35, // 基本色相（砂色）
  hueRange: 25, // 色相レンジ
  brightness: 55, // 明度
  fadeAlpha: 0.25, // フェード強度
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
}
window.addEventListener('resize', resize);

/** @typedef {{ x: number, y: number, vx: number, vy: number, size: number, hue: number, layer: number }} DustParticle */
/** @type {DustParticle[]} */
let particles = [];

/**
 * 砂粒を初期化する
 */
function initParticles() {
  particles = [];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < params.particleCount; i++) {
    const layer = Math.floor(Math.random() * 3); // 0=近景 1=中景 2=遠景
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0,
      vy: 0,
      size: (3 - layer) * (0.5 + Math.random()),
      hue: params.hueBase + (Math.random() - 0.5) * params.hueRange,
      layer,
    });
  }
}

resize();

let time = 0;

/**
 * 砂粒を1ステップ更新する
 * @param {DustParticle} p
 */
function updateParticle(p) {
  const w = canvas.width;
  const h = canvas.height;
  const angle = (params.windAngle * Math.PI) / 180;
  const windScale = 1 - p.layer * 0.3; // 遠景は遅い
  const gust =
    Math.sin(time * params.gustFreq + p.x * 0.01) * params.gustStrength;
  const wx = Math.cos(angle) * (params.windSpeed + gust) * windScale;
  const wy = Math.sin(angle) * (params.windSpeed + gust) * windScale * 0.3;

  p.vx = wx + (Math.random() - 0.5) * params.turbulence;
  p.vy = wy + (Math.random() - 0.5) * params.turbulence * 0.5;

  p.x += p.vx;
  p.y += p.vy;

  // 画面外から再出現
  if (p.x > w + 20) p.x = -20;
  if (p.x < -20) p.x = w + 20;
  if (p.y > h + 20) p.y = -20;
  if (p.y < -20) p.y = h + 20;
}

function draw() {
  time += 0.016;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(15, 12, 8, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  for (const p of particles) {
    updateParticle(p);
    const speed = Math.hypot(p.vx, p.vy);
    const alpha = 0.3 + (speed / 10) * 0.5;
    const lig = params.brightness - p.layer * 10;
    ctx.fillStyle = `hsla(${p.hue}, 55%, ${lig}%, ${alpha})`;
    ctx.beginPath();
    // 速度に応じて引き伸ばす
    ctx.ellipse(
      p.x,
      p.y,
      p.size * (1 + speed * 0.1),
      p.size * 0.4,
      Math.atan2(p.vy, p.vx),
      0,
      Math.PI * 2,
    );
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
  title: 'Dust Storm',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'particleCount', 500, 8000, 250).onChange(initParticles);
gui.add(params, 'windSpeed', 0, 15, 0.5);
gui.add(params, 'windAngle', -45, 45, 1);
gui.add(params, 'turbulence', 0, 5, 0.1);
gui.add(params, 'gustFreq', 0, 3, 0.05);
gui.add(params, 'gustStrength', 0, 10, 0.1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 90, 1);
gui.add(params, 'brightness', 20, 80, 1);
gui.add(params, 'fadeAlpha', 0.05, 0.8, 0.01);

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
  params.windSpeed = rand(1, 12, 0.5);
  params.windAngle = rand(-30, 30, 1);
  params.turbulence = rand(0.2, 4, 0.1);
  params.gustStrength = rand(0.5, 8, 0.1);
  params.hueBase = rand(20, 60, 1);
  params.brightness = rand(30, 70, 1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
