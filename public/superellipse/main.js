// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  n: 2.5, // 形状指数 |x|^n + |y|^n = 1
  a: 0.42, // x 半径（画面短辺比）
  b: 0.36, // y 半径
  count: 24, // ネスト数
  scaleStep: 0.9, // ネストごとの縮小率
  rotateStep: 6, // ネストごとの回転（度）
  rotateSpeed: 0.15, // 回転速度
  morphSpeed: 0.3, // 形状モーフ速度
  morphAmp: 0.8, // 形状モーフ振幅
  hue: 280, // 色相
  hueShift: 8, // ネストごとの色相シフト
  lineWidth: 1.4, // 線の太さ
  glow: 6, // グロー
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

let time = 0;

function step() {
  time += 1 / 60;
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, w, h);
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;

  const baseR = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const n = Math.max(
    0.3,
    params.n + Math.sin(time * params.morphSpeed) * params.morphAmp,
  );

  for (let i = 0; i < params.count; i++) {
    const scale = params.scaleStep ** i;
    const rot =
      time * params.rotateSpeed + (i * params.rotateStep * Math.PI) / 180;
    const hue = (params.hue + i * params.hueShift) % 360;
    const stroke = `hsl(${hue}, 85%, 65%)`;
    ctx.strokeStyle = stroke;
    ctx.shadowColor = stroke;

    ctx.beginPath();
    const segs = 240;
    for (let k = 0; k <= segs; k++) {
      const t = (k / segs) * Math.PI * 2;
      const ct = Math.cos(t);
      const st = Math.sin(t);
      const x =
        Math.sign(ct) * Math.abs(ct) ** (2 / n) * params.a * baseR * scale;
      const y =
        Math.sign(st) * Math.abs(st) ** (2 / n) * params.b * baseR * scale;
      const xr = x * Math.cos(rot) - y * Math.sin(rot);
      const yr = x * Math.sin(rot) + y * Math.cos(rot);
      if (k === 0) ctx.moveTo(cx + xr, cy + yr);
      else ctx.lineTo(cx + xr, cy + yr);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function tick() {
  step();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Superellipse',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'n', 0.3, 8, 0.05);
gui.add(params, 'a', 0.1, 0.49, 0.01);
gui.add(params, 'b', 0.1, 0.49, 0.01);
gui.add(params, 'count', 1, 60, 1);
gui.add(params, 'scaleStep', 0.5, 0.99, 0.005);
gui.add(params, 'rotateStep', -30, 30, 0.5);
gui.add(params, 'rotateSpeed', -2, 2, 0.01);
gui.add(params, 'morphSpeed', 0, 2, 0.01);
gui.add(params, 'morphAmp', 0, 3, 0.05);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueShift', 0, 40, 0.5);
gui.add(params, 'lineWidth', 0.3, 5, 0.05);
gui.add(params, 'glow', 0, 20, 0.5);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.n = rand(0.6, 5, 0.05);
  params.a = rand(0.25, 0.45, 0.01);
  params.b = rand(0.25, 0.45, 0.01);
  params.count = rand(12, 40, 1);
  params.scaleStep = rand(0.82, 0.96, 0.005);
  params.rotateStep = rand(-15, 15, 0.5);
  params.rotateSpeed = rand(-1, 1, 0.01);
  params.morphAmp = rand(0, 1.6, 0.05);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0, 20, 0.5);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
