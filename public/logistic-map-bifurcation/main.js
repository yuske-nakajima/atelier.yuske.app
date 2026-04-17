// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// ロジスティック写像 x → r·x·(1-x) の分岐図
const params = {
  rMin: 2.5,
  rMax: 4.0,
  samples: 1200,
  warmup: 500,
  iters: 400,
  hue: 180,
  hueByR: 120,
  saturation: 75,
  brightness: 1.3,
  gamma: 0.45,
  padding: 50,
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

function hslToRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

function draw() {
  const CW = canvas.width;
  const CH = canvas.height;
  const pad = params.padding;
  const W = CW - pad * 2;
  const H = CH - pad * 2;
  const density = new Float32Array(CW * CH);
  const samples = Math.max(100, Math.min(4000, params.samples | 0));
  const warm = Math.max(50, params.warmup | 0);
  const iters = Math.max(50, params.iters | 0);
  const rSpan = params.rMax - params.rMin;
  for (let s = 0; s < samples; s++) {
    const r = params.rMin + rSpan * (s / samples);
    let x = 0.5;
    for (let i = 0; i < warm; i++) x = r * x * (1 - x);
    const px = Math.floor(pad + ((r - params.rMin) / rSpan) * W);
    if (px < 0 || px >= CW) continue;
    for (let i = 0; i < iters; i++) {
      x = r * x * (1 - x);
      const py = Math.floor(pad + H - x * H);
      if (py < 0 || py >= CH) continue;
      density[py * CW + px] += 1;
    }
  }
  let maxD = 1;
  for (let k = 0; k < density.length; k++)
    if (density[k] > maxD) maxD = density[k];
  const img = ctx.createImageData(CW, CH);
  const data = img.data;
  for (let k = 0; k < density.length; k++) {
    if (density[k] === 0) continue;
    const t = density[k] / maxD;
    const v = t ** params.gamma * params.brightness;
    const hue = (params.hue + t * params.hueByR) % 360;
    const [r, g, b] = hslToRgb(
      hue / 360,
      params.saturation / 100,
      Math.min(1, v * 0.55),
    );
    const idx = k * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, CW, CH);
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(pad, pad, W, H);
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
gui.add(params, 'samples', 100, 4000, 20).onChange(onChange);
gui.add(params, 'warmup', 50, 3000, 10).onChange(onChange);
gui.add(params, 'iters', 50, 1500, 10).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueByR', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'brightness', 0.3, 3, 0.05).onChange(onChange);
gui.add(params, 'gamma', 0.1, 2, 0.01).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.rMin = rand(2.4, 3.2, 0.01);
  params.rMax = rand(3.5, 4.0, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueByR = rand(30, 240, 1);
  params.saturation = rand(50, 85, 1);
  params.gamma = rand(0.3, 0.8, 0.01);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
