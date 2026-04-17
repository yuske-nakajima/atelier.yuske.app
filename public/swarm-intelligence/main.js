// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  antCount: 300, // アリの数
  gridScale: 6, // フェロモングリッドの解像度（px/cell）
  speed: 1.2, // 移動速度
  wander: 0.35, // ランダム揺らぎ
  sensorAngle: 35, // 触角の角度（度）
  sensorDistance: 14, // 触角の距離
  deposit: 1.0, // フェロモン沈着量
  evaporation: 0.012, // 蒸発率
  diffusion: 0.18, // 拡散率
  hueBase: 140, // 基本色相
  trailAlpha: 0.85, // トレイル表示強度
  showAnts: true, // アリを描画
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

const offscreen = document.createElement('canvas');
const offCtx = /** @type {CanvasRenderingContext2D} */ (
  offscreen.getContext('2d')
);

let W = 0;
let H = 0;
/** @type {Float32Array} */
let field = new Float32Array(0);
/** @type {Float32Array} */
let buf = new Float32Array(0);

/** @type {{x:number,y:number,a:number}[]} */
let ants = [];

function setupGrid() {
  const s = Math.max(2, Math.floor(params.gridScale));
  W = Math.ceil(window.innerWidth / s);
  H = Math.ceil(window.innerHeight / s);
  field = new Float32Array(W * H);
  buf = new Float32Array(W * H);
  offscreen.width = W;
  offscreen.height = H;
}

function spawnAnts() {
  ants = [];
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  for (let i = 0; i < params.antCount; i++) {
    ants.push({
      x: cx + (Math.random() - 0.5) * 80,
      y: cy + (Math.random() - 0.5) * 80,
      a: Math.random() * Math.PI * 2,
    });
  }
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  setupGrid();
}
window.addEventListener('resize', resize);
resize();
spawnAnts();

/**
 * @param {number} x
 * @param {number} y
 */
function sampleField(x, y) {
  const s = params.gridScale;
  const gx = Math.max(0, Math.min(W - 1, Math.floor(x / s)));
  const gy = Math.max(0, Math.min(H - 1, Math.floor(y / s)));
  return field[gy * W + gx];
}

function stepAnts() {
  const sensorA = (params.sensorAngle * Math.PI) / 180;
  const sensorD = params.sensorDistance;
  const sp = params.speed;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const s = params.gridScale;
  for (const ant of ants) {
    // 触角サンプル（前、左、右）
    const fA = ant.a;
    const lA = ant.a - sensorA;
    const rA = ant.a + sensorA;
    const fV = sampleField(
      ant.x + Math.cos(fA) * sensorD,
      ant.y + Math.sin(fA) * sensorD,
    );
    const lV = sampleField(
      ant.x + Math.cos(lA) * sensorD,
      ant.y + Math.sin(lA) * sensorD,
    );
    const rV = sampleField(
      ant.x + Math.cos(rA) * sensorD,
      ant.y + Math.sin(rA) * sensorD,
    );
    if (fV > lV && fV > rV) {
      // 直進
    } else if (lV > rV) {
      ant.a -= sensorA * 0.5;
    } else if (rV > lV) {
      ant.a += sensorA * 0.5;
    }
    ant.a += (Math.random() - 0.5) * params.wander;
    ant.x += Math.cos(ant.a) * sp;
    ant.y += Math.sin(ant.a) * sp;
    // 境界で反射
    if (ant.x < 0) {
      ant.x = 0;
      ant.a = Math.PI - ant.a;
    }
    if (ant.x >= w) {
      ant.x = w - 1;
      ant.a = Math.PI - ant.a;
    }
    if (ant.y < 0) {
      ant.y = 0;
      ant.a = -ant.a;
    }
    if (ant.y >= h) {
      ant.y = h - 1;
      ant.a = -ant.a;
    }
    // 沈着
    const gx = Math.floor(ant.x / s);
    const gy = Math.floor(ant.y / s);
    if (gx >= 0 && gx < W && gy >= 0 && gy < H) {
      field[gy * W + gx] = Math.min(
        4,
        field[gy * W + gx] + params.deposit * 0.1,
      );
    }
  }
}

function diffuse() {
  const d = params.diffusion;
  const evap = params.evaporation;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      const xm = x > 0 ? idx - 1 : idx;
      const xp = x < W - 1 ? idx + 1 : idx;
      const ym = y > 0 ? idx - W : idx;
      const yp = y < H - 1 ? idx + W : idx;
      const avg = (field[xm] + field[xp] + field[ym] + field[yp]) * 0.25;
      buf[idx] = Math.max(0, field[idx] * (1 - d) + avg * d - evap);
    }
  }
  [field, buf] = [buf, field];
}

function render() {
  const img = offCtx.createImageData(W, H);
  const data = img.data;
  const hue = params.hueBase;
  for (let i = 0; i < W * H; i++) {
    const v = Math.min(1, field[i] * params.trailAlpha);
    const j = i * 4;
    // HSL っぽい変換を簡易化: 緑系→黄色
    const r = v * 255 * ((hue % 360) / 360 < 0.3 ? 0.3 : 0.9);
    const g = v * 255;
    const b = v * 255 * 0.3;
    data[j] = r;
    data[j + 1] = g;
    data[j + 2] = b;
    data[j + 3] = v * 255;
  }
  offCtx.putImageData(img, 0, 0);
  ctx.fillStyle = '#05080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
  if (params.showAnts) {
    ctx.fillStyle = `hsla(${params.hueBase + 40}, 80%, 85%, 0.9)`;
    for (const ant of ants) {
      ctx.fillRect(ant.x - 1, ant.y - 1, 2, 2);
    }
  }
}

function tick() {
  stepAnts();
  diffuse();
  render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- GUI ---

const gui = new TileUI({
  title: 'Swarm Intelligence',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'antCount', 50, 800, 10).onChange(spawnAnts);
gui.add(params, 'gridScale', 3, 12, 1).onChange(setupGrid);
gui.add(params, 'speed', 0.3, 3, 0.1);
gui.add(params, 'wander', 0, 1, 0.01);
gui.add(params, 'sensorAngle', 10, 90, 1);
gui.add(params, 'sensorDistance', 4, 40, 1);
gui.add(params, 'deposit', 0.1, 3, 0.05);
gui.add(params, 'evaporation', 0, 0.05, 0.001);
gui.add(params, 'diffusion', 0, 0.5, 0.01);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'trailAlpha', 0.1, 2, 0.05);
gui.add(params, 'showAnts');

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.antCount = r(150, 500, 10);
  params.speed = r(0.6, 2, 0.1);
  params.wander = r(0.1, 0.6, 0.01);
  params.sensorAngle = r(20, 60, 1);
  params.sensorDistance = r(8, 24, 1);
  params.deposit = r(0.5, 2, 0.05);
  params.evaporation = r(0.005, 0.03, 0.001);
  params.diffusion = r(0.05, 0.3, 0.01);
  params.hueBase = r(0, 360, 1);
  gui.updateDisplay();
  spawnAnts();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  setupGrid();
  spawnAnts();
  gui.updateDisplay();
});
