// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// Stern-Brocot 木: (0/1, 1/0) から中間分数 (a+c)/(b+d) を繰り返し挿入。
// 二分木として描画し、ノード値で色相を決める。

const params = {
  depth: 7, // 木の深さ
  nodeSize: 4, // ノード半径
  spread: 0.9, // 枝の広がり
  vGap: 70, // 縦ギャップ
  lineWidth: 1, // 線の太さ
  hueBase: 180, // 色相基準
  hueRange: 180, // 色相の範囲
  saturation: 70,
  lightness: 60,
  bg: 6, // 背景明度
  rotation: 0, // 回転（度）
  trail: 1, // 描画不透明度
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

/**
 * Stern-Brocot ノードを再帰構築して描画。
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} x
 * @param {number} y
 * @param {number} dx
 * @param {number} level
 */
function draw(a, b, c, d, x, y, dx, level) {
  if (level > params.depth) return;
  const num = a + c;
  const den = b + d;
  const ratio = num / den;
  const hue =
    params.hueBase + (Math.atan(ratio - 1) / (Math.PI / 2)) * params.hueRange;

  const ly = y + params.vGap;
  const lx = x - dx;
  const rx = x + dx;

  ctx.strokeStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.trail})`;
  ctx.lineWidth = params.lineWidth;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(lx, ly);
  ctx.moveTo(x, y);
  ctx.lineTo(rx, ly);
  ctx.stroke();

  ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.beginPath();
  ctx.arc(x, y, params.nodeSize, 0, Math.PI * 2);
  ctx.fill();

  const nd = dx * params.spread * 0.5;
  draw(a, b, num, den, lx, ly, nd, level + 1);
  draw(num, den, c, d, rx, ly, nd, level + 1);
}

function render() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W / 2, 60);
  ctx.rotate((params.rotation * Math.PI) / 180);
  const spread = W * 0.22;
  draw(0, 1, 1, 0, 0, 0, spread, 0);
  ctx.restore();
}

function loop() {
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- GUI ---

const gui = new TileUI({
  title: 'Stern-Brocot Tree',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 1, 10, 1);
gui.add(params, 'nodeSize', 1, 12, 0.5);
gui.add(params, 'spread', 0.5, 1.2, 0.01);
gui.add(params, 'vGap', 30, 140, 1);
gui.add(params, 'lineWidth', 0.5, 5, 0.1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 20, 90, 1);
gui.add(params, 'bg', 0, 20, 1);
gui.add(params, 'rotation', -30, 30, 0.5);
gui.add(params, 'trail', 0.1, 1, 0.01);

gui.addButton('Random', () => {
  params.depth = 4 + Math.floor(Math.random() * 5);
  params.hueBase = Math.floor(Math.random() * 360);
  params.hueRange = Math.floor(Math.random() * 360);
  params.spread = 0.6 + Math.random() * 0.5;
  params.rotation = -15 + Math.random() * 30;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
