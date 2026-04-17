// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  rows: 80,
  cols: 140,
  scaleW: 10,
  scaleH: 18,
  overlap: 0.45,
  bands: 4,
  bandPower: 1.5,
  hueA: 200,
  hueB: 280,
  saturation: 70,
  lightness: 55,
  jitter: 0.3,
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
  ctx.fillStyle = '#060305';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const rows = Math.round(params.rows);
  const cols = Math.round(params.cols);
  const sx = canvas.width / cols;
  const sy = canvas.height / rows;
  const w = sx * (1 + params.overlap);
  const h = ((sy * params.scaleH) / params.scaleW) * (1 + params.overlap);
  for (let j = 0; j < rows; j++) {
    const offset = j % 2 ? sx / 2 : 0;
    for (let i = 0; i < cols; i++) {
      const cx = i * sx + offset + (rnd() - 0.5) * sx * params.jitter;
      const cy = j * sy + (rnd() - 0.5) * sy * params.jitter;
      const nx = (i + offset / sx) / cols;
      const ny = j / rows;
      const band = Math.sin(nx * Math.PI * params.bands) ** 2;
      const t = band ** params.bandPower;
      const hue = params.hueA * (1 - t) + params.hueB * t;
      const light =
        params.lightness + Math.sin(ny * Math.PI * 2) * 10 + (rnd() - 0.5) * 6;
      ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${light}%)`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Butterfly Wing Scales',
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
  ['rows', 20, 200, 1],
  ['cols', 40, 300, 1],
  ['scaleW', 4, 30, 0.5],
  ['scaleH', 4, 50, 0.5],
  ['overlap', 0, 1, 0.01],
  ['bands', 0, 12, 0.5],
  ['bandPower', 0.3, 4, 0.05],
  ['hueA', 0, 360, 1],
  ['hueB', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 20, 80, 1],
  ['jitter', 0, 1, 0.01],
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
  params.rows = rand(40, 140, 1);
  params.cols = rand(60, 220, 1);
  params.bands = rand(1, 8, 0.5);
  params.hueA = rand(0, 360, 1);
  params.hueB = rand(0, 360, 1);
  params.saturation = rand(40, 90, 1);
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
