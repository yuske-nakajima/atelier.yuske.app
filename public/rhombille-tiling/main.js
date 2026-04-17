// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 菱形タイリング：等角三菱形で平面を敷き詰める。
// 3方向の平行四辺形を使い、3Dキューブの投影に見える模様を生成する。

const params = {
  tileSize: 40, // タイルサイズ
  hue1: 220, // 上面の色相
  hue2: 260, // 左面の色相
  hue3: 300, // 右面の色相
  saturation: 55, // 彩度
  lightTop: 70, // 上面明度
  lightLeft: 45, // 左面明度
  lightRight: 30, // 右面明度
  strokeWidth: 0.5, // 枠線幅
  animSpeed: 0.4, // アニメーション速度
  colorShift: 0, // 色相シフト
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
 * 菱形（平行四辺形）を描く
 * @param {number} cx 中心X
 * @param {number} cy 中心Y
 * @param {number} dx1 方向1 X
 * @param {number} dy1 方向1 Y
 * @param {number} dx2 方向2 X
 * @param {number} dy2 方向2 Y
 * @param {string} color 塗りつぶし色
 */
function drawRhombus(cx, cy, dx1, dy1, dx2, dy2, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + dx1, cy + dy1);
  ctx.lineTo(cx + dx1 + dx2, cy + dy1 + dy2);
  ctx.lineTo(cx + dx2, cy + dy2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (params.strokeWidth > 0) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = params.strokeWidth;
    ctx.stroke();
  }
}

function draw() {
  time += params.animSpeed * 0.005;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, w, h);

  const s = params.tileSize;
  // 六方格子の基底ベクトル
  const ax = s;
  const ay = 0;
  const bx = s * 0.5;
  const by = s * Math.sqrt(3) * 0.5;

  const shift = params.colorShift + time * 30;
  const h1 = (params.hue1 + shift) % 360;
  const h2 = (params.hue2 + shift) % 360;
  const h3 = (params.hue3 + shift) % 360;
  const sat = params.saturation;

  // グリッド描画範囲
  const cols = Math.ceil(w / s) + 4;
  const rows = Math.ceil(h / by) + 4;

  for (let row = -2; row < rows; row++) {
    for (let col = -2; col < cols; col++) {
      const cx = col * ax + row * bx - w * 0.1;
      const cy = row * by - h * 0.05;

      // 上面（水平菱形）
      drawRhombus(
        cx,
        cy,
        ax,
        ay,
        bx,
        by,
        `hsl(${h1}, ${sat}%, ${params.lightTop}%)`,
      );
      // 左面
      drawRhombus(
        cx + bx,
        cy + by,
        ax,
        ay,
        bx,
        by,
        `hsl(${h2}, ${sat}%, ${params.lightLeft}%)`,
      );
      // 右面
      drawRhombus(
        cx + ax,
        cy,
        bx,
        by,
        bx,
        by,
        `hsl(${h3}, ${sat}%, ${params.lightRight}%)`,
      );
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
  title: 'Rhombille Tiling',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'tileSize', 10, 120, 2);
gui.add(params, 'hue1', 0, 360, 1);
gui.add(params, 'hue2', 0, 360, 1);
gui.add(params, 'hue3', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightTop', 0, 100, 1);
gui.add(params, 'lightLeft', 0, 100, 1);
gui.add(params, 'lightRight', 0, 100, 1);
gui.add(params, 'strokeWidth', 0, 3, 0.1);
gui.add(params, 'animSpeed', 0, 3, 0.05);
gui.add(params, 'colorShift', 0, 360, 1);

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
  params.tileSize = rand(20, 80, 2);
  params.hue1 = rand(0, 360, 1);
  params.hue2 = rand(0, 360, 1);
  params.hue3 = rand(0, 360, 1);
  params.saturation = rand(30, 90, 1);
  params.lightTop = rand(55, 85, 1);
  params.lightLeft = rand(30, 55, 1);
  params.lightRight = rand(15, 40, 1);
  params.animSpeed = rand(0, 2, 0.05);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
