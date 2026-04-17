// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  bpm: 120, // テンポ
  columns: 16, // 横セル数（ステップ数）
  rows: 8, // 縦セル数（トラック数）
  density: 0.35, // アクティブセルの密度
  swing: 0, // スウィング量（0-0.5）
  cellGap: 0.12, // セル間の隙間（比率）
  glow: 0.6, // 点灯時の発光強度
  hueBase: 280, // 基本色相
  hueSpread: 80, // 行ごとの色相差
  trailFade: 0.2, // 残像フェード
  seed: 1, // パターンシード
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

// --- パターン生成 ---

/**
 * @param {number} seed
 * @returns {() => number}
 */
function createRng(seed) {
  let s = Math.max(1, Math.floor(seed)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** @type {boolean[][]} */
let pattern = [];

function buildPattern() {
  const cols = Math.max(2, Math.round(params.columns));
  const rows = Math.max(2, Math.round(params.rows));
  const rng = createRng(params.seed);
  pattern = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(rng() < params.density);
    }
    pattern.push(row);
  }
}

buildPattern();

// --- 描画 ---

let startTime = performance.now();

function draw(now) {
  const elapsed = (now - startTime) / 1000;
  const beatPerSec = params.bpm / 60;
  const stepPerSec = beatPerSec * 4; // 16分音符
  const cols = Math.max(2, Math.round(params.columns));
  const rows = Math.max(2, Math.round(params.rows));
  const stepF = elapsed * stepPerSec;
  // スウィング: 偶数ステップを遅らせる
  const intStep = Math.floor(stepF) % cols;
  const frac = stepF - Math.floor(stepF);
  const swing = params.swing;
  const current =
    intStep % 2 === 1 && frac < swing ? (intStep - 1 + cols) % cols : intStep;

  ctx.fillStyle = `rgba(8, 9, 15, ${Math.max(0.05, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const margin = Math.min(canvas.width, canvas.height) * 0.05;
  const gw = canvas.width - margin * 2;
  const gh = canvas.height - margin * 2;
  const cw = gw / cols;
  const ch = gh / rows;
  const gap = Math.min(cw, ch) * params.cellGap;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = margin + c * cw + gap / 2;
      const y = margin + r * ch + gap / 2;
      const w = cw - gap;
      const h = ch - gap;
      const active = pattern[r]?.[c] ?? false;
      const onBeat = c === current;
      const hue = params.hueBase + (r / rows) * params.hueSpread;
      if (active && onBeat) {
        const glow = params.glow;
        ctx.fillStyle = `hsl(${hue}, 90%, ${55 + glow * 25}%)`;
        ctx.shadowBlur = 20 * glow;
        ctx.shadowColor = `hsl(${hue}, 90%, 60%)`;
      } else if (active) {
        ctx.fillStyle = `hsl(${hue}, 60%, 35%)`;
        ctx.shadowBlur = 0;
      } else if (onBeat) {
        ctx.fillStyle = `hsl(${hue}, 20%, 18%)`;
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'hsl(230, 10%, 12%)';
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x, y, w, h);
    }
  }
  ctx.shadowBlur = 0;
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

// --- GUI ---

const gui = new TileUI({
  title: 'Rhythm Grid',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'bpm', 40, 240, 1);
gui.add(params, 'columns', 4, 32, 1).onChange(buildPattern);
gui.add(params, 'rows', 2, 16, 1).onChange(buildPattern);
gui.add(params, 'density', 0.05, 0.8, 0.01).onChange(buildPattern);
gui.add(params, 'swing', 0, 0.5, 0.01);
gui.add(params, 'cellGap', 0, 0.4, 0.01);
gui.add(params, 'glow', 0, 1, 0.01);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueSpread', 0, 360, 1);
gui.add(params, 'trailFade', 0.05, 0.6, 0.01);
gui.add(params, 'seed', 1, 9999, 1).onChange(buildPattern);

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
  params.bpm = r(80, 160, 1);
  params.columns = r(8, 24, 1);
  params.rows = r(4, 12, 1);
  params.density = r(0.2, 0.5, 0.01);
  params.swing = r(0, 0.3, 0.01);
  params.hueBase = r(0, 360, 1);
  params.hueSpread = r(20, 180, 1);
  params.seed = r(1, 9999, 1);
  buildPattern();
  startTime = performance.now();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  buildPattern();
  startTime = performance.now();
  gui.updateDisplay();
});
