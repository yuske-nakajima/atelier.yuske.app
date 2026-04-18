// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  m1: 1.0,
  m2: 0.6,
  sep: 260,
  orbitSpeed: 0.5,
  gridStep: 32,
  arrowScale: 3500,
  hue: 40,
  hue2: 200,
  fade: 0.0,
  showBodies: 1,
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

let time = 0;
function tick() {
  time += 1 / 60;
  if (params.fade > 0) {
    ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#0b0a07';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  const a = time * params.orbitSpeed;
  const totalM = params.m1 + params.m2;
  const r1 = (-params.sep * params.m2) / totalM;
  const r2 = (params.sep * params.m1) / totalM;
  const b1 = {
    x: cx + Math.cos(a) * r1,
    y: cy + Math.sin(a) * r1,
    m: params.m1,
  };
  const b2 = {
    x: cx + Math.cos(a) * r2,
    y: cy + Math.sin(a) * r2,
    m: params.m2,
  };
  // 重心
  const gx = cx,
    gy = cy;
  const step = params.gridStep;
  for (let y = step / 2; y < canvas.height; y += step) {
    for (let x = step / 2; x < canvas.width; x += step) {
      // 各天体からの重力
      const dx1 = x - b1.x,
        dy1 = y - b1.y;
      const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) + 5;
      const f1x = (-b1.m * dx1) / (d1 * d1 * d1);
      const f1y = (-b1.m * dy1) / (d1 * d1 * d1);
      const dx2 = x - b2.x,
        dy2 = y - b2.y;
      const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 5;
      const f2x = (-b2.m * dx2) / (d2 * d2 * d2);
      const f2y = (-b2.m * dy2) / (d2 * d2 * d2);
      // 重心からの重力（潮汐差）
      const dgx = x - gx,
        dgy = y - gy;
      const dg = Math.sqrt(dgx * dgx + dgy * dgy) + 5;
      const fgx = (-totalM * dgx) / (dg * dg * dg);
      const fgy = (-totalM * dgy) / (dg * dg * dg);
      const fx = (f1x + f2x - fgx) * params.arrowScale;
      const fy = (f1y + f2y - fgy) * params.arrowScale;
      const mag = Math.sqrt(fx * fx + fy * fy);
      const len = Math.min(step * 0.8, mag);
      if (mag < 0.01) continue;
      const ux = (fx / mag) * len,
        uy = (fy / mag) * len;
      const hue = len > step * 0.4 ? params.hue : params.hue2;
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.7)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ux, y + uy);
      ctx.stroke();
    }
  }
  if (params.showBodies) {
    ctx.fillStyle = `hsl(${params.hue}, 80%, 60%)`;
    ctx.beginPath();
    ctx.arc(b1.x, b1.y, 8 * Math.sqrt(b1.m), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsl(${params.hue2}, 80%, 60%)`;
    ctx.beginPath();
    ctx.arc(b2.x, b2.y, 8 * Math.sqrt(b2.m), 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Tidal',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'm1', 0.1, 3, 0.01);
gui.add(params, 'm2', 0.1, 3, 0.01);
gui.add(params, 'sep', 80, 500, 1);
gui.add(params, 'orbitSpeed', -2, 2, 0.01);
gui.add(params, 'gridStep', 16, 80, 1);
gui.add(params, 'arrowScale', 500, 20000, 50);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hue2', 0, 360, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.add(params, 'showBodies', 0, 1, 1);
gui.addButton('Random', () => {
  params.m1 = rand(0.5, 2, 0.01);
  params.m2 = rand(0.3, 1.5, 0.01);
  params.sep = rand(150, 400, 1);
  params.orbitSpeed = rand(-1, 1, 0.01);
  params.hue = rand(0, 360, 1);
  params.hue2 = rand(0, 360, 1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
