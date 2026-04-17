// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  density: 900,
  minSize: 4,
  maxSize: 28,
  waveSpeed: 0.6,
  waveScale: 0.006,
  hueShift: 60,
  baseHue: 20,
  saturation: 70,
  lightness: 45,
  opacity: 0.85,
  breathing: 0.3,
  groupCount: 4,
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
let cells = [];

function buildCells() {
  setSeed(pageSeed);
  cells = [];
  for (let i = 0; i < Math.round(params.density); i++) {
    cells.push({
      x: rnd() * canvas.width,
      y: rnd() * canvas.height,
      r: params.minSize + rnd() * (params.maxSize - params.minSize),
      group: Math.floor(rnd() * params.groupCount),
      phase: rnd() * Math.PI * 2,
    });
  }
}
buildCells();

let time = 0;

function draw() {
  ctx.fillStyle = `hsl(${params.baseHue}, ${params.saturation * 0.4}%, ${params.lightness - 15}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  time += 1 / 60;
  for (const c of cells) {
    const w = Math.sin(
      time * params.waveSpeed +
        c.x * params.waveScale +
        c.y * params.waveScale +
        c.phase,
    );
    const open = 0.3 + (w * 0.5 + 0.5) * 0.7;
    const hue =
      params.baseHue +
      (c.group / Math.max(1, params.groupCount)) * params.hueShift;
    const r = c.r * (1 - params.breathing + open * params.breathing);
    ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.opacity})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
draw();

const gui = new TileUI({
  title: 'Cephalopod Skin',
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
  ['density', 100, 3000, 10],
  ['minSize', 1, 20, 0.5],
  ['maxSize', 8, 80, 0.5],
  ['waveSpeed', 0, 3, 0.01],
  ['waveScale', 0.001, 0.03, 0.0005],
  ['hueShift', 0, 360, 1],
  ['baseHue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 10, 80, 1],
  ['opacity', 0.1, 1, 0.01],
  ['breathing', 0, 1, 0.01],
  ['groupCount', 1, 8, 1],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s).onChange(() => {
    if (
      k === 'density' ||
      k === 'minSize' ||
      k === 'maxSize' ||
      k === 'groupCount'
    )
      buildCells();
  });
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
  params.density = rand(400, 1800, 10);
  params.minSize = rand(2, 8, 0.5);
  params.maxSize = rand(15, 50, 0.5);
  params.baseHue = rand(0, 360, 1);
  params.hueShift = rand(30, 200, 1);
  params.saturation = rand(40, 90, 1);
  pageSeed = Math.floor(Math.random() * 1e9);
  buildCells();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  pageSeed = Math.floor(Math.random() * 1e9);
  buildCells();
  gui.updateDisplay();
});

window.addEventListener('resize', buildCells);
