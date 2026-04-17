// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// Risset のリズム錯覚: 複数層が加速しつつ音量が徐々にフェードする。見かけ上無限に加速していく。
const params = {
  layers: 6,
  baseBpm: 60,
  rampSeconds: 10, // 1 オクターブ分加速するのにかかる時間
  radius: 260,
  hueStart: 180,
  hueRange: 200,
  ballSize: 10,
  ringWidth: 2,
  trailFade: 0.15,
  glow: 0.7,
  showSpiral: true,
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
/** @type {{x:number,y:number,t:number,hue:number}[]} */
let pulses = [];
/** @type {number[]} */
let lastBeatPerLayer = [];

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const n = Math.round(params.layers);

  for (let i = 0; i < n; i++) {
    // 各レイヤーは位相 (time + i * rampSeconds / n) / rampSeconds で 0→1 のオクターブランプ
    const phase =
      ((time + (i * params.rampSeconds) / n) % params.rampSeconds) /
      params.rampSeconds;
    const mult = 2 ** phase; // BPM 倍率 1→2→1
    const bpm = params.baseBpm * mult;
    const beats = (time * bpm) / 60;
    const beatIdx = Math.floor(beats);
    const beatFrac = beats - beatIdx;
    const envelope = Math.sin(phase * Math.PI);
    const rad = params.radius * (1 - phase * 0.7);
    const hue = params.hueStart + phase * params.hueRange;
    const angle = -Math.PI / 2 + beatFrac * Math.PI * 2;
    if (lastBeatPerLayer[i] !== beatIdx) {
      lastBeatPerLayer[i] = beatIdx;
      pulses.push({
        x: cx + Math.cos(-Math.PI / 2) * rad,
        y: cy + Math.sin(-Math.PI / 2) * rad,
        t: 0,
        hue,
      });
    }
    // スパイラル軌道
    if (params.showSpiral) {
      ctx.strokeStyle = `hsla(${hue}, 60%, 55%, ${0.15 + envelope * 0.35})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
    const bx = cx + Math.cos(angle) * rad;
    const by = cy + Math.sin(angle) * rad;
    ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${envelope * params.glow})`;
    ctx.beginPath();
    ctx.arc(bx, by, params.ballSize * envelope + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  pulses = pulses.filter((p) => p.t < 1);
  for (const p of pulses) {
    p.t += 0.05;
    ctx.strokeStyle = `hsla(${p.hue}, 100%, 80%, ${(1 - p.t) * params.glow})`;
    ctx.lineWidth = params.ringWidth;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4 + p.t * 50, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Risset Rhythm',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'layers', 2, 12, 1);
gui.add(params, 'baseBpm', 20, 120, 1);
gui.add(params, 'rampSeconds', 3, 30, 0.5);
gui.add(params, 'radius', 120, 400, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'ballSize', 4, 20, 0.5);
gui.add(params, 'ringWidth', 0.5, 5, 0.1);
gui.add(params, 'trailFade', 0.05, 0.3, 0.01);
gui.add(params, 'glow', 0.2, 1, 0.01);
gui.add(params, 'showSpiral');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.layers = rand(4, 10, 1);
  params.baseBpm = rand(40, 100, 1);
  params.rampSeconds = rand(6, 20, 0.5);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  lastBeatPerLayer = [];
  gui.updateDisplay();
});
