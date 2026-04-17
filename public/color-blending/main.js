// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 3 つの色円盤を animated に移動させ、Canvas の globalCompositeOperation で
// ブレンドモードを切り替えた色混合ビジュアル。

const MODES = [
  'screen',
  'multiply',
  'lighter',
  'overlay',
  'difference',
  'exclusion',
  'color-dodge',
  'color-burn',
];

const params = {
  radius: 260, // 円盤の半径
  orbit: 160, // 周回半径
  speed: 0.4, // 周回速度
  blurPx: 40, // ぼかし
  opacity: 0.9, // 不透明度
  modeIdx: 0, // ブレンドモードインデックス
  hue1: 0, // 色相 1（赤）
  hue2: 120, // 色相 2（緑）
  hue3: 240, // 色相 3（青）
  saturation: 85,
  lightness: 55,
  phaseSpread: 2.09, // 三角配置の位相差
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

const start = performance.now();

function frame() {
  const W = canvas.width;
  const H = canvas.height;
  const t = ((performance.now() - start) / 1000) * params.speed;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2;
  const mode = MODES[Math.floor(params.modeIdx) % MODES.length];
  ctx.filter = `blur(${params.blurPx}px)`;
  ctx.globalCompositeOperation = /** @type {GlobalCompositeOperation} */ (mode);
  ctx.globalAlpha = params.opacity;

  const hues = [params.hue1, params.hue2, params.hue3];
  for (let i = 0; i < 3; i++) {
    const a = t + i * params.phaseSpread;
    const x = cx + Math.cos(a) * params.orbit;
    const y = cy + Math.sin(a) * params.orbit;
    ctx.fillStyle = `hsl(${hues[i]}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.beginPath();
    ctx.arc(x, y, params.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- GUI ---

const gui = new TileUI({
  title: 'Color Blending',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'radius', 40, 600, 1);
gui.add(params, 'orbit', 0, 400, 1);
gui.add(params, 'speed', 0, 3, 0.01);
gui.add(params, 'blurPx', 0, 120, 1);
gui.add(params, 'opacity', 0.1, 1, 0.01);
gui.add(params, 'modeIdx', 0, MODES.length - 1, 1);
gui.add(params, 'hue1', 0, 360, 1);
gui.add(params, 'hue2', 0, 360, 1);
gui.add(params, 'hue3', 0, 360, 1);
gui.add(params, 'saturation', 20, 100, 1);
gui.add(params, 'lightness', 20, 80, 1);
gui.add(params, 'phaseSpread', 0, 6.28, 0.01);

gui.addButton('Random', () => {
  params.modeIdx = Math.floor(Math.random() * MODES.length);
  params.hue1 = Math.floor(Math.random() * 360);
  params.hue2 = Math.floor(Math.random() * 360);
  params.hue3 = Math.floor(Math.random() * 360);
  params.radius = 100 + Math.random() * 400;
  params.orbit = Math.random() * 300;
  params.blurPx = Math.random() * 80;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
