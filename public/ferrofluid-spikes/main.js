// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  spikes: 40,
  magnet: 0.8,
  surfaceTension: 0.6,
  viscosity: 0.3,
  gravity: 0.4,
  sharpness: 2.4,
  hue: 270,
  glow: 0.7,
  noise: 0.3,
  radius: 280,
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

let spikes = [];
function reseed() {
  spikes = [];
  const n = Math.max(3, params.spikes | 0);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    spikes.push({
      a,
      len: params.radius * 0.3,
      v: 0,
      phase: Math.random() * Math.PI * 2,
    });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

let time = 0;
function tick() {
  time += 1 / 60;
  ctx.fillStyle = 'rgba(11,10,7,0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  // 磁場を想定した目標長
  const target = params.radius * (0.6 + 0.4 * params.magnet);
  for (let i = 0; i < spikes.length; i++) {
    const s = spikes[i];
    const noise = Math.sin(time * 1.5 + s.phase) * params.noise * 50;
    const desired = target + noise - params.gravity * 20;
    const force = (desired - s.len) * params.surfaceTension * 0.2;
    s.v = s.v * (1 - params.viscosity * 0.3) + force;
    s.len += s.v * 0.1;
    // 隣接トゲとの相互作用（磁気反発）
    const left = spikes[(i - 1 + spikes.length) % spikes.length];
    const right = spikes[(i + 1) % spikes.length];
    const smooth = (left.len + right.len) / 2;
    s.len += (smooth - s.len) * 0.1 * (1 - params.magnet);
  }
  // 描画
  ctx.beginPath();
  for (let i = 0; i < spikes.length; i++) {
    const s = spikes[i];
    const x = cx + Math.cos(s.a) * s.len;
    const y = cy + Math.sin(s.a) * s.len;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(
    cx,
    cy,
    10,
    cx,
    cy,
    params.radius * 1.5,
  );
  grad.addColorStop(0, `hsla(${params.hue}, 90%, 60%, ${params.glow})`);
  grad.addColorStop(1, `hsla(${params.hue}, 80%, 20%, 0.9)`);
  ctx.fillStyle = grad;
  ctx.fill();
  // 鋭いトゲのハイライト
  ctx.lineWidth = Math.max(0.5, 3 - params.sharpness * 0.4);
  ctx.strokeStyle = `hsla(${params.hue + 30}, 100%, 80%, 0.8)`;
  ctx.stroke();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Ferrofluid',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'spikes', 8, 80, 1);
gui.add(params, 'magnet', 0, 1.5, 0.01);
gui.add(params, 'surfaceTension', 0, 1.5, 0.01);
gui.add(params, 'viscosity', 0, 1, 0.01);
gui.add(params, 'gravity', 0, 1.5, 0.01);
gui.add(params, 'sharpness', 0.5, 5, 0.01);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'glow', 0, 1, 0.01);
gui.add(params, 'noise', 0, 1, 0.01);
gui.add(params, 'radius', 80, 500, 1);
gui.addButton('Random', () => {
  params.spikes = rand(12, 60, 1);
  params.magnet = rand(0.3, 1.2, 0.01);
  params.surfaceTension = rand(0.2, 1, 0.01);
  params.viscosity = rand(0.1, 0.6, 0.01);
  params.hue = rand(0, 360, 1);
  params.noise = rand(0.1, 0.6, 0.01);
  params.radius = rand(150, 400, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
