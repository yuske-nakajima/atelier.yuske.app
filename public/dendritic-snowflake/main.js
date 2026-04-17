// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  arms: 6, // 対称軸本数
  depth: 7, // 再帰深さ
  sideBranches: 4, // 側枝の数
  sideAngle: 60, // 側枝の角度（度）
  lengthRatio: 0.48, // 側枝の長さ比
  initialLength: 220, // 主軸の長さ
  thickness: 3, // 線の太さ
  hue: 200, // 色相
  saturation: 60, // 彩度
  glow: 0.4, // 発光
  rotation: 0, // 全体回転（度）
  scale: 1, // 全体スケール
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

// セグメント数の暴発を防ぐ上限（パラメータ次第で 8^depth まで増えるため）
const MAX_SEGMENTS = 200000;
/** @type {Map<number, number[]>} */
let segmentsByDepth = new Map();
let segmentCount = 0;

/**
 * @param {number} x
 * @param {number} y
 * @param {number} angle
 * @param {number} length
 * @param {number} depthLeft
 */
function drawArm(x, y, angle, length, depthLeft) {
  if (depthLeft <= 0 || length < 1) return;
  if (segmentCount >= MAX_SEGMENTS) return;
  const nx = x + Math.cos(angle) * length;
  const ny = y + Math.sin(angle) * length;
  let bucket = segmentsByDepth.get(depthLeft);
  if (!bucket) {
    bucket = [];
    segmentsByDepth.set(depthLeft, bucket);
  }
  bucket.push(x, y, nx, ny);
  segmentCount++;

  const sides = Math.round(params.sideBranches);
  const sa = (params.sideAngle * Math.PI) / 180;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  for (let i = 1; i <= sides; i++) {
    const f = i / (sides + 1);
    const bx = x + cosA * length * f;
    const by = y + sinA * length * f;
    drawArm(bx, by, angle + sa, length * params.lengthRatio, depthLeft - 1);
    drawArm(bx, by, angle - sa, length * params.lengthRatio, depthLeft - 1);
  }
}

function draw() {
  ctx.fillStyle = '#020308';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = params.glow * 12;
  ctx.shadowColor = `hsla(${params.hue}, ${params.saturation}%, 80%, 1)`;
  ctx.lineCap = 'round';
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const arms = Math.max(3, Math.round(params.arms));
  const rot = (params.rotation * Math.PI) / 180;
  segmentsByDepth = new Map();
  segmentCount = 0;
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2 + rot;
    drawArm(
      cx,
      cy,
      a,
      params.initialLength * params.scale,
      Math.round(params.depth),
    );
  }
  // 深さバケットごとに 1 回 stroke することで shadowBlur のコストを最小化
  const depths = [...segmentsByDepth.keys()].sort((a, b) => b - a);
  for (const d of depths) {
    const seg = /** @type {number[]} */ (segmentsByDepth.get(d));
    const t = d / params.depth;
    ctx.strokeStyle = `hsla(${params.hue}, ${params.saturation}%, ${70 + t * 20}%, 0.9)`;
    ctx.lineWidth = Math.max(0.25, params.thickness * t);
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

let drawScheduled = false;
function redraw() {
  if (drawScheduled) return;
  drawScheduled = true;
  requestAnimationFrame(() => {
    drawScheduled = false;
    draw();
  });
}

const gui = new TileUI({
  title: 'Dendritic Snowflake',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

const ctrls = [
  ['arms', 3, 12, 1],
  ['depth', 2, 9, 1],
  ['sideBranches', 1, 8, 1],
  ['sideAngle', 15, 90, 1],
  ['lengthRatio', 0.2, 0.8, 0.01],
  ['initialLength', 60, 360, 1],
  ['thickness', 0.5, 8, 0.25],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['glow', 0, 1, 0.01],
  ['rotation', 0, 360, 1],
  ['scale', 0.3, 1.5, 0.01],
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
  params.arms = rand(4, 10, 1);
  params.depth = rand(3, 8, 1);
  params.sideBranches = rand(2, 6, 1);
  params.sideAngle = rand(30, 80, 1);
  params.lengthRatio = rand(0.3, 0.65, 0.01);
  params.hue = rand(0, 360, 1);
  params.saturation = rand(30, 90, 1);
  params.rotation = rand(0, 360, 1);
  gui.updateDisplay();
  redraw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  redraw();
});

window.addEventListener('resize', redraw);
