// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 3D リサジュー曲線：3軸の正弦波を組み合わせた空間曲線。
// 透視投影で3D回転させながら軌跡を残す。

const params = {
  freqX: 3, // X軸周波数
  freqY: 4, // Y軸周波数
  freqZ: 5, // Z軸周波数
  phaseX: 0, // X位相
  phaseY: 0.5, // Y位相
  phaseZ: 1.0, // Z位相
  rotSpeedX: 0.3, // X軸回転速度
  rotSpeedY: 0.5, // Y軸回転速度
  trailLength: 800, // 軌跡の長さ
  hueStart: 180, // 軌跡の開始色相
  hueEnd: 300, // 軌跡の終了色相
  lineWidth: 1.5, // 線幅
  fadeAlpha: 0.04, // フェード強度
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

let time = 0;
let rotX = 0;
let rotY = 0;

/** @type {{x: number, y: number, z: number}[]} */
let trail = [];

/**
 * 3D点を2D投影する（透視投影）
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{sx: number, sy: number}}
 */
function project(x, y, z) {
  // X軸回転
  const y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
  const z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
  // Y軸回転
  const x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
  const z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);

  const fov = 400;
  const depth = z2 + 500;
  const scale = fov / depth;
  const sx = canvas.width / 2 + x2 * scale;
  const sy = canvas.height / 2 + y1 * scale;
  return { sx, sy };
}

function draw() {
  time += 0.016;
  rotX += params.rotSpeedX * 0.005;
  rotY += params.rotSpeedY * 0.007;

  const w = canvas.width;
  const h = canvas.height;
  const scale = Math.min(w, h) * 0.35;

  ctx.fillStyle = `rgba(11, 10, 7, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  // 現在の3D点を計算
  const x = Math.sin(params.freqX * time + params.phaseX) * scale;
  const y = Math.sin(params.freqY * time + params.phaseY) * scale;
  const z = Math.sin(params.freqZ * time + params.phaseZ) * scale;

  trail.push({ x, y, z });
  if (trail.length > params.trailLength) {
    trail.splice(0, trail.length - params.trailLength);
  }

  // 軌跡を描画
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';
  for (let i = 1; i < trail.length; i++) {
    const t = i / trail.length;
    const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
    ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${t * 0.9})`;

    const p1 = project(trail[i - 1].x, trail[i - 1].y, trail[i - 1].z);
    const p2 = project(trail[i].x, trail[i].y, trail[i].z);
    ctx.beginPath();
    ctx.moveTo(p1.sx, p1.sy);
    ctx.lineTo(p2.sx, p2.sy);
    ctx.stroke();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Lissajous 3D',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'freqX', 1, 10, 1);
gui.add(params, 'freqY', 1, 10, 1);
gui.add(params, 'freqZ', 1, 10, 1);
gui.add(params, 'phaseX', 0, Math.PI * 2, 0.05);
gui.add(params, 'phaseY', 0, Math.PI * 2, 0.05);
gui.add(params, 'phaseZ', 0, Math.PI * 2, 0.05);
gui.add(params, 'rotSpeedX', 0, 2, 0.05);
gui.add(params, 'rotSpeedY', 0, 2, 0.05);
gui.add(params, 'trailLength', 100, 2000, 50);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'fadeAlpha', 0.01, 0.3, 0.005);

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
  params.freqX = rand(1, 8, 1);
  params.freqY = rand(1, 8, 1);
  params.freqZ = rand(1, 8, 1);
  params.phaseX = rand(0, Math.PI * 2, 0.05);
  params.phaseY = rand(0, Math.PI * 2, 0.05);
  params.phaseZ = rand(0, Math.PI * 2, 0.05);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  trail = [];
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  trail = [];
  gui.updateDisplay();
});
