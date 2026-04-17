// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Sacks スパイラル: r=√n, θ=2π(√n - ⌊√n⌋)
const params = {
  count: 5000,
  scale: 9,
  dotRadius: 2,
  primeOnly: true,
  hue: 290,
  hueByValue: 0.05,
  saturation: 75,
  lightness: 60,
  alpha: 0.95,
  rotation: 0,
  glow: 4,
  bg: 8,
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
  const N = Math.max(100, Math.min(60000, params.count | 0));
  const isComp = sieve(N);
  const rot = (params.rotation * Math.PI) / 180;
  for (let n = 1; n <= N; n++) {
    const isPrime = !isComp[n];
    if (params.primeOnly && !isPrime) continue;
    const sq = Math.sqrt(n);
    const r = sq * params.scale;
    const theta = Math.PI * 2 * (sq - Math.floor(sq)) + rot;
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    const hue = (params.hue + n * params.hueByValue) % 360;
    ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${isPrime ? params.lightness : params.lightness - 25}%, ${params.alpha})`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, params.dotRadius, 0, Math.PI * 2);
    ctx.fill();
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
  title: 'Sacks Spiral',
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
gui.add(params, 'count', 100, 40000, 100).onChange(onChange);
gui.add(params, 'scale', 2, 40, 0.5).onChange(onChange);
gui.add(params, 'dotRadius', 0.5, 8, 0.1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueByValue', 0, 1, 0.005).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.2, 1, 0.01).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'primeOnly').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.count = rand(2000, 30000, 100);
  params.scale = rand(5, 20, 0.5);
  params.hue = rand(0, 360, 1);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotation = rand(0, 360, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
