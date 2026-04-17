// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  nodes: 24,
  relaxIter: 5,
  connectK: 3,
  curve: 0.3,
  minDist: 40,
  thickness: 4,
  hue: 50,
  saturation: 70,
  lightness: 50,
  bgLightness: 5,
  foodCount: 8,
  pulse: 0.4,
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

let time = 0;

function draw() {
  ctx.fillStyle = `hsl(${params.hue}, 20%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  time += 1 / 60;
  // ノード配置
  const nodes = [];
  const n = Math.round(params.nodes);
  for (let i = 0; i < n; i++) {
    nodes.push([rnd() * canvas.width, rnd() * canvas.height]);
  }
  // Lloyd relaxation風
  for (let it = 0; it < Math.round(params.relaxIter); it++) {
    for (let i = 0; i < n; i++) {
      let fx = 0;
      let fy = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = nodes[i][0] - nodes[j][0];
        const dy = nodes[i][1] - nodes[j][1];
        const d = Math.hypot(dx, dy);
        if (d < params.minDist * 2 && d > 0.001) {
          const f = (params.minDist * 2 - d) / d;
          fx += dx * f * 0.1;
          fy += dy * f * 0.1;
        }
      }
      nodes[i][0] += fx;
      nodes[i][1] += fy;
    }
  }
  // 接続：最近k個
  const K = Math.round(params.connectK);
  const edges = new Set();
  for (let i = 0; i < n; i++) {
    const distances = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = nodes[i][0] - nodes[j][0];
      const dy = nodes[i][1] - nodes[j][1];
      distances.push([j, dx * dx + dy * dy]);
    }
    distances.sort((a, b) => a[1] - b[1]);
    for (let k = 0; k < Math.min(K, distances.length); k++) {
      const j = distances[k][0];
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      edges.add(key);
    }
  }
  // 描画
  ctx.lineCap = 'round';
  for (const key of edges) {
    const [a, b] = key.split('-').map(Number);
    const pulse = 0.5 + 0.5 * Math.sin(time * 2 + a + b);
    const flow = 1 + pulse * params.pulse;
    const mx = (nodes[a][0] + nodes[b][0]) / 2;
    const my = (nodes[a][1] + nodes[b][1]) / 2;
    const dx = nodes[b][0] - nodes[a][0];
    const dy = nodes[b][1] - nodes[a][1];
    const nx = -dy;
    const ny = dx;
    const off = params.curve * (rnd() - 0.5);
    const grd = ctx.createLinearGradient(
      nodes[a][0],
      nodes[a][1],
      nodes[b][0],
      nodes[b][1],
    );
    grd.addColorStop(
      0,
      `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`,
    );
    grd.addColorStop(
      0.5,
      `hsl(${params.hue + 20}, ${params.saturation}%, ${params.lightness + 10}%)`,
    );
    grd.addColorStop(
      1,
      `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`,
    );
    ctx.strokeStyle = grd;
    ctx.lineWidth = params.thickness * flow;
    ctx.beginPath();
    ctx.moveTo(nodes[a][0], nodes[a][1]);
    ctx.quadraticCurveTo(
      mx + nx * off,
      my + ny * off,
      nodes[b][0],
      nodes[b][1],
    );
    ctx.stroke();
  }
  // ノード
  for (const [x, y] of nodes) {
    ctx.fillStyle = `hsl(${params.hue + 30}, ${params.saturation}%, ${params.lightness + 20}%)`;
    ctx.beginPath();
    ctx.arc(x, y, params.thickness * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // 食物点
  ctx.fillStyle = `hsla(${(params.hue + 180) % 360}, 80%, 70%, 0.9)`;
  for (let i = 0; i < params.foodCount; i++) {
    const x = rnd() * canvas.width;
    const y = rnd() * canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
draw();

const gui = new TileUI({
  title: 'Slime Mold Transport Net',
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
  ['nodes', 5, 80, 1],
  ['relaxIter', 0, 20, 1],
  ['connectK', 1, 8, 1],
  ['curve', 0, 1.5, 0.01],
  ['minDist', 10, 200, 1],
  ['thickness', 1, 12, 0.25],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 20, 80, 1],
  ['bgLightness', 0, 30, 1],
  ['foodCount', 0, 40, 1],
  ['pulse', 0, 1, 0.01],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s);
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
  params.nodes = rand(15, 50, 1);
  params.connectK = rand(2, 5, 1);
  params.curve = rand(0.1, 0.8, 0.01);
  params.hue = rand(0, 360, 1);
  pageSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  pageSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
});
