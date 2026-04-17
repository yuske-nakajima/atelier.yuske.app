// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// McMullen Carpet（長方形の多段分割フラクタル）
const params = {
  depth: 4,
  cols: 5,
  rows: 3,
  keep: 10, // 保持する数 0..cols*rows
  hue: 300,
  hueShift: 40,
  saturation: 60,
  lightness: 55,
  edgeAlpha: 0.3,
  padding: 40,
  seed: 1,
};
// 描画する矩形数の上限（フリーズ防止）
const MAX_RECTS = 200000;
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
let dirty = true;
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  dirty = true;
}
addEventListener('resize', resize);

// 疑似乱数（seed 依存）
function prng(s) {
  let x = s | 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

function chooseKeep(cols, rows, keep, rnd) {
  const total = cols * rows;
  const arr = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return new Set(arr.slice(0, Math.max(1, Math.min(total, keep))));
}

function subdivide(x, y, w, h, depth, cols, rows, keep, rnd, hue, out) {
  if (out.length >= MAX_RECTS) return;
  if (depth === 0) {
    out.push([x, y, w, h, hue]);
    return;
  }
  const cw = w / cols;
  const ch = h / rows;
  const kept = chooseKeep(cols, rows, keep, rnd);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (out.length >= MAX_RECTS) return;
      const idx = j * cols + i;
      if (!kept.has(idx)) continue;
      const nh = (hue + (i * 13 + j * 7) * params.hueShift * 0.1) % 360;
      subdivide(
        x + i * cw,
        y + j * ch,
        cw,
        ch,
        depth - 1,
        cols,
        rows,
        keep,
        rnd,
        nh,
        out,
      );
    }
  }
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const pad = params.padding;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const cols = Math.max(2, params.cols | 0);
  const rows = Math.max(2, params.rows | 0);
  const keep = Math.max(1, Math.min(cols * rows, params.keep | 0));
  const rnd = prng(params.seed);
  const out = [];
  subdivide(
    pad,
    pad,
    w,
    h,
    Math.max(0, Math.min(6, params.depth | 0)),
    cols,
    rows,
    keep,
    rnd,
    params.hue,
    out,
  );
  // エッジ描画は小さすぎる矩形では省略（可読性とパフォーマンス）
  const edge = `rgba(0,0,0,${params.edgeAlpha})`;
  ctx.strokeStyle = edge;
  for (const [x, y, rw, rh, hue] of out) {
    ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.fillRect(x, y, rw, rh);
    if (rw > 2 && rh > 2 && params.edgeAlpha > 0) {
      ctx.strokeRect(x, y, rw, rh);
    }
  }
}

function tick() {
  if (dirty) {
    draw();
    dirty = false;
  }
  requestAnimationFrame(tick);
}
resize();
tick();

const gui = new TileUI({
  title: 'McMullen Carpet',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
function onChange() {
  dirty = true;
}
gui.add(params, 'depth', 0, 5, 1).onChange(onChange);
gui.add(params, 'cols', 2, 8, 1).onChange(onChange);
gui.add(params, 'rows', 2, 8, 1).onChange(onChange);
gui.add(params, 'keep', 1, 40, 1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 200, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'edgeAlpha', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'padding', 0, 200, 1).onChange(onChange);
gui.add(params, 'seed', 1, 9999, 1).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(3, 5, 1);
  params.cols = rand(3, 6, 1);
  params.rows = rand(2, 5, 1);
  params.keep = rand(
    Math.max(2, params.cols * params.rows - 10),
    params.cols * params.rows - 1,
    1,
  );
  params.hue = rand(0, 360, 1);
  params.saturation = rand(30, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.seed = rand(1, 9999, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
