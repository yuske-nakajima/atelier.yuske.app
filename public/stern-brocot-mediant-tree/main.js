// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Stern-Brocot 木: 中央分数から mediant で子ノードを生成
const params = {
  depth: 7,
  nodeRadius: 5,
  lineWidth: 1,
  hue: 280,
  hueShift: 30,
  saturation: 65,
  lightness: 60,
  alpha: 0.9,
  spread: 1,
  padding: 60,
  showLabel: false,
  glow: 3,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
let dirty = true;
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  dirty = true;
}
addEventListener('resize', resize);

function buildTree(depth) {
  // 各ノード: {p,q, leftBoundP,leftBoundQ, rightBoundP,rightBoundQ, level}
  const nodes = [];
  function rec(lp, lq, rp, rq, level, xPos) {
    if (level > depth) return;
    const p = lp + rp;
    const q = lq + rq;
    nodes.push({ p, q, level, xPos });
    const mid = xPos;
    const w = 1 / 2 ** level;
    rec(lp, lq, p, q, level + 1, mid - w / 2);
    rec(p, q, rp, rq, level + 1, mid + w / 2);
  }
  rec(0, 1, 1, 0, 1, 0.5);
  return nodes;
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const pad = params.padding;
  const W = canvas.width - pad * 2;
  const H = canvas.height - pad * 2;
  const depth = Math.max(1, Math.min(10, params.depth | 0));
  const nodes = buildTree(depth);
  const levelY = (lv) => pad + ((lv - 1) / depth) * H;
  ctx.lineWidth = params.lineWidth;
  // 線で親子をつなぐ（線形探索ではなく xPos によるペアリング）
  const byLevel = new Map();
  for (const n of nodes) {
    const arr = byLevel.get(n.level) || [];
    arr.push(n);
    byLevel.set(n.level, arr);
  }
  for (let lv = 2; lv <= depth; lv++) {
    const parents = byLevel.get(lv - 1) || [];
    const children = byLevel.get(lv) || [];
    for (const child of children) {
      // 親: 最寄りの上位ノード
      let best = parents[0];
      let bd = Infinity;
      for (const p of parents) {
        const d = Math.abs(p.xPos - child.xPos);
        if (d < bd) {
          bd = d;
          best = p;
        }
      }
      if (!best) continue;
      const x1 = pad + child.xPos * W;
      const y1 = levelY(lv);
      const x2 = pad + best.xPos * W;
      const y2 = levelY(lv - 1);
      const hue = (params.hue + child.level * params.hueShift) % 360;
      const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha * 0.6})`;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  for (const n of nodes) {
    const x = pad + n.xPos * W;
    const y = levelY(n.level);
    const hue = (params.hue + n.level * params.hueShift) % 360;
    const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(x, y, params.nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    if (params.showLabel && depth <= 5) {
      ctx.fillStyle = '#ccc';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${n.p}/${n.q}`, x + 6, y - 4);
    }
  }
  ctx.shadowBlur = 0;
}

function tick() {
  if (dirty) {
    draw();
    dirty = false;
  }
  requestAnimationFrame(tick);
}
resize();
tick();

const gui = new TileUI({
  title: 'Stern–Brocot Mediant Tree',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
function onChange() {
  dirty = true;
}
gui.add(params, 'depth', 1, 10, 1).onChange(onChange);
gui.add(params, 'nodeRadius', 1, 15, 0.5).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 90, 0.5).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'padding', 20, 200, 1).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);
gui.add(params, 'showLabel').onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(5, 9, 1);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(10, 60, 1);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
