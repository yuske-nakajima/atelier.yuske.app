// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  particles: 2500,
  gravity: 0.12,
  viscosity: 0.08,
  perturbation: 0.3,
  wavelength: 4,
  contrast: 0.9,
  hueHeavy: 20,
  hueLight: 200,
  fade: 0.12,
  size: 1.6,
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

/** @type {{x:number,y:number,vx:number,vy:number,heavy:number}[]} */
let parts = [];
function reseed() {
  parts = [];
  const n = Math.max(100, params.particles | 0);
  for (let i = 0; i < n; i++) {
    const x = Math.random() * canvas.width;
    const heavy = Math.random() < 0.5 ? 1 : 0;
    const baseY = heavy ? canvas.height * 0.25 : canvas.height * 0.7;
    const y = baseY + (Math.random() - 0.5) * canvas.height * 0.15;
    const pert =
      Math.sin((x / canvas.width) * Math.PI * 2 * params.wavelength) *
      params.perturbation *
      30;
    parts.push({ x, y: y + (heavy ? pert : -pert), vx: 0, vy: 0, heavy });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function tick() {
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const p of parts) {
    const g = params.gravity * (p.heavy ? 1 : -0.9);
    p.vy += g;
    p.vx *= 1 - params.viscosity;
    p.vy *= 1 - params.viscosity;
    // 水平方向の循環（対流効果の簡易近似）
    p.vx +=
      Math.sin((p.y / canvas.height) * Math.PI * 2 + (p.heavy ? 0 : Math.PI)) *
      0.02;
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x += canvas.width;
    if (p.x > canvas.width) p.x -= canvas.width;
    if (p.y < 0) {
      p.y = 0;
      p.vy *= -0.4;
    }
    if (p.y > canvas.height) {
      p.y = canvas.height;
      p.vy *= -0.4;
    }
    const hue = p.heavy ? params.hueHeavy : params.hueLight;
    ctx.fillStyle = `hsla(${hue}, 80%, ${50 + params.contrast * 10}%, 0.8)`;
    ctx.fillRect(p.x, p.y, params.size, params.size);
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Rayleigh–Taylor',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'particles', 300, 5000, 10);
gui.add(params, 'gravity', 0, 0.5, 0.001);
gui.add(params, 'viscosity', 0, 0.3, 0.001);
gui.add(params, 'perturbation', 0, 1, 0.01);
gui.add(params, 'wavelength', 1, 12, 1);
gui.add(params, 'contrast', 0, 2, 0.01);
gui.add(params, 'hueHeavy', 0, 360, 1);
gui.add(params, 'hueLight', 0, 360, 1);
gui.add(params, 'fade', 0, 0.5, 0.01);
gui.add(params, 'size', 0.5, 5, 0.1);
gui.addButton('Random', () => {
  params.gravity = rand(0.05, 0.25, 0.001);
  params.viscosity = rand(0.02, 0.15, 0.001);
  params.perturbation = rand(0.1, 0.6, 0.01);
  params.wavelength = rand(2, 8, 1);
  params.hueHeavy = rand(0, 60, 1);
  params.hueLight = rand(170, 250, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
