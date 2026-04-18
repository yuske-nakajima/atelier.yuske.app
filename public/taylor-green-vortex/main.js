// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  particles: 3500,
  modes: 2,
  amp: 1.5,
  decay: 0.002,
  viscosity: 0.01,
  hueA: 200,
  hueB: 340,
  fade: 0.08,
  size: 1.4,
  twist: 0.0,
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

/** @type {{x:number,y:number}[]} */
let parts = [];
function reseed() {
  parts = [];
  const n = Math.max(100, params.particles | 0);
  for (let i = 0; i < n; i++)
    parts.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    });
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

let energy = 1;
function tick() {
  energy *= 1 - params.decay;
  if (energy < 0.05) energy = 1; // 自動再励起
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width,
    H = canvas.height;
  const kx = (params.modes * Math.PI * 2) / W;
  const ky = (params.modes * Math.PI * 2) / H;
  const A = params.amp * energy;
  for (const p of parts) {
    // Taylor-Green: u =  A sin(kx) cos(ky), v = -A cos(kx) sin(ky)
    const u = A * Math.sin(kx * p.x) * Math.cos(ky * p.y) * 20;
    const v = -A * Math.cos(kx * p.x) * Math.sin(ky * p.y) * 20;
    const tw = params.twist * (p.y - H / 2) * 0.01;
    p.x += u + tw;
    p.y += v;
    p.x += (Math.random() - 0.5) * params.viscosity * 6;
    p.y += (Math.random() - 0.5) * params.viscosity * 6;
    if (p.x < 0) p.x += W;
    if (p.x > W) p.x -= W;
    if (p.y < 0) p.y += H;
    if (p.y > H) p.y -= H;
    const vor = Math.sin(kx * p.x) * Math.sin(ky * p.y);
    const hue = vor > 0 ? params.hueA : params.hueB;
    ctx.fillStyle = `hsla(${hue}, 80%, ${45 + Math.abs(vor) * 30}%, 0.85)`;
    ctx.fillRect(p.x, p.y, params.size, params.size);
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Taylor–Green',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'particles', 500, 6000, 10);
gui.add(params, 'modes', 1, 8, 1);
gui.add(params, 'amp', 0.2, 5, 0.01);
gui.add(params, 'decay', 0, 0.02, 0.0005);
gui.add(params, 'viscosity', 0, 0.1, 0.001);
gui.add(params, 'hueA', 0, 360, 1);
gui.add(params, 'hueB', 0, 360, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.add(params, 'size', 0.5, 3, 0.1);
gui.add(params, 'twist', -1, 1, 0.01);
gui.addButton('Random', () => {
  params.modes = rand(1, 6, 1);
  params.amp = rand(0.5, 3, 0.01);
  params.hueA = rand(0, 360, 1);
  params.hueB = rand(0, 360, 1);
  params.twist = rand(-0.5, 0.5, 0.01);
  energy = 1;
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  energy = 1;
  reseed();
  gui.updateDisplay();
});
