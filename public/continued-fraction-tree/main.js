// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 連分数展開の木: 各整数部で分岐
const params = {
  maxDepth: 6,
  maxBranch: 5,
  angleSpread: 50,
  initialLength: 180,
  shrink: 0.72,
  lineWidth: 1.2,
  hue: 45,
  hueShift: 25,
  saturation: 65,
  lightness: 60,
  alpha: 0.9,
  rotation: 0,
  glow: 5,
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

function drawBranch(x, y, len, angle, depth, maxDepth, branch, maxBranch) {
  if (depth > maxDepth || len < 1) return;
  const x2 = x + Math.cos(angle) * len;
  const y2 = y + Math.sin(angle) * len;
  const hue = (params.hue + depth * params.hueShift) % 360;
  const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.lineWidth = Math.max(
    0.3,
    params.lineWidth * (1 - depth / (maxDepth + 2)),
  );
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const b = Math.max(1, maxBranch - depth);
  const spread = (params.angleSpread * Math.PI) / 180;
  for (let i = 0; i < b; i++) {
    const t = b === 1 ? 0 : (i / (b - 1)) * 2 - 1;
    const na = angle + t * spread;
    drawBranch(
      x2,
      y2,
      len * params.shrink,
      na,
      depth + 1,
      maxDepth,
      branch,
      maxBranch,
    );
  }
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const cx = canvas.width / 2;
  const cy = canvas.height - 80;
  const rot = -Math.PI / 2 + (params.rotation * Math.PI) / 180;
  drawBranch(
    cx,
    cy,
    params.initialLength,
    rot,
    0,
    Math.max(0, Math.min(9, params.maxDepth | 0)),
    0,
    Math.max(1, params.maxBranch | 0),
  );
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
  title: 'Continued Fraction Tree',
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
gui.add(params, 'maxDepth', 1, 9, 1).onChange(onChange);
gui.add(params, 'maxBranch', 1, 8, 1).onChange(onChange);
gui.add(params, 'angleSpread', 0, 180, 1).onChange(onChange);
gui.add(params, 'initialLength', 40, 400, 1).onChange(onChange);
gui.add(params, 'shrink', 0.4, 0.95, 0.01).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 90, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'rotation', -90, 90, 1).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.maxDepth = rand(4, 7, 1);
  params.maxBranch = rand(2, 5, 1);
  params.angleSpread = rand(20, 90, 1);
  params.shrink = rand(0.6, 0.85, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(10, 50, 1);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotation = rand(-30, 30, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
