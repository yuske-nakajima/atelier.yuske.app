// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  depth: 10, // 再帰深さ
  branches: 2, // 分岐数（2〜4）
  angle: 24, // 分岐角（度）
  angleJitter: 6, // 分岐角のばらつき
  lengthRatio: 0.72, // 子枝の長さ比
  initialLength: 160, // 根の枝の長さ
  thickness: 8, // 根の太さ
  thickDecay: 0.7, // 太さ減衰
  hueStart: 30, // 幹の色相
  hueEnd: 120, // 葉の色相
  sway: 0.35, // 風による揺れ強度
  swaySpeed: 0.6, // 揺れの速さ
  leafBloom: 0.6, // 葉の粒の強さ
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

// --- 乱数（シード固定で構造を安定させる） ---

let seed = 1;
function setSeed(n) {
  seed = n >>> 0 || 1;
}
function rand01() {
  // xorshift32
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) % 100000) / 100000;
}

let treeSeed = Math.floor(Math.random() * 1e9);

// --- 描画 ---

let time = 0;

/**
 * 1 本の枝を描く（再帰）
 * @param {number} x
 * @param {number} y
 * @param {number} angle
 * @param {number} length
 * @param {number} depthLeft
 * @param {number} thickness
 */
function drawBranch(x, y, angle, length, depthLeft, thickness) {
  if (depthLeft <= 0 || length < 0.6) return;
  const swayAmp = params.sway * (1 - depthLeft / params.depth) * 0.35;
  const swayDelta =
    Math.sin(time * params.swaySpeed + depthLeft * 0.7) * swayAmp;
  const a = angle + swayDelta;
  const nx = x + Math.cos(a) * length;
  const ny = y + Math.sin(a) * length;

  const t = 1 - depthLeft / params.depth;
  const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
  ctx.strokeStyle = `hsla(${hue}, 75%, ${35 + t * 30}%, 0.95)`;
  ctx.lineWidth = Math.max(0.0625, thickness);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(nx, ny);
  ctx.stroke();

  if (depthLeft === 1 && params.leafBloom > 0) {
    ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${params.leafBloom})`;
    ctx.beginPath();
    ctx.arc(nx, ny, thickness * 1.2 + 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const branches = Math.max(2, Math.min(4, Math.round(params.branches)));
  const spread = (params.angle * Math.PI) / 180;
  for (let i = 0; i < branches; i++) {
    const fraction = branches === 1 ? 0 : i / (branches - 1) - 0.5;
    const jitter = ((rand01() - 0.5) * params.angleJitter * Math.PI) / 180;
    const childAngle = a + fraction * spread * 2 + jitter;
    const lenFactor = params.lengthRatio * (0.85 + rand01() * 0.3);
    drawBranch(
      nx,
      ny,
      childAngle,
      length * lenFactor,
      depthLeft - 1,
      thickness * params.thickDecay,
    );
  }
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = 'rgba(11, 10, 7, 0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  setSeed(treeSeed);
  const rootX = canvas.width / 2;
  const rootY = canvas.height * 0.95;
  ctx.lineCap = 'round';
  drawBranch(
    rootX,
    rootY,
    -Math.PI / 2,
    params.initialLength,
    Math.round(params.depth),
    params.thickness,
  );
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Fractal Tree',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 3, 13, 1);
gui.add(params, 'branches', 2, 4, 1);
gui.add(params, 'angle', 5, 80, 1);
gui.add(params, 'angleJitter', 0, 40, 0.5);
gui.add(params, 'lengthRatio', 0.4, 0.92, 0.01);
gui.add(params, 'initialLength', 40, 320, 1);
gui.add(params, 'thickness', 1, 30, 0.5);
gui.add(params, 'thickDecay', 0.4, 0.95, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'sway', 0, 1.5, 0.01);
gui.add(params, 'swaySpeed', 0, 3, 0.01);
gui.add(params, 'leafBloom', 0, 1, 0.01);

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
  params.depth = rand(7, 12, 1);
  params.branches = rand(2, 4, 1);
  params.angle = rand(12, 55, 1);
  params.angleJitter = rand(0, 20, 0.5);
  params.lengthRatio = rand(0.6, 0.85, 0.01);
  params.thickness = rand(4, 14, 0.5);
  params.thickDecay = rand(0.6, 0.85, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.sway = rand(0.1, 0.7, 0.01);
  params.leafBloom = rand(0.2, 0.9, 0.01);
  treeSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
});

gui.addButton('Reseed', () => {
  treeSeed = Math.floor(Math.random() * 1e9);
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
