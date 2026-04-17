// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Steve Reich の phase music 風。複数のメトロノームが少しずつ位相をずらしながら叩く。
const params = {
  count: 8, // メトロノーム数
  baseBpm: 90,
  drift: 2.5, // BPM差の最大値
  lineLength: 520,
  amplitude: 280, // 振幅
  hueStart: 30,
  hueRange: 300,
  trailFade: 0.08,
  ballSize: 8,
  glow: 0.8,
  showLines: true,
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
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const n = Math.round(params.count);
  const rowH = params.lineLength / Math.max(1, n - 1);

  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const bpm = params.baseBpm + (t - 0.5) * 2 * params.drift;
    const freq = bpm / 60 / 2; // 半周期 = 1 拍
    const phase = time * freq * Math.PI;
    const x = cx + Math.sin(phase) * params.amplitude;
    const y = cy - params.lineLength / 2 + i * rowH;
    const hue = params.hueStart + t * params.hueRange;

    if (params.showLines) {
      ctx.strokeStyle = `hsla(${hue}, 60%, 40%, 0.3)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - params.amplitude, y);
      ctx.lineTo(cx + params.amplitude, y);
      ctx.stroke();
    }

    // 振動ボール
    ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${params.glow})`;
    ctx.beginPath();
    ctx.arc(x, y, params.ballSize, 0, Math.PI * 2);
    ctx.fill();
    // ハイライト
    ctx.fillStyle = `hsla(${hue}, 100%, 85%, 0.9)`;
    ctx.beginPath();
    ctx.arc(x - 1.5, y - 1.5, params.ballSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    // 拍を打つ瞬間の強調（端で折り返す時）
    const edge = Math.abs(Math.sin(phase));
    if (edge > 0.995) {
      ctx.strokeStyle = `hsla(${hue}, 100%, 75%, 0.8)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, params.ballSize + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Phase Shift Metronome',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 2, 20, 1);
gui.add(params, 'baseBpm', 40, 200, 1);
gui.add(params, 'drift', 0, 10, 0.1);
gui.add(params, 'lineLength', 100, 800, 1);
gui.add(params, 'amplitude', 60, 500, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'trailFade', 0, 0.3, 0.01);
gui.add(params, 'ballSize', 3, 20, 0.5);
gui.add(params, 'glow', 0.3, 1, 0.01);
gui.add(params, 'showLines');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.count = rand(5, 14, 1);
  params.baseBpm = rand(60, 140, 1);
  params.drift = rand(1, 6, 0.1);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
