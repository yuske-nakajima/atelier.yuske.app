// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  depth: 9,
  initialLength: 260,
  ratio: Math.SQRT1_2,
  thickness: 3,
  thickDecay: 0.72,
  hueStart: 200,
  hueEnd: 320,
  alpha: 0.9,
  rotation: 0,
  rotSpeed: 0.08,
  fade: 0.18,
  bloom: 0.7,
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

let time = 0;

/**
 * 水平もしくは垂直の「H」形を再帰描画
 * @param {number} x
 * @param {number} y
 * @param {number} length
 * @param {boolean} horizontal
 * @param {number} depth
 * @param {number} thickness
 */
function hTree(x, y, length, horizontal, depth, thickness) {
  if (depth <= 0 || length < 1) return;
  const t = 1 - depth / params.depth;
  const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
  ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${params.alpha})`;
  ctx.lineWidth = Math.max(0.1, thickness);

  const half = length / 2;
  let x1;
  let y1;
  let x2;
  let y2;
  let x3;
  let y3;
  let x4;
  let y4;
  if (horizontal) {
    // 水平棒
    x1 = x - half;
    y1 = y;
    x2 = x + half;
    y2 = y;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    // 左右の垂直棒
    x3 = x1;
    y3 = y - half;
    x4 = x1;
    y4 = y + half;
    ctx.beginPath();
    ctx.moveTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y - half);
    ctx.lineTo(x2, y + half);
    ctx.stroke();
    const nl = length * params.ratio;
    const nt = thickness * params.thickDecay;
    hTree(x1, y - half, nl, !horizontal, depth - 1, nt);
    hTree(x1, y + half, nl, !horizontal, depth - 1, nt);
    hTree(x2, y - half, nl, !horizontal, depth - 1, nt);
    hTree(x2, y + half, nl, !horizontal, depth - 1, nt);
  } else {
    x1 = x;
    y1 = y - half;
    x2 = x;
    y2 = y + half;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - half, y1);
    ctx.lineTo(x + half, y1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - half, y2);
    ctx.lineTo(x + half, y2);
    ctx.stroke();
    const nl = length * params.ratio;
    const nt = thickness * params.thickDecay;
    hTree(x - half, y1, nl, !horizontal, depth - 1, nt);
    hTree(x + half, y1, nl, !horizontal, depth - 1, nt);
    hTree(x - half, y2, nl, !horizontal, depth - 1, nt);
    hTree(x + half, y2, nl, !horizontal, depth - 1, nt);
  }

  if (depth === 1 && params.bloom > 0) {
    ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${params.bloom})`;
    ctx.beginPath();
    ctx.arc(x, y, thickness + 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const ang = params.rotation + time * params.rotSpeed;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.lineCap = 'round';
  hTree(
    0,
    0,
    params.initialLength,
    true,
    Math.round(params.depth),
    params.thickness,
  );
  ctx.restore();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'H Tree',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 2, 12, 1);
gui.add(params, 'initialLength', 80, 400, 1);
gui.add(params, 'ratio', 0.4, 0.8, 0.01);
gui.add(params, 'thickness', 0.5, 8, 0.1);
gui.add(params, 'thickDecay', 0.5, 0.95, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'alpha', 0.1, 1, 0.01);
gui.add(params, 'rotation', -3.14, 3.14, 0.01);
gui.add(params, 'rotSpeed', -0.5, 0.5, 0.01);
gui.add(params, 'fade', 0, 0.5, 0.01);
gui.add(params, 'bloom', 0, 1, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.depth = rand(6, 10, 1);
  params.initialLength = rand(160, 320, 1);
  params.ratio = rand(0.55, 0.75, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.rotSpeed = rand(-0.2, 0.2, 0.01);
  params.bloom = rand(0.3, 0.9, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
