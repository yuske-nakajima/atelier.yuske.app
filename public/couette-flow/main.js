// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  particles: 2500,
  innerRadius: 120,
  outerRadius: 360,
  innerOmega: 1.5,
  outerOmega: -0.3,
  viscosity: 0.15,
  hueInner: 30,
  hueOuter: 210,
  fade: 0.08,
  size: 1.4,
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

/** @type {{r:number,a:number}[]} */
let parts = [];
function reseed() {
  parts = [];
  const n = Math.max(100, params.particles | 0);
  for (let i = 0; i < n; i++) {
    const r =
      params.innerRadius +
      Math.random() * (params.outerRadius - params.innerRadius);
    parts.push({ r, a: Math.random() * Math.PI * 2 });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function tick() {
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  const R1 = params.innerRadius,
    R2 = Math.max(R1 + 10, params.outerRadius);
  const w1 = params.innerOmega,
    w2 = params.outerOmega;
  // Couette 流: ω(r) = A + B/r^2
  const denom = R2 * R2 - R1 * R1;
  const A = (w2 * R2 * R2 - w1 * R1 * R1) / denom;
  const B = ((w1 - w2) * R1 * R1 * R2 * R2) / denom;
  for (const p of parts) {
    const omega = A + B / (p.r * p.r);
    p.a += omega * (1 - params.viscosity * 0.3) * 0.03;
    // 粘性による半径方向の拡散
    p.r += (Math.random() - 0.5) * params.viscosity * 2;
    if (p.r < R1) p.r = R1;
    if (p.r > R2) p.r = R2;
    const x = cx + Math.cos(p.a) * p.r;
    const y = cy + Math.sin(p.a) * p.r;
    const t = (p.r - R1) / (R2 - R1);
    const hue = params.hueInner * (1 - t) + params.hueOuter * t;
    ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.85)`;
    ctx.fillRect(x, y, params.size, params.size);
  }
  // 円筒の境界
  ctx.strokeStyle = 'rgba(200,200,200,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R2, 0, Math.PI * 2);
  ctx.stroke();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Couette',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'particles', 300, 5000, 10);
gui.add(params, 'innerRadius', 30, 250, 1);
gui.add(params, 'outerRadius', 150, 600, 1);
gui.add(params, 'innerOmega', -3, 3, 0.01);
gui.add(params, 'outerOmega', -3, 3, 0.01);
gui.add(params, 'viscosity', 0, 0.5, 0.01);
gui.add(params, 'hueInner', 0, 360, 1);
gui.add(params, 'hueOuter', 0, 360, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.add(params, 'size', 0.5, 3, 0.1);
gui.addButton('Random', () => {
  params.innerOmega = rand(-2, 2, 0.01);
  params.outerOmega = rand(-2, 2, 0.01);
  params.viscosity = rand(0.05, 0.3, 0.01);
  params.hueInner = rand(0, 360, 1);
  params.hueOuter = rand(0, 360, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
