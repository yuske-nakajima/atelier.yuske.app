// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  rings: 7,
  ringStep: 22,
  barbs: 240,
  barbLength: 160,
  curl: 0.25,
  centerHue: 280,
  midHue: 200,
  outerHue: 50,
  saturation: 80,
  eyeSize: 80,
  sheen: 0.5,
  barbThickness: 0.6,
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

function draw() {
  ctx.fillStyle = '#060a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  // 羽軸から伸びる小羽枝
  ctx.lineCap = 'round';
  for (let i = 0; i < params.barbs; i++) {
    const a = (i / params.barbs) * Math.PI * 2;
    const len = params.barbLength + params.eyeSize;
    const ex = cx + Math.cos(a + params.curl) * len;
    const ey = cy + Math.sin(a + params.curl) * len;
    const grd = ctx.createLinearGradient(cx, cy, ex, ey);
    grd.addColorStop(
      0,
      `hsla(${params.centerHue}, ${params.saturation}%, 30%, 0)`,
    );
    grd.addColorStop(
      0.5,
      `hsla(${params.midHue}, ${params.saturation}%, 40%, 0.7)`,
    );
    grd.addColorStop(
      1,
      `hsla(${params.outerHue}, ${params.saturation}%, 55%, 0.6)`,
    );
    ctx.strokeStyle = grd;
    ctx.lineWidth = params.barbThickness;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const midX = cx + Math.cos(a) * len * 0.5;
    const midY = cy + Math.sin(a) * len * 0.5;
    ctx.quadraticCurveTo(midX, midY, ex, ey);
    ctx.stroke();
  }
  // 目玉リング
  for (let r = params.rings; r > 0; r--) {
    const radius = r * params.ringStep;
    const t = r / params.rings;
    const hue =
      params.centerHue * (1 - t) * 0.5 +
      params.midHue * (t * 0.7) +
      params.outerHue * (t > 0.7 ? (t - 0.7) * 2 : 0);
    ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${30 + t * 30}%)`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  // 中心
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, params.eyeSize);
  grd.addColorStop(0, `hsl(${params.centerHue}, ${params.saturation}%, 12%)`);
  grd.addColorStop(1, `hsl(${params.centerHue}, ${params.saturation}%, 30%)`);
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, params.eyeSize, 0, Math.PI * 2);
  ctx.fill();
  // シーン
  ctx.fillStyle = `hsla(${params.midHue}, 90%, 85%, ${params.sheen})`;
  ctx.beginPath();
  ctx.arc(
    cx - params.eyeSize * 0.3,
    cy - params.eyeSize * 0.3,
    params.eyeSize * 0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Peacock Feather Eye',
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
  ['rings', 3, 14, 1],
  ['ringStep', 8, 50, 1],
  ['barbs', 60, 600, 2],
  ['barbLength', 60, 400, 1],
  ['curl', -1, 1, 0.01],
  ['centerHue', 0, 360, 1],
  ['midHue', 0, 360, 1],
  ['outerHue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['eyeSize', 20, 200, 1],
  ['sheen', 0, 1, 0.01],
  ['barbThickness', 0.1, 3, 0.05],
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
  params.rings = rand(4, 10, 1);
  params.ringStep = rand(15, 35, 1);
  params.barbs = rand(120, 400, 2);
  params.centerHue = rand(0, 360, 1);
  params.midHue = rand(0, 360, 1);
  params.outerHue = rand(0, 360, 1);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
