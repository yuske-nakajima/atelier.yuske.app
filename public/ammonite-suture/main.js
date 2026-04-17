// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  turns: 4,
  growthRate: 0.22,
  sutures: 18,
  sutureDepth: 14,
  sutureFractal: 3,
  baseRadius: 8,
  lineWidth: 1.2,
  hue: 35,
  saturation: 35,
  lightness: 70,
  bgLightness: 8,
  rings: 60,
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

/**
 * フラクタル化した縫合線（スクエアノイズ）
 * @param {number} baseR
 * @param {number} amp
 * @param {number} depth
 * @param {number} theta
 */
function sutureR(baseR, amp, depth, theta) {
  let s = 0;
  let a = amp;
  let f = params.sutures;
  for (let i = 0; i < depth; i++) {
    s += Math.sin(theta * f) * a;
    a *= 0.55;
    f *= 2;
  }
  return baseR + s;
}

function draw() {
  ctx.fillStyle = `hsl(${params.hue}, 20%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const total = params.turns * Math.PI * 2;
  // 縫合線
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.lineWidth = params.lineWidth;
  for (let k = 1; k <= params.rings; k++) {
    const r0 =
      params.baseRadius *
      Math.exp(params.growthRate * ((k / params.rings) * total));
    ctx.beginPath();
    const steps = 400;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 2;
      const r = sutureR(
        r0,
        params.sutureDepth,
        Math.round(params.sutureFractal),
        theta,
      );
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  // 対数螺旋
  ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation + 20}%, ${params.lightness}%, 0.6)`;
  ctx.lineWidth = params.lineWidth * 1.5;
  ctx.beginPath();
  const sSteps = 500;
  for (let i = 0; i <= sSteps; i++) {
    const t = (i / sSteps) * total;
    const r = params.baseRadius * Math.exp(params.growthRate * t);
    const x = cx + Math.cos(t) * r;
    const y = cy + Math.sin(t) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Ammonite Suture',
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
  ['turns', 1, 8, 0.1],
  ['growthRate', 0.08, 0.4, 0.005],
  ['sutures', 4, 40, 1],
  ['sutureDepth', 0, 40, 0.5],
  ['sutureFractal', 1, 6, 1],
  ['baseRadius', 2, 30, 0.5],
  ['lineWidth', 0.3, 3, 0.05],
  ['hue', 0, 360, 1],
  ['saturation', 0, 80, 1],
  ['lightness', 30, 95, 1],
  ['bgLightness', 0, 30, 1],
  ['rings', 5, 150, 1],
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
  params.turns = rand(2, 5, 0.1);
  params.growthRate = rand(0.15, 0.3, 0.005);
  params.sutures = rand(8, 30, 1);
  params.sutureDepth = rand(4, 20, 0.5);
  params.sutureFractal = rand(2, 4, 1);
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
