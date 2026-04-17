// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  cols: 4, // 横方向の頂点数
  rows: 4, // 縦方向の頂点数
  resolution: 220, // 内部描画解像度（大きいほど滑らか）
  saturation: 75, // 彩度（%）
  lightness: 55, // 明度（%）
  hueBase: 200, // 基本色相
  hueSpread: 180, // 色相の広がり
  animationSpeed: 0.3, // 色の変化速度
  warp: 0.15, // 頂点の揺らぎ量
  smoothness: 1, // 補間の滑らかさ（0:バイリニア, 1:smoothstep）
  grain: 0.04, // ノイズ量
  seed: 1, // 色配置シード
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

const offscreen = document.createElement('canvas');
const offCtx = /** @type {CanvasRenderingContext2D} */ (
  offscreen.getContext('2d')
);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- メッシュ ---

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

/** @typedef {{h:number, s:number, l:number, phase:number}} Vertex */
/** @type {Vertex[][]} */
let mesh = [];

function buildMesh() {
  const cols = Math.max(2, Math.round(params.cols));
  const rows = Math.max(2, Math.round(params.rows));
  const rng = createRng(params.seed);
  mesh = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const h = params.hueBase + (rng() - 0.5) * params.hueSpread;
      row.push({
        h,
        s: params.saturation,
        l: params.lightness,
        phase: rng() * Math.PI * 2,
      });
    }
    mesh.push(row);
  }
}

buildMesh();

// --- HSL -> RGB ---

/**
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {[number, number, number]}
 */
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return [f(0), f(8), f(4)];
}

// --- 描画 ---

let time = 0;

function draw() {
  time += params.animationSpeed / 60;
  const res = Math.max(40, Math.round(params.resolution));
  const aspect = canvas.width / canvas.height;
  const W = aspect >= 1 ? res : Math.round(res * aspect);
  const H = aspect >= 1 ? Math.round(res / aspect) : res;
  if (offscreen.width !== W || offscreen.height !== H) {
    offscreen.width = W;
    offscreen.height = H;
  }
  const cols = Math.max(2, Math.round(params.cols));
  const rows = Math.max(2, Math.round(params.rows));
  const img = offCtx.createImageData(W, H);
  const data = img.data;

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const u = px / (W - 1);
      const v = py / (H - 1);
      // 頂点揺らぎを UV に反映
      const uw =
        u +
        Math.sin(time * 1.1 + v * 6.283) * params.warp * 0.5 -
        params.warp * 0.25;
      const vw =
        v +
        Math.cos(time * 0.9 + u * 6.283) * params.warp * 0.5 -
        params.warp * 0.25;
      const fu = Math.max(0, Math.min(0.9999, uw)) * (cols - 1);
      const fv = Math.max(0, Math.min(0.9999, vw)) * (rows - 1);
      const i0 = Math.floor(fu);
      const j0 = Math.floor(fv);
      const i1 = Math.min(cols - 1, i0 + 1);
      const j1 = Math.min(rows - 1, j0 + 1);
      let tx = fu - i0;
      let ty = fv - j0;
      if (params.smoothness >= 0.5) {
        tx = tx * tx * (3 - 2 * tx);
        ty = ty * ty * (3 - 2 * ty);
      }
      const va = mesh[j0][i0];
      const vb = mesh[j0][i1];
      const vc = mesh[j1][i0];
      const vd = mesh[j1][i1];
      const ha = va.h + Math.sin(time + va.phase) * 10;
      const hb = vb.h + Math.sin(time + vb.phase) * 10;
      const hc = vc.h + Math.sin(time + vc.phase) * 10;
      const hd = vd.h + Math.sin(time + vd.phase) * 10;
      const h =
        (ha * (1 - tx) + hb * tx) * (1 - ty) + (hc * (1 - tx) + hd * tx) * ty;
      const [r, g, b] = hslToRgb(h, params.saturation, params.lightness);
      const noise = (Math.random() - 0.5) * 255 * params.grain;
      const idx = (py * W + px) * 4;
      data[idx] = Math.max(0, Math.min(255, r + noise));
      data[idx + 1] = Math.max(0, Math.min(255, g + noise));
      data[idx + 2] = Math.max(0, Math.min(255, b + noise));
      data[idx + 3] = 255;
    }
  }
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(draw);
}
draw();

// --- GUI ---

const gui = new TileUI({
  title: 'Gradient Mesh',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'cols', 2, 8, 1).onChange(buildMesh);
gui.add(params, 'rows', 2, 8, 1).onChange(buildMesh);
gui.add(params, 'resolution', 80, 400, 10);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 20, 80, 1);
gui.add(params, 'hueBase', 0, 360, 1).onChange(buildMesh);
gui.add(params, 'hueSpread', 0, 360, 1).onChange(buildMesh);
gui.add(params, 'animationSpeed', -1, 1, 0.01);
gui.add(params, 'warp', 0, 0.5, 0.005);
gui.add(params, 'smoothness', 0, 1, 1);
gui.add(params, 'grain', 0, 0.2, 0.005);
gui.add(params, 'seed', 1, 9999, 1).onChange(buildMesh);

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
  params.cols = r(3, 6, 1);
  params.rows = r(3, 6, 1);
  params.hueBase = r(0, 360, 1);
  params.hueSpread = r(60, 300, 1);
  params.warp = r(0.05, 0.3, 0.005);
  params.saturation = r(50, 90, 1);
  params.lightness = r(40, 65, 1);
  params.seed = r(1, 9999, 1);
  buildMesh();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  buildMesh();
  gui.updateDisplay();
});
