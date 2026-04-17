// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// Pi Walk: π の各桁 d(0..9) を方向ベクトルに変換してランダムウォークを描く。
// Spigot 法（Rabinowitz-Wagon）で π の桁を計算する。

const params = {
  digitCount: 4000, // 使用する桁数
  stepLength: 2, // 1 ステップの長さ
  directionMode: 0, // 0: 10方向, 1: 8方向(mod 8), 2: 4方向(mod 4)
  lineWidth: 1.2, // 線の太さ
  hueBase: 200, // 色相
  hueShift: 0.05, // 桁ごとの色相変化
  saturation: 70, // 彩度
  lightness: 65, // 明度
  alpha: 0.6, // 透明度
  bg: 6, // 背景明度
  zoom: 1.0, // 拡大率
  offsetX: 0.5, // 開始位置 x
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}
window.addEventListener('resize', resize);

/**
 * π の桁を Rabinowitz-Wagon Spigot Algorithm で生成する。
 * @param {number} n
 */
function piDigits(n) {
  // 近似: n 桁を得るために 10*n/3 + 16 の長さの配列を用意する必要がある
  const len = Math.floor((10 * n) / 3) + 16;
  const a = new Array(len).fill(2);
  const digits = /** @type {number[]} */ ([]);
  let predigit = 0;
  let nines = 0;
  for (let j = 0; j < n; j++) {
    let q = 0;
    for (let i = len - 1; i >= 0; i--) {
      const x = 10 * a[i] + q * (i + 1);
      a[i] = x % (2 * (i + 1) + 1);
      q = Math.floor(x / (2 * (i + 1) + 1));
    }
    a[0] = q % 10;
    q = Math.floor(q / 10);
    if (q === 9) {
      nines++;
    } else if (q === 10) {
      digits.push(predigit + 1);
      for (let k = 0; k < nines; k++) digits.push(0);
      predigit = 0;
      nines = 0;
    } else {
      digits.push(predigit);
      for (let k = 0; k < nines; k++) digits.push(9);
      predigit = q;
      nines = 0;
    }
  }
  digits.push(predigit);
  // 先頭の 0（初回の "predigit=0" によるダミー）は除外
  return digits.slice(1);
}

/** @type {number[]} */
let cachedDigits = [];
let cachedCount = 0;

function ensureDigits() {
  const need = Math.floor(params.digitCount);
  if (need > cachedCount) {
    cachedDigits = piDigits(need + 10);
    cachedCount = cachedDigits.length;
  }
}

function draw() {
  ensureDigits();
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);

  const dirN =
    params.directionMode === 0 ? 10 : params.directionMode === 1 ? 8 : 4;
  const step = params.stepLength * params.zoom;
  let x = w * params.offsetX;
  let y = h / 2;

  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';

  const count = Math.min(cachedCount, Math.floor(params.digitCount));
  for (let i = 0; i < count; i++) {
    const d = cachedDigits[i] % dirN;
    const ang = (d / dirN) * Math.PI * 2;
    const nx = x + Math.cos(ang) * step;
    const ny = y + Math.sin(ang) * step;
    const hue = (params.hueBase + i * params.hueShift) % 360;
    ctx.strokeStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    x = nx;
    y = ny;
  }
}
resize();

// --- GUI ---

const gui = new TileUI({
  title: 'Pi Walk',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'digitCount', 200, 8000, 50).onChange(draw);
gui.add(params, 'stepLength', 0.5, 8, 0.1).onChange(draw);
gui.add(params, 'directionMode', 0, 2, 1).onChange(draw);
gui.add(params, 'lineWidth', 0.3, 4, 0.1).onChange(draw);
gui.add(params, 'hueBase', 0, 360, 1).onChange(draw);
gui.add(params, 'hueShift', 0, 1, 0.01).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 20, 90, 1).onChange(draw);
gui.add(params, 'alpha', 0.05, 1, 0.01).onChange(draw);
gui.add(params, 'zoom', 0.2, 3, 0.05).onChange(draw);
gui.add(params, 'offsetX', 0.1, 0.9, 0.01).onChange(draw);
gui.add(params, 'bg', 0, 20, 1).onChange(draw);

gui.addButton('Random', () => {
  params.directionMode = Math.floor(Math.random() * 3);
  params.hueBase = Math.floor(Math.random() * 360);
  params.hueShift = Math.random() * 0.3;
  params.zoom = 0.5 + Math.random() * 2;
  gui.updateDisplay();
  draw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
