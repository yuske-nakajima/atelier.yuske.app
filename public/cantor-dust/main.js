// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// Cantor Dust: 区間/正方形を N 分割して一部だけ残す操作を繰り返し、
// 入れ子状の穴あき構造を生成する古典フラクタル。

const params = {
  depth: 6, // 再帰の深さ
  divisions: 3, // 分割数 N
  keep: 2, // 残す位置数（0〜N^2）
  mode: 0, // 0: 縦 (Cantor set), 1: 2D (Cantor Dust)
  padding: 0.08, // 余白
  hue: 200, // 色相
  saturation: 60, // 彩度
  lightness: 68, // 明度
  gap: 0.0, // 各マス間の隙間
  bgLightness: 6, // 背景明度
  jitter: 0.0, // 色のばらつき
  seed: 1234, // シード
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
 * 簡易乱数（シード指定）。
 * @param {number} s
 */
function rng(s) {
  let x = s | 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}

/**
 * ルール（残す位置の集合）を決定する。
 */
function buildKeepSet() {
  const n = Math.floor(params.divisions);
  const total = params.mode === 0 ? n : n * n;
  const k = Math.max(1, Math.min(total, Math.floor(params.keep)));
  const rand = rng(Math.floor(params.seed));
  const indices = Array.from({ length: total }, (_, i) => i);
  // Fisher-Yates
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, k));
}

/**
 * 再帰的に矩形を塗る。
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} d
 * @param {Set<number>} keep
 */
function recurse(x, y, w, h, d, keep) {
  if (d === 0 || w < 1 || h < 1) {
    const jitter = (Math.random() - 0.5) * params.jitter * 60;
    ctx.fillStyle = `hsl(${params.hue + jitter}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const n = Math.floor(params.divisions);
  const gap = params.gap;
  if (params.mode === 0) {
    const sh = h / n;
    for (let i = 0; i < n; i++) {
      if (!keep.has(i)) continue;
      recurse(x, y + i * sh + gap, w, sh - gap * 2, d - 1, keep);
    }
  } else {
    const sw = w / n;
    const sh = h / n;
    for (let i = 0; i < n * n; i++) {
      if (!keep.has(i)) continue;
      const ix = i % n;
      const iy = Math.floor(i / n);
      recurse(
        x + ix * sw + gap,
        y + iy * sh + gap,
        sw - gap * 2,
        sh - gap * 2,
        d - 1,
        keep,
      );
    }
  }
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, w, h);
  const pad = params.padding * Math.min(w, h);
  const size = Math.min(w, h) - pad * 2;
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  const keep = buildKeepSet();
  recurse(ox, oy, size, size, Math.floor(params.depth), keep);
}
resize();

// --- GUI ---

const gui = new TileUI({
  title: 'Cantor Dust',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 1, 8, 1).onChange(draw);
gui.add(params, 'divisions', 2, 6, 1).onChange(draw);
gui.add(params, 'keep', 1, 30, 1).onChange(draw);
gui.add(params, 'mode', 0, 1, 1).onChange(draw);
gui.add(params, 'padding', 0, 0.3, 0.01).onChange(draw);
gui.add(params, 'gap', 0, 5, 0.1).onChange(draw);
gui.add(params, 'hue', 0, 360, 1).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 20, 90, 1).onChange(draw);
gui.add(params, 'bgLightness', 0, 40, 1).onChange(draw);
gui.add(params, 'jitter', 0, 1, 0.01).onChange(draw);
gui.add(params, 'seed', 0, 9999, 1).onChange(draw);

gui.addButton('Random', () => {
  params.depth = 3 + Math.floor(Math.random() * 4);
  params.divisions = 2 + Math.floor(Math.random() * 4);
  const total =
    params.mode === 0 ? params.divisions : params.divisions * params.divisions;
  params.keep = 1 + Math.floor(Math.random() * (total - 1));
  params.hue = Math.floor(Math.random() * 360);
  params.seed = Math.floor(Math.random() * 9999);
  gui.updateDisplay();
  draw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
