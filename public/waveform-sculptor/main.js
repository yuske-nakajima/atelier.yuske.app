// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  freqX: 3, // X 方向の基本周波数
  freqY: 2, // Y 方向の基本周波数
  harmonics: 4, // 重ね合わせる倍音の数
  phaseShift: 0.25, // 倍音ごとの位相差
  amplitudeDecay: 0.55, // 倍音振幅の減衰率
  rotation: 0, // 全体の回転（ラジアン）
  points: 2000, // サンプリング点数
  lineWidth: 1.2, // 線の太さ
  hueBase: 200, // 基本色相
  hueSpread: 60, // 色相の広がり
  timeScale: 0.4, // 時間の進行速度
  trailFade: 0.08, // 残像のフェード
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

function draw() {
  ctx.fillStyle = `rgba(5, 6, 13, ${Math.max(0.01, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const scale = Math.min(canvas.width, canvas.height) * 0.42;
  const n = Math.max(100, Math.round(params.points));
  const harm = Math.max(1, Math.round(params.harmonics));
  const cosR = Math.cos(params.rotation);
  const sinR = Math.sin(params.rotation);

  ctx.lineWidth = params.lineWidth;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    let x = 0;
    let y = 0;
    let amp = 1;
    let totalAmp = 0;
    for (let k = 1; k <= harm; k++) {
      const phase = params.phaseShift * k + time;
      x += amp * Math.sin(t * params.freqX * k + phase);
      y += amp * Math.sin(t * params.freqY * k + phase * 1.3);
      totalAmp += amp;
      amp *= params.amplitudeDecay;
    }
    x /= Math.max(0.0001, totalAmp);
    y /= Math.max(0.0001, totalAmp);
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;
    const px = cx + rx * scale;
    const py = cy + ry * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  const hue = params.hueBase + Math.sin(time * 0.6) * params.hueSpread;
  ctx.strokeStyle = `hsl(${hue}, 80%, 65%)`;
  ctx.stroke();
}

function tick() {
  time += params.timeScale / 60;
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Waveform Sculptor',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'freqX', 1, 12, 1);
gui.add(params, 'freqY', 1, 12, 1);
gui.add(params, 'harmonics', 1, 8, 1);
gui.add(params, 'phaseShift', 0, Math.PI * 2, 0.01);
gui.add(params, 'amplitudeDecay', 0.1, 0.95, 0.01);
gui.add(params, 'rotation', 0, Math.PI * 2, 0.01);
gui.add(params, 'points', 300, 5000, 100);
gui.add(params, 'lineWidth', 0.3, 4, 0.1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueSpread', 0, 180, 1);
gui.add(params, 'timeScale', -2, 2, 0.01);
gui.add(params, 'trailFade', 0.01, 0.4, 0.005);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.freqX = r(1, 9, 1);
  params.freqY = r(1, 9, 1);
  params.harmonics = r(2, 6, 1);
  params.phaseShift = r(0, Math.PI * 2, 0.01);
  params.amplitudeDecay = r(0.3, 0.8, 0.01);
  params.rotation = r(0, Math.PI * 2, 0.01);
  params.hueBase = r(0, 360, 1);
  params.timeScale = r(-1, 1, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
