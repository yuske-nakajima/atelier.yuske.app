// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  mode: 1, // 1: 三角形, 2: カーペット
  depth: 6, // 再帰深度
  scale: 0.9, // 全体スケール
  rotation: 0, // 全体回転（度）
  spin: 0.2, // 自動回転速度（度/秒）
  hue: 200, // 色相
  hueDelta: 20, // 深さごとの色相変化
  saturation: 70, // 彩度
  brightness: 55, // 明度
  fillAlpha: 0.85, // 塗り透明度
  strokeWidth: 0.5, // 線幅
  trailFade: 1.0, // 背景クリア濃度（1: 完全クリア）
  animate: false, // 回転アニメ
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

// --- 描画 ---

function triangle(ax, ay, bx, by, cx, cy, depth) {
  if (depth <= 0) {
    const hue = (params.hue + (params.depth - depth) * params.hueDelta) % 360;
    ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${params.brightness}%, ${params.fillAlpha})`;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    if (params.strokeWidth > 0) ctx.stroke();
    return;
  }
  const abx = (ax + bx) / 2;
  const aby = (ay + by) / 2;
  const bcx = (bx + cx) / 2;
  const bcy = (by + cy) / 2;
  const cax = (cx + ax) / 2;
  const cay = (cy + ay) / 2;
  triangle(ax, ay, abx, aby, cax, cay, depth - 1);
  triangle(abx, aby, bx, by, bcx, bcy, depth - 1);
  triangle(cax, cay, bcx, bcy, cx, cy, depth - 1);
}

function carpet(x, y, size, depth) {
  if (depth <= 0) {
    const hue = (params.hue + (params.depth - depth) * params.hueDelta) % 360;
    ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, ${params.brightness}%, ${params.fillAlpha})`;
    ctx.fillRect(x, y, size, size);
    if (params.strokeWidth > 0) ctx.strokeRect(x, y, size, size);
    return;
  }
  const s = size / 3;
  for (let iy = 0; iy < 3; iy++) {
    for (let ix = 0; ix < 3; ix++) {
      if (ix === 1 && iy === 1) continue; // 中央は穴
      carpet(x + ix * s, y + iy * s, s, depth - 1);
    }
  }
}

let angle = 0;
let last = performance.now();

function draw(now) {
  const dt = (now - last) / 1000;
  last = now;
  if (params.animate) angle += params.spin * dt;

  ctx.fillStyle = `rgba(8, 8, 12, ${Math.max(0, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const size = Math.min(canvas.width, canvas.height) * 0.85 * params.scale;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((params.rotation + angle) * Math.PI) / 180);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = Math.max(0.0625, params.strokeWidth);

  const depth = Math.round(params.depth);
  if (params.mode === 1) {
    const h = (size * Math.sqrt(3)) / 2;
    triangle(-size / 2, h / 3, size / 2, h / 3, 0, -h * (2 / 3), depth);
  } else {
    carpet(-size / 2, -size / 2, size, depth);
  }
  ctx.restore();
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI ---

const gui = new TileUI({
  title: 'Sierpinski Variants',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'mode', 1, 2, 1);
gui.add(params, 'depth', 0, 7, 1);
gui.add(params, 'scale', 0.3, 1.5, 0.01);
gui.add(params, 'rotation', -180, 180, 1);
gui.add(params, 'spin', -30, 30, 0.1);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueDelta', -60, 60, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'brightness', 0, 100, 1);
gui.add(params, 'fillAlpha', 0, 1, 0.01);
gui.add(params, 'strokeWidth', 0, 4, 0.1);
gui.add(params, 'trailFade', 0, 1, 0.01);
gui.add(params, 'animate');

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.mode = r(1, 2, 1);
  params.depth = r(4, 7, 1);
  params.hue = r(0, 360, 1);
  params.hueDelta = r(-30, 30, 1);
  params.saturation = r(50, 90, 1);
  params.rotation = r(-30, 30, 1);
  params.spin = r(-5, 5, 0.1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  angle = 0;
  gui.updateDisplay();
});
