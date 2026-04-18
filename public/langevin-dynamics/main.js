// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  particles: 400,
  friction: 0.1,
  kT: 1.5,
  potentialScale: 0.0005,
  wellSpacing: 180,
  wells: 4,
  hueStart: 40,
  hueRange: 240,
  fade: 0.08,
  size: 2,
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

/** @type {{x:number,y:number,vx:number,vy:number,h:number}[]} */
let parts = [];
let wellCenters = [];
function reseed() {
  parts = [];
  const n = Math.max(20, params.particles | 0);
  for (let i = 0; i < n; i++) {
    parts.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.random() - 0.5,
      vy: Math.random() - 0.5,
      h: params.hueStart + (i / n) * params.hueRange,
    });
  }
  wellCenters = [];
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  const w = Math.max(1, params.wells | 0);
  for (let i = 0; i < w; i++) {
    const a = (i / w) * Math.PI * 2;
    wellCenters.push({
      x: cx + Math.cos(a) * params.wellSpacing,
      y: cy + Math.sin(a) * params.wellSpacing,
    });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function gauss() {
  // Box–Muller
  const u = Math.random() || 1e-9,
    v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function tick() {
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const sig = Math.sqrt(2 * params.friction * params.kT);
  for (const p of parts) {
    // 多井戸ポテンシャルの勾配（各中心への引力の合成）
    let fx = 0,
      fy = 0;
    for (const w of wellCenters) {
      const dx = p.x - w.x,
        dy = p.y - w.y;
      const d2 = dx * dx + dy * dy + 1;
      fx -= dx * params.potentialScale;
      fy -= dy * params.potentialScale;
      // ヴァンデル・ワールス的短距離反発
      fx += (dx / d2) * 50 * params.potentialScale;
      fy += (dy / d2) * 50 * params.potentialScale;
    }
    p.vx = p.vx * (1 - params.friction) + fx + gauss() * sig;
    p.vy = p.vy * (1 - params.friction) + fy + gauss() * sig;
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x += canvas.width;
    if (p.x > canvas.width) p.x -= canvas.width;
    if (p.y < 0) p.y += canvas.height;
    if (p.y > canvas.height) p.y -= canvas.height;
    ctx.fillStyle = `hsla(${p.h}, 80%, 65%, 0.85)`;
    ctx.fillRect(p.x, p.y, params.size, params.size);
  }
  // 井戸を表示
  ctx.strokeStyle = 'rgba(200,200,200,0.15)';
  for (const w of wellCenters) {
    ctx.beginPath();
    ctx.arc(w.x, w.y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Langevin',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'particles', 50, 2000, 10);
gui.add(params, 'friction', 0.01, 0.5, 0.01);
gui.add(params, 'kT', 0.1, 5, 0.01);
gui.add(params, 'potentialScale', 0, 0.003, 0.00005);
gui.add(params, 'wellSpacing', 50, 400, 1);
gui.add(params, 'wells', 1, 8, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 720, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.add(params, 'size', 0.5, 5, 0.1);
gui.addButton('Random', () => {
  params.friction = rand(0.05, 0.2, 0.01);
  params.kT = rand(0.5, 3, 0.01);
  params.wells = rand(2, 6, 1);
  params.hueStart = rand(0, 360, 1);
  params.wellSpacing = rand(100, 300, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
