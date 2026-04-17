// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// グラニュラーシンセの粒を視覚化。ソース波形からランダムに小さい粒をサンプリングして空間にばらまく。
const params = {
  grainRate: 60, // 1 秒あたりのグレイン生成数
  grainLifetime: 1.8,
  grainSize: 4,
  sourceFreq: 0.5,
  scatterX: 400,
  scatterY: 280,
  driftY: 20,
  hueStart: 30,
  hueRange: 300,
  alpha: 0.8,
  trailFade: 0.08,
  pitchJitter: 0.6,
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

/** @type {{x:number,y:number,vx:number,vy:number,t:number,life:number,hue:number,size:number}[]} */
let grains = [];
let time = 0;
let spawnBudget = 0;

function spawn() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const dx = (Math.random() - 0.5) * params.scatterX;
  const dy = (Math.random() - 0.5) * params.scatterY;
  const pitch = 1 + (Math.random() - 0.5) * params.pitchJitter;
  const hue =
    params.hueStart +
    (Math.sin(time * params.sourceFreq) + 1) * 0.5 * params.hueRange +
    pitch * 20;
  grains.push({
    x: cx + dx,
    y: cy + dy,
    vx: (Math.random() - 0.5) * 20,
    vy: -Math.random() * params.driftY,
    t: 0,
    life: params.grainLifetime * (0.7 + Math.random() * 0.6),
    hue,
    size: params.grainSize * (0.6 + Math.random() * 0.8) * pitch,
  });
}

function draw() {
  const dt = 1 / 60;
  time += dt;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  spawnBudget += params.grainRate * dt;
  while (spawnBudget >= 1) {
    spawn();
    spawnBudget--;
  }

  grains = grains.filter((g) => g.t < g.life);
  for (const g of grains) {
    g.t += dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.vy -= 5 * dt; // ふわっと上昇
    const k = g.t / g.life;
    const a = params.alpha * Math.sin(k * Math.PI); // 包絡
    ctx.fillStyle = `hsla(${g.hue}, 90%, 70%, ${a})`;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.size * (1 - k * 0.3), 0, Math.PI * 2);
    ctx.fill();
    // グロー
    ctx.fillStyle = `hsla(${g.hue}, 100%, 80%, ${a * 0.4})`;
    ctx.beginPath();
    ctx.arc(g.x, g.y, g.size * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ソース波形の線（装飾）
  ctx.strokeStyle = `hsla(${params.hueStart + 180}, 60%, 60%, 0.3)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const mid = canvas.height / 2;
  const amp = 60;
  for (let x = 0; x < canvas.width; x += 3) {
    const y = mid + Math.sin(x * 0.02 + time * params.sourceFreq * 3) * amp;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Granular Cloud',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'grainRate', 10, 300, 1);
gui.add(params, 'grainLifetime', 0.3, 5, 0.05);
gui.add(params, 'grainSize', 1, 15, 0.1);
gui.add(params, 'sourceFreq', 0.05, 2, 0.01);
gui.add(params, 'scatterX', 50, 800, 1);
gui.add(params, 'scatterY', 30, 500, 1);
gui.add(params, 'driftY', 0, 80, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'alpha', 0.2, 1, 0.01);
gui.add(params, 'trailFade', 0.02, 0.3, 0.01);
gui.add(params, 'pitchJitter', 0, 2, 0.05);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.grainRate = rand(30, 150, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  params.sourceFreq = rand(0.2, 1.2, 0.01);
  params.driftY = rand(5, 60, 1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  grains = [];
  gui.updateDisplay();
});
