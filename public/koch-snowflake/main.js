// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  iterations: 5, // 反復回数
  sides: 3, // 初期多角形の辺数（3 で正三角形）
  bumpAngle: 60, // 凸部の角度（度, 60 で標準コッホ）
  scale: 0.75, // 全体スケール
  rotate: 0, // 全体回転（度）
  spin: 0.05, // 自動回転速度
  lineWidth: 1.4, // 線の太さ
  hue: 210, // 色相
  hueRange: 120, // 色相レンジ
  saturation: 70, // 彩度
  lightness: 70, // 明度
  glow: 6, // グロー
  fillAlpha: 0.0, // 塗りつぶしの不透明度
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
 * 1 辺をコッホ分割する
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} depth
 * @param {number[][]} out
 */
function koch(x1, y1, x2, y2, depth, out) {
  if (depth === 0) {
    out.push([x1, y1]);
    return;
  }
  const dx = (x2 - x1) / 3;
  const dy = (y2 - y1) / 3;
  const ax = x1 + dx;
  const ay = y1 + dy;
  const bx = x1 + 2 * dx;
  const by = y1 + 2 * dy;
  const ang = (params.bumpAngle * Math.PI) / 180;
  const cx = ax + Math.cos(ang) * dx - Math.sin(ang) * dy;
  const cy = ay + Math.sin(ang) * dx + Math.cos(ang) * dy;
  koch(x1, y1, ax, ay, depth - 1, out);
  koch(ax, ay, cx, cy, depth - 1, out);
  koch(cx, cy, bx, by, depth - 1, out);
  koch(bx, by, x2, y2, depth - 1, out);
}

let time = 0;

function draw() {
  time += 1 / 60;
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, w, h);

  const iter = Math.max(0, Math.min(6, Math.floor(params.iterations)));
  const sides = Math.max(3, Math.min(10, Math.floor(params.sides)));
  const radius = Math.min(w, h) * 0.4 * params.scale;
  const cx = w / 2;
  const cy = h / 2;

  // 初期頂点
  /** @type {[number, number][]} */
  const base = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    base.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }

  /** @type {number[][]} */
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const [x1, y1] = base[i];
    const [x2, y2] = base[(i + 1) % sides];
    koch(x1, y1, x2, y2, iter, pts);
  }
  pts.push(base[0]);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((params.rotate * Math.PI) / 180 + time * params.spin);
  ctx.translate(-cx, -cy);
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = params.glow;

  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (params.fillAlpha > 0) {
    ctx.fillStyle = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness}%, ${params.fillAlpha})`;
    ctx.fill();
  }
  const stroke = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.strokeStyle = stroke;
  ctx.shadowColor = stroke;
  ctx.stroke();

  // 二次リング（色相レンジ）
  if (params.hueRange > 0) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const hue2 = (params.hue + params.hueRange) % 360;
    const s2 = `hsl(${hue2}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.strokeStyle = s2;
    ctx.shadowColor = s2;
    ctx.lineWidth = params.lineWidth * 0.5;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Koch Snowflake',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'iterations', 0, 6, 1);
gui.add(params, 'sides', 3, 10, 1);
gui.add(params, 'bumpAngle', 0, 120, 1);
gui.add(params, 'scale', 0.3, 1.2, 0.01);
gui.add(params, 'rotate', -180, 180, 1);
gui.add(params, 'spin', -1, 1, 0.01);
gui.add(params, 'lineWidth', 0.3, 5, 0.05);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 10, 90, 1);
gui.add(params, 'glow', 0, 20, 0.5);
gui.add(params, 'fillAlpha', 0, 0.6, 0.01);

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
  params.iterations = rand(3, 5, 1);
  params.sides = rand(3, 7, 1);
  params.bumpAngle = rand(30, 80, 1);
  params.scale = rand(0.5, 1.0, 0.01);
  params.spin = rand(-0.3, 0.3, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueRange = rand(30, 200, 1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
