// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Spectre モノタイル風の 14 辺曲線形を配置する
const params = {
  size: 30,
  density: 0.88,
  rotateCount: 6,
  curl: 0.3,
  lineWidth: 1.2,
  hue: 210,
  hueRange: 80,
  saturation: 60,
  lightness: 55,
  strokeAlpha: 0.5,
  glow: 7,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

let dirty = true;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  dirty = true;
}
window.addEventListener('resize', resize);

function spectrePath(cx, cy, size, rot) {
  const pts = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const r = size * (1 + Math.sin(t * 3 + params.curl) * 0.18);
    pts.push([Math.cos(t + rot) * r + cx, Math.sin(t + rot) * r + cy]);
  }
  return pts;
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const s = Math.max(8, params.size);
  const stepX = s * 2.4;
  const stepY = s * 2.2;
  const cols = Math.ceil(canvas.width / stepX) + 2;
  const rows = Math.ceil(canvas.height / stepY) + 2;
  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      if (Math.random() > params.density) continue;
      const offset = j % 2 === 0 ? 0 : stepX / 2;
      const cx = i * stepX + offset;
      const cy = j * stepY;
      const rotIdx = (i * 2 + j * 3) % params.rotateCount;
      const rot = (rotIdx / params.rotateCount) * Math.PI * 2;
      const pts = spectrePath(cx, cy, s, rot);
      const hue =
        (params.hue + ((i * 11 + j * 7) % 360) * (params.hueRange / 360)) % 360;
      const color = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.beginPath();
      for (let k = 0; k < pts.length; k++) {
        const p = pts[k];
        if (k === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = params.lineWidth;
      ctx.strokeStyle = `rgba(0,0,0,${params.strokeAlpha})`;
      ctx.stroke();
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
  title: 'Spectre Monotile',
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
gui.add(params, 'rotateCount', 2, 12, 1).onChange(onChange);
gui.add(params, 'curl', -1, 1, 0.01).onChange(onChange);
gui.add(params, 'lineWidth', 0, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueRange', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'strokeAlpha', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 30, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.size = rand(14, 50, 1);
  params.density = rand(0.6, 1, 0.01);
  params.rotateCount = rand(3, 10, 1);
  params.curl = rand(-0.6, 0.8, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueRange = rand(30, 200, 1);
  params.saturation = rand(30, 80, 1);
  params.lightness = rand(40, 70, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
