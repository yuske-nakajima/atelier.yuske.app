// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Apollonian Gasket を擬似 3D（遠近投影）で描画
const params = {
  depth: 6,
  tilt: 45,
  perspective: 0.3,
  lineWidth: 0.8,
  hue: 250,
  hueShift: 30,
  saturation: 65,
  lightness: 60,
  alpha: 0.85,
  rotation: 0,
  scale: 0.9,
  glow: 4,
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

function recurse(x, y, r, depth, seed, out) {
  out.push([x, y, r, seed]);
  if (depth === 0 || r < 2) return;
  // 3 つの内接する円（簡易 Apollonian 近似）
  const ratio = 1 / 2.5;
  const nr = r * ratio;
  const d = r - nr;
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + seed * 0.3;
    const nx = x + Math.cos(a) * d;
    const ny = y + Math.sin(a) * d;
    recurse(nx, ny, nr, depth - 1, seed * 3 + k, out);
  }
}

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R = Math.min(canvas.width, canvas.height) * 0.4 * params.scale;
  const out = [];
  recurse(0, 0, R, Math.max(1, Math.min(8, params.depth | 0)), 1, out);
  const tilt = (params.tilt * Math.PI) / 180;
  const rot = (params.rotation * Math.PI) / 180;
  const per = params.perspective;
  ctx.lineWidth = params.lineWidth;
  // 遠い順にソート（z で並べる）
  out.sort((a, b) => b[1] * Math.sin(tilt) - a[1] * Math.sin(tilt));
  for (const [x, y, r, seed] of out) {
    const rx = x * Math.cos(rot) - y * Math.sin(rot);
    const ry = x * Math.sin(rot) + y * Math.cos(rot);
    const z = ry * Math.sin(tilt);
    const py = ry * Math.cos(tilt);
    const sc = 1 + z * per * 0.005;
    const px = cx + rx * sc;
    const ppy = cy + py * sc;
    const hue = (params.hue + ((seed * params.hueShift) % 360)) % 360;
    const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.ellipse(px, ppy, r * sc, r * sc * Math.cos(tilt), rot, 0, Math.PI * 2);
    ctx.stroke();
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
  title: 'Apollonian Network 3D',
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
gui.add(params, 'depth', 1, 7, 1).onChange(onChange);
gui.add(params, 'tilt', 0, 85, 1).onChange(onChange);
gui.add(params, 'perspective', 0, 1, 0.01).onChange(onChange);
gui.add(params, 'lineWidth', 0.1, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 200, 1).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'scale', 0.3, 1.2, 0.01).onChange(onChange);
gui.add(params, 'glow', 0, 20, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(4, 7, 1);
  params.tilt = rand(20, 75, 1);
  params.perspective = rand(0.1, 0.7, 0.01);
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
