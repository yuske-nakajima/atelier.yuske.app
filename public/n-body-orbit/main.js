// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  bodies: 4,
  g: 0.8,
  dt: 0.4,
  softening: 20,
  damping: 1.0,
  hueStart: 30,
  hueRange: 300,
  trailFade: 0.04,
  massRange: 40,
  initSpeed: 0.5,
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

/** @type {{x:number,y:number,vx:number,vy:number,m:number,hue:number}[]} */
let bodies = [];
function reseed() {
  bodies = [];
  const n = Math.max(2, params.bodies | 0);
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
    const r = 150 + Math.random() * 200;
    const x = cx + Math.cos(a) * r,
      y = cy + Math.sin(a) * r;
    // 接線方向初速
    const vx = -Math.sin(a) * params.initSpeed * 3;
    const vy = Math.cos(a) * params.initSpeed * 3;
    bodies.push({
      x,
      y,
      vx,
      vy,
      m: 10 + Math.random() * params.massRange,
      hue: params.hueStart + (i / n) * params.hueRange,
    });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function tick() {
  ctx.fillStyle = `rgba(11,10,7,${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    const a = bodies[i];
    let fx = 0,
      fy = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const b = bodies[j];
      const dx = b.x - a.x,
        dy = b.y - a.y;
      const d2 = dx * dx + dy * dy + params.softening * params.softening;
      const f = (params.g * b.m) / d2;
      fx += (f * dx) / Math.sqrt(d2);
      fy += (f * dy) / Math.sqrt(d2);
    }
    a.vx = (a.vx + fx * params.dt) * params.damping;
    a.vy = (a.vy + fy * params.dt) * params.damping;
  }
  for (const b of bodies) {
    b.x += b.vx * params.dt;
    b.y += b.vy * params.dt;
    const r = Math.sqrt(b.m) * 0.7;
    ctx.fillStyle = `hsla(${b.hue}, 85%, 60%, 0.95)`;
    ctx.beginPath();
    ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'N-body',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'bodies', 2, 20, 1);
gui.add(params, 'g', 0.1, 3, 0.01);
gui.add(params, 'dt', 0.05, 1, 0.01);
gui.add(params, 'softening', 1, 80, 0.5);
gui.add(params, 'damping', 0.9, 1, 0.001);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 720, 1);
gui.add(params, 'trailFade', 0, 0.3, 0.01);
gui.add(params, 'massRange', 5, 200, 1);
gui.add(params, 'initSpeed', 0, 2, 0.01);
gui.addButton('Random', () => {
  params.bodies = rand(3, 10, 1);
  params.g = rand(0.3, 1.5, 0.01);
  params.softening = rand(10, 40, 0.5);
  params.hueStart = rand(0, 360, 1);
  params.initSpeed = rand(0.3, 1.5, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
