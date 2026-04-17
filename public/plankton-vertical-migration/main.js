// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  count: 1200,
  dayNightSpeed: 0.3,
  migrationRange: 0.7,
  horizontalDrift: 0.5,
  size: 1.5,
  hue: 100,
  saturation: 70,
  lightness: 60,
  deepHue: 230,
  deepLight: 5,
  surfaceHue: 200,
  glow: 0.3,
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

/** @type {Array<{x:number,y:number,phase:number,hspeed:number,range:number}>} */
let plankton = [];

function reset() {
  plankton = [];
  const n = Math.round(params.count);
  for (let i = 0; i < n; i++) {
    plankton.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      phase: Math.random() * Math.PI * 2,
      hspeed: (Math.random() - 0.5) * params.horizontalDrift,
      range: 0.3 + Math.random() * 0.5,
    });
  }
}
reset();

let time = 0;

function draw() {
  // 深度グラデ
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  const cycle = 0.5 + 0.5 * Math.sin(time * params.dayNightSpeed);
  const surfaceL = 15 + cycle * 35;
  g.addColorStop(0, `hsl(${params.surfaceHue}, 60%, ${surfaceL}%)`);
  g.addColorStop(1, `hsl(${params.deepHue}, 70%, ${params.deepLight}%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  time += 1 / 60;
  ctx.shadowBlur = params.glow * 10;
  for (const p of plankton) {
    // 垂直回遊
    const targetDepth =
      (0.5 + 0.5 * -Math.sin(time * params.dayNightSpeed + p.phase * 0.2)) *
      params.migrationRange *
      p.range;
    p.y += (targetDepth * canvas.height + canvas.height * 0.15 - p.y) * 0.005;
    p.x += p.hspeed;
    if (p.x < 0) p.x += canvas.width;
    if (p.x > canvas.width) p.x -= canvas.width;
    const depthT = p.y / canvas.height;
    const light = params.lightness - depthT * 20;
    ctx.fillStyle = `hsl(${params.hue}, ${params.saturation}%, ${light}%)`;
    ctx.shadowColor = `hsl(${params.hue}, ${params.saturation}%, ${light + 10}%)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, params.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  requestAnimationFrame(draw);
}
draw();

const gui = new TileUI({
  title: 'Plankton Vertical Migration',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

/** @type {Array<[keyof typeof params, number, number, number]>} */
const ctrls = [
  ['count', 100, 5000, 50],
  ['dayNightSpeed', 0, 2, 0.01],
  ['migrationRange', 0, 1, 0.01],
  ['horizontalDrift', 0, 2, 0.01],
  ['size', 0.5, 6, 0.1],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 30, 90, 1],
  ['deepHue', 0, 360, 1],
  ['deepLight', 0, 30, 1],
  ['surfaceHue', 0, 360, 1],
  ['glow', 0, 1, 0.01],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s).onChange(() => {
    if (k === 'count' || k === 'horizontalDrift') reset();
  });
}

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

gui.addButton('Random', () => {
  params.count = rand(500, 3000, 50);
  params.dayNightSpeed = rand(0.1, 0.8, 0.01);
  params.migrationRange = rand(0.3, 1, 0.01);
  params.hue = rand(0, 360, 1);
  params.surfaceHue = rand(150, 250, 1);
  params.deepHue = rand(200, 280, 1);
  reset();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  gui.updateDisplay();
});
