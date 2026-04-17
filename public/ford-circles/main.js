// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Ford 円: 各既約分数 p/q に対し中心 (p/q, 1/(2q²))、半径 1/(2q²) の円
const params = {
  qMax: 30,
  scale: 1.0,
  lineWidth: 1,
  hue: 200,
  hueShift: 8,
  saturation: 70,
  lightness: 55,
  alpha: 0.85,
  fill: false,
  glow: 4,
  offsetY: 0.4,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
let dirty = true;
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  dirty = true;
}
addEventListener('resize', resize);

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const w = canvas.width;
  const h = canvas.height;
  const baseY = h * params.offsetY;
  const W = w * 0.9 * params.scale;
  const x0 = (w - W) / 2;
  const qMax = Math.max(2, params.qMax | 0);
  for (let q = 1; q <= qMax; q++) {
    for (let p = 0; p <= q; p++) {
      if (p !== 0 && p !== q && gcd(p, q) !== 1) continue;
      const r = (W / 2) * (1 / (q * q));
      const cx = x0 + (p / q) * W;
      const cy = baseY - r;
      const hue = (params.hue + q * params.hueShift) % 360;
      const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
      ctx.lineWidth = params.lineWidth;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      if (params.fill) {
        ctx.fillStyle = color;
        ctx.fill();
      }
      ctx.stroke();
    }
  }
  // 基線
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(x0, baseY);
  ctx.lineTo(x0 + W, baseY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function tick() {
  if (dirty) {
    draw();
    dirty = false;
  }
  requestAnimationFrame(tick);
}
resize();
tick();

const gui = new TileUI({
  title: 'Ford Circles',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
function onChange() {
  dirty = true;
}
gui.add(params, 'qMax', 5, 80, 1).onChange(onChange);
gui.add(params, 'scale', 0.5, 2, 0.01).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 30, 0.5).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'offsetY', 0.2, 0.9, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'fill').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.qMax = rand(15, 60, 1);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(1, 20, 0.5);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.fill = Math.random() > 0.5;
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
