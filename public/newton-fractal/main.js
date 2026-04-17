// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// ニュートン法フラクタル：複素平面上での多項式のゼロ点を
// ニュートン法で反復し、収束先で色分けするフラクタル。

const params = {
  degree: 3, // 多項式の次数（3: z^3-1, 4: z^4-1 等）
  centerX: 0, // 中心X
  centerY: 0, // 中心Y
  scale: 2.5, // 表示スケール
  maxIter: 40, // 最大反復回数
  tolerance: 0.0001, // 収束判定閾値
  damping: 1.0, // ニュートンの減衰係数
  brightness: 65, // 明度
  saturation: 80, // 彩度
  zoomSpeed: 0.002, // ズーム速度
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
 * 複素数の掛け算
 * @param {{r: number, i: number}} a
 * @param {{r: number, i: number}} b
 * @returns {{r: number, i: number}}
 */
function cmul(a, b) {
  return { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r };
}

/**
 * 複素数の割り算
 * @param {{r: number, i: number}} a
 * @param {{r: number, i: number}} b
 * @returns {{r: number, i: number}}
 */
function cdiv(a, b) {
  const d = b.r * b.r + b.i * b.i;
  return { r: (a.r * b.r + a.i * b.i) / d, i: (a.i * b.r - a.r * b.i) / d };
}

/**
 * z^n を計算する（複素数）
 * @param {{r: number, i: number}} z
 * @param {number} n
 * @returns {{r: number, i: number}}
 */
function cpow(z, n) {
  let result = { r: 1, i: 0 };
  for (let i = 0; i < n; i++) result = cmul(result, z);
  return result;
}

/**
 * ニュートン法で z^n - 1 = 0 の解に収束させる
 * @param {number} x 実部
 * @param {number} y 虚部
 * @param {number} deg 次数
 * @returns {{root: number, iter: number}}
 */
function newton(x, y, deg) {
  let z = { r: x, i: y };
  for (let i = 0; i < params.maxIter; i++) {
    const zn = cpow(z, deg);
    const fn = { r: zn.r - 1, i: zn.i }; // f(z) = z^n - 1
    const zn1 = cpow(z, deg - 1);
    const dfn = { r: deg * zn1.r, i: deg * zn1.i }; // f'(z) = n * z^(n-1)
    const step = cdiv(fn, dfn);
    z = { r: z.r - params.damping * step.r, i: z.i - params.damping * step.i };

    const r2 = step.r * step.r + step.i * step.i;
    if (r2 < params.tolerance * params.tolerance) {
      // 収束した根のインデックスを特定
      let minDist = Infinity;
      let root = 0;
      for (let k = 0; k < deg; k++) {
        const angle = (k * Math.PI * 2) / deg;
        const rx = Math.cos(angle);
        const ry = Math.sin(angle);
        const d = (z.r - rx) ** 2 + (z.i - ry) ** 2;
        if (d < minDist) {
          minDist = d;
          root = k;
        }
      }
      return { root, iter: i };
    }
  }
  return { root: -1, iter: params.maxIter };
}

function draw() {
  zoom *= 1 + params.zoomSpeed;

  const ow = offscreen.width;
  const oh = offscreen.height;
  const imgData = offCtx.createImageData(ow, oh);
  const data = imgData.data;

  const viewScale = params.scale / (ow * zoom);
  const deg = Math.max(2, Math.min(8, Math.round(params.degree)));

  for (let py = 0; py < oh; py++) {
    for (let px = 0; px < ow; px++) {
      const x = (px - ow / 2) * viewScale + params.centerX;
      const y = (py - oh / 2) * viewScale + params.centerY;
      const { root, iter } = newton(x, y, deg);
      const idx = (py * ow + px) * 4;

      if (root < 0) {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
      } else {
        const hue = ((root * 360) / deg) % 360;
        const t = iter / params.maxIter;
        const sat = params.saturation / 100;
        const lig = (params.brightness / 100) * (1 - t * 0.5);

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

        data[idx] = Math.round((r0 + m0) * 255);
        data[idx + 1] = Math.round((g0 + m0) * 255);
        data[idx + 2] = Math.round((b0 + m0) * 255);
      }
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
  title: 'Newton Fractal',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'degree', 2, 8, 1);
gui.add(params, 'centerX', -2, 2, 0.001);
gui.add(params, 'centerY', -2, 2, 0.001);
gui.add(params, 'scale', 0.5, 8, 0.1);
gui.add(params, 'maxIter', 10, 200, 5);
gui.add(params, 'damping', 0.1, 2, 0.01);
gui.add(params, 'zoomSpeed', 0, 0.02, 0.001);
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
  params.degree = rand(2, 7, 1);
  params.damping = rand(0.5, 1.5, 0.01);
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
