// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// L-tromino（L型3連結正方形）を再帰的に自己相似分割する Rep-Tile
const params = {
  depth: 5,
  hue: 280,
  hueRange: 120,
  saturation: 60,
  lightness: 55,
  padding: 40,
  edgeAlpha: 0.4,
  edgeWidth: 0.8,
  rotation: 0,
  glow: 4,
  mode: 1, // 1: L-tromino, 2: Sphinx hexiamond
};
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

// L-tromino を 4 つの半分サイズの L に分割
function subdivideL(poly, depth, seed) {
  if (depth === 0) return [[poly, seed]];
  // poly はバウンディングボックス [x,y,w,h]
  const [x, y, w, h] = poly;
  const w2 = w / 2;
  const h2 = h / 2;
  // 4 つの L 配置（簡易版: 田の字分割の 3 マスを L として扱う）
  const subs = [
    [x, y, w2, h2, 0],
    [x + w2, y, w2, h2, 1],
    [x, y + h2, w2, h2, 2],
    [x + w2, y + h2, w2, h2, 3],
  ];
  let out = [];
  for (let k = 0; k < 4; k++)
    out = out.concat(
      subdivideL(
        [subs[k][0], subs[k][1], subs[k][2], subs[k][3]],
        depth - 1,
        seed * 5 + k,
      ),
    );
  return out;
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const pad = params.padding;
  const S = Math.min(canvas.width, canvas.height) - pad * 2;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rot = (params.rotation * Math.PI) / 180;
  const c = Math.cos(rot);
  const si = Math.sin(rot);
  const parts = subdivideL(
    [-S / 2, -S / 2, S, S],
    Math.max(0, Math.min(7, params.depth | 0)),
    1,
  );
  for (const [[x, y, w, h], seed] of parts) {
    const hue =
      (params.hue + ((seed * 97) % 360) * (params.hueRange / 360)) % 360;
    ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.shadowColor = ctx.fillStyle;
    // L 形（田の字から右上欠け）
    const pts =
      (seed & 3) === 0
        ? [
            [x, y],
            [x + w, y],
            [x + w, y + h / 2],
            [x + w / 2, y + h / 2],
            [x + w / 2, y + h],
            [x, y + h],
          ]
        : [
            [x, y],
            [x + w, y],
            [x + w, y + h],
            [x, y + h],
          ];
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const [px, py] = pts[i];
      const rx = px * c - py * si + cx;
      const ry = px * si + py * c + cy;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = params.edgeWidth;
    ctx.strokeStyle = `rgba(0,0,0,${params.edgeAlpha})`;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
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
  title: 'Rep-Tiles',
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
gui.add(params, 'depth', 0, 7, 1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueRange', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'padding', 0, 200, 1).onChange(onChange);
gui.add(params, 'edgeAlpha', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'edgeWidth', 0, 4, 0.1).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(3, 6, 1);
  params.hue = rand(0, 360, 1);
  params.hueRange = rand(40, 300, 1);
  params.saturation = rand(30, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotation = rand(0, 360, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
