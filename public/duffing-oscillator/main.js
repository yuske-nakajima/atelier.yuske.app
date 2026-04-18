// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  alpha: -1,
  beta: 1,
  delta: 0.25,
  gamma: 0.4,
  omega: 1.0,
  trails: 6000,
  stepsPerFrame: 6,
  dt: 0.015,
  scale: 120,
  hueStart: 150,
  fade: 0.03,
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

let pts = [];
let s = { x: 0.1, v: 0, t: 0 };
function reseed() {
  pts = [];
  s = { x: (Math.random() - 0.5) * 0.5, v: 0, t: 0 };
}
reseed();
function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function tick() {
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let k = 0; k < params.stepsPerFrame; k++) {
    const a =
      -params.delta * s.v -
      params.alpha * s.x -
      params.beta * s.x ** 3 +
      params.gamma * Math.cos(params.omega * s.t);
    s.v += a * params.dt;
    s.x += s.v * params.dt;
    s.t += params.dt;
    pts.push({ x: s.x, v: s.v });
    if (pts.length > params.trails) pts.shift();
  }
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    const x1 = cx + a.x * params.scale,
      y1 = cy - a.v * params.scale;
    const x2 = cx + b.x * params.scale,
      y2 = cy - b.v * params.scale;
    const t = i / pts.length;
    const hue = (params.hueStart + t * 200) % 360;
    ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.2 + t * 0.7})`;
    ctx.lineWidth = 0.8 + t * 0.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Duffing',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'alpha', -3, 3, 0.01);
gui.add(params, 'beta', -3, 3, 0.01);
gui.add(params, 'delta', 0, 1, 0.01);
gui.add(params, 'gamma', 0, 1.5, 0.01);
gui.add(params, 'omega', 0.2, 3, 0.01);
gui.add(params, 'trails', 500, 15000, 50);
gui.add(params, 'stepsPerFrame', 1, 20, 1);
gui.add(params, 'dt', 0.002, 0.04, 0.001);
gui.add(params, 'scale', 30, 300, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.addButton('Random', () => {
  params.alpha = rand(-2, 2, 0.01);
  params.beta = rand(-2, 2, 0.01);
  params.delta = rand(0.05, 0.5, 0.01);
  params.gamma = rand(0.2, 0.8, 0.01);
  params.omega = rand(0.5, 2, 0.01);
  params.hueStart = rand(0, 360, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
