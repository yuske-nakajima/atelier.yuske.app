// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  gridSize: 140,
  cellSize: 4,
  innerR: 4,
  outerR: 12,
  b1: 0.278,
  b2: 0.365,
  d1: 0.267,
  d2: 0.445,
  alpha: 0.05,
  hueShift: 180,
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
let iKernel,
  oKernel,
  iSum = 0,
  oSum = 0,
  R = 0;
function buildKernels() {
  const rOut = params.outerR | 0;
  R = rOut;
  const rIn = params.innerR | 0;
  const size = (2 * R + 1) * (2 * R + 1);
  iKernel = new Float32Array(size);
  oKernel = new Float32Array(size);
  iSum = 0;
  oSum = 0;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const r = Math.sqrt(dx * dx + dy * dy);
      const idx = (dy + R) * (2 * R + 1) + (dx + R);
      if (r <= rIn) {
        iKernel[idx] = 1;
        iSum += 1;
      } else if (r <= rOut) {
        oKernel[idx] = 1;
        oSum += 1;
      }
    }
  }
}
function sigmoid(x, a, b) {
  return 1 / (1 + Math.exp((-4 / b) * (x - a)));
}
function reseed() {
  N = Math.max(30, params.gridSize | 0);
  grid = new Float32Array(N * N);
  buf = new Float32Array(N * N);
  buildKernels();
  // SmoothLife はセル単位のランダムノイズだと平均値が birth 範囲に届かず即消滅する。
  // outerR 程度のランダムな円形ブロブを複数配置して種にする。
  const blobCount = Math.max(
    8,
    Math.floor(((N * N) / (R * R * Math.PI)) * 0.6),
  );
  for (let i = 0; i < blobCount; i++) {
    const cx = Math.random() * N;
    const cy = Math.random() * N;
    // outerR より大きいブロブは中心が過密死するため innerR 程度に抑える。
    const rr = Math.max(2, params.innerR * (0.6 + Math.random() * 1.2));
    const rr2 = rr * rr;
    const y0 = Math.floor(cy - rr);
    const y1 = Math.ceil(cy + rr);
    const x0 = Math.floor(cx - rr);
    const x1 = Math.ceil(cx + rr);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > rr2) continue;
        const nx = ((x % N) + N) % N;
        const ny = ((y % N) + N) % N;
        grid[nx + ny * N] = 0.6 + Math.random() * 0.4;
      }
    }
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function step() {
  const W = 2 * R + 1;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let m = 0,
        n = 0;
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const k = (dy + R) * W + (dx + R);
          if (iKernel[k] === 0 && oKernel[k] === 0) continue;
          const nx = (x + dx + N) % N,
            ny = (y + dy + N) % N;
          const v = grid[nx + ny * N];
          if (iKernel[k]) m += v;
          else n += v;
        }
      }
      m /= iSum;
      n /= oSum;
      const alive = sigmoid(m, 0.5, params.alpha);
      const s =
        sigmoid(n, params.b1, params.alpha) *
        (1 - sigmoid(n, params.b2, params.alpha));
      const d =
        sigmoid(n, params.d1, params.alpha) *
        (1 - sigmoid(n, params.d2, params.alpha));
      const newVal = (1 - alive) * s + alive * d;
      buf[x + y * N] = Math.max(0, Math.min(1, newVal));
    }
  }
  [grid, buf] = [buf, grid];
}

function draw() {
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const size = params.cellSize;
  const ox = (canvas.width - N * size) / 2;
  const oy = (canvas.height - N * size) / 2;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = grid[x + y * N];
      if (v < 0.02) continue;
      const hue = (params.hueShift + v * 120) % 360;
      ctx.fillStyle = `hsla(${hue}, 80%, ${20 + v * 60}%, 1)`;
      ctx.fillRect(ox + x * size, oy + y * size, size, size);
    }
  }
}

function tick() {
  draw();
  step();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'SmoothLife',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'gridSize', 40, 180, 1);
gui.add(params, 'cellSize', 2, 10, 1);
gui.add(params, 'innerR', 2, 10, 1);
gui.add(params, 'outerR', 6, 20, 1);
gui.add(params, 'b1', 0.1, 0.5, 0.001);
gui.add(params, 'b2', 0.1, 0.6, 0.001);
gui.add(params, 'd1', 0.1, 0.5, 0.001);
gui.add(params, 'd2', 0.2, 0.7, 0.001);
gui.add(params, 'alpha', 0.01, 0.3, 0.01);
gui.add(params, 'hueShift', 0, 360, 1);
gui.addButton('Random', () => {
  params.b1 = rand(0.2, 0.35, 0.001);
  params.b2 = rand(0.3, 0.45, 0.001);
  params.d1 = rand(0.2, 0.3, 0.001);
  params.d2 = rand(0.4, 0.55, 0.001);
  params.hueShift = rand(0, 360, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
