// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Goldbach コメット: 偶数 n を 2 素数の和で表す方法数 g(n) をプロット
const params = {
  nMax: 2000,
  dotRadius: 1.5,
  hue: 45,
  hueByValue: 0.3,
  saturation: 75,
  lightness: 60,
  alpha: 0.85,
  padding: 60,
  glow: 3,
  xLog: false,
  yScale: 1,
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

function goldbach(nMax) {
  const isComp = sieve(nMax);
  const counts = [];
  let maxG = 1;
  for (let n = 4; n <= nMax; n += 2) {
    let g = 0;
    for (let p = 2; p <= n / 2; p++) {
      if (!isComp[p] && !isComp[n - p]) g++;
    }
    counts.push([n, g]);
    if (g > maxG) maxG = g;
  }
  return { counts, maxG };
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const pad = params.padding;
  const W = canvas.width - pad * 2;
  const H = canvas.height - pad * 2;
  const nMax = Math.max(20, Math.min(5000, params.nMax | 0));
  const { counts, maxG } = goldbach(nMax);
  const xRange = params.xLog ? Math.log(nMax) - Math.log(4) : nMax - 4;
  for (const [n, g] of counts) {
    const t = params.xLog
      ? (Math.log(n) - Math.log(4)) / xRange
      : (n - 4) / xRange;
    const x = pad + t * W;
    const y = pad + H - (g / maxG) * H * params.yScale;
    const hue = (params.hue + g * params.hueByValue * 10) % 360;
    ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, params.dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }
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
  title: 'Goldbach Comet',
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
gui.add(params, 'nMax', 100, 5000, 50).onChange(onChange);
gui.add(params, 'dotRadius', 0.5, 5, 0.1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueByValue', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.2, 1, 0.01).onChange(onChange);
gui.add(params, 'padding', 20, 150, 1).onChange(onChange);
gui.add(params, 'yScale', 0.3, 2, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'xLog').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.nMax = rand(500, 3000, 50);
  params.hue = rand(0, 360, 1);
  params.hueByValue = rand(0.05, 0.6, 0.01);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.xLog = Math.random() > 0.5;
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
