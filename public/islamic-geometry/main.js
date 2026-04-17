// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  symmetry: 8, // 回転対称数（星形の頂点数）
  tileSize: 120, // タイル 1 辺のサイズ
  layers: 3, // 星形に重ねるレイヤー数
  innerRadius: 0.42, // 内側の比率
  rotation: 0, // 全体回転（度）
  lineWidth: 1.4, // 線の太さ
  hueBase: 40, // 基本色相
  hueShift: 18, // レイヤーごとの色相シフト
  saturation: 55, // 彩度
  lightness: 68, // 明度
  background: 12, // 背景明度
  animate: 0.1, // 回転アニメ速度
  showGuides: false, // 補助円を表示
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

/**
 * 1 タイルに星形模様を描画する。
 * @param {number} cx
 * @param {number} cy
 * @param {number} size
 * @param {number} rot
 */
function drawStar(cx, cy, size, rot) {
  const n = Math.max(4, Math.floor(params.symmetry));
  const R = size * 0.5;
  const r = R * params.innerRadius;
  const L = Math.max(1, Math.floor(params.layers));
  ctx.lineWidth = params.lineWidth;
  ctx.lineJoin = 'round';
  for (let layer = 0; layer < L; layer++) {
    const t = layer / L;
    const hue = params.hueBase + layer * params.hueShift;
    ctx.strokeStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    const scale = 1 - t * 0.3;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const angle = (Math.PI * i) / n + rot + (layer * Math.PI) / (n * 2);
      const rad = (i % 2 === 0 ? R : r) * scale;
      const px = cx + Math.cos(angle) * rad;
      const py = cy + Math.sin(angle) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }
  if (params.showGuides) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

let time = 0;

function render() {
  ctx.fillStyle = `hsl(260, 30%, ${params.background}%)`;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  const size = Math.max(40, params.tileSize);
  const rot = (params.rotation * Math.PI) / 180 + time * params.animate;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cols = Math.ceil(w / size) + 2;
  const rows = Math.ceil(h / size) + 2;
  const offX = -size;
  const offY = -size;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = offX + (i + 0.5) * size;
      const cy = offY + (j + 0.5) * size;
      drawStar(cx, cy, size, rot);
    }
  }
}

function tick() {
  time += 0.01;
  render();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- GUI ---

const gui = new TileUI({
  title: 'Islamic Geometry',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'symmetry', 4, 16, 1);
gui.add(params, 'tileSize', 60, 260, 5);
gui.add(params, 'layers', 1, 6, 1);
gui.add(params, 'innerRadius', 0.2, 0.9, 0.01);
gui.add(params, 'rotation', 0, 360, 1);
gui.add(params, 'lineWidth', 0.5, 4, 0.1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueShift', -60, 60, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 20, 95, 1);
gui.add(params, 'animate', -1, 1, 0.01);
gui.add(params, 'showGuides');

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.symmetry = r(5, 12, 1);
  params.tileSize = r(80, 220, 5);
  params.layers = r(1, 5, 1);
  params.innerRadius = r(0.3, 0.7, 0.01);
  params.rotation = r(0, 360, 1);
  params.hueBase = r(0, 360, 1);
  params.hueShift = r(-40, 40, 1);
  params.saturation = r(30, 80, 1);
  params.lightness = r(45, 85, 1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
