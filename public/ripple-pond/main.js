// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  dropRate: 0.6, // 1 秒あたりの雨滴数
  maxRipples: 80, // 同時に存在する最大波紋数
  speed: 120, // 波の伝播速度
  decay: 0.6, // 減衰率
  ringWidth: 2.0, // 波の太さ
  rings: 4, // 1 波紋あたりのリング数
  hueBase: 200, // 色相の基準
  hueRange: 120, // 色相のレンジ
  saturation: 70, // 彩度
  trailFade: 0.06, // 残像のフェード
  glow: 6, // グロー
  surfaceTint: 0.0, // 水面の色味
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clearCanvas();
}
function clearCanvas() {
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

/** @type {{x:number, y:number, t:number, hue:number}[]} */
const ripples = [];

canvas.addEventListener('pointerdown', (e) => {
  addRipple(e.clientX, e.clientY);
});

/**
 * @param {number} x
 * @param {number} y
 */
function addRipple(x, y) {
  if (ripples.length >= params.maxRipples) ripples.shift();
  ripples.push({
    x,
    y,
    t: 0,
    hue: (params.hueBase + (Math.random() - 0.5) * params.hueRange) % 360,
  });
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // 雨滴生成
  if (Math.random() < params.dropRate * dt * 10) {
    addRipple(Math.random() * canvas.width, Math.random() * canvas.height);
  }
  // フェード
  ctx.fillStyle = `rgba(8, 8, 12, ${Math.max(0, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = params.ringWidth;
  ctx.shadowBlur = params.glow;
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.t += dt;
    const age = rp.t;
    const alpha = Math.exp(-age * params.decay);
    if (alpha < 0.01) {
      ripples.splice(i, 1);
      continue;
    }
    for (let k = 0; k < params.rings; k++) {
      const r = params.speed * (age - k * 0.18);
      if (r < 0) continue;
      const stroke = `hsla(${rp.hue}, ${params.saturation}%, 65%, ${alpha * (1 - k / params.rings)})`;
      ctx.strokeStyle = stroke;
      ctx.shadowColor = stroke;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;

  // 水面の色味
  if (params.surfaceTint > 0) {
    ctx.fillStyle = `hsla(${params.hueBase}, 60%, 30%, ${params.surfaceTint * 0.05})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- GUI ---

const gui = new TileUI({
  title: 'Ripple Pond',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'dropRate', 0, 4, 0.05);
gui.add(params, 'maxRipples', 10, 300, 1);
gui.add(params, 'speed', 20, 400, 1);
gui.add(params, 'decay', 0.05, 2, 0.01);
gui.add(params, 'ringWidth', 0.5, 6, 0.1);
gui.add(params, 'rings', 1, 8, 1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'trailFade', 0, 0.3, 0.005);
gui.add(params, 'glow', 0, 20, 0.5);
gui.add(params, 'surfaceTint', 0, 1, 0.05);

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
  params.dropRate = rand(0.3, 2.0, 0.05);
  params.speed = rand(60, 240, 1);
  params.decay = rand(0.3, 1.2, 0.01);
  params.ringWidth = rand(1.0, 4.0, 0.1);
  params.rings = rand(2, 6, 1);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(40, 260, 1);
  params.saturation = rand(50, 95, 1);
  params.trailFade = rand(0.03, 0.15, 0.005);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  ripples.length = 0;
  clearCanvas();
  gui.updateDisplay();
});
