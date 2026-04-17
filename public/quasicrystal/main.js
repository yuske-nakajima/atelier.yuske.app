// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 準結晶パターン：N個の平面波の重ね合わせで生成する非周期的干渉縞。
// 5-foldや7-fold対称のモアレ様パターンが現れる。

const params = {
  waves: 7, // 波の数（対称性）
  frequency: 0.018, // 空間周波数
  animSpeed: 0.3, // アニメーション速度
  hueBase: 220, // 基本色相
  hueRange: 120, // 色相の幅
  contrast: 1.4, // コントラスト
  saturation: 80, // 彩度
  brightness: 55, // 明度
  phaseShift: 0, // 初期位相ずれ
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

// 解像度を下げて高速化するためオフスクリーンキャンバスを使う
const offscreen = document.createElement('canvas');
const offCtx = /** @type {CanvasRenderingContext2D} */ (
  offscreen.getContext('2d')
);
const SCALE = 0.25; // 1/4解像度で描画

/** @type {ImageData|null} */
let offImgData = null;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  offscreen.width = Math.round(canvas.width * SCALE);
  offscreen.height = Math.round(canvas.height * SCALE);
  offImgData = offCtx.createImageData(offscreen.width, offscreen.height);
}

window.addEventListener('resize', resize);
resize();

let time = 0;

function draw() {
  time += params.animSpeed * 0.016;
  const ow = offscreen.width;
  const oh = offscreen.height;
  if (!offImgData) return;
  const data = offImgData.data;

  const n = Math.max(3, Math.round(params.waves));
  const freq = params.frequency / SCALE;
  const t = time;
  const cx = ow / 2;
  const cy = oh / 2;

  for (let py = 0; py < oh; py++) {
    for (let px = 0; px < ow; px++) {
      const x = px - cx;
      const y = py - cy;
      let sum = 0;
      for (let k = 0; k < n; k++) {
        const angle = (k * Math.PI * 2) / n + params.phaseShift;
        const kx = Math.cos(angle);
        const ky = Math.sin(angle);
        sum += Math.cos((kx * x + ky * y) * freq * 2 * Math.PI + t * k * 0.3);
      }
      const v = (sum / n + 1) / 2;
      const vc = Math.max(0, Math.min(1, v)) ** params.contrast;

      const hue = (params.hueBase + vc * params.hueRange) % 360;
      const sat = params.saturation / 100;
      const lig = (params.brightness * (0.3 + vc * 0.7)) / 100;

      const h0 = hue / 60;
      const c0 = (1 - Math.abs(2 * lig - 1)) * sat;
      const x0 = c0 * (1 - Math.abs((h0 % 2) - 1));
      const m0 = lig - c0 / 2;
      let r0 = 0;
      let g0 = 0;
      let b0 = 0;
      if (h0 < 1) {
        r0 = c0;
        g0 = x0;
      } else if (h0 < 2) {
        r0 = x0;
        g0 = c0;
      } else if (h0 < 3) {
        g0 = c0;
        b0 = x0;
      } else if (h0 < 4) {
        g0 = x0;
        b0 = c0;
      } else if (h0 < 5) {
        r0 = x0;
        b0 = c0;
      } else {
        r0 = c0;
        b0 = x0;
      }

      const idx = (py * ow + px) * 4;
      data[idx] = Math.round((r0 + m0) * 255);
      data[idx + 1] = Math.round((g0 + m0) * 255);
      data[idx + 2] = Math.round((b0 + m0) * 255);
      data[idx + 3] = 255;
    }
  }
  offCtx.putImageData(offImgData, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offscreen, 0, 0, canvas.width, canvas.height);
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Quasicrystal',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'waves', 3, 12, 1);
gui.add(params, 'frequency', 0.005, 0.06, 0.001);
gui.add(params, 'animSpeed', 0, 3, 0.05);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'contrast', 0.2, 4, 0.05);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'brightness', 10, 90, 1);
gui.add(params, 'phaseShift', 0, Math.PI * 2, 0.05);

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
  params.waves = rand(3, 11, 1);
  params.frequency = rand(0.008, 0.04, 0.001);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  params.contrast = rand(0.5, 3, 0.05);
  params.saturation = rand(50, 100, 1);
  params.brightness = rand(30, 70, 1);
  params.phaseShift = rand(0, Math.PI * 2, 0.05);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
