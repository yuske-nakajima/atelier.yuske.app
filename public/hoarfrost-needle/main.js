// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  needles: 500,
  minLength: 20,
  maxLength: 180,
  alignment: 0.7,
  angleBase: -90,
  spread: 30,
  thickness: 0.8,
  hue: 200,
  saturation: 30,
  lightness: 90,
  bgLightness: 8,
  tipBloom: 0.4,
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
  ctx.fillStyle = `hsl(${params.hue}, 30%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const n = Math.round(params.needles);
  const base = (params.angleBase * Math.PI) / 180;
  const spread = (params.spread * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const x = rnd() * canvas.width;
    const y = rnd() * canvas.height;
    const rand = (rnd() - 0.5) * Math.PI * 2;
    const a =
      base * params.alignment +
      rand * (1 - params.alignment) +
      (rnd() - 0.5) * spread;
    const len =
      params.minLength + rnd() * (params.maxLength - params.minLength);
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    const grd = ctx.createLinearGradient(x, y, ex, ey);
    grd.addColorStop(
      0,
      `hsla(${params.hue}, ${params.saturation}%, ${params.lightness - 20}%, 0.3)`,
    );
    grd.addColorStop(
      1,
      `hsla(${params.hue}, ${params.saturation}%, ${params.lightness}%, 0.95)`,
    );
    ctx.strokeStyle = grd;
    ctx.lineWidth = params.thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    // 先端キラリ
    if (params.tipBloom > 0) {
      ctx.fillStyle = `hsla(${params.hue}, ${params.saturation}%, 95%, ${params.tipBloom})`;
      ctx.beginPath();
      ctx.arc(ex, ey, params.thickness * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Hoarfrost Needle',
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
  ['needles', 50, 2000, 10],
  ['minLength', 5, 100, 1],
  ['maxLength', 30, 400, 1],
  ['alignment', 0, 1, 0.01],
  ['angleBase', -180, 180, 1],
  ['spread', 0, 180, 1],
  ['thickness', 0.3, 3, 0.05],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 50, 100, 1],
  ['bgLightness', 0, 40, 1],
  ['tipBloom', 0, 1, 0.01],
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
  params.needles = rand(200, 1200, 10);
  params.alignment = rand(0.2, 0.9, 0.01);
  params.angleBase = rand(-180, 180, 1);
  params.spread = rand(10, 80, 1);
  params.hue = rand(150, 240, 1);
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
