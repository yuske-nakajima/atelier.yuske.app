// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  turns: 5,
  growthRate: 0.18,
  chamberStep: 0.3,
  baseRadius: 3,
  rings: 30,
  hueStart: 30,
  hueEnd: 340,
  saturation: 60,
  lightness: 55,
  shadowStrength: 0.5,
  stripes: 24,
  stripeContrast: 0.4,
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
  ctx.fillStyle = '#0a0606';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const turns = params.turns;
  const total = turns * Math.PI * 2;
  const steps = Math.round(total * 40);
  for (let i = steps; i >= 0; i--) {
    const theta = (i / steps) * total;
    const r = params.baseRadius * Math.exp(params.growthRate * theta);
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    const t = i / steps;
    const chamberR = r * params.chamberStep;
    const hue = params.hueStart * (1 - t) + params.hueEnd * t;
    const stripe = Math.sin(theta * params.stripes) * params.stripeContrast;
    const light = params.lightness + stripe * 20;
    const grd = ctx.createRadialGradient(
      x - chamberR * 0.3,
      y - chamberR * 0.3,
      0,
      x,
      y,
      chamberR,
    );
    grd.addColorStop(0, `hsl(${hue}, ${params.saturation}%, ${light + 15}%)`);
    grd.addColorStop(
      1,
      `hsl(${hue}, ${params.saturation}%, ${light - params.shadowStrength * 30}%)`,
    );
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, chamberR, 0, Math.PI * 2);
    ctx.fill();
  }
  // リング
  ctx.strokeStyle = `hsla(${params.hueEnd}, 30%, 20%, 0.3)`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < params.rings; i++) {
    const theta = (i / params.rings) * total;
    const r = params.baseRadius * Math.exp(params.growthRate * theta);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Seashell Growth',
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
  ['turns', 2, 10, 0.1],
  ['growthRate', 0.05, 0.4, 0.005],
  ['chamberStep', 0.1, 0.8, 0.01],
  ['baseRadius', 1, 20, 0.5],
  ['rings', 0, 100, 1],
  ['hueStart', 0, 360, 1],
  ['hueEnd', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 20, 80, 1],
  ['shadowStrength', 0, 1, 0.01],
  ['stripes', 0, 60, 1],
  ['stripeContrast', 0, 1, 0.01],
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
  params.turns = rand(3, 7, 0.1);
  params.growthRate = rand(0.12, 0.28, 0.005);
  params.chamberStep = rand(0.2, 0.5, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.saturation = rand(30, 80, 1);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
