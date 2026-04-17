// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 1D 初等セルオートマトン: ルール番号 (0..255) でクラス I〜IV の挙動を切替。
// rule30, rule90, rule110 などが有名。

const params = {
  rule: 30, // ルール番号
  width: 401, // 横セル数（奇数にすると中央が 1 セル）
  rows: 240, // 行数
  init: 1, // 0: ランダム, 1: 中央 1 セル
  density: 0.5, // ランダム初期化の密度
  hue: 200, // 色相
  hueShift: 0.1, // 行ごとの色相変化
  saturation: 55, // 彩度
  lightness: 68, // 明度
  bg: 8, // 背景明度
  cellGap: 0, // セル間隔
  animate: 0, // 行単位で徐々に描画
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

/**
 * @param {Uint8Array} row
 * @param {number} rule
 */
function step(row, rule) {
  const n = row.length;
  const next = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const l = row[(i - 1 + n) % n];
    const c = row[i];
    const r = row[(i + 1) % n];
    const pattern = (l << 2) | (c << 1) | r;
    next[i] = (rule >> pattern) & 1;
  }
  return next;
}

let animRow = 0;
/** @type {Uint8Array[]} */
let history = [];

function init() {
  const n = Math.floor(params.width);
  const first = new Uint8Array(n);
  if (params.init === 1) {
    first[n >> 1] = 1;
  } else {
    for (let i = 0; i < n; i++)
      first[i] = Math.random() < params.density ? 1 : 0;
  }
  history = [first];
  animRow = 0;
}

function computeAll() {
  const rule = Math.floor(params.rule) & 0xff;
  const rows = Math.floor(params.rows);
  while (history.length < rows) {
    history.push(step(history[history.length - 1], rule));
  }
}

function draw() {
  init();
  computeAll();
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);
  const cols = history[0].length;
  const rows = history.length;
  const cellW = w / cols;
  const cellH = h / rows;
  const gap = params.cellGap;
  const limit = params.animate ? animRow : rows;
  for (let j = 0; j < limit; j++) {
    const row = history[j];
    const hue = (params.hue + j * params.hueShift) % 360;
    ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    for (let i = 0; i < cols; i++) {
      if (row[i] === 0) continue;
      ctx.fillRect(
        i * cellW + gap,
        j * cellH + gap,
        cellW - gap * 2,
        cellH - gap * 2,
      );
    }
  }
}

function tick() {
  if (params.animate) {
    if (animRow < Math.floor(params.rows)) {
      animRow++;
      draw();
    }
  }
  requestAnimationFrame(tick);
}
resize();
requestAnimationFrame(tick);

// --- GUI ---

const gui = new TileUI({
  title: 'Wolfram',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'rule', 0, 255, 1).onChange(draw);
gui.add(params, 'width', 81, 801, 2).onChange(draw);
gui.add(params, 'rows', 40, 600, 1).onChange(draw);
gui.add(params, 'init', 0, 1, 1).onChange(draw);
gui.add(params, 'density', 0.05, 0.95, 0.01).onChange(draw);
gui.add(params, 'hue', 0, 360, 1).onChange(draw);
gui.add(params, 'hueShift', 0, 1, 0.01).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 30, 90, 1).onChange(draw);
gui.add(params, 'cellGap', 0, 2, 0.1).onChange(draw);
gui.add(params, 'bg', 0, 30, 1).onChange(draw);
gui.add(params, 'animate', 0, 1, 1).onChange(draw);

gui.addButton('Random', () => {
  const famous = [30, 54, 90, 110, 150, 184];
  params.rule = famous[Math.floor(Math.random() * famous.length)];
  params.hue = Math.floor(Math.random() * 360);
  params.init = Math.random() < 0.5 ? 0 : 1;
  gui.updateDisplay();
  draw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
