// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  depth: 9, // 再帰深さ
  branches: 3, // 分岐数
  spread: 60, // 分岐角（度）
  lengthRatio: 0.72, // 子枝長さ比
  initialLength: 140, // 初期枝長さ
  thickness: 4, // 根元の太さ
  thickDecay: 0.72, // 太さ減衰
  jitter: 25, // 角度ゆらぎ（度）
  hue: 200, // 色相
  glow: 0.6, // 発光
  fadeSpeed: 0.04, // 残像消失速度
  spawnInterval: 1.1, // 放電間隔（秒）
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

let seed = 1;
function setSeed(n) {
  seed = n >>> 0 || 1;
}
function rnd() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) % 100000) / 100000;
}

let figureSeed = Math.floor(Math.random() * 1e9);
let lastSpawn = 0;
let time = 0;

/**
 * 放電枝を再帰描画
 * @param {number} x
 * @param {number} y
 * @param {number} angle
 * @param {number} length
 * @param {number} depthLeft
 * @param {number} thickness
 */
function drawBolt(x, y, angle, length, depthLeft, thickness) {
  if (depthLeft <= 0 || length < 1) return;
  const nx = x + Math.cos(angle) * length;
  const ny = y + Math.sin(angle) * length;
  const t = 1 - depthLeft / params.depth;
  const alpha = 0.85 - t * 0.35;
  ctx.strokeStyle = `hsla(${params.hue + t * 40}, 80%, ${60 + t * 20}%, ${alpha})`;
  ctx.lineWidth = Math.max(0.25, thickness);
  ctx.shadowBlur = params.glow * 16;
  ctx.shadowColor = `hsla(${params.hue}, 90%, 70%, ${params.glow})`;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(nx, ny);
  ctx.stroke();

  const branches = Math.max(2, Math.min(4, Math.round(params.branches)));
  const spread = (params.spread * Math.PI) / 180;
  for (let i = 0; i < branches; i++) {
    const frac = branches === 1 ? 0 : i / (branches - 1) - 0.5;
    const jitter = ((rnd() - 0.5) * params.jitter * Math.PI) / 180;
    drawBolt(
      nx,
      ny,
      angle + frac * spread + jitter,
      length * params.lengthRatio * (0.8 + rnd() * 0.4),
      depthLeft - 1,
      thickness * params.thickDecay,
    );
  }
}

function spawnFigure() {
  setSeed(figureSeed);
  ctx.lineCap = 'round';
  const branches = 5;
  for (let i = 0; i < branches; i++) {
    drawBolt(
      canvas.width / 2,
      canvas.height / 2,
      (i / branches) * Math.PI * 2 + rnd() * 0.5,
      params.initialLength,
      Math.round(params.depth),
      params.thickness,
    );
  }
  ctx.shadowBlur = 0;
}

function tick() {
  const dt = 1 / 60;
  time += dt;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.fadeSpeed})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (time - lastSpawn > params.spawnInterval) {
    figureSeed = Math.floor(Math.random() * 1e9);
    spawnFigure();
    lastSpawn = time;
  }
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Lichtenberg Figure',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 3, 12, 1);
gui.add(params, 'branches', 2, 4, 1);
gui.add(params, 'spread', 10, 180, 1);
gui.add(params, 'lengthRatio', 0.4, 0.9, 0.01);
gui.add(params, 'initialLength', 40, 260, 1);
gui.add(params, 'thickness', 1, 10, 0.25);
gui.add(params, 'thickDecay', 0.5, 0.95, 0.01);
gui.add(params, 'jitter', 0, 60, 0.5);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'glow', 0, 1, 0.01);
gui.add(params, 'fadeSpeed', 0.01, 0.3, 0.01);
gui.add(params, 'spawnInterval', 0.2, 4, 0.1);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

gui.addButton('Random', () => {
  params.depth = rand(6, 11, 1);
  params.branches = rand(2, 4, 1);
  params.spread = rand(30, 140, 1);
  params.lengthRatio = rand(0.55, 0.85, 0.01);
  params.initialLength = rand(60, 200, 1);
  params.jitter = rand(5, 50, 0.5);
  params.hue = rand(0, 360, 1);
  params.glow = rand(0.2, 0.9, 0.01);
  figureSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  gui.updateDisplay();
});
