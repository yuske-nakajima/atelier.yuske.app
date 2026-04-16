// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  gridSize: 180, // 高さマップの解像度
  dropsPerFrame: 600, // 1 フレームあたりの雨粒数
  iterations: 30, // 雨粒 1 つの移動ステップ数
  inertia: 0.05, // 方向の慣性（0-1）
  sedimentCapacity: 4, // 堆積容量係数
  erodeRate: 0.3, // 侵食率
  depositRate: 0.3, // 堆積率
  evaporateRate: 0.02, // 蒸発率
  gravity: 4, // 重力
  hueLow: 30, // 低地の色相
  hueHigh: 200, // 高地の色相
  relief: 1.5, // シェーディング強度
  waterTint: 0.2, // 水の青み
  autoRain: true, // 自動で雨を降らせる
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** @type {Float32Array} */
let heightMap = new Float32Array(0);
/** @type {Float32Array} */
let waterMap = new Float32Array(0);
let gridW = 0;
let gridH = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- 地形生成 ---

/**
 * 疑似ランダム値 (シードなし)
 * @param {number} x
 * @param {number} y
 */
function noise2(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * @param {number} x
 * @param {number} y
 */
function fbm(x, y) {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 5; i++) {
    const xi = Math.floor(x * freq);
    const yi = Math.floor(y * freq);
    const xf = x * freq - xi;
    const yf = y * freq - yi;
    const u = xf * xf * (3 - 2 * xf);
    const w = yf * yf * (3 - 2 * yf);
    const a = noise2(xi, yi);
    const b = noise2(xi + 1, yi);
    const c = noise2(xi, yi + 1);
    const d = noise2(xi + 1, yi + 1);
    const mix = a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
    v += mix * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return v;
}

function initTerrain() {
  gridW = Math.max(32, Math.round(params.gridSize));
  gridH = Math.max(32, Math.round((gridW * canvas.height) / canvas.width));
  heightMap = new Float32Array(gridW * gridH);
  waterMap = new Float32Array(gridW * gridH);
  const seedX = Math.random() * 1000;
  const seedY = Math.random() * 1000;
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const nx = x / gridW;
      const ny = y / gridH;
      heightMap[y * gridW + x] = fbm(nx * 4 + seedX, ny * 4 + seedY);
    }
  }
}

initTerrain();

// --- 侵食シミュレーション ---

/**
 * 地形の高さと勾配をバイリニア補間で取得
 * @param {number} x
 * @param {number} y
 */
function sampleHeight(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const i00 = yi * gridW + xi;
  const i10 = i00 + 1;
  const i01 = i00 + gridW;
  const i11 = i01 + 1;
  const h00 = heightMap[i00];
  const h10 = heightMap[i10];
  const h01 = heightMap[i01];
  const h11 = heightMap[i11];
  const h =
    h00 * (1 - xf) * (1 - yf) +
    h10 * xf * (1 - yf) +
    h01 * (1 - xf) * yf +
    h11 * xf * yf;
  const gx = (h10 - h00) * (1 - yf) + (h11 - h01) * yf;
  const gy = (h01 - h00) * (1 - xf) + (h11 - h10) * xf;
  return { h, gx, gy };
}

function simulateDroplet() {
  let x = Math.random() * (gridW - 2);
  let y = Math.random() * (gridH - 2);
  let dx = 0;
  let dy = 0;
  let speed = 1;
  let water = 1;
  let sediment = 0;
  for (let i = 0; i < params.iterations; i++) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    if (xi < 0 || xi >= gridW - 1 || yi < 0 || yi >= gridH - 1) break;
    const { h, gx, gy } = sampleHeight(x, y);
    dx = dx * params.inertia - gx * (1 - params.inertia);
    dy = dy * params.inertia - gy * (1 - params.inertia);
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= gridW - 1 || ny < 0 || ny >= gridH - 1) break;
    const newH = sampleHeight(nx, ny).h;
    const dh = newH - h;
    const cap = Math.max(-dh, 0.01) * speed * water * params.sedimentCapacity;
    if (sediment > cap || dh > 0) {
      const drop =
        dh > 0 ? Math.min(dh, sediment) : (sediment - cap) * params.depositRate;
      sediment -= drop;
      const offX = x - xi;
      const offY = y - yi;
      heightMap[yi * gridW + xi] += drop * (1 - offX) * (1 - offY);
      heightMap[yi * gridW + xi + 1] += drop * offX * (1 - offY);
      heightMap[(yi + 1) * gridW + xi] += drop * (1 - offX) * offY;
      heightMap[(yi + 1) * gridW + xi + 1] += drop * offX * offY;
    } else {
      const erode = Math.min((cap - sediment) * params.erodeRate, -dh);
      heightMap[yi * gridW + xi] -= erode * 0.25;
      heightMap[yi * gridW + xi + 1] -= erode * 0.25;
      heightMap[(yi + 1) * gridW + xi] -= erode * 0.25;
      heightMap[(yi + 1) * gridW + xi + 1] -= erode * 0.25;
      sediment += erode;
    }
    speed = Math.sqrt(Math.max(0, speed * speed + -dh * params.gravity));
    water *= 1 - params.evaporateRate;
    waterMap[yi * gridW + xi] = Math.min(1, waterMap[yi * gridW + xi] + 0.05);
    x = nx;
    y = ny;
  }
}

// --- 描画 ---

function render() {
  const imgData = ctx.createImageData(canvas.width, canvas.height);
  const data = imgData.data;
  const cw = canvas.width;
  const ch = canvas.height;
  for (let py = 0; py < ch; py++) {
    const gy = (py / ch) * (gridH - 1);
    for (let px = 0; px < cw; px++) {
      const gx = (px / cw) * (gridW - 1);
      const { h, gx: sx, gy: sy } = sampleHeight(gx, gy);
      const wi =
        Math.min(gridH - 1, Math.floor(gy)) * gridW +
        Math.min(gridW - 1, Math.floor(gx));
      const water = waterMap[wi];
      const light = Math.max(0, 1 - (sx + sy) * params.relief);
      const hue = params.hueLow + (params.hueHigh - params.hueLow) * h;
      const sat = 55 + water * 20;
      const lum = 30 + h * 55 * light;
      const [r, g, b] = hslToRgb(hue, sat, lum);
      const tint = params.waterTint * water;
      const idx = (py * cw + px) * 4;
      data[idx] = r * (1 - tint) + 40 * tint;
      data[idx + 1] = g * (1 - tint) + 90 * tint;
      data[idx + 2] = b * (1 - tint) + 180 * tint;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * HSL → RGB (0-255)
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {[number, number, number]}
 */
function hslToRgb(h, s, l) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = ln - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

// --- ループ ---

function step() {
  if (params.autoRain) {
    for (let i = 0; i < params.dropsPerFrame; i++) simulateDroplet();
  }
  for (let i = 0; i < waterMap.length; i++) waterMap[i] *= 0.95;
  render();
}

function tick() {
  step();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Erosion Landscape',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'gridSize', 60, 280, 10).onChange(initTerrain);
gui.add(params, 'dropsPerFrame', 0, 2000, 50);
gui.add(params, 'iterations', 5, 80, 1);
gui.add(params, 'inertia', 0, 0.5, 0.01);
gui.add(params, 'sedimentCapacity', 1, 10, 0.1);
gui.add(params, 'erodeRate', 0, 1, 0.01);
gui.add(params, 'depositRate', 0, 1, 0.01);
gui.add(params, 'evaporateRate', 0, 0.2, 0.001);
gui.add(params, 'gravity', 1, 10, 0.1);
gui.add(params, 'hueLow', 0, 360, 1);
gui.add(params, 'hueHigh', 0, 360, 1);
gui.add(params, 'relief', 0, 5, 0.1);
gui.add(params, 'waterTint', 0, 1, 0.01);
gui.add(params, 'autoRain');

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.dropsPerFrame = rand(200, 1200, 50);
  params.iterations = rand(20, 60, 1);
  params.inertia = rand(0, 0.3, 0.01);
  params.sedimentCapacity = rand(2, 8, 0.1);
  params.erodeRate = rand(0.1, 0.6, 0.01);
  params.depositRate = rand(0.1, 0.6, 0.01);
  params.hueLow = rand(0, 360, 1);
  params.hueHigh = rand(0, 360, 1);
  params.relief = rand(0.5, 3, 0.1);
  params.waterTint = rand(0, 0.5, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reseed', () => {
  initTerrain();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initTerrain();
  gui.updateDisplay();
});
