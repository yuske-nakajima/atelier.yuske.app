// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// ヒルベルト曲線：空間充填曲線。
// 再帰的に四角形を細分化し、一筆書きで全点を通る曲線を描く。

const params = {
  order: 6, // 再帰次数（1〜8）
  hueStart: 240, // 開始色相
  hueEnd: 360, // 終了色相
  lineWidth: 1.5, // 線幅
  drawSpeed: 8, // 描画速度（点/フレーム）
  padding: 0.05, // 余白率
  glow: 0.4, // 発光強度
  bgAlpha: 0.03, // 背景フェード
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
 * (d, n) からヒルベルト曲線の (x, y) 座標を求める
 * @param {number} n グリッドサイズ
 * @param {number} d 距離
 * @returns {{x: number, y: number}}
 */
function d2xy(n, d) {
  let rx = 0;
  let ry = 0;
  let x = 0;
  let y = 0;
  let s = 1;
  let t = d;
  while (s < n) {
    rx = 1 & (t / 2);
    ry = 1 & (t ^ rx);
    // rot
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      const tmp = x;
      x = y;
      y = tmp;
    }
    x += s * rx;
    y += s * ry;
    t = Math.floor(t / 4);
    s *= 2;
  }
  return { x, y };
}

/**
 * ヒルベルト曲線の点列を生成する
 */
function buildCurve() {
  const order = Math.max(1, Math.min(8, Math.round(params.order)));
  const n = 1 << order; // 2^order
  const total = n * n;
  const w = canvas.width;
  const h = canvas.height;
  const size = Math.min(w, h) * (1 - params.padding * 2);
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  const step = size / (n - 1);

  points = [];
  for (let d = 0; d < total; d++) {
    const { x, y } = d2xy(n, d);
    points.push({
      x: ox + x * step,
      y: oy + y * step,
    });
  }
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
    // アニメーション完了後はリセット
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

    if (params.glow > 0) {
      ctx.shadowColor = colorAt(t);
      ctx.shadowBlur = params.glow * 10;
    } else {
      ctx.shadowBlur = 0;
    }

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
  title: 'Hilbert Curve',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'order', 1, 8, 1).onChange(buildCurve);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'lineWidth', 0.5, 5, 0.1);
gui.add(params, 'drawSpeed', 1, 200, 1);
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
  params.order = rand(3, 7, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.lineWidth = rand(0.5, 3, 0.1);
  params.drawSpeed = rand(4, 80, 1);
  params.glow = rand(0, 1.5, 0.05);
  buildCurve();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  buildCurve();
  gui.updateDisplay();
});
