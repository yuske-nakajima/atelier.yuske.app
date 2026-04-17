// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// アリの橋：フェロモン強化学習でアリたちが最短経路の橋を形成する。
// 巣と食べ物を繋ぐ最短経路を徐々に発見していく。

const params = {
  antCount: 80, // アリの数
  pheromone: 0.8, // フェロモン強度
  evapRate: 0.98, // 蒸発率（1に近いほど遅く蒸発）
  randomness: 0.25, // ランダム探索率
  antSpeed: 2.0, // アリの速度
  antHue: 30, // アリの色相
  trailHue: 60, // フェロモントレイルの色相
  trailFade: 0.1, // フェード強度
  antSize: 3, // アリのサイズ
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initGrid();
}
window.addEventListener('resize', resize);

// フェロモングリッドの解像度
const GRID_RES = 4;
/** @type {number[][]} */
let pheroGrid = [];
let gridW = 0;
let gridH = 0;

function initGrid() {
  gridW = Math.ceil(canvas.width / GRID_RES);
  gridH = Math.ceil(canvas.height / GRID_RES);
  pheroGrid = Array.from({ length: gridW }, () => new Array(gridH).fill(0));
}

resize();

/**
 * @typedef {{ x: number, y: number, angle: number, toFood: boolean }} Ant
 */

/** @type {Ant[]} */
let ants = [];

/**
 * アリを初期化する
 */
function initAnts() {
  ants = [];
  const nestX = canvas.width * 0.15;
  const nestY = canvas.height / 2;
  for (let i = 0; i < params.antCount; i++) {
    ants.push({
      x: nestX + (Math.random() - 0.5) * 20,
      y: nestY + (Math.random() - 0.5) * 20,
      angle: Math.random() * Math.PI * 2,
      toFood: true,
    });
  }
}
initAnts();

/**
 * アリを1ステップ更新する
 * @param {Ant} ant
 */
function updateAnt(ant) {
  const w = canvas.width;
  const h = canvas.height;
  const nestX = w * 0.15;
  const nestY = h / 2;
  const foodX = w * 0.85;
  const foodY = h / 2;

  // 目標に近いかチェック
  const target = ant.toFood ? { x: foodX, y: foodY } : { x: nestX, y: nestY };
  const distToTarget = Math.hypot(ant.x - target.x, ant.y - target.y);
  if (distToTarget < 20) {
    ant.toFood = !ant.toFood;
    // フェロモンを強く残す
    const gx = Math.floor(ant.x / GRID_RES);
    const gy = Math.floor(ant.y / GRID_RES);
    if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
      pheroGrid[gx][gy] = Math.min(1, pheroGrid[gx][gy] + params.pheromone * 2);
    }
  }

  // フェロモン勾配に従う or ランダム
  if (Math.random() > params.randomness) {
    // 周囲のフェロモンを感知
    let bestAngle = ant.angle;
    let bestPher = -1;
    const sensorDist = 15;
    for (let da = -Math.PI / 3; da <= Math.PI / 3; da += Math.PI / 8) {
      const sa = ant.angle + da;
      const sx = ant.x + Math.cos(sa) * sensorDist;
      const sy = ant.y + Math.sin(sa) * sensorDist;
      const gx = Math.floor(sx / GRID_RES);
      const gy = Math.floor(sy / GRID_RES);
      if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
        if (pheroGrid[gx][gy] > bestPher) {
          bestPher = pheroGrid[gx][gy];
          bestAngle = sa;
        }
      }
    }
    ant.angle = bestAngle + (Math.random() - 0.5) * 0.3;
  } else {
    ant.angle += (Math.random() - 0.5) * 1.2;
  }

  ant.x += Math.cos(ant.angle) * params.antSpeed;
  ant.y += Math.sin(ant.angle) * params.antSpeed;

  // フェロモンを残す
  const gx = Math.floor(ant.x / GRID_RES);
  const gy = Math.floor(ant.y / GRID_RES);
  if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
    pheroGrid[gx][gy] = Math.min(
      1,
      pheroGrid[gx][gy] + params.pheromone * 0.05,
    );
  }

  // 壁反射
  if (ant.x < 0 || ant.x > w) ant.angle = Math.PI - ant.angle;
  if (ant.y < 0 || ant.y > h) ant.angle = -ant.angle;
  ant.x = Math.max(0, Math.min(w, ant.x));
  ant.y = Math.max(0, Math.min(h, ant.y));
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, w, h);

  // フェロモントレイルを描く
  for (let gx = 0; gx < gridW; gx++) {
    for (let gy = 0; gy < gridH; gy++) {
      const v = pheroGrid[gx][gy];
      if (v > 0.01) {
        ctx.fillStyle = `hsla(${params.trailHue}, 80%, 60%, ${v * 0.7})`;
        ctx.fillRect(gx * GRID_RES, gy * GRID_RES, GRID_RES, GRID_RES);
        // 蒸発
        pheroGrid[gx][gy] *= params.evapRate;
      }
    }
  }

  // 巣と食べ物を描く
  const nestX = w * 0.15;
  const nestY = h / 2;
  const foodX = w * 0.85;
  const foodY = h / 2;

  ctx.beginPath();
  ctx.arc(nestX, nestY, 15, 0, Math.PI * 2);
  ctx.fillStyle = 'hsl(30, 70%, 45%)';
  ctx.fill();
  ctx.strokeStyle = 'hsl(30, 70%, 70%)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(foodX, foodY, 15, 0, Math.PI * 2);
  ctx.fillStyle = 'hsl(120, 70%, 45%)';
  ctx.fill();
  ctx.strokeStyle = 'hsl(120, 70%, 70%)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // アリを更新・描画
  for (const ant of ants) {
    updateAnt(ant);
    ctx.save();
    ctx.translate(ant.x, ant.y);
    ctx.rotate(ant.angle);
    ctx.beginPath();
    const s = params.antSize;
    ctx.ellipse(0, 0, s * 1.5, s * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${params.antHue}, 60%, 55%)`;
    ctx.fill();
    ctx.restore();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Ant Bridge',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'antCount', 10, 200, 5).onChange(initAnts);
gui.add(params, 'pheromone', 0.1, 2.0, 0.05);
gui.add(params, 'evapRate', 0.9, 0.9999, 0.001);
gui.add(params, 'randomness', 0, 0.8, 0.01);
gui.add(params, 'antSpeed', 0.5, 5, 0.1);
gui.add(params, 'antHue', 0, 360, 1);
gui.add(params, 'trailHue', 0, 360, 1);
gui.add(params, 'antSize', 1, 8, 0.5);

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
  params.pheromone = rand(0.2, 1.5, 0.05);
  params.evapRate = rand(0.92, 0.999, 0.001);
  params.randomness = rand(0.05, 0.6, 0.01);
  params.antSpeed = rand(1, 4, 0.1);
  params.antHue = rand(0, 360, 1);
  params.trailHue = rand(0, 360, 1);
  initGrid();
  initAnts();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initGrid();
  initAnts();
  gui.updateDisplay();
});
