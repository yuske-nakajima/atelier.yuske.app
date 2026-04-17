// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// ロジスティック写像 x → r·x·(1-x) の分岐図
const params = {
  rMin: 2.5,
  rMax: 4.0,
  samples: 600,
  warmup: 500,
  iters: 400,
  dotRadius: 0.6,
  hue: 180,
  hueByR: 120,
  saturation: 75,
  lightness: 65,
  alpha: 0.45,
  padding: 50,
  glow: 2,
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
  const pad = params.padding;
  const W = canvas.width - pad * 2;
  const H = canvas.height - pad * 2;
  const samples = Math.max(50, Math.min(2000, params.samples | 0));
  const warm = Math.max(50, params.warmup | 0);
  const iters = Math.max(50, params.iters | 0);
  for (let s = 0; s < samples; s++) {
    const r = params.rMin + (params.rMax - params.rMin) * (s / samples);
    let x = 0.5;
    for (let i = 0; i < warm; i++) x = r * x * (1 - x);
    const px = pad + ((r - params.rMin) / (params.rMax - params.rMin)) * W;
    const hue = (params.hue + (s / samples) * params.hueByR) % 360;
    ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.shadowColor = ctx.fillStyle;
    for (let i = 0; i < iters; i++) {
      x = r * x * (1 - x);
      const py = pad + H - x * H;
      ctx.beginPath();
      ctx.arc(px, py, params.dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(pad, pad, W, H);
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
  title: 'Logistic Map Bifurcation',
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
gui.add(params, 'rMin', 0, 4, 0.01).onChange(onChange);
gui.add(params, 'rMax', 0, 4, 0.01).onChange(onChange);
gui.add(params, 'samples', 50, 2000, 10).onChange(onChange);
gui.add(params, 'warmup', 50, 3000, 10).onChange(onChange);
gui.add(params, 'iters', 50, 1500, 10).onChange(onChange);
gui.add(params, 'dotRadius', 0.2, 4, 0.1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueByR', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.05, 1, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.rMin = rand(2.4, 3.2, 0.01);
  params.rMax = rand(3.5, 4.0, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueByR = rand(30, 240, 1);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(50, 75, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
