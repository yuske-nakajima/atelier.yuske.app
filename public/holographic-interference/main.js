// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 複数の波長（RGB 3 成分）でそれぞれ別の周波数・角度の波を重ね合わせ、
// ホログラムのような干渉虹色を出す。ImageData で画素単位に計算する。

const params = {
  pixel: 3, // ピクセル間引き（大きいほど速い）
  freqR: 0.035,
  freqG: 0.045,
  freqB: 0.055,
  angleR: 0,
  angleG: 45,
  angleB: 90,
  speed: 1.2, // 時間速度
  brightness: 1.1, // 明度ゲイン
  saturation: 1.0, // 彩度
  curvature: 0.4, // 同心円成分の強度
  tiltX: 0, // 傾きシフト
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
  const p = Math.max(1, Math.floor(params.pixel));
  const w = Math.floor(W / p);
  const h = Math.floor(H / p);
  const img = ctx.createImageData(w, h);
  const t = ((performance.now() - start) / 1000) * params.speed;

  const aR = (params.angleR * Math.PI) / 180;
  const aG = (params.angleG * Math.PI) / 180;
  const aB = (params.angleB * Math.PI) / 180;
  const cxR = Math.cos(aR);
  const syR = Math.sin(aR);
  const cxG = Math.cos(aG);
  const syG = Math.sin(aG);
  const cxB = Math.cos(aB);
  const syB = Math.sin(aB);
  const bright = params.brightness;
  const sat = params.saturation;
  const curv = params.curvature;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const X = x - w / 2 + params.tiltX;
      const Y = y - h / 2;
      const r = Math.sqrt(X * X + Y * Y);
      const wR = X * cxR + Y * syR;
      const wG = X * cxG + Y * syG;
      const wB = X * cxB + Y * syB;
      const R =
        0.5 + 0.5 * Math.sin(wR * params.freqR + r * curv * params.freqR + t);
      const G =
        0.5 +
        0.5 * Math.sin(wG * params.freqG + r * curv * params.freqG + t * 1.1);
      const B =
        0.5 +
        0.5 * Math.sin(wB * params.freqB + r * curv * params.freqB + t * 0.9);
      const avg = (R + G + B) / 3;
      const Rs = avg + (R - avg) * sat;
      const Gs = avg + (G - avg) * sat;
      const Bs = avg + (B - avg) * sat;
      const i = (y * w + x) * 4;
      img.data[i] = Math.max(0, Math.min(255, Rs * 255 * bright));
      img.data[i + 1] = Math.max(0, Math.min(255, Gs * 255 * bright));
      img.data[i + 2] = Math.max(0, Math.min(255, Bs * 255 * bright));
      img.data[i + 3] = 255;
    }
  }

  // 低解像度 ImageData を拡大描画
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = /** @type {CanvasRenderingContext2D} */ (off.getContext('2d'));
  octx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- GUI ---

const gui = new TileUI({
  title: 'Holographic Interference',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'pixel', 1, 8, 1);
gui.add(params, 'freqR', 0.005, 0.2, 0.001);
gui.add(params, 'freqG', 0.005, 0.2, 0.001);
gui.add(params, 'freqB', 0.005, 0.2, 0.001);
gui.add(params, 'angleR', 0, 180, 1);
gui.add(params, 'angleG', 0, 180, 1);
gui.add(params, 'angleB', 0, 180, 1);
gui.add(params, 'speed', 0, 4, 0.01);
gui.add(params, 'brightness', 0.3, 2, 0.01);
gui.add(params, 'saturation', 0, 2, 0.01);
gui.add(params, 'curvature', 0, 2, 0.01);
gui.add(params, 'tiltX', -300, 300, 1);

gui.addButton('Random', () => {
  params.freqR = 0.01 + Math.random() * 0.1;
  params.freqG = 0.01 + Math.random() * 0.1;
  params.freqB = 0.01 + Math.random() * 0.1;
  params.angleR = Math.random() * 180;
  params.angleG = Math.random() * 180;
  params.angleB = Math.random() * 180;
  params.curvature = Math.random() * 1.5;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
