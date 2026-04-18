// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  particles: 3000,
  shear: 2.5,
  waveNum: 6,
  amplitude: 0.2,
  viscosity: 0.02,
  fade: 0.08,
  hueTop: 200,
  hueBottom: 30,
  size: 1.4,
  swirl: 1.0,
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

/** @type {{x:number,y:number,side:number}[]} */
let parts = [];
function reseed() {
  parts = [];
  const n = Math.max(100, params.particles | 0);
  for (let i = 0; i < n; i++) {
    const y = Math.random() * canvas.height;
    const side = y < canvas.height / 2 ? 1 : -1;
    parts.push({ x: Math.random() * canvas.width, y, side });
  }
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
  const midY = canvas.height / 2;
  for (const p of parts) {
    const dy = (p.y - midY) / midY;
    const u = params.shear * Math.tanh(dy * 4);
    // KH 不安定性による波状渦
    const k = (params.waveNum * 2 * Math.PI) / canvas.width;
    const perturb =
      params.amplitude * Math.sin(k * p.x - time * 2) * Math.exp(-dy * dy * 4);
    const vx = u + perturb * params.swirl * 20;
    const vy =
      -params.amplitude *
      k *
      Math.cos(k * p.x - time * 2) *
      60 *
      Math.exp(-dy * dy * 4);
    p.x += vx * (1 - params.viscosity);
    p.y += vy * (1 - params.viscosity);
    if (p.x < 0) p.x += canvas.width;
    if (p.x > canvas.width) p.x -= canvas.width;
    if (p.y < 0 || p.y > canvas.height)
      p.y = (p.y + canvas.height) % canvas.height;
    const hue = p.side > 0 ? params.hueTop : params.hueBottom;
    ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.85)`;
    ctx.fillRect(p.x, p.y, params.size, params.size);
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Kelvin–Helmholtz',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'particles', 500, 5000, 10);
gui.add(params, 'shear', 0.2, 6, 0.01);
gui.add(params, 'waveNum', 1, 16, 1);
gui.add(params, 'amplitude', 0, 0.6, 0.01);
gui.add(params, 'viscosity', 0, 0.1, 0.001);
gui.add(params, 'fade', 0, 0.4, 0.01);
gui.add(params, 'hueTop', 0, 360, 1);
gui.add(params, 'hueBottom', 0, 360, 1);
gui.add(params, 'size', 0.5, 4, 0.1);
gui.add(params, 'swirl', 0, 3, 0.01);
gui.addButton('Random', () => {
  params.shear = rand(1, 4, 0.01);
  params.waveNum = rand(2, 10, 1);
  params.amplitude = rand(0.1, 0.4, 0.01);
  params.hueTop = rand(180, 260, 1);
  params.hueBottom = rand(0, 60, 1);
  params.swirl = rand(0.5, 2, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
