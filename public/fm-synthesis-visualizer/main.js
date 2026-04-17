// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// y(t) = sin( carrier*t + I * sin( modulator*t ) ) をリサージュ風に 2D プロット
const params = {
  carrier: 3,
  modulator: 2,
  index: 3.2,
  ratioY: 2,
  modulatorY: 5,
  indexY: 2.4,
  samples: 2000,
  scale: 320,
  hueStart: 200,
  hueRange: 160,
  strokeAlpha: 0.45,
  lineWidth: 1.2,
  autoMorph: true,
  morphSpeed: 0.2,
  trailFade: 0.08,
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

  const idx = params.autoMorph
    ? params.index + Math.sin(time * params.morphSpeed) * 1.5
    : params.index;
  const idy = params.autoMorph
    ? params.indexY + Math.cos(time * params.morphSpeed * 0.8) * 1.5
    : params.indexY;

  ctx.beginPath();
  const n = Math.round(params.samples);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = Math.sin(
      params.carrier * t + idx * Math.sin(params.modulator * t),
    );
    const y = Math.sin(
      params.ratioY * t + idy * Math.sin(params.modulatorY * t + time * 0.5),
    );
    const sx = cx + x * params.scale;
    const sy = cy + y * params.scale;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  const hue = params.hueStart + Math.sin(time * 0.3) * params.hueRange * 0.5;
  ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${params.strokeAlpha})`;
  ctx.lineWidth = params.lineWidth;
  ctx.stroke();

  // 色違いでもう一重
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 + time * 0.1;
    const x = Math.sin(
      params.carrier * t + idx * Math.sin(params.modulator * t),
    );
    const y = Math.sin(
      params.ratioY * t + idy * Math.sin(params.modulatorY * t),
    );
    const sx = cx + x * params.scale;
    const sy = cy + y * params.scale;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = `hsla(${(hue + params.hueRange * 0.5) % 360}, 90%, 65%, ${params.strokeAlpha * 0.6})`;
  ctx.stroke();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'FM Synthesis Visualizer',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'carrier', 1, 10, 1);
gui.add(params, 'modulator', 1, 10, 1);
gui.add(params, 'index', 0, 8, 0.05);
gui.add(params, 'ratioY', 1, 10, 1);
gui.add(params, 'modulatorY', 1, 10, 1);
gui.add(params, 'indexY', 0, 8, 0.05);
gui.add(params, 'samples', 300, 4000, 50);
gui.add(params, 'scale', 80, 500, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'strokeAlpha', 0.1, 1, 0.01);
gui.add(params, 'lineWidth', 0.3, 3, 0.1);
gui.add(params, 'autoMorph');
gui.add(params, 'morphSpeed', 0, 1, 0.01);
gui.add(params, 'trailFade', 0.02, 0.3, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.carrier = rand(1, 7, 1);
  params.modulator = rand(1, 7, 1);
  params.ratioY = rand(1, 7, 1);
  params.modulatorY = rand(1, 7, 1);
  params.index = rand(0.5, 5, 0.05);
  params.indexY = rand(0.5, 5, 0.05);
  params.hueStart = rand(0, 360, 1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
