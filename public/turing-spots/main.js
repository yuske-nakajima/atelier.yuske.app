// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  spacing: 46,
  radius: 14,
  jitter: 0.5,
  relaxIter: 3,
  deform: 0.25,
  hueSpot: 25,
  hueBg: 200,
  saturation: 55,
  lightSpot: 55,
  lightBg: 22,
  edgeSoft: 0.2,
  speckleCount: 0.3,
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
  ctx.fillStyle = `hsl(${params.hueBg}, ${params.saturation}%, ${params.lightBg}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const s = params.spacing;
  const pts = [];
  for (let y = s; y < canvas.height; y += s * 0.866) {
    for (let x = s; x < canvas.width; x += s) {
      const off = Math.floor(y / (s * 0.866)) % 2 ? s / 2 : 0;
      pts.push([
        x + off + (rnd() - 0.5) * s * params.jitter,
        y + (rnd() - 0.5) * s * params.jitter,
      ]);
    }
  }
  // リラックス：最近接との反発
  for (let it = 0; it < Math.round(params.relaxIter); it++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j][0] - pts[i][0];
        const dy = pts[j][1] - pts[i][1];
        const d = Math.hypot(dx, dy);
        if (d > s || d < 1e-4) continue;
        const push = (s - d) / 2;
        const ux = dx / d;
        const uy = dy / d;
        pts[i][0] -= ux * push * 0.2;
        pts[i][1] -= uy * push * 0.2;
        pts[j][0] += ux * push * 0.2;
        pts[j][1] += uy * push * 0.2;
      }
    }
  }
  // スポット描画（不規則楕円）
  for (const [cx, cy] of pts) {
    const rx = params.radius * (1 + (rnd() - 0.5) * params.deform);
    const ry = params.radius * (1 + (rnd() - 0.5) * params.deform);
    const rot = rnd() * Math.PI;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(1, ry / rx);
    // 変形後のローカル座標でグラデーションを作成しないと
    // 中心がズレて最外（透明）色のみが適用されスポットが描画されない
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    grd.addColorStop(
      0,
      `hsl(${params.hueSpot}, ${params.saturation}%, ${params.lightSpot + 10}%)`,
    );
    grd.addColorStop(
      Math.max(0, Math.min(1, 1 - params.edgeSoft)),
      `hsl(${params.hueSpot}, ${params.saturation}%, ${params.lightSpot}%)`,
    );
    grd.addColorStop(
      1,
      `hsla(${params.hueSpot}, ${params.saturation}%, ${params.lightSpot}%, 0)`,
    );
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // スペックル
  if (params.speckleCount > 0) {
    ctx.fillStyle = `hsla(${params.hueSpot}, 60%, 70%, ${params.speckleCount * 0.6})`;
    const speckleN = Math.round(
      canvas.width * canvas.height * 0.00005 * params.speckleCount,
    );
    for (let i = 0; i < speckleN; i++) {
      ctx.fillRect(rnd() * canvas.width, rnd() * canvas.height, 1, 1);
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Turing Spots',
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
  ['spacing', 20, 120, 1],
  ['radius', 4, 50, 0.5],
  ['jitter', 0, 1, 0.01],
  ['relaxIter', 0, 8, 1],
  ['deform', 0, 0.8, 0.01],
  ['hueSpot', 0, 360, 1],
  ['hueBg', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightSpot', 20, 90, 1],
  ['lightBg', 0, 60, 1],
  ['edgeSoft', 0, 1, 0.01],
  ['speckleCount', 0, 1, 0.01],
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
  params.spacing = rand(30, 80, 1);
  params.radius = rand(8, 25, 0.5);
  params.jitter = rand(0.1, 0.7, 0.01);
  params.hueSpot = rand(0, 360, 1);
  params.hueBg = rand(0, 360, 1);
  params.saturation = rand(30, 80, 1);
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
