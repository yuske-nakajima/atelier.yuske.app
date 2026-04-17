// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  maxDepth: 6, // 再帰深さ
  outerScale: 0.42, // 外接円の半径（画面に対する比）
  strokeAlpha: 0.85, // 線の不透明度
  fillAlpha: 0.12, // 塗りの不透明度
  hueStart: 30,
  hueRange: 200,
  thickness: 1.4,
  rotation: 0,
  rotSpeed: 0.05,
  innerRatio: 1, // 内部 3 円の配置係数
  showInner: true,
  zoom: 1,
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
 * 3 円に内接する円を求める（デカルトの円定理）
 * @param {{x:number,y:number,r:number}} a
 * @param {{x:number,y:number,r:number}} b
 * @param {{x:number,y:number,r:number}} c
 * @returns {{x:number,y:number,r:number}|null}
 */
function innerCircle(a, b, c) {
  const ka = 1 / a.r;
  const kb = 1 / b.r;
  const kc = 1 / c.r;
  const k4 = ka + kb + kc + 2 * Math.sqrt(ka * kb + kb * kc + kc * ka);
  const r = 1 / k4;
  // 中心をラプラス的重み付き平均で近似
  const za = { x: a.x, y: a.y };
  const zb = { x: b.x, y: b.y };
  const zc = { x: c.x, y: c.y };
  const wa = ka;
  const wb = kb;
  const wc = kc;
  const ws = wa + wb + wc;
  const cx = (za.x * wa + zb.x * wb + zc.x * wc) / ws;
  const cy = (za.y * wa + zb.y * wb + zc.y * wc) / ws;
  // 近似した中心から 3 円への距離を元に微調整
  const dx = cx - a.x;
  const dy = cy - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return null;
  const nx = a.x + (dx / dist) * (a.r - r);
  const ny = a.y + (dy / dist) * (a.r - r);
  return { x: nx, y: ny, r };
}

/**
 * @param {{x:number,y:number,r:number}} c
 * @param {number} hue
 */
function drawCircle(c, hue) {
  if (c.r < 0.5) return;
  ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${params.strokeAlpha})`;
  ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${params.fillAlpha})`;
  ctx.lineWidth = params.thickness;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * @param {{x:number,y:number,r:number}} a
 * @param {{x:number,y:number,r:number}} b
 * @param {{x:number,y:number,r:number}} c
 * @param {number} depth
 */
function recurse(a, b, c, depth) {
  if (depth <= 0) return;
  const inner = innerCircle(a, b, c);
  if (!inner || inner.r < 1) return;
  const hue =
    (params.hueStart + (params.maxDepth - depth) * params.hueRange) % 360;
  drawCircle(inner, hue);
  recurse(a, b, inner, depth - 1);
  recurse(b, c, inner, depth - 1);
  recurse(a, c, inner, depth - 1);
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = 'rgba(11, 10, 7, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R =
    Math.min(canvas.width, canvas.height) * params.outerScale * params.zoom;
  const ang = params.rotation + time * params.rotSpeed;

  const outer = { x: cx, y: cy, r: R };
  drawCircle(outer, params.hueStart);

  // 外側の円の内部に 3 つの等しい円（三つ葉配置）
  const r3 = (R / (2 + 2 / Math.sqrt(3))) * params.innerRatio;
  const d = R - r3;
  /** @type {{x:number,y:number,r:number}[]} */
  const inner3 = [];
  for (let i = 0; i < 3; i++) {
    const a = ang + (i * 2 * Math.PI) / 3;
    inner3.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, r: r3 });
  }
  if (params.showInner) {
    for (let i = 0; i < 3; i++) {
      drawCircle(inner3[i], params.hueStart + 30 + i * 20);
    }
  }

  // 外接円と内側 2 円で再帰（境界は半径が負の円として扱うと正確だが、ここでは簡易近似）
  recurse(inner3[0], inner3[1], inner3[2], params.maxDepth);
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Apollonian Gasket',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'maxDepth', 1, 8, 1);
gui.add(params, 'outerScale', 0.2, 0.55, 0.01);
gui.add(params, 'innerRatio', 0.8, 1.1, 0.01);
gui.add(params, 'strokeAlpha', 0, 1, 0.01);
gui.add(params, 'fillAlpha', 0, 0.5, 0.01);
gui.add(params, 'thickness', 0.2, 4, 0.1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'rotation', -3.14, 3.14, 0.01);
gui.add(params, 'rotSpeed', -1, 1, 0.01);
gui.add(params, 'zoom', 0.5, 1.5, 0.01);
gui.add(params, 'showInner');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.maxDepth = rand(4, 7, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(30, 240, 1);
  params.rotSpeed = rand(-0.2, 0.2, 0.01);
  params.innerRatio = rand(0.9, 1.05, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
