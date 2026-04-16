// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  sourceCount: 3, // 波源の数
  wavelength: 60, // 波長（px 相当）
  speed: 1.2, // 位相の進む速度
  amplitude: 1, // 振幅（0〜1）
  decay: 0.004, // 距離による減衰係数
  resolution: 3, // ピクセルスケール（大きいほど粗くて速い）
  hueA: 210, // 山の色相
  hueB: 30, // 谷の色相
  contrast: 1.4, // コントラスト
  bandSharpness: 0.6, // 等位線の鋭さ
  motion: 0.3, // 波源のゆらぎ
  showSources: true, // 波源を表示
};

const defaults = { ...params };

// --- Canvas セットアップ ---

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

let width = 0;
let height = 0;
/** @type {ImageData | null} */
let image = null;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  width = Math.ceil(canvas.width / params.resolution);
  height = Math.ceil(canvas.height / params.resolution);
  image = ctx.createImageData(width, height);
  reseedSources();
}

window.addEventListener('resize', resize);

// --- 波源 ---

/**
 * @typedef {{ x: number, y: number, ox: number, oy: number, phase: number }} Source
 */

/** @type {Source[]} */
let sources = [];

function reseedSources() {
  sources = [];
  for (let i = 0; i < params.sourceCount; i++) {
    const x = (canvas.width * (i + 1)) / (params.sourceCount + 1);
    const y = canvas.height * (0.4 + Math.random() * 0.2);
    sources.push({
      x,
      y,
      ox: x,
      oy: y,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

resize();

// --- 更新 ---

let time = 0;

function step() {
  time += 0.016 * params.speed;
  for (const s of sources) {
    const wobble = params.motion * 40;
    s.x = s.ox + Math.sin(time * 0.6 + s.phase) * wobble;
    s.y = s.oy + Math.cos(time * 0.7 + s.phase * 1.3) * wobble;
  }
}

// --- 描画 ---

/**
 * 与えられたピクセル位置の波の合成値を計算（-1〜1 程度）
 * @param {number} px
 * @param {number} py
 */
function waveAt(px, py) {
  const k = (2 * Math.PI) / Math.max(4, params.wavelength);
  let sum = 0;
  for (const s of sources) {
    const dx = px - s.x;
    const dy = py - s.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const atten = Math.exp(-d * params.decay);
    sum += Math.sin(d * k - time * 2 + s.phase) * atten;
  }
  return (sum / Math.max(1, sources.length)) * params.amplitude;
}

/**
 * HSL → RGB 変換
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {[number, number, number]}
 */
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function draw() {
  if (!image) return;
  const data = image.data;
  const res = params.resolution;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = waveAt(x * res, y * res);
      const shaped = Math.tanh(v * params.contrast);
      const band = Math.cos(shaped * Math.PI) ** (1 + params.bandSharpness * 6);
      const hue = shaped > 0 ? params.hueA : params.hueB;
      const light = 0.12 + band * 0.55;
      const [r, g, b] = hslToRgb(hue, 0.85, light);
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  // 高解像度にスケール
  if (res !== 1) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(
      canvas,
      0,
      0,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }
  if (params.showSources) {
    for (const s of sources) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function tick() {
  step();
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Wave Interference',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'sourceCount', 2, 8, 1).onChange(reseedSources);
gui.add(params, 'wavelength', 10, 200, 1);
gui.add(params, 'speed', 0, 4, 0.05);
gui.add(params, 'amplitude', 0.2, 2, 0.05);
gui.add(params, 'decay', 0, 0.02, 0.0005);
gui.add(params, 'resolution', 1, 6, 1).onChange(resize);
gui.add(params, 'hueA', 0, 360, 1);
gui.add(params, 'hueB', 0, 360, 1);
gui.add(params, 'contrast', 0.3, 3, 0.05);
gui.add(params, 'bandSharpness', 0, 1, 0.01);
gui.add(params, 'motion', 0, 1.5, 0.05);
gui.add(params, 'showSources');

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
  params.sourceCount = rand(2, 6, 1);
  params.wavelength = rand(25, 140, 1);
  params.speed = rand(0.4, 2.5, 0.05);
  params.amplitude = rand(0.6, 1.4, 0.05);
  params.decay = rand(0.001, 0.01, 0.0005);
  params.hueA = rand(0, 360, 1);
  params.hueB = rand(0, 360, 1);
  params.contrast = rand(0.6, 2.4, 0.05);
  params.bandSharpness = rand(0, 0.9, 0.01);
  params.motion = rand(0, 0.8, 0.05);
  reseedSources();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  resize();
  gui.updateDisplay();
});
