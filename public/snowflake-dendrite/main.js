// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  arms: 6,
  steps: 300,
  stepSize: 3,
  branchProb: 0.05,
  wobble: 0.1,
  radius: 280,
  thickness: 1.5,
  hue: 210,
  saturation: 40,
  lightness: 85,
  bgLightness: 5,
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

let seed = 1;
function setSeed(n) {
  seed = n >>> 0 || 1;
}
function rnd() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) % 100000) / 100000;
}
let pageSeed = Math.floor(Math.random() * 1e9);

/**
 * 世代ごとに線幅が変わるため、世代別にセグメント配列を蓄積して
 * 最後に 1 本のパスとしてまとめて stroke する（描画コスト削減）。
 * @type {Map<number, number[]>}
 */
let segmentsByGen = new Map();

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} x0
 * @param {number} y0
 * @param {number} angle0
 * @param {number} stepsLeft
 * @param {number} gen
 */
function grow(cx, cy, x0, y0, angle0, stepsLeft, gen) {
  let x = x0;
  let y = y0;
  let angle = angle0;
  const arms = Math.round(params.arms);
  let bucket = segmentsByGen.get(gen);
  if (!bucket) {
    bucket = [];
    segmentsByGen.set(gen, bucket);
  }
  // 三角関数を事前計算
  const cosA = new Float64Array(arms);
  const sinA = new Float64Array(arms);
  for (let s = 0; s < arms; s++) {
    const a = (s / arms) * Math.PI * 2;
    cosA[s] = Math.cos(a);
    sinA[s] = Math.sin(a);
  }
  const radiusSq = params.radius * params.radius;
  for (let i = 0; i < stepsLeft; i++) {
    const nx = x + Math.cos(angle) * params.stepSize;
    const ny = y + Math.sin(angle) * params.stepSize;
    const dx = nx - cx;
    const dy = ny - cy;
    if (dx * dx + dy * dy > radiusSq) return;
    const ox = x - cx;
    const oy = y - cy;
    const onx = nx - cx;
    const ony = ny - cy;
    for (let s = 0; s < arms; s++) {
      const ca = cosA[s];
      const sa = sinA[s];
      // 回転
      bucket.push(
        ox * ca - oy * sa + cx,
        ox * sa + oy * ca + cy,
        onx * ca - ony * sa + cx,
        onx * sa + ony * ca + cy,
      );
      // 鏡面
      bucket.push(
        ox * ca + oy * sa + cx,
        ox * sa - oy * ca + cy,
        onx * ca + ony * sa + cx,
        onx * sa - ony * ca + cy,
      );
    }
    angle += (rnd() - 0.5) * params.wobble;
    x = nx;
    y = ny;
    if (gen < 3 && rnd() < params.branchProb) {
      grow(
        cx,
        cy,
        x,
        y,
        angle + Math.PI / 3,
        Math.floor(stepsLeft * 0.3),
        gen + 1,
      );
      grow(
        cx,
        cy,
        x,
        y,
        angle - Math.PI / 3,
        Math.floor(stepsLeft * 0.3),
        gen + 1,
      );
    }
  }
}

let drawScheduled = false;
function draw() {
  drawScheduled = false;
  ctx.fillStyle = `hsl(${params.hue}, 30%, ${params.bgLightness}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  setSeed(pageSeed);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.shadowBlur = params.glow * 12;
  ctx.shadowColor = `hsla(${params.hue}, ${params.saturation}%, 80%, 1)`;
  segmentsByGen = new Map();
  grow(cx, cy, cx, cy, 0, Math.round(params.steps), 0);
  // 世代ごとに 1 回だけ stroke することで shadowBlur のコストを最小化
  const gens = [...segmentsByGen.keys()].sort((a, b) => a - b);
  for (const gen of gens) {
    const seg = /** @type {number[]} */ (segmentsByGen.get(gen));
    ctx.lineWidth = Math.max(0.25, params.thickness / (gen + 1));
    ctx.beginPath();
    for (let i = 0; i < seg.length; i += 4) {
      ctx.moveTo(seg[i], seg[i + 1]);
      ctx.lineTo(seg[i + 2], seg[i + 3]);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}
draw();

function redraw() {
  if (drawScheduled) return;
  drawScheduled = true;
  requestAnimationFrame(draw);
}

const gui = new TileUI({
  title: 'Snowflake Dendrite',
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
  ['arms', 3, 12, 1],
  ['steps', 50, 800, 10],
  ['stepSize', 1, 10, 0.25],
  ['branchProb', 0, 0.3, 0.005],
  ['wobble', 0, 0.5, 0.01],
  ['radius', 80, 500, 2],
  ['thickness', 0.3, 4, 0.05],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 40, 100, 1],
  ['bgLightness', 0, 30, 1],
  ['glow', 0, 1, 0.01],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s).onChange(redraw);
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
  params.arms = rand(5, 8, 1);
  params.steps = rand(150, 500, 10);
  params.branchProb = rand(0.02, 0.15, 0.005);
  params.wobble = rand(0.05, 0.25, 0.01);
  params.hue = rand(150, 260, 1);
  pageSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  pageSeed = Math.floor(Math.random() * 1e9);
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
