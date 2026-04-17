// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Space Colonization 法で葉脈を成長させる。葉の輪郭内に魅力点を散布し、枝が最近傍で伸びる。
const params = {
  attractors: 600,
  killDistance: 8,
  influenceRadius: 60,
  stepLength: 4,
  maxSteps: 1500,
  leafWidth: 480,
  leafHeight: 700,
  hueStart: 90,
  hueEnd: 40,
  fadeAlpha: 0,
  lineWidth: 1.2,
  autoRegrow: true,
  regrowInterval: 8,
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
 * @typedef {object} Node
 * @property {number} x
 * @property {number} y
 * @property {Node|null} parent
 * @property {number} depth
 */

/** @type {{x:number,y:number}[]} */
let attractors = [];
/** @type {Node[]} */
let nodes = [];
let stepCount = 0;
let time = 0;
let lastRegrow = 0;

function isInLeaf(x, y, cx, cy) {
  // 葉の形: 両端がすぼむ楕円 (0.5 * (1 - cos(t)) で y 方向の幅を変える)
  const u = (y - (cy - params.leafHeight / 2)) / params.leafHeight; // 0..1
  if (u < 0 || u > 1) return false;
  const w = Math.sin(u * Math.PI) * params.leafWidth * 0.5;
  const dx = x - cx;
  return Math.abs(dx) <= w;
}

function reset() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  attractors = [];
  for (let i = 0; i < params.attractors; i++) {
    let x;
    let y;
    let tries = 0;
    do {
      x = cx + (Math.random() - 0.5) * params.leafWidth;
      y = cy + (Math.random() - 0.5) * params.leafHeight;
      tries++;
    } while (!isInLeaf(x, y, cx, cy) && tries < 20);
    attractors.push({ x, y });
  }
  nodes = [{ x: cx, y: cy + params.leafHeight / 2, parent: null, depth: 0 }];
  stepCount = 0;
  // 背景クリア
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // 葉の輪郭
  const seg = 80;
  ctx.strokeStyle = 'rgba(140, 180, 100, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const w = Math.sin(u * Math.PI) * params.leafWidth * 0.5;
    const y = cy - params.leafHeight / 2 + u * params.leafHeight;
    if (i === 0) ctx.moveTo(cx + w, y);
    else ctx.lineTo(cx + w, y);
  }
  for (let i = seg; i >= 0; i--) {
    const u = i / seg;
    const w = Math.sin(u * Math.PI) * params.leafWidth * 0.5;
    const y = cy - params.leafHeight / 2 + u * params.leafHeight;
    ctx.lineTo(cx - w, y);
  }
  ctx.closePath();
  ctx.stroke();
}
reset();

function step() {
  if (stepCount > params.maxSteps || attractors.length === 0) return;
  /** @type {Map<number, {dx:number, dy:number, count:number}>} */
  const influences = new Map();
  for (const a of attractors) {
    let nearest = -1;
    let minD = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      const d = Math.hypot(a.x - nodes[i].x, a.y - nodes[i].y);
      if (d < params.influenceRadius && d < minD) {
        minD = d;
        nearest = i;
      }
    }
    if (nearest >= 0) {
      const inf = influences.get(nearest) ?? { dx: 0, dy: 0, count: 0 };
      const dx = a.x - nodes[nearest].x;
      const dy = a.y - nodes[nearest].y;
      const len = Math.hypot(dx, dy) || 1;
      inf.dx += dx / len;
      inf.dy += dy / len;
      inf.count++;
      influences.set(nearest, inf);
    }
  }
  /** @type {Node[]} */
  const newNodes = [];
  for (const [idx, inf] of influences) {
    const base = nodes[idx];
    const len = Math.hypot(inf.dx, inf.dy) || 1;
    const nx = base.x + (inf.dx / len) * params.stepLength;
    const ny = base.y + (inf.dy / len) * params.stepLength;
    /** @type {Node} */
    const nn = { x: nx, y: ny, parent: base, depth: base.depth + 1 };
    newNodes.push(nn);
    // 描画（新しい枝）
    const k = Math.min(1, nn.depth / 80);
    const hue = params.hueStart + (params.hueEnd - params.hueStart) * k;
    ctx.strokeStyle = `hsla(${hue}, 70%, 55%, 0.85)`;
    ctx.lineWidth = params.lineWidth;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
  }
  nodes.push(...newNodes);
  // 到達済みアトラクタを削除
  attractors = attractors.filter((a) => {
    for (const n of nodes) {
      if (Math.hypot(a.x - n.x, a.y - n.y) < params.killDistance) return false;
    }
    return true;
  });
  stepCount++;
}

function draw() {
  time += 1 / 60;
  for (let i = 0; i < 2; i++) step();

  if (params.autoRegrow && time - lastRegrow > params.regrowInterval) {
    lastRegrow = time;
    reset();
  }

  // 枝先の光
  ctx.fillStyle = `rgba(11, 10, 7, ${params.fadeAlpha})`;
  if (params.fadeAlpha > 0) ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Leaf Venation',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'attractors', 100, 1500, 10);
gui.add(params, 'killDistance', 3, 20, 0.5);
gui.add(params, 'influenceRadius', 20, 150, 1);
gui.add(params, 'stepLength', 1, 10, 0.5);
gui.add(params, 'maxSteps', 100, 3000, 50);
gui.add(params, 'leafWidth', 200, 800, 5);
gui.add(params, 'leafHeight', 300, 900, 5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'lineWidth', 0.5, 3, 0.1);
gui.add(params, 'fadeAlpha', 0, 0.1, 0.005);
gui.add(params, 'autoRegrow');
gui.add(params, 'regrowInterval', 3, 30, 0.5);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.attractors = rand(300, 1000, 10);
  params.hueStart = rand(60, 160, 1);
  params.hueEnd = rand(20, 80, 1);
  params.leafWidth = rand(300, 600, 5);
  params.leafHeight = rand(500, 800, 5);
  reset();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  gui.updateDisplay();
});
