// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  walkers: 40,
  stepSize: 3,
  trailLength: 400,
  drift: 0.0,
  bias: 0.0,
  hueStart: 180,
  hueRange: 180,
  fade: 0.02,
  lineWidth: 1.2,
  jitter: 1.0,
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

/** @type {{pts:{x:number,y:number}[], hue:number}[]} */
let walkers = [];
function reseed() {
  walkers = [];
  const n = Math.max(1, params.walkers | 0);
  for (let i = 0; i < n; i++) {
    walkers.push({
      pts: [
        {
          x: canvas.width / 2 + (Math.random() - 0.5) * 40,
          y: canvas.height / 2 + (Math.random() - 0.5) * 40,
        },
      ],
      hue: params.hueStart + (i / n) * params.hueRange,
    });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

function tick() {
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const w of walkers) {
    const head = w.pts[w.pts.length - 1];
    const nx =
      head.x +
      (Math.random() - 0.5) * 2 * params.stepSize * params.jitter +
      params.bias;
    const ny =
      head.y +
      (Math.random() - 0.5) * 2 * params.stepSize * params.jitter +
      params.drift;
    w.pts.push({ x: nx, y: ny });
    if (w.pts.length > params.trailLength) w.pts.shift();
    ctx.strokeStyle = `hsla(${w.hue}, 80%, 60%, 0.7)`;
    ctx.lineWidth = params.lineWidth;
    ctx.beginPath();
    for (let i = 0; i < w.pts.length; i++) {
      const p = w.pts[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    // 端で反射
    if (
      head.x < 0 ||
      head.x > canvas.width ||
      head.y < 0 ||
      head.y > canvas.height
    ) {
      w.pts = [{ x: canvas.width / 2, y: canvas.height / 2 }];
    }
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Brownian',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'walkers', 1, 200, 1);
gui.add(params, 'stepSize', 0.5, 10, 0.1);
gui.add(params, 'trailLength', 30, 2000, 10);
gui.add(params, 'drift', -2, 2, 0.01);
gui.add(params, 'bias', -2, 2, 0.01);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 720, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.add(params, 'lineWidth', 0.3, 4, 0.1);
gui.add(params, 'jitter', 0.1, 3, 0.01);
gui.addButton('Random', () => {
  params.walkers = rand(10, 100, 1);
  params.stepSize = rand(1, 6, 0.1);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 360, 1);
  params.drift = rand(-1, 1, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
