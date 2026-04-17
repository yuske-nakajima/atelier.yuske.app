// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Ulam スパイラル: 自然数を螺旋状に並べ素数をマーク
const params = {
  cellSize: 8,
  dotRadius: 3,
  hue: 210,
  hueByValue: 0.08,
  saturation: 75,
  lightness: 60,
  primeOnly: true,
  bg: 8,
  glow: 3,
  alpha: 0.95,
  count: 5000,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
let dirty = true;
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  dirty = true;
}
addEventListener('resize', resize);

function sieve(n) {
  const s = new Uint8Array(n + 1);
  s[0] = s[1] = 1;
  for (let i = 2; i * i <= n; i++)
    if (!s[i]) for (let j = i * i; j <= n; j += i) s[j] = 1;
  return s;
}

function draw() {
  ctx.fillStyle = `rgb(${params.bg},${params.bg},${params.bg + 4})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const cell = Math.max(2, params.cellSize);
  const N = Math.max(100, Math.min(80000, params.count | 0));
  const isComp = sieve(N);
  // Ulam スパイラル座標
  let x = 0;
  let y = 0;
  let dx = 0;
  let dy = -1;
  const range = Math.ceil(Math.sqrt(N)) + 1;
  for (let i = 1; i <= N; i++) {
    const px = cx + x * cell;
    const py = cy + y * cell;
    if (
      px > -cell &&
      px < canvas.width + cell &&
      py > -cell &&
      py < canvas.height + cell
    ) {
      const isPrime = !isComp[i];
      if (!params.primeOnly || isPrime) {
        const hue = (params.hue + i * params.hueByValue) % 360;
        ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${isPrime ? params.lightness : params.lightness - 30}%, ${params.alpha})`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(px, py, params.dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 螺旋遷移
    if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
      const t = dx;
      dx = -dy;
      dy = t;
    }
    x += dx;
    y += dy;
    if (Math.abs(x) > range || Math.abs(y) > range) break;
  }
  ctx.shadowBlur = 0;
}

function tick() {
  if (dirty) {
    draw();
    dirty = false;
  }
  requestAnimationFrame(tick);
}
resize();
tick();

const gui = new TileUI({
  title: 'Ulam Spiral',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
function onChange() {
  dirty = true;
}
gui.add(params, 'cellSize', 2, 20, 0.5).onChange(onChange);
gui.add(params, 'dotRadius', 0.5, 10, 0.1).onChange(onChange);
gui.add(params, 'count', 100, 40000, 100).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueByValue', 0, 1, 0.005).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.2, 1, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'primeOnly').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.cellSize = rand(4, 12, 0.5);
  params.count = rand(1000, 20000, 100);
  params.hue = rand(0, 360, 1);
  params.hueByValue = rand(0, 0.5, 0.005);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
