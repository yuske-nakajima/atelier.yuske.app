// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Buddhabrot: 発散するトラジェクトリを蓄積して得られる Mandelbrot の亡霊
const params = {
  samples: 60000,
  maxIter: 200,
  zoom: 0.7,
  offsetX: -0.3,
  offsetY: 0,
  rotation: 90,
  hue: 30,
  hueRange: 120,
  saturation: 80,
  brightness: 1.3,
  gamma: 0.55,
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
  const W = canvas.width;
  const H = canvas.height;
  const density = new Float32Array(W * H);
  const maxIter = Math.max(30, Math.min(800, params.maxIter | 0));
  const samples = Math.max(1000, Math.min(200000, params.samples | 0));
  const scale = (Math.min(W, H) * params.zoom) / 3;
  const rot = (params.rotation * Math.PI) / 180;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  const traj = new Float64Array(maxIter * 2);
  for (let s = 0; s < samples; s++) {
    const cx = (Math.random() - 0.5) * 4;
    const cy = (Math.random() - 0.5) * 4;
    // カーディオイドと主円の除外（早期スキップ）
    const q = (cx - 0.25) * (cx - 0.25) + cy * cy;
    if (q * (q + (cx - 0.25)) < 0.25 * cy * cy) continue;
    if ((cx + 1) * (cx + 1) + cy * cy < 0.0625) continue;
    let x = 0;
    let y = 0;
    let i = 0;
    while (i < maxIter && x * x + y * y < 4) {
      const nx = x * x - y * y + cx;
      y = 2 * x * y + cy;
      x = nx;
      traj[i * 2] = x;
      traj[i * 2 + 1] = y;
      i++;
    }
    if (i >= maxIter) continue;
    // 軌跡を蓄積
    for (let k = 0; k < i; k++) {
      const tx = traj[k * 2];
      const ty = traj[k * 2 + 1];
      // 90°回転で Buddhabrot らしく
      const rx = tx * cosR - ty * sinR - params.offsetX;
      const ry = tx * sinR + ty * cosR - params.offsetY;
      const px = Math.floor(W / 2 + rx * scale);
      const py = Math.floor(H / 2 + ry * scale);
      if (px >= 0 && px < W && py >= 0 && py < H) {
        density[py * W + px] += 1;
      }
    }
  }
  let maxD = 1;
  for (let k = 0; k < density.length; k++)
    if (density[k] > maxD) maxD = density[k];
  const img = ctx.createImageData(W, H);
  const data = img.data;
  for (let k = 0; k < density.length; k++) {
    const t = density[k] / maxD;
    const v = t ** params.gamma * params.brightness;
    const hue = (params.hue + t * params.hueRange) % 360;
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
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, W, H);
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
  title: 'Mandelbrot Buddha',
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
gui.add(params, 'samples', 1000, 200000, 500).onChange(onChange);
gui.add(params, 'maxIter', 30, 800, 5).onChange(onChange);
gui.add(params, 'zoom', 0.3, 3, 0.01).onChange(onChange);
gui.add(params, 'offsetX', -2, 2, 0.01).onChange(onChange);
gui.add(params, 'offsetY', -2, 2, 0.01).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueRange', 0, 720, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'brightness', 0.3, 3, 0.05).onChange(onChange);
gui.add(params, 'gamma', 0.2, 1.5, 0.01).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.maxIter = rand(100, 400, 5);
  params.samples = rand(30000, 120000, 500);
  params.rotation = rand(0, 360, 1);
  params.hue = rand(0, 360, 1);
  params.hueRange = rand(60, 400, 1);
  params.saturation = rand(50, 90, 1);
  params.gamma = rand(0.35, 0.8, 0.01);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
