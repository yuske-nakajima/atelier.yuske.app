// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  strikeRate: 0.8, // 1 秒あたりの落雷頻度
  maxBranches: 5, // 分岐本数上限
  branchChance: 0.35, // 分岐確率
  jitter: 28, // 枝の横ずれ量
  segmentLen: 22, // 線分長
  decay: 0.82, // 子枝の振幅減衰
  lineWidth: 1.8, // 線幅
  glow: 24, // グロー強度
  hue: 210, // 雷の色相
  hueSpread: 30, // 色相のゆらぎ
  flashAlpha: 0.35, // 発光フラッシュ強度
  fadeSpeed: 0.18, // 残像のフェード速度
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
 * 1 本の雷を作成（再帰）
 * @param {number} x
 * @param {number} y
 * @param {number} angle 進行方向（ラジアン）
 * @param {number} amp 横ずれ振幅
 * @param {number} depth 残り深さ
 * @param {Array<{x1:number,y1:number,x2:number,y2:number,depth:number}>} segs
 */
function buildBolt(x, y, angle, amp, depth, segs) {
  if (depth <= 0) return;
  const targetY = canvas.height;
  let cx = x;
  let cy = y;
  let ca = angle;
  let branches = 0;
  while (cy < targetY && segs.length < 2000) {
    const jitter = (Math.random() - 0.5) * amp;
    const nx =
      cx +
      Math.cos(ca) * params.segmentLen +
      Math.cos(ca + Math.PI / 2) * jitter;
    const ny =
      cy +
      Math.sin(ca) * params.segmentLen +
      Math.sin(ca + Math.PI / 2) * jitter;
    segs.push({ x1: cx, y1: cy, x2: nx, y2: ny, depth });
    // 分岐
    if (branches < params.maxBranches && Math.random() < params.branchChance) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const branchAngle = ca + side * (0.4 + Math.random() * 0.4);
      buildBolt(nx, ny, branchAngle, amp * params.decay, depth - 1, segs);
      branches += 1;
    }
    cx = nx;
    cy = ny;
    // 方向を少しずつ揺らす
    ca += (Math.random() - 0.5) * 0.15;
  }
}

/** @type {Array<{path: Path2D, hue: number, life:number}>} */
const bolts = [];

/** 新しい落雷を発生させる */
function strike() {
  const startX = canvas.width * (0.15 + Math.random() * 0.7);
  /** @type {Array<{x1:number,y1:number,x2:number,y2:number,depth:number}>} */
  const segs = [];
  buildBolt(startX, 0, Math.PI / 2, params.jitter, 5, segs);
  // bolt 全体を 1 つの Path2D にまとめて 1 回の stroke で描画する
  const path = new Path2D();
  for (const s of segs) {
    path.moveTo(s.x1, s.y1);
    path.lineTo(s.x2, s.y2);
  }
  const boltHue = params.hue + (Math.random() - 0.5) * params.hueSpread;
  bolts.push({ path, hue: boltHue, life: 1 });
  // フラッシュ
  ctx.fillStyle = `hsla(${params.hue}, 60%, 90%, ${params.flashAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- ループ ---

function tick() {
  // 残像フェード
  ctx.fillStyle = `rgba(5, 5, 16, ${params.fadeSpeed})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 確率的に落雷発生
  if (Math.random() < params.strikeRate / 60) {
    strike();
  }

  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;
  ctx.lineWidth = Math.max(0.0625, params.lineWidth);
  for (let i = bolts.length - 1; i >= 0; i--) {
    const bolt = bolts[i];
    const color = `hsla(${bolt.hue}, 90%, 75%, ${bolt.life})`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.stroke(bolt.path);
    bolt.life -= 0.03;
    if (bolt.life <= 0) bolts.splice(i, 1);
  }
  ctx.shadowBlur = 0;

  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Lightning Strike',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'strikeRate', 0.05, 3, 0.05);
gui.add(params, 'maxBranches', 0, 10, 1);
gui.add(params, 'branchChance', 0, 0.8, 0.01);
gui.add(params, 'jitter', 0, 80, 1);
gui.add(params, 'segmentLen', 6, 60, 1);
gui.add(params, 'decay', 0.4, 0.98, 0.01);
gui.add(params, 'lineWidth', 0.5, 6, 0.1);
gui.add(params, 'glow', 0, 60, 1);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueSpread', 0, 120, 1);
gui.add(params, 'flashAlpha', 0, 0.8, 0.01);
gui.add(params, 'fadeSpeed', 0.02, 0.5, 0.01);

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
  params.strikeRate = rand(0.3, 2, 0.05);
  params.maxBranches = rand(2, 8, 1);
  params.branchChance = rand(0.15, 0.6, 0.01);
  params.jitter = rand(10, 50, 1);
  params.segmentLen = rand(12, 40, 1);
  params.decay = rand(0.7, 0.95, 0.01);
  params.hue = rand(180, 280, 1);
  params.hueSpread = rand(0, 60, 1);
  params.glow = rand(10, 40, 1);
  gui.updateDisplay();
});

gui.addButton('Strike', () => {
  strike();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
