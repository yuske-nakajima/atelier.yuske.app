// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  seed: 1,
  maxDepth: 6, // 最大再帰深度
  splitProbability: 0.7, // 分割確率
  minSize: 40, // 最小サイズ（これ以下では分割しない）
  colorChance: 0.35, // カラー塗り確率（モンドリアン風）
  lineWidth: 4, // 枠線太さ
  redRatio: 0.33, // 赤の比率
  blueRatio: 0.33, // 青の比率
  yellowRatio: 0.34, // 黄の比率
  splitBias: 0.5, // 縦/横の分割バイアス（0: 横優先, 1: 縦優先）
  padding: 0, // 内側パディング
  bgLight: 245, // 背景明度
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}

window.addEventListener('resize', resize);

// --- 擬似乱数（seed 対応） ---

let rngState = 1;
function srand(seed) {
  rngState = seed || 1;
}
function rnd() {
  // Mulberry32
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// --- 描画 ---

function pickColor() {
  const total = params.redRatio + params.blueRatio + params.yellowRatio;
  if (total <= 0) return '#ffffff';
  const r = rnd() * total;
  if (r < params.redRatio) return '#d6402a';
  if (r < params.redRatio + params.blueRatio) return '#2a4ed6';
  return '#f2c200';
}

function drawRect(x, y, w, h, depth) {
  const canSplit =
    depth < params.maxDepth &&
    w > params.minSize &&
    h > params.minSize &&
    rnd() < params.splitProbability;

  if (canSplit) {
    const splitVertical =
      w > h ? rnd() < 0.85 : w < h ? rnd() > 0.85 : rnd() < params.splitBias;
    const ratio = 0.25 + rnd() * 0.5;
    if (splitVertical) {
      const w1 = w * ratio;
      drawRect(x, y, w1, h, depth + 1);
      drawRect(x + w1, y, w - w1, h, depth + 1);
    } else {
      const h1 = h * ratio;
      drawRect(x, y, w, h1, depth + 1);
      drawRect(x, y + h1, w, h - h1, depth + 1);
    }
    return;
  }

  const px = params.padding;
  const fill = rnd() < params.colorChance ? pickColor() : '#ffffff';
  ctx.fillStyle = fill;
  ctx.fillRect(x + px, y + px, w - px * 2, h - px * 2);
  ctx.lineWidth = Math.max(0.0625, params.lineWidth);
  ctx.strokeStyle = '#111111';
  ctx.strokeRect(x + px, y + px, w - px * 2, h - px * 2);
}

function draw() {
  srand(Math.round(params.seed));
  const bg = `rgb(${params.bgLight}, ${params.bgLight - 3}, ${params.bgLight - 13})`;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawRect(0, 0, canvas.width, canvas.height, 0);
}

resize();

// --- GUI ---

const gui = new TileUI({
  title: 'Recursive Subdivision',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'seed', 1, 9999, 1).onChange(draw);
gui.add(params, 'maxDepth', 1, 10, 1).onChange(draw);
gui.add(params, 'splitProbability', 0, 1, 0.01).onChange(draw);
gui.add(params, 'minSize', 10, 200, 1).onChange(draw);
gui.add(params, 'colorChance', 0, 1, 0.01).onChange(draw);
gui.add(params, 'lineWidth', 0.5, 20, 0.5).onChange(draw);
gui.add(params, 'redRatio', 0, 1, 0.01).onChange(draw);
gui.add(params, 'blueRatio', 0, 1, 0.01).onChange(draw);
gui.add(params, 'yellowRatio', 0, 1, 0.01).onChange(draw);
gui.add(params, 'splitBias', 0, 1, 0.01).onChange(draw);
gui.add(params, 'padding', 0, 30, 1).onChange(draw);
gui.add(params, 'bgLight', 0, 255, 1).onChange(draw);

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
  params.seed = r(1, 9999, 1);
  params.maxDepth = r(4, 8, 1);
  params.splitProbability = r(0.55, 0.85, 0.01);
  params.colorChance = r(0.2, 0.55, 0.01);
  params.lineWidth = r(2, 8, 0.5);
  draw();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  draw();
  gui.updateDisplay();
});
