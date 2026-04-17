// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 群泳する魚：Boid アルゴリズムで魚の群泳を表現。
// 分離・整列・結合の3ルールで自然な群れ行動を生成する。

const params = {
  count: 150, // 魚の数
  separateDist: 25, // 分離距離
  alignDist: 60, // 整列距離
  cohesionDist: 80, // 結合距離
  separateForce: 1.5, // 分離力
  alignForce: 0.8, // 整列力
  cohesionForce: 0.5, // 結合力
  maxSpeed: 3.5, // 最高速度
  fishHue: 190, // 魚の色相
  trailFade: 0.15, // フェード強度
  fishSize: 7, // 魚のサイズ
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

/** @typedef {{ x: number, y: number, vx: number, vy: number }} Fish */

/** @type {Fish[]} */
let fishes = [];

/**
 * 魚の群れを初期化する
 */
function initFishes() {
  fishes = [];
  for (let i = 0; i < params.count; i++) {
    fishes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * params.maxSpeed,
      vy: (Math.random() - 0.5) * params.maxSpeed,
    });
  }
}
initFishes();

/**
 * 2点間の距離を計算する
 * @param {Fish} a
 * @param {Fish} b
 * @returns {number}
 */
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * 各魚にBoidルールを適用して速度を更新する
 */
function updateFishes() {
  const w = canvas.width;
  const h = canvas.height;

  for (const fish of fishes) {
    let sepX = 0;
    let sepY = 0;
    let aliVx = 0;
    let aliVy = 0;
    let cohX = 0;
    let cohY = 0;
    let sepN = 0;
    let aliN = 0;
    let cohN = 0;

    for (const other of fishes) {
      if (other === fish) continue;
      const d = dist(fish, other);
      if (d < params.separateDist) {
        sepX += fish.x - other.x;
        sepY += fish.y - other.y;
        sepN++;
      }
      if (d < params.alignDist) {
        aliVx += other.vx;
        aliVy += other.vy;
        aliN++;
      }
      if (d < params.cohesionDist) {
        cohX += other.x;
        cohY += other.y;
        cohN++;
      }
    }

    if (sepN > 0) {
      fish.vx += (sepX / sepN) * params.separateForce * 0.05;
      fish.vy += (sepY / sepN) * params.separateForce * 0.05;
    }
    if (aliN > 0) {
      fish.vx += (aliVx / aliN - fish.vx) * params.alignForce * 0.05;
      fish.vy += (aliVy / aliN - fish.vy) * params.alignForce * 0.05;
    }
    if (cohN > 0) {
      fish.vx += (cohX / cohN - fish.x) * params.cohesionForce * 0.001;
      fish.vy += (cohY / cohN - fish.y) * params.cohesionForce * 0.001;
    }

    // 速度制限
    const speed = Math.hypot(fish.vx, fish.vy);
    if (speed > params.maxSpeed) {
      fish.vx = (fish.vx / speed) * params.maxSpeed;
      fish.vy = (fish.vy / speed) * params.maxSpeed;
    }

    fish.x += fish.vx;
    fish.y += fish.vy;

    // 画面折り返し
    if (fish.x < 0) fish.x += w;
    if (fish.x > w) fish.x -= w;
    if (fish.y < 0) fish.y += h;
    if (fish.y > h) fish.y -= h;
  }
}

/**
 * 魚を描く（魚形の三角形）
 * @param {Fish} fish
 */
function drawFish(fish) {
  const angle = Math.atan2(fish.vy, fish.vx);
  const s = params.fishSize;
  ctx.save();
  ctx.translate(fish.x, fish.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.6, -s * 0.4);
  ctx.lineTo(-s * 0.6, s * 0.4);
  ctx.closePath();
  const speed = Math.hypot(fish.vx, fish.vy) / params.maxSpeed;
  const hue = params.fishHue + speed * 40;
  ctx.fillStyle = `hsl(${hue}, 70%, ${50 + speed * 20}%)`;
  ctx.fill();
  ctx.restore();
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, w, h);

  updateFishes();
  for (const fish of fishes) drawFish(fish);
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Schooling Fish',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 20, 400, 10).onChange(initFishes);
gui.add(params, 'separateDist', 5, 80, 1);
gui.add(params, 'alignDist', 20, 150, 1);
gui.add(params, 'cohesionDist', 20, 200, 1);
gui.add(params, 'separateForce', 0, 5, 0.1);
gui.add(params, 'alignForce', 0, 3, 0.05);
gui.add(params, 'cohesionForce', 0, 3, 0.05);
gui.add(params, 'maxSpeed', 0.5, 8, 0.1);
gui.add(params, 'fishHue', 0, 360, 1);
gui.add(params, 'fishSize', 2, 20, 0.5);

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
  params.separateDist = rand(10, 50, 1);
  params.alignDist = rand(30, 100, 1);
  params.cohesionDist = rand(40, 150, 1);
  params.separateForce = rand(0.5, 4, 0.1);
  params.alignForce = rand(0.2, 2, 0.05);
  params.cohesionForce = rand(0.1, 2, 0.05);
  params.maxSpeed = rand(1, 6, 0.1);
  params.fishHue = rand(0, 360, 1);
  initFishes();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initFishes();
  gui.updateDisplay();
});
