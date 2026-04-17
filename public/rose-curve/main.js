// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  n: 5, // 花弁の個数パラメータ
  d: 4, // 振幅パラメータ
  amp: 0.42, // 振幅（画面短辺に対する比率）
  step: 0.01, // 角度ステップ
  cycles: 8, // 全周期数
  speed: 1.2, // 描画速度
  lineWidth: 1.4, // 線の太さ
  hue: 330, // 色相
  hueShift: 0.5, // 色相シフト
  glow: 8, // グロー
  trailFade: 0.04, // 残像のフェード
  thickness: 1.0, // 波の太さ変調
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clearCanvas();
}
function clearCanvas() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

let theta = 0;
let time = 0;

function step() {
  time += 1 / 60;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r0 = Math.min(canvas.width, canvas.height) * params.amp;

  ctx.fillStyle = `rgba(8, 8, 12, ${Math.max(0, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sub = 40;
  const dtheta = params.step * params.speed;
  ctx.lineWidth = params.lineWidth * params.thickness;
  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;
  const k = params.n / Math.max(1, params.d);

  for (let i = 0; i < sub; i++) {
    const a = theta;
    const b = theta + dtheta;
    const r1 = r0 * Math.cos(k * a);
    const r2 = r0 * Math.cos(k * b);
    const x1 = cx + r1 * Math.cos(a);
    const y1 = cy + r1 * Math.sin(a);
    const x2 = cx + r2 * Math.cos(b);
    const y2 = cy + r2 * Math.sin(b);
    const hue = (params.hue + time * params.hueShift * 60 + a * 10) % 360;
    const stroke = `hsla(${hue}, 85%, 65%, 0.85)`;
    ctx.strokeStyle = stroke;
    ctx.shadowColor = stroke;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    theta = b;
  }
  ctx.shadowBlur = 0;
  if (theta > Math.PI * 2 * params.cycles) theta = 0;
}

function tick() {
  step();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Rose Curve',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'n', 1, 20, 1);
gui.add(params, 'd', 1, 20, 1);
gui.add(params, 'amp', 0.1, 0.49, 0.01);
gui.add(params, 'step', 0.002, 0.05, 0.001);
gui.add(params, 'cycles', 1, 40, 1);
gui.add(params, 'speed', 0.1, 4, 0.05);
gui.add(params, 'lineWidth', 0.3, 5, 0.05);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueShift', 0, 2, 0.01);
gui.add(params, 'glow', 0, 20, 0.5);
gui.add(params, 'trailFade', 0, 0.3, 0.005);
gui.add(params, 'thickness', 0.3, 3, 0.05);

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
  params.n = rand(2, 11, 1);
  params.d = rand(1, 7, 1);
  params.amp = rand(0.25, 0.45, 0.01);
  params.speed = rand(0.4, 2, 0.05);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0, 1, 0.01);
  params.lineWidth = rand(0.6, 2.5, 0.05);
  theta = 0;
  clearCanvas();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  theta = 0;
  clearCanvas();
  gui.updateDisplay();
});
