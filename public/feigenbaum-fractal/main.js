// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Feigenbaum フラクタル: 分岐図をピクセル密度ヒートマップで描画
const params = {
  rMin: 3.54,
  rMax: 4.0,
  xMin: 0,
  xMax: 1,
  samples: 800,
  warmup: 300,
  iters: 600,
  hue: 30,
  hueRange: 120,
  saturation: 85,
  brightness: 1.3,
  padding: 40,
  gamma: 0.45,
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
  const pad = params.padding;
  const W = canvas.width - pad * 2;
  const H = canvas.height - pad * 2;
  const img = ctx.createImageData(canvas.width, canvas.height);
  const density = new Float32Array(canvas.width * canvas.height);
  const samples = Math.max(100, Math.min(2000, params.samples | 0));
  const warm = Math.max(50, params.warmup | 0);
  const iters = Math.max(50, params.iters | 0);
  for (let s = 0; s < samples; s++) {
    const r = params.rMin + (params.rMax - params.rMin) * (s / samples);
    let x = 0.5;
    for (let i = 0; i < warm; i++) x = r * x * (1 - x);
    const px = Math.floor(
      pad + ((r - params.rMin) / (params.rMax - params.rMin)) * W,
    );
    for (let i = 0; i < iters; i++) {
      x = r * x * (1 - x);
      if (x < params.xMin || x > params.xMax) continue;
      const py = Math.floor(
        pad + H - ((x - params.xMin) / (params.xMax - params.xMin)) * H,
      );
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height)
        continue;
      density[py * canvas.width + px] += 1;
    }
  }
  let maxD = 1;
  for (let k = 0; k < density.length; k++)
    if (density[k] > maxD) maxD = density[k];
  const data = img.data;
  for (let k = 0; k < density.length; k++) {
    const t = density[k] / maxD;
    const v = t ** params.gamma * params.brightness;
    const hue = (params.hue + t * params.hueRange) % 360;
    const [r, g, b] = hslToRgb(
      hue / 360,
      params.saturation / 100,
      Math.min(1, v * 0.6),
    );
    const idx = k * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(pad, pad, W, H);
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.floor(hue2rgb(h + 1 / 3) * 255),
    Math.floor(hue2rgb(h) * 255),
    Math.floor(hue2rgb(h - 1 / 3) * 255),
  ];
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
  title: 'Feigenbaum Fractal',
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
gui.add(params, 'rMin', 2.5, 4, 0.001).onChange(onChange);
gui.add(params, 'rMax', 2.5, 4, 0.001).onChange(onChange);
gui.add(params, 'xMin', 0, 1, 0.001).onChange(onChange);
gui.add(params, 'xMax', 0, 1, 0.001).onChange(onChange);
gui.add(params, 'samples', 100, 2000, 20).onChange(onChange);
gui.add(params, 'warmup', 50, 2000, 10).onChange(onChange);
gui.add(params, 'iters', 50, 2000, 10).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueRange', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'brightness', 0.3, 3, 0.05).onChange(onChange);
gui.add(params, 'gamma', 0.1, 2, 0.01).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.rMin = rand(3.4, 3.7, 0.001);
  params.rMax = rand(3.8, 4.0, 0.001);
  params.hue = rand(0, 360, 1);
  params.hueRange = rand(40, 240, 1);
  params.saturation = rand(50, 90, 1);
  params.gamma = rand(0.3, 0.8, 0.01);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
