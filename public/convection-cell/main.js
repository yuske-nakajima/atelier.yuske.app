// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  cellCols: 5, // セル列数
  cellRows: 3, // セル行数
  particleCount: 1500, // 粒子数
  rotationSpeed: 0.8, // 回転速度
  wobble: 0.3, // ゆらぎ
  hueHot: 20, // 高温色相（上昇流）
  hueCold: 210, // 低温色相（下降流）
  particleSize: 1.5, // 粒子サイズ
  fade: 0.08, // 残像フェード
  showCell: 0.15, // セル境界表示
  turbulence: 0.05, // 乱流量
  glow: 4, // グロー
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

/** @type {Array<{x:number,y:number,vx:number,vy:number}>} */
let particles = [];

function initParticles() {
  particles = [];
  const n = Math.max(1, Math.round(params.particleCount));
  for (let i = 0; i < n; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0,
    });
  }
}

initParticles();

// --- 対流ベクトル場 ---

/**
 * 対流セルのベクトル
 * @param {number} x
 * @param {number} y
 * @returns {[number, number, number]} [vx, vy, temperature]
 */
function flowField(x, y) {
  const cols = Math.max(1, Math.round(params.cellCols));
  const rows = Math.max(1, Math.round(params.cellRows));
  const cw = canvas.width / cols;
  const ch = canvas.height / rows;
  const cx = Math.floor(x / cw);
  const cy = Math.floor(y / ch);
  const lx = (x - cx * cw) / cw; // 0..1
  const ly = (y - cy * ch) / ch;
  // セルごとに交互に回転方向
  const dir = (cx + cy) % 2 === 0 ? 1 : -1;
  // 中心 (0.5, 0.5) からの角度で渦を作る
  const dx = lx - 0.5;
  const dy = ly - 0.5;
  const vx = -dy * dir * params.rotationSpeed;
  const vy = dx * dir * params.rotationSpeed;
  // 温度: 上昇中は高温、下降中は低温
  const temp = dir > 0 ? 0.5 - dy : 0.5 + dy;
  return [vx, vy, temp];
}

// --- ループ ---

let time = 0;

function update() {
  time += 1 / 60;
  for (const p of particles) {
    const [fx, fy, temp] = flowField(p.x, p.y);
    // ゆらぎ
    const wob = params.wobble;
    const wx = Math.sin(time * 0.8 + p.y * 0.01) * wob;
    const wy = Math.cos(time * 0.9 + p.x * 0.01) * wob;
    // 乱流
    const tx = (Math.random() - 0.5) * params.turbulence;
    const ty = (Math.random() - 0.5) * params.turbulence;
    p.vx = fx + wx + tx;
    p.vy = fy + wy + ty;
    p.x += p.vx;
    p.y += p.vy;
    // ループ
    if (p.x < 0) p.x += canvas.width;
    if (p.x > canvas.width) p.x -= canvas.width;
    if (p.y < 0) p.y += canvas.height;
    if (p.y > canvas.height) p.y -= canvas.height;
    // 描画
    const hue = params.hueCold + (params.hueHot - params.hueCold) * temp;
    ctx.fillStyle = `hsla(${hue}, 85%, 60%, 0.8)`;
    if (params.glow > 0) {
      ctx.shadowBlur = params.glow;
      ctx.shadowColor = `hsla(${hue}, 85%, 60%, 0.8)`;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, params.particleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawCellGrid() {
  if (params.showCell <= 0) return;
  const cols = Math.max(1, Math.round(params.cellCols));
  const rows = Math.max(1, Math.round(params.cellRows));
  ctx.strokeStyle = `rgba(255, 200, 180, ${params.showCell})`;
  ctx.lineWidth = 1;
  for (let i = 1; i < cols; i++) {
    const x = (canvas.width / cols) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let i = 1; i < rows; i++) {
    const y = (canvas.height / rows) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function draw() {
  ctx.fillStyle = `rgba(10, 5, 8, ${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCellGrid();
  update();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Convection Cell',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'cellCols', 1, 10, 1);
gui.add(params, 'cellRows', 1, 8, 1);
gui.add(params, 'particleCount', 100, 5000, 50).onChange(initParticles);
gui.add(params, 'rotationSpeed', 0, 3, 0.05);
gui.add(params, 'wobble', 0, 1.5, 0.01);
gui.add(params, 'hueHot', 0, 60, 1);
gui.add(params, 'hueCold', 180, 260, 1);
gui.add(params, 'particleSize', 0.5, 4, 0.1);
gui.add(params, 'fade', 0.02, 0.3, 0.01);
gui.add(params, 'showCell', 0, 0.5, 0.01);
gui.add(params, 'turbulence', 0, 0.3, 0.005);
gui.add(params, 'glow', 0, 15, 0.5);

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
  params.cellCols = rand(3, 8, 1);
  params.cellRows = rand(2, 5, 1);
  params.rotationSpeed = rand(0.3, 1.8, 0.05);
  params.wobble = rand(0.1, 0.8, 0.01);
  params.hueHot = rand(5, 45, 1);
  params.hueCold = rand(190, 240, 1);
  params.turbulence = rand(0.02, 0.15, 0.005);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initParticles();
  gui.updateDisplay();
});
