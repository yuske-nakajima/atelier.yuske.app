// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  type: 1, // 1: Hypocycloid（内サイクロイド）, 2: Epicycloid（外サイクロイド）
  R: 180, // 固定円の半径
  r: 57, // 動円の半径
  d: 90, // ペン位置（動円中心からの距離）
  scale: 1.2, // 全体スケール
  speed: 2, // 回転速度（ラジアン/秒）
  trailFade: 0.04, // 残像のフェード（小さいほど長い尾）
  hue: 180, // 色相
  hueShift: 0.3, // 時間で色相シフト
  lineWidth: 1.5, // 線の太さ
  glow: 8, // グローの強さ
  points: 400, // 1 フレームでの補間点数
  clearOnChange: true, // パラメータ変更時にクリア
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clearCanvas();
}

function clearCanvas() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resize);
resize();

// --- ペン位置計算 ---

/**
 * スピログラフの座標を返す
 * @param {number} t 角度
 * @returns {[number, number]}
 */
function penPosition(t) {
  const R = params.R;
  const r = Math.max(1, params.r);
  const d = params.d;
  if (params.type === 2) {
    // Epicycloid
    const x = (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t);
    const y = (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t);
    return [x * params.scale, y * params.scale];
  }
  // Hypocycloid
  const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
  const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
  return [x * params.scale, y * params.scale];
}

// --- ループ ---

let theta = 0;
let time = 0;

function step() {
  time += 1 / 60;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // フェード
  ctx.fillStyle = `rgba(8, 8, 12, ${Math.max(0, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const steps = Math.max(1, Math.round(params.points));
  const delta = params.speed / 60 / steps;
  ctx.lineWidth = Math.max(0.0625, params.lineWidth);
  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;

  let [px, py] = penPosition(theta);
  for (let i = 0; i < steps; i++) {
    theta += delta;
    const [nx, ny] = penPosition(theta);
    const hue = (params.hue + time * params.hueShift * 60) % 360;
    const stroke = `hsl(${hue}, 85%, 65%)`;
    ctx.strokeStyle = stroke;
    ctx.shadowColor = stroke;
    ctx.beginPath();
    ctx.moveTo(cx + px, cy + py);
    ctx.lineTo(cx + nx, cy + ny);
    ctx.stroke();
    px = nx;
    py = ny;
  }
  ctx.shadowBlur = 0;
}

function tick() {
  step();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Spirograph Engine',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

/**
 * パラメータ変更時のフック
 */
function onParamChange() {
  if (params.clearOnChange) clearCanvas();
}

gui.add(params, 'type', 1, 2, 1).onChange(onParamChange);
gui.add(params, 'R', 40, 400, 1).onChange(onParamChange);
gui.add(params, 'r', 1, 300, 1).onChange(onParamChange);
gui.add(params, 'd', 0, 300, 1).onChange(onParamChange);
gui.add(params, 'scale', 0.3, 3, 0.01).onChange(onParamChange);
gui.add(params, 'speed', 0.1, 10, 0.05);
gui.add(params, 'trailFade', 0, 0.4, 0.005);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueShift', 0, 2, 0.01);
gui.add(params, 'lineWidth', 0.25, 6, 0.05);
gui.add(params, 'glow', 0, 30, 0.5);
gui.add(params, 'points', 50, 2000, 10);
gui.add(params, 'clearOnChange');

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
  params.type = rand(1, 2, 1);
  params.R = rand(120, 260, 1);
  params.r = rand(20, 150, 1);
  params.d = rand(30, 180, 1);
  params.scale = rand(0.8, 1.8, 0.01);
  params.speed = rand(0.8, 5, 0.05);
  params.trailFade = rand(0.01, 0.12, 0.005);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0, 1, 0.01);
  params.lineWidth = rand(0.6, 2.4, 0.05);
  params.glow = rand(0, 15, 0.5);
  clearCanvas();
  gui.updateDisplay();
});

gui.addButton('Clear', () => {
  clearCanvas();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  clearCanvas();
  gui.updateDisplay();
});
