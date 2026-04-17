// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  steps: 16,
  rings: 5,
  bpm: 120,
  radius: 280,
  ringGap: 34,
  density: 0.35, // 各リングで発音するステップの密度
  hueStart: 30,
  hueRange: 240,
  pulseSize: 1.6,
  trailFade: 0.2,
  glow: 0.7,
  reshuffle: 0,
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

/** @type {boolean[][]} */
let grid = [];

function rebuild() {
  const s = Math.round(params.steps);
  const r = Math.round(params.rings);
  grid = [];
  for (let i = 0; i < r; i++) {
    const row = new Array(s);
    for (let j = 0; j < s; j++) {
      row[j] = Math.random() < params.density;
    }
    grid.push(row);
  }
}
rebuild();

let time = 0;
let lastStep = -1;
/** @type {{ring:number, step:number, t:number}[]} */
let pulses = [];

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const s = Math.round(params.steps);
  const r = Math.round(params.rings);
  const stepTime = 60 / params.bpm / 4; // 16分音符
  const current = Math.floor(time / stepTime) % s;
  if (current !== lastStep) {
    lastStep = current;
    for (let ri = 0; ri < r; ri++) {
      if (grid[ri]?.[current]) {
        pulses.push({ ring: ri, step: current, t: 0 });
      }
    }
  }

  // 背景リング
  for (let ri = 0; ri < r; ri++) {
    const rad = params.radius - ri * params.ringGap;
    if (rad <= 4) continue;
    ctx.strokeStyle = 'rgba(200,200,200,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
    // 各ステップのドット
    for (let si = 0; si < s; si++) {
      const a = -Math.PI / 2 + (si / s) * Math.PI * 2;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      const hue = params.hueStart + (ri / r) * params.hueRange;
      const active = grid[ri]?.[si];
      ctx.fillStyle = active
        ? `hsla(${hue}, 80%, 65%, 0.85)`
        : 'rgba(200,200,200,0.18)';
      ctx.beginPath();
      ctx.arc(x, y, active ? 4 : 1.8, 0, Math.PI * 2);
      ctx.fill();
      // 現在ステップ強調
      if (si === current) {
        ctx.strokeStyle = `hsla(${hue}, 90%, 75%, 0.9)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // パルス表示
  pulses = pulses.filter((p) => p.t < 1);
  for (const p of pulses) {
    p.t += 0.04;
    const rad = params.radius - p.ring * params.ringGap;
    const a = -Math.PI / 2 + (p.step / s) * Math.PI * 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    const hue = params.hueStart + (p.ring / r) * params.hueRange;
    const sz = 6 + p.t * 60 * params.pulseSize;
    ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${(1 - p.t) * params.glow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `hsla(${hue}, 90%, 75%, ${(1 - p.t) * params.glow})`;
    ctx.beginPath();
    ctx.arc(x, y, 5 + p.t * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Circular Sequencer',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'steps', 8, 32, 1);
gui.add(params, 'rings', 1, 10, 1);
gui.add(params, 'bpm', 40, 240, 1);
gui.add(params, 'radius', 120, 400, 1);
gui.add(params, 'ringGap', 12, 60, 1);
gui.add(params, 'density', 0.05, 0.8, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'pulseSize', 0.3, 3, 0.1);
gui.add(params, 'trailFade', 0.05, 0.5, 0.01);
gui.add(params, 'glow', 0, 1, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.steps = rand(8, 24, 1);
  params.rings = rand(3, 7, 1);
  params.bpm = rand(80, 160, 1);
  params.density = rand(0.2, 0.5, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  rebuild();
  gui.updateDisplay();
});
gui.addButton('Shuffle', () => {
  rebuild();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuild();
  gui.updateDisplay();
});
