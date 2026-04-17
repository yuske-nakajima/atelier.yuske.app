// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  steps: 16, // ステップ数
  pulses: 5, // パルス数
  rotate: 0, // 回転
  layers: 3, // レイヤー数
  bpm: 120,
  radius: 260,
  ringGap: 36,
  hueStart: 160,
  hueRange: 180,
  pulseGlow: 0.8,
  trailFade: 0.18,
  dotSize: 8,
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
 * Bjorklund のユークリッドリズム
 * @param {number} steps
 * @param {number} pulses
 * @returns {boolean[]}
 */
function euclid(steps, pulses) {
  pulses = Math.min(steps, Math.max(0, pulses));
  /** @type {string[]} */
  let groups = [];
  for (let i = 0; i < pulses; i++) groups.push('1');
  for (let i = 0; i < steps - pulses; i++) groups.push('0');
  while (true) {
    const ones = groups.filter((g) => g.startsWith('1'));
    const zeros = groups.filter((g) => g.startsWith('0'));
    if (zeros.length <= 1) break;
    const merge = Math.min(ones.length, zeros.length);
    /** @type {string[]} */
    const next = [];
    for (let i = 0; i < merge; i++) next.push(ones[i] + zeros[i]);
    for (let i = merge; i < ones.length; i++) next.push(ones[i]);
    for (let i = merge; i < zeros.length; i++) next.push(zeros[i]);
    groups = next;
    if (ones.length === 0 || zeros.length === 0) break;
  }
  const s = groups.join('');
  const out = [];
  for (const ch of s) out.push(ch === '1');
  return out;
}

let time = 0;
let lastStep = -1;
/** @type {{layer:number, step:number, t:number}[]} */
let pulseAnim = [];

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const s = Math.round(params.steps);
  const L = Math.round(params.layers);
  const stepTime = 60 / params.bpm / 4;
  const current = Math.floor(time / stepTime) % s;

  const patterns = [];
  for (let li = 0; li < L; li++) {
    const p = Math.max(1, Math.round(params.pulses) - li);
    const pat = euclid(s, p);
    const rot = Math.round(params.rotate) + li;
    // rotate
    const rotated = pat.slice(-rot % s).concat(pat.slice(0, -rot % s || 0));
    patterns.push(rotated);
  }

  if (current !== lastStep) {
    lastStep = current;
    for (let li = 0; li < L; li++) {
      if (patterns[li][current])
        pulseAnim.push({ layer: li, step: current, t: 0 });
    }
  }

  for (let li = 0; li < L; li++) {
    const rad = params.radius - li * params.ringGap;
    if (rad <= 4) continue;
    const hue = params.hueStart + (li / L) * params.hueRange;
    ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
    for (let si = 0; si < s; si++) {
      const a = -Math.PI / 2 + (si / s) * Math.PI * 2;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      const on = patterns[li][si];
      ctx.fillStyle = on
        ? `hsla(${hue}, 85%, 65%, 0.9)`
        : 'rgba(180,180,180,0.2)';
      ctx.beginPath();
      ctx.arc(x, y, on ? params.dotSize * 0.5 : 2, 0, Math.PI * 2);
      ctx.fill();
      if (si === current) {
        ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.9)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, params.dotSize + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  pulseAnim = pulseAnim.filter((p) => p.t < 1);
  for (const p of pulseAnim) {
    p.t += 0.05;
    const rad = params.radius - p.layer * params.ringGap;
    const a = -Math.PI / 2 + (p.step / s) * Math.PI * 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    const hue = params.hueStart + (p.layer / L) * params.hueRange;
    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${(1 - p.t) * params.pulseGlow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 4 + p.t * 30, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Euclidean Rhythm',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'steps', 4, 32, 1);
gui.add(params, 'pulses', 1, 24, 1);
gui.add(params, 'rotate', 0, 31, 1);
gui.add(params, 'layers', 1, 6, 1);
gui.add(params, 'bpm', 40, 240, 1);
gui.add(params, 'radius', 120, 400, 1);
gui.add(params, 'ringGap', 14, 60, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'pulseGlow', 0, 1, 0.01);
gui.add(params, 'trailFade', 0.05, 0.4, 0.01);
gui.add(params, 'dotSize', 4, 20, 0.5);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.steps = rand(8, 24, 1);
  params.pulses = rand(3, Math.min(12, params.steps - 1), 1);
  params.rotate = rand(0, params.steps - 1, 1);
  params.layers = rand(2, 5, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  params.bpm = rand(80, 160, 1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
