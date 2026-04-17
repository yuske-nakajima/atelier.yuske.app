// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  symmetry: 12,
  radius: 280,
  rings: 14,
  pores: 24,
  poreRadius: 5,
  spokes: 36,
  centerRings: 4,
  hue: 180,
  saturation: 40,
  lightness: 70,
  bgLightness: 10,
  frameWidth: 2,
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
  ctx.fillStyle = `hsl(${params.hue}, 30%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.lineWidth = params.frameWidth;
  // 外枠
  ctx.beginPath();
  ctx.arc(cx, cy, params.radius, 0, Math.PI * 2);
  ctx.stroke();
  // 対称スポーク
  const sym = Math.round(params.symmetry);
  for (let i = 0; i < sym; i++) {
    const a = (i / sym) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(a) * params.radius,
      cy + Math.sin(a) * params.radius,
    );
    ctx.stroke();
  }
  // 同心リング
  ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness}%, 0.5)`;
  ctx.lineWidth = params.frameWidth * 0.5;
  for (let i = 1; i <= params.rings; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (params.radius / params.rings) * i, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 小孔
  ctx.fillStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness + 20}%, 0.8)`;
  for (let r = 1; r <= params.rings; r++) {
    const ringR = (params.radius / params.rings) * (r - 0.5);
    const poresOnRing = Math.round(params.pores * (r / params.rings));
    for (let i = 0; i < poresOnRing; i++) {
      const a = (i / poresOnRing) * Math.PI * 2 + (r % 2) * 0.1;
      const x = cx + Math.cos(a) * ringR;
      const y = cy + Math.sin(a) * ringR;
      ctx.beginPath();
      ctx.arc(x, y, params.poreRadius * (r / params.rings), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 中心
  ctx.fillStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness - 10}%)`;
  for (let i = 0; i < params.centerRings; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, params.radius * 0.08 * (i + 1), 0, Math.PI * 2);
    ctx.stroke();
  }
  // 細かいスポーク
  ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness}%, 0.3)`;
  ctx.lineWidth = 0.5;
  const spokes = Math.round(params.spokes);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(a) * params.radius,
      cy + Math.sin(a) * params.radius,
    );
    ctx.stroke();
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Diatom Frustule',
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
  ['symmetry', 3, 32, 1],
  ['radius', 100, 500, 2],
  ['rings', 3, 30, 1],
  ['pores', 6, 80, 1],
  ['poreRadius', 1, 12, 0.25],
  ['spokes', 0, 120, 2],
  ['centerRings', 0, 10, 1],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 30, 95, 1],
  ['bgLightness', 0, 30, 1],
  ['frameWidth', 0.5, 6, 0.25],
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
  params.symmetry = rand(5, 24, 1);
  params.rings = rand(4, 20, 1);
  params.pores = rand(12, 50, 1);
  params.hue = rand(0, 360, 1);
  params.saturation = rand(20, 70, 1);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
