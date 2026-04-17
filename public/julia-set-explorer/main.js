// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  cReal: -0.7, // 定数 c の実部
  cImag: 0.27015, // 定数 c の虚部
  maxIter: 120, // 最大反復回数
  zoom: 1.0, // 拡大率
  offsetX: 0, // 中心の x オフセット
  offsetY: 0, // 中心の y オフセット
  hueBase: 220, // 色相ベース
  hueRange: 200, // 色相幅
  saturation: 80, // 彩度
  brightness: 60, // 明度
  resolution: 2, // ピクセル刻み（大きいほど粗い）
  animate: false, // c を時間で揺らす
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

// --- 描画 ---

let time = 0;

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const step = Math.max(1, Math.round(params.resolution));
  const scale = 3.0 / (params.zoom * Math.min(w, h));
  const cx = w / 2;
  const cy = h / 2;

  let cRe = params.cReal;
  let cIm = params.cImag;
  if (params.animate) {
    cRe += Math.cos(time * 0.5) * 0.05;
    cIm += Math.sin(time * 0.4) * 0.05;
  }

  const maxIter = Math.max(1, Math.round(params.maxIter));
  const img = ctx.createImageData(w, h);
  const data = img.data;

  for (let py = 0; py < h; py += step) {
    for (let px = 0; px < w; px += step) {
      let zx = (px - cx) * scale + params.offsetX;
      let zy = (py - cy) * scale + params.offsetY;
      let i = 0;
      while (i < maxIter && zx * zx + zy * zy < 4) {
        const xt = zx * zx - zy * zy + cRe;
        zy = 2 * zx * zy + cIm;
        zx = xt;
        i++;
      }
      const t = i / maxIter;
      let r = 0;
      let g = 0;
      let b = 0;
      if (i < maxIter) {
        const hue = (params.hueBase + t * params.hueRange) % 360;
        [r, g, b] = hslToRgb(hue, params.saturation, params.brightness);
      }
      // step ピクセル分を埋める
      for (let dy = 0; dy < step && py + dy < h; dy++) {
        for (let dx = 0; dx < step && px + dx < w; dx++) {
          const idx = ((py + dy) * w + (px + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * HSL -> RGB 変換
 * @param {number} h 0-360
 * @param {number} s 0-100
 * @param {number} l 0-100
 * @returns {[number, number, number]}
 */
function hslToRgb(h, s, l) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = h / 60;
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
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

let dirty = true;
function tick() {
  time += 1 / 60;
  if (params.animate || dirty) {
    draw();
    dirty = false;
  }
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Julia Set Explorer',
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

gui.add(params, 'cReal', -2, 2, 0.001).onChange(onChange);
gui.add(params, 'cImag', -2, 2, 0.001).onChange(onChange);
gui.add(params, 'maxIter', 10, 500, 1).onChange(onChange);
gui.add(params, 'zoom', 0.1, 10, 0.01).onChange(onChange);
gui.add(params, 'offsetX', -2, 2, 0.01).onChange(onChange);
gui.add(params, 'offsetY', -2, 2, 0.01).onChange(onChange);
gui.add(params, 'hueBase', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueRange', 0, 720, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'brightness', 0, 100, 1).onChange(onChange);
gui.add(params, 'resolution', 1, 6, 1).onChange(onChange);
gui.add(params, 'animate');

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
  params.cReal = rand(-1, 1, 0.001);
  params.cImag = rand(-1, 1, 0.001);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(120, 480, 1);
  params.zoom = rand(0.8, 2.5, 0.01);
  dirty = true;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  dirty = true;
  gui.updateDisplay();
});
