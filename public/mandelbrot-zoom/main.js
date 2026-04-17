// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// マンデルブロ集合ズーム：自動的に深い場所にズームインしていく。
// カラーマッピングと反復回数で美しいフラクタルを描画する。

const params = {
  centerX: -0.7435669, // ズーム中心X
  centerY: 0.1314023, // ズーム中心Y
  maxIter: 200, // 最大反復回数
  zoomSpeed: 0.005, // ズーム速度
  hueOffset: 240, // 色相オフセット
  hueScale: 3.0, // 色相スケール
  brightness: 60, // 明度
  saturation: 80, // 彩度
  smoothColor: 1, // スムーズカラー（0/1）
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

const SCALE = 0.35; // 描画解像度
const offscreen = document.createElement('canvas');
const offCtx = /** @type {CanvasRenderingContext2D} */ (
  offscreen.getContext('2d')
);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  offscreen.width = Math.round(canvas.width * SCALE);
  offscreen.height = Math.round(canvas.height * SCALE);
}
window.addEventListener('resize', resize);
resize();

let zoom = 1;
const animating = true;

/**
 * マンデルブロ集合の反復回数を計算する
 * @param {number} cx
 * @param {number} cy
 * @param {number} maxIter
 * @returns {number}
 */
function mandelbrot(cx, cy, maxIter) {
  let zx = 0;
  let zy = 0;
  let iter = 0;
  while (iter < maxIter && zx * zx + zy * zy <= 4) {
    const tmp = zx * zx - zy * zy + cx;
    zy = 2 * zx * zy + cy;
    zx = tmp;
    iter++;
  }
  if (params.smoothColor && iter < maxIter) {
    const logZn = Math.log(zx * zx + zy * zy) / 2;
    const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
    return iter + 1 - nu;
  }
  return iter;
}

/**
 * 反復回数を色に変換する
 * @param {number} iter
 * @param {number} maxIter
 * @returns {{r: number, g: number, b: number}}
 */
function iterToColor(iter, maxIter) {
  if (iter >= maxIter) return { r: 0, g: 0, b: 0 };
  const t = iter / maxIter;
  const hue = (params.hueOffset + t * 360 * params.hueScale) % 360;
  const sat = params.saturation / 100;
  const lig = (params.brightness / 100) * t ** 0.3;

  const h0 = hue / 60;
  const c0 = (1 - Math.abs(2 * lig - 1)) * sat;
  const x0 = c0 * (1 - Math.abs((h0 % 2) - 1));
  const m0 = lig - c0 / 2;
  let r0 = 0,
    g0 = 0,
    b0 = 0;
  if (h0 < 1) {
    r0 = c0;
    g0 = x0;
  } else if (h0 < 2) {
    r0 = x0;
    g0 = c0;
  } else if (h0 < 3) {
    g0 = c0;
    b0 = x0;
  } else if (h0 < 4) {
    g0 = x0;
    b0 = c0;
  } else if (h0 < 5) {
    r0 = x0;
    b0 = c0;
  } else {
    r0 = c0;
    b0 = x0;
  }

  return {
    r: Math.round((r0 + m0) * 255),
    g: Math.round((g0 + m0) * 255),
    b: Math.round((b0 + m0) * 255),
  };
}

function draw() {
  if (animating) zoom *= 1 + params.zoomSpeed;

  const ow = offscreen.width;
  const oh = offscreen.height;
  const imgData = offCtx.createImageData(ow, oh);
  const data = imgData.data;

  const scale = 4 / (ow * zoom);
  const cx = params.centerX;
  const cy = params.centerY;
  const maxIter = Math.round(params.maxIter);

  for (let py = 0; py < oh; py++) {
    for (let px = 0; px < ow; px++) {
      const x = (px - ow / 2) * scale + cx;
      const y = (py - oh / 2) * scale + cy;
      const iter = mandelbrot(x, y, maxIter);
      const { r, g, b } = iterToColor(iter, maxIter);
      const idx = (py * ow + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  offCtx.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Mandelbrot Zoom',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'centerX', -2, 1, 0.0000001);
gui.add(params, 'centerY', -1.5, 1.5, 0.0000001);
gui.add(params, 'maxIter', 50, 1000, 10);
gui.add(params, 'zoomSpeed', 0, 0.05, 0.001);
gui.add(params, 'hueOffset', 0, 360, 1);
gui.add(params, 'hueScale', 0.5, 10, 0.1);
gui.add(params, 'brightness', 20, 90, 1);
gui.add(params, 'saturation', 0, 100, 1);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

// 有名な場所のプリセット
const presets = [
  { x: -0.7435669, y: 0.1314023 },
  { x: -0.7453, y: 0.1127 },
  { x: 0.3602404, y: -0.641313 },
  { x: -1.0149416, y: 0.3521033 },
];

gui.addButton('Random', () => {
  const p = presets[Math.floor(Math.random() * presets.length)];
  params.centerX = p.x;
  params.centerY = p.y;
  params.hueOffset = rand(0, 360, 1);
  params.hueScale = rand(1, 8, 0.1);
  zoom = 1;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  zoom = 1;
  gui.updateDisplay();
});
