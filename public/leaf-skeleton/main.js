// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  mainVeins: 9,
  subVeins: 7,
  subSubVeins: 5,
  leafWidth: 420,
  leafHeight: 560,
  taper: 0.7,
  angle: 40,
  thickness: 1.2,
  hue: 30,
  saturation: 15,
  lightness: 80,
  bgLightness: 10,
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
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} w
 */
function line(x1, y1, x2, y2, w) {
  ctx.lineWidth = Math.max(0.25, w);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = `hsl(${params.hue}, 20%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.lineCap = 'round';
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const h = params.leafHeight;
  // 葉輪郭
  ctx.beginPath();
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = cy - h / 2 + t * h;
    const w = Math.sin(t * Math.PI) * params.leafWidth * 0.5;
    if (i === 0) ctx.moveTo(cx + w, y);
    else ctx.lineTo(cx + w, y);
  }
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = cy - h / 2 + t * h;
    const w = Math.sin(t * Math.PI) * params.leafWidth * 0.5;
    ctx.lineTo(cx - w, y);
  }
  ctx.closePath();
  ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness}%, 0.8)`;
  ctx.lineWidth = params.thickness * 1.5;
  ctx.stroke();
  // 主脈
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  line(cx, cy - h / 2, cx, cy + h / 2, params.thickness * 2);
  // 側脈
  const main = Math.round(params.mainVeins);
  for (let i = 1; i <= main; i++) {
    const t = i / (main + 1);
    const y = cy - h / 2 + t * h;
    const w = Math.sin(t * Math.PI) * params.leafWidth * 0.5;
    const ang = (params.angle * Math.PI) / 180;
    for (const sign of [-1, 1]) {
      const ex = cx + sign * w * params.taper;
      const ey = y + Math.sin(-ang) * w * 0.4;
      line(cx, y, ex, ey, params.thickness * 1.3);
      // サブ脈
      const sub = Math.round(params.subVeins);
      for (let j = 1; j <= sub; j++) {
        const tt = j / (sub + 1);
        const mx = cx + (ex - cx) * tt;
        const my = y + (ey - y) * tt;
        const ex2 = mx + sign * 30;
        const ey2 = my - 20;
        line(mx, my, ex2, ey2, params.thickness * 0.8);
        // サブサブ脈
        const ss = Math.round(params.subSubVeins);
        for (let k = 1; k <= ss; k++) {
          const kk = k / (ss + 1);
          const mx2 = mx + (ex2 - mx) * kk;
          const my2 = my + (ey2 - my) * kk;
          line(mx2, my2, mx2 + sign * 8, my2 - 6, params.thickness * 0.4);
        }
      }
    }
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Leaf Skeleton',
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
  ['mainVeins', 3, 20, 1],
  ['subVeins', 2, 12, 1],
  ['subSubVeins', 0, 10, 1],
  ['leafWidth', 120, 800, 2],
  ['leafHeight', 200, 900, 2],
  ['taper', 0.3, 1, 0.01],
  ['angle', 10, 80, 1],
  ['thickness', 0.3, 3, 0.05],
  ['hue', 0, 360, 1],
  ['saturation', 0, 80, 1],
  ['lightness', 30, 95, 1],
  ['bgLightness', 0, 30, 1],
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
  params.mainVeins = rand(5, 14, 1);
  params.subVeins = rand(3, 8, 1);
  params.subSubVeins = rand(0, 5, 1);
  params.angle = rand(20, 65, 1);
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
