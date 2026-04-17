// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  depth: 7,
  initialSize: 380,
  ratio: 0.5,
  hueStart: 200,
  hueEnd: 40,
  saturation: 70,
  lightness: 55,
  alpha: 0.9,
  strokeAlpha: 0.4,
  rotation: 0,
  rotSpeed: 0.05,
  shrink: 0,
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
 * 正方形を描き、各辺の中点にスケールした子正方形を配置
 * @param {number} cx
 * @param {number} cy
 * @param {number} size
 * @param {number} depth
 */
function tSquare(cx, cy, size, depth) {
  if (depth <= 0 || size < 1) return;
  const t = 1 - depth / params.depth;
  const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
  ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
  ctx.strokeStyle = `hsla(${hue}, 90%, 75%, ${params.strokeAlpha})`;
  ctx.lineWidth = 0.8;
  const half = size / 2;
  ctx.fillRect(cx - half, cy - half, size, size);
  ctx.strokeRect(cx - half, cy - half, size, size);

  const child = size * params.ratio - params.shrink;
  // 4 辺の中点に子正方形
  tSquare(cx - half, cy, child, depth - 1); // 左
  tSquare(cx + half, cy, child, depth - 1); // 右
  tSquare(cx, cy - half, child, depth - 1); // 上
  tSquare(cx, cy + half, child, depth - 1); // 下
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = 'rgba(11, 10, 7, 0.18)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const ang = params.rotation + time * params.rotSpeed;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  tSquare(0, 0, params.initialSize, Math.round(params.depth));
  ctx.restore();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'T-Square Fractal',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 1, 9, 1);
gui.add(params, 'initialSize', 100, 600, 1);
gui.add(params, 'ratio', 0.3, 0.6, 0.01);
gui.add(params, 'shrink', 0, 20, 0.5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 20, 80, 1);
gui.add(params, 'alpha', 0.2, 1, 0.01);
gui.add(params, 'strokeAlpha', 0, 1, 0.01);
gui.add(params, 'rotation', -3.14, 3.14, 0.01);
gui.add(params, 'rotSpeed', -0.5, 0.5, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.depth = rand(5, 8, 1);
  params.initialSize = rand(200, 500, 1);
  params.ratio = rand(0.42, 0.55, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.saturation = rand(40, 90, 1);
  params.rotSpeed = rand(-0.2, 0.2, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
