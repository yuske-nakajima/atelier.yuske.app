// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Hat モノタイル風の 13 辺ポリキテを簡略化した単位形で敷き詰める
const params = {
  size: 28,
  density: 0.92,
  rotateStep: 60,
  jitter: 0.08,
  lineWidth: 1.1,
  hue: 32,
  hueRange: 60,
  saturation: 55,
  lightness: 58,
  flipRatio: 0.18,
  bg: 8,
  glow: 6,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  dirty = true;
}
window.addEventListener('resize', resize);

// Hat 形を簡略化した 13 点の正規化座標（単位六角形格子単位）
const hatShape = [
  [0, 0],
  [1, 0],
  [1.5, 0.87],
  [2.5, 0.87],
  [3, 1.73],
  [2.5, 2.6],
  [1.5, 2.6],
  [1, 3.46],
  [0, 3.46],
  [-0.5, 2.6],
  [0, 1.73],
  [-0.5, 0.87],
  [0, 0],
];

function drawHat(cx, cy, size, rot, flip, color) {
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  ctx.beginPath();
  for (let i = 0; i < hatShape.length; i++) {
    let [x, y] = hatShape[i];
    x -= 1;
    y -= 1.73;
    if (flip) x = -x;
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    const px = cx + rx * size;
    const py = cy + ry * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = params.lineWidth;
  ctx.strokeStyle = `rgba(0,0,0,0.45)`;
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = `rgb(${params.bg}, ${params.bg}, ${params.bg + 4})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;

  const s = Math.max(8, params.size);
  const stepX = s * 3;
  const stepY = s * 3.4;
  const cols = Math.ceil(canvas.width / stepX) + 2;
  const rows = Math.ceil(canvas.height / stepY) + 2;

  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      if (Math.random() > params.density) continue;
      const offset = j % 2 === 0 ? 0 : stepX / 2;
      const cx =
        i * stepX + offset + Math.sin(i * 0.7 + j * 1.3) * params.jitter * s;
      const cy = j * stepY + Math.cos(i * 1.1 + j * 0.9) * params.jitter * s;
      const rotIdx = (i * 3 + j * 2 + ((i + j) & 1 ? 1 : 0)) | 0;
      const rot = (rotIdx * params.rotateStep * Math.PI) / 180;
      const flip = Math.sin(i * 7.3 + j * 3.1) * 0.5 + 0.5 < params.flipRatio;
      const hue =
        (params.hue + ((i * 13 + j * 7) % 360) * (params.hueRange / 360)) % 360;
      const color = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
      ctx.shadowColor = color;
      drawHat(cx, cy, s, rot, flip, color);
    }
  }
  ctx.shadowBlur = 0;
}

let dirty = true;
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
  title: 'Einstein Monotile Hat',
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
gui.add(params, 'size', 10, 80, 1).onChange(onChange);
gui.add(params, 'density', 0.2, 1, 0.01).onChange(onChange);
gui.add(params, 'rotateStep', 0, 120, 1).onChange(onChange);
gui.add(params, 'jitter', 0, 0.5, 0.01).onChange(onChange);
gui.add(params, 'lineWidth', 0, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueRange', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'flipRatio', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 30, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.size = rand(14, 50, 1);
  params.density = rand(0.6, 1, 0.01);
  params.rotateStep = rand(0, 120, 1);
  params.jitter = rand(0, 0.3, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueRange = rand(30, 200, 1);
  params.saturation = rand(30, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.flipRatio = rand(0, 0.5, 0.01);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
