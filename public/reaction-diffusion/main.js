// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 簡易 Gray-Scott 反応拡散系（格子 160x100 程度でリアルタイム）
const params = {
  gridScale: 5, // 画面ピクセルあたりの格子サイズ
  feed: 0.055,
  kill: 0.062,
  dA: 1.0,
  dB: 0.5,
  iterPerFrame: 8,
  hueStart: 180,
  hueRange: 160,
  brightness: 1.3,
  seedSize: 12,
  seedSpawn: true,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** @type {Float32Array} */
let a;
/** @type {Float32Array} */
let b;
let gw = 0;
let gh = 0;

function rebuild() {
  gw = Math.max(40, Math.floor(canvas.width / params.gridScale));
  gh = Math.max(40, Math.floor(canvas.height / params.gridScale));
  a = new Float32Array(gw * gh);
  b = new Float32Array(gw * gh);
  for (let i = 0; i < a.length; i++) a[i] = 1;
  seed(gw / 2, gh / 2);
}

function seed(cx, cy) {
  const r = Math.round(params.seedSize);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const px = Math.floor(cx + x);
      const py = Math.floor(cy + y);
      if (px < 0 || py < 0 || px >= gw || py >= gh) continue;
      if (x * x + y * y <= r * r) b[py * gw + px] = 1;
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

/** @type {Float32Array} */
let a2;
/** @type {Float32Array} */
let b2;

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
  if (!a2 || a2.length !== a.length) {
    a2 = new Float32Array(a.length);
    b2 = new Float32Array(b.length);
  }
  const F = params.feed;
  const K = params.kill;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const idx = y * gw + x;
      const av = a[idx];
      const bv = b[idx];
      const abb = av * bv * bv;
      a2[idx] = av + (params.dA * laplacian(a, x, y) - abb + F * (1 - av));
      b2[idx] = bv + (params.dB * laplacian(b, x, y) + abb - (K + F) * bv);
      if (a2[idx] < 0) a2[idx] = 0;
      if (a2[idx] > 1) a2[idx] = 1;
      if (b2[idx] < 0) b2[idx] = 0;
      if (b2[idx] > 1) b2[idx] = 1;
    }
  }
  [a, a2] = [a2, a];
  [b, b2] = [b2, b];
}

let spawnTimer = 0;

function draw() {
  if (params.seedSpawn) {
    spawnTimer++;
    if (spawnTimer > 240) {
      spawnTimer = 0;
      seed(Math.random() * gw, Math.random() * gh);
    }
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
      const v = Math.min(1, b[gy * gw + gx] * params.brightness);
      const hue = params.hueStart + v * params.hueRange;
      const l = Math.floor(v * 255);
      const rr = Math.floor(l * 0.8 + 20);
      const gg = Math.floor(
        l * (0.5 + Math.sin((hue * Math.PI) / 180) * 0.3) + 10,
      );
      const bb = Math.floor(
        l * (0.3 + Math.cos((hue * Math.PI) / 180) * 0.3) + 10,
      );
      const off = (py * canvas.width + px) * 4;
      data[off] = rr;
      data[off + 1] = gg;
      data[off + 2] = bb;
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
  title: 'Reaction Diffusion',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'gridScale', 3, 10, 1);
gui.add(params, 'feed', 0.02, 0.1, 0.001);
gui.add(params, 'kill', 0.04, 0.075, 0.001);
gui.add(params, 'dA', 0.5, 1.5, 0.01);
gui.add(params, 'dB', 0.2, 1, 0.01);
gui.add(params, 'iterPerFrame', 2, 20, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'brightness', 0.5, 3, 0.05);
gui.add(params, 'seedSize', 3, 30, 1);
gui.add(params, 'seedSpawn');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.feed = rand(0.03, 0.08, 0.001);
  params.kill = rand(0.05, 0.068, 0.001);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  gui.updateDisplay();
});
gui.addButton('Seed', () => seed(Math.random() * gw, Math.random() * gh));
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuild();
  gui.updateDisplay();
});
