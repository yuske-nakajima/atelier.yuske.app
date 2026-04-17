// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Moore 空間充填曲線 (L-system)
const params = {
  depth: 5,
  lineWidth: 1.2,
  hue: 160,
  hueShift: 40,
  saturation: 70,
  lightness: 60,
  alpha: 0.9,
  scale: 0.85,
  rotation: 0,
  padding: 30,
  glow: 5,
  // アニメーション
  animate: true,
  speed: 0.008, // 1 フレームあたりに進む割合 (0..1)
  headSize: 6,
  autoRotate: 0.2, // 度/フレーム
  trailFade: 0.12, // 残像フェード量 (0..1)
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
let dirty = true;
let progress = 0; // 0..1 アニメ進捗
let autoRot = 0; // 自動回転の累積角
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  dirty = true;
}
addEventListener('resize', resize);

function expand(axiom, rules, depth) {
  let s = axiom;
  for (let i = 0; i < depth; i++) {
    let next = '';
    for (const c of s) next += rules[c] || c;
    s = next;
  }
  return s;
}

// 曲線の座標を計算してキャッシュ
let cached = {
  depth: -1,
  scale: -1,
  padding: -1,
  pts: /** @type {number[][]} */ ([]),
  cx: 0,
  cy: 0,
};
function computePoints() {
  const depth = Math.max(1, Math.min(6, params.depth | 0));
  if (
    cached.depth === depth &&
    cached.scale === params.scale &&
    cached.padding === params.padding &&
    cached.pts.length > 0 &&
    cached._w === canvas.width &&
    cached._h === canvas.height
  ) {
    return cached;
  }
  const axiom = 'LFL+F+LFL';
  const rules = { L: '-RF+LFL+FR-', R: '+LF-RFR-FL+' };
  const seq = expand(axiom, rules, depth);
  const size = Math.min(canvas.width, canvas.height) - params.padding * 2;
  const step = (size / Math.max(1, 2 ** (depth + 1) - 1)) * 0.9 * params.scale;
  let x = 0;
  let y = 0;
  let angle = 0;
  const pts = [[0, 0]];
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  for (const c of seq) {
    if (c === 'F') {
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      pts.push([x, y]);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    } else if (c === '+') angle += Math.PI / 2;
    else if (c === '-') angle -= Math.PI / 2;
  }
  cached = {
    depth,
    scale: params.scale,
    padding: params.padding,
    pts,
    cx: canvas.width / 2 - (minX + maxX) / 2,
    cy: canvas.height / 2 - (minY + maxY) / 2,
    _w: canvas.width,
    _h: canvas.height,
  };
  return cached;
}

function draw() {
  const { pts, cx, cy } = computePoints();
  // 背景（アニメ時は薄くフェードさせて残像を出す）
  if (params.animate && params.trailFade < 1) {
    ctx.fillStyle = `rgba(8, 8, 12, ${params.trailFade})`;
  } else {
    ctx.fillStyle = '#08080c';
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.shadowBlur = params.glow;
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const rot = ((params.rotation + autoRot) * Math.PI) / 180;
  const cRot = Math.cos(rot);
  const sRot = Math.sin(rot);

  // 描画する点数（アニメ進捗に応じて増やす）
  const total = pts.length;
  const drawCount = params.animate
    ? Math.max(2, Math.floor(total * progress))
    : total;

  // 色相を index で変化させつつセグメント描画
  // パフォーマンスのためチャンク単位で色を切替
  const hueShift = params.hueShift;
  const chunk = Math.max(1, Math.floor(total / 180));
  let prevX = 0;
  let prevY = 0;
  for (let i = 0; i < drawCount; i++) {
    const [px, py] = pts[i];
    const rx = px * cRot - py * sRot + cx;
    const ry = px * sRot + py * cRot + cy;
    if (i === 0) {
      prevX = rx;
      prevY = ry;
      continue;
    }
    if (i % chunk === 1 || i === drawCount - 1) {
      const t = i / total;
      const hue = (params.hue + t * hueShift * 10) % 360;
      const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
    }
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(rx, ry);
    ctx.stroke();
    prevX = rx;
    prevY = ry;
  }

  // 先頭（ヘッド）を強調
  if (params.animate && drawCount >= 2 && params.headSize > 0) {
    const [hpx, hpy] = pts[drawCount - 1];
    const hx = hpx * cRot - hpy * sRot + cx;
    const hy = hpx * sRot + hpy * cRot + cy;
    ctx.fillStyle = `hsla(${(params.hue + 180) % 360}, 100%, 80%, 1)`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.arc(hx, hy, params.headSize, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function tick() {
  if (params.animate) {
    progress += params.speed;
    if (progress >= 1) {
      progress = 0;
      // 次ループ用に完全クリア
      ctx.fillStyle = '#08080c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (params.autoRotate !== 0) {
      autoRot = (autoRot + params.autoRotate) % 360;
    }
    draw();
  } else if (dirty) {
    progress = 1;
    draw();
    dirty = false;
  }
  requestAnimationFrame(tick);
}
resize();
tick();

const gui = new TileUI({
  title: 'Moore Curve',
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
  progress = 0;
}
gui.add(params, 'animate').onChange(onChange);
gui.add(params, 'speed', 0.001, 0.05, 0.001).onChange(() => {});
gui.add(params, 'trailFade', 0, 1, 0.01).onChange(() => {});
gui.add(params, 'headSize', 0, 20, 0.5).onChange(() => {});
gui.add(params, 'autoRotate', -2, 2, 0.05).onChange(() => {});
gui.add(params, 'depth', 1, 6, 1).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 200, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'scale', 0.3, 1.2, 0.01).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'padding', 0, 120, 1).onChange(onChange);
gui.add(params, 'glow', 0, 30, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(3, 5, 1);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(20, 120, 1);
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotation = rand(0, 360, 1);
  params.speed = rand(0.003, 0.02, 0.001);
  params.autoRotate = rand(-1, 1, 0.05);
  dirty = true;
  progress = 0;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  progress = 0;
  gui.updateDisplay();
});
