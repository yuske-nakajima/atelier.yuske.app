// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Lévy C Curve（再帰的に 45°で分岐するフラクタル曲線）
const params = {
  depth: 12,
  angle: 45,
  lineWidth: 1.2,
  hue: 210,
  hueShift: 0.5,
  saturation: 70,
  lightness: 60,
  alpha: 0.9,
  scale: 0.9,
  rotation: 0,
  glow: 6,
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

/**
 * 線分 (x1,y1)-(x2,y2) を Lévy C で再帰的に描画
 */
function levy(x1, y1, x2, y2, depth, angle) {
  if (depth === 0) {
    ctx.lineTo(x2, y2);
    return;
  }
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // 中点から直交方向に出る点
  const r = Math.tan((angle * Math.PI) / 180) / 2;
  const px = mx - dy * r;
  const py = my + dx * r;
  levy(x1, y1, px, py, depth - 1, angle);
  levy(px, py, x2, y2, depth - 1, angle);
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const size = Math.min(canvas.width, canvas.height) * 0.4 * params.scale;
  const rot = (params.rotation * Math.PI) / 180;
  const x1 = cx - (Math.cos(rot) * size) / 2;
  const y1 = cy - (Math.sin(rot) * size) / 2 + size * 0.2;
  const x2 = cx + (Math.cos(rot) * size) / 2;
  const y2 = cy + (Math.sin(rot) * size) / 2 + size * 0.2;
  ctx.lineWidth = params.lineWidth;
  const hue = params.hue;
  const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  levy(
    x1,
    y1,
    x2,
    y2,
    Math.max(0, Math.min(16, params.depth | 0)),
    params.angle,
  );
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
  title: 'Lévy C Curve',
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
gui.add(params, 'depth', 0, 16, 1).onChange(onChange);
gui.add(params, 'angle', 0, 89, 0.5).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 2, 0.01).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'scale', 0.3, 1.5, 0.01).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'glow', 0, 30, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(8, 14, 1);
  params.angle = rand(20, 70, 0.5);
  params.hue = rand(0, 360, 1);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotation = rand(0, 360, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
