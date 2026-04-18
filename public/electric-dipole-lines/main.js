// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  sep: 200,
  strength: 1.0,
  lines: 24,
  stepLen: 3,
  maxSteps: 800,
  huePos: 20,
  hueNeg: 210,
  bg: 0.0,
  equipotential: 1,
  equipLevels: 10,
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

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function field(x, y, p1, p2) {
  const dx1 = x - p1.x,
    dy1 = y - p1.y;
  const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) + 1;
  const dx2 = x - p2.x,
    dy2 = y - p2.y;
  const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 1;
  const fx = (dx1 / (d1 * d1 * d1)) * p1.q + (dx2 / (d2 * d2 * d2)) * p2.q;
  const fy = (dy1 / (d1 * d1 * d1)) * p1.q + (dy2 / (d2 * d2 * d2)) * p2.q;
  return { fx, fy };
}
function potential(x, y, p1, p2) {
  const d1 = Math.hypot(x - p1.x, y - p1.y) + 1;
  const d2 = Math.hypot(x - p2.x, y - p2.y) + 1;
  return p1.q / d1 + p2.q / d2;
}

function draw() {
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  const p1 = { x: cx - params.sep / 2, y: cy, q: params.strength };
  const p2 = { x: cx + params.sep / 2, y: cy, q: -params.strength };
  // 等電位線
  if (params.equipotential) {
    const R = 3;
    const pot = (x, y) => potential(x, y, p1, p2);
    ctx.strokeStyle = 'rgba(200,200,200,0.2)';
    ctx.lineWidth = 0.6;
    const step = 4;
    const levels = params.equipLevels;
    for (let l = 0; l < levels; l++) {
      const target = ((l + 0.5) / levels - 0.5) * 0.02;
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const v = pot(x, y);
          if (Math.abs(v - target) < 0.0005) {
            ctx.fillStyle = 'rgba(180,180,180,0.3)';
            ctx.fillRect(x, y, R, R);
          }
        }
      }
    }
  }
  // 電場線 (正電荷から発生)
  const n = Math.max(4, params.lines | 0);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let x = p1.x + Math.cos(a) * 6,
      y = p1.y + Math.sin(a) * 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = `hsla(${params.huePos}, 80%, 65%, 0.8)`;
    ctx.lineWidth = 1.2;
    for (let k = 0; k < params.maxSteps; k++) {
      const { fx, fy } = field(x, y, p1, p2);
      const m = Math.sqrt(fx * fx + fy * fy);
      if (m < 1e-8) break;
      x += (fx / m) * params.stepLen;
      y += (fy / m) * params.stepLen;
      if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) break;
      if (Math.hypot(x - p2.x, y - p2.y) < 8) break;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // 電荷
  ctx.fillStyle = `hsl(${params.huePos}, 85%, 60%)`;
  ctx.beginPath();
  ctx.arc(p1.x, p1.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsl(${params.hueNeg}, 85%, 60%)`;
  ctx.beginPath();
  ctx.arc(p2.x, p2.y, 8, 0, Math.PI * 2);
  ctx.fill();
}
draw();

function rerun() {
  draw();
}
window.addEventListener('resize', rerun);

const gui = new TileUI({
  title: 'Dipole',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'sep', 40, 600, 1).onChange(rerun);
gui.add(params, 'strength', 0.1, 3, 0.01).onChange(rerun);
gui.add(params, 'lines', 6, 60, 1).onChange(rerun);
gui.add(params, 'stepLen', 1, 10, 0.1).onChange(rerun);
gui.add(params, 'maxSteps', 100, 2000, 10).onChange(rerun);
gui.add(params, 'huePos', 0, 360, 1).onChange(rerun);
gui.add(params, 'hueNeg', 0, 360, 1).onChange(rerun);
gui.add(params, 'bg', 0, 0.5, 0.01).onChange(rerun);
gui.add(params, 'equipotential', 0, 1, 1).onChange(rerun);
gui.add(params, 'equipLevels', 2, 30, 1).onChange(rerun);
gui.addButton('Random', () => {
  params.sep = rand(120, 400, 1);
  params.strength = rand(0.5, 2, 0.01);
  params.lines = rand(12, 40, 1);
  params.huePos = rand(0, 60, 1);
  params.hueNeg = rand(180, 240, 1);
  gui.updateDisplay();
  rerun();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  rerun();
});
