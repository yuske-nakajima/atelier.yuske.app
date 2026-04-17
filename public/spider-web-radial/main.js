// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  radials: 18,
  spirals: 22,
  radius: 380,
  startRadius: 20,
  sag: 0.08,
  jitter: 3,
  thickness: 0.8,
  hue: 0,
  saturation: 0,
  lightness: 85,
  bgLightness: 6,
  dewCount: 15,
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
  ctx.fillStyle = `hsl(${params.hue}, 20%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.lineWidth = params.thickness;
  ctx.lineCap = 'round';
  const N = Math.round(params.radials);
  // ラジアル
  const anchors = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ex = cx + Math.cos(a) * params.radius;
    const ey = cy + Math.sin(a) * params.radius;
    anchors.push([ex, ey]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    // たるみ
    const midX =
      (cx + ex) / 2 + Math.cos(a + Math.PI / 2) * params.sag * params.radius;
    const midY =
      (cy + ey) / 2 + Math.sin(a + Math.PI / 2) * params.sag * params.radius;
    ctx.quadraticCurveTo(midX, midY, ex, ey);
    ctx.stroke();
  }
  // 螺旋（多角形状）
  const spirals = Math.round(params.spirals);
  for (let s = 1; s <= spirals; s++) {
    const t = s / spirals;
    const r = params.startRadius + t * (params.radius - params.startRadius);
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = ((i % N) / N) * Math.PI * 2;
      const jr = r + (Math.random() - 0.5) * params.jitter;
      const x = cx + Math.cos(a) * jr;
      const y = cy + Math.sin(a) * jr;
      // わずかなたるみ
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevA = (((i - 1) % N) / N) * Math.PI * 2;
        const midA = (prevA + a) / 2;
        const sagR = r * (1 - params.sag * 0.3);
        ctx.quadraticCurveTo(
          cx + Math.cos(midA) * sagR,
          cy + Math.sin(midA) * sagR,
          x,
          y,
        );
      }
    }
    ctx.stroke();
  }
  // 露
  ctx.fillStyle = `hsla(${params.hue}, 30%, 95%, 0.9)`;
  for (let i = 0; i < params.dewCount; i++) {
    const r = Math.random() * params.radius;
    const a = Math.random() * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const size = 1.5 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}
draw();

function redraw() {
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Spider Web Radial',
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
  ['radials', 6, 48, 1],
  ['spirals', 5, 60, 1],
  ['radius', 100, 600, 2],
  ['startRadius', 2, 100, 1],
  ['sag', 0, 0.3, 0.005],
  ['jitter', 0, 20, 0.25],
  ['thickness', 0.3, 3, 0.05],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 40, 100, 1],
  ['bgLightness', 0, 30, 1],
  ['dewCount', 0, 80, 1],
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
  params.radials = rand(8, 32, 1);
  params.spirals = rand(10, 40, 1);
  params.sag = rand(0, 0.15, 0.005);
  params.hue = rand(0, 360, 1);
  params.saturation = rand(0, 40, 1);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
