// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  iterations: 3,
  initialSize: 300,
  ratio: 1 / Math.sqrt(7), // Gosper の縮小比
  hueStart: 180,
  hueEnd: 80,
  strokeAlpha: 0.9,
  fillAlpha: 0.15,
  thickness: 1.4,
  rotation: 0,
  rotSpeed: 0.05,
  bloom: 0.3,
  showOutline: true,
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

// Gosper 曲線 (flowsnake) を L-System 的に生成
// Rules: A -> A-B--B+A++AA+B-  /  B -> +A-BB--B-A++A+B
// 基本 angle = 60 度
function generateGosper(depth) {
  let s = 'A';
  for (let i = 0; i < depth; i++) {
    let next = '';
    for (const c of s) {
      if (c === 'A') next += 'A-B--B+A++AA+B-';
      else if (c === 'B') next += '+A-BB--B-A++A+B';
      else next += c;
    }
    s = next;
  }
  return s;
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = 'rgba(11, 10, 7, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const ang = params.rotation + time * params.rotSpeed;

  const depth = Math.round(params.iterations);
  const s = generateGosper(depth);
  const step = params.initialSize * params.ratio ** depth;
  const turn = (60 * Math.PI) / 180;

  // 先に構築（中心合わせのため）
  /** @type {{x:number,y:number}[]} */
  const pts = [];
  let x = 0;
  let y = 0;
  let a = 0;
  pts.push({ x, y });
  for (const c of s) {
    if (c === 'A' || c === 'B') {
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      pts.push({ x, y });
    } else if (c === '+') a += turn;
    else if (c === '-') a -= turn;
  }
  // bbox 中心
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const ox = (minX + maxX) / 2;
  const oy = (minY + maxY) / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.beginPath();
  const p0 = pts[0];
  ctx.moveTo(p0.x - ox, p0.y - oy);
  for (let i = 1; i < pts.length; i++) {
    const t = i / pts.length;
    const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${params.strokeAlpha})`;
    ctx.lineWidth = params.thickness;
    ctx.beginPath();
    ctx.moveTo(pts[i - 1].x - ox, pts[i - 1].y - oy);
    ctx.lineTo(pts[i].x - ox, pts[i].y - oy);
    ctx.stroke();
  }

  if (params.showOutline) {
    // 全体を閉じて塗り
    ctx.fillStyle = `hsla(${params.hueStart}, 80%, 50%, ${params.fillAlpha})`;
    ctx.beginPath();
    ctx.moveTo(pts[0].x - ox, pts[0].y - oy);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x - ox, pts[i].y - oy);
    }
    ctx.closePath();
    ctx.fill();
  }

  if (params.bloom > 0) {
    ctx.fillStyle = `hsla(${params.hueEnd}, 90%, 70%, ${params.bloom})`;
    ctx.beginPath();
    ctx.arc(p0.x - ox, p0.y - oy, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Gosper Island',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'iterations', 0, 4, 1);
gui.add(params, 'initialSize', 120, 500, 1);
gui.add(params, 'ratio', 0.2, 0.6, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'strokeAlpha', 0.1, 1, 0.01);
gui.add(params, 'fillAlpha', 0, 0.6, 0.01);
gui.add(params, 'thickness', 0.3, 4, 0.1);
gui.add(params, 'rotation', -3.14, 3.14, 0.01);
gui.add(params, 'rotSpeed', -0.5, 0.5, 0.01);
gui.add(params, 'bloom', 0, 1, 0.01);
gui.add(params, 'showOutline');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.iterations = rand(2, 4, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.rotSpeed = rand(-0.2, 0.2, 0.01);
  params.fillAlpha = rand(0.05, 0.35, 0.01);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
