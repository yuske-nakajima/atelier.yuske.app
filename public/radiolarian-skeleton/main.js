// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  nodes: 72,
  radius: 240,
  connectDist: 80,
  spikes: 24,
  spikeLength: 70,
  hue: 190,
  saturation: 55,
  lightness: 75,
  bgLightness: 6,
  lineWidth: 1.2,
  jitter: 10,
  layers: 3,
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
  ctx.fillStyle = `hsl(${params.hue}, 20%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const layers = Math.round(params.layers);
  for (let layer = 0; layer < layers; layer++) {
    const r = params.radius * (0.4 + (layer / layers) * 0.6);
    const nodes = [];
    const n = Math.round(params.nodes * ((layer + 1) / layers));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.2;
      const rr = r + (rnd() - 0.5) * params.jitter;
      nodes.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    const alpha = 0.3 + (layer / layers) * 0.6;
    ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness}%, ${alpha})`;
    ctx.lineWidth = params.lineWidth;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j][0] - nodes[i][0];
        const dy = nodes[j][1] - nodes[i][1];
        const d = Math.hypot(dx, dy);
        if (d < params.connectDist) {
          ctx.beginPath();
          ctx.moveTo(nodes[i][0], nodes[i][1]);
          ctx.lineTo(nodes[j][0], nodes[j][1]);
          ctx.stroke();
        }
      }
    }
    ctx.fillStyle = `hsl(${params.hue}, ${params.saturation + 10}%, ${params.lightness + 10}%)`;
    for (const [x, y] of nodes) {
      ctx.beginPath();
      ctx.arc(x, y, params.lineWidth * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 棘
  ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness + 15}%, 0.9)`;
  ctx.lineWidth = params.lineWidth * 1.2;
  const spikes = Math.round(params.spikes);
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * params.radius;
    const y1 = cy + Math.sin(a) * params.radius;
    const x2 = cx + Math.cos(a) * (params.radius + params.spikeLength);
    const y2 = cy + Math.sin(a) * (params.radius + params.spikeLength);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Radiolarian Skeleton',
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
  ['nodes', 20, 240, 2],
  ['radius', 80, 400, 2],
  ['connectDist', 20, 200, 1],
  ['spikes', 0, 60, 1],
  ['spikeLength', 0, 160, 1],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 30, 95, 1],
  ['bgLightness', 0, 30, 1],
  ['lineWidth', 0.3, 4, 0.05],
  ['jitter', 0, 40, 0.5],
  ['layers', 1, 6, 1],
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
  params.nodes = rand(40, 140, 2);
  params.connectDist = rand(30, 120, 1);
  params.spikes = rand(10, 40, 1);
  params.hue = rand(0, 360, 1);
  params.layers = rand(1, 5, 1);
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
