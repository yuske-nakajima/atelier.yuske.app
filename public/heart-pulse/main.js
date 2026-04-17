// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 心臓曲線: x = 16 sin^3 t, y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t。
// 拍動に合わせて大きさと色が脈動する。

const params = {
  bpm: 72, // 拍動レート
  size: 16, // 基本サイズ
  pulseAmp: 0.18, // 拍動振幅
  pulseSharp: 6, // 拍動の鋭さ
  hue: 0, // 色相
  saturation: 75, // 彩度
  lightness: 55, // 明度
  glow: 20, // シャドウブラー
  trail: 0.08, // フェード
  bg: 4, // 背景明度
  lineWidth: 3, // 線幅
  segments: 360, // 曲線分割数
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

const startTime = performance.now();

/**
 * 拍動カーブ（0..1）。急峻なパルス形状。
 * @param {number} phase
 */
function beat(phase) {
  // 二重 bump で収縮期/拡張期を近似
  const p = phase - Math.floor(phase);
  const a = Math.exp(-params.pulseSharp * Math.abs(p - 0.0));
  const b = Math.exp(-params.pulseSharp * Math.abs(p - 0.25)) * 0.5;
  return a + b;
}

function frame() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsla(0, 0%, ${params.bg}%, ${params.trail})`;
  ctx.fillRect(0, 0, w, h);

  const t = (performance.now() - startTime) / 1000;
  const phase = (t * params.bpm) / 60;
  const pulse = 1 + beat(phase) * params.pulseAmp;
  const scale = Math.min(w, h) * 0.02 * params.size * pulse;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.lineWidth = params.lineWidth;
  ctx.shadowColor = `hsl(${params.hue}, ${params.saturation}%, 60%)`;
  ctx.shadowBlur = params.glow;
  ctx.beginPath();
  const seg = Math.floor(params.segments);
  for (let i = 0; i <= seg; i++) {
    const th = (i / seg) * Math.PI * 2;
    const x = 16 * Math.sin(th) ** 3;
    const y = -(
      13 * Math.cos(th) -
      5 * Math.cos(2 * th) -
      2 * Math.cos(3 * th) -
      Math.cos(4 * th)
    );
    const px = x * scale;
    const py = y * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- GUI ---

const gui = new TileUI({
  title: 'Heart Pulse',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'bpm', 30, 180, 1);
gui.add(params, 'size', 4, 40, 0.5);
gui.add(params, 'pulseAmp', 0, 0.6, 0.01);
gui.add(params, 'pulseSharp', 2, 20, 0.1);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 20, 90, 1);
gui.add(params, 'glow', 0, 60, 1);
gui.add(params, 'trail', 0.01, 0.5, 0.01);
gui.add(params, 'lineWidth', 0.5, 10, 0.1);
gui.add(params, 'segments', 60, 720, 10);
gui.add(params, 'bg', 0, 20, 1);

gui.addButton('Random', () => {
  params.bpm = 50 + Math.floor(Math.random() * 100);
  params.hue = Math.floor(Math.random() * 360);
  params.pulseAmp = 0.1 + Math.random() * 0.3;
  params.glow = Math.floor(Math.random() * 50);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
