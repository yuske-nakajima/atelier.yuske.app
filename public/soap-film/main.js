// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  bands: 14, // 干渉縞のバンド数
  thickness: 1.2, // 膜厚係数
  turbulence: 0.6, // 乱流の強さ
  flow: 0.4, // 流れる速さ
  scale: 220, // 模様のスケール
  hueBase: 200, // 色相の基準
  hueRange: 180, // 色相のレンジ
  saturation: 80, // 彩度
  lightness: 60, // 明度
  swirl: 1.2, // 渦の強さ
  blur: 2, // グロー
  contrast: 1.0, // コントラスト
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
 * 疑似 2D ノイズ
 * @param {number} x
 * @param {number} y
 */
function noise(x, y) {
  return (
    Math.sin(x * 0.9 + Math.cos(y * 1.3)) * 0.5 +
    Math.sin(x * 1.7 - y * 0.8) * 0.3 +
    Math.cos(x * 0.4 + y * 2.1) * 0.2
  );
}

let time = 0;

function draw() {
  time += 0.01 * params.flow;
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const step = 2;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const nx = (x / params.scale) * 1.0;
      const ny = (y / params.scale) * 1.0;
      const n =
        noise(nx + time, ny) * params.turbulence +
        noise(nx * params.swirl, ny * params.swirl + time * 0.5) * 0.6;
      const band = ((n + 1) * 0.5 * params.bands * params.thickness) % 1;
      const hue = (params.hueBase + band * params.hueRange) % 360;
      const [r, g, b] = hslToRgb(
        hue,
        params.saturation / 100,
        params.lightness / 100,
      );
      const cr = Math.min(255, r * params.contrast);
      const cg = Math.min(255, g * params.contrast);
      const cb = Math.min(255, b * params.contrast);
      for (let dy = 0; dy < step && y + dy < h; dy++) {
        for (let dx = 0; dx < step && x + dx < w; dx++) {
          const j = ((y + dy) * w + (x + dx)) * 4;
          data[j] = cr;
          data[j + 1] = cg;
          data[j + 2] = cb;
          data[j + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  if (params.blur > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = `blur(${params.blur}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }
}

/**
 * HSL -> RGB
 * @param {number} h 0..360
 * @param {number} s 0..1
 * @param {number} l 0..1
 */
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Soap Film',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'bands', 2, 40, 1);
gui.add(params, 'thickness', 0.3, 3, 0.05);
gui.add(params, 'turbulence', 0, 2, 0.05);
gui.add(params, 'flow', 0, 2, 0.05);
gui.add(params, 'scale', 60, 600, 1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 10, 90, 1);
gui.add(params, 'swirl', 0, 3, 0.05);
gui.add(params, 'blur', 0, 8, 0.5);
gui.add(params, 'contrast', 0.5, 1.8, 0.05);

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
  params.bands = rand(6, 24, 1);
  params.thickness = rand(0.6, 2.0, 0.05);
  params.turbulence = rand(0.2, 1.2, 0.05);
  params.flow = rand(0.1, 1.0, 0.05);
  params.scale = rand(120, 400, 1);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  params.saturation = rand(60, 95, 1);
  params.lightness = rand(45, 70, 1);
  params.swirl = rand(0.4, 2.0, 0.05);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
