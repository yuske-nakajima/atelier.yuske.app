// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  alpha: 10.82,
  beta: 14.286,
  m0: -1.143,
  m1: -0.714,
  dt: 0.01,
  trails: 1500,
  stepsPerFrame: 6,
  scale: 60,
  hueStart: 300,
  fade: 0.04,
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
let s = { x: 0.1, y: 0, z: 0 };
function reseed() {
  pts = [];
  s = { x: Math.random() * 0.2, y: 0, z: 0 };
}
reseed();
function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function chuaDiode(x) {
  return (
    params.m1 * x +
    0.5 * (params.m0 - params.m1) * (Math.abs(x + 1) - Math.abs(x - 1))
  );
}

function tick() {
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let k = 0; k < params.stepsPerFrame; k++) {
    const dx = params.alpha * (s.y - s.x - chuaDiode(s.x));
    const dy = s.x - s.y + s.z;
    const dz = -params.beta * s.y;
    s.x += dx * params.dt;
    s.y += dy * params.dt;
    s.z += dz * params.dt;
    pts.push({ x: s.x, y: s.y, z: s.z });
    if (pts.length > params.trails) pts.shift();
  }
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    const x1 = cx + a.x * params.scale,
      y1 = cy + a.z * params.scale * 0.3 + a.y * params.scale;
    const x2 = cx + b.x * params.scale,
      y2 = cy + b.z * params.scale * 0.3 + b.y * params.scale;
    const t = i / pts.length;
    const hue = (params.hueStart + t * 140) % 360;
    ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.25 + t * 0.65})`;
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
  title: 'Chua',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'alpha', 5, 20, 0.01);
gui.add(params, 'beta', 5, 30, 0.01);
gui.add(params, 'm0', -2, 0, 0.001);
gui.add(params, 'm1', -1.5, 0, 0.001);
gui.add(params, 'dt', 0.002, 0.03, 0.001);
gui.add(params, 'trails', 300, 4000, 10);
gui.add(params, 'stepsPerFrame', 1, 20, 1);
gui.add(params, 'scale', 20, 150, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.addButton('Random', () => {
  params.alpha = rand(8, 16, 0.01);
  params.beta = rand(12, 22, 0.01);
  params.m0 = rand(-1.5, -0.8, 0.001);
  params.m1 = rand(-1, -0.3, 0.001);
  params.hueStart = rand(0, 360, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
