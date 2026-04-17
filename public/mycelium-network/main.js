// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 菌糸ネットワーク：先端がランダムに曲がりながら伸び、一定確率で分岐、既存の糸に近づくと結合する。
const params = {
  seeds: 6,
  maxTips: 220,
  stepLength: 2.4,
  wanderAmt: 0.18,
  branchProb: 0.012,
  terminateProb: 0.002,
  connectRadius: 8,
  hueStart: 40,
  hueEnd: 320,
  lineWidth: 1.1,
  fade: 0.015,
  glowAlpha: 0.35,
  autoRegrow: true,
  regrowInterval: 14,
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
 * @typedef {object} Tip
 * @property {number} x
 * @property {number} y
 * @property {number} angle
 * @property {number} depth
 * @property {number} age
 */

/** @type {Tip[]} */
let tips = [];
/** @type {{x:number, y:number}[]} */
let trace = [];
let time = 0;
let lastRegrow = 0;

function reset() {
  tips = [];
  trace = [];
  for (let i = 0; i < Math.round(params.seeds); i++) {
    tips.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      angle: Math.random() * Math.PI * 2,
      depth: 0,
      age: 0,
    });
  }
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
reset();

function nearestDistance(x, y, ignoreIdx) {
  let minD = Infinity;
  for (let i = 0; i < trace.length; i++) {
    if (i === ignoreIdx) continue;
    const p = trace[i];
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < minD) minD = d;
  }
  return minD;
}

function step() {
  /** @type {Tip[]} */
  const newTips = [];
  for (const tip of tips) {
    tip.angle += (Math.random() - 0.5) * params.wanderAmt;
    const nx = tip.x + Math.cos(tip.angle) * params.stepLength;
    const ny = tip.y + Math.sin(tip.angle) * params.stepLength;
    // 画面外なら折り返し
    if (nx < 0 || nx > canvas.width || ny < 0 || ny > canvas.height) {
      tip.angle += Math.PI;
      continue;
    }
    const k = Math.min(1, tip.depth / 300);
    const hue = params.hueStart + (params.hueEnd - params.hueStart) * k;
    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.85)`;
    ctx.lineWidth = params.lineWidth;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    // グロー
    ctx.fillStyle = `hsla(${hue}, 90%, 80%, ${params.glowAlpha})`;
    ctx.beginPath();
    ctx.arc(nx, ny, 2.4, 0, Math.PI * 2);
    ctx.fill();

    tip.x = nx;
    tip.y = ny;
    tip.depth++;
    tip.age++;
    trace.push({ x: nx, y: ny });
    if (trace.length > 3000) trace.shift();

    // 近傍結合（終端）
    if (tip.depth > 8) {
      const minD = nearestDistance(nx, ny, trace.length - 1);
      if (minD < params.connectRadius) {
        continue; // tip 削除
      }
    }
    // 分岐
    if (
      tips.length + newTips.length < params.maxTips &&
      Math.random() < params.branchProb
    ) {
      newTips.push({
        x: nx,
        y: ny,
        angle: tip.angle + (Math.random() - 0.5) * 1.2,
        depth: tip.depth,
        age: 0,
      });
    }
    // 終端
    if (Math.random() < params.terminateProb) continue;
    newTips.push(tip);
  }
  tips = newTips;
}

function draw() {
  time += 1 / 60;
  if (params.fade > 0) {
    ctx.fillStyle = `rgba(11, 10, 7, ${params.fade})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  step();
  if (params.autoRegrow) {
    if (
      (tips.length === 0 || time - lastRegrow > params.regrowInterval) &&
      time > 1
    ) {
      lastRegrow = time;
      reset();
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Mycelium Network',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'seeds', 1, 20, 1);
gui.add(params, 'maxTips', 30, 500, 5);
gui.add(params, 'stepLength', 0.5, 6, 0.1);
gui.add(params, 'wanderAmt', 0, 0.6, 0.01);
gui.add(params, 'branchProb', 0, 0.1, 0.001);
gui.add(params, 'terminateProb', 0, 0.02, 0.0005);
gui.add(params, 'connectRadius', 2, 25, 0.5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'lineWidth', 0.3, 2.5, 0.1);
gui.add(params, 'fade', 0, 0.05, 0.001);
gui.add(params, 'glowAlpha', 0, 1, 0.01);
gui.add(params, 'autoRegrow');
gui.add(params, 'regrowInterval', 5, 40, 0.5);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.seeds = rand(3, 12, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.branchProb = rand(0.005, 0.03, 0.001);
  params.wanderAmt = rand(0.08, 0.3, 0.01);
  reset();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  gui.updateDisplay();
});
