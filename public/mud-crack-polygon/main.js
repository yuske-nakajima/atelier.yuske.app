// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  cellSize: 60,
  relaxation: 0.6,
  crackWidth: 3,
  crackColor: 10,
  mudHue: 30,
  mudSaturation: 40,
  mudLightness: 35,
  lightVariance: 12,
  shrink: 0.12,
  dryness: 0.7,
  highlight: 0.3,
  subCrack: 0.5,
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

function draw() {
  ctx.fillStyle = `hsl(${params.crackColor}, 20%, 5%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const s = params.cellSize;
  // ランダム格子シード
  const sites = [];
  for (let y = -s; y < canvas.height + s; y += s) {
    for (let x = -s; x < canvas.width + s; x += s) {
      sites.push([
        x + (rnd() - 0.5) * s * params.relaxation,
        y + (rnd() - 0.5) * s * params.relaxation,
      ]);
    }
  }
  const grid = 4;
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
  // セル色
  for (let k = 0; k < sites.length; k++) {
    const v = (rnd() - 0.5) * params.lightVariance;
    ctx.fillStyle = `hsl(${params.mudHue}, ${params.mudSaturation}%, ${params.mudLightness + v}%)`;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        if (cellMap[j * W + i] === k) {
          ctx.fillRect(i * grid, j * grid, grid, grid);
        }
      }
    }
  }
  // 亀裂（境界）
  ctx.strokeStyle = `hsla(${params.crackColor}, 30%, 3%, ${params.dryness})`;
  ctx.lineWidth = params.crackWidth;
  ctx.lineCap = 'round';
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
  // サブ亀裂
  if (params.subCrack > 0) {
    ctx.strokeStyle = `hsla(${params.crackColor}, 30%, 8%, ${params.subCrack * 0.6})`;
    ctx.lineWidth = params.crackWidth * 0.4;
    for (let k = 0; k < sites.length; k++) {
      if (rnd() > params.subCrack) continue;
      const [x, y] = sites[k];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * s, y + (rnd() - 0.5) * s);
      ctx.stroke();
    }
  }
  // 乾きハイライト
  ctx.fillStyle = `hsla(${params.mudHue}, 30%, 70%, ${params.highlight * 0.2})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3);
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Mud Crack Polygon',
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
  ['cellSize', 25, 150, 1],
  ['relaxation', 0, 1, 0.01],
  ['crackWidth', 0.5, 10, 0.25],
  ['crackColor', 0, 60, 1],
  ['mudHue', 0, 360, 1],
  ['mudSaturation', 0, 80, 1],
  ['mudLightness', 15, 60, 1],
  ['lightVariance', 0, 30, 0.5],
  ['shrink', 0, 0.3, 0.01],
  ['dryness', 0.2, 1, 0.01],
  ['highlight', 0, 1, 0.01],
  ['subCrack', 0, 1, 0.01],
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
  params.cellSize = rand(35, 110, 1);
  params.relaxation = rand(0.3, 0.9, 0.01);
  params.crackWidth = rand(1, 6, 0.25);
  params.mudHue = rand(15, 45, 1);
  params.mudSaturation = rand(20, 60, 1);
  params.mudLightness = rand(25, 55, 1);
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
