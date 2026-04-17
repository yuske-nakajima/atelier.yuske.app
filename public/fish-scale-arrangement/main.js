// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  cols: 50,
  rows: 40,
  scaleSize: 40,
  overlap: 0.5,
  arc: 0.7,
  hue: 200,
  saturation: 60,
  lightness: 55,
  shadow: 0.5,
  rimLight: 0.6,
  variance: 15,
  iridescence: 0.3,
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
  ctx.fillStyle = '#050608';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cols = Math.round(params.cols);
  const rows = Math.round(params.rows);
  const s = params.scaleSize;
  const dx = s * (1 - params.overlap);
  const dy = s * (1 - params.overlap) * 0.9;
  // 下から上へ重ねる
  for (let j = rows - 1; j >= 0; j--) {
    const offX = j % 2 ? dx / 2 : 0;
    for (let i = 0; i < cols; i++) {
      const cx = i * dx + offX;
      const cy = j * dy;
      const hueOff =
        (Math.sin(i * 0.3 + j * 0.2) * 0.5 + 0.5) * params.variance;
      const light = params.lightness + Math.sin(i + j) * 0.5 * 10;
      const hue = params.hue + hueOff * params.iridescence * 2;
      // うろこ本体（円弧）
      ctx.beginPath();
      ctx.arc(
        cx,
        cy - s * 0.3,
        s * params.arc,
        Math.PI * 0.2,
        Math.PI * 0.8,
        false,
      );
      ctx.lineTo(cx, cy + s * 0.4);
      ctx.closePath();
      const grd = ctx.createRadialGradient(
        cx,
        cy - s * 0.2,
        0,
        cx,
        cy - s * 0.2,
        s,
      );
      grd.addColorStop(0, `hsl(${hue}, ${params.saturation}%, ${light + 10}%)`);
      grd.addColorStop(
        1,
        `hsl(${hue + 30}, ${params.saturation}%, ${light - params.shadow * 30}%)`,
      );
      ctx.fillStyle = grd;
      ctx.fill();
      // リムライト
      ctx.strokeStyle = `hsla(${hue}, ${params.saturation}%, ${light + 25}%, ${params.rimLight})`;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.arc(
        cx,
        cy - s * 0.3,
        s * params.arc * 0.9,
        Math.PI * 0.2,
        Math.PI * 0.8,
      );
      ctx.stroke();
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Fish Scale Arrangement',
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
  ['cols', 10, 120, 1],
  ['rows', 10, 120, 1],
  ['scaleSize', 10, 100, 0.5],
  ['overlap', 0, 0.8, 0.01],
  ['arc', 0.3, 1.2, 0.01],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 20, 80, 1],
  ['shadow', 0, 1, 0.01],
  ['rimLight', 0, 1, 0.01],
  ['variance', 0, 60, 1],
  ['iridescence', 0, 1, 0.01],
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
  params.cols = rand(20, 80, 1);
  params.rows = rand(20, 70, 1);
  params.scaleSize = rand(20, 70, 0.5);
  params.overlap = rand(0.3, 0.7, 0.01);
  params.hue = rand(0, 360, 1);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
