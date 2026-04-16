// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  count: 80, // 点群の数
  resolution: 4, // サンプリング解像度（大きいほど粗く軽い）
  metric: 1, // 1:Euclidean, 2:Manhattan, 3:Chebyshev
  hueBase: 200, // 色相の基準
  hueRange: 90, // 色相の揺れ幅
  saturation: 0.6, // 彩度
  lightness: 0.5, // 明度
  borderStrength: 0.7, // 境界線の強さ
  borderWidth: 2, // 境界線の幅（距離差の閾値）
  motion: 0.4, // 点群のゆらぎ速度
  wobble: 40, // ゆらぎの振幅
  jitter: 0.3, // 色のばらつき
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

let width = 0;
let height = 0;
/** @type {ImageData | null} */
let image = null;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  width = Math.ceil(canvas.width / params.resolution);
  height = Math.ceil(canvas.height / params.resolution);
  image = ctx.createImageData(width, height);
  reseed();
}

/**
 * @typedef {{ ox: number, oy: number, x: number, y: number, phase: number, hue: number }} Site
 */

/** @type {Site[]} */
let sites = [];

function reseed() {
  sites = [];
  for (let i = 0; i < params.count; i++) {
    const ox = Math.random() * canvas.width;
    const oy = Math.random() * canvas.height;
    sites.push({
      ox,
      oy,
      x: ox,
      y: oy,
      phase: Math.random() * Math.PI * 2,
      hue:
        params.hueBase +
        (Math.random() - 0.5) * params.hueRange +
        (Math.random() - 0.5) * params.jitter * 120,
    });
  }
}

window.addEventListener('resize', resize);
resize();

// --- 距離関数 ---

/**
 * @param {number} dx
 * @param {number} dy
 */
function distance(dx, dy) {
  if (params.metric === 2) return Math.abs(dx) + Math.abs(dy);
  if (params.metric === 3) return Math.max(Math.abs(dx), Math.abs(dy));
  return Math.sqrt(dx * dx + dy * dy);
}

// --- 更新 ---

let time = 0;

function step() {
  time += 0.016;
  const w = params.wobble;
  for (const s of sites) {
    s.x = s.ox + Math.sin(time * params.motion + s.phase) * w;
    s.y = s.oy + Math.cos(time * params.motion * 1.1 + s.phase * 1.3) * w;
  }
}

/**
 * HSL → RGB
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {[number, number, number]}
 */
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = (((h % 360) + 360) % 360) / 60;
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
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function draw() {
  if (!image) return;
  const data = image.data;
  const res = params.resolution;
  const bw = Math.max(0.1, params.borderWidth);
  for (let y = 0; y < height; y++) {
    const py = y * res;
    for (let x = 0; x < width; x++) {
      const px = x * res;
      let best = Infinity;
      let second = Infinity;
      let bestIdx = 0;
      for (let i = 0; i < sites.length; i++) {
        const s = sites[i];
        const d = distance(px - s.x, py - s.y);
        if (d < best) {
          second = best;
          best = d;
          bestIdx = i;
        } else if (d < second) {
          second = d;
        }
      }
      const site = sites[bestIdx];
      const edge = Math.max(0, 1 - (second - best) / bw);
      const border = edge * params.borderStrength;
      const [r, g, b] = hslToRgb(
        site.hue,
        params.saturation,
        params.lightness * (1 - border),
      );
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  if (res !== 1) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      canvas,
      0,
      0,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }
}

function tick() {
  step();
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Voronoi Mosaic',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 10, 300, 1).onChange(reseed);
gui.add(params, 'resolution', 1, 8, 1).onChange(resize);
gui.add(params, 'metric', 1, 3, 1);
gui.add(params, 'hueBase', 0, 360, 1).onChange(reseed);
gui.add(params, 'hueRange', 0, 360, 1).onChange(reseed);
gui.add(params, 'saturation', 0, 1, 0.01);
gui.add(params, 'lightness', 0.1, 0.9, 0.01);
gui.add(params, 'borderStrength', 0, 1, 0.01);
gui.add(params, 'borderWidth', 0.2, 10, 0.1);
gui.add(params, 'motion', 0, 2, 0.01);
gui.add(params, 'wobble', 0, 150, 1);
gui.add(params, 'jitter', 0, 1, 0.01).onChange(reseed);

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
  params.count = rand(30, 200, 1);
  params.metric = rand(1, 3, 1);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(20, 200, 1);
  params.saturation = rand(0.3, 1, 0.01);
  params.lightness = rand(0.3, 0.7, 0.01);
  params.borderStrength = rand(0.3, 1, 0.01);
  params.borderWidth = rand(0.5, 4, 0.1);
  params.motion = rand(0.1, 1, 0.01);
  params.wobble = rand(10, 80, 1);
  params.jitter = rand(0.1, 0.8, 0.01);
  reseed();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  resize();
  gui.updateDisplay();
});
