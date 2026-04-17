// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  rowStep: 6, // サンプリング行間隔（小さいほど高精細）
  waveAmp: 18, // 揺らぎ振幅
  waveFreq: 0.02, // 揺らぎの空間周波数
  waveSpeed: 1.2, // 揺らぎの時間速度
  heatHorizon: 0.55, // 地平線位置（0..1）
  heatIntensity: 1.0, // 熱波の強さ
  skyHueTop: 26, // 空上部色相
  skyHueBottom: 40, // 空下部色相
  sandHue: 35, // 砂色相
  sunRadius: 90, // 太陽半径
  sunBright: 1.4, // 太陽の明るさ
  layerCount: 3, // 熱波レイヤー数
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

// オフスクリーン（歪ませる前の元画像）
const off = document.createElement('canvas');
const offCtx = /** @type {CanvasRenderingContext2D} */ (off.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  off.width = canvas.width;
  off.height = canvas.height;
}

window.addEventListener('resize', resize);
resize();

// --- 描画 ---

let time = 0;

/**
 * 元画像（砂漠と太陽）をオフスクリーンに描画
 */
function drawScene() {
  const w = off.width;
  const h = off.height;
  const horizon = h * params.heatHorizon;
  // 空
  const skyGrad = offCtx.createLinearGradient(0, 0, 0, horizon);
  skyGrad.addColorStop(0, `hsl(${params.skyHueTop}, 75%, 30%)`);
  skyGrad.addColorStop(1, `hsl(${params.skyHueBottom}, 85%, 65%)`);
  offCtx.fillStyle = skyGrad;
  offCtx.fillRect(0, 0, w, horizon);

  // 太陽
  const sunX = w * 0.5;
  const sunY = horizon - params.sunRadius * 0.3;
  const sunGrad = offCtx.createRadialGradient(
    sunX,
    sunY,
    0,
    sunX,
    sunY,
    params.sunRadius,
  );
  sunGrad.addColorStop(0, `hsla(50, 100%, 85%, ${params.sunBright})`);
  sunGrad.addColorStop(0.5, `hsla(35, 100%, 70%, ${params.sunBright * 0.7})`);
  sunGrad.addColorStop(1, `hsla(20, 95%, 55%, 0)`);
  offCtx.fillStyle = sunGrad;
  offCtx.beginPath();
  offCtx.arc(sunX, sunY, params.sunRadius, 0, Math.PI * 2);
  offCtx.fill();

  // 砂漠
  const sandGrad = offCtx.createLinearGradient(0, horizon, 0, h);
  sandGrad.addColorStop(0, `hsl(${params.sandHue}, 80%, 60%)`);
  sandGrad.addColorStop(1, `hsl(${params.sandHue - 8}, 70%, 25%)`);
  offCtx.fillStyle = sandGrad;
  offCtx.fillRect(0, horizon, w, h - horizon);

  // 砂漠のライン
  offCtx.strokeStyle = `hsla(${params.sandHue + 10}, 60%, 40%, 0.35)`;
  offCtx.lineWidth = 1;
  for (let y = horizon + 10; y < h; y += 14) {
    offCtx.beginPath();
    offCtx.moveTo(0, y);
    offCtx.lineTo(w, y);
    offCtx.stroke();
  }
}

/**
 * 熱揺らぎを適用して描画
 */
function drawMirage() {
  const w = canvas.width;
  const h = canvas.height;
  const horizon = h * params.heatHorizon;
  const rowStep = Math.max(1, Math.round(params.rowStep));

  // 地平線より上（空と太陽）は素直に
  ctx.drawImage(off, 0, 0, w, horizon, 0, 0, w, horizon);

  // 地平線付近から下は行単位で横ずらし
  for (let y = horizon; y < h; y += rowStep) {
    // 地平線から遠いほど揺らぎが強く、奥ほど弱く
    const distance = (y - horizon) / Math.max(1, h - horizon);
    const heatAt =
      params.heatIntensity * (0.3 + Math.sin(distance * Math.PI) * 0.7);
    let offsetX = 0;
    for (let l = 0; l < params.layerCount; l++) {
      const freq = params.waveFreq * (1 + l * 0.6);
      const phase = time * params.waveSpeed * (1 + l * 0.5);
      offsetX +=
        Math.sin(y * freq + phase + l * 1.7) *
        params.waveAmp *
        heatAt *
        (1 / (l + 1));
    }
    // 横反射もあわせて（水面のような歪み）
    const srcY = y;
    ctx.drawImage(off, 0, srcY, w, rowStep, offsetX, y, w, rowStep);
  }

  // 地平線に光るライン（熱気）
  const horizonGrad = ctx.createLinearGradient(
    0,
    horizon - 10,
    0,
    horizon + 10,
  );
  horizonGrad.addColorStop(0, 'rgba(255, 240, 200, 0)');
  horizonGrad.addColorStop(0.5, 'rgba(255, 240, 200, 0.5)');
  horizonGrad.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = horizonGrad;
  ctx.fillRect(0, horizon - 10, w, 20);
}

function draw() {
  time += 1 / 60;
  drawScene();
  drawMirage();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Mirage Heat',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'rowStep', 1, 20, 1);
gui.add(params, 'waveAmp', 0, 80, 1);
gui.add(params, 'waveFreq', 0.005, 0.1, 0.001);
gui.add(params, 'waveSpeed', 0, 4, 0.05);
gui.add(params, 'heatHorizon', 0.2, 0.85, 0.01);
gui.add(params, 'heatIntensity', 0, 3, 0.05);
gui.add(params, 'skyHueTop', 0, 60, 1);
gui.add(params, 'skyHueBottom', 0, 60, 1);
gui.add(params, 'sandHue', 10, 60, 1);
gui.add(params, 'sunRadius', 20, 200, 2);
gui.add(params, 'sunBright', 0.5, 2, 0.05);
gui.add(params, 'layerCount', 1, 5, 1);

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
  params.waveAmp = rand(8, 35, 1);
  params.waveFreq = rand(0.01, 0.05, 0.001);
  params.waveSpeed = rand(0.5, 2.5, 0.05);
  params.heatHorizon = rand(0.4, 0.7, 0.01);
  params.heatIntensity = rand(0.6, 1.8, 0.05);
  params.skyHueTop = rand(10, 40, 1);
  params.skyHueBottom = rand(25, 55, 1);
  params.sandHue = rand(25, 45, 1);
  params.sunRadius = rand(60, 160, 2);
  params.layerCount = rand(2, 4, 1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
