// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Gray-Scott モデルのプリセット探索版。パラメータ一覧でパターン分類を切り替え。
const params = {
  presetIdx: 0, // 0:spots 1:stripes 2:mitosis 3:bubbles 4:worms 5:chaos
  feed: 0.036,
  kill: 0.06,
  dA: 1,
  dB: 0.5,
  gridScale: 5,
  iterPerFrame: 8,
  hueA: 40,
  hueB: 220,
  brightness: 1.5,
  seedRadius: 14,
  multiSeed: 5,
  flowBias: 0,
};
const defaults = { ...params };

const presets = [
  { name: 'Spots', feed: 0.036, kill: 0.06 },
  { name: 'Stripes', feed: 0.042, kill: 0.063 },
  { name: 'Mitosis', feed: 0.0367, kill: 0.0649 },
  { name: 'Bubbles', feed: 0.098, kill: 0.057 },
  { name: 'Worms', feed: 0.058, kill: 0.065 },
  { name: 'Chaos', feed: 0.026, kill: 0.051 },
];

function applyPreset(i) {
  const p = presets[i % presets.length];
  params.feed = p.feed;
  params.kill = p.kill;
}

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** @type {Float32Array} */
let A;
/** @type {Float32Array} */
let B;
/** @type {Float32Array} */
let A2;
/** @type {Float32Array} */
let B2;
let gw = 0;
let gh = 0;

function rebuild() {
  gw = Math.max(40, Math.floor(canvas.width / params.gridScale));
  gh = Math.max(40, Math.floor(canvas.height / params.gridScale));
  A = new Float32Array(gw * gh);
  B = new Float32Array(gw * gh);
  A2 = new Float32Array(gw * gh);
  B2 = new Float32Array(gw * gh);
  for (let i = 0; i < A.length; i++) A[i] = 1;
  const m = Math.max(1, Math.round(params.multiSeed));
  for (let i = 0; i < m; i++) {
    seed(Math.random() * gw, Math.random() * gh);
  }
}

function seed(cx, cy) {
  const r = Math.round(params.seedRadius);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const px = Math.floor(cx + x);
      const py = Math.floor(cy + y);
      if (px < 0 || py < 0 || px >= gw || py >= gh) continue;
      if (x * x + y * y <= r * r) B[py * gw + px] = 1;
    }
  }
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  rebuild();
}
window.addEventListener('resize', resize);
resize();

function laplacian(buf, x, y) {
  const idx = y * gw + x;
  const xm = (x - 1 + gw) % gw;
  const xp = (x + 1) % gw;
  const ym = (y - 1 + gh) % gh;
  const yp = (y + 1) % gh;
  return (
    buf[ym * gw + xm] * 0.05 +
    buf[ym * gw + x] * 0.2 +
    buf[ym * gw + xp] * 0.05 +
    buf[y * gw + xm] * 0.2 +
    buf[idx] * -1 +
    buf[y * gw + xp] * 0.2 +
    buf[yp * gw + xm] * 0.05 +
    buf[yp * gw + x] * 0.2 +
    buf[yp * gw + xp] * 0.05
  );
}

function iterate() {
  const F = params.feed;
  const K = params.kill;
  const bias = params.flowBias;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const idx = y * gw + x;
      const av = A[idx];
      const bv = B[idx];
      const abb = av * bv * bv;
      A2[idx] = av + (params.dA * laplacian(A, x, y) - abb + F * (1 - av));
      B2[idx] =
        bv +
        (params.dB * laplacian(B, x, y) + abb - (K + F) * bv) +
        bias * 0.001 * (x / gw - 0.5);
      if (A2[idx] < 0) A2[idx] = 0;
      if (A2[idx] > 1) A2[idx] = 1;
      if (B2[idx] < 0) B2[idx] = 0;
      if (B2[idx] > 1) B2[idx] = 1;
    }
  }
  [A, A2] = [A2, A];
  [B, B2] = [B2, B];
}

let lastPreset = -1;

function draw() {
  if (Math.round(params.presetIdx) !== lastPreset) {
    lastPreset = Math.round(params.presetIdx);
    applyPreset(lastPreset);
  }
  const iters = Math.round(params.iterPerFrame);
  for (let i = 0; i < iters; i++) iterate();

  const img = ctx.createImageData(canvas.width, canvas.height);
  const data = img.data;
  const sx = canvas.width / gw;
  const sy = canvas.height / gh;
  for (let py = 0; py < canvas.height; py++) {
    const gy = Math.min(gh - 1, Math.floor(py / sy));
    for (let px = 0; px < canvas.width; px++) {
      const gx = Math.min(gw - 1, Math.floor(px / sx));
      const i = gy * gw + gx;
      const av = A[i];
      const bv = B[i] * params.brightness;
      const t = Math.min(1, bv);
      const hue = params.hueA * (1 - t) + params.hueB * t;
      const h = (hue % 360) / 60;
      const c = t;
      const x = c * (1 - Math.abs((h % 2) - 1));
      let r = 0;
      let g = 0;
      let bb = 0;
      if (h < 1) {
        r = c;
        g = x;
      } else if (h < 2) {
        r = x;
        g = c;
      } else if (h < 3) {
        g = c;
        bb = x;
      } else if (h < 4) {
        g = x;
        bb = c;
      } else if (h < 5) {
        r = x;
        bb = c;
      } else {
        r = c;
        bb = x;
      }
      const m = av * 0.2;
      const off = (py * canvas.width + px) * 4;
      data[off] = Math.floor((r + m) * 255);
      data[off + 1] = Math.floor((g + m) * 255);
      data[off + 2] = Math.floor((bb + m) * 255);
      data[off + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Gray-Scott Model',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'presetIdx', 0, presets.length - 1, 1);
gui.add(params, 'feed', 0.02, 0.1, 0.001);
gui.add(params, 'kill', 0.04, 0.075, 0.001);
gui.add(params, 'dA', 0.5, 1.5, 0.01);
gui.add(params, 'dB', 0.2, 1, 0.01);
gui.add(params, 'gridScale', 3, 10, 1);
gui.add(params, 'iterPerFrame', 2, 20, 1);
gui.add(params, 'hueA', 0, 360, 1);
gui.add(params, 'hueB', 0, 360, 1);
gui.add(params, 'brightness', 0.5, 3, 0.05);
gui.add(params, 'seedRadius', 3, 40, 1);
gui.add(params, 'multiSeed', 1, 15, 1);
gui.add(params, 'flowBias', -5, 5, 0.1);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.presetIdx = rand(0, presets.length - 1, 1);
  params.hueA = rand(0, 360, 1);
  params.hueB = rand(0, 360, 1);
  rebuild();
  gui.updateDisplay();
});
gui.addButton('Reseed', () => rebuild());
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuild();
  gui.updateDisplay();
});
