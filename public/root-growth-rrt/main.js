// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  iterations: 2500,
  step: 10,
  gravity: 0.7,
  bias: 0.5,
  thickness: 1.2,
  hue: 30,
  saturation: 30,
  lightness: 45,
  bgLightness: 92,
  bgHue: 35,
  startCount: 3,
  branchProb: 0.1,
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
  ctx.fillStyle = `hsl(${params.bgHue}, 30%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  /** @type {Array<{x:number,y:number}>} */
  const nodes = [];
  const startCount = Math.round(params.startCount);
  for (let i = 0; i < startCount; i++) {
    nodes.push({
      x: (canvas.width * (i + 1)) / (startCount + 1),
      y: 10,
    });
  }
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.lineCap = 'round';
  ctx.lineWidth = params.thickness;
  const iters = Math.round(params.iterations);
  for (let k = 0; k < iters; k++) {
    // ランダム標的
    const tx = rnd() * canvas.width;
    const ty = rnd() * canvas.height;
    // 最近接ノード
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      const dx = nodes[i].x - tx;
      const dy = nodes[i].y - ty;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    const n = nodes[best];
    let dx = tx - n.x;
    let dy = ty - n.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.01) continue;
    dx /= d;
    dy /= d;
    // 重力バイアス
    dy = dy * (1 - params.bias) + params.gravity * params.bias;
    const nn = Math.hypot(dx, dy);
    dx /= nn;
    dy /= nn;
    const nx = n.x + dx * params.step;
    const ny = n.y + dy * params.step;
    if (ny > canvas.height) continue;
    ctx.beginPath();
    ctx.moveTo(n.x, n.y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    nodes.push({ x: nx, y: ny });
    if (rnd() < params.branchProb) {
      nodes.push({ x: nx + (rnd() - 0.5) * 4, y: ny });
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Root Growth RRT',
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
  ['iterations', 200, 8000, 50],
  ['step', 2, 30, 0.5],
  ['gravity', 0, 2, 0.01],
  ['bias', 0, 1, 0.01],
  ['thickness', 0.3, 4, 0.05],
  ['hue', 0, 360, 1],
  ['saturation', 0, 80, 1],
  ['lightness', 10, 80, 1],
  ['bgLightness', 40, 100, 1],
  ['bgHue', 0, 360, 1],
  ['startCount', 1, 10, 1],
  ['branchProb', 0, 0.5, 0.01],
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
  params.iterations = rand(1500, 5000, 50);
  params.step = rand(5, 20, 0.5);
  params.gravity = rand(0.3, 1.2, 0.01);
  params.bias = rand(0.3, 0.8, 0.01);
  params.hue = rand(0, 360, 1);
  params.startCount = rand(1, 6, 1);
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
