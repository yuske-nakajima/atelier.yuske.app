// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 1:2 直角三角形を再帰分割する Pinwheel tiling
const params = {
  depth: 4,
  hue: 40,
  hueRange: 100,
  saturation: 65,
  lightness: 55,
  edgeAlpha: 0.5,
  edgeWidth: 0.8,
  padding: 40,
  rotation: 0,
  flip: false,
  glow: 4,
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

/**
 * 1:2 直角三角形を 5 つの相似三角形に分割する
 * @param {number[][]} tri [A,B,C] — 直角 at A、AB の長さが短辺
 * @param {number} depth
 * @param {number} seed
 */
function divide(tri, depth, seed) {
  if (depth === 0) return [[tri, seed]];
  const [A, B, C] = tri;
  const mid = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  // pinwheel の 5 分割点
  const P1 = mid(A, C, 1 / Math.sqrt(5) / 2 + 0.2);
  const P2 = mid(B, C, 1 / 2);
  const P3 = mid(A, B, 1 / 2);
  const P4 = mid(B, C, 1 / 4);
  const subs = [
    [A, P3, P1],
    [P3, B, P4],
    [P1, P3, P4],
    [P1, P4, P2],
    [P1, P2, C],
  ];
  let out = [];
  for (let i = 0; i < 5; i++)
    out = out.concat(divide(subs[i], depth - 1, seed * 7 + i));
  return out;
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const pad = params.padding;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const s = Math.min(w / 2, h);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rot = (params.rotation * Math.PI) / 180;
  const c = Math.cos(rot);
  const si = Math.sin(rot);
  const fx = params.flip ? -1 : 1;
  const tri = [
    [-s * fx, s / 2],
    [s * fx, s / 2],
    [-s * fx, -s / 2],
  ].map(([x, y]) => [cx + x * c - y * si, cy + x * si + y * c]);
  const parts = divide(tri, Math.max(0, Math.min(7, params.depth | 0)), 1);
  for (const [t, seed] of parts) {
    const hue =
      (params.hue + ((seed * 137) % 360) * (params.hueRange / 360)) % 360;
    ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(t[0][0], t[0][1]);
    ctx.lineTo(t[1][0], t[1][1]);
    ctx.lineTo(t[2][0], t[2][1]);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = params.edgeWidth;
    ctx.strokeStyle = `rgba(0,0,0,${params.edgeAlpha})`;
    ctx.stroke();
  }
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
  title: 'Pinwheel Tiling',
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
gui.add(params, 'depth', 0, 6, 1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueRange', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'edgeAlpha', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'edgeWidth', 0, 4, 0.1).onChange(onChange);
gui.add(params, 'padding', 0, 200, 1).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'flip').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(2, 5, 1);
  params.hue = rand(0, 360, 1);
  params.hueRange = rand(30, 300, 1);
  params.saturation = rand(30, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotation = rand(0, 360, 1);
  params.flip = Math.random() > 0.5;
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
