// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  count: 120,
  radius: 200,
  speed: 1,
  size: 3,
  spread: 0.5,
  color: '#4ecdc4',
  bgColor: '#0a0a1a',
  glow: true,
  trail: true,
  visible: true,
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** Canvas をウィンドウサイズに合わせる */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- パーティクル ---

/**
 * @typedef {{ x: number, y: number, angle: number, orbitRadius: number, orbitSpeed: number, phase: number, size: number }} Particle
 */

/** @type {Particle[]} */
let particles = [];

/** パーティクルを生成 */
function createParticles() {
  particles = [];
  for (let i = 0; i < params.count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const orbitRadius =
      params.radius * (0.3 + Math.random() * 0.7) * params.spread;
    particles.push({
      x: 0,
      y: 0,
      angle,
      orbitRadius,
      orbitSpeed: (0.5 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1),
      phase: Math.random() * Math.PI * 2,
      size: 0.5 + Math.random() * 1.5,
    });
  }
}

createParticles();

/**
 * hex → RGB 分解
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
function hexToRgb(hex) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

// --- 描画 ---

let time = 0;

/** メインの描画ループ */
function draw() {
  if (params.trail) {
    // 残像効果
    ctx.fillStyle = `${params.bgColor}33`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = params.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (!params.visible) {
    requestAnimationFrame(draw);
    return;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const { r, g, b } = hexToRgb(params.color);

  if (params.glow) {
    ctx.shadowColor = params.color;
    ctx.shadowBlur = 15;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  for (const p of particles) {
    // 軌道を更新
    p.angle += p.orbitSpeed * params.speed * 0.01;

    // リサジュー曲線風の軌道
    const rx = p.orbitRadius * params.spread;
    const ry = p.orbitRadius * params.spread * 0.6;
    p.x =
      cx +
      Math.cos(p.angle) * rx +
      Math.sin(p.angle * 0.7 + p.phase) * rx * 0.3;
    p.y =
      cy +
      Math.sin(p.angle) * ry +
      Math.cos(p.angle * 0.5 + p.phase) * ry * 0.4;

    // 距離に応じた明るさ
    const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
    const maxDist = Math.max(canvas.width, canvas.height) * 0.5;
    const brightness = 0.4 + 0.6 * (1 - Math.min(dist / maxDist, 1));
    const alpha = 0.5 + Math.sin(time * 2 + p.phase) * 0.3;

    ctx.beginPath();
    ctx.fillStyle = `rgba(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)}, ${alpha})`;
    ctx.arc(p.x, p.y, p.size * params.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  time += 0.016 * params.speed;

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI トグル（モバイル） ---

const guiWrapper = /** @type {HTMLElement} */ (
  document.getElementById('gui-wrapper')
);
const guiToggle = /** @type {HTMLButtonElement} */ (
  document.getElementById('gui-toggle')
);

// モバイルでは初期状態を閉じておく
const mql = window.matchMedia('(max-width: 768px)');
if (mql.matches) {
  guiWrapper.classList.add('collapsed');
}
mql.addEventListener('change', (e) => {
  if (e.matches) {
    guiWrapper.classList.add('collapsed');
  } else {
    guiWrapper.classList.remove('collapsed');
  }
});

guiToggle.addEventListener('click', () => {
  guiWrapper.classList.toggle('collapsed');
});

// --- GUI セットアップ ---

const guiContainer = /** @type {HTMLElement} */ (
  document.getElementById('gui-container')
);
const gui = new TileUI({
  title: 'Particles',
  container: guiContainer,
});

gui.add(params, 'count', 10, 500, 10).onChange(() => {
  createParticles();
});
gui.add(params, 'radius', 50, 500, 10);
gui.add(params, 'speed', 0.1, 5, 0.1);
gui.add(params, 'size', 0.5, 10, 0.5);
gui.add(params, 'spread', 0.1, 2, 0.1);
gui.addBoolean(params, 'visible');

gui.addColor(params, 'color');
gui.addColor(params, 'bgColor');
gui.addBoolean(params, 'glow');
gui.addBoolean(params, 'trail');

gui.addButton('Random', () => {
  params.count = Math.round((10 + Math.random() * 490) / 10) * 10;
  params.radius = Math.round((50 + Math.random() * 450) / 10) * 10;
  params.speed = Math.round((0.1 + Math.random() * 4.9) * 10) / 10;
  params.size = Math.round((0.5 + Math.random() * 9.5) * 2) / 2;
  params.spread = Math.round((0.1 + Math.random() * 1.9) * 10) / 10;
  params.color = `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
  params.glow = Math.random() > 0.3;
  params.trail = Math.random() > 0.3;
  createParticles();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  createParticles();
  time = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gui.updateDisplay();
});
