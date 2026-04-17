// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  depth: 5, // 再帰深度
  branchLength: 160, // 主軸長
  branchRatio: 0.55, // 枝比率
  sideAngle: 60, // 側枝角度（度）
  sideCount: 3, // 片側の側枝数
  tipSplit: 0.7, // 先端の分岐比
  growthSpeed: 0.008, // 成長アニメ速度
  rotation: 0.05, // 緩やかな回転速度
  hueBase: 200, // 基調色相
  hueShift: 18, // 層間色相差
  lineWidth: 1.1, // 線幅
  glow: 10, // グロー
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

// --- 描画 ---

let time = 0;
let growth = 0; // 0..1

/**
 * 枝を描く（再帰）
 * @param {number} x
 * @param {number} y
 * @param {number} angle
 * @param {number} length
 * @param {number} depthLeft
 */
function drawBranch(x, y, angle, length, depthLeft) {
  if (depthLeft <= 0 || length < 1) return;
  const nx = x + Math.cos(angle) * length;
  const ny = y + Math.sin(angle) * length;
  const depthIdx = Math.round(params.depth) - depthLeft;
  const hue = params.hueBase + depthIdx * params.hueShift;
  ctx.strokeStyle = `hsla(${hue}, 65%, 80%, ${0.55 + 0.45 * (depthLeft / params.depth)})`;
  ctx.lineWidth = Math.max(
    0.0625,
    params.lineWidth * (depthLeft / params.depth + 0.3),
  );
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(nx, ny);
  ctx.stroke();

  // 側枝
  const sideAngRad = (params.sideAngle * Math.PI) / 180;
  const sides = Math.max(1, Math.round(params.sideCount));
  for (let i = 1; i <= sides; i++) {
    const t = i / (sides + 1);
    const sx = x + Math.cos(angle) * length * t;
    const sy = y + Math.sin(angle) * length * t;
    const sideLen = length * params.branchRatio * (1 - t * 0.3);
    drawBranch(sx, sy, angle - sideAngRad, sideLen, depthLeft - 1);
    drawBranch(sx, sy, angle + sideAngRad, sideLen, depthLeft - 1);
  }

  // 先端の分岐
  const tipLen = length * params.tipSplit;
  drawBranch(nx, ny, angle - sideAngRad * 0.4, tipLen, depthLeft - 1);
  drawBranch(nx, ny, angle + sideAngRad * 0.4, tipLen, depthLeft - 1);
}

function drawBackground() {
  const grad = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) / 2,
  );
  grad.addColorStop(0, `hsl(${params.hueBase}, 40%, 16%)`);
  grad.addColorStop(1, '#030508');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
  time += 1 / 60;
  growth = Math.min(1, growth + params.growthSpeed);

  drawBackground();
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const effectiveLen = params.branchLength * growth;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * params.rotation);
  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;
  ctx.shadowColor = `hsl(${params.hueBase}, 70%, 85%)`;
  // 6 回対称（雪の結晶）
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    drawBranch(0, 0, angle, effectiveLen, Math.round(params.depth));
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Ice Crystal',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 1, 7, 1);
gui.add(params, 'branchLength', 40, 320, 2);
gui.add(params, 'branchRatio', 0.2, 0.85, 0.01);
gui.add(params, 'sideAngle', 15, 85, 1);
gui.add(params, 'sideCount', 0, 5, 1);
gui.add(params, 'tipSplit', 0, 0.95, 0.01);
gui.add(params, 'growthSpeed', 0.002, 0.05, 0.002);
gui.add(params, 'rotation', -0.2, 0.2, 0.005);
gui.add(params, 'hueBase', 160, 260, 1);
gui.add(params, 'hueShift', -30, 30, 1);
gui.add(params, 'lineWidth', 0.25, 3, 0.05);
gui.add(params, 'glow', 0, 30, 0.5);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.depth = rand(3, 6, 1);
  params.branchLength = rand(100, 220, 2);
  params.branchRatio = rand(0.35, 0.7, 0.01);
  params.sideAngle = rand(30, 75, 1);
  params.sideCount = rand(1, 4, 1);
  params.tipSplit = rand(0.3, 0.8, 0.01);
  params.hueBase = rand(180, 240, 1);
  params.hueShift = rand(-20, 20, 1);
  growth = 0;
  gui.updateDisplay();
});

gui.addButton('Regrow', () => {
  growth = 0;
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  growth = 0;
  gui.updateDisplay();
});
