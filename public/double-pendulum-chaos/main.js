// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 二重振り子: 微小な初期角のずれが指数的に拡大するカオス系。
// 軌跡を残すことで感度依存性の可視化ができる。

const params = {
  length1: 1.0, // 上の腕の長さ
  length2: 1.0, // 下の腕の長さ
  mass1: 1.0, // 上のおもり質量
  mass2: 1.0, // 下のおもり質量
  gravity: 1.0, // 重力
  angle1: 2.2, // 上の初期角度 (rad)
  angle2: 2.6, // 下の初期角度 (rad)
  damping: 0.9995, // 減衰（1 で永遠）
  dt: 0.04, // 時間刻み
  trailHue: 210, // 軌跡の色相
  trailFade: 0.03, // フェード
  background: 6, // 背景明度
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

const state = {
  a1: params.angle1,
  a2: params.angle2,
  v1: 0,
  v2: 0,
};

function reset() {
  state.a1 = params.angle1;
  state.a2 = params.angle2;
  state.v1 = 0;
  state.v2 = 0;
}
reset();

/**
 * 二重振り子の角加速度を Lagrangian 方程式から計算する。
 * @returns {[number, number]}
 */
function acceleration() {
  const { length1: L1, length2: L2, mass1: m1, mass2: m2, gravity: g } = params;
  const { a1, a2, v1, v2 } = state;
  const d = a1 - a2;
  const den1 = L1 * (2 * m1 + m2 - m2 * Math.cos(2 * d));
  const num1 =
    -g * (2 * m1 + m2) * Math.sin(a1) -
    m2 * g * Math.sin(a1 - 2 * a2) -
    2 * Math.sin(d) * m2 * (v2 * v2 * L2 + v1 * v1 * L1 * Math.cos(d));
  const den2 = L2 * (2 * m1 + m2 - m2 * Math.cos(2 * d));
  const num2 =
    2 *
    Math.sin(d) *
    (v1 * v1 * L1 * (m1 + m2) +
      g * (m1 + m2) * Math.cos(a1) +
      v2 * v2 * L2 * m2 * Math.cos(d));
  return [num1 / den1, num2 / den2];
}

function step() {
  const [aa1, aa2] = acceleration();
  state.v1 = (state.v1 + aa1 * params.dt) * params.damping;
  state.v2 = (state.v2 + aa2 * params.dt) * params.damping;
  state.a1 += state.v1 * params.dt;
  state.a2 += state.v2 * params.dt;
}

let prev = /** @type {{x:number,y:number}|null} */ (null);

function positions() {
  const w = canvas.width;
  const h = canvas.height;
  const scale = Math.min(w, h) * 0.25;
  const ox = w / 2;
  const oy = h / 2;
  const x1 = ox + Math.sin(state.a1) * params.length1 * scale;
  const y1 = oy + Math.cos(state.a1) * params.length1 * scale;
  const x2 = x1 + Math.sin(state.a2) * params.length2 * scale;
  const y2 = y1 + Math.cos(state.a2) * params.length2 * scale;
  return { ox, oy, x1, y1, x2, y2 };
}

function render() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsla(0, 0%, ${params.background}%, ${params.trailFade})`;
  ctx.fillRect(0, 0, w, h);

  const p = positions();
  if (prev) {
    ctx.strokeStyle = `hsl(${params.trailHue}, 80%, 65%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x2, p.y2);
    ctx.stroke();
  }
  prev = { x: p.x2, y: p.y2 };

  ctx.strokeStyle = 'hsla(0, 0%, 80%, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p.ox, p.oy);
  ctx.lineTo(p.x1, p.y1);
  ctx.lineTo(p.x2, p.y2);
  ctx.stroke();

  ctx.fillStyle = '#eee';
  for (const [x, y, r] of [
    [p.x1, p.y1, 4],
    [p.x2, p.y2, 5],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  for (let i = 0; i < 4; i++) step();
  render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- GUI ---

const gui = new TileUI({
  title: 'Double Pendulum',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'length1', 0.3, 2.0, 0.01);
gui.add(params, 'length2', 0.3, 2.0, 0.01);
gui.add(params, 'mass1', 0.2, 3.0, 0.1);
gui.add(params, 'mass2', 0.2, 3.0, 0.1);
gui.add(params, 'gravity', 0.1, 3.0, 0.05);
gui.add(params, 'angle1', 0, Math.PI * 2, 0.01).onChange(reset);
gui.add(params, 'angle2', 0, Math.PI * 2, 0.01).onChange(reset);
gui.add(params, 'damping', 0.99, 1.0, 0.0001);
gui.add(params, 'dt', 0.005, 0.08, 0.001);
gui.add(params, 'trailHue', 0, 360, 1);
gui.add(params, 'trailFade', 0.005, 0.2, 0.005);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.length1 = r(0.6, 1.5, 0.01);
  params.length2 = r(0.6, 1.5, 0.01);
  params.mass1 = r(0.5, 2.5, 0.1);
  params.mass2 = r(0.5, 2.5, 0.1);
  params.angle1 = r(1.5, Math.PI, 0.01);
  params.angle2 = r(1.5, Math.PI, 0.01);
  params.trailHue = r(0, 360, 1);
  reset();
  prev = null;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  prev = null;
  gui.updateDisplay();
});
