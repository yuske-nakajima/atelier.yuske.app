// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// マンダラ生成器：回転対称要素を同心円状に配置し、
// 瞑想的なマンダラパターンをリアルタイム生成する。

const params = {
  symmetry: 8, // 回転対称次数
  rings: 5, // リング数
  petalCount: 6, // 花弁数/リング
  hueStart: 280, // 内側色相（紫）
  hueEnd: 60, // 外側色相（黄）
  saturation: 70, // 彩度
  brightness: 55, // 明度
  animSpeed: 0.3, // アニメーション速度
  ringSpacing: 0.85, // リング間隔比率
  petalSize: 0.12, // 花弁サイズ比率
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
 * 花弁形（楕円を回転）を描く
 * @param {number} cx 中心X
 * @param {number} cy 中心Y
 * @param {number} rx 横半径
 * @param {number} ry 縦半径
 * @param {number} angle 回転角
 * @param {string} color 色
 */
function drawPetal(cx, cy, rx, ry, angle, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/**
 * マンダラの1リングを描く
 * @param {number} cx 中心X
 * @param {number} cy 中心Y
 * @param {number} radius リング半径
 * @param {number} ringIdx リングインデックス
 * @param {number} totalRings 全リング数
 */
function drawRing(cx, cy, radius, ringIdx, totalRings) {
  const t = ringIdx / Math.max(1, totalRings - 1);
  const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
  const sat = params.saturation;
  const lig = params.brightness;
  const sym = Math.max(3, Math.round(params.symmetry));
  const pc = Math.max(1, Math.round(params.petalCount));
  const ps = params.petalSize;
  const rotPhase = time * (ringIdx % 2 === 0 ? 1 : -1) * 0.5;

  for (let k = 0; k < sym; k++) {
    const baseAngle = (k * Math.PI * 2) / sym + rotPhase;
    for (let p = 0; p < pc; p++) {
      const petalAngle = baseAngle + (p * Math.PI * 2) / (sym * pc);
      const px = cx + Math.cos(petalAngle) * radius;
      const py = cy + Math.sin(petalAngle) * radius;
      const rx = radius * ps;
      const ry = radius * ps * 0.45;
      const alpha = 0.6 + 0.4 * (1 - t);
      drawPetal(
        px,
        py,
        rx,
        ry,
        petalAngle,
        `hsla(${hue}, ${sat}%, ${lig}%, ${alpha})`,
      );
    }
  }

  // リングの輪郭円
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${lig + 15}%, 0.25)`;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function draw() {
  time += params.animSpeed * 0.01;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.fillStyle = 'rgba(11, 10, 7, 0.18)';
  ctx.fillRect(0, 0, w, h);

  const maxR = Math.min(w, h) * 0.46;
  const n = Math.max(1, Math.round(params.rings));

  for (let i = n; i >= 1; i--) {
    const r = maxR * params.ringSpacing ** (n - i);
    drawRing(cx, cy, r, i - 1, n);
  }

  // 中心点
  ctx.beginPath();
  ctx.arc(cx, cy, maxR * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = `hsl(${params.hueStart}, ${params.saturation}%, ${params.brightness + 20}%)`;
  ctx.fill();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Mandala Generator',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'symmetry', 3, 16, 1);
gui.add(params, 'rings', 1, 10, 1);
gui.add(params, 'petalCount', 1, 8, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'brightness', 10, 90, 1);
gui.add(params, 'animSpeed', 0, 3, 0.05);
gui.add(params, 'ringSpacing', 0.5, 0.99, 0.01);
gui.add(params, 'petalSize', 0.04, 0.3, 0.01);

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
  params.symmetry = rand(4, 14, 1);
  params.rings = rand(3, 8, 1);
  params.petalCount = rand(2, 6, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.saturation = rand(50, 90, 1);
  params.brightness = rand(35, 70, 1);
  params.animSpeed = rand(0.1, 2, 0.05);
  params.ringSpacing = rand(0.7, 0.96, 0.01);
  params.petalSize = rand(0.06, 0.22, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
