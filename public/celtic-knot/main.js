// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// ケルト結び目模様：交差する帯が上下に交互に組み合わさるパターン。
// グリッドベースで交差点を生成し、スプライン曲線で結ぶ。

const params = {
  gridSize: 5, // グリッド分割数
  strandWidth: 12, // 帯の幅
  gapWidth: 4, // 交差部のギャップ
  hueStrand1: 30, // 帯1の色相（金色）
  hueStrand2: 200, // 帯2の色相（青）
  saturation: 70, // 彩度
  lightness: 55, // 明度
  bgHue: 30, // 背景色相
  bgSat: 40, // 背景彩度
  bgLight: 8, // 背景明度
  animSpeed: 0.3, // アニメーション速度
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

/**
 * 1本のストランドセグメント（曲線帯）を描く
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} color
 * @param {number} width
 */
function drawStrand(x1, y1, x2, y2, color, width) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/**
 * 交差点を描く（上下の帯を表現）
 * @param {number} cx
 * @param {number} cy
 * @param {number} cellSize
 * @param {boolean} overH 水平が上か
 */
function drawCrossing(cx, cy, cellSize, overH) {
  const h = params.strandWidth;
  const gap = params.gapWidth;
  const c1 = `hsl(${params.hueStrand1}, ${params.saturation}%, ${params.lightness}%)`;
  const c2 = `hsl(${params.hueStrand2}, ${params.saturation}%, ${params.lightness}%)`;
  const shadow = `hsl(${params.bgHue}, ${params.bgSat}%, ${params.bgLight}%)`;

  const half = cellSize / 2;

  if (overH) {
    // 垂直ストランドを先に描く（下）
    drawStrand(cx, cy - half, cx, cy + half, c2, h);
    // 水平ストランドのギャップ部分（影で隠す）
    drawStrand(cx - half, cy, cx + half, cy, shadow, h + gap * 2);
    // 水平ストランドを上に描く
    drawStrand(cx - half, cy, cx + half, cy, c1, h);
  } else {
    drawStrand(cx - half, cy, cx + half, cy, c1, h);
    drawStrand(cx, cy - half, cx, cy + half, shadow, h + gap * 2);
    drawStrand(cx, cy - half, cx, cy + half, c2, h);
  }
}

function draw() {
  time += params.animSpeed * 0.01;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `hsl(${params.bgHue}, ${params.bgSat}%, ${params.bgLight}%)`;
  ctx.fillRect(0, 0, w, h);

  const n = Math.max(2, Math.round(params.gridSize));
  const size = Math.min(w, h) * 0.85;
  const cellSize = size / n;
  const ox = (w - size) / 2 + cellSize / 2;
  const oy = (h - size) / 2 + cellSize / 2;

  // ストランドの直線部分を先に描く
  const c1 = `hsl(${params.hueStrand1}, ${params.saturation}%, ${params.lightness}%)`;
  const c2 = `hsl(${params.hueStrand2}, ${params.saturation}%, ${params.lightness}%)`;
  const sw = params.strandWidth;

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const cx = ox + col * cellSize;
      const cy = oy + row * cellSize;
      // 水平ストランド
      if (col < n - 1) {
        drawStrand(cx, cy, cx + cellSize, cy, c1, sw);
      }
      // 垂直ストランド
      if (row < n - 1) {
        drawStrand(cx, cy, cx, cy + cellSize, c2, sw);
      }
    }
  }

  // 交差点を描く（アニメーション付き）
  for (let row = 0; row < n - 1; row++) {
    for (let col = 0; col < n - 1; col++) {
      const cx = ox + col * cellSize + cellSize / 2;
      const cy = oy + row * cellSize + cellSize / 2;
      const overH = (row + col + Math.floor(time)) % 2 === 0;
      drawCrossing(cx, cy, cellSize, overH);
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Celtic Knot',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'gridSize', 2, 12, 1);
gui.add(params, 'strandWidth', 4, 30, 1);
gui.add(params, 'gapWidth', 1, 12, 1);
gui.add(params, 'hueStrand1', 0, 360, 1);
gui.add(params, 'hueStrand2', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 20, 90, 1);
gui.add(params, 'animSpeed', 0, 3, 0.05);

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
  params.gridSize = rand(3, 10, 1);
  params.strandWidth = rand(6, 22, 1);
  params.gapWidth = rand(2, 8, 1);
  params.hueStrand1 = rand(0, 360, 1);
  params.hueStrand2 = rand(0, 360, 1);
  params.saturation = rand(40, 90, 1);
  params.lightness = rand(35, 75, 1);
  params.animSpeed = rand(0.1, 2, 0.05);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
