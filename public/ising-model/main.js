// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  gridSize: 180,
  temperature: 2.3,
  field: 0.0,
  sweepRate: 40,
  cellSize: 4,
  hueUp: 30,
  hueDown: 210,
  saturation: 80,
  fade: 0.0,
  coupling: 1.0,
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

/** @type {Int8Array} */
let grid;
let N = 0;
function reseed() {
  N = Math.max(20, params.gridSize | 0);
  grid = new Int8Array(N * N);
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.5 ? 1 : -1;
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function step() {
  const total = N * N;
  const sweeps = Math.max(1, params.sweepRate | 0);
  for (let k = 0; k < (sweeps * total) / 10; k++) {
    const i = (Math.random() * total) | 0;
    const x = i % N,
      y = (i / N) | 0;
    const s = grid[i];
    const n1 = grid[((x + 1) % N) + y * N];
    const n2 = grid[((x + N - 1) % N) + y * N];
    const n3 = grid[x + ((y + 1) % N) * N];
    const n4 = grid[x + ((y + N - 1) % N) * N];
    const dE = 2 * s * (params.coupling * (n1 + n2 + n3 + n4) + params.field);
    if (
      dE <= 0 ||
      Math.random() < Math.exp(-dE / Math.max(0.01, params.temperature))
    ) {
      grid[i] = /** @type {-1|1} */ (-s);
    }
  }
}

function tick() {
  step();
  if (params.fade > 0) {
    ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#0b0a07';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const size = params.cellSize;
  const offsetX = (canvas.width - N * size) / 2;
  const offsetY = (canvas.height - N * size) / 2;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const s = grid[x + y * N];
      const hue = s > 0 ? params.hueUp : params.hueDown;
      ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${s > 0 ? 65 : 40}%, 1)`;
      ctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
    }
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Ising',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'gridSize', 40, 300, 1);
gui.add(params, 'temperature', 0.1, 5, 0.01);
gui.add(params, 'field', -2, 2, 0.01);
gui.add(params, 'sweepRate', 1, 200, 1);
gui.add(params, 'cellSize', 1, 12, 1);
gui.add(params, 'hueUp', 0, 360, 1);
gui.add(params, 'hueDown', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.add(params, 'coupling', -2, 2, 0.01);
gui.addButton('Random', () => {
  params.temperature = rand(1.5, 3.5, 0.01);
  params.field = rand(-0.5, 0.5, 0.01);
  params.hueUp = rand(0, 360, 1);
  params.hueDown = rand(0, 360, 1);
  params.coupling = rand(0.5, 1.5, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
