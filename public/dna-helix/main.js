// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 二重螺旋 DNA。4 色の塩基対（A/T/G/C）が階段状に連結される。
const params = {
  rungs: 40, // 塩基対の数
  amplitude: 120,
  spacing: 18,
  twistSpeed: 0.4,
  twistFreq: 0.08, // y 方向の角速度
  hueA: 0,
  hueT: 60,
  hueG: 200,
  hueC: 140,
  strandWidth: 4,
  rungWidth: 3,
  trailFade: 0.12,
  rotation: 0,
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

let time = 0;

/** 塩基の乱数列（再生成抑制） */
let bases = /** @type {number[]} */ ([]);
function rebuildBases() {
  bases = [];
  for (let i = 0; i < 300; i++) bases.push(Math.floor(Math.random() * 4));
}
rebuildBases();

const baseHues = () => [params.hueA, params.hueT, params.hueG, params.hueC];

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const topY = 40;
  const n = Math.round(params.rungs);
  const totalH = n * params.spacing;
  const startY = Math.max(topY, canvas.height / 2 - totalH / 2);
  ctx.save();
  ctx.translate(cx, canvas.height / 2);
  ctx.rotate(params.rotation);
  ctx.translate(-cx, -canvas.height / 2);

  /** @type {{x:number,y:number,x2:number,y2:number,base:number}[]} */
  const rungPoints = [];

  for (let i = 0; i < n; i++) {
    const y = startY + i * params.spacing;
    const phase = y * params.twistFreq + time * params.twistSpeed * Math.PI * 2;
    const x1 = cx + Math.cos(phase) * params.amplitude;
    const x2 = cx + Math.cos(phase + Math.PI) * params.amplitude;
    // 深度（後ろの線は暗く）
    const depth1 = (Math.cos(phase) + 1) * 0.5;
    const depth2 = (Math.cos(phase + Math.PI) + 1) * 0.5;
    rungPoints.push({ x: x1, y, x2, y2: y, base: bases[i % bases.length] });
    // ストランドの点
    const hues = baseHues();
    const h = hues[bases[i % bases.length]];
    // 塩基対接続
    ctx.strokeStyle = `hsla(${h}, 80%, ${45 + Math.min(depth1, depth2) * 40}%, 0.9)`;
    ctx.lineWidth = params.rungWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    // ストランドの球
    ctx.fillStyle = `hsla(${h}, 90%, ${40 + depth1 * 50}%, 0.95)`;
    ctx.beginPath();
    ctx.arc(x1, y, 5 + depth1 * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${(h + 180) % 360}, 90%, ${40 + depth2 * 50}%, 0.95)`;
    ctx.beginPath();
    ctx.arc(x2, y, 5 + depth2 * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2 本の糖リン酸バックボーンを線でつなぐ
  for (let side = 0; side < 2; side++) {
    ctx.strokeStyle = `hsla(${side === 0 ? 200 : 20}, 60%, 70%, 0.5)`;
    ctx.lineWidth = params.strandWidth;
    ctx.beginPath();
    for (let i = 0; i < rungPoints.length; i++) {
      const p = rungPoints[i];
      const x = side === 0 ? p.x : p.x2;
      if (i === 0) ctx.moveTo(x, p.y);
      else ctx.lineTo(x, p.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'DNA Helix',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'rungs', 10, 100, 1);
gui.add(params, 'amplitude', 30, 250, 1);
gui.add(params, 'spacing', 6, 40, 0.5);
gui.add(params, 'twistSpeed', -2, 2, 0.01);
gui.add(params, 'twistFreq', 0.01, 0.3, 0.005);
gui.add(params, 'hueA', 0, 360, 1);
gui.add(params, 'hueT', 0, 360, 1);
gui.add(params, 'hueG', 0, 360, 1);
gui.add(params, 'hueC', 0, 360, 1);
gui.add(params, 'strandWidth', 1, 8, 0.1);
gui.add(params, 'rungWidth', 1, 8, 0.1);
gui.add(params, 'trailFade', 0.02, 0.3, 0.01);
gui.add(params, 'rotation', -3.14, 3.14, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.rungs = rand(25, 60, 1);
  params.amplitude = rand(80, 200, 1);
  params.spacing = rand(10, 25, 0.5);
  params.twistSpeed = rand(-0.8, 0.8, 0.01);
  params.hueA = rand(0, 360, 1);
  params.hueT = rand(0, 360, 1);
  params.hueG = rand(0, 360, 1);
  params.hueC = rand(0, 360, 1);
  rebuildBases();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuildBases();
  gui.updateDisplay();
});
