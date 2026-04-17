// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  depth: 10,
  baseSize: 90,
  angle: 45, // 分岐角
  leftRatio: Math.SQRT1_2, // 左子の大きさ比
  rightRatio: Math.SQRT1_2, // 右子の大きさ比
  asymmetry: 0,
  hueStart: 120,
  hueEnd: 30,
  alpha: 0.85,
  fade: 0.12,
  sway: 0.15,
  swaySpeed: 0.6,
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
 * 正方形を描いて左右に子の正方形を再帰
 * @param {number} x 底辺左端 x
 * @param {number} y 底辺左端 y
 * @param {number} size 一辺
 * @param {number} rot 回転（ラジアン、底辺の向き）
 * @param {number} depth
 */
function drawSquare(x, y, size, rot, depth) {
  if (depth <= 0 || size < 1) return;
  const t = 1 - depth / params.depth;
  const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
  ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${params.alpha * 0.3})`;
  ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${params.alpha})`;
  ctx.lineWidth = Math.max(0.5, 1.2);

  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  // 4 頂点（底辺左から時計回り）
  const p1 = { x, y };
  const p2 = { x: x + cosR * size, y: y + sinR * size };
  const up = { x: -sinR, y: cosR };
  const p3 = { x: p2.x + up.x * size, y: p2.y + up.y * size };
  const p4 = { x: p1.x + up.x * size, y: p1.y + up.y * size };

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 屋根の頂点を角度で決める
  const sway =
    Math.sin(time * params.swaySpeed + depth * 0.5) * params.sway * 8;
  const aL = ((params.angle + params.asymmetry + sway) * Math.PI) / 180;
  const aR = ((params.angle - params.asymmetry - sway) * Math.PI) / 180;
  // 左子: 上辺左端 (p4) を底辺左端、長さは size * cos(aL) に比例
  const lSize = size * Math.cos(aL) * params.leftRatio;
  const lRot = rot - aL;
  drawSquare(p4.x, p4.y, lSize, lRot, depth - 1);

  // 右子: 屋根の頂点から p3 まで。
  const rSize = size * Math.sin(aL) * params.rightRatio;
  // 屋根頂点 = p4 + (cos(aL), sin(aL)) in 回転座標で size*cos(aL)
  const apex = {
    x:
      p4.x + (cosR * Math.cos(aL) + -sinR * Math.sin(aL)) * size * Math.cos(aL),
    y: p4.y + (sinR * Math.cos(aL) + cosR * Math.sin(aL)) * size * Math.cos(aL),
  };
  const rRot = rot + (Math.PI / 2 - aR);
  drawSquare(apex.x, apex.y, rSize, rRot, depth - 1);
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const x0 = canvas.width / 2 - params.baseSize / 2;
  const y0 = canvas.height * 0.92;
  drawSquare(x0, y0, params.baseSize, 0, Math.round(params.depth));
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Pythagoras Tree',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 3, 13, 1);
gui.add(params, 'baseSize', 30, 180, 1);
gui.add(params, 'angle', 10, 80, 1);
gui.add(params, 'leftRatio', 0.5, 1, 0.01);
gui.add(params, 'rightRatio', 0.5, 1, 0.01);
gui.add(params, 'asymmetry', -20, 20, 0.5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'alpha', 0.2, 1, 0.01);
gui.add(params, 'fade', 0, 0.4, 0.01);
gui.add(params, 'sway', 0, 0.6, 0.01);
gui.add(params, 'swaySpeed', 0, 2, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.depth = rand(7, 11, 1);
  params.angle = rand(25, 60, 1);
  params.leftRatio = rand(0.6, 0.85, 0.01);
  params.rightRatio = rand(0.6, 0.85, 0.01);
  params.asymmetry = rand(-10, 10, 0.5);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.sway = rand(0.05, 0.3, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
