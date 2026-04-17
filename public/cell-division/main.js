// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 細胞分裂アニメーション: 一定時間ごとに分裂して増え、重なり合う。
const params = {
  divisionInterval: 3.5,
  maxCells: 200,
  startRadius: 28,
  shrinkPerGeneration: 0.85,
  drift: 10,
  wobble: 0.4,
  hueStart: 280,
  hueRange: 200,
  fillAlpha: 0.5,
  strokeAlpha: 0.8,
  trailFade: 0.1,
  autoReset: true,
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

/**
 * @typedef {object} Cell
 * @property {number} x
 * @property {number} y
 * @property {number} r
 * @property {number} vx
 * @property {number} vy
 * @property {number} gen
 * @property {number} phase // 0..1  分裂アニメ進捗
 * @property {boolean} dividing
 * @property {number} hue
 */

/** @type {Cell[]} */
let cells = [];
let time = 0;
let lastDivision = 0;

function reset() {
  cells = [
    {
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: params.startRadius,
      vx: 0,
      vy: 0,
      gen: 0,
      phase: 0,
      dividing: false,
      hue: params.hueStart,
    },
  ];
}
reset();

function divide() {
  /** @type {Cell[]} */
  const next = [];
  for (const c of cells) {
    if (cells.length + next.length >= params.maxCells) {
      next.push(c);
      continue;
    }
    const a = Math.random() * Math.PI * 2;
    const sep = c.r * 1.1;
    const newR = c.r * params.shrinkPerGeneration;
    const newHue = c.hue + (Math.random() - 0.5) * 30;
    next.push({
      x: c.x + Math.cos(a) * sep,
      y: c.y + Math.sin(a) * sep,
      r: newR,
      vx: c.vx + Math.cos(a) * params.drift,
      vy: c.vy + Math.sin(a) * params.drift,
      gen: c.gen + 1,
      phase: 0,
      dividing: false,
      hue: newHue,
    });
    next.push({
      x: c.x - Math.cos(a) * sep,
      y: c.y - Math.sin(a) * sep,
      r: newR,
      vx: c.vx - Math.cos(a) * params.drift,
      vy: c.vy - Math.sin(a) * params.drift,
      gen: c.gen + 1,
      phase: 0,
      dividing: false,
      hue: newHue + params.hueRange / 6,
    });
  }
  cells = next;
}

function draw() {
  const dt = 1 / 60;
  time += dt;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (time - lastDivision > params.divisionInterval) {
    lastDivision = time;
    if (cells.length < params.maxCells) divide();
    else if (params.autoReset) reset();
  }

  for (const c of cells) {
    // 移動
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vx *= 0.985;
    c.vy *= 0.985;
    // 壁
    if (c.x < c.r) {
      c.x = c.r;
      c.vx = Math.abs(c.vx);
    }
    if (c.x > canvas.width - c.r) {
      c.x = canvas.width - c.r;
      c.vx = -Math.abs(c.vx);
    }
    if (c.y < c.r) {
      c.y = c.r;
      c.vy = Math.abs(c.vy);
    }
    if (c.y > canvas.height - c.r) {
      c.y = canvas.height - c.r;
      c.vy = -Math.abs(c.vy);
    }
    const wob = Math.sin(time * 3 + c.x * 0.01) * params.wobble;
    ctx.fillStyle = `hsla(${c.hue}, 80%, 60%, ${params.fillAlpha})`;
    ctx.strokeStyle = `hsla(${c.hue}, 90%, 80%, ${params.strokeAlpha})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const segs = 24;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const r = c.r * (1 + Math.sin(a * 3 + time * 2) * wob * 0.15);
      const px = c.x + Math.cos(a) * r;
      const py = c.y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 核
    ctx.fillStyle = `hsla(${c.hue}, 95%, 75%, 0.9)`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Cell Division',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'divisionInterval', 1, 10, 0.1);
gui.add(params, 'maxCells', 20, 400, 5);
gui.add(params, 'startRadius', 10, 60, 1);
gui.add(params, 'shrinkPerGeneration', 0.6, 1, 0.01);
gui.add(params, 'drift', 0, 40, 0.5);
gui.add(params, 'wobble', 0, 1, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'fillAlpha', 0.1, 1, 0.01);
gui.add(params, 'strokeAlpha', 0.1, 1, 0.01);
gui.add(params, 'trailFade', 0.02, 0.3, 0.01);
gui.add(params, 'autoReset');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Divide', () => divide());
gui.addButton('Random', () => {
  params.divisionInterval = rand(2, 6, 0.1);
  params.shrinkPerGeneration = rand(0.78, 0.95, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  params.drift = rand(5, 25, 0.5);
  reset();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  gui.updateDisplay();
});
