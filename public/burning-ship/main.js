// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 燃える船フラクタル：マンデルブロ変形。
// z^2 + c の代わりに (|Re(z)| + i|Im(z)|)^2 + c を使い、
// 船が燃えているような不思議なフラクタルを生成する。

const params = {
  centerX: -1.75, // 中心X
  centerY: -0.04, // 中心Y
  scale: 3.5, // 表示スケール
  maxIter: 150, // 最大反復回数
  hueOffset: 20, // 色相オフセット（橙・炎色）
  hueScale: 4.0, // 色相スケール
  brightness: 65, // 明度
  saturation: 85, // 彩度
  zoomSpeed: 0.003, // ズーム速度
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

const SCALE = 0.35;
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

/**
 * Burning Ship フラクタルの反復回数を計算する
 * @param {number} cx
 * @param {number} cy
 * @param {number} maxIter
 * @returns {number}
 */
function burningShip(cx, cy, maxIter) {
  let zx = 0;
  let zy = 0;
  let iter = 0;
  while (iter < maxIter && zx * zx + zy * zy <= 4) {
    const absZx = Math.abs(zx);
    const absZy = Math.abs(zy);
    const tmp = absZx * absZx - absZy * absZy + cx;
    zy = 2 * absZx * absZy + cy;
    zx = tmp;
    iter++;
  }
  if (iter < maxIter) {
    const logZn = Math.log(zx * zx + zy * zy) / 2;
    const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
    return iter + 1 - nu;
  }
  return iter;
}

/**
 * 反復回数を色に変換する（炎の色調）
 * @param {number} iter
 * @param {number} maxIter
 * @returns {{r: number, g: number, b: number}}
 */
function iterToColor(iter, maxIter) {
  if (iter >= maxIter) return { r: 0, g: 0, b: 0 };
  const t = iter / maxIter;
  const hue = (params.hueOffset + t * 360 * params.hueScale) % 360;
  const sat = params.saturation / 100;
  const lig = (params.brightness / 100) * t ** 0.25;

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
  zoom *= 1 + params.zoomSpeed;

  const ow = offscreen.width;
  const oh = offscreen.height;
  const imgData = offCtx.createImageData(ow, oh);
  const data = imgData.data;

  const viewScale = params.scale / (ow * zoom);
  const maxIter = Math.round(params.maxIter);

  for (let py = 0; py < oh; py++) {
    for (let px = 0; px < ow; px++) {
      const x = (px - ow / 2) * viewScale + params.centerX;
      const y = (py - oh / 2) * viewScale + params.centerY;
      const iter = burningShip(x, y, maxIter);
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
  title: 'Burning Ship',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'centerX', -3, 2, 0.0001);
gui.add(params, 'centerY', -2, 2, 0.0001);
gui.add(params, 'scale', 0.5, 10, 0.1);
gui.add(params, 'maxIter', 50, 500, 10);
gui.add(params, 'zoomSpeed', 0, 0.03, 0.001);
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

gui.addButton('Random', () => {
  params.hueOffset = rand(0, 360, 1);
  params.hueScale = rand(1, 8, 0.1);
  params.brightness = rand(40, 80, 1);
  params.saturation = rand(60, 100, 1);
  zoom = 1;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  zoom = 1;
  gui.updateDisplay();
});
