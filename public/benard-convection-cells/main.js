// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  cells: 7,
  particles: 3000,
  rayleigh: 2.0,
  viscosity: 0.05,
  wobble: 0.3,
  fade: 0.1,
  hueHot: 20,
  hueCold: 210,
  speed: 1.0,
  size: 1.3,
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

let time = 0;
function tick() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width,
    H = canvas.height;
  const kx = (params.cells * Math.PI) / W;
  const ky = Math.PI / H;
  const sp = params.speed;
  for (const p of parts) {
    // Bénard セル: ψ = sin(kx x) sin(ky y) -> u = ∂ψ/∂y, v = -∂ψ/∂x
    const wobble = 1 + params.wobble * Math.sin(time * sp * 0.7 + p.x * 0.01);
    const u =
      ky *
      Math.sin(kx * p.x) *
      Math.cos(ky * p.y) *
      params.rayleigh *
      30 *
      wobble;
    const v =
      -kx *
      Math.cos(kx * p.x) *
      Math.sin(ky * p.y) *
      params.rayleigh *
      30 *
      wobble;
    p.x += u * (1 - params.viscosity);
    p.y += v * (1 - params.viscosity);
    if (p.x < 0) p.x += W;
    if (p.x > W) p.x -= W;
    if (p.y < 0) p.y = 0;
    if (p.y > H) p.y = H;
    // 温度 = sin(kx x) cos(ky y) 相当
    const temp = Math.sin(kx * p.x) * Math.cos(ky * p.y);
    const hue = temp > 0 ? params.hueHot : params.hueCold;
    const light = 40 + Math.abs(temp) * 40;
    ctx.fillStyle = `hsla(${hue}, 85%, ${light}%, 0.85)`;
    ctx.fillRect(p.x, p.y, params.size, params.size);
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Bénard',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'cells', 2, 20, 1);
gui.add(params, 'particles', 500, 6000, 10);
gui.add(params, 'rayleigh', 0.2, 5, 0.01);
gui.add(params, 'viscosity', 0, 0.2, 0.001);
gui.add(params, 'wobble', 0, 1, 0.01);
gui.add(params, 'fade', 0, 0.5, 0.01);
gui.add(params, 'hueHot', 0, 360, 1);
gui.add(params, 'hueCold', 0, 360, 1);
gui.add(params, 'speed', 0, 3, 0.01);
gui.add(params, 'size', 0.5, 4, 0.1);
gui.addButton('Random', () => {
  params.cells = rand(3, 14, 1);
  params.rayleigh = rand(1, 3, 0.01);
  params.wobble = rand(0, 0.6, 0.01);
  params.hueHot = rand(0, 60, 1);
  params.hueCold = rand(180, 240, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
