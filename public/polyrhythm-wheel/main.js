// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  bpm: 90,
  division1: 3,
  division2: 4,
  division3: 5,
  division4: 7,
  showWheel4: true,
  radius: 280,
  gap: 50,
  hueStart: 40,
  hueStep: 80,
  pulseGlow: 0.9,
  trailFade: 0.15,
  ballSize: 8,
  lineAlpha: 0.4,
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

/** @type {Map<string, number>} */
const lastBeat = new Map();

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const barSec = 240 / params.bpm; // 1 小節 4 拍で 240/bpm 秒
  const tBar = (time % barSec) / barSec;

  const divs = [
    Math.round(params.division1),
    Math.round(params.division2),
    Math.round(params.division3),
  ];
  if (params.showWheel4) divs.push(Math.round(params.division4));

  for (let i = 0; i < divs.length; i++) {
    const n = Math.max(1, divs[i]);
    const rad = params.radius - i * params.gap;
    if (rad <= 4) continue;
    const hue = params.hueStart + i * params.hueStep;
    // 背景円
    ctx.strokeStyle = `hsla(${hue}, 60%, 45%, ${params.lineAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.stroke();
    // 拍点
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (k / n) * Math.PI * 2;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // 回転ボール
    const angle = -Math.PI / 2 + tBar * Math.PI * 2 * n;
    const bx = cx + Math.cos(angle) * rad;
    const by = cy + Math.sin(angle) * rad;
    ctx.fillStyle = `hsla(${hue}, 95%, 75%, 1)`;
    ctx.beginPath();
    ctx.arc(bx, by, params.ballSize, 0, Math.PI * 2);
    ctx.fill();
    // 拍打ち判定
    const currentBeat = Math.floor(tBar * n);
    const key = `${i}`;
    if (lastBeat.get(key) !== currentBeat) {
      lastBeat.set(key, currentBeat);
      const bangAngle = -Math.PI / 2 + (currentBeat / n) * Math.PI * 2;
      pulses.push({
        x: cx + Math.cos(bangAngle) * rad,
        y: cy + Math.sin(bangAngle) * rad,
        t: 0,
        hue,
      });
    }
  }

  pulses = pulses.filter((p) => p.t < 1);
  for (const p of pulses) {
    p.t += 0.04;
    ctx.strokeStyle = `hsla(${p.hue}, 100%, 75%, ${(1 - p.t) * params.pulseGlow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6 + p.t * 40, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Polyrhythm Wheel',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'bpm', 30, 200, 1);
gui.add(params, 'division1', 2, 16, 1);
gui.add(params, 'division2', 2, 16, 1);
gui.add(params, 'division3', 2, 16, 1);
gui.add(params, 'division4', 2, 16, 1);
gui.add(params, 'showWheel4');
gui.add(params, 'radius', 150, 400, 1);
gui.add(params, 'gap', 20, 80, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueStep', 20, 180, 1);
gui.add(params, 'trailFade', 0.05, 0.4, 0.01);
gui.add(params, 'ballSize', 4, 16, 0.5);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  const opts = [3, 4, 5, 6, 7, 8, 9, 11, 13];
  params.division1 = opts[Math.floor(Math.random() * opts.length)];
  params.division2 = opts[Math.floor(Math.random() * opts.length)];
  params.division3 = opts[Math.floor(Math.random() * opts.length)];
  params.division4 = opts[Math.floor(Math.random() * opts.length)];
  params.bpm = rand(60, 140, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueStep = rand(40, 150, 1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
