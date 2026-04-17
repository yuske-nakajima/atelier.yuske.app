// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  barbCount: 180,
  shaftLength: 560,
  barbLength: 90,
  taperStart: 0.1,
  taperEnd: 0.95,
  angle: 35,
  curl: 0.3,
  hueA: 30,
  hueB: 210,
  saturation: 55,
  lightness: 55,
  thickness: 1,
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
  ctx.fillStyle = '#080606';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const topY = canvas.height / 2 - params.shaftLength / 2;
  ctx.lineCap = 'round';
  const N = Math.round(params.barbCount);
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const y = topY + t * params.shaftLength;
    const bandT = Math.sin(t * Math.PI) ** 0.7;
    const length =
      params.barbLength *
      bandT *
      (t < 0.08 ? t / 0.08 : 1) *
      (t > 0.95 ? (1 - t) * 20 : 1);
    const hue = params.hueA + (params.hueB - params.hueA) * bandT;
    ctx.strokeStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.lineWidth = params.thickness;
    const ang = (params.angle * Math.PI) / 180;
    for (const sign of [-1, 1]) {
      const ex = cx + sign * Math.cos(ang) * length;
      const ey = y + Math.sin(ang) * length * 0.3;
      const mx = cx + sign * Math.cos(ang) * length * 0.5;
      const my =
        y +
        Math.sin(ang) * length * 0.15 +
        Math.sin(t * Math.PI * 4) * params.curl * 10;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    }
  }
  // シャフト
  ctx.strokeStyle = `hsl(${params.hueA}, 20%, 80%)`;
  ctx.lineWidth = params.thickness * 3;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx, topY + params.shaftLength);
  ctx.stroke();
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Feather Barb Pattern',
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
  ['barbCount', 40, 500, 2],
  ['shaftLength', 200, 900, 5],
  ['barbLength', 20, 300, 2],
  ['taperStart', 0, 0.3, 0.01],
  ['taperEnd', 0.6, 1, 0.01],
  ['angle', 10, 80, 1],
  ['curl', 0, 2, 0.01],
  ['hueA', 0, 360, 1],
  ['hueB', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 20, 85, 1],
  ['thickness', 0.3, 3, 0.05],
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
  params.barbCount = rand(100, 300, 2);
  params.shaftLength = rand(400, 800, 5);
  params.barbLength = rand(60, 180, 2);
  params.angle = rand(20, 55, 1);
  params.curl = rand(0, 1, 0.01);
  params.hueA = rand(0, 360, 1);
  params.hueB = rand(0, 360, 1);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
