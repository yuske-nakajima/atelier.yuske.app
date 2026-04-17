// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// ギリパターン：イスラム建築の5種タイル（正十角形・星・蝶・菱形・三角）を
// 10回対称で敷き詰める幾何学模様。

const params = {
  tileSize: 60, // タイルの基本サイズ
  hueBase: 200, // 基本色相
  hueStar: 40, // 星形の色相
  hueBody: 260, // 本体の色相
  saturation: 65, // 彩度
  strokeWidth: 1.2, // 枠線幅
  strokeBright: 15, // 枠線明度
  animSpeed: 0.15, // アニメーション速度
  colorCycle: 0, // 色相サイクル
  brightness: 50, // 明度
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
 * 正多角形のパスを描く
 * @param {number} cx 中心X
 * @param {number} cy 中心Y
 * @param {number} r 外接円半径
 * @param {number} n 頂点数
 * @param {number} rotAngle 回転角（rad）
 */
function regularPolygon(cx, cy, r, n, rotAngle) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rotAngle + (i * Math.PI * 2) / n;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * 星形多角形のパスを描く
 * @param {number} cx 中心X
 * @param {number} cy 中心Y
 * @param {number} ro 外接円半径
 * @param {number} ri 内接円半径
 * @param {number} n 頂点数
 * @param {number} rotAngle 回転角
 */
function starPolygon(cx, cy, ro, ri, n, rotAngle) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? ro : ri;
    const a = rotAngle + (i * Math.PI) / n;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * ギリタイルを1セル描く
 * @param {number} cx 中心X
 * @param {number} cy 中心Y
 * @param {number} s サイズ
 * @param {number} phase 位相
 */
function drawGirihCell(cx, cy, s, phase) {
  const hBase = (params.hueBase + phase + time * 20) % 360;
  const hStar = (params.hueStar + phase + time * 20) % 360;
  const sat = params.saturation;
  const lig = params.brightness;

  // 外側の十角形
  regularPolygon(cx, cy, s * 0.92, 10, -Math.PI / 2);
  ctx.fillStyle = `hsl(${(hBase + params.hueBody) % 360}, ${sat}%, ${lig}%)`;
  ctx.fill();
  if (params.strokeWidth > 0) {
    ctx.strokeStyle = `hsl(0, 0%, ${params.strokeBright}%)`;
    ctx.lineWidth = params.strokeWidth;
    ctx.stroke();
  }

  // 内側の星形（10角星）
  starPolygon(cx, cy, s * 0.65, s * 0.28, 10, -Math.PI / 2);
  ctx.fillStyle = `hsl(${hStar}, ${sat + 10}%, ${lig + 15}%)`;
  ctx.fill();
  if (params.strokeWidth > 0) {
    ctx.strokeStyle = `hsl(0, 0%, ${params.strokeBright}%)`;
    ctx.lineWidth = params.strokeWidth;
    ctx.stroke();
  }

  // 中心の五角形
  regularPolygon(cx, cy, s * 0.18, 5, -Math.PI / 2);
  ctx.fillStyle = `hsl(${hBase}, ${sat}%, ${lig + 20}%)`;
  ctx.fill();
  if (params.strokeWidth > 0) {
    ctx.strokeStyle = `hsl(0, 0%, ${params.strokeBright}%)`;
    ctx.lineWidth = params.strokeWidth;
    ctx.stroke();
  }
}

function draw() {
  time += params.animSpeed * 0.01;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, w, h);

  const s = params.tileSize;
  // 六方格子でタイルを配置
  const dx = s * 2;
  const dy = s * Math.sqrt(3);
  const cols = Math.ceil(w / dx) + 3;
  const rows = Math.ceil(h / dy) + 3;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx = col * dx + (row % 2) * s;
      const cy = row * dy;
      const phase = params.colorCycle + (row + col) * 15;
      drawGirihCell(cx, cy, s, phase);
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
  title: 'Girih Pattern',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'tileSize', 20, 150, 2);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueStar', 0, 360, 1);
gui.add(params, 'hueBody', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'brightness', 10, 90, 1);
gui.add(params, 'strokeWidth', 0, 5, 0.1);
gui.add(params, 'animSpeed', 0, 3, 0.05);
gui.add(params, 'colorCycle', 0, 360, 1);

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
  params.tileSize = rand(30, 120, 2);
  params.hueBase = rand(0, 360, 1);
  params.hueStar = rand(0, 360, 1);
  params.hueBody = rand(0, 360, 1);
  params.saturation = rand(40, 85, 1);
  params.brightness = rand(25, 70, 1);
  params.animSpeed = rand(0, 2, 0.05);
  params.colorCycle = rand(0, 360, 1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
