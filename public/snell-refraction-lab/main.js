// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  rays: 12,
  angle: 30,
  fanSpread: 60,
  n1: 1.0,
  n2: 1.5,
  surfaceY: 0.5,
  hue1: 45,
  hue2: 200,
  glow: 0.6,
  showNormal: 1,
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

function draw() {
  const W = canvas.width,
    H = canvas.height;
  const surfY = params.surfaceY * H;
  // 上部 (媒質1)
  const g1 = ctx.createLinearGradient(0, 0, 0, surfY);
  g1.addColorStop(0, `hsla(${params.hue1}, 30%, 8%, 1)`);
  g1.addColorStop(1, `hsla(${params.hue1}, 40%, 15%, 1)`);
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, surfY);
  // 下部 (媒質2)
  const g2 = ctx.createLinearGradient(0, surfY, 0, H);
  g2.addColorStop(0, `hsla(${params.hue2}, 40%, 12%, 1)`);
  g2.addColorStop(1, `hsla(${params.hue2}, 30%, 6%, 1)`);
  ctx.fillStyle = g2;
  ctx.fillRect(0, surfY, W, H - surfY);
  // 境界
  ctx.strokeStyle = 'rgba(230,230,230,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, surfY);
  ctx.lineTo(W, surfY);
  ctx.stroke();
  // 光源
  const cx = W / 2,
    sy = surfY - 200;
  const n = Math.max(1, params.rays | 0);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const fanOffset = (t - 0.5) * params.fanSpread;
    const thetaIDeg = params.angle + fanOffset;
    const thetaI = (thetaIDeg * Math.PI) / 180;
    // 光源から境界への方向
    const dx = Math.sin(thetaI),
      dy = Math.cos(thetaI);
    const hitY = surfY;
    const hitX = cx + (dx / dy) * (hitY - sy);
    // 入射光
    ctx.strokeStyle = `hsla(${params.hue1 - 20 + t * 40}, 95%, 70%, ${0.6 + params.glow * 0.3})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, sy);
    ctx.lineTo(hitX, hitY);
    ctx.stroke();
    // スネルの法則
    const sinT2 = (params.n1 / params.n2) * Math.sin(thetaI);
    // 反射光
    const rxDir = dx,
      ryDir = -dy;
    const rEnd = 400;
    ctx.strokeStyle = `hsla(${params.hue1}, 95%, 75%, ${0.3 + params.glow * 0.2})`;
    ctx.beginPath();
    ctx.moveTo(hitX, hitY);
    ctx.lineTo(hitX + rxDir * rEnd, hitY + ryDir * rEnd);
    ctx.stroke();
    // 屈折光
    if (Math.abs(sinT2) <= 1) {
      const thetaT = Math.asin(sinT2);
      const tx = Math.sin(thetaT),
        ty = Math.cos(thetaT);
      const tEnd = 800;
      ctx.strokeStyle = `hsla(${params.hue2 + t * 30}, 95%, 70%, ${0.7 + params.glow * 0.3})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(hitX, hitY);
      ctx.lineTo(hitX + tx * tEnd, hitY + ty * tEnd);
      ctx.stroke();
    } else {
      // 全反射の場合は反射光を強調
      ctx.strokeStyle = `hsla(0, 95%, 70%, 0.9)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hitX, hitY);
      ctx.lineTo(hitX + rxDir * 600, hitY + ryDir * 600);
      ctx.stroke();
    }
    if (params.showNormal) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(hitX, hitY - 50);
      ctx.lineTo(hitX, hitY + 50);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  // 光源
  ctx.fillStyle = `hsla(${params.hue1}, 90%, 75%, 0.9)`;
  ctx.beginPath();
  ctx.arc(cx, sy, 6, 0, Math.PI * 2);
  ctx.fill();
}
draw();

function rerun() {
  draw();
}
window.addEventListener('resize', rerun);

const gui = new TileUI({
  title: 'Snell Lab',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'rays', 1, 40, 1).onChange(rerun);
gui.add(params, 'angle', -80, 80, 0.5).onChange(rerun);
gui.add(params, 'fanSpread', 0, 120, 1).onChange(rerun);
gui.add(params, 'n1', 1, 3, 0.01).onChange(rerun);
gui.add(params, 'n2', 1, 3, 0.01).onChange(rerun);
gui.add(params, 'surfaceY', 0.2, 0.8, 0.01).onChange(rerun);
gui.add(params, 'hue1', 0, 360, 1).onChange(rerun);
gui.add(params, 'hue2', 0, 360, 1).onChange(rerun);
gui.add(params, 'glow', 0, 1.5, 0.01).onChange(rerun);
gui.add(params, 'showNormal', 0, 1, 1).onChange(rerun);
gui.addButton('Random', () => {
  params.rays = rand(6, 24, 1);
  params.angle = rand(-50, 50, 0.5);
  params.fanSpread = rand(0, 80, 1);
  params.n1 = rand(1, 1.5, 0.01);
  params.n2 = rand(1.2, 2.2, 0.01);
  params.hue1 = rand(0, 360, 1);
  params.hue2 = rand(0, 360, 1);
  gui.updateDisplay();
  rerun();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  rerun();
});
