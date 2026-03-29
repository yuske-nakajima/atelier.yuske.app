// @ts-check
import SimpleGuiSheet from './simple-gui-sheet.js';

// --- パラメータ ---

const params = {
  color: '#007AFF',
  size: 80,
  speed: 30,
  visible: true,
  opacity: 0.8,
  sides: 6,
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** Canvas をウィンドウサイズに合わせる */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- 描画ロジック ---

let angle = 0;

/**
 * hex カラー文字列を rgba 文字列に変換する
 * @param {string} hex
 * @param {number} alpha
 * @returns {string}
 */
function hexToRgba(hex, alpha) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 正多角形を描画する
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} radius - 半径
 * @param {number} sides - 辺の数
 * @param {number} rotation - 回転角度（ラジアン）
 */
function drawPolygon(cx, cy, radius, sides, rotation) {
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2 + rotation;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

/** メインの描画フレーム */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!params.visible) {
    requestAnimationFrame(draw);
    return;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // 軌道上を回転する位置
  const orbitRadius = params.size * 1.5;
  const ox = cx + orbitRadius * Math.cos(angle);
  const oy = cy + orbitRadius * Math.sin(angle);

  // メイン図形（回転する正多角形）
  ctx.fillStyle = hexToRgba(params.color, params.opacity);
  drawPolygon(ox, oy, params.size, params.sides, angle * 2);
  ctx.fill();

  // 中心の小さな円
  ctx.fillStyle = hexToRgba(params.color, params.opacity * 0.4);
  ctx.beginPath();
  ctx.arc(cx, cy, params.size * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 軌道の線
  ctx.strokeStyle = hexToRgba(params.color, 0.15);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, orbitRadius, 0, Math.PI * 2);
  ctx.stroke();

  angle += params.speed * 0.001;
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI セットアップ ---

const gui = new SimpleGuiSheet({ title: 'Settings' });

gui.addColor(params, 'color');
gui.add(params, 'size', 20, 200, 1);
gui.add(params, 'speed', 0, 100, 1);
gui.add(params, 'visible');

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
});

const folder = gui.addFolder('Advanced');
folder.add(params, 'opacity', 0, 1, 0.01);
folder.add(params, 'sides', 3, 12, 1);
