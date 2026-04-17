// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  fx1: 2.01, // x 成分周波数 1
  fx2: 3.0, // x 成分周波数 2
  fy1: 3.0, // y 成分周波数 1
  fy2: 2.0, // y 成分周波数 2
  px1: 0, // x 位相 1（度）
  py1: 90, // y 位相 1（度）
  damping: 0.002, // 減衰係数
  scale: 0.38, // 全体スケール（画面短辺に対する比率）
  speed: 1.0, // 描画速度
  hue: 210, // 色相
  hueShift: 0.2, // 色相シフト（時間比例）
  lineWidth: 1.2, // 線の太さ
  glow: 6, // グロー
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

let t = 0;

function pos(tt) {
  const e = Math.exp(-params.damping * tt);
  const rx1 = (params.px1 * Math.PI) / 180;
  const ry1 = (params.py1 * Math.PI) / 180;
  const x = e * (Math.sin(tt * params.fx1 + rx1) + Math.sin(tt * params.fx2));
  const y = e * (Math.sin(tt * params.fy1 + ry1) + Math.sin(tt * params.fy2));
  return [x, y];
}

function step() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const s = Math.min(canvas.width, canvas.height) * params.scale * 0.5;
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;
  const sub = 40;
  const dt = (0.01 * params.speed) / sub;
  for (let k = 0; k < sub; k++) {
    const [x1, y1] = pos(t);
    t += dt;
    const [x2, y2] = pos(t);
    const hue = (params.hue + t * params.hueShift * 20) % 360;
    const stroke = `hsla(${hue}, 80%, 65%, 0.7)`;
    ctx.strokeStyle = stroke;
    ctx.shadowColor = stroke;
    ctx.beginPath();
    ctx.moveTo(cx + x1 * s, cy + y1 * s);
    ctx.lineTo(cx + x2 * s, cy + y2 * s);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function tick() {
  step();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Harmonograph',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'fx1', 0.5, 6, 0.01);
gui.add(params, 'fx2', 0.5, 6, 0.01);
gui.add(params, 'fy1', 0.5, 6, 0.01);
gui.add(params, 'fy2', 0.5, 6, 0.01);
gui.add(params, 'px1', 0, 360, 1);
gui.add(params, 'py1', 0, 360, 1);
gui.add(params, 'damping', 0, 0.02, 0.0005);
gui.add(params, 'scale', 0.1, 0.9, 0.01);
gui.add(params, 'speed', 0.1, 4, 0.05);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueShift', 0, 2, 0.01);
gui.add(params, 'lineWidth', 0.3, 4, 0.05);
gui.add(params, 'glow', 0, 20, 0.5);

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
  params.fx1 = rand(1.5, 4, 0.01);
  params.fx2 = rand(1.5, 4, 0.01);
  params.fy1 = rand(1.5, 4, 0.01);
  params.fy2 = rand(1.5, 4, 0.01);
  params.px1 = rand(0, 360, 1);
  params.py1 = rand(0, 360, 1);
  params.damping = rand(0, 0.005, 0.0005);
  params.hue = rand(0, 360, 1);
  t = 0;
  clearCanvas();
  gui.updateDisplay();
});

gui.addButton('Clear', () => {
  clearCanvas();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  t = 0;
  clearCanvas();
  gui.updateDisplay();
});
