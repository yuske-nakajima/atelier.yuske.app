// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// エッシャー風テセレーション：対称変換（回転・反転・並進）で
// 鳥や魚の形に変形したタイルが隙間なく敷き詰まるパターン。

const params = {
  tileSize: 80, // タイルの基本サイズ
  warpAmount: 0.35, // タイル辺の変形量
  hue1: 30, // タイルA色相
  hue2: 200, // タイルB色相
  saturation: 60, // 彩度
  lightness: 50, // 明度
  strokeColor: 10, // 枠線の明度
  strokeWidth: 1.0, // 枠線幅
  animSpeed: 0.2, // アニメーション速度
  morphPhase: 0, // 変形位相
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
 * エッシャー風変形タイルを描く（正方形を波型に変形）
 * @param {number} cx タイル中心X
 * @param {number} cy タイル中心Y
 * @param {number} s タイルサイズ
 * @param {boolean} flip 反転フラグ（タイルAかBか）
 * @param {number} phase 変形位相
 */
function drawEscherTile(cx, cy, s, flip, phase) {
  const w = params.warpAmount * s;
  const h2 = s / 2;
  const sign = flip ? -1 : 1;

  // 4辺をそれぞれ波状に変形した多角形を定義
  const pts = /** @type {[number,number][]} */ ([]);
  const steps = 8;

  // 上辺（左→右）
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - h2 + s * t;
    const y = cy - h2 + Math.sin(t * Math.PI * 2 + phase) * w * sign;
    pts.push([x, y]);
  }
  // 右辺（上→下）
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = cx + h2 + Math.sin(t * Math.PI * 2 + phase + Math.PI) * w * sign;
    const y = cy - h2 + s * t;
    pts.push([x, y]);
  }
  // 下辺（右→左）
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = cx + h2 - s * t;
    const y = cy + h2 - Math.sin(t * Math.PI * 2 + phase) * w * sign;
    pts.push([x, y]);
  }
  // 左辺（下→上）
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = cx - h2 - Math.sin(t * Math.PI * 2 + phase + Math.PI) * w * sign;
    const y = cy + h2 - s * t;
    pts.push([x, y]);
  }

  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
}

function draw() {
  time += params.animSpeed * 0.01;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, w, h);

  const s = params.tileSize;
  const phase = params.morphPhase + time;
  const cols = Math.ceil(w / s) + 3;
  const rows = Math.ceil(h / s) + 3;
  const sat = params.saturation;
  const lig = params.lightness;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx = col * s + s / 2;
      const cy = row * s + s / 2;
      const isFlip = (row + col) % 2 === 0;
      const hue = isFlip ? params.hue1 : params.hue2;

      drawEscherTile(cx, cy, s, isFlip, phase);
      ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lig}%)`;
      ctx.fill();
      if (params.strokeWidth > 0) {
        ctx.strokeStyle = `hsl(0, 0%, ${params.strokeColor}%)`;
        ctx.lineWidth = params.strokeWidth;
        ctx.stroke();
      }
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Escher Tessellation',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'tileSize', 20, 200, 4);
gui.add(params, 'warpAmount', 0, 0.8, 0.01);
gui.add(params, 'hue1', 0, 360, 1);
gui.add(params, 'hue2', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 10, 90, 1);
gui.add(params, 'strokeWidth', 0, 5, 0.1);
gui.add(params, 'animSpeed', 0, 2, 0.05);
gui.add(params, 'morphPhase', 0, Math.PI * 2, 0.05);

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
  params.tileSize = rand(40, 140, 4);
  params.warpAmount = rand(0.1, 0.6, 0.01);
  params.hue1 = rand(0, 360, 1);
  params.hue2 = rand(0, 360, 1);
  params.saturation = rand(30, 85, 1);
  params.lightness = rand(25, 70, 1);
  params.animSpeed = rand(0.05, 1.5, 0.05);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
