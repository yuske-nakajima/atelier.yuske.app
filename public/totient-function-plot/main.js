// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// オイラーのトーシェント関数 φ(n) をプロット
const params = {
  nMax: 2000,
  dotRadius: 1.8,
  hue: 160,
  hueByRatio: 200,
  saturation: 75,
  lightness: 60,
  alpha: 0.85,
  padding: 60,
  glow: 3,
  ratioMode: false,
  connect: false,
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

function totientArray(n) {
  const phi = new Uint32Array(n + 1);
  for (let i = 0; i <= n; i++) phi[i] = i;
  for (let i = 2; i <= n; i++) {
    if (phi[i] === i) {
      for (let j = i; j <= n; j += i) phi[j] -= phi[j] / i;
    }
  }
  return phi;
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const pad = params.padding;
  const W = canvas.width - pad * 2;
  const H = canvas.height - pad * 2;
  const N = Math.max(50, Math.min(5000, params.nMax | 0));
  const phi = totientArray(N);
  const yMax = params.ratioMode ? 1 : N;
  ctx.lineWidth = 1;
  if (params.connect) ctx.beginPath();
  for (let n = 1; n <= N; n++) {
    const val = params.ratioMode ? phi[n] / n : phi[n];
    const x = pad + ((n - 1) / (N - 1)) * W;
    const y = pad + H - (val / yMax) * H;
    const hue = (params.hue + (phi[n] / n) * params.hueByRatio) % 360;
    const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    if (params.connect) {
      if (n === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      ctx.strokeStyle = color;
    } else {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.beginPath();
      ctx.arc(x, y, params.dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (params.connect) ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(pad, pad, W, H);
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
  title: 'Totient Function Plot',
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
gui.add(params, 'nMax', 50, 5000, 50).onChange(onChange);
gui.add(params, 'dotRadius', 0.5, 5, 0.1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueByRatio', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.2, 1, 0.01).onChange(onChange);
gui.add(params, 'padding', 20, 150, 1).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'ratioMode').onChange(onChange);
gui.add(params, 'connect').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.nMax = rand(500, 3000, 50);
  params.hue = rand(0, 360, 1);
  params.hueByRatio = rand(50, 300, 1);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.ratioMode = Math.random() > 0.5;
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
