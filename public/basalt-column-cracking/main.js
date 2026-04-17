// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  cellSize: 70,
  relaxation: 0.5,
  gap: 4,
  edgeJitter: 0.1,
  points: 220,
  hue: 25,
  saturation: 15,
  lightness: 20,
  rimLightness: 50,
  opacity: 1,
  fillVariance: 8,
  cracks: 0.3,
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

let seed = 1;
function setSeed(n) {
  seed = n >>> 0 || 1;
}
function rnd() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) % 100000) / 100000;
}

let pageSeed = Math.floor(Math.random() * 1e9);

/**
 * Voronoi-like partition by nearest site
 */
function draw() {
  ctx.fillStyle = '#0a0806';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  // 六角配列のシード点 + ランダム
  const n = Math.round(params.points);
  const sites = [];
  const s = params.cellSize;
  for (let y = 0; y < canvas.height + s; y += s * 0.866) {
    for (let x = 0; x < canvas.width + s; x += s) {
      const off = Math.floor(y / (s * 0.866)) % 2 ? s / 2 : 0;
      const jx = (rnd() - 0.5) * s * params.relaxation;
      const jy = (rnd() - 0.5) * s * params.relaxation;
      sites.push([x + off + jx, y + jy]);
    }
    if (sites.length > n) break;
  }
  // ピクセル走査は重いので細かめのグリッドで擬似ボロノイ
  const grid = 6;
  const W = Math.ceil(canvas.width / grid);
  const H = Math.ceil(canvas.height / grid);
  const cellMap = new Int32Array(W * H);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const px = i * grid;
      const py = j * grid;
      let best = Infinity;
      let bi = 0;
      for (let k = 0; k < sites.length; k++) {
        const dx = sites[k][0] - px;
        const dy = sites[k][1] - py;
        const d = dx * dx + dy * dy;
        if (d < best) {
          best = d;
          bi = k;
        }
      }
      cellMap[j * W + i] = bi;
    }
  }
  // セル描画
  for (let k = 0; k < sites.length; k++) {
    const v = (rnd() - 0.5) * params.fillVariance;
    ctx.fillStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness + v}%, ${params.opacity})`;
    ctx.beginPath();
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        if (cellMap[j * W + i] === k) {
          ctx.rect(i * grid, j * grid, grid, grid);
        }
      }
    }
    ctx.fill();
  }
  // 縁（隣接セルの境界）
  ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.rimLightness}%, 0.7)`;
  ctx.lineWidth = params.gap * 0.25;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const c = cellMap[j * W + i];
      if (i + 1 < W && cellMap[j * W + i + 1] !== c) {
        ctx.beginPath();
        ctx.moveTo((i + 1) * grid, j * grid);
        ctx.lineTo((i + 1) * grid, (j + 1) * grid);
        ctx.stroke();
      }
      if (j + 1 < H && cellMap[(j + 1) * W + i] !== c) {
        ctx.beginPath();
        ctx.moveTo(i * grid, (j + 1) * grid);
        ctx.lineTo((i + 1) * grid, (j + 1) * grid);
        ctx.stroke();
      }
    }
  }
  // 亀裂
  if (params.cracks > 0) {
    ctx.strokeStyle = `hsla(${params.hue}, 10%, 5%, ${params.cracks})`;
    ctx.lineWidth = 1;
    for (let k = 0; k < sites.length * params.cracks; k++) {
      const i = Math.floor(rnd() * sites.length);
      const [x, y] = sites[i];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 20, y + (rnd() - 0.5) * 20);
      ctx.stroke();
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Basalt Column Cracking',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

/** @type {Array<[keyof typeof params, number, number, number]>} */
const ctrls = [
  ['cellSize', 30, 160, 1],
  ['relaxation', 0, 1, 0.01],
  ['gap', 1, 12, 0.25],
  ['edgeJitter', 0, 1, 0.01],
  ['points', 30, 600, 1],
  ['hue', 0, 360, 1],
  ['saturation', 0, 80, 1],
  ['lightness', 5, 60, 1],
  ['rimLightness', 20, 90, 1],
  ['opacity', 0.2, 1, 0.01],
  ['fillVariance', 0, 30, 0.5],
  ['cracks', 0, 1, 0.01],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s).onChange(redraw);
}

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

gui.addButton('Random', () => {
  params.cellSize = rand(40, 120, 1);
  params.relaxation = rand(0.1, 0.8, 0.01);
  params.hue = rand(0, 360, 1);
  params.saturation = rand(5, 40, 1);
  params.lightness = rand(10, 35, 1);
  pageSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  pageSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
