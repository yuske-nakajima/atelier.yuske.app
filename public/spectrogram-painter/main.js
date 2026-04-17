// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  bands: 64, // 周波数帯の数
  scrollSpeed: 1.4,
  noiseAmount: 0.25,
  tone1: 0.5, // トーン 1 ベース
  tone2: 1.3,
  tone3: 2.1,
  wobble: 0.5, // 周波数の揺らぎ
  hueBase: 200,
  hueRange: 160,
  gamma: 1.6,
  decay: 0.04,
  intensity: 1,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

let time = 0;

function draw() {
  time += 1 / 60;
  // 既存画像を左へスクロール
  const shift = Math.max(1, Math.round(params.scrollSpeed));
  const img = ctx.getImageData(shift, 0, canvas.width - shift, canvas.height);
  ctx.putImageData(img, 0, 0);
  // 右端を黒で塗る
  ctx.fillStyle = `rgba(11, 10, 7, ${0.6 + params.decay})`;
  ctx.fillRect(canvas.width - shift, 0, shift, canvas.height);

  // 新しい列（右端）にスペクトル縞を描画
  const n = Math.round(params.bands);
  const bandH = canvas.height / n;
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    const freq1 =
      params.tone1 * (1 + Math.sin(time * 0.9 + f * 6) * params.wobble);
    const freq2 =
      params.tone2 * (1 + Math.cos(time * 1.3 + f * 4) * params.wobble);
    const freq3 =
      params.tone3 * (1 + Math.sin(time * 0.6 + f * 2) * params.wobble);
    const formant =
      Math.exp(-((f - 0.15) * (f - 0.15)) / 0.02) +
      Math.exp(-((f - 0.4) * (f - 0.4)) / 0.05) * 0.8 +
      Math.exp(-((f - 0.7) * (f - 0.7)) / 0.1) * 0.5;
    const mod =
      (Math.sin(time * freq1 * 4 + f * 20) * 0.5 + 0.5) *
      (Math.sin(time * freq2 * 3 + f * 12) * 0.5 + 0.5) *
      (Math.sin(time * freq3 * 2 + f * 6) * 0.5 + 0.5);
    const noise = (Math.random() - 0.5) * params.noiseAmount;
    let v = (formant * mod + noise) * params.intensity;
    v = Math.max(0, Math.min(1, v));
    v = v ** (1 / params.gamma);
    const hue = params.hueBase + f * params.hueRange;
    const a = v * 0.95;
    ctx.fillStyle = `hsla(${hue}, 90%, ${20 + v * 60}%, ${a})`;
    ctx.fillRect(canvas.width - shift, i * bandH, shift, bandH + 0.5);
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Spectrogram Painter',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'bands', 16, 128, 1);
gui.add(params, 'scrollSpeed', 0.5, 5, 0.1);
gui.add(params, 'noiseAmount', 0, 1, 0.01);
gui.add(params, 'tone1', 0.1, 3, 0.01);
gui.add(params, 'tone2', 0.1, 3, 0.01);
gui.add(params, 'tone3', 0.1, 3, 0.01);
gui.add(params, 'wobble', 0, 1.5, 0.01);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'gamma', 0.5, 3, 0.05);
gui.add(params, 'decay', 0, 0.3, 0.01);
gui.add(params, 'intensity', 0.2, 2, 0.05);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.tone1 = rand(0.3, 1.5, 0.01);
  params.tone2 = rand(0.5, 2, 0.01);
  params.tone3 = rand(1, 2.5, 0.01);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(60, 240, 1);
  params.wobble = rand(0.2, 0.9, 0.01);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  ctx.fillStyle = '#0b0a07';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});
