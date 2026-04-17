// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 錯視パターン（同心円のモーション錯視、Café Wall 錯視、回転バーの Rotating Snakes 風）を
// 切り替えて表示する。静止しているのに動いて見える現象を観察する。

const params = {
  kind: 0, // 0:回転渦錯視, 1:Café Wall, 2:放射状チェック
  rings: 14, // リング数
  sectors: 24, // セクタ数
  tilt: 6, // Café Wall タイルのオフセット
  rotation: 0.05, // わずかな回転
  contrast: 1, // コントラスト
  hueA: 210,
  hueB: 30,
  lightA: 30,
  lightB: 85,
  mortar: 3, // Café Wall モルタル幅
  radiusScale: 0.45, // 渦の大きさ比
  phase: 0, // 位相
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

function drawSpiral() {
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * params.radiusScale;
  const rings = Math.floor(params.rings);
  const sectors = Math.floor(params.sectors);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(params.phase);
  for (let r = 0; r < rings; r++) {
    const r0 = (r / rings) * R;
    const r1 = ((r + 1) / rings) * R;
    const off = r * params.rotation;
    for (let s = 0; s < sectors; s++) {
      const a0 = (s / sectors) * Math.PI * 2 + off;
      const a1 = ((s + 1) / sectors) * Math.PI * 2 + off;
      const dark = (s + r) % 2 === 0;
      const L = dark ? params.lightA : params.lightB;
      const hue = dark ? params.hueA : params.hueB;
      ctx.fillStyle = `hsl(${hue}, 40%, ${L}%)`;
      ctx.beginPath();
      ctx.arc(0, 0, r1, a0, a1);
      ctx.arc(0, 0, r0, a1, a0, true);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCafeWall() {
  const W = canvas.width;
  const H = canvas.height;
  const tile = 60;
  const mortar = params.mortar;
  const rows = Math.ceil(H / tile) + 2;
  const cols = Math.ceil(W / tile) + 2;
  ctx.fillStyle = `hsl(${params.hueA}, 10%, ${params.lightA}%)`;
  ctx.fillRect(0, 0, W, H);
  for (let r = 0; r < rows; r++) {
    const shift = (r % 2 === 0 ? 0 : params.tilt) - tile;
    for (let c = 0; c < cols; c++) {
      const x = c * tile + shift;
      const y = r * tile;
      const black = (c + Math.floor(r / 1)) % 2 === 0;
      ctx.fillStyle = black
        ? `hsl(${params.hueA}, 10%, ${params.lightA}%)`
        : `hsl(${params.hueB}, 10%, ${params.lightB}%)`;
      ctx.fillRect(x, y, tile - mortar, tile - mortar);
    }
  }
}

function drawRadial() {
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.hypot(W, H);
  const sectors = Math.floor(params.sectors);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(params.phase);
  for (let s = 0; s < sectors; s++) {
    const a0 = (s / sectors) * Math.PI * 2;
    const a1 = ((s + 1) / sectors) * Math.PI * 2;
    ctx.fillStyle =
      s % 2 === 0
        ? `hsl(${params.hueA}, 15%, ${params.lightA}%)`
        : `hsl(${params.hueB}, 15%, ${params.lightB}%)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  const rings = Math.floor(params.rings);
  for (let r = 0; r < rings; r++) {
    const rr = ((r + 1) / rings) * Math.min(W, H) * 0.5;
    ctx.strokeStyle = `rgba(0,0,0,${0.08 * params.contrast})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function render() {
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = '#f4f0e8';
  ctx.fillRect(0, 0, W, H);
  const k = Math.floor(params.kind);
  if (k === 0) drawSpiral();
  else if (k === 1) drawCafeWall();
  else drawRadial();
}

function loop() {
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- GUI ---

const gui = new TileUI({
  title: 'Optical Illusion',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'kind', 0, 2, 1);
gui.add(params, 'rings', 4, 40, 1);
gui.add(params, 'sectors', 6, 64, 1);
gui.add(params, 'tilt', -40, 40, 1);
gui.add(params, 'rotation', -0.3, 0.3, 0.005);
gui.add(params, 'contrast', 0.2, 2, 0.05);
gui.add(params, 'hueA', 0, 360, 1);
gui.add(params, 'hueB', 0, 360, 1);
gui.add(params, 'lightA', 0, 50, 1);
gui.add(params, 'lightB', 50, 100, 1);
gui.add(params, 'mortar', 0, 10, 1);
gui.add(params, 'radiusScale', 0.1, 0.55, 0.01);

gui.addButton('Random', () => {
  params.kind = Math.floor(Math.random() * 3);
  params.rings = 4 + Math.floor(Math.random() * 30);
  params.sectors = 6 + Math.floor(Math.random() * 50);
  params.rotation = -0.2 + Math.random() * 0.4;
  params.hueA = Math.floor(Math.random() * 360);
  params.hueB = Math.floor(Math.random() * 360);
  params.tilt = -30 + Math.random() * 60;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
