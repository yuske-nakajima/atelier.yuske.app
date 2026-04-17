// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Heighway Dragon とその角度・回転変種
const params = {
  depth: 12,
  angle: 90,
  variant: 1, // 1: X+YF, 2: X-YF, 3: XY mirror
  lineWidth: 1.2,
  hue: 30,
  hueShift: 0.8,
  saturation: 70,
  lightness: 60,
  alpha: 0.9,
  scale: 0.7,
  rotation: 0,
  padding: 40,
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
  const depth = Math.max(1, Math.min(16, params.depth | 0));
  let axiom;
  let rules;
  if (params.variant === 2) {
    axiom = 'FX';
    rules = { X: 'X-YF-', Y: '+FX+Y' };
  } else if (params.variant === 3) {
    axiom = 'FX+FX+FX';
    rules = { X: 'X+YF+', Y: '-FX-Y' };
  } else {
    axiom = 'FX';
    rules = { X: 'X+YF+', Y: '-FX-Y' };
  }
  const seq = expand(axiom, rules, depth);
  const ang = (params.angle * Math.PI) / 180;
  const pts = [[0, 0]];
  let x = 0;
  let y = 0;
  let a = 0;
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  for (const c of seq) {
    if (c === 'F') {
      x += Math.cos(a);
      y += Math.sin(a);
      pts.push([x, y]);
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    } else if (c === '+') a += ang;
    else if (c === '-') a -= ang;
  }
  const pad = params.padding;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const scale =
    Math.min(w / (maxX - minX || 1), h / (maxY - minY || 1)) * params.scale;
  const cx = canvas.width / 2 - ((minX + maxX) / 2) * scale;
  const cy = canvas.height / 2 - ((minY + maxY) / 2) * scale;
  const rot = (params.rotation * Math.PI) / 180;
  const cR = Math.cos(rot);
  const sR = Math.sin(rot);
  ctx.lineWidth = params.lineWidth;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const px = pts[i][0] * scale;
    const py = pts[i][1] * scale;
    const rx = px * cR - py * sR + cx;
    const ry = px * sR + py * cR + cy;
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
  title: 'Heighway Dragon Variants',
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
gui.add(params, 'depth', 1, 15, 1).onChange(onChange);
gui.add(params, 'angle', 30, 120, 0.5).onChange(onChange);
gui.add(params, 'variant', 1, 3, 1).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'scale', 0.2, 1.2, 0.01).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'padding', 0, 200, 1).onChange(onChange);
gui.add(params, 'glow', 0, 30, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(10, 14, 1);
  params.angle = rand(60, 110, 0.5);
  params.variant = rand(1, 3, 1);
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
