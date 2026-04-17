// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 物理モデル合成の Karplus-Strong を可視化（音は出さず、弦の波形アニメーション）
const params = {
  strings: 6, // 弦の本数
  length: 600, // 弦の長さ（ドット数）
  damping: 0.993, // 減衰
  pluckInterval: 0.7,
  pluckStrength: 0.9,
  stringGap: 60,
  hueStart: 20,
  hueRange: 300,
  amplitude: 35,
  strokeAlpha: 0.9,
  lineWidth: 1.6,
  trailFade: 0.08,
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

/** @type {Float32Array[]} */
let strings = [];

function rebuild() {
  const n = Math.round(params.strings);
  const L = Math.round(params.length);
  strings = [];
  for (let i = 0; i < n; i++) {
    strings.push(new Float32Array(L));
  }
}
rebuild();

/**
 * 弦を撥弦（ランダム振動で初期化）
 * @param {number} i
 */
function pluck(i) {
  const buf = strings[i];
  if (!buf) return;
  for (let k = 0; k < buf.length; k++) {
    buf[k] = (Math.random() * 2 - 1) * params.pluckStrength;
  }
}

let time = 0;
let lastPluck = 0;

function step() {
  // Karplus-Strong: buf[k] = damping * (buf[k] + buf[k-1]) / 2
  for (const buf of strings) {
    const L = buf.length;
    let prev = buf[L - 1];
    for (let k = 0; k < L; k++) {
      const cur = buf[k];
      buf[k] = params.damping * ((cur + prev) / 2);
      prev = cur;
    }
  }
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (time - lastPluck > params.pluckInterval) {
    lastPluck = time;
    const i = Math.floor(Math.random() * strings.length);
    pluck(i);
  }

  for (let iter = 0; iter < 4; iter++) step();

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const n = strings.length;
  const totalH = (n - 1) * params.stringGap;
  const startY = cy - totalH / 2;
  for (let i = 0; i < n; i++) {
    const y0 = startY + i * params.stringGap;
    const hue = params.hueStart + (i / Math.max(1, n - 1)) * params.hueRange;
    const buf = strings[i];
    const L = buf.length;
    const w = Math.min(canvas.width - 80, L);
    const x0 = cx - w / 2;
    ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${params.strokeAlpha})`;
    ctx.lineWidth = params.lineWidth;
    ctx.beginPath();
    for (let k = 0; k < L; k += 2) {
      const sx = x0 + (k / L) * w;
      const sy = y0 + buf[k] * params.amplitude;
      if (k === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    // 両端のピン
    ctx.fillStyle = `hsla(${hue}, 90%, 70%, 0.9)`;
    ctx.beginPath();
    ctx.arc(x0, y0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x0 + w, y0, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Karplus-Strong Strings',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'strings', 1, 10, 1);
gui.add(params, 'length', 100, 1000, 10);
gui.add(params, 'damping', 0.9, 0.999, 0.001);
gui.add(params, 'pluckInterval', 0.1, 3, 0.05);
gui.add(params, 'pluckStrength', 0.2, 1.5, 0.05);
gui.add(params, 'stringGap', 20, 120, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'amplitude', 5, 80, 1);
gui.add(params, 'strokeAlpha', 0.2, 1, 0.01);
gui.add(params, 'lineWidth', 0.5, 4, 0.1);
gui.add(params, 'trailFade', 0.02, 0.3, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Pluck', () => {
  for (let i = 0; i < strings.length; i++) pluck(i);
});
gui.addButton('Random', () => {
  params.strings = rand(3, 8, 1);
  params.damping = rand(0.985, 0.998, 0.001);
  params.pluckInterval = rand(0.3, 1.2, 0.05);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  rebuild();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuild();
  gui.updateDisplay();
});
