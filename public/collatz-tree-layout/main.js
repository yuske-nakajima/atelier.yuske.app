// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Collatz 逆木レイアウト: 奇数は右回り、偶数は左回りに回転しながら伸ばす
const params = {
  nMax: 5000,
  stepLen: 6,
  oddTurn: 8,
  evenTurn: -16,
  lineWidth: 0.8,
  hue: 120,
  hueByLen: 0.3,
  saturation: 70,
  lightness: 55,
  alpha: 0.7,
  originY: 0.85,
  rotation: -90,
  glow: 2,
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

function collatzSeq(n) {
  const s = [n];
  while (n !== 1 && s.length < 2000) {
    n = n % 2 === 0 ? n / 2 : 3 * n + 1;
    s.push(n);
  }
  return s;
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const cx = canvas.width / 2;
  const cy = canvas.height * params.originY;
  const baseRot = (params.rotation * Math.PI) / 180;
  const odd = (params.oddTurn * Math.PI) / 180;
  const even = (params.evenTurn * Math.PI) / 180;
  const N = Math.max(20, Math.min(20000, params.nMax | 0));
  ctx.lineWidth = params.lineWidth;
  for (let n = 2; n <= N; n++) {
    const seq = collatzSeq(n).reverse(); // 1 → n
    let x = cx;
    let y = cy;
    let a = baseRot;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 1; i < seq.length; i++) {
      const v = seq[i - 1];
      a += v % 2 === 0 ? even : odd;
      x += Math.cos(a) * params.stepLen;
      y += Math.sin(a) * params.stepLen;
      ctx.lineTo(x, y);
    }
    const hue = (params.hue + seq.length * params.hueByLen * 5) % 360;
    const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.stroke();
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
  title: 'Collatz Tree Layout',
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
gui.add(params, 'nMax', 50, 10000, 50).onChange(onChange);
gui.add(params, 'stepLen', 1, 20, 0.5).onChange(onChange);
gui.add(params, 'oddTurn', -30, 30, 0.1).onChange(onChange);
gui.add(params, 'evenTurn', -30, 30, 0.1).onChange(onChange);
gui.add(params, 'lineWidth', 0.1, 3, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueByLen', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'rotation', -180, 180, 1).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.nMax = rand(1000, 8000, 50);
  params.oddTurn = rand(4, 16, 0.1);
  params.evenTurn = rand(-24, -6, 0.1);
  params.stepLen = rand(3, 10, 0.5);
  params.hue = rand(0, 360, 1);
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
