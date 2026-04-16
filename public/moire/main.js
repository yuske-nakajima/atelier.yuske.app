// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  pattern: 'circles', // 'circles' | 'lines' | 'grid'
  spacing: 8, // 縞/円の間隔
  lineWidth: 1, // 線の太さ
  offsetX: 20, // 2 層目の X オフセット
  offsetY: 0, // 2 層目の Y オフセット
  rotation: 5, // 2 層目の回転角度（度）
  scale: 1.02, // 2 層目のスケール倍率
  hue1: 180, // 層 1 の色相
  hue2: 320, // 層 2 の色相
  saturation: 70, // 彩度（%）
  lightness: 55, // 明度（%）
  alpha: 0.7, // 線の不透明度
  animate: true, // アニメーションで 2 層目を動かす
  speed: 0.5, // アニメーション速度
  bgColor: '#0a0a0a', // 背景色
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

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

// --- 描画ヘルパー ---

/**
 * 同心円レイヤーを描画する
 * @param {number} cx
 * @param {number} cy
 * @param {number} maxR
 * @param {string} strokeStyle
 */
function drawCircles(cx, cy, maxR, strokeStyle) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = params.lineWidth;
  for (let r = params.spacing; r < maxR; r += params.spacing) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * 平行線レイヤーを描画する
 * @param {number} w
 * @param {number} h
 * @param {string} strokeStyle
 */
function drawLines(w, h, strokeStyle) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = params.lineWidth;
  const range = Math.hypot(w, h);
  for (let x = -range; x < range; x += params.spacing) {
    ctx.beginPath();
    ctx.moveTo(x, -range);
    ctx.lineTo(x, range);
    ctx.stroke();
  }
}

/**
 * 格子レイヤーを描画する
 * @param {number} w
 * @param {number} h
 * @param {string} strokeStyle
 */
function drawGrid(w, h, strokeStyle) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = params.lineWidth;
  const range = Math.hypot(w, h);
  for (let v = -range; v < range; v += params.spacing) {
    ctx.beginPath();
    ctx.moveTo(v, -range);
    ctx.lineTo(v, range);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-range, v);
    ctx.lineTo(range, v);
    ctx.stroke();
  }
}

/**
 * 指定パターンを現在の ctx 変換下で描画する
 * @param {number} w
 * @param {number} h
 * @param {string} strokeStyle
 */
function drawPattern(w, h, strokeStyle) {
  if (params.pattern === 'circles') {
    drawCircles(0, 0, Math.hypot(w, h), strokeStyle);
    return;
  }
  if (params.pattern === 'lines') {
    drawLines(w, h, strokeStyle);
    return;
  }
  drawGrid(w, h, strokeStyle);
}

// --- 描画 ---

let animTime = 0;

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, w, h);

  // アニメーション適用後のオフセット/回転
  const t = animTime;
  const ox = params.offsetX + (params.animate ? Math.cos(t) * 30 : 0);
  const oy = params.offsetY + (params.animate ? Math.sin(t) * 30 : 0);
  const rot = params.rotation + (params.animate ? Math.sin(t * 0.7) * 3 : 0);

  // 層 1
  ctx.save();
  ctx.translate(cx, cy);
  const color1 = `hsla(${params.hue1}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
  drawPattern(w, h, color1);
  ctx.restore();

  // 層 2（オフセット・回転・スケール適用）
  ctx.save();
  ctx.translate(cx + ox, cy + oy);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(params.scale, params.scale);
  const color2 = `hsla(${params.hue2}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
  drawPattern(w, h, color2);
  ctx.restore();
}

function tick() {
  if (params.animate) {
    animTime += 0.01 * params.speed;
  }
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'Moiré Pattern',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

const patterns = ['circles', 'lines', 'grid'];
// ラベル動的更新は未対応のため、現在のパターン名は画面左下に表示する
gui.addButton('Next Pattern', () => {
  const i = patterns.indexOf(params.pattern);
  params.pattern = patterns[(i + 1) % patterns.length];
  updatePatternLabel();
});

const patternLabel = document.createElement('div');
patternLabel.className = 'pattern-label';
document.body.appendChild(patternLabel);
function updatePatternLabel() {
  patternLabel.textContent = `pattern: ${params.pattern}`;
}
updatePatternLabel();
gui.add(params, 'spacing', 2, 40, 1);
gui.add(params, 'lineWidth', 0.25, 4, 0.25);
gui.add(params, 'offsetX', -200, 200, 1);
gui.add(params, 'offsetY', -200, 200, 1);
gui.add(params, 'rotation', -45, 45, 0.1);
gui.add(params, 'scale', 0.9, 1.1, 0.005);
gui.add(params, 'hue1', 0, 360, 1);
gui.add(params, 'hue2', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 0, 100, 1);
gui.add(params, 'alpha', 0.1, 1, 0.05);
gui.addBoolean(params, 'animate');
gui.add(params, 'speed', 0, 3, 0.1);
gui.addColor(params, 'bgColor');

/**
 * 乱数ヘルパー
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  const patterns = ['circles', 'lines', 'grid'];
  params.pattern = patterns[Math.floor(Math.random() * patterns.length)];
  params.spacing = rand(3, 30, 1);
  params.lineWidth = rand(0.25, 2.5, 0.25);
  params.offsetX = rand(-100, 100, 1);
  params.offsetY = rand(-100, 100, 1);
  params.rotation = rand(-15, 15, 0.1);
  params.scale = rand(0.95, 1.05, 0.005);
  params.hue1 = rand(0, 360, 1);
  params.hue2 = rand(0, 360, 1);
  params.saturation = rand(40, 100, 1);
  params.lightness = rand(40, 70, 1);
  params.alpha = rand(0.4, 0.9, 0.05);
  params.speed = rand(0.2, 1.5, 0.1);
  updatePatternLabel();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  updatePatternLabel();
  gui.updateDisplay();
});
