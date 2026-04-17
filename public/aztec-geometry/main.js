// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// アステカ幾何模様：段階的に縮小する正方形グリッドを回転させた
// 入れ子構造のパターン。アステカ暦石の幾何学模様に着想。

const params = {
  layers: 8, // 入れ子レイヤー数
  rotAngle: 15, // 各層の回転角（度）
  hueStart: 30, // 開始色相（金）
  hueEnd: 0, // 終了色相（赤）
  saturation: 75, // 彩度
  lightStart: 65, // 外側明度
  lightEnd: 25, // 内側明度
  strokeWidth: 1.5, // 枠線幅
  sizeRatio: 0.85, // 縮小比率
  animSpeed: 0.4, // アニメーション速度
  pulseAmp: 0.05, // 脈動幅
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
 * 回転した正方形を描く
 * @param {number} cx 中心X
 * @param {number} cy 中心Y
 * @param {number} size サイズ
 * @param {number} angle 回転角（rad）
 * @param {string} fillColor 塗り色
 * @param {string} strokeColor 枠線色
 */
function drawSquare(cx, cy, size, angle, fillColor, strokeColor) {
  const h = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.rect(-h, -h, size, size);
  ctx.fillStyle = fillColor;
  ctx.fill();
  if (params.strokeWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = params.strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 装飾的なトライアングルを描く
 * @param {number} cx
 * @param {number} cy
 * @param {number} size
 * @param {number} angle
 * @param {string} color
 */
function drawTriDecor(cx, cy, size, angle, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.3, size * 0.3);
  ctx.lineTo(-size * 0.3, size * 0.3);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function draw() {
  time += params.animSpeed * 0.01;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, w, h);

  const n = Math.max(2, Math.round(params.layers));
  const maxSize = Math.min(w, h) * 0.92;
  const pulse = 1 + Math.sin(time * 2) * params.pulseAmp;

  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1);
    const size = maxSize * params.sizeRatio ** i * pulse;
    const angle = (i * params.rotAngle * Math.PI) / 180 + time * 0.2;
    const hue = params.hueStart + (params.hueEnd - params.hueStart) * (1 - t);
    const lig =
      params.lightStart + (params.lightEnd - params.lightStart) * (1 - t);
    const sat = params.saturation;

    drawSquare(
      cx,
      cy,
      size,
      angle,
      `hsl(${hue}, ${sat}%, ${lig}%)`,
      `hsl(0, 0%, 15%)`,
    );

    // 各角に装飾トライアングル
    const corners = 4;
    for (let k = 0; k < corners; k++) {
      const a = angle + (k * Math.PI * 2) / corners;
      const decX = cx + Math.cos(a + Math.PI / 4) * size * 0.42;
      const decY = cy + Math.sin(a + Math.PI / 4) * size * 0.42;
      const decHue = (hue + 60) % 360;
      drawTriDecor(
        decX,
        decY,
        size * 0.12,
        a,
        `hsl(${decHue}, ${sat}%, ${lig + 10}%)`,
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
  title: 'Aztec Geometry',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'layers', 2, 16, 1);
gui.add(params, 'rotAngle', 0, 90, 0.5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightStart', 20, 90, 1);
gui.add(params, 'lightEnd', 5, 60, 1);
gui.add(params, 'sizeRatio', 0.5, 0.97, 0.01);
gui.add(params, 'animSpeed', 0, 3, 0.05);
gui.add(params, 'pulseAmp', 0, 0.3, 0.01);

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
  params.layers = rand(4, 14, 1);
  params.rotAngle = rand(5, 60, 0.5);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.saturation = rand(40, 90, 1);
  params.sizeRatio = rand(0.7, 0.94, 0.01);
  params.animSpeed = rand(0.1, 2, 0.05);
  params.pulseAmp = rand(0, 0.2, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
