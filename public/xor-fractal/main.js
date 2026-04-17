// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// (x XOR y) や (x AND y), (x OR y) を mod で取るとシェルピンスキー風のフラクタル模様が現れる。

const params = {
  resolution: 512, // 解像度（1 辺のセル数）
  operator: 0, // 0:XOR, 1:AND, 2:OR, 3:(x*y)
  modulus: 16, // mod
  scaleX: 1, // x スケール
  scaleY: 1, // y スケール
  offsetX: 0, // オフセット x
  offsetY: 0, // オフセット y
  hueBase: 180, // 色相
  hueRange: 180, // 色相幅
  saturation: 65, // 彩度
  lightness: 55, // 明度
  bg: 8, // 背景明度
  invert: 0, // 反転
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
 * @param {number} x
 * @param {number} y
 */
function op(x, y) {
  switch (params.operator) {
    case 0:
      return x ^ y;
    case 1:
      return x & y;
    case 2:
      return x | y;
    default:
      return (x * y) | 0;
  }
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);
  const res = Math.floor(params.resolution);
  const size = Math.min(w, h);
  const cell = size / res;
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;
  const m = Math.max(2, Math.floor(params.modulus));

  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const x = Math.floor((i + params.offsetX) * params.scaleX);
      const y = Math.floor((j + params.offsetY) * params.scaleY);
      const v = op(x, y) % m;
      if (params.invert && v === 0) continue;
      if (!params.invert && v === 0) continue;
      const t = v / m;
      const hue = (params.hueBase + t * params.hueRange) % 360;
      ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
      ctx.fillRect(ox + i * cell, oy + j * cell, cell + 0.5, cell + 0.5);
    }
  }
}
resize();

// --- GUI ---

const gui = new TileUI({
  title: 'XOR Fractal',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'resolution', 64, 1024, 16).onChange(draw);
gui.add(params, 'operator', 0, 3, 1).onChange(draw);
gui.add(params, 'modulus', 2, 64, 1).onChange(draw);
gui.add(params, 'scaleX', 1, 8, 1).onChange(draw);
gui.add(params, 'scaleY', 1, 8, 1).onChange(draw);
gui.add(params, 'offsetX', 0, 512, 1).onChange(draw);
gui.add(params, 'offsetY', 0, 512, 1).onChange(draw);
gui.add(params, 'hueBase', 0, 360, 1).onChange(draw);
gui.add(params, 'hueRange', 0, 360, 1).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 20, 90, 1).onChange(draw);
gui.add(params, 'bg', 0, 30, 1).onChange(draw);

gui.addButton('Random', () => {
  params.operator = Math.floor(Math.random() * 4);
  params.modulus = 2 + Math.floor(Math.random() * 30);
  params.hueBase = Math.floor(Math.random() * 360);
  params.hueRange = Math.floor(Math.random() * 300);
  params.scaleX = 1 + Math.floor(Math.random() * 4);
  params.scaleY = 1 + Math.floor(Math.random() * 4);
  gui.updateDisplay();
  draw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
