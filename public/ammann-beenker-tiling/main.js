// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 正八角形と 45°菱形を交互に配置する Ammann–Beenker 風タイル
const params = {
  size: 40,
  ratio: 0.6,
  hue: 190,
  hueShift: 60,
  saturation: 55,
  lightness: 55,
  bg: 10,
  edgeAlpha: 0.4,
  rotation: 0,
  jitter: 0,
  glow: 4,
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

function poly(cx, cy, n, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rot;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function rhombus(cx, cy, r, rot) {
  const pts = [
    [r, 0],
    [0, r * 0.4],
    [-r, 0],
    [0, -r * 0.4],
  ];
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const x = cx + pts[i][0] * c - pts[i][1] * s;
    const y = cy + pts[i][0] * s + pts[i][1] * c;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function draw() {
  ctx.fillStyle = `rgb(${params.bg},${params.bg},${params.bg + 4})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const s = Math.max(12, params.size);
  const gx = s * 2.6;
  const gy = s * 2.6;
  const rot = (params.rotation * Math.PI) / 180;
  const cols = Math.ceil(canvas.width / gx) + 2;
  const rows = Math.ceil(canvas.height / gy) + 2;
  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      const cx = i * gx + (Math.random() - 0.5) * params.jitter * s;
      const cy = j * gy + (Math.random() - 0.5) * params.jitter * s;
      const hue1 = (params.hue + ((i + j) * params.hueShift) / 4) % 360;
      ctx.fillStyle = `hsl(${hue1}, ${params.saturation}%, ${params.lightness}%)`;
      ctx.shadowColor = ctx.fillStyle;
      poly(cx, cy, 8, s, rot);
      ctx.fill();
      ctx.strokeStyle = `rgba(0,0,0,${params.edgeAlpha})`;
      ctx.stroke();
      // 菱形を八角形の間に挟む
      const hue2 = (hue1 + 180) % 360;
      ctx.fillStyle = `hsl(${hue2}, ${params.saturation}%, ${params.lightness - 10}%)`;
      for (let k = 0; k < 4; k++) {
        const a = rot + (k * Math.PI) / 2 + Math.PI / 4;
        const rx = cx + Math.cos(a) * s * 1.3 * params.ratio;
        const ry = cy + Math.sin(a) * s * 1.3 * params.ratio;
        rhombus(rx, ry, s * 0.5, a);
        ctx.fill();
        ctx.stroke();
      }
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
  title: 'Ammann–Beenker',
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
gui.add(params, 'size', 16, 80, 1).onChange(onChange);
gui.add(params, 'ratio', 0.3, 1, 0.01).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'edgeAlpha', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'rotation', 0, 90, 1).onChange(onChange);
gui.add(params, 'jitter', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.size = rand(20, 60, 1);
  params.ratio = rand(0.4, 0.9, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0, 180, 1);
  params.saturation = rand(30, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotation = rand(0, 45, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
