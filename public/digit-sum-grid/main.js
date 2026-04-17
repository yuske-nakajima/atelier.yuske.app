// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// グリッドの各セルを「行番号 × cols + 列番号 + offset」の桁和で色分け。
// base（基数）や演算子で、さまざまな数論的パターンが浮かび上がる。

const params = {
  cols: 60, // グリッド列数
  base: 10, // 基数
  offset: 0, // 開始値オフセット
  op: 0, // 0:digitSum, 1:digitalRoot, 2:xor(row,col)
  modBy: 9, // mod（色分け）
  hueShift: 0, // 色相シフト
  saturation: 75,
  lightness: 55,
  padding: 1, // セル間隔
  animSpeed: 0.2, // オフセットアニメ速度
  shape: 0, // 0:正方形, 1:円
  bg: 8,
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

const start = performance.now();

/**
 * 桁和 in base b
 * @param {number} n
 * @param {number} b
 */
function digitSum(n, b) {
  let s = 0;
  let x = Math.abs(n);
  while (x > 0) {
    s += x % b;
    x = Math.floor(x / b);
  }
  return s;
}

/**
 * デジタルルート
 * @param {number} n
 * @param {number} b
 */
function digitalRoot(n, b) {
  let x = Math.abs(n);
  while (x >= b) x = digitSum(x, b);
  return x;
}

function render() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, W, H);

  const cols = Math.max(4, Math.floor(params.cols));
  const cell = Math.min(W, H) / cols;
  const rows = Math.ceil(H / cell);
  const base = Math.max(2, Math.floor(params.base));
  const mod = Math.max(2, Math.floor(params.modBy));
  const tOffset = Math.floor(
    ((performance.now() - start) / 1000) * params.animSpeed * 100,
  );
  const xOff = (W - cols * cell) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const n = r * cols + c + Math.floor(params.offset) + tOffset;
      let val;
      if (params.op === 0) val = digitSum(n, base);
      else if (params.op === 1) val = digitalRoot(n, base);
      else val = r ^ c;
      const hue = (params.hueShift + (val % mod) * (360 / mod)) % 360;
      ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
      const x = xOff + c * cell;
      const y = r * cell;
      const size = cell - params.padding;
      if (params.shape >= 0.5) {
        ctx.beginPath();
        ctx.arc(x + cell / 2, y + cell / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, size, size);
      }
    }
  }
}

function loop() {
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- GUI ---

const gui = new TileUI({
  title: 'Digit Sum Grid',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'cols', 10, 200, 1);
gui.add(params, 'base', 2, 16, 1);
gui.add(params, 'offset', 0, 10000, 1);
gui.add(params, 'op', 0, 2, 1);
gui.add(params, 'modBy', 2, 36, 1);
gui.add(params, 'hueShift', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 20, 90, 1);
gui.add(params, 'padding', 0, 4, 0.5);
gui.add(params, 'animSpeed', 0, 5, 0.05);
gui.add(params, 'shape', 0, 1, 1);
gui.add(params, 'bg', 0, 20, 1);

gui.addButton('Random', () => {
  params.cols = 20 + Math.floor(Math.random() * 140);
  params.base = 2 + Math.floor(Math.random() * 14);
  params.op = Math.floor(Math.random() * 3);
  params.modBy = 3 + Math.floor(Math.random() * 20);
  params.hueShift = Math.floor(Math.random() * 360);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
