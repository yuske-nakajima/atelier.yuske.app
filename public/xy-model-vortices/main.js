// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  gridSize: 80,
  temperature: 0.9,
  cellSize: 8,
  sweepRate: 20,
  hueShift: 0,
  saturation: 80,
  showArrows: 1,
  coupling: 1.0,
  arrowLen: 0.8,
  bg: 0.05,
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
  N = Math.max(10, params.gridSize | 0);
  grid = new Float32Array(N * N);
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random() * Math.PI * 2;
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function step() {
  const total = N * N;
  const sweeps = params.sweepRate | 0;
  for (let k = 0; k < (sweeps * total) / 10; k++) {
    const i = (Math.random() * total) | 0;
    const x = i % N,
      y = (i / N) | 0;
    const cur = grid[i];
    const proposed = cur + (Math.random() - 0.5) * Math.PI;
    const n1 = grid[((x + 1) % N) + y * N];
    const n2 = grid[((x + N - 1) % N) + y * N];
    const n3 = grid[x + ((y + 1) % N) * N];
    const n4 = grid[x + ((y + N - 1) % N) * N];
    const eOld =
      -params.coupling *
      (Math.cos(cur - n1) +
        Math.cos(cur - n2) +
        Math.cos(cur - n3) +
        Math.cos(cur - n4));
    const eNew =
      -params.coupling *
      (Math.cos(proposed - n1) +
        Math.cos(proposed - n2) +
        Math.cos(proposed - n3) +
        Math.cos(proposed - n4));
    const dE = eNew - eOld;
    if (
      dE <= 0 ||
      Math.random() < Math.exp(-dE / Math.max(0.01, params.temperature))
    ) {
      grid[i] = proposed;
    }
  }
}

function tick() {
  step();
  ctx.fillStyle = `rgba(11,10,7,${params.bg + 0.95})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const size = params.cellSize;
  const offsetX = (canvas.width - N * size) / 2;
  const offsetY = (canvas.height - N * size) / 2;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const t = grid[x + y * N];
      const hue = ((t / (Math.PI * 2)) * 360 + params.hueShift) % 360;
      ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, 55%, 1)`;
      ctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
      if (params.showArrows && size > 5) {
        const cx = offsetX + (x + 0.5) * size;
        const cy = offsetY + (y + 0.5) * size;
        const L = (size / 2) * params.arrowLen;
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(t) * L, cy + Math.sin(t) * L);
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'XY Vortices',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'gridSize', 20, 150, 1);
gui.add(params, 'temperature', 0.05, 3, 0.01);
gui.add(params, 'cellSize', 2, 20, 1);
gui.add(params, 'sweepRate', 1, 80, 1);
gui.add(params, 'hueShift', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'showArrows', 0, 1, 1);
gui.add(params, 'coupling', -2, 2, 0.01);
gui.add(params, 'arrowLen', 0.1, 1.5, 0.01);
gui.add(params, 'bg', 0, 0.1, 0.01);
gui.addButton('Random', () => {
  params.temperature = rand(0.3, 2, 0.01);
  params.hueShift = rand(0, 360, 1);
  params.coupling = rand(0.5, 1.5, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
