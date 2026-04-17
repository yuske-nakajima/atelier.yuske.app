// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  arms: 6,
  steps: 300,
  stepSize: 3,
  branchProb: 0.05,
  wobble: 0.1,
  radius: 280,
  thickness: 1.5,
  hue: 210,
  saturation: 40,
  lightness: 85,
  bgLightness: 5,
  glow: 0.3,
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
 * @param {number} x0
 * @param {number} y0
 * @param {number} angle0
 * @param {number} stepsLeft
 * @param {number} gen
 */
function grow(cx, cy, x0, y0, angle0, stepsLeft, gen) {
  let x = x0;
  let y = y0;
  let angle = angle0;
  const arms = Math.round(params.arms);
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.lineWidth = Math.max(0.25, params.thickness / (gen + 1));
  for (let i = 0; i < stepsLeft; i++) {
    const nx = x + Math.cos(angle) * params.stepSize;
    const ny = y + Math.sin(angle) * params.stepSize;
    const dist = Math.hypot(nx - cx, ny - cy);
    if (dist > params.radius) return;
    // 対称描画
    for (let s = 0; s < arms; s++) {
      const a = (s / arms) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const rx1 = (x - cx) * ca - (y - cy) * sa + cx;
      const ry1 = (x - cx) * sa + (y - cy) * ca + cy;
      const rx2 = (nx - cx) * ca - (ny - cy) * sa + cx;
      const ry2 = (nx - cx) * sa + (ny - cy) * ca + cy;
      ctx.beginPath();
      ctx.moveTo(rx1, ry1);
      ctx.lineTo(rx2, ry2);
      ctx.stroke();
      // 鏡面
      const mx1 = (x - cx) * ca + (y - cy) * sa + cx;
      const my1 = (x - cx) * sa - (y - cy) * ca + cy;
      const mx2 = (nx - cx) * ca + (ny - cy) * sa + cx;
      const my2 = (nx - cx) * sa - (ny - cy) * ca + cy;
      ctx.beginPath();
      ctx.moveTo(mx1, my1);
      ctx.lineTo(mx2, my2);
      ctx.stroke();
    }
    angle += (rnd() - 0.5) * params.wobble;
    x = nx;
    y = ny;
    if (gen < 3 && rnd() < params.branchProb) {
      grow(
        cx,
        cy,
        x,
        y,
        angle + Math.PI / 3,
        Math.floor(stepsLeft * 0.3),
        gen + 1,
      );
      grow(
        cx,
        cy,
        x,
        y,
        angle - Math.PI / 3,
        Math.floor(stepsLeft * 0.3),
        gen + 1,
      );
    }
  }
}

function draw() {
  ctx.fillStyle = `hsl(${params.hue}, 30%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.shadowBlur = params.glow * 12;
  ctx.shadowColor = `hsla(${params.hue}, ${params.saturation}%, 80%, 1)`;
  ctx.lineCap = 'round';
  grow(cx, cy, cx, cy, 0, Math.round(params.steps), 0);
  ctx.shadowBlur = 0;
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Snowflake Dendrite',
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
  ['arms', 3, 12, 1],
  ['steps', 50, 800, 10],
  ['stepSize', 1, 10, 0.25],
  ['branchProb', 0, 0.3, 0.005],
  ['wobble', 0, 0.5, 0.01],
  ['radius', 80, 500, 2],
  ['thickness', 0.3, 4, 0.05],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 40, 100, 1],
  ['bgLightness', 0, 30, 1],
  ['glow', 0, 1, 0.01],
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
  params.arms = rand(5, 8, 1);
  params.steps = rand(150, 500, 10);
  params.branchProb = rand(0.02, 0.15, 0.005);
  params.wobble = rand(0.05, 0.25, 0.01);
  params.hue = rand(150, 260, 1);
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
