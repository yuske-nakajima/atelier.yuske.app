// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 色収差エフェクト。複数の図形の R/G/B チャンネルを左右にずらして描画することで色が分離。
const params = {
  aberration: 14,
  shapeCount: 5,
  shapeSize: 180,
  rotationSpeed: 0.2,
  waveSpeed: 1.1,
  blurLayers: 3,
  redShiftX: -1,
  redShiftY: 0.2,
  greenShiftX: 0,
  greenShiftY: -0.2,
  blueShiftX: 1,
  blueShiftY: 0.2,
  trailFade: 0.12,
  lineWidth: 2.5,
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

function drawShape(cx, cy, r, angle, layer, channel) {
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = channel;
  ctx.lineWidth = params.lineWidth + layer * 0.3;
  ctx.beginPath();
  const segs = 6 + layer;
  for (let i = 0; i <= segs; i++) {
    const a = angle + (i / segs) * Math.PI * 2;
    const rr = r * (1 + Math.sin(a * 3 + time * params.waveSpeed) * 0.1);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const n = Math.round(params.shapeCount);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  for (let i = 0; i < n; i++) {
    const orbit = (i * Math.PI * 2) / n;
    const ox = cx + Math.cos(orbit + time * params.rotationSpeed) * 150;
    const oy = cy + Math.sin(orbit + time * params.rotationSpeed) * 150;
    const baseAngle = time * (0.3 + i * 0.07);
    for (let layer = 0; layer < params.blurLayers; layer++) {
      const spread = (params.aberration * (layer + 1)) / params.blurLayers;
      drawShape(
        ox + params.redShiftX * spread,
        oy + params.redShiftY * spread,
        params.shapeSize * (0.7 + Math.sin(time + i) * 0.2),
        baseAngle,
        layer,
        'rgba(255, 40, 80, 0.6)',
      );
      drawShape(
        ox + params.greenShiftX * spread,
        oy + params.greenShiftY * spread,
        params.shapeSize * (0.7 + Math.sin(time + i) * 0.2),
        baseAngle,
        layer,
        'rgba(40, 255, 120, 0.6)',
      );
      drawShape(
        ox + params.blueShiftX * spread,
        oy + params.blueShiftY * spread,
        params.shapeSize * (0.7 + Math.sin(time + i) * 0.2),
        baseAngle,
        layer,
        'rgba(80, 120, 255, 0.6)',
      );
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Chromatic Aberration',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'aberration', 0, 60, 0.5);
gui.add(params, 'shapeCount', 1, 12, 1);
gui.add(params, 'shapeSize', 40, 400, 1);
gui.add(params, 'rotationSpeed', -1, 1, 0.01);
gui.add(params, 'waveSpeed', 0, 3, 0.01);
gui.add(params, 'blurLayers', 1, 6, 1);
gui.add(params, 'redShiftX', -2, 2, 0.05);
gui.add(params, 'redShiftY', -2, 2, 0.05);
gui.add(params, 'greenShiftX', -2, 2, 0.05);
gui.add(params, 'greenShiftY', -2, 2, 0.05);
gui.add(params, 'blueShiftX', -2, 2, 0.05);
gui.add(params, 'blueShiftY', -2, 2, 0.05);
gui.add(params, 'trailFade', 0.02, 0.3, 0.01);
gui.add(params, 'lineWidth', 0.5, 6, 0.1);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.aberration = rand(5, 30, 0.5);
  params.shapeCount = rand(3, 8, 1);
  params.shapeSize = rand(80, 250, 1);
  params.redShiftX = rand(-1.5, 1.5, 0.05);
  params.redShiftY = rand(-1, 1, 0.05);
  params.greenShiftX = rand(-1, 1, 0.05);
  params.blueShiftX = rand(-1.5, 1.5, 0.05);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
