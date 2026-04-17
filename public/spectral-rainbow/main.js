// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 波長 380..780nm の可視光スペクトルを CIE 的近似で RGB 化し、
// 帯状に並べて動かす。プリズムを通した光の分光を模したビジュアル。

const params = {
  bands: 400, // 帯の分割数
  waveSpeed: 0.6, // 波の速度
  amplitude: 40, // 波の振幅
  frequency: 2.5, // 波の周波数
  tilt: 0.15, // 傾き
  saturation: 1.0, // 彩度強調
  intensity: 1.0, // 明度
  blur: 4, // ぼかし
  thickness: 1.2, // 帯の太さ倍率
  swirl: 0, // 渦度
  hueShift: 0, // 波長全体のシフト
  bgFade: 0.08, // 残像
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

/**
 * 波長 (nm) → RGB 近似。
 * @param {number} wl
 * @returns {[number, number, number]}
 */
function wavelengthToRGB(wl) {
  let r = 0;
  let g = 0;
  let b = 0;
  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / 60;
    b = 1;
  } else if (wl < 490) {
    g = (wl - 440) / 50;
    b = 1;
  } else if (wl < 510) {
    g = 1;
    b = -(wl - 510) / 20;
  } else if (wl < 580) {
    r = (wl - 510) / 70;
    g = 1;
  } else if (wl < 645) {
    r = 1;
    g = -(wl - 645) / 65;
  } else if (wl <= 780) {
    r = 1;
  }
  let f = 1;
  if (wl < 420) f = 0.3 + (0.7 * (wl - 380)) / 40;
  else if (wl > 700) f = 0.3 + (0.7 * (780 - wl)) / 80;
  return [r * f, g * f, b * f];
}

const start = performance.now();

function frame() {
  const W = canvas.width;
  const H = canvas.height;
  const t = ((performance.now() - start) / 1000) * params.waveSpeed;

  ctx.fillStyle = `rgba(0, 0, 0, ${params.bgFade})`;
  ctx.fillRect(0, 0, W, H);

  const n = Math.floor(params.bands);
  const bw = (W / n) * params.thickness;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const wl = 380 + u * 400 + params.hueShift;
    const wlWrapped = ((((wl - 380) % 400) + 400) % 400) + 380;
    const [r, g, b] = wavelengthToRGB(wlWrapped);
    const x = u * W;
    const baseY = H / 2 + (u - 0.5) * H * params.tilt;
    const phase = u * params.frequency * Math.PI * 2 + t;
    const y = baseY + Math.sin(phase) * params.amplitude;
    const swirlX = x + Math.cos(phase * 0.5) * params.swirl * 40;
    ctx.fillStyle = `rgba(${Math.floor(r * 255 * params.intensity)}, ${Math.floor(g * 255 * params.intensity)}, ${Math.floor(b * 255 * params.intensity)}, ${params.saturation})`;
    ctx.filter = `blur(${params.blur}px)`;
    ctx.fillRect(swirlX, y - H * 0.3, Math.max(1, bw), H * 0.6);
  }
  ctx.filter = 'none';

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- GUI ---

const gui = new TileUI({
  title: 'Spectral Rainbow',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'bands', 50, 800, 10);
gui.add(params, 'waveSpeed', 0, 3, 0.01);
gui.add(params, 'amplitude', 0, 200, 1);
gui.add(params, 'frequency', 0, 8, 0.05);
gui.add(params, 'tilt', -0.5, 0.5, 0.01);
gui.add(params, 'saturation', 0.1, 1, 0.01);
gui.add(params, 'intensity', 0.2, 1.5, 0.01);
gui.add(params, 'blur', 0, 20, 0.5);
gui.add(params, 'thickness', 0.5, 4, 0.1);
gui.add(params, 'swirl', 0, 3, 0.05);
gui.add(params, 'hueShift', -200, 200, 1);
gui.add(params, 'bgFade', 0.02, 0.5, 0.01);

gui.addButton('Random', () => {
  params.waveSpeed = 0.2 + Math.random() * 2;
  params.amplitude = Math.random() * 150;
  params.frequency = 0.5 + Math.random() * 5;
  params.tilt = -0.3 + Math.random() * 0.6;
  params.swirl = Math.random() * 2;
  params.hueShift = -100 + Math.random() * 200;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
