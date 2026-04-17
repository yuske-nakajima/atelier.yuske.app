// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  blobCount: 14, // 溶岩ブロブ数
  radiusMin: 60, // ブロブ最小半径
  radiusMax: 140, // ブロブ最大半径
  threshold: 0.55, // メタボール閾値
  gridSize: 6, // サンプル粒度（小さいほど高精細）
  flowSpeed: 0.35, // 流れの速さ
  heatHue: 18, // 高温側色相
  coolHue: 348, // 低温側色相
  glow: 18, // グロー強度
  crust: 0.4, // 黒い皮の厚み
  pulse: 0.3, // 脈動強度
  trail: 0.12, // 残像フェード
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

/** @type {Array<{x:number,y:number,vx:number,vy:number,r:number,phase:number}>} */
let blobs = [];

function initBlobs() {
  blobs = [];
  const n = Math.max(1, Math.round(params.blobCount));
  for (let i = 0; i < n; i++) {
    blobs.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r:
        params.radiusMin +
        Math.random() * (params.radiusMax - params.radiusMin),
      phase: Math.random() * Math.PI * 2,
    });
  }
}

initBlobs();

// --- 描画 ---

let time = 0;

function update() {
  time += 1 / 60;
  for (const b of blobs) {
    b.x += b.vx * params.flowSpeed;
    b.y += b.vy * params.flowSpeed;
    // 反射
    if (b.x < -b.r) b.x = canvas.width + b.r;
    if (b.x > canvas.width + b.r) b.x = -b.r;
    if (b.y < -b.r) b.y = canvas.height + b.r;
    if (b.y > canvas.height + b.r) b.y = -b.r;
  }
}

function draw() {
  // 残像
  ctx.fillStyle = `rgba(26, 5, 5, ${params.trail})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const step = Math.max(2, Math.round(params.gridSize));
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;

  for (let py = 0; py < canvas.height; py += step) {
    for (let px = 0; px < canvas.width; px += step) {
      let sum = 0;
      for (const b of blobs) {
        const dx = px - b.x;
        const dy = py - b.y;
        const d2 = dx * dx + dy * dy;
        const r = b.r * (1 + Math.sin(time * 2 + b.phase) * params.pulse * 0.1);
        sum += (r * r) / Math.max(1, d2);
      }
      if (sum > params.threshold) {
        const heat = Math.min(1, (sum - params.threshold) * 1.5);
        // 黒い皮
        if (heat < params.crust) {
          const t = heat / params.crust;
          const r = Math.round(40 * t);
          const g = Math.round(10 * t);
          const b = Math.round(5 * t);
          fillCell(data, px, py, step, r, g, b);
        } else {
          const th = (heat - params.crust) / Math.max(0.01, 1 - params.crust);
          const hue =
            params.coolHue +
            ((params.heatHue - params.coolHue + 360) % 360) * th;
          const light = 30 + th * 50;
          const [rr, gg, bb] = hslToRgb(hue, 95, light);
          fillCell(data, px, py, step, rr, gg, bb);
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  // グロー (加算描画)
  if (params.glow > 0) {
    ctx.globalCompositeOperation = 'lighter';
    for (const b of blobs) {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 1.8);
      grad.addColorStop(
        0,
        `hsla(${params.heatHue}, 95%, 65%, ${params.glow / 60})`,
      );
      grad.addColorStop(1, `hsla(${params.heatHue}, 95%, 30%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * @param {Uint8ClampedArray} data
 * @param {number} x
 * @param {number} y
 * @param {number} step
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
function fillCell(data, x, y, step, r, g, b) {
  const w = canvas.width;
  for (let dy = 0; dy < step; dy++) {
    for (let dx = 0; dx < step; dx++) {
      const idx = ((y + dy) * w + (x + dx)) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
}

/**
 * HSL -> RGB
 * @param {number} h 0..360
 * @param {number} s 0..100
 * @param {number} l 0..100
 * @returns {[number, number, number]}
 */
function hslToRgb(h, s, l) {
  const S = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = L - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function tick() {
  update();
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Lava Flow',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'blobCount', 3, 30, 1).onChange(initBlobs);
gui.add(params, 'radiusMin', 20, 150, 1).onChange(initBlobs);
gui.add(params, 'radiusMax', 40, 250, 1).onChange(initBlobs);
gui.add(params, 'threshold', 0.2, 1.5, 0.01);
gui.add(params, 'gridSize', 2, 14, 1);
gui.add(params, 'flowSpeed', 0, 2, 0.01);
gui.add(params, 'heatHue', 0, 60, 1);
gui.add(params, 'coolHue', 300, 360, 1);
gui.add(params, 'glow', 0, 40, 1);
gui.add(params, 'crust', 0, 0.9, 0.01);
gui.add(params, 'pulse', 0, 1, 0.01);
gui.add(params, 'trail', 0.02, 0.4, 0.01);

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
  params.blobCount = rand(8, 20, 1);
  params.radiusMin = rand(40, 100, 1);
  params.radiusMax = rand(100, 180, 1);
  params.threshold = rand(0.4, 0.9, 0.01);
  params.flowSpeed = rand(0.15, 0.8, 0.01);
  params.heatHue = rand(5, 40, 1);
  params.glow = rand(8, 30, 1);
  params.crust = rand(0.2, 0.6, 0.01);
  initBlobs();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initBlobs();
  gui.updateDisplay();
});
