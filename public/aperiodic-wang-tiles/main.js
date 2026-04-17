// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Wang タイル風：辺の色が隣接タイルと一致するように配置する
const params = {
  size: 48,
  colorCount: 4,
  hue: 200,
  hueShift: 90,
  saturation: 65,
  lightness: 55,
  bg: 12,
  showEdge: true,
  edgeWidth: 1,
  centerDot: 0.15,
  glow: 3,
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

// グリッド上の辺に色を割り当てる（横 H、縦 V の色）
function buildGrid(cols, rows) {
  const nColors = Math.max(2, params.colorCount | 0);
  const H = []; // 横辺 (cols, rows+1)
  const V = []; // 縦辺 (cols+1, rows)
  for (let j = 0; j <= rows; j++) {
    const row = [];
    for (let i = 0; i < cols; i++)
      row.push(Math.floor(Math.random() * nColors));
    H.push(row);
  }
  for (let j = 0; j < rows; j++) {
    const row = [];
    for (let i = 0; i <= cols; i++)
      row.push(Math.floor(Math.random() * nColors));
    V.push(row);
  }
  return { H, V, nColors };
}

function hueOf(idx, n) {
  return (params.hue + (idx / n) * params.hueShift * 2) % 360;
}

function draw() {
  ctx.fillStyle = `rgb(${params.bg},${params.bg},${params.bg + 4})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const s = Math.max(16, params.size);
  const cols = Math.ceil(canvas.width / s) + 1;
  const rows = Math.ceil(canvas.height / s) + 1;
  const { H, V, nColors } = buildGrid(cols, rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * s;
      const y = j * s;
      const top = H[j][i];
      const bot = H[j + 1][i];
      const left = V[j][i];
      const right = V[j][i + 1];
      const colors = [top, right, bot, left];
      // 中央から 4 三角形を塗る
      ctx.save();
      ctx.translate(x + s / 2, y + s / 2);
      for (let k = 0; k < 4; k++) {
        const angle = (k * Math.PI) / 2 - Math.PI / 4;
        ctx.fillStyle = `hsl(${hueOf(colors[k], nColors)}, ${params.saturation}%, ${params.lightness}%)`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
          (Math.cos(angle) * s) / Math.SQRT2,
          (Math.sin(angle) * s) / Math.SQRT2,
        );
        ctx.lineTo(
          (Math.cos(angle + Math.PI / 2) * s) / Math.SQRT2,
          (Math.sin(angle + Math.PI / 2) * s) / Math.SQRT2,
        );
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      if (params.showEdge) {
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = params.edgeWidth;
        ctx.strokeRect(x, y, s, s);
      }
      if (params.centerDot > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(x + s / 2, y + s / 2, s * params.centerDot, 0, Math.PI * 2);
        ctx.fill();
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
  title: 'Aperiodic Wang Tiles',
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
gui.add(params, 'size', 20, 120, 1).onChange(onChange);
gui.add(params, 'colorCount', 2, 8, 1).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 180, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'edgeWidth', 0, 4, 0.1).onChange(onChange);
gui.add(params, 'centerDot', 0, 0.4, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'showEdge').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.size = rand(28, 80, 1);
  params.colorCount = rand(3, 6, 1);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(30, 160, 1);
  params.saturation = rand(30, 80, 1);
  params.lightness = rand(40, 70, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
