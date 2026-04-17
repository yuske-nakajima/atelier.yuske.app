// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  layers: 5, // オーロラ層数
  ribbonHeight: 240, // リボンの高さ
  waveAmp: 70, // 波の振幅
  waveFreq: 0.006, // 波の周波数
  flowSpeed: 0.5, // 流れの速度
  hueGreen: 140, // 緑系の色相
  huePurple: 290, // 紫系の色相
  saturation: 90, // 彩度
  intensity: 0.75, // 発光強度
  starCount: 140, // 星の数
  starTwinkle: 0.4, // 星の瞬き強度
  groundDark: 0.85, // 地面の暗さ
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  placeStars();
}

window.addEventListener('resize', resize);

/** @type {Array<{x:number,y:number,r:number,phase:number}>} */
let stars = [];
function placeStars() {
  stars = [];
  const n = Math.round(params.starCount);
  for (let i = 0; i < n; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.65,
      r: Math.random() * 1.2 + 0.3,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

resize();

// --- ノイズ ---

/** @param {number} n */
function hash(n) {
  const x = Math.sin(n * 127.1) * 43758.5453123;
  return x - Math.floor(x);
}

/** @param {number} x */
function noise1d(x) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i);
  const b = hash(i + 1);
  const u = f * f * (3 - 2 * f);
  return a * (1 - u) + b * u;
}

// --- 描画 ---

let time = 0;

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#01030d');
  grad.addColorStop(0.6, '#05102a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawStars() {
  for (const s of stars) {
    const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.phase) * params.starTwinkle;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + 0.6 * tw})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAurora() {
  ctx.globalCompositeOperation = 'lighter';
  const layers = Math.max(1, Math.round(params.layers));
  for (let l = 0; l < layers; l++) {
    const t = l / Math.max(1, layers - 1);
    const hue = params.hueGreen + (params.huePurple - params.hueGreen) * t;
    const centerY = canvas.height * (0.3 + t * 0.15);
    const height = params.ribbonHeight * (0.6 + t * 0.6);
    const phaseOffset = l * 0.6 + time * params.flowSpeed;
    // 線形グラデーションの塗り
    for (let x = 0; x <= canvas.width; x += 3) {
      const n1 = noise1d((x + phaseOffset * 200) * params.waveFreq + l);
      const n2 = noise1d(
        (x + phaseOffset * 400) * params.waveFreq * 0.5 + l * 3,
      );
      const waveY =
        (n1 - 0.5) * params.waveAmp + (n2 - 0.5) * params.waveAmp * 0.6;
      const top = centerY + waveY;
      const bottom = top + height;
      const grad = ctx.createLinearGradient(0, top, 0, bottom);
      const alpha = params.intensity * (0.4 + 0.6 * n1);
      grad.addColorStop(0, `hsla(${hue}, ${params.saturation}%, 50%, 0)`);
      grad.addColorStop(
        0.4,
        `hsla(${hue}, ${params.saturation}%, 55%, ${alpha})`,
      );
      grad.addColorStop(1, `hsla(${hue + 20}, ${params.saturation}%, 40%, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x, top, 4, height);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

function drawGround() {
  const grad = ctx.createLinearGradient(
    0,
    canvas.height * 0.75,
    0,
    canvas.height,
  );
  grad.addColorStop(0, `rgba(2, 6, 20, ${params.groundDark})`);
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
}

function draw() {
  time += 1 / 60;
  drawSky();
  drawStars();
  drawAurora();
  drawGround();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Aurora Borealis',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'layers', 1, 10, 1);
gui.add(params, 'ribbonHeight', 60, 500, 5);
gui.add(params, 'waveAmp', 10, 200, 1);
gui.add(params, 'waveFreq', 0.001, 0.02, 0.0005);
gui.add(params, 'flowSpeed', 0, 2, 0.01);
gui.add(params, 'hueGreen', 80, 200, 1);
gui.add(params, 'huePurple', 240, 340, 1);
gui.add(params, 'saturation', 30, 100, 1);
gui.add(params, 'intensity', 0.1, 1.5, 0.01);
gui.add(params, 'starCount', 0, 400, 5).onChange(placeStars);
gui.add(params, 'starTwinkle', 0, 1, 0.01);
gui.add(params, 'groundDark', 0, 1, 0.01);

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
  params.layers = rand(3, 7, 1);
  params.ribbonHeight = rand(120, 350, 5);
  params.waveAmp = rand(30, 120, 1);
  params.waveFreq = rand(0.003, 0.012, 0.0005);
  params.flowSpeed = rand(0.2, 1, 0.01);
  params.hueGreen = rand(110, 170, 1);
  params.huePurple = rand(260, 320, 1);
  params.saturation = rand(70, 100, 1);
  params.intensity = rand(0.4, 1.1, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  placeStars();
  gui.updateDisplay();
});
