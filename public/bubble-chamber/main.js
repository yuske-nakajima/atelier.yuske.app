// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  particleCount: 30, // 粒子数
  fieldStrength: 0.04, // 磁場によるローレンツ力
  speed: 2.8, // 初速
  drag: 0.002, // 抵抗（螺旋を縮めていく）
  lineWidth: 1.2, // 軌跡線幅
  fadeSpeed: 0.015, // 残像フェード
  emitRate: 0.4, // 新粒子の発生率
  hueStart: 200, // 軌跡色相（開始）
  hueEnd: 320, // 軌跡色相（終端）
  bubbleSize: 2.0, // 散発する泡サイズ
  bubbleChance: 0.08, // 泡発生確率
  glow: 6, // グロー強度
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clearBg();
}

function clearBg() {
  ctx.fillStyle = '#04050a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resize);
resize();

/** @type {Array<{x:number,y:number,vx:number,vy:number,charge:number,life:number,maxLife:number,hue:number}>} */
let particles = [];

function spawn() {
  const n = Math.max(0, Math.round(params.particleCount));
  while (particles.length < n) {
    const ang = Math.random() * Math.PI * 2;
    const s = params.speed * (0.6 + Math.random() * 0.8);
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 40,
      y: canvas.height / 2 + (Math.random() - 0.5) * 40,
      vx: Math.cos(ang) * s,
      vy: Math.sin(ang) * s,
      charge: Math.random() < 0.5 ? 1 : -1,
      life: 0,
      maxLife: 400 + Math.random() * 600,
      hue: params.hueStart + Math.random() * (params.hueEnd - params.hueStart),
    });
  }
}

spawn();

// --- ループ ---

function update() {
  // 新規発生
  if (Math.random() < params.emitRate) spawn();

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    // ローレンツ力（磁場を画面外向きと仮定: v x B -> 垂直回転）
    const fx = -p.vy * params.fieldStrength * p.charge;
    const fy = p.vx * params.fieldStrength * p.charge;
    p.vx += fx;
    p.vy += fy;
    // 抵抗
    p.vx *= 1 - params.drag;
    p.vy *= 1 - params.drag;
    const nx = p.x + p.vx;
    const ny = p.y + p.vy;
    // 軌跡描画
    const t = p.life / p.maxLife;
    const hue = p.hue + t * 60;
    const alpha = 1 - t;
    ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${alpha})`;
    ctx.lineWidth = Math.max(0.0625, params.lineWidth);
    ctx.shadowBlur = params.glow;
    ctx.shadowColor = `hsla(${hue}, 90%, 70%, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    // 散発する泡
    if (Math.random() < params.bubbleChance) {
      ctx.fillStyle = `hsla(${hue}, 70%, 85%, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(
        nx,
        ny,
        params.bubbleSize * (0.5 + Math.random()),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    p.x = nx;
    p.y = ny;
    p.life += 1;
    // 範囲外または寿命切れ
    if (
      p.life > p.maxLife ||
      nx < -50 ||
      nx > canvas.width + 50 ||
      ny < -50 ||
      ny > canvas.height + 50
    ) {
      particles.splice(i, 1);
    }
  }
  ctx.shadowBlur = 0;
}

function draw() {
  // 残像フェード
  ctx.fillStyle = `rgba(4, 5, 10, ${params.fadeSpeed})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  update();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Bubble Chamber',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'particleCount', 5, 120, 1);
gui.add(params, 'fieldStrength', -0.15, 0.15, 0.002);
gui.add(params, 'speed', 0.5, 8, 0.1);
gui.add(params, 'drag', 0, 0.02, 0.001);
gui.add(params, 'lineWidth', 0.25, 4, 0.05);
gui.add(params, 'fadeSpeed', 0.002, 0.1, 0.002);
gui.add(params, 'emitRate', 0, 2, 0.05);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'bubbleSize', 0.5, 6, 0.1);
gui.add(params, 'bubbleChance', 0, 0.4, 0.01);
gui.add(params, 'glow', 0, 20, 0.5);

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
  params.particleCount = rand(15, 60, 1);
  params.fieldStrength = rand(-0.1, 0.1, 0.002);
  params.speed = rand(1.5, 5, 0.1);
  params.drag = rand(0.0005, 0.01, 0.001);
  params.emitRate = rand(0.1, 1, 0.05);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  gui.updateDisplay();
});

gui.addButton('Clear', () => {
  particles = [];
  clearBg();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  particles = [];
  clearBg();
  gui.updateDisplay();
});
