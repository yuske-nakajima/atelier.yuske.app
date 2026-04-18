// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  particles: 1500,
  charge: 0.6,
  damping: 0.985,
  fieldScale: 0.1,
  bField: 0.4,
  temperature: 1.5,
  hueIon: 30,
  hueElectron: 210,
  fade: 0.12,
  size: 1.5,
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

/** @type {{x:number,y:number,vx:number,vy:number,q:number}[]} */
let parts = [];
function reseed() {
  parts = [];
  const n = Math.max(100, params.particles | 0);
  for (let i = 0; i < n; i++) {
    parts.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * params.temperature,
      vy: (Math.random() - 0.5) * params.temperature,
      q: i % 2 === 0 ? 1 : -1,
    });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

const GN = 48;
function tick() {
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width,
    H = canvas.height;
  // 電荷密度グリッド
  const rho = new Float32Array(GN * GN);
  const dxG = W / GN,
    dyG = H / GN;
  for (const p of parts) {
    const gx = Math.max(0, Math.min(GN - 1, (p.x / dxG) | 0));
    const gy = Math.max(0, Math.min(GN - 1, (p.y / dyG) | 0));
    rho[gx + gy * GN] += p.q;
  }
  // 電場 = 電荷密度の勾配
  for (const p of parts) {
    const gx = Math.max(1, Math.min(GN - 2, (p.x / dxG) | 0));
    const gy = Math.max(1, Math.min(GN - 2, (p.y / dyG) | 0));
    const Ex =
      (rho[gx + 1 + gy * GN] - rho[gx - 1 + gy * GN]) * params.fieldScale;
    const Ey =
      (rho[gx + (gy + 1) * GN] - rho[gx + (gy - 1) * GN]) * params.fieldScale;
    const F = params.charge * p.q;
    p.vx += -Ex * F;
    p.vy += -Ey * F;
    // 磁場（ページ垂直方向）によるローレンツ力
    const B = params.bField;
    const nvx = p.vx + p.vy * B * p.q * 0.1;
    const nvy = p.vy - p.vx * B * p.q * 0.1;
    p.vx = nvx * params.damping;
    p.vy = nvy * params.damping;
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x += W;
    if (p.x > W) p.x -= W;
    if (p.y < 0) p.y += H;
    if (p.y > H) p.y -= H;
    const hue = p.q > 0 ? params.hueIon : params.hueElectron;
    ctx.fillStyle = `hsla(${hue}, 85%, 60%, 0.85)`;
    ctx.fillRect(p.x, p.y, params.size, params.size);
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'PIC Plasma',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'particles', 300, 4000, 10);
gui.add(params, 'charge', 0.1, 2, 0.01);
gui.add(params, 'damping', 0.9, 1, 0.001);
gui.add(params, 'fieldScale', 0.01, 0.5, 0.01);
gui.add(params, 'bField', -2, 2, 0.01);
gui.add(params, 'temperature', 0.1, 5, 0.01);
gui.add(params, 'hueIon', 0, 360, 1);
gui.add(params, 'hueElectron', 0, 360, 1);
gui.add(params, 'fade', 0, 0.4, 0.01);
gui.add(params, 'size', 0.5, 4, 0.1);
gui.addButton('Random', () => {
  params.charge = rand(0.2, 1.2, 0.01);
  params.bField = rand(-1, 1, 0.01);
  params.temperature = rand(0.5, 3, 0.01);
  params.hueIon = rand(0, 60, 1);
  params.hueElectron = rand(180, 240, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
