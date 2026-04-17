// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Farey 数列: 分母 ≤ n の既約分数を並べ、連続項を弧でつなぐ
const params = {
  n: 30,
  arcHeight: 120,
  lineWidth: 1,
  hue: 340,
  hueByQ: 6,
  saturation: 70,
  lightness: 60,
  alpha: 0.9,
  nodeRadius: 4,
  padding: 60,
  glow: 4,
  showNodes: true,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
let dirty = true;
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  dirty = true;
}
addEventListener('resize', resize);

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function farey(n) {
  const out = [];
  for (let q = 1; q <= n; q++) {
    for (let p = 0; p <= q; p++) {
      if (p === 0 && q !== 1) continue;
      if (gcd(p, q) !== 1) continue;
      out.push([p, q]);
    }
  }
  out.sort((a, b) => a[0] / a[1] - b[0] / b[1]);
  return out;
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const pad = params.padding;
  const W = canvas.width - pad * 2;
  const baseY = canvas.height / 2 + params.arcHeight;
  const seq = farey(Math.max(2, Math.min(80, params.n | 0)));
  ctx.lineWidth = params.lineWidth;
  for (let i = 0; i < seq.length - 1; i++) {
    const [p1, q1] = seq[i];
    const [p2, q2] = seq[i + 1];
    const x1 = pad + (p1 / q1) * W;
    const x2 = pad + (p2 / q2) * W;
    const midX = (x1 + x2) / 2;
    const r = (x2 - x1) / 2;
    const hue = (params.hue + Math.max(q1, q2) * params.hueByQ) % 360;
    const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(midX, baseY, r, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  if (params.showNodes) {
    for (const [p, q] of seq) {
      const x = pad + (p / q) * W;
      const hue = (params.hue + q * params.hueByQ) % 360;
      ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
      ctx.beginPath();
      ctx.arc(x, baseY, params.nodeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 基線
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(pad, baseY);
  ctx.lineTo(pad + W, baseY);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function tick() {
  if (dirty) {
    draw();
    dirty = false;
  }
  requestAnimationFrame(tick);
}
resize();
tick();

const gui = new TileUI({
  title: 'Farey Sequence Diagram',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
function onChange() {
  dirty = true;
}
gui.add(params, 'n', 3, 80, 1).onChange(onChange);
gui.add(params, 'arcHeight', -300, 300, 1).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueByQ', 0, 30, 0.5).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'nodeRadius', 0, 10, 0.5).onChange(onChange);
gui.add(params, 'padding', 20, 200, 1).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'showNodes').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.n = rand(15, 60, 1);
  params.arcHeight = rand(-150, 150, 1);
  params.hue = rand(0, 360, 1);
  params.hueByQ = rand(1, 15, 0.5);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
