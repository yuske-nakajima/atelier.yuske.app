// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// ペアノ曲線：3分割を再帰的に繰り返す空間充填曲線。
// 各正方形を9等分し、特定順序で全セルを訪問する。

const params = {
  order: 4, // 再帰次数（1〜5）
  hueStart: 120, // 開始色相
  hueEnd: 280, // 終了色相
  lineWidth: 1.5, // 線幅
  drawSpeed: 12, // 描画速度（点/フレーム）
  glow: 0.5, // 発光強度
  padding: 0.05, // 余白率
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildCurve();
}
window.addEventListener('resize', resize);

/** @type {{x: number, y: number}[]} */
let points = [];
let drawIdx = 0;

/**
 * ペアノ曲線の点列を再帰的に生成する（L-System 近似）
 * @param {number} x 開始X（グリッド座標）
 * @param {number} y 開始Y（グリッド座標）
 * @param {number} n グリッドサイズ（3^order）
 * @param {number} flipX X反転フラグ
 * @param {number} flipY Y反転フラグ
 * @param {{x:number,y:number}[]} out 出力配列
 */
function peano(x, y, n, flipX, flipY, out) {
  if (n === 1) {
    out.push({ x, y });
    return;
  }
  const m = n / 3;
  // ペアノの9セル訪問順（蛇行パターン）
  const cols = [0, 1, 2, 2, 1, 0, 0, 1, 2];
  const rows = [0, 0, 0, 1, 1, 1, 2, 2, 2];
  for (let i = 0; i < 9; i++) {
    const cx = flipX ? 2 - cols[i] : cols[i];
    const cy = flipY ? 2 - rows[i] : rows[i];
    const nx2 = i % 2 === 0 ? flipX : !flipX;
    const ny2 = Math.floor(i / 3) % 2 === 0 ? flipY : !flipY;
    peano(x + cx * m, y + cy * m, m, nx2, ny2, out);
  }
}

/**
 * ペアノ曲線の点列を構築する
 */
function buildCurve() {
  const order = Math.max(1, Math.min(5, Math.round(params.order)));
  const n = 3 ** order;
  const w = canvas.width;
  const h = canvas.height;
  const size = Math.min(w, h) * (1 - params.padding * 2);
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  const gridPoints = /** @type {{x: number, y: number}[]} */ ([]);
  peano(0, 0, n, false, false, gridPoints);

  const step = size / (n - 1);
  points = gridPoints.map((p) => ({
    x: ox + p.x * step,
    y: oy + p.y * step,
  }));
  drawIdx = 0;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, w, h);
}

buildCurve();

/**
 * 描画進捗に応じた色相を返す
 * @param {number} t 0〜1
 * @returns {string}
 */
function colorAt(t) {
  const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
  return `hsl(${hue}, 80%, 60%)`;
}

function draw() {
  const total = points.length;
  if (drawIdx >= total - 1) {
    drawIdx = 0;
    ctx.fillStyle = '#0b0a07';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const speed = Math.max(1, Math.round(params.drawSpeed));
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';

  for (let i = 0; i < speed && drawIdx < total - 1; i++) {
    const t = drawIdx / (total - 1);
    ctx.strokeStyle = colorAt(t);
    ctx.shadowColor = colorAt(t);
    ctx.shadowBlur = params.glow * 8;

    ctx.beginPath();
    ctx.moveTo(points[drawIdx].x, points[drawIdx].y);
    ctx.lineTo(points[drawIdx + 1].x, points[drawIdx + 1].y);
    ctx.stroke();
    drawIdx++;
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Peano Curve',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'order', 1, 5, 1).onChange(buildCurve);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'lineWidth', 0.5, 5, 0.1);
gui.add(params, 'drawSpeed', 1, 300, 1);
gui.add(params, 'glow', 0, 2, 0.05);

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
  params.order = rand(2, 4, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.lineWidth = rand(0.5, 3, 0.1);
  params.drawSpeed = rand(5, 100, 1);
  params.glow = rand(0, 1.5, 0.05);
  buildCurve();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  buildCurve();
  gui.updateDisplay();
});
