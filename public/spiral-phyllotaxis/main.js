// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  count: 1200, // 種の数
  angle: 137.508, // 分散角（度）
  spacing: 6.0, // 距離係数
  dotSize: 3.2, // 点サイズ
  sizeGrow: 0.002, // 点サイズ成長係数
  rotateSpeed: 0.08, // 全体回転速度
  grow: 0.25, // 表示成長速度
  hue: 40, // 色相
  hueShift: 0.35, // 色相シフト（index 比例）
  saturation: 75, // 彩度
  lightness: 60, // 明度
  bg: 8, // 背景明度
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
let visible = 0;

function step() {
  time += 1 / 60;
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  visible = Math.min(params.count, visible + params.grow * params.count * 0.01);
  const rot = time * params.rotateSpeed;
  const a = (params.angle * Math.PI) / 180;
  const limit = Math.floor(visible);
  for (let i = 0; i < limit; i++) {
    const r = params.spacing * Math.sqrt(i);
    const theta = i * a + rot;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    const hue = (params.hue + i * params.hueShift) % 360;
    const size = params.dotSize + i * params.sizeGrow;
    ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  step();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Spiral Phyllotaxis',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 50, 4000, 10);
gui.add(params, 'angle', 130, 145, 0.01);
gui.add(params, 'spacing', 1, 20, 0.1);
gui.add(params, 'dotSize', 0.5, 10, 0.1);
gui.add(params, 'sizeGrow', 0, 0.01, 0.0005);
gui.add(params, 'rotateSpeed', -1, 1, 0.01);
gui.add(params, 'grow', 0, 2, 0.01);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueShift', 0, 3, 0.01);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 10, 90, 1);
gui.add(params, 'bg', 0, 100, 1);

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
  params.count = rand(400, 2400, 10);
  params.angle = rand(135.5, 139, 0.01);
  params.spacing = rand(3, 12, 0.1);
  params.dotSize = rand(1.5, 5, 0.1);
  params.rotateSpeed = rand(-0.3, 0.3, 0.01);
  params.hue = rand(0, 360, 1);
  params.hueShift = rand(0.1, 1.2, 0.01);
  visible = 0;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  visible = 0;
  gui.updateDisplay();
});
