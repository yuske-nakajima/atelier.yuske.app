// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  count: 80,
  minWidth: 8,
  maxWidth: 60,
  minLength: 40,
  maxLength: 320,
  taper: 0.85,
  segments: 12,
  jitter: 0.25,
  floorRatio: 0.35,
  hue: 30,
  saturation: 20,
  lightness: 35,
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

let seed = 1;
function setSeed(n) {
  seed = n >>> 0 || 1;
}
function rnd() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) % 100000) / 100000;
}

let pageSeed = Math.floor(Math.random() * 1e9);

/**
 * @param {number} x
 * @param {number} y0
 * @param {number} width
 * @param {number} length
 * @param {-1|1} dir
 */
function drawStalactite(x, y0, width, length, dir) {
  const segs = Math.round(params.segments);
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = width * (1 - t) ** params.taper;
    const jx = (rnd() - 0.5) * width * params.jitter;
    pts.push([x + jx, y0 + dir * length * t, w]);
  }
  ctx.fillStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.beginPath();
  for (const [px, py, w] of pts) ctx.lineTo(px - w / 2, py);
  for (let i = pts.length - 1; i >= 0; i--) {
    const [px, py, w] = pts[i];
    ctx.lineTo(px + w / 2, py);
  }
  ctx.closePath();
  ctx.fill();

  // ハイライト
  ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness + 25}%, 0.4)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (const [px, py, w] of pts) ctx.lineTo(px - w / 4, py);
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = '#08070a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const n = Math.round(params.count);
  for (let i = 0; i < n; i++) {
    const x = rnd() * canvas.width;
    const w = params.minWidth + rnd() * (params.maxWidth - params.minWidth);
    const l = params.minLength + rnd() * (params.maxLength - params.minLength);
    drawStalactite(x, 0, w, l, 1);
  }
  // 床の石筍
  const n2 = Math.round(n * params.floorRatio);
  for (let i = 0; i < n2; i++) {
    const x = rnd() * canvas.width;
    const w = params.minWidth + rnd() * (params.maxWidth - params.minWidth);
    const l =
      params.minLength + rnd() * (params.maxLength - params.minLength) * 0.6;
    drawStalactite(x, canvas.height, w, l, -1);
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Stalactite Formation',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

/** @type {Array<[keyof typeof params, number, number, number]>} */
const ctrls = [
  ['count', 10, 240, 1],
  ['minWidth', 2, 40, 1],
  ['maxWidth', 20, 160, 1],
  ['minLength', 10, 200, 1],
  ['maxLength', 60, 600, 1],
  ['taper', 0.2, 2, 0.01],
  ['segments', 4, 30, 1],
  ['jitter', 0, 1, 0.01],
  ['floorRatio', 0, 1, 0.01],
  ['hue', 0, 360, 1],
  ['saturation', 0, 80, 1],
  ['lightness', 10, 80, 1],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s).onChange(redraw);
}

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

gui.addButton('Random', () => {
  params.count = rand(40, 160, 1);
  params.minWidth = rand(4, 20, 1);
  params.maxWidth = rand(30, 100, 1);
  params.minLength = rand(20, 100, 1);
  params.maxLength = rand(120, 480, 1);
  params.taper = rand(0.4, 1.4, 0.01);
  params.jitter = rand(0.05, 0.5, 0.01);
  params.hue = rand(0, 360, 1);
  pageSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  pageSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
