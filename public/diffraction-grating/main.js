// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 回折格子: 格子間隔 d に対する角度 sin(θ) = m λ / d で次数 m の回折スペクトルを描く。
const params = {
  gratingLines: 40,
  d: 16, // 格子間隔（ピクセル）
  maxOrder: 3,
  wavelengths: 7, // 可視光の分割数
  spread: 420, // 画面上の広がり
  sourceBrightness: 1.4,
  lineAlpha: 0.6,
  beamAngle: 0.05,
  orderGap: 110,
  trailFade: 0.15,
  showGrating: true,
  animate: true,
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

let time = 0;

// 波長 (nm) → HSL 色
function wavelengthHue(wnm) {
  // 380..780 nm → 280..0 hue (紫→赤)
  const t = (wnm - 380) / (780 - 380);
  return 280 - t * 280;
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const gy = canvas.height * 0.5;
  const beamY0 = gy - 250;

  // 入射光源
  const beamAngle = params.animate
    ? params.beamAngle + Math.sin(time * 0.5) * 0.08
    : params.beamAngle;
  const sx = cx - Math.sin(beamAngle) * 250;
  const sy = beamY0;
  // 入射線
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * params.sourceBrightness})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(cx, gy);
  ctx.stroke();

  // 格子の線
  if (params.showGrating) {
    const n = Math.round(params.gratingLines);
    const halfW = (n * params.d) / 2;
    ctx.strokeStyle = 'rgba(200, 220, 255, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const x = cx - halfW + i * params.d;
      ctx.beginPath();
      ctx.moveTo(x, gy - 10);
      ctx.lineTo(x, gy + 10);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(180, 200, 230, 0.8)';
    ctx.beginPath();
    ctx.moveTo(cx - halfW - 10, gy);
    ctx.lineTo(cx + halfW + 10, gy);
    ctx.stroke();
  }

  // 回折次数ごとにスペクトル
  const W = Math.round(params.wavelengths);
  for (let m = -params.maxOrder; m <= params.maxOrder; m++) {
    if (m === 0) continue;
    for (let wi = 0; wi < W; wi++) {
      const wnm = 380 + (wi + 0.5) * (400 / W); // 380..780 nm
      // sin(θ) = m * λ / d  (ピクセル単位に換算するため λ ~= wnm/30 とする)
      const lambda = wnm / 30;
      const sinT = (m * lambda) / params.d;
      if (Math.abs(sinT) > 1) continue;
      const theta = Math.asin(sinT) + beamAngle;
      const tx = cx + Math.sin(theta) * params.spread;
      const ty = gy + Math.cos(theta) * params.spread;
      const hue = wavelengthHue(wnm);
      ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${params.lineAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx, gy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.fillStyle = `hsla(${hue}, 100%, 75%, 0.8)`;
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // 次数ラベルのスペース
  }

  // 0 次光（中心の白）
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * params.sourceBrightness})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, gy);
  ctx.lineTo(
    cx + Math.sin(beamAngle) * params.spread,
    gy + Math.cos(beamAngle) * params.spread,
  );
  ctx.stroke();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Diffraction Grating',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'gratingLines', 5, 120, 1);
gui.add(params, 'd', 4, 40, 0.5);
gui.add(params, 'maxOrder', 1, 6, 1);
gui.add(params, 'wavelengths', 3, 20, 1);
gui.add(params, 'spread', 100, 800, 1);
gui.add(params, 'sourceBrightness', 0.3, 2, 0.05);
gui.add(params, 'lineAlpha', 0.1, 1, 0.01);
gui.add(params, 'beamAngle', -0.5, 0.5, 0.01);
gui.add(params, 'orderGap', 40, 200, 1);
gui.add(params, 'trailFade', 0.05, 0.4, 0.01);
gui.add(params, 'showGrating');
gui.add(params, 'animate');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.d = rand(6, 28, 0.5);
  params.maxOrder = rand(2, 5, 1);
  params.wavelengths = rand(5, 14, 1);
  params.spread = rand(260, 600, 1);
  params.beamAngle = rand(-0.3, 0.3, 0.01);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
