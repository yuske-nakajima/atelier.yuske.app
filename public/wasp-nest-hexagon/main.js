// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  cellSize: 32,
  padding: 2,
  rings: 18,
  variation: 0.1,
  fillProb: 0.92,
  hue: 40,
  saturation: 40,
  lightness: 55,
  shadow: 0.4,
  rimLight: 0.5,
  paperGrain: 0.15,
  gapAngle: 0,
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
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 */
function hex(cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function draw() {
  ctx.fillStyle = `hsl(${params.hue}, 30%, 10%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const s = params.cellSize;
  const dx = s * Math.sqrt(3);
  const dy = s * 1.5;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rings = Math.round(params.rings);
  for (let j = -rings; j <= rings; j++) {
    for (let i = -rings; i <= rings; i++) {
      if (rnd() > params.fillProb) continue;
      const x = cx + i * dx + (j % 2 ? dx / 2 : 0);
      const y = cy + j * dy;
      const variance = (rnd() - 0.5) * params.variation * s;
      const r = s - params.padding + variance;
      const light = params.lightness + (rnd() - 0.5) * params.paperGrain * 30;
      ctx.fillStyle = `hsl(${params.hue}, ${params.saturation}%, ${light}%)`;
      hex(x, y, r);
      ctx.fill();
      // 内影
      hex(x, y, r * 0.85);
      const grd = ctx.createRadialGradient(x, y - r * 0.3, 0, x, y, r);
      grd.addColorStop(0, `hsla(${params.hue}, 40%, 20%, 0)`);
      grd.addColorStop(1, `hsla(${params.hue}, 60%, 10%, ${params.shadow})`);
      ctx.fillStyle = grd;
      ctx.fill();
      // リムハイライト
      ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness + 20}%, ${params.rimLight})`;
      ctx.lineWidth = 0.75;
      hex(x, y, r * 0.95);
      ctx.stroke();
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Wasp Nest Hexagon',
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
  ['cellSize', 12, 80, 0.5],
  ['padding', 0, 10, 0.25],
  ['rings', 4, 40, 1],
  ['variation', 0, 0.5, 0.01],
  ['fillProb', 0.4, 1, 0.01],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 20, 80, 1],
  ['shadow', 0, 1, 0.01],
  ['rimLight', 0, 1, 0.01],
  ['paperGrain', 0, 0.5, 0.01],
  ['gapAngle', -0.2, 0.2, 0.01],
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
  params.cellSize = rand(18, 55, 0.5);
  params.variation = rand(0, 0.25, 0.01);
  params.fillProb = rand(0.8, 1, 0.01);
  params.hue = rand(20, 50, 1);
  params.saturation = rand(30, 65, 1);
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
