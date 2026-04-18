// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  a: 0.2,
  b: 0.2,
  c: 5.7,
  dt: 0.02,
  trails: 1000,
  stepsPerFrame: 4,
  scale: 14,
  rotSpeed: 0.3,
  hueStart: 320,
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
let h = { x: 0.1, y: 0, z: 0 };
function reseed() {
  pts = [];
  h = { x: Math.random(), y: Math.random(), z: Math.random() };
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
    const dx = -h.y - h.z;
    const dy = h.x + params.a * h.y;
    const dz = params.b + h.z * (h.x - params.c);
    h.x += dx * params.dt;
    h.y += dy * params.dt;
    h.z += dz * params.dt;
    pts.push({ x: h.x, y: h.y, z: h.z });
    if (pts.length > params.trails) pts.shift();
  }
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  const cs = Math.cos(rot),
    sn = Math.sin(rot);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i];
    const ax = a.x * cs - a.z * sn;
    const bx = b.x * cs - b.z * sn;
    const x1 = cx + ax * params.scale,
      y1 = cy + a.y * params.scale;
    const x2 = cx + bx * params.scale,
      y2 = cy + b.y * params.scale;
    const t = i / pts.length;
    const hue = (params.hueStart + t * 180) % 360;
    ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${0.3 + t * 0.6})`;
    ctx.lineWidth = 1 + t;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Rössler',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'a', 0.05, 0.5, 0.001);
gui.add(params, 'b', 0.05, 1, 0.001);
gui.add(params, 'c', 1, 15, 0.01);
gui.add(params, 'dt', 0.005, 0.05, 0.001);
gui.add(params, 'trails', 200, 4000, 10);
gui.add(params, 'stepsPerFrame', 1, 20, 1);
gui.add(params, 'scale', 4, 40, 0.1);
gui.add(params, 'rotSpeed', -2, 2, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.addButton('Random', () => {
  params.a = rand(0.1, 0.3, 0.001);
  params.b = rand(0.1, 0.4, 0.001);
  params.c = rand(4, 10, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.rotSpeed = rand(-0.6, 0.6, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
