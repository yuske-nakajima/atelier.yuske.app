// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  ropes: 4,
  particlesPerRope: 300,
  twist: 1.3,
  radius: 160,
  length: 480,
  bStrength: 1.0,
  hueA: 30,
  hueB: 190,
  fade: 0.08,
  pulse: 0.5,
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

/** @type {{ropeIdx:number,t:number,phase:number}[]} */
let parts = [];
function reseed() {
  parts = [];
  const ropes = Math.max(1, params.ropes | 0);
  const perRope = Math.max(20, params.particlesPerRope | 0);
  for (let r = 0; r < ropes; r++) {
    for (let i = 0; i < perRope; i++) {
      parts.push({
        ropeIdx: r,
        t: i / perRope,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }
}
reseed();

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

let time = 0;
function tick() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11,10,7,${params.fade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2,
    cy = canvas.height / 2;
  const ropes = Math.max(1, params.ropes | 0);
  const L = params.length,
    R = params.radius;
  for (const p of parts) {
    const ropeAngle = (p.ropeIdx / ropes) * Math.PI * 2;
    const s = p.t;
    const y = (s - 0.5) * L;
    const twistAngle =
      ropeAngle +
      s * params.twist * Math.PI * 2 +
      time * params.bStrength * 0.3;
    const pulse = 1 + params.pulse * 0.3 * Math.sin(time * 2 + p.phase);
    const r = R * pulse * (1 - Math.abs(s - 0.5) * 0.5);
    const x = cx + Math.cos(twistAngle) * r;
    const py = cy + y;
    const depth = Math.sin(twistAngle);
    const t01 = (p.ropeIdx % 2) / 1;
    const hue = t01 > 0.5 ? params.hueA : params.hueB;
    ctx.fillStyle = `hsla(${hue}, 85%, ${45 + depth * 25}%, 0.9)`;
    const sz = 1.5 + depth * 0.8;
    ctx.fillRect(x, py, sz, sz);
  }
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'MHD',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'ropes', 1, 12, 1);
gui.add(params, 'particlesPerRope', 50, 1000, 10);
gui.add(params, 'twist', 0, 6, 0.01);
gui.add(params, 'radius', 40, 400, 1);
gui.add(params, 'length', 100, 900, 1);
gui.add(params, 'bStrength', 0, 3, 0.01);
gui.add(params, 'hueA', 0, 360, 1);
gui.add(params, 'hueB', 0, 360, 1);
gui.add(params, 'fade', 0, 0.3, 0.01);
gui.add(params, 'pulse', 0, 1.5, 0.01);
gui.addButton('Random', () => {
  params.ropes = rand(2, 8, 1);
  params.twist = rand(0.5, 3, 0.01);
  params.radius = rand(80, 280, 1);
  params.length = rand(200, 700, 1);
  params.bStrength = rand(0.3, 2, 0.01);
  params.hueA = rand(0, 360, 1);
  params.hueB = rand(0, 360, 1);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
