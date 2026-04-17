// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  walls: 800,
  wallJitter: 10,
  chamberCount: 40,
  chamberMin: 10,
  chamberMax: 40,
  mound: 0.7,
  hueMud: 25,
  saturation: 40,
  lightness: 32,
  chamberLight: 15,
  skyHue: 210,
  skyLight: 75,
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
  ctx.fillStyle = `hsl(${params.skyHue}, 40%, ${params.skyLight}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  // 塔のシルエット
  const w = canvas.width;
  const h = canvas.height;
  const base = h * params.mound;
  ctx.fillStyle = `hsl(${params.hueMud}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.beginPath();
  ctx.moveTo(0, h);
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * w;
    const noise = Math.sin(t * 9) * 20 + Math.sin(t * 23) * 8;
    const yTop = base - Math.sin(t * Math.PI) * h * 0.5 + noise;
    ctx.lineTo(x, yTop);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // 壁（細かい縞）
  ctx.strokeStyle = `hsla(${params.hueMud}, ${params.saturation}%, ${params.lightness - 10}%, 0.4)`;
  ctx.lineWidth = 0.5;
  const n = Math.round(params.walls);
  for (let i = 0; i < n; i++) {
    const x1 = rnd() * w;
    const y1 = rnd() * h;
    const a = rnd() * Math.PI;
    const len = 20 + rnd() * 60;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(
      x1 + Math.cos(a) * len + (rnd() - 0.5) * params.wallJitter,
      y1 + Math.sin(a) * len,
    );
    ctx.stroke();
  }
  // 内部チャンバー
  const ch = Math.round(params.chamberCount);
  for (let i = 0; i < ch; i++) {
    const cx = w / 2 + (rnd() - 0.5) * w * 0.6;
    const cy = base + rnd() * (h - base) * 0.9;
    const r =
      params.chamberMin + rnd() * (params.chamberMax - params.chamberMin);
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(
      0,
      `hsl(${params.hueMud}, ${params.saturation}%, ${params.chamberLight + 15}%)`,
    );
    grd.addColorStop(
      1,
      `hsl(${params.hueMud}, ${params.saturation}%, ${params.chamberLight}%)`,
    );
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.1, r, 0, 0, Math.PI * 2);
    ctx.fill();
    // チャンバー間の通路
    if (i > 0) {
      const px = w / 2 + (rnd() - 0.5) * w * 0.6;
      const py = base + rnd() * (h - base) * 0.9;
      ctx.strokeStyle = `hsla(${params.hueMud}, ${params.saturation}%, ${params.chamberLight}%, 0.6)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(
        (cx + px) / 2 + (rnd() - 0.5) * 50,
        (cy + py) / 2 + (rnd() - 0.5) * 50,
        px,
        py,
      );
      ctx.stroke();
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Termite Mound Cross-section',
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
  ['walls', 100, 2000, 20],
  ['wallJitter', 0, 40, 1],
  ['chamberCount', 5, 150, 1],
  ['chamberMin', 2, 40, 0.5],
  ['chamberMax', 20, 100, 0.5],
  ['mound', 0.3, 0.95, 0.01],
  ['hueMud', 0, 60, 1],
  ['saturation', 0, 80, 1],
  ['lightness', 15, 60, 1],
  ['chamberLight', 5, 40, 1],
  ['skyHue', 0, 360, 1],
  ['skyLight', 40, 95, 1],
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
  params.walls = rand(400, 1500, 20);
  params.chamberCount = rand(20, 100, 1);
  params.hueMud = rand(15, 40, 1);
  params.saturation = rand(20, 60, 1);
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
