// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  sigma: 10,
  rho: 28,
  beta: 2.667,
  dt: 0.01,
  trails: 800,
  stepsPerFrame: 4,
  scale: 8,
  rotSpeed: 0.35,
  hueStart: 180,
  fade: 0.05,
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
let head = { x: 1, y: 1, z: 1 };
function reseed() {
  pts = [];
  head = { x: 1 + Math.random(), y: 1 + Math.random(), z: 1 + Math.random() };
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

let rot = 0;
function tick() {
  rot += params.rotSpeed / 60;
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let k = 0; k < params.stepsPerFrame; k++) {
    const dx = params.sigma * (head.y - head.x);
    const dy = head.x * (params.rho - head.z) - head.y;
    const dz = head.x * head.y - params.beta * head.z;
    head.x += dx * params.dt;
    head.y += dy * params.dt;
    head.z += dz * params.dt;
    pts.push({ x: head.x, y: head.y, z: head.z });
    if (pts.length > params.trails) pts.shift();
  }
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  const cs = Math.cos(rot),
    sn = Math.sin(rot);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    const ax = a.x * cs - a.z * sn,
      az = a.x * sn + a.z * cs;
    const bx = b.x * cs - b.z * sn,
      bz = b.x * sn + b.z * cs;
    const sa = params.scale / (1 + (az + 40) * 0.01);
    const sb = params.scale / (1 + (bz + 40) * 0.01);
    const x1 = cx + ax * sa,
      y1 = cy + a.y * sa;
    const x2 = cx + bx * sb,
      y2 = cy + b.y * sb;
    const t = i / pts.length;
    const hue = (params.hueStart + t * 180) % 360;
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.3 + t * 0.6})`;
    ctx.lineWidth = 1 + t * 0.8;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Lorenz 3D',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'sigma', 1, 30, 0.01);
gui.add(params, 'rho', 1, 100, 0.01);
gui.add(params, 'beta', 0.5, 8, 0.001);
gui.add(params, 'dt', 0.001, 0.03, 0.001);
gui.add(params, 'trails', 100, 3000, 10);
gui.add(params, 'stepsPerFrame', 1, 20, 1);
gui.add(params, 'scale', 2, 20, 0.1);
gui.add(params, 'rotSpeed', -2, 2, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.addButton('Random', () => {
  params.sigma = rand(8, 16, 0.01);
  params.rho = rand(22, 45, 0.01);
  params.beta = rand(2, 3.5, 0.001);
  params.hueStart = rand(0, 360, 1);
  params.rotSpeed = rand(-0.8, 0.8, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
