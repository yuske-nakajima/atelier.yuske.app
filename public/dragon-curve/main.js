// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  iterations: 12, // 反復回数
  angle: 90, // 回転角（度）
  segLen: 6, // 1 セグメントの長さ
  rotate: 0, // 全体の回転（度）
  offsetX: 0, // X オフセット
  offsetY: 0, // Y オフセット
  lineWidth: 1.4, // 線の太さ
  hue: 160, // 色相
  hueSpan: 180, // 色相の全幅
  saturation: 85, // 彩度
  lightness: 65, // 明度
  glow: 4, // グロー
  growSpeed: 0.7, // 描画成長速度
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  regenerate();
}
window.addEventListener('resize', resize);

/** @type {number[]} */
let turns = [];
/** @type {{x:number, y:number}[]} */
let points = [];
let drawnCount = 0;

function buildDragon(iter) {
  turns = [];
  for (let i = 0; i < iter; i++) {
    const rev = turns
      .slice()
      .reverse()
      .map((t) => 1 - t);
    turns = [...turns, 1, ...rev];
  }
}

function regenerate() {
  const iter = Math.max(1, Math.min(16, Math.floor(params.iterations)));
  buildDragon(iter);
  // 座標生成
  points = [];
  let x = 0;
  let y = 0;
  let dir = 0;
  const a = (params.angle * Math.PI) / 180;
  points.push({ x, y });
  for (const t of turns) {
    x += Math.cos(dir) * params.segLen;
    y += Math.sin(dir) * params.segLen;
    points.push({ x, y });
    dir += t === 1 ? a : -a;
  }
  x += Math.cos(dir) * params.segLen;
  y += Math.sin(dir) * params.segLen;
  points.push({ x, y });
  // フィットする中心オフセット
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (const p of points) {
    p.x -= cx;
    p.y -= cy;
  }
  drawnCount = 0;
}

resize();

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(
    canvas.width / 2 + params.offsetX,
    canvas.height / 2 + params.offsetY,
  );
  ctx.rotate((params.rotate * Math.PI) / 180);
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;
  const limit = Math.min(points.length - 1, Math.floor(drawnCount));
  for (let i = 0; i < limit; i++) {
    const t = i / Math.max(1, points.length - 2);
    const hue = (params.hue + t * params.hueSpan) % 360;
    const stroke = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.strokeStyle = stroke;
    ctx.shadowColor = stroke;
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.shadowBlur = 0;
  drawnCount = Math.min(
    points.length - 1,
    drawnCount + points.length * params.growSpeed * 0.02,
  );
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Dragon Curve',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'iterations', 1, 16, 1).onChange(regenerate);
gui.add(params, 'angle', 30, 150, 1).onChange(regenerate);
gui.add(params, 'segLen', 1, 20, 0.5).onChange(regenerate);
gui.add(params, 'rotate', -180, 180, 1);
gui.add(params, 'offsetX', -400, 400, 1);
gui.add(params, 'offsetY', -400, 400, 1);
gui.add(params, 'lineWidth', 0.3, 5, 0.05);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueSpan', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 10, 90, 1);
gui.add(params, 'glow', 0, 20, 0.5);
gui.add(params, 'growSpeed', 0, 3, 0.05);

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
  params.iterations = rand(8, 14, 1);
  params.angle = rand(60, 120, 1);
  params.segLen = rand(2, 10, 0.5);
  params.rotate = rand(-180, 180, 1);
  params.hue = rand(0, 360, 1);
  params.hueSpan = rand(60, 300, 1);
  regenerate();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  regenerate();
  gui.updateDisplay();
});
