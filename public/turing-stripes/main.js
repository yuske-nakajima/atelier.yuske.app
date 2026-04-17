// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  frequency: 0.04,
  warpAmount: 40,
  warpScale: 0.005,
  orientation: 0,
  thickness: 0.5,
  contrast: 0.9,
  hueA: 20,
  hueB: 220,
  saturation: 60,
  lightness: 50,
  noise: 0.15,
  bandCount: 1,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

/**
 * 2D バリュノイズ
 * @param {number} x
 * @param {number} y
 */
function noise(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} scale
 */
function smoothNoise(x, y, scale) {
  const xi = Math.floor(x * scale);
  const yi = Math.floor(y * scale);
  const xf = x * scale - xi;
  const yf = y * scale - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = noise(xi, yi);
  const b = noise(xi + 1, yi);
  const c = noise(xi, yi + 1);
  const d = noise(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function draw() {
  const img = ctx.createImageData(canvas.width, canvas.height);
  const d = img.data;
  const dirX = Math.cos((params.orientation * Math.PI) / 180);
  const dirY = Math.sin((params.orientation * Math.PI) / 180);
  const freq = params.frequency;
  const thickness = params.thickness;
  const [r1, g1, b1] = hsl(params.hueA, params.saturation, params.lightness);
  const [r2, g2, b2] = hsl(params.hueB, params.saturation, params.lightness);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const wx =
        (smoothNoise(x, y, params.warpScale) - 0.5) * params.warpAmount * 2;
      const wy =
        (smoothNoise(x + 1000, y + 1000, params.warpScale) - 0.5) *
        params.warpAmount *
        2;
      const v = (x + wx) * dirX + (y + wy) * dirY;
      let s = Math.sin(v * freq * params.bandCount);
      s = Math.tanh(s * (params.contrast * 5 + 1));
      const n = (noise(x, y) - 0.5) * params.noise;
      const t = (s + 1) / 2 + n;
      const tt = Math.max(0, Math.min(1, Math.abs(t - 0.5) / thickness));
      const idx = (y * canvas.width + x) * 4;
      d[idx] = r1 * (1 - tt) + r2 * tt;
      d[idx + 1] = g1 * (1 - tt) + g2 * tt;
      d[idx + 2] = b1 * (1 - tt) + b2 * tt;
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * @param {number} h
 * @param {number} s
 * @param {number} l
 */
function hsl(h, s, l) {
  s /= 100;
  l /= 100;
  const k = /** @param {number} n */ (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = /** @param {number} n */ (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Turing Stripes',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

/** @type {Array<[keyof typeof params, number, number, number]>} */
const ctrls = [
  ['frequency', 0.005, 0.2, 0.001],
  ['warpAmount', 0, 200, 1],
  ['warpScale', 0.001, 0.02, 0.0005],
  ['orientation', 0, 180, 1],
  ['thickness', 0.1, 1, 0.01],
  ['contrast', 0, 1, 0.01],
  ['hueA', 0, 360, 1],
  ['hueB', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 10, 90, 1],
  ['noise', 0, 0.5, 0.01],
  ['bandCount', 0.2, 4, 0.05],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s).onChange(redraw);
}

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

gui.addButton('Random', () => {
  params.frequency = rand(0.02, 0.1, 0.001);
  params.warpAmount = rand(10, 100, 1);
  params.orientation = rand(0, 180, 1);
  params.hueA = rand(0, 360, 1);
  params.hueB = rand(0, 360, 1);
  params.saturation = rand(30, 90, 1);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
