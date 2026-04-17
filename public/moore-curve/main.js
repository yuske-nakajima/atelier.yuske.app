// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Moore 空間充填曲線 (L-system)
const params = {
  depth: 5,
  lineWidth: 1.2,
  hue: 160,
  hueShift: 1,
  saturation: 70,
  lightness: 60,
  alpha: 0.9,
  scale: 0.85,
  rotation: 0,
  padding: 30,
  glow: 5,
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

function expand(axiom, rules, depth) {
  let s = axiom;
  for (let i = 0; i < depth; i++) {
    let next = '';
    for (const c of s) next += rules[c] || c;
    s = next;
  }
  return s;
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const depth = Math.max(1, Math.min(6, params.depth | 0));
  const axiom = 'LFL+F+LFL';
  const rules = {
    L: '-RF+LFL+FR-',
    R: '+LF-RFR-FL+',
  };
  const seq = expand(axiom, rules, depth);
  // 描画
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
  const cx = canvas.width / 2 - (minX + maxX) / 2;
  const cy = canvas.height / 2 - (minY + maxY) / 2;
  const rot = (params.rotation * Math.PI) / 180;
  const cRot = Math.cos(rot);
  const sRot = Math.sin(rot);
  ctx.lineWidth = params.lineWidth;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const [px, py] = pts[i];
    const rx = px * cRot - py * sRot + cx;
    const ry = px * sRot + py * cRot + cy;
    if (i === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  }
  const color = `hsla(${params.hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.stroke();
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
}
gui.add(params, 'depth', 1, 6, 1).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 2, 0.01).onChange(onChange);
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
  params.saturation = rand(40, 80, 1);
  params.lightness = rand(40, 70, 1);
  params.rotation = rand(0, 360, 1);
  dirty = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, defaults);
  dirty = true;
  gui.updateDisplay();
});
