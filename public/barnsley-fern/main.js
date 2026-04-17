// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  pointsPerFrame: 2000, // 1 フレームで描く点の数
  scale: 60, // 拡大率
  offsetX: 0, // 水平オフセット
  offsetY: 0.05, // 垂直オフセット（下寄せ）
  hueBase: 120, // 色相ベース
  hueRange: 40, // 色相レンジ
  saturation: 70, // 彩度
  pointAlpha: 0.35, // 点の不透明度
  pointSize: 0.8, // 点サイズ
  fadeAlpha: 0.02, // 残像フェード
  probF2: 85, // 主葉の確率（%）
  variation: 0, // ゆらぎ（0:標準 Barnsley / 1〜: アレンジ）
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resize);
resize();

// --- 状態 ---

let px = 0;
let py = 0;
let count = 0;

function reset() {
  px = 0;
  py = 0;
  count = 0;
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- 反復関数系（バーンズリー） ---

function step() {
  const r = Math.random() * 100;
  const v = params.variation * 0.02;
  let nx;
  let ny;
  const p1 = 1;
  const p2 = params.probF2;
  const p3 = (100 - p2) / 2 + p2;
  if (r < p1) {
    nx = 0;
    ny = 0.16 * py;
  } else if (r < p2) {
    nx = (0.85 + v) * px + 0.04 * py;
    ny = -0.04 * px + (0.85 - v) * py + 1.6;
  } else if (r < p3) {
    nx = 0.2 * px - 0.26 * py;
    ny = 0.23 * px + 0.22 * py + 1.6;
  } else {
    nx = -0.15 * px + 0.28 * py;
    ny = 0.26 * px + 0.24 * py + 0.44;
  }
  px = nx;
  py = ny;
}

function draw() {
  // 残像フェード
  ctx.fillStyle = `rgba(11, 10, 7, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width * (0.5 + params.offsetX);
  const cy = canvas.height * (1 - params.offsetY);
  const s = params.scale;

  for (let i = 0; i < params.pointsPerFrame; i++) {
    step();
    const sx = cx + px * s;
    const sy = cy - py * s;
    const hue = params.hueBase + Math.sin(count * 0.0001) * params.hueRange;
    ctx.fillStyle = `hsla(${hue}, ${params.saturation}%, 55%, ${params.pointAlpha})`;
    ctx.fillRect(sx, sy, params.pointSize, params.pointSize);
    count++;
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Barnsley Fern',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'pointsPerFrame', 200, 8000, 100);
gui.add(params, 'scale', 20, 140, 1);
gui.add(params, 'offsetX', -0.4, 0.4, 0.01);
gui.add(params, 'offsetY', -0.2, 0.3, 0.01);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 120, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'pointAlpha', 0.05, 1, 0.01);
gui.add(params, 'pointSize', 0.3, 3, 0.1);
gui.add(params, 'fadeAlpha', 0, 0.1, 0.005);
gui.add(params, 'probF2', 60, 95, 1);
gui.add(params, 'variation', 0, 3, 0.01);

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
  params.scale = rand(40, 110, 1);
  params.hueBase = rand(60, 200, 1);
  params.hueRange = rand(10, 80, 1);
  params.saturation = rand(40, 90, 1);
  params.pointAlpha = rand(0.2, 0.6, 0.01);
  params.probF2 = rand(70, 90, 1);
  params.variation = rand(0, 2, 0.01);
  gui.updateDisplay();
  reset();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  reset();
});
