// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// CMYK 各版を別角度のハーフトーン網点で重ね刷り。印刷物風のモアレパターンが現れる。

const params = {
  dotSize: 12, // 網点スクリーン間隔
  angleC: 15, // シアン角度
  angleM: 75, // マゼンタ角度
  angleY: 0, // イエロー角度
  angleK: 45, // ブラック角度
  densityC: 0.55,
  densityM: 0.55,
  densityY: 0.55,
  densityK: 0.3,
  speed: 0.3, // アニメ速度
  scale: 1, // 図案スケール
  blend: 1, // 0:multiply off, 1:on
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

/**
 * ハーフトーン 1 版を描画。
 * @param {string} color
 * @param {number} angleDeg
 * @param {number} densityFn
 * @param {number} t
 */
function drawScreen(color, angleDeg, densityFn, t) {
  const W = canvas.width;
  const H = canvas.height;
  const s = params.dotSize;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const diag = Math.hypot(W, H);
  const n = Math.ceil(diag / s) + 2;
  ctx.fillStyle = color;
  for (let j = -n; j < n; j++) {
    for (let i = -n; i < n; i++) {
      const lx = i * s;
      const ly = j * s;
      const x = lx * cos - ly * sin + W / 2;
      const y = lx * sin + ly * cos + H / 2;
      if (x < -s || x > W + s || y < -s || y > H + s) continue;
      // 濃淡フィールド（画像代わりに関数）
      const u = (x / W - 0.5) * params.scale;
      const v = (y / H - 0.5) * params.scale;
      const field =
        0.5 +
        0.5 *
          Math.sin(u * 4 + t) *
          Math.cos(v * 5 - t * 0.7 + densityFn * Math.PI);
      const d = Math.max(0, Math.min(1, field * densityFn));
      const r = Math.sqrt(d) * (s * 0.6);
      if (r < 0.2) continue;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function frame() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  const t = ((performance.now() - start) / 1000) * params.speed;

  if (params.blend >= 0.5) {
    ctx.globalCompositeOperation = 'multiply';
  }
  drawScreen('rgb(0, 180, 220)', params.angleC, params.densityC, t);
  drawScreen('rgb(220, 0, 130)', params.angleM, params.densityM, t);
  drawScreen('rgb(240, 220, 0)', params.angleY, params.densityY, t);
  drawScreen('rgb(20, 20, 20)', params.angleK, params.densityK, t);
  ctx.globalCompositeOperation = 'source-over';

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- GUI ---

const gui = new TileUI({
  title: 'CMYK Halftone',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'dotSize', 4, 32, 1);
gui.add(params, 'angleC', 0, 180, 1);
gui.add(params, 'angleM', 0, 180, 1);
gui.add(params, 'angleY', 0, 180, 1);
gui.add(params, 'angleK', 0, 180, 1);
gui.add(params, 'densityC', 0, 1, 0.01);
gui.add(params, 'densityM', 0, 1, 0.01);
gui.add(params, 'densityY', 0, 1, 0.01);
gui.add(params, 'densityK', 0, 1, 0.01);
gui.add(params, 'speed', 0, 3, 0.01);
gui.add(params, 'scale', 0.3, 3, 0.05);
gui.add(params, 'blend', 0, 1, 1);

gui.addButton('Random', () => {
  params.angleC = Math.random() * 180;
  params.angleM = Math.random() * 180;
  params.angleY = Math.random() * 180;
  params.angleK = Math.random() * 180;
  params.dotSize = 6 + Math.floor(Math.random() * 22);
  params.densityC = 0.3 + Math.random() * 0.6;
  params.densityM = 0.3 + Math.random() * 0.6;
  params.densityY = 0.3 + Math.random() * 0.6;
  params.densityK = Math.random() * 0.5;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
