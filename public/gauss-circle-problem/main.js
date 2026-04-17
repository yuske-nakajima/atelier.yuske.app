// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Gauss 円問題: 半径 r の円内の格子点を可視化
const params = {
  radius: 150,
  cellSize: 6,
  dotRadius: 2.5,
  hue: 190,
  hueShift: 0.5,
  saturation: 75,
  lightness: 60,
  showCircle: true,
  ringMode: true,
  glow: 4,
  alpha: 0.95,
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

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.max(10, params.radius);
  const cell = Math.max(2, params.cellSize);
  const maxI = Math.ceil(r / cell) + 1;
  for (let j = -maxI; j <= maxI; j++) {
    for (let i = -maxI; i <= maxI; i++) {
      const d2 = i * i + j * j;
      const d = Math.sqrt(d2) * cell;
      if (d > r) continue;
      const x = cx + i * cell;
      const y = cy + j * cell;
      const hueBase = params.ringMode
        ? (d2 * params.hueShift * 10) % 360
        : (Math.atan2(j, i) / (Math.PI * 2)) * 360 + params.hueShift * 100;
      const hue = (params.hue + hueBase) % 360;
      ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(x, y, params.dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (params.showCircle) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
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
  title: 'Gauss Circle Problem',
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
gui.add(params, 'radius', 20, 500, 1).onChange(onChange);
gui.add(params, 'cellSize', 2, 20, 0.5).onChange(onChange);
gui.add(params, 'dotRadius', 0.5, 10, 0.1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 2, 0.01).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.2, 1, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'showCircle').onChange(onChange);
gui.add(params, 'ringMode').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.radius = rand(80, 350, 1);
  params.cellSize = rand(4, 12, 0.5);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0, 1.5, 0.01);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.ringMode = Math.random() > 0.5;
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
