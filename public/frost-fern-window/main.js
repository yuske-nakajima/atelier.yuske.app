// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  sources: 4, // 発生点の数
  depth: 6, // 再帰深さ
  branches: 3, // 枝分岐数
  curveStrength: 0.6, // 曲がりの強さ
  angleSpread: 50, // 分岐角度
  lengthRatio: 0.7, // 長さ比
  initialLength: 140, // 初期長さ
  thickness: 1.2, // 太さ
  hue: 190, // 色相
  saturation: 40, // 彩度
  lightness: 80, // 明度
  opacity: 0.7, // 不透明度
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
 * @param {number} y
 * @param {number} angle
 * @param {number} length
 * @param {number} depthLeft
 */
function drawFern(x, y, angle, length, depthLeft) {
  if (depthLeft <= 0 || length < 1) return;
  const steps = 10;
  let cx = x;
  let cy = y;
  let a = angle;
  const curve = (params.curveStrength * (rnd() - 0.5) * Math.PI) / 6;
  ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness}%, ${params.opacity})`;
  ctx.lineWidth = Math.max(0.25, params.thickness * (depthLeft / params.depth));
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  for (let i = 0; i < steps; i++) {
    a += curve / steps;
    cx += (Math.cos(a) * length) / steps;
    cy += (Math.sin(a) * length) / steps;
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  const branches = Math.round(params.branches);
  const spread = (params.angleSpread * Math.PI) / 180;
  for (let i = 0; i < branches; i++) {
    const f = (i + 1) / (branches + 1);
    const midx = x + (cx - x) * f;
    const midy = y + (cy - y) * f;
    const dir = rnd() < 0.5 ? 1 : -1;
    drawFern(
      midx,
      midy,
      a + dir * spread * (0.7 + rnd() * 0.6),
      length * params.lengthRatio * (0.85 + rnd() * 0.3),
      depthLeft - 1,
    );
  }
}

function draw() {
  ctx.fillStyle = '#08101a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const count = Math.round(params.sources);
  for (let i = 0; i < count; i++) {
    const x = rnd() * canvas.width;
    const y = rnd() * canvas.height;
    const a = rnd() * Math.PI * 2;
    drawFern(x, y, a, params.initialLength, Math.round(params.depth));
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Frost Fern Window',
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
  ['sources', 1, 12, 1],
  ['depth', 2, 8, 1],
  ['branches', 1, 6, 1],
  ['curveStrength', 0, 2, 0.01],
  ['angleSpread', 10, 90, 1],
  ['lengthRatio', 0.4, 0.9, 0.01],
  ['initialLength', 40, 260, 1],
  ['thickness', 0.3, 4, 0.1],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 30, 100, 1],
  ['opacity', 0.1, 1, 0.01],
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
  params.sources = rand(2, 8, 1);
  params.depth = rand(3, 7, 1);
  params.branches = rand(2, 5, 1);
  params.curveStrength = rand(0.2, 1.4, 0.01);
  params.angleSpread = rand(25, 70, 1);
  params.lengthRatio = rand(0.55, 0.8, 0.01);
  params.hue = rand(150, 250, 1);
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
