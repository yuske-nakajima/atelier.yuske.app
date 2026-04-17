// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  layers: 6, // 砂丘レイヤー数
  amplitude: 90, // 丘の高さ
  frequency: 0.004, // 波の細かさ
  windSpeed: 0.3, // 風（横方向スクロール）速度
  crestSharpness: 1.4, // 稜線の鋭さ
  hueBase: 32, // ベース色相
  hueShift: 8, // レイヤー間色相差
  satBase: 55, // 彩度
  lightBase: 62, // 明度（手前）
  lightBack: 28, // 明度（奥）
  haze: 0.12, // ヘイズ（霞）強度
  grain: 0.35, // 砂粒ノイズ
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

// --- 値ノイズ（疑似 Perlin） ---

/**
 * ハッシュ化で 0..1 の擬似乱数
 * @param {number} n
 */
function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * 1D スムーズノイズ
 * @param {number} x
 */
function noise1d(x) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i);
  const b = hash(i + 1);
  const u = f * f * (3 - 2 * f);
  return a * (1 - u) + b * u;
}

/**
 * フラクタル和
 * @param {number} x
 * @param {number} seed
 */
function fbm(x, seed) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < 4; i++) {
    sum += amp * noise1d(x * freq + seed * 13);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// --- 描画 ---

let time = 0;

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
  grad.addColorStop(0, `hsl(${(params.hueBase + 180) % 360}, 35%, 18%)`);
  grad.addColorStop(1, `hsl(${params.hueBase}, 40%, 40%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawDunes() {
  const layers = Math.max(1, Math.round(params.layers));
  for (let l = 0; l < layers; l++) {
    const depth = l / Math.max(1, layers - 1); // 0: 奥, 1: 手前
    const baseY = canvas.height * (0.35 + depth * 0.55);
    const amp = params.amplitude * (0.5 + depth * 0.8);
    const freq = params.frequency / (1 + depth * 0.6);
    const scroll = time * params.windSpeed * 30 * (1 - depth * 0.6);
    const light =
      params.lightBack + (params.lightBase - params.lightBack) * depth;
    const hue = params.hueBase + l * params.hueShift;
    ctx.fillStyle = `hsl(${hue}, ${params.satBase}%, ${light}%)`;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 4) {
      const n = fbm((x + scroll) * freq, l + 1);
      // 稜線を鋭くする
      const sharp = n ** params.crestSharpness;
      const y = baseY - amp * (sharp * 2 - 1) * 0.5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // ヘイズを奥ほど強く
    ctx.fillStyle = `hsla(${params.hueBase}, 30%, 80%, ${params.haze * (1 - depth)})`;
    ctx.fillRect(0, baseY - amp, canvas.width, amp * 2);
  }
}

function drawGrain() {
  if (params.grain <= 0) return;
  const count = Math.floor(
    canvas.width * canvas.height * 0.00015 * params.grain,
  );
  for (let i = 0; i < count; i++) {
    const x = Math.random() * canvas.width;
    const y = canvas.height * (0.5 + Math.random() * 0.5);
    ctx.fillStyle = `hsla(${params.hueBase + 20}, 50%, 80%, ${Math.random() * 0.6})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

function draw() {
  time += 1 / 60;
  drawSky();
  drawDunes();
  drawGrain();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Sand Dune',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'layers', 2, 10, 1);
gui.add(params, 'amplitude', 20, 200, 1);
gui.add(params, 'frequency', 0.0005, 0.02, 0.0005);
gui.add(params, 'windSpeed', 0, 2, 0.01);
gui.add(params, 'crestSharpness', 0.5, 3, 0.05);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueShift', -20, 20, 1);
gui.add(params, 'satBase', 0, 100, 1);
gui.add(params, 'lightBase', 30, 90, 1);
gui.add(params, 'lightBack', 5, 60, 1);
gui.add(params, 'haze', 0, 0.5, 0.01);
gui.add(params, 'grain', 0, 1, 0.01);

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
  params.layers = rand(4, 8, 1);
  params.amplitude = rand(40, 140, 1);
  params.frequency = rand(0.002, 0.01, 0.0005);
  params.windSpeed = rand(0.1, 1, 0.01);
  params.crestSharpness = rand(0.8, 2.2, 0.05);
  params.hueBase = rand(15, 45, 1);
  params.hueShift = rand(-10, 10, 1);
  params.satBase = rand(35, 75, 1);
  params.haze = rand(0.05, 0.25, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
