// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// カイロ五角形タイリング（4 種回転の五角形で敷き詰める）
const params = {
  size: 50,
  hue: 340,
  hueShift: 40,
  saturation: 55,
  lightness: 55,
  edgeAlpha: 0.5,
  edgeWidth: 1,
  skew: 0.5,
  padding: 0,
  bg: 10,
  glow: 4,
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

// カイロ五角形の正規化頂点（0 方向）
function cairoPoints(s, skew) {
  const k = s * skew;
  return [
    [-s, 0],
    [-k, -s],
    [k, -s],
    [s, 0],
    [0, s * 0.7],
  ];
}

function drawPoly(pts, cx, cy, rot, fill, stroke) {
  const c = Math.cos(rot);
  const si = Math.sin(rot);
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const px = cx + x * c - y * si;
    const py = cy + x * si + y * c;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.shadowColor = fill;
  ctx.fill();
  ctx.lineWidth = params.edgeWidth;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = `rgb(${params.bg},${params.bg},${params.bg + 4})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const s = Math.max(16, params.size);
  const pts = cairoPoints(s, params.skew);
  const stepX = s * 2.2;
  const stepY = s * 2.2;
  const cols = Math.ceil(canvas.width / stepX) + 2;
  const rows = Math.ceil(canvas.height / stepY) + 2;
  const stroke = `rgba(0,0,0,${params.edgeAlpha})`;
  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      const cx = i * stepX + (j & 1 ? stepX / 2 : 0);
      const cy = j * stepY;
      for (let k = 0; k < 4; k++) {
        const rot = (k * Math.PI) / 2;
        const hue = (params.hue + (k * params.hueShift + (i + j) * 5)) % 360;
        const fill = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
        const ox = Math.cos(rot + Math.PI / 4) * s * 1.1;
        const oy = Math.sin(rot + Math.PI / 4) * s * 1.1;
        drawPoly(pts, cx + ox, cy + oy, rot, fill, stroke);
      }
    }
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
  title: 'Cairo Tiling',
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
gui.add(params, 'size', 16, 100, 1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'edgeAlpha', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'edgeWidth', 0, 4, 0.1).onChange(onChange);
gui.add(params, 'skew', 0.2, 1, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.size = rand(24, 80, 1);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0, 180, 1);
  params.saturation = rand(30, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.skew = rand(0.3, 0.8, 0.01);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
