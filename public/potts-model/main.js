// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  gridSize: 160,
  qStates: 5,
  temperature: 0.7,
  cellSize: 4,
  sweepRate: 40,
  hueStart: 0,
  hueRange: 360,
  saturation: 75,
  lightness: 55,
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

let grid;
let N = 0;
function reseed() {
  N = Math.max(20, params.gridSize | 0);
  grid = new Int8Array(N * N);
  const q = Math.max(2, params.qStates | 0);
  for (let i = 0; i < grid.length; i++) grid[i] = (Math.random() * q) | 0;
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function step() {
  const total = N * N;
  const sweeps = params.sweepRate | 0;
  const q = Math.max(2, params.qStates | 0);
  for (let k = 0; k < (sweeps * total) / 10; k++) {
    const i = (Math.random() * total) | 0;
    const x = i % N,
      y = (i / N) | 0;
    const cur = grid[i];
    const proposed = (Math.random() * q) | 0;
    if (proposed === cur) continue;
    const n1 = grid[((x + 1) % N) + y * N];
    const n2 = grid[((x + N - 1) % N) + y * N];
    const n3 = grid[x + ((y + 1) % N) * N];
    const n4 = grid[x + ((y + N - 1) % N) * N];
    const eOld =
      -params.coupling *
      ((n1 === cur ? 1 : 0) +
        (n2 === cur ? 1 : 0) +
        (n3 === cur ? 1 : 0) +
        (n4 === cur ? 1 : 0));
    const eNew =
      -params.coupling *
      ((n1 === proposed ? 1 : 0) +
        (n2 === proposed ? 1 : 0) +
        (n3 === proposed ? 1 : 0) +
        (n4 === proposed ? 1 : 0));
    const dE = eNew - eOld;
    if (
      dE <= 0 ||
      Math.random() < Math.exp(-dE / Math.max(0.01, params.temperature))
    )
      grid[i] = proposed;
  }
}

function tick() {
  step();
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const size = params.cellSize;
  const offsetX = (canvas.width - N * size) / 2;
  const offsetY = (canvas.height - N * size) / 2;
  const q = Math.max(2, params.qStates | 0);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const s = grid[x + y * N];
      const hue = (params.hueStart + (s / q) * params.hueRange) % 360;
      ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
      ctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
    }
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Potts',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'gridSize', 40, 250, 1);
gui.add(params, 'qStates', 2, 20, 1);
gui.add(params, 'temperature', 0.1, 3, 0.01);
gui.add(params, 'cellSize', 1, 12, 1);
gui.add(params, 'sweepRate', 1, 200, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 30, 720, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 20, 80, 1);
gui.add(params, 'coupling', 0, 2, 0.01);
gui.addButton('Random', () => {
  params.qStates = rand(3, 10, 1);
  params.temperature = rand(0.3, 1.5, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(120, 540, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
