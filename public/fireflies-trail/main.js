// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 蛍の光跡：夏の夜に光跡を描きながら舞う蛍のビジュアル。
// 明滅パターンと光跡の軌跡で幻想的な情景を生成する。

const params = {
  count: 60, // 蛍の数
  flashRate: 0.008, // 点滅周期
  flashDuration: 40, // 点灯フレーム数
  moveSpeed: 1.2, // 移動速度
  trailLength: 80, // 光跡の長さ
  hueBase: 75, // 蛍の色相（黄緑）
  hueVar: 40, // 色相ばらつき
  trailFade: 0.1, // フェード強度
  glowSize: 8, // 発光サイズ
  windX: 0.3, // 風（X）
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

/** @typedef {{ x: number, y: number, vx: number, vy: number, hue: number, lit: number, phase: number, trail: {x:number,y:number}[] }} Firefly */

/** @type {Firefly[]} */
let flies = [];

/**
 * 蛍を初期化する
 */
function initFlies() {
  flies = [];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < params.count; i++) {
    flies.push({
      x: Math.random() * w,
      y: h * 0.3 + Math.random() * h * 0.5,
      vx: (Math.random() - 0.5) * params.moveSpeed,
      vy: (Math.random() - 0.5) * params.moveSpeed,
      hue: params.hueBase + (Math.random() - 0.5) * params.hueVar,
      lit: 0,
      phase: Math.random() * 1000,
      trail: [],
    });
  }
}
initFlies();

/**
 * 蛍を1ステップ更新する
 * @param {Firefly} fly
 */
function updateFly(fly) {
  const w = canvas.width;
  const h = canvas.height;

  // 点滅制御
  fly.phase += params.flashRate;
  if (Math.random() < params.flashRate) {
    fly.lit = params.flashDuration;
  }
  if (fly.lit > 0) fly.lit--;

  // 動き（ゆらゆら）
  fly.vx += (Math.random() - 0.5) * 0.2 + params.windX * 0.02;
  fly.vy += (Math.random() - 0.5) * 0.2 + Math.sin(fly.phase * 2) * 0.05;

  // 速度制限
  const speed = Math.hypot(fly.vx, fly.vy);
  if (speed > params.moveSpeed) {
    fly.vx = (fly.vx / speed) * params.moveSpeed;
    fly.vy = (fly.vy / speed) * params.moveSpeed;
  }

  fly.x += fly.vx;
  fly.y += fly.vy;

  // 光跡を記録（点灯中のみ）
  if (fly.lit > 0) {
    fly.trail.push({ x: fly.x, y: fly.y });
    if (fly.trail.length > params.trailLength) fly.trail.shift();
  } else {
    // 消えたら徐々に軌跡を消す
    if (fly.trail.length > 0 && Math.random() < 0.1) fly.trail.shift();
  }

  // 画面折り返し
  if (fly.x < -50) fly.x += w + 100;
  if (fly.x > w + 50) fly.x -= w + 100;
  if (fly.y < h * 0.1) fly.y = h * 0.1;
  if (fly.y > h * 0.95) fly.y = h * 0.95;
  fly.vy += (h * 0.6 - fly.y) * 0.0002;
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(3, 6, 10, ${params.trailFade})`;
  ctx.fillRect(0, 0, w, h);

  for (const fly of flies) {
    updateFly(fly);

    // 光跡を描く
    for (let i = 1; i < fly.trail.length; i++) {
      const t = i / fly.trail.length;
      ctx.strokeStyle = `hsla(${fly.hue}, 90%, 70%, ${t * 0.6})`;
      ctx.lineWidth = t * 1.5;
      ctx.beginPath();
      ctx.moveTo(fly.trail[i - 1].x, fly.trail[i - 1].y);
      ctx.lineTo(fly.trail[i].x, fly.trail[i].y);
      ctx.stroke();
    }

    // 本体（点灯中）
    if (fly.lit > 0) {
      const litFrac = fly.lit / params.flashDuration;
      const glow = params.glowSize * litFrac;
      const grd = ctx.createRadialGradient(
        fly.x,
        fly.y,
        0,
        fly.x,
        fly.y,
        glow * 2,
      );
      grd.addColorStop(0, `hsla(${fly.hue}, 100%, 95%, ${litFrac})`);
      grd.addColorStop(0.4, `hsla(${fly.hue}, 90%, 75%, ${litFrac * 0.7})`);
      grd.addColorStop(1, `hsla(${fly.hue}, 80%, 60%, 0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, glow * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Fireflies Trail',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 10, 200, 5).onChange(initFlies);
gui.add(params, 'flashRate', 0.001, 0.05, 0.001);
gui.add(params, 'flashDuration', 10, 100, 1);
gui.add(params, 'moveSpeed', 0.2, 4, 0.1);
gui.add(params, 'trailLength', 10, 200, 5);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueVar', 0, 180, 1);
gui.add(params, 'trailFade', 0.02, 0.5, 0.01);
gui.add(params, 'glowSize', 2, 25, 0.5);
gui.add(params, 'windX', -2, 2, 0.05);

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
  params.count = rand(20, 120, 5);
  params.flashRate = rand(0.002, 0.03, 0.001);
  params.flashDuration = rand(15, 80, 1);
  params.moveSpeed = rand(0.3, 3, 0.1);
  params.hueBase = rand(0, 360, 1);
  params.hueVar = rand(10, 120, 1);
  params.glowSize = rand(4, 20, 0.5);
  initFlies();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initFlies();
  gui.updateDisplay();
});
