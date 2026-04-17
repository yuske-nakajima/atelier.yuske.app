// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Socolar-Taylor 風の装飾付き六角形タイルを配置する
const params = {
  size: 36,
  arcWidth: 3,
  colorA: 210,
  colorB: 30,
  saturation: 60,
  lightness: 55,
  bg: 10,
  showEdge: true,
  rotateSteps: 6,
  jitter: 0,
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

function hex(cx, cy, s, rot) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rot;
    pts.push([cx + Math.cos(a) * s, cy + Math.sin(a) * s]);
  }
  return pts;
}

function drawTile(cx, cy, s, rotIdx) {
  const rot = (rotIdx * 60 * Math.PI) / 180;
  const pts = hex(cx, cy, s, rot);
  const hue = rotIdx % 2 === 0 ? params.colorA : params.colorB;
  ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.shadowColor = ctx.fillStyle;
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i) ctx.lineTo(p[0], p[1]);
    else ctx.moveTo(p[0], p[1]);
  });
  ctx.closePath();
  ctx.fill();
  if (params.showEdge) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.stroke();
  }
  // 装飾弧
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = params.arcWidth;
  for (let k = 0; k < 3; k++) {
    const a1 = rot + (k * Math.PI * 2) / 3;
    const a2 = a1 + Math.PI / 3;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.66, a1, a2);
    ctx.stroke();
  }
}

function draw() {
  ctx.fillStyle = `rgb(${params.bg},${params.bg},${params.bg + 4})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const s = Math.max(10, params.size);
  const dx = s * 1.732;
  const dy = s * 1.5;
  const cols = Math.ceil(canvas.width / dx) + 2;
  const rows = Math.ceil(canvas.height / dy) + 2;
  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      const offset = (j & 1) * (dx / 2);
      const cx = i * dx + offset + (Math.random() - 0.5) * params.jitter * s;
      const cy = j * dy + (Math.random() - 0.5) * params.jitter * s;
      const rotIdx = (i * 2 + j * 3) % params.rotateSteps;
      drawTile(cx, cy, s, rotIdx);
    }
  }
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
  title: 'Socolar–Taylor Tile',
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
gui.add(params, 'size', 12, 80, 1).onChange(onChange);
gui.add(params, 'arcWidth', 0, 10, 0.1).onChange(onChange);
gui.add(params, 'colorA', 0, 360, 1).onChange(onChange);
gui.add(params, 'colorB', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'rotateSteps', 2, 12, 1).onChange(onChange);
gui.add(params, 'jitter', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 30, 0.5).onChange(onChange);
gui.add(params, 'showEdge').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.size = rand(16, 60, 1);
  params.arcWidth = rand(1, 6, 0.1);
  params.colorA = rand(0, 360, 1);
  params.colorB = rand(0, 360, 1);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotateSteps = rand(2, 8, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
