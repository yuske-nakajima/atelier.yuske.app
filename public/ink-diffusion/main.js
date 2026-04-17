// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  resolution: 180, // 内部シミュレーション解像度
  diffusion: 0.22, // 拡散率
  evaporation: 0.004, // 徐々に薄れる量
  dropInterval: 1.2, // 墨を落とす間隔（秒）
  dropRadius: 6, // 墨のサイズ
  dropStrength: 1, // 墨の濃さ
  hueBase: 220, // 基本色相
  hueSpread: 60, // 色相の広がり
  saturation: 60, // 彩度
  paper: 245, // 紙の明度（0-255）
  turbulence: 0.3, // 拡散の揺らぎ
  contrast: 1.1, // コントラスト
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

const offscreen = document.createElement('canvas');
const offCtx = /** @type {CanvasRenderingContext2D} */ (
  offscreen.getContext('2d')
);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- グリッド ---

let W = 0;
let H = 0;
/** @type {Float32Array} */
let fieldR = new Float32Array(0);
/** @type {Float32Array} */
let fieldG = new Float32Array(0);
/** @type {Float32Array} */
let fieldB = new Float32Array(0);
/** @type {Float32Array} */
let bufR = new Float32Array(0);
/** @type {Float32Array} */
let bufG = new Float32Array(0);
/** @type {Float32Array} */
let bufB = new Float32Array(0);

function resetField() {
  const res = Math.max(40, Math.round(params.resolution));
  const aspect = canvas.width / canvas.height;
  W = aspect >= 1 ? res : Math.round(res * aspect);
  H = aspect >= 1 ? Math.round(res / aspect) : res;
  const n = W * H;
  fieldR = new Float32Array(n);
  fieldG = new Float32Array(n);
  fieldB = new Float32Array(n);
  bufR = new Float32Array(n);
  bufG = new Float32Array(n);
  bufB = new Float32Array(n);
  offscreen.width = W;
  offscreen.height = H;
}
resetField();

// --- 墨を落とす ---

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} radius
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
function drop(cx, cy, radius, r, g, b) {
  const rr = radius * radius;
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(W - 1, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(H - 1, Math.ceil(cy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > rr) continue;
      const falloff = 1 - d2 / rr;
      const idx = y * W + x;
      fieldR[idx] += r * falloff * params.dropStrength;
      fieldG[idx] += g * falloff * params.dropStrength;
      fieldB[idx] += b * falloff * params.dropStrength;
    }
  }
}

/**
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {[number, number, number]}
 */
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

function randomDrop() {
  const hue = params.hueBase + (Math.random() - 0.5) * params.hueSpread;
  const [r, g, b] = hslToRgb(hue, params.saturation, 35);
  const cx = Math.random() * W;
  const cy = Math.random() * H;
  const radius = Math.max(2, params.dropRadius * (0.5 + Math.random()));
  drop(cx, cy, radius, r, g, b);
}

// --- 拡散 ---

function diffuse() {
  const d = Math.max(0, Math.min(0.4, params.diffusion));
  const evap = Math.max(0, params.evaporation);
  const turb = params.turbulence;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      const xm = x > 0 ? idx - 1 : idx;
      const xp = x < W - 1 ? idx + 1 : idx;
      const ym = y > 0 ? idx - W : idx;
      const yp = y < H - 1 ? idx + W : idx;
      const lap =
        (fieldR[xm] + fieldR[xp] + fieldR[ym] + fieldR[yp]) * 0.25 -
        fieldR[idx];
      const lap2 =
        (fieldG[xm] + fieldG[xp] + fieldG[ym] + fieldG[yp]) * 0.25 -
        fieldG[idx];
      const lap3 =
        (fieldB[xm] + fieldB[xp] + fieldB[ym] + fieldB[yp]) * 0.25 -
        fieldB[idx];
      const jitter = 1 + (Math.random() - 0.5) * turb;
      bufR[idx] = Math.max(0, fieldR[idx] + lap * d * jitter - evap);
      bufG[idx] = Math.max(0, fieldG[idx] + lap2 * d * jitter - evap);
      bufB[idx] = Math.max(0, fieldB[idx] + lap3 * d * jitter - evap);
    }
  }
  [fieldR, bufR] = [bufR, fieldR];
  [fieldG, bufG] = [bufG, fieldG];
  [fieldB, bufB] = [bufB, fieldB];
}

// --- 描画 ---

function render() {
  const img = offCtx.createImageData(W, H);
  const data = img.data;
  const paper = params.paper;
  const k = params.contrast;
  for (let i = 0; i < W * H; i++) {
    const r = Math.min(1, fieldR[i] * k);
    const g = Math.min(1, fieldG[i] * k);
    const b = Math.min(1, fieldB[i] * k);
    const j = i * 4;
    data[j] = paper * (1 - r) + 0 * r;
    data[j + 1] = paper * (1 - g) + 0 * g;
    data[j + 2] = paper * (1 - b) + 0 * b;
    data[j + 3] = 255;
  }
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
}

let lastDrop = performance.now();

function tick(now) {
  if ((now - lastDrop) / 1000 >= params.dropInterval) {
    randomDrop();
    lastDrop = now;
  }
  diffuse();
  render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- GUI ---

const gui = new TileUI({
  title: 'Ink Diffusion',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'resolution', 80, 280, 10).onChange(resetField);
gui.add(params, 'diffusion', 0, 0.4, 0.005);
gui.add(params, 'evaporation', 0, 0.02, 0.0005);
gui.add(params, 'dropInterval', 0.1, 5, 0.05);
gui.add(params, 'dropRadius', 2, 20, 0.5);
gui.add(params, 'dropStrength', 0.1, 3, 0.05);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueSpread', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'paper', 180, 255, 1);
gui.add(params, 'turbulence', 0, 1, 0.01);
gui.add(params, 'contrast', 0.5, 2, 0.05);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.diffusion = r(0.15, 0.3, 0.005);
  params.evaporation = r(0, 0.008, 0.0005);
  params.dropInterval = r(0.3, 2, 0.05);
  params.dropRadius = r(3, 12, 0.5);
  params.hueBase = r(0, 360, 1);
  params.hueSpread = r(30, 180, 1);
  params.saturation = r(20, 80, 1);
  params.turbulence = r(0.1, 0.6, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  resetField();
  gui.updateDisplay();
});
