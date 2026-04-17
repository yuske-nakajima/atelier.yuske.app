// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 残像現象（視覚の持続）を模したパーティクル軌跡ビジュアル。
// 点がリサージュ軌道を描き、フェード率で尾の長さを制御する。

const params = {
  particles: 200, // パーティクル数
  aRatio: 3, // リサージュ a
  bRatio: 2, // リサージュ b
  phaseOffset: 0.6, // 位相ずれ
  speed: 0.6, // 軌道速度
  size: 2, // 点サイズ
  persistence: 0.05, // フェード率（小さいほど残像が長い）
  hue: 180, // 基準色相
  hueSpread: 120, // 粒子間の色相分散
  saturation: 80,
  lightness: 60,
  glow: 8, // グロー
  amplitude: 0.42, // 軌道半径（画面比）
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
  const t = ((performance.now() - start) / 1000) * params.speed;

  ctx.fillStyle = `rgba(0, 0, 0, ${params.persistence})`;
  ctx.fillRect(0, 0, W, H);

  const n = Math.floor(params.particles);
  const rx = (Math.min(W, H) / 2) * params.amplitude;
  const ry = rx;
  const cx = W / 2;
  const cy = H / 2;

  ctx.shadowBlur = params.glow;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const offset = u * params.phaseOffset * Math.PI * 2;
    const x = cx + rx * Math.sin(params.aRatio * t + offset);
    const y = cy + ry * Math.sin(params.bRatio * t + offset * 1.3);
    const hue = (params.hue + u * params.hueSpread) % 360;
    const color = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(x, y, params.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- GUI ---

const gui = new TileUI({
  title: 'Retinal Persistence',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'particles', 10, 800, 1);
gui.add(params, 'aRatio', 1, 9, 0.01);
gui.add(params, 'bRatio', 1, 9, 0.01);
gui.add(params, 'phaseOffset', 0, 2, 0.01);
gui.add(params, 'speed', 0, 3, 0.01);
gui.add(params, 'size', 0.5, 10, 0.1);
gui.add(params, 'persistence', 0.005, 0.3, 0.005);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueSpread', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'glow', 0, 30, 1);
gui.add(params, 'amplitude', 0.1, 0.5, 0.01);

gui.addButton('Random', () => {
  params.aRatio = 1 + Math.floor(Math.random() * 8) + Math.random();
  params.bRatio = 1 + Math.floor(Math.random() * 8) + Math.random();
  params.phaseOffset = Math.random() * 2;
  params.hue = Math.floor(Math.random() * 360);
  params.hueSpread = Math.floor(Math.random() * 360);
  params.particles = 50 + Math.floor(Math.random() * 500);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
