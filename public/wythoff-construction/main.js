// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Wythoff 構成風：2 本の鏡で生成される波紋パターンを重ねる
const params = {
  p: 3, // 鏡面1の次数
  q: 5, // 鏡面2の次数
  rings: 14,
  spacing: 32,
  lineWidth: 1,
  hue: 170,
  hueShift: 0.4,
  saturation: 65,
  lightness: 55,
  alpha: 0.7,
  rotation: 0,
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

function draw() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rot = (params.rotation * Math.PI) / 180;
  const p = Math.max(2, params.p | 0);
  const q = Math.max(2, params.q | 0);
  const rings = Math.max(1, params.rings | 0);
  ctx.lineWidth = params.lineWidth;
  for (let r = 1; r <= rings; r++) {
    const radius = r * params.spacing;
    // Wythoff の p,q 対称から来る頂点を円上に配置
    const vertices = p * q;
    ctx.beginPath();
    for (let k = 0; k < vertices; k++) {
      const t = (k / vertices) * Math.PI * 2 + rot;
      const rr =
        radius * (1 + 0.25 * Math.sin(t * p) * Math.cos(t * q + r * 0.3));
      const x = cx + Math.cos(t) * rr;
      const y = cy + Math.sin(t) * rr;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const hue = (params.hue + r * params.hueShift * 20) % 360;
    const color = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
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
  title: 'Wythoff Construction',
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
gui.add(params, 'p', 2, 12, 1).onChange(onChange);
gui.add(params, 'q', 2, 12, 1).onChange(onChange);
gui.add(params, 'rings', 1, 40, 1).onChange(onChange);
gui.add(params, 'spacing', 6, 80, 1).onChange(onChange);
gui.add(params, 'lineWidth', 0.2, 4, 0.05).onChange(onChange);
gui.add(params, 'hue', 0, 360, 1).onChange(onChange);
gui.add(params, 'hueShift', 0, 2, 0.01).onChange(onChange);
gui.add(params, 'saturation', 0, 100, 1).onChange(onChange);
gui.add(params, 'lightness', 20, 80, 1).onChange(onChange);
gui.add(params, 'alpha', 0.1, 1, 0.01).onChange(onChange);
gui.add(params, 'rotation', 0, 360, 1).onChange(onChange);
gui.add(params, 'glow', 0, 30, 0.5).onChange(onChange);

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}
gui.addButton('Random', () => {
  params.p = rand(2, 8, 1);
  params.q = rand(2, 8, 1);
  params.rings = rand(6, 24, 1);
  params.spacing = rand(14, 60, 1);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0, 1, 0.01);
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
