// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  rule: 30,
  cols: 200,
  rows: 140,
  density: 0.2,
  cellPadding: 0.05,
  hueAlive: 25,
  hueDead: 210,
  saturation: 50,
  lightAlive: 30,
  lightDead: 88,
  taper: 0.7,
  noise: 0.03,
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

function draw() {
  ctx.fillStyle = `hsl(${params.hueDead}, 20%, 10%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const cols = Math.round(params.cols);
  const rows = Math.round(params.rows);
  const rule = Math.round(params.rule) & 0xff;
  let row = new Uint8Array(cols);
  for (let i = 0; i < cols; i++) row[i] = rnd() < params.density ? 1 : 0;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;
  for (let j = 0; j < rows; j++) {
    const t = j / rows;
    const scaleX = 1 - t * params.taper;
    const offsetX = (canvas.width * (1 - scaleX)) / 2;
    for (let i = 0; i < cols; i++) {
      const v = row[i];
      const hue = v ? params.hueAlive : params.hueDead;
      const light = v ? params.lightAlive : params.lightDead;
      const nv = (rnd() - 0.5) * params.noise * 100;
      ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${light + nv}%)`;
      const x = offsetX + i * cellW * scaleX;
      const w = cellW * scaleX * (1 - params.cellPadding);
      const h = cellH * (1 - params.cellPadding);
      ctx.fillRect(x, j * cellH, w, h);
    }
    const next = new Uint8Array(cols);
    for (let i = 0; i < cols; i++) {
      const l = row[(i - 1 + cols) % cols];
      const c = row[i];
      const r = row[(i + 1) % cols];
      const idx = (l << 2) | (c << 1) | r;
      next[i] = (rule >> idx) & 1;
    }
    row = next;
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Conus Textile Pattern',
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
  ['rule', 0, 255, 1],
  ['cols', 40, 400, 2],
  ['rows', 40, 300, 1],
  ['density', 0.02, 1, 0.01],
  ['cellPadding', 0, 0.5, 0.01],
  ['hueAlive', 0, 360, 1],
  ['hueDead', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightAlive', 5, 60, 1],
  ['lightDead', 40, 100, 1],
  ['taper', 0, 0.95, 0.01],
  ['noise', 0, 0.2, 0.005],
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

const niceRules = [30, 45, 73, 75, 86, 89, 101, 110, 124, 135, 149, 169, 193];
gui.addButton('Random', () => {
  params.rule = niceRules[Math.floor(Math.random() * niceRules.length)];
  params.density = rand(0.05, 0.5, 0.01);
  params.hueAlive = rand(0, 360, 1);
  params.hueDead = rand(0, 360, 1);
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
