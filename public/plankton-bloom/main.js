// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// プランクトンブルーム：海面を覆う植物プランクトンの大増殖を表現。
// 渦巻きと拡散で海洋ブルームの美しいパターンを生成する。

const params = {
  count: 2000, // プランクトン数
  diffusion: 0.8, // 拡散速度
  vortexStrength: 0.6, // 渦の強さ
  bloom: 0.008, // 増殖率
  maxPop: 4000, // 最大個体数
  hueBase: 160, // 基本色相（海緑）
  hueVar: 60, // 色相のばらつき
  saturation: 75, // 彩度
  brightness: 55, // 明度
  fadeAlpha: 0.08, // フェード強度
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

/** @typedef {{ x: number, y: number, vx: number, vy: number, hue: number, size: number }} Plankton */

/** @type {Plankton[]} */
let plankton = [];

/**
 * プランクトンを初期化する
 */
function initPlankton() {
  plankton = [];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < params.count; i++) {
    plankton.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * params.diffusion,
      vy: (Math.random() - 0.5) * params.diffusion,
      hue: params.hueBase + (Math.random() - 0.5) * params.hueVar,
      size: 1 + Math.random() * 2,
    });
  }
}

initPlankton();

let time = 0;

/**
 * プランクトンを1ステップ更新する
 * @param {Plankton} p
 */
function updatePlankton(p) {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  // 複数の渦（カルマン渦列のような渦）
  const vortices = [
    { x: cx - w * 0.2, y: cy, strength: params.vortexStrength },
    { x: cx + w * 0.2, y: cy, strength: -params.vortexStrength * 0.8 },
    { x: cx, y: cy - h * 0.25, strength: params.vortexStrength * 0.5 },
  ];

  for (const vortex of vortices) {
    const dx = p.x - vortex.x;
    const dy = p.y - vortex.y;
    const dist = Math.max(10, Math.hypot(dx, dy));
    const force = vortex.strength / (dist * 0.1);
    p.vx += -dy * force * 0.001;
    p.vy += dx * force * 0.001;
  }

  // 拡散
  p.vx += (Math.random() - 0.5) * params.diffusion * 0.1;
  p.vy += (Math.random() - 0.5) * params.diffusion * 0.1;

  // 速度制限
  const speed = Math.hypot(p.vx, p.vy);
  const maxSpeed = params.diffusion * 2;
  if (speed > maxSpeed) {
    p.vx = (p.vx / speed) * maxSpeed;
    p.vy = (p.vy / speed) * maxSpeed;
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
  time += 0.016;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(5, 15, 20, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  // 増殖
  if (plankton.length < params.maxPop && Math.random() < params.bloom) {
    const parent = plankton[Math.floor(Math.random() * plankton.length)];
    if (parent) {
      plankton.push({
        x: parent.x + (Math.random() - 0.5) * 10,
        y: parent.y + (Math.random() - 0.5) * 10,
        vx: parent.vx + (Math.random() - 0.5) * 0.5,
        vy: parent.vy + (Math.random() - 0.5) * 0.5,
        hue: parent.hue + (Math.random() - 0.5) * 20,
        size: 1 + Math.random() * 2,
      });
    }
  }

  for (const p of plankton) {
    updatePlankton(p);
    const alpha = 0.5 + Math.sin(time * 2 + p.x * 0.01) * 0.2;
    ctx.fillStyle = `hsla(${p.hue}, ${params.saturation}%, ${params.brightness}%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
  title: 'Plankton Bloom',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 500, 5000, 100).onChange(initPlankton);
gui.add(params, 'diffusion', 0.1, 3, 0.05);
gui.add(params, 'vortexStrength', 0, 2, 0.05);
gui.add(params, 'bloom', 0, 0.05, 0.001);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueVar', 0, 180, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'brightness', 10, 90, 1);
gui.add(params, 'fadeAlpha', 0.01, 0.5, 0.01);

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
  params.diffusion = rand(0.2, 2, 0.05);
  params.vortexStrength = rand(0.1, 1.5, 0.05);
  params.bloom = rand(0.002, 0.03, 0.001);
  params.hueBase = rand(0, 360, 1);
  params.hueVar = rand(20, 120, 1);
  params.saturation = rand(50, 95, 1);
  params.brightness = rand(30, 75, 1);
  initPlankton();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initPlankton();
  gui.updateDisplay();
});
