// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Julia 集合「ズー」: 複数の c を動的に切替
const params = {
  cRe: -0.7,
  cIm: 0.27015,
  preset: 0, // 0: custom, 1..: preset
  maxIter: 120,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  hue: 220,
  hueRange: 200,
  saturation: 85,
  brightness: 1.2,
  gamma: 0.7,
};
const defaults = { ...params };

const presets = [
  [-0.7, 0.27015],
  [0.285, 0.01],
  [-0.835, -0.2321],
  [0.45, 0.1428],
  [-0.8, 0.156],
  [-0.4, 0.6],
  [0.355, 0.355],
  [-0.74543, 0.11301],
];

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
  const W = canvas.width;
  const H = canvas.height;
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const maxIter = Math.max(20, Math.min(500, params.maxIter | 0));
  const preset = params.preset | 0;
  const [cRe, cIm] =
    preset > 0 && preset <= presets.length
      ? presets[preset - 1]
      : [params.cRe, params.cIm];
  const scale = 3 / (Math.min(W, H) * params.zoom);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      let x = (px - W / 2) * scale + params.offsetX;
      let y = (py - H / 2) * scale + params.offsetY;
      let iter = 0;
      while (iter < maxIter && x * x + y * y < 4) {
        const nx = x * x - y * y + cRe;
        y = 2 * x * y + cIm;
        x = nx;
        iter++;
      }
      const t = iter / maxIter;
      const v = t ** params.gamma * params.brightness;
      const hue = (params.hue + t * params.hueRange) % 360;
      const [r, g, b] =
        iter === maxIter
          ? [0, 0, 0]
          : hslToRgb(hue / 360, params.saturation / 100, Math.min(1, v * 0.55));
      const idx = (py * W + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
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
  title: 'Julia Set Zoo',
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
gui.add(params, 'preset', 0, presets.length, 1).onChange(onChange);
gui.add(params, 'cRe', -1.2, 1.2, 0.001).onChange(onChange);
gui.add(params, 'cIm', -1.2, 1.2, 0.001).onChange(onChange);
gui.add(params, 'maxIter', 20, 500, 5).onChange(onChange);
gui.add(params, 'zoom', 0.3, 5, 0.01).onChange(onChange);
gui.add(params, 'offsetX', -2, 2, 0.01).onChange(onChange);
gui.add(params, 'offsetY', -2, 2, 0.01).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueRange', 0, 720, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'brightness', 0.3, 2.5, 0.05).onChange(onChange);
gui.add(params, 'gamma', 0.2, 2, 0.01).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.preset = rand(1, presets.length, 1);
  params.hue = rand(0, 360, 1);
  params.hueRange = rand(100, 600, 1);
  params.saturation = rand(50, 90, 1);
  params.gamma = rand(0.4, 1.2, 0.01);
  params.zoom = rand(0.8, 1.5, 0.01);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
