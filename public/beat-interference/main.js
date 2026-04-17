// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 周波数の近い 2 つのサイン波の重ね合わせでうなり（beat）を視覚化
const params = {
  freqA: 4,
  freqB: 4.3,
  freqC: 0,
  amplitudeA: 80,
  amplitudeB: 80,
  amplitudeC: 0,
  waveSpeed: 1.2,
  lineDensity: 3, // 1px あたりのサンプル数
  hueA: 200,
  hueB: 40,
  hueC: 280,
  sumHue: 120,
  glow: 0.7,
  showEnvelope: true,
  lineWidth: 1.2,
  trailFade: 0.15,
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

function waveY(phase, freq, amp) {
  return Math.sin(phase * freq) * amp;
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const W = canvas.width;
  const H = canvas.height;
  const baseY = H * 0.3;
  const midY = H * 0.62;

  const xs = Math.max(1, Math.round(params.lineDensity));
  // 各波を上に並べる
  const waves = [
    { f: params.freqA, a: params.amplitudeA, hue: params.hueA, y: baseY },
    { f: params.freqB, a: params.amplitudeB, hue: params.hueB, y: baseY + 100 },
    { f: params.freqC, a: params.amplitudeC, hue: params.hueC, y: baseY + 200 },
  ];
  for (const w of waves) {
    ctx.strokeStyle = `hsla(${w.hue}, 80%, 65%, 0.85)`;
    ctx.lineWidth = params.lineWidth;
    ctx.beginPath();
    for (let x = 0; x <= W; x += xs) {
      const phase = (x / W) * Math.PI * 2 + time * params.waveSpeed;
      const y = w.y + waveY(phase, w.f, w.a);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 合成波（+エンベロープ）
  ctx.strokeStyle = `hsla(${params.sumHue}, 90%, 70%, ${params.glow})`;
  ctx.lineWidth = params.lineWidth + 0.6;
  ctx.beginPath();
  for (let x = 0; x <= W; x += xs) {
    const phase = (x / W) * Math.PI * 2 + time * params.waveSpeed;
    const y =
      midY +
      waveY(phase, params.freqA, params.amplitudeA) +
      waveY(phase, params.freqB, params.amplitudeB) +
      waveY(phase, params.freqC, params.amplitudeC);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // エンベロープ
  if (params.showEnvelope) {
    const beatFreq = Math.abs(params.freqA - params.freqB);
    const beatAmp = Math.min(params.amplitudeA, params.amplitudeB) * 2;
    ctx.strokeStyle = `hsla(${params.sumHue + 30}, 90%, 80%, 0.5)`;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let x = 0; x <= W; x += xs) {
      const phase = (x / W) * Math.PI * 2 + time * params.waveSpeed;
      const env = beatAmp * Math.abs(Math.cos(phase * beatFreq * 0.5));
      if (x === 0) {
        ctx.moveTo(x, midY + env);
      } else ctx.lineTo(x, midY + env);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let x = 0; x <= W; x += xs) {
      const phase = (x / W) * Math.PI * 2 + time * params.waveSpeed;
      const env = beatAmp * Math.abs(Math.cos(phase * beatFreq * 0.5));
      if (x === 0) ctx.moveTo(x, midY - env);
      else ctx.lineTo(x, midY - env);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Beat Interference',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'freqA', 0.5, 20, 0.05);
gui.add(params, 'freqB', 0.5, 20, 0.05);
gui.add(params, 'freqC', 0, 20, 0.05);
gui.add(params, 'amplitudeA', 10, 200, 1);
gui.add(params, 'amplitudeB', 10, 200, 1);
gui.add(params, 'amplitudeC', 0, 200, 1);
gui.add(params, 'waveSpeed', 0, 3, 0.01);
gui.add(params, 'hueA', 0, 360, 1);
gui.add(params, 'hueB', 0, 360, 1);
gui.add(params, 'hueC', 0, 360, 1);
gui.add(params, 'sumHue', 0, 360, 1);
gui.add(params, 'glow', 0.2, 1, 0.01);
gui.add(params, 'showEnvelope');
gui.add(params, 'lineWidth', 0.3, 3, 0.1);
gui.add(params, 'trailFade', 0.05, 0.5, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  const f = rand(2, 8, 0.05);
  params.freqA = f;
  params.freqB = f + rand(-0.5, 0.5, 0.01);
  params.freqC = f * 2 + rand(-0.3, 0.3, 0.01);
  params.hueA = rand(0, 360, 1);
  params.hueB = (params.hueA + 180) % 360;
  params.hueC = rand(0, 360, 1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
