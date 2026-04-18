// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  gridSize: 120,
  cellSize: 5,
  kernelR: 13,
  mu: 0.15,
  sigma: 0.015,
  dt: 0.1,
  hueStart: 160,
  hueRange: 80,
  saturation: 80,
  density: 0.35,
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

let grid, buf;
let N = 0;
let kernel,
  kernelSum = 0,
  R = 0;
function buildKernel() {
  R = Math.max(3, params.kernelR | 0);
  kernel = new Float32Array((2 * R + 1) * (2 * R + 1));
  kernelSum = 0;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const r = Math.sqrt(dx * dx + dy * dy) / R;
      let v = 0;
      if (r > 0 && r < 1) {
        const kc = 0.5;
        const kw = 0.15;
        v = Math.exp(-((r - kc) ** 2) / (2 * kw * kw));
      }
      kernel[(dy + R) * (2 * R + 1) + (dx + R)] = v;
      kernelSum += v;
    }
  }
}
function reseed() {
  N = Math.max(30, params.gridSize | 0);
  grid = new Float32Array(N * N);
  buf = new Float32Array(N * N);
  for (let i = 0; i < grid.length; i++)
    grid[i] = Math.random() < params.density ? Math.random() : 0;
  buildKernel();
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function growth(u) {
  return 2 * Math.exp(-((u - params.mu) ** 2) / (2 * params.sigma ** 2)) - 1;
}

function step() {
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const k = kernel[(dy + R) * (2 * R + 1) + (dx + R)];
          if (k === 0) continue;
          const nx = (x + dx + N) % N,
            ny = (y + dy + N) % N;
          s += k * grid[nx + ny * N];
        }
      }
      const u = s / kernelSum;
      const g = growth(u);
      const v = Math.max(0, Math.min(1, grid[x + y * N] + params.dt * g));
      buf[x + y * N] = v;
    }
  }
  [grid, buf] = [buf, grid];
}

function tick() {
  step();
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const size = params.cellSize;
  const ox = (canvas.width - N * size) / 2,
    oy = (canvas.height - N * size) / 2;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = grid[x + y * N];
      if (v < 0.02) continue;
      const hue = (params.hueStart + v * params.hueRange) % 360;
      ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${20 + v * 55}%, 1)`;
      ctx.fillRect(ox + x * size, oy + y * size, size, size);
    }
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Lenia',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'gridSize', 40, 200, 1);
gui.add(params, 'cellSize', 2, 10, 1);
gui.add(params, 'kernelR', 4, 20, 1);
gui.add(params, 'mu', 0.05, 0.4, 0.001);
gui.add(params, 'sigma', 0.005, 0.05, 0.001);
gui.add(params, 'dt', 0.02, 0.3, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 30, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'density', 0.05, 0.8, 0.01);
gui.addButton('Random', () => {
  params.mu = rand(0.1, 0.25, 0.001);
  params.sigma = rand(0.01, 0.03, 0.001);
  params.dt = rand(0.05, 0.2, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.density = rand(0.2, 0.5, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
