// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 順序付きディザ（Bayer 行列）で 2 色量子化する。
// 行列サイズを 2/4/8 で切り替え、階調とノイズ特性の違いを観察する。

const params = {
  matrix: 4, // Bayer 行列サイズ (2/4/8)
  cell: 3, // セルサイズ
  pattern: 0, // 0:gradient, 1:circular, 2:noise-plasma
  speed: 0.5, // アニメ速度
  threshold: 0.5, // 閾値
  bias: 0, // 明度バイアス
  contrast: 1.2, // コントラスト
  fgHue: 200, // 前景色相
  bgHue: 340, // 背景色相
  fgLight: 80, // 前景明度
  bgLight: 12, // 背景明度
  rotate: 0, // パターン回転
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

const bayer2 = [
  [0, 2],
  [3, 1],
];

/**
 * Bayer 行列を再帰展開する。
 * @param {number[][]} m
 */
function expand(m) {
  const n = m.length;
  const r = Array.from({ length: n * 2 }, () => new Array(n * 2).fill(0));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = m[y][x] * 4;
      r[y][x] = v;
      r[y][x + n] = v + 2;
      r[y + n][x] = v + 3;
      r[y + n][x + n] = v + 1;
    }
  }
  return r;
}

const bayer4 = expand(bayer2);
const bayer8 = expand(bayer4);

/** @param {number} size */
function bayer(size) {
  if (size <= 2) return bayer2;
  if (size <= 4) return bayer4;
  return bayer8;
}

const start = performance.now();

/**
 * 濃淡関数（0..1）。
 * @param {number} x
 * @param {number} y
 * @param {number} t
 */
function field(x, y, t) {
  const a = params.rotate;
  const cx = Math.cos(a) * x - Math.sin(a) * y;
  const cy = Math.sin(a) * x + Math.cos(a) * y;
  if (params.pattern === 0) {
    return 0.5 + 0.5 * Math.sin(cx * 6 + t);
  }
  if (params.pattern === 1) {
    const r = Math.sqrt(cx * cx + cy * cy);
    return 0.5 + 0.5 * Math.sin(r * 14 - t * 2);
  }
  return (
    0.5 +
    0.2 * Math.sin(cx * 8 + t) +
    0.2 * Math.sin(cy * 10 - t * 1.2) +
    0.2 * Math.sin((cx + cy) * 6 + t * 0.8)
  );
}

function frame() {
  const W = canvas.width;
  const H = canvas.height;
  const cell = Math.max(1, Math.floor(params.cell));
  const cols = Math.floor(W / cell);
  const rows = Math.floor(H / cell);
  const t = ((performance.now() - start) / 1000) * params.speed;
  const M = bayer(Math.floor(params.matrix));
  const n = M.length;
  const max = n * n;

  ctx.fillStyle = `hsl(${params.bgHue}, 60%, ${params.bgLight}%)`;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `hsl(${params.fgHue}, 70%, ${params.fgLight}%)`;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let v = field(x / cols - 0.5, y / rows - 0.5, t);
      v = (v - 0.5) * params.contrast + 0.5 + params.bias;
      const thr = (M[y % n][x % n] + 0.5) / max;
      if (v > thr * (2 * params.threshold)) {
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- GUI ---

const gui = new TileUI({
  title: 'Dithering Studio',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'matrix', 2, 8, 2);
gui.add(params, 'cell', 1, 12, 1);
gui.add(params, 'pattern', 0, 2, 1);
gui.add(params, 'speed', 0, 3, 0.01);
gui.add(params, 'threshold', 0.2, 1, 0.01);
gui.add(params, 'bias', -0.5, 0.5, 0.01);
gui.add(params, 'contrast', 0.3, 3, 0.05);
gui.add(params, 'fgHue', 0, 360, 1);
gui.add(params, 'bgHue', 0, 360, 1);
gui.add(params, 'fgLight', 30, 95, 1);
gui.add(params, 'bgLight', 0, 50, 1);
gui.add(params, 'rotate', -3.14, 3.14, 0.01);

gui.addButton('Random', () => {
  params.matrix = [2, 4, 8][Math.floor(Math.random() * 3)];
  params.pattern = Math.floor(Math.random() * 3);
  params.fgHue = Math.floor(Math.random() * 360);
  params.bgHue = Math.floor(Math.random() * 360);
  params.rotate = -Math.PI + Math.random() * Math.PI * 2;
  params.contrast = 0.5 + Math.random() * 2;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
