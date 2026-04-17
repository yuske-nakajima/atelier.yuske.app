// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  depth: 4,
  size: 520,
  zSlice: 0.5, // 断面の位置（0-1）
  zAnimate: true,
  sliceSpeed: 0.08,
  hueStart: 20,
  hueEnd: 280,
  alpha: 0.95,
  rotation: 0,
  rotSpeed: 0.04,
  strokeAlpha: 0.5,
  showGrid: true,
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

/**
 * 指定位置 (u,v,w) が Menger スポンジ内部かどうか
 * @param {number} u 0-1
 * @param {number} v 0-1
 * @param {number} w 0-1
 * @param {number} depth
 */
function isSolid(u, v, w, depth) {
  for (let i = 0; i < depth; i++) {
    const x = Math.floor(u * 3) % 3;
    const y = Math.floor(v * 3) % 3;
    const z = Math.floor(w * 3) % 3;
    // 中央面 2 個以上で 1 になると穴
    let mids = 0;
    if (x === 1) mids++;
    if (y === 1) mids++;
    if (z === 1) mids++;
    if (mids >= 2) return false;
    u = (u * 3) % 1;
    v = (v * 3) % 1;
    w = (w * 3) % 1;
  }
  return true;
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = 'rgba(11, 10, 7, 0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const depth = Math.round(params.depth);
  const n = 3 ** depth;
  const cell = params.size / n;
  const wSlice = params.zAnimate
    ? (Math.sin(time * params.sliceSpeed) + 1) * 0.5
    : params.zSlice;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(params.rotation + time * params.rotSpeed);
  ctx.translate(-params.size / 2, -params.size / 2);

  for (let iy = 0; iy < n; iy++) {
    for (let ix = 0; ix < n; ix++) {
      const u = (ix + 0.5) / n;
      const v = (iy + 0.5) / n;
      if (isSolid(u, v, wSlice, depth)) {
        const dist = Math.hypot(u - 0.5, v - 0.5, wSlice - 0.5);
        const hue =
          params.hueStart + (params.hueEnd - params.hueStart) * (1 - dist * 2);
        ctx.fillStyle = `hsla(${hue}, 75%, 55%, ${params.alpha})`;
        ctx.fillRect(ix * cell, iy * cell, cell + 0.5, cell + 0.5);
        if (params.showGrid && cell > 3) {
          ctx.strokeStyle = `hsla(${hue}, 85%, 75%, ${params.strokeAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(ix * cell, iy * cell, cell, cell);
        }
      }
    }
  }
  ctx.restore();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Menger Slice',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 1, 5, 1);
gui.add(params, 'size', 200, 700, 1);
gui.add(params, 'zSlice', 0, 1, 0.001);
gui.add(params, 'zAnimate');
gui.add(params, 'sliceSpeed', 0, 0.5, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'alpha', 0.2, 1, 0.01);
gui.add(params, 'strokeAlpha', 0, 1, 0.01);
gui.add(params, 'rotation', -3.14, 3.14, 0.01);
gui.add(params, 'rotSpeed', -0.5, 0.5, 0.01);
gui.add(params, 'showGrid');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.depth = rand(3, 5, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.sliceSpeed = rand(0.03, 0.2, 0.01);
  params.rotSpeed = rand(-0.15, 0.15, 0.01);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
