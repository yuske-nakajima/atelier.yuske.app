// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  tileSize: 56, // タイル 1 辺のピクセル数
  lineWidth: 8, // 曲線の太さ
  curveRatio: 1.0, // 曲線半径の比率（タイル半径に対する倍率）
  bias: 0.5, // パターンの向きバイアス（0 or 1）
  seed: 1, // シード
  hue: 200, // 色相
  hueShift: 30, // タイルごとの色相シフト
  saturation: 50, // 彩度
  lightness: 65, // 明度
  bg: 8, // 背景の明度
  rotate: 0, // 全体回転（度）
  jitter: 0, // タイル位置ジッター
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

// --- 疑似乱数 ---
let seedState = 1;
function rng() {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
  return seedState / 0x7fffffff;
}

function draw() {
  seedState = Math.max(1, Math.floor(params.seed));
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((params.rotate * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);

  const ts = Math.max(8, params.tileSize);
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';

  const cols = Math.ceil(w / ts) + 2;
  const rows = Math.ceil(h / ts) + 2;
  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      const x = i * ts + (rng() - 0.5) * params.jitter;
      const y = j * ts + (rng() - 0.5) * params.jitter;
      const hue = (params.hue + (i + j) * params.hueShift) % 360;
      ctx.strokeStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
      const flip = rng() < params.bias ? 0 : 1;
      drawTile(x, y, ts, flip);
    }
  }
  ctx.restore();
}

/**
 * Truchet 曲線タイル
 * @param {number} x
 * @param {number} y
 * @param {number} s
 * @param {number} flip
 */
function drawTile(x, y, s, flip) {
  const r = (s / 2) * params.curveRatio;
  ctx.beginPath();
  if (flip === 0) {
    ctx.arc(x, y, r, 0, Math.PI / 2);
    ctx.moveTo(x + s, y + s);
    ctx.arc(x + s, y + s, r, Math.PI, (3 * Math.PI) / 2);
  } else {
    ctx.arc(x + s, y, r, Math.PI / 2, Math.PI);
    ctx.moveTo(x, y + s);
    ctx.arc(x, y + s, r, (3 * Math.PI) / 2, 2 * Math.PI);
  }
  ctx.stroke();
}

resize();

// --- GUI ---

const gui = new TileUI({
  title: 'Truchet Tiles',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'tileSize', 16, 180, 1).onChange(draw);
gui.add(params, 'lineWidth', 1, 30, 0.5).onChange(draw);
gui.add(params, 'curveRatio', 0.3, 2, 0.05).onChange(draw);
gui.add(params, 'bias', 0, 1, 0.01).onChange(draw);
gui.add(params, 'seed', 1, 9999, 1).onChange(draw);
gui.add(params, 'hue', 0, 360, 1).onChange(draw);
gui.add(params, 'hueShift', 0, 60, 0.5).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 10, 90, 1).onChange(draw);
gui.add(params, 'bg', 0, 100, 1).onChange(draw);
gui.add(params, 'rotate', -180, 180, 1).onChange(draw);
gui.add(params, 'jitter', 0, 20, 0.5).onChange(draw);

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
  params.tileSize = rand(32, 120, 1);
  params.lineWidth = rand(2, 16, 0.5);
  params.curveRatio = rand(0.5, 1.5, 0.05);
  params.bias = rand(0.2, 0.8, 0.01);
  params.seed = rand(1, 9999, 1);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0, 40, 0.5);
  params.saturation = rand(30, 80, 1);
  draw();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  draw();
  gui.updateDisplay();
});
