// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  puffCount: 120, // 雲を構成する球の数
  radiusMin: 30, // 最小半径
  radiusMax: 90, // 最大半径
  spreadX: 420, // 雲塊の横幅
  spreadY: 110, // 雲塊の縦幅
  cloudCount: 4, // 雲の数
  driftSpeed: 0.25, // 風速
  morph: 0.6, // 形状の揺らぎ量
  skyTop: 210, // 空の上部色相
  skyBottom: 195, // 空の下部色相
  cloudBright: 92, // 雲の明度
  shadow: 0.25, // 影の強さ
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

/**
 * @typedef {Object} Puff
 * @property {number} ox オフセット X
 * @property {number} oy オフセット Y
 * @property {number} r 半径
 * @property {number} phase フェーズ
 */

/**
 * @typedef {Object} Cloud
 * @property {number} x 中心 X
 * @property {number} y 中心 Y
 * @property {number} vx 速度
 * @property {number} depth 奥行き 0..1
 * @property {Puff[]} puffs パフ配列
 */

/** @type {Cloud[]} */
let clouds = [];

function rebuildClouds() {
  clouds = [];
  const n = Math.max(1, Math.round(params.cloudCount));
  for (let i = 0; i < n; i++) {
    const depth = Math.random();
    /** @type {Puff[]} */
    const puffs = [];
    const pn = Math.max(3, Math.round(params.puffCount / n));
    for (let j = 0; j < pn; j++) {
      puffs.push({
        ox: (Math.random() - 0.5) * params.spreadX,
        oy: (Math.random() - 0.5) * params.spreadY,
        r:
          params.radiusMin +
          Math.random() * (params.radiusMax - params.radiusMin),
        phase: Math.random() * Math.PI * 2,
      });
    }
    clouds.push({
      x: Math.random() * canvas.width,
      y: canvas.height * (0.2 + depth * 0.5),
      vx: (0.3 + depth * 0.7) * (1 + Math.random() * 0.4),
      depth,
      puffs,
    });
  }
}

rebuildClouds();

// --- 描画 ---

let time = 0;

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, `hsl(${params.skyTop}, 65%, 45%)`);
  grad.addColorStop(1, `hsl(${params.skyBottom}, 50%, 75%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/** @param {Cloud} cloud */
function drawCloud(cloud) {
  const scale = 0.5 + cloud.depth * 0.8;
  const light = params.cloudBright - (1 - cloud.depth) * 15;
  // 影
  ctx.fillStyle = `hsla(220, 30%, 40%, ${params.shadow})`;
  for (const p of cloud.puffs) {
    const morph = Math.sin(time * 0.8 + p.phase) * params.morph * 6;
    const r = (p.r + morph) * scale;
    ctx.beginPath();
    ctx.arc(
      cloud.x + p.ox * scale + 6,
      cloud.y + p.oy * scale + 8,
      r,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  // 本体
  ctx.fillStyle = `hsl(210, 15%, ${light}%)`;
  for (const p of cloud.puffs) {
    const morph = Math.sin(time * 0.8 + p.phase) * params.morph * 6;
    const r = (p.r + morph) * scale;
    ctx.beginPath();
    ctx.arc(cloud.x + p.ox * scale, cloud.y + p.oy * scale, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // ハイライト
  ctx.fillStyle = `hsla(60, 30%, 98%, 0.4)`;
  for (const p of cloud.puffs) {
    const r = p.r * scale * 0.5;
    ctx.beginPath();
    ctx.arc(
      cloud.x + p.ox * scale - 3,
      cloud.y + p.oy * scale - 4,
      r,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function update() {
  time += 1 / 60;
  for (const cloud of clouds) {
    cloud.x += cloud.vx * params.driftSpeed;
    if (cloud.x - params.spreadX > canvas.width) {
      cloud.x = -params.spreadX;
      cloud.y = canvas.height * (0.2 + cloud.depth * 0.5);
    }
  }
}

function draw() {
  drawSky();
  // 奥から手前へ描画
  clouds.sort((a, b) => a.depth - b.depth);
  for (const cloud of clouds) {
    drawCloud(cloud);
  }
}

function tick() {
  update();
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Cloud Formation',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'puffCount', 20, 400, 1).onChange(rebuildClouds);
gui.add(params, 'radiusMin', 5, 100, 1).onChange(rebuildClouds);
gui.add(params, 'radiusMax', 20, 200, 1).onChange(rebuildClouds);
gui.add(params, 'spreadX', 100, 800, 10).onChange(rebuildClouds);
gui.add(params, 'spreadY', 30, 300, 5).onChange(rebuildClouds);
gui.add(params, 'cloudCount', 1, 12, 1).onChange(rebuildClouds);
gui.add(params, 'driftSpeed', 0, 2, 0.01);
gui.add(params, 'morph', 0, 2, 0.01);
gui.add(params, 'skyTop', 150, 260, 1);
gui.add(params, 'skyBottom', 150, 260, 1);
gui.add(params, 'cloudBright', 60, 100, 1);
gui.add(params, 'shadow', 0, 0.6, 0.01);

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
  params.puffCount = rand(60, 200, 1);
  params.radiusMin = rand(15, 50, 1);
  params.radiusMax = rand(60, 120, 1);
  params.spreadX = rand(200, 600, 10);
  params.spreadY = rand(60, 160, 5);
  params.cloudCount = rand(3, 8, 1);
  params.driftSpeed = rand(0.1, 0.8, 0.01);
  params.morph = rand(0.2, 1.2, 0.01);
  params.skyTop = rand(190, 240, 1);
  params.skyBottom = rand(180, 220, 1);
  rebuildClouds();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuildClouds();
  gui.updateDisplay();
});
