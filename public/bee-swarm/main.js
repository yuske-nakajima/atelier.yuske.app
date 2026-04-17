// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// ミツバチの群れ：花の蜜を探して飛び回るミツバチの群れ。
// 各ミツバチは最も近い花に向かいながら群れを保つ。

const params = {
  beeCount: 120, // ミツバチの数
  flowerCount: 5, // 花の数
  attractForce: 0.04, // 花への引力
  swarmForce: 0.02, // 群れへの引力
  maxSpeed: 3.0, // 最高速度
  beeHue: 55, // ミツバチの色相（黄色）
  trailFade: 0.2, // フェード強度
  beeSize: 4, // ミツバチのサイズ
  wingFlap: 8, // 羽ばたき速度
  turbulence: 0.3, // 乱気流
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

/** @typedef {{ x: number, y: number, vx: number, vy: number, target: number, phase: number }} Bee */
/** @typedef {{ x: number, y: number, nectar: number }} Flower */

/** @type {Bee[]} */
let bees = [];
/** @type {Flower[]} */
let flowers = [];

/**
 * 花を初期化する
 */
function initFlowers() {
  flowers = [];
  const n = Math.max(1, Math.round(params.flowerCount));
  for (let i = 0; i < n; i++) {
    flowers.push({
      x: canvas.width * 0.1 + Math.random() * canvas.width * 0.8,
      y: canvas.height * 0.1 + Math.random() * canvas.height * 0.8,
      nectar: 0.5 + Math.random() * 0.5,
    });
  }
}

/**
 * ミツバチを初期化する
 */
function initBees() {
  bees = [];
  for (let i = 0; i < params.beeCount; i++) {
    bees.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2 + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      target: Math.floor(Math.random() * Math.max(1, params.flowerCount)),
      phase: Math.random() * Math.PI * 2,
    });
  }
}

initFlowers();
initBees();

let time = 0;

/**
 * ミツバチを1ステップ更新する
 * @param {Bee} bee
 */
function updateBee(bee) {
  const w = canvas.width;
  const h = canvas.height;
  const flowerCount = flowers.length;
  if (flowerCount === 0) return;

  bee.target = Math.min(bee.target, flowerCount - 1);
  const target = flowers[bee.target];

  // 花への引力
  bee.vx += (target.x - bee.x) * params.attractForce * 0.01;
  bee.vy += (target.y - bee.y) * params.attractForce * 0.01;

  // 群れへの引力（重心）
  let cx = 0;
  let cy = 0;
  for (const b of bees) {
    cx += b.x;
    cy += b.y;
  }
  cx /= bees.length;
  cy /= bees.length;
  bee.vx += (cx - bee.x) * params.swarmForce * 0.005;
  bee.vy += (cy - bee.y) * params.swarmForce * 0.005;

  // 乱気流
  bee.vx += (Math.random() - 0.5) * params.turbulence * 0.2;
  bee.vy += (Math.random() - 0.5) * params.turbulence * 0.2;

  // 速度制限
  const speed = Math.hypot(bee.vx, bee.vy);
  if (speed > params.maxSpeed) {
    bee.vx = (bee.vx / speed) * params.maxSpeed;
    bee.vy = (bee.vy / speed) * params.maxSpeed;
  }

  bee.x += bee.vx;
  bee.y += bee.vy;
  bee.phase += params.wingFlap * 0.1;

  // 花に到達したら次の花へ
  if (Math.hypot(bee.x - target.x, bee.y - target.y) < 15) {
    bee.target = Math.floor(Math.random() * flowerCount);
  }

  // 画面折り返し
  if (bee.x < 0) bee.x += w;
  if (bee.x > w) bee.x -= w;
  if (bee.y < 0) bee.y += h;
  if (bee.y > h) bee.y -= h;
}

/**
 * ミツバチを描く
 * @param {Bee} bee
 */
function drawBee(bee) {
  const angle = Math.atan2(bee.vy, bee.vx);
  const s = params.beeSize;
  ctx.save();
  ctx.translate(bee.x, bee.y);
  ctx.rotate(angle);

  // 羽
  const wingSpread = Math.sin(bee.phase) * s * 1.5;
  ctx.fillStyle = 'rgba(200, 230, 255, 0.5)';
  ctx.beginPath();
  ctx.ellipse(
    0,
    -s * 0.5,
    s * 1.2,
    s * 0.5 + Math.abs(wingSpread) * 0.3,
    0.4,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    0,
    s * 0.5,
    s * 1.2,
    s * 0.5 + Math.abs(wingSpread) * 0.3,
    -0.4,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // 胴体（縞模様）
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 1.5, s * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${params.beeHue}, 85%, 55%)`;
  ctx.fill();

  ctx.restore();
}

/**
 * 花を描く
 * @param {Flower} flower
 * @param {number} t 時間
 */
function drawFlower(flower, t) {
  const r = 12 + flower.nectar * 8;
  const petals = 6;
  ctx.save();
  ctx.translate(flower.x, flower.y);
  ctx.rotate(t * 0.3);
  for (let i = 0; i < petals; i++) {
    const a = (i * Math.PI * 2) / petals;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.5, r * 0.25, a, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${(t * 50 + i * 60) % 360}, 80%, 65%)`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'hsl(55, 90%, 70%)';
  ctx.fill();
  ctx.restore();
}

function draw() {
  time += 0.016;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, w, h);

  for (const flower of flowers) drawFlower(flower, time);
  for (const bee of bees) {
    updateBee(bee);
    drawBee(bee);
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Bee Swarm',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'beeCount', 20, 300, 10).onChange(initBees);
gui.add(params, 'flowerCount', 1, 15, 1).onChange(() => {
  initFlowers();
  initBees();
});
gui.add(params, 'attractForce', 0.005, 0.2, 0.005);
gui.add(params, 'swarmForce', 0, 0.15, 0.005);
gui.add(params, 'maxSpeed', 0.5, 8, 0.1);
gui.add(params, 'beeHue', 0, 360, 1);
gui.add(params, 'turbulence', 0, 2, 0.05);
gui.add(params, 'wingFlap', 1, 20, 0.5);
gui.add(params, 'beeSize', 1, 12, 0.5);

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
  params.beeCount = rand(40, 200, 10);
  params.flowerCount = rand(2, 10, 1);
  params.attractForce = rand(0.01, 0.15, 0.005);
  params.swarmForce = rand(0, 0.1, 0.005);
  params.maxSpeed = rand(1, 6, 0.1);
  params.beeHue = rand(0, 360, 1);
  params.turbulence = rand(0, 1.5, 0.05);
  initFlowers();
  initBees();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initFlowers();
  initBees();
  gui.updateDisplay();
});
