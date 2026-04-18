// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  mass: 6000,
  lensX: 0.5,
  lensY: 0.5,
  stars: 300,
  hueStart: 200,
  hueRange: 120,
  resolution: 3,
  ringBrightness: 1.3,
  twinkle: 0.6,
  fade: 0.0,
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

/** @type {{x:number,y:number,brightness:number,hue:number,phase:number}[]} */
let stars = [];
function reseed() {
  stars = [];
  const n = Math.max(20, params.stars | 0);
  for (let i = 0; i < n; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      brightness: Math.random() * 0.8 + 0.4,
      hue: params.hueStart + Math.random() * params.hueRange,
      phase: Math.random() * Math.PI * 2,
    });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

let time = 0;
function tick() {
  time += 1 / 60;
  if (params.fade > 0) {
    ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#0b0a07';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const W = canvas.width,
    H = canvas.height;
  const lx = params.lensX * W,
    ly = params.lensY * H;
  const M = params.mass;
  // Einstein ring 表示
  const Rring = Math.sqrt(M);
  ctx.strokeStyle = `hsla(${params.hueStart}, 60%, 70%, 0.2)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(lx, ly, Rring, 0, Math.PI * 2);
  ctx.stroke();
  for (const s of stars) {
    const sx = s.x * W,
      sy = s.y * H;
    const dx = sx - lx,
      dy = sy - ly;
    const d2 = dx * dx + dy * dy + 100;
    // 重力偏向: θ_def = 4GM / (c² b)  → 画面空間で簡易化
    const bendFactor = M / d2;
    const bx = sx + dx * bendFactor;
    const by = sy + dy * bendFactor;
    // ダブルイメージ: 反対側にもう一つ
    const bx2 = sx - dx * bendFactor * 0.5;
    const by2 = sy - dy * bendFactor * 0.5;
    const twinkle = 1 + params.twinkle * 0.4 * Math.sin(time * 2 + s.phase);
    const mag = 1 + bendFactor * 2;
    const b = Math.min(1, s.brightness * twinkle * mag * params.ringBrightness);
    ctx.fillStyle = `hsla(${s.hue}, 80%, ${50 + b * 30}%, ${b})`;
    ctx.beginPath();
    ctx.arc(bx, by, 1 + b * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(bx2, by2, 0.8 + b * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 中心にブラックホール
  const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, Rring * 0.7);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Lensing',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'mass', 500, 30000, 10);
gui.add(params, 'lensX', 0.1, 0.9, 0.01);
gui.add(params, 'lensY', 0.1, 0.9, 0.01);
gui.add(params, 'stars', 50, 1500, 10);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'resolution', 1, 6, 1);
gui.add(params, 'ringBrightness', 0.2, 3, 0.01);
gui.add(params, 'twinkle', 0, 1.5, 0.01);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.addButton('Random', () => {
  params.mass = rand(2000, 15000, 10);
  params.lensX = rand(0.3, 0.7, 0.01);
  params.lensY = rand(0.3, 0.7, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.stars = rand(100, 800, 10);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
