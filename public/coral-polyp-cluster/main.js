// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  count: 260,
  polypRadius: 18,
  tentacles: 12,
  tentacleLength: 12,
  sway: 0.3,
  hueBody: 340,
  hueTentacle: 20,
  saturation: 70,
  lightness: 55,
  opacity: 0.85,
  jitter: 0.5,
  speed: 0.8,
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
let polyps = [];

function buildPolyps() {
  setSeed(pageSeed);
  polyps = [];
  const count = Math.round(params.count);
  for (let i = 0; i < count; i++) {
    polyps.push({
      x: rnd() * canvas.width,
      y: rnd() * canvas.height,
      r: params.polypRadius * (0.5 + rnd()),
      phase: rnd() * Math.PI * 2,
    });
  }
}
buildPolyps();

let time = 0;

function draw() {
  ctx.fillStyle = '#031018';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  time += (1 / 60) * params.speed;
  const tc = Math.round(params.tentacles);
  for (const p of polyps) {
    const open = 0.7 + Math.sin(time + p.phase) * 0.3 * params.sway;
    // 触手
    ctx.strokeStyle = `hsla(${params.hueTentacle}, ${params.saturation}%, ${params.lightness + 10}%, ${params.opacity})`;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (let i = 0; i < tc; i++) {
      const a = (i / tc) * Math.PI * 2 + p.phase * 0.1;
      const len = params.tentacleLength * open;
      const ex = p.x + Math.cos(a) * (p.r + len);
      const ey = p.y + Math.sin(a) * (p.r + len);
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    // 本体
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    grd.addColorStop(
      0,
      `hsla(${params.hueBody}, ${params.saturation}%, ${params.lightness + 15}%, ${params.opacity})`,
    );
    grd.addColorStop(
      1,
      `hsla(${params.hueBody}, ${params.saturation}%, ${params.lightness - 15}%, ${params.opacity})`,
    );
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    // 口
    ctx.fillStyle = `hsla(${params.hueBody}, 60%, 10%, ${params.opacity})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
draw();

const gui = new TileUI({
  title: 'Coral Polyp Cluster',
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
  ['count', 20, 1000, 5],
  ['polypRadius', 4, 60, 0.5],
  ['tentacles', 4, 30, 1],
  ['tentacleLength', 2, 40, 0.5],
  ['sway', 0, 1, 0.01],
  ['hueBody', 0, 360, 1],
  ['hueTentacle', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 20, 80, 1],
  ['opacity', 0.1, 1, 0.01],
  ['jitter', 0, 1, 0.01],
  ['speed', 0, 3, 0.01],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s).onChange(() => {
    if (k === 'count' || k === 'polypRadius') buildPolyps();
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
  params.count = rand(100, 600, 5);
  params.polypRadius = rand(8, 30, 0.5);
  params.tentacles = rand(6, 20, 1);
  params.hueBody = rand(0, 360, 1);
  params.hueTentacle = rand(0, 360, 1);
  pageSeed = Math.floor(Math.random() * 1e9);
  buildPolyps();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  pageSeed = Math.floor(Math.random() * 1e9);
  buildPolyps();
  gui.updateDisplay();
});

window.addEventListener('resize', buildPolyps);
