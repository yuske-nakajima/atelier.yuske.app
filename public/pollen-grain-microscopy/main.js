// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  count: 30,
  minRadius: 30,
  maxRadius: 90,
  spikes: 18,
  spikeLength: 0.4,
  bumpFreq: 8,
  bumpDepth: 0.1,
  hue: 40,
  saturation: 50,
  lightness: 60,
  bgHue: 190,
  bumpCount: 14,
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
function drawGrain(cx, cy, r) {
  const type = Math.floor(rnd() * 3);
  const steps = 180;
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    let rr = r;
    if (type === 0)
      rr = r * (1 + Math.sin(a * params.bumpFreq) * params.bumpDepth);
    else if (type === 1)
      rr = r * (1 + Math.sin(a * params.spikes) ** 8 * params.spikeLength);
    else rr = r * (1 + (rnd() - 0.5) * params.bumpDepth * 2);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grd = ctx.createRadialGradient(
    cx - r * 0.3,
    cy - r * 0.3,
    0,
    cx,
    cy,
    r,
  );
  grd.addColorStop(
    0,
    `hsl(${params.hue}, ${params.saturation}%, ${params.lightness + 15}%)`,
  );
  grd.addColorStop(
    1,
    `hsl(${params.hue}, ${params.saturation}%, ${params.lightness - 20}%)`,
  );
  ctx.fillStyle = grd;
  ctx.fill();
  // バンプ（発芽孔）
  ctx.fillStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness - 30}%, 0.6)`;
  const bumps = Math.round(params.bumpCount);
  for (let i = 0; i < bumps; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = r * (0.3 + rnd() * 0.5);
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(a) * rr,
      cy + Math.sin(a) * rr,
      r * 0.06,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function draw() {
  const bgGrd = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) / 2,
  );
  bgGrd.addColorStop(0, `hsl(${params.bgHue}, 30%, 22%)`);
  bgGrd.addColorStop(1, `hsl(${params.bgHue}, 30%, 8%)`);
  ctx.fillStyle = bgGrd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const n = Math.round(params.count);
  for (let i = 0; i < n; i++) {
    const x = rnd() * canvas.width;
    const y = rnd() * canvas.height;
    const r = params.minRadius + rnd() * (params.maxRadius - params.minRadius);
    drawGrain(x, y, r);
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Pollen Grain Microscopy',
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
  ['count', 3, 100, 1],
  ['minRadius', 10, 80, 1],
  ['maxRadius', 40, 200, 1],
  ['spikes', 4, 40, 1],
  ['spikeLength', 0, 1, 0.01],
  ['bumpFreq', 2, 30, 1],
  ['bumpDepth', 0, 0.4, 0.01],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 30, 80, 1],
  ['bgHue', 0, 360, 1],
  ['bumpCount', 0, 40, 1],
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
  params.count = rand(8, 50, 1);
  params.minRadius = rand(20, 50, 1);
  params.maxRadius = rand(60, 140, 1);
  params.spikes = rand(6, 24, 1);
  params.hue = rand(0, 360, 1);
  params.bgHue = rand(0, 360, 1);
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
