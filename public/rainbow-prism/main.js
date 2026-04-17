// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  prismSize: 180, // プリズム三角形の一辺サイズ
  incidentAngle: 35, // 入射角（度）
  spectrumCount: 80, // スペクトル線本数
  spreadAngle: 22, // 分散広がり角（度）
  beamWidth: 6, // 入射光の太さ
  beamBright: 1.4, // 入射光の明るさ
  lineAlpha: 0.35, // スペクトル線のアルファ
  lineWidth: 1.4, // スペクトル線の太さ
  rotateSpeed: 0.2, // プリズム回転
  time: 0, // (内部)
  backglow: 0.15, // 背景の残光
  prismAlpha: 0.15, // プリズム本体の不透明度
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

// --- 描画 ---

let time = 0;

function drawBackground() {
  ctx.fillStyle = `rgba(5, 7, 10, ${1 - params.backglow})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * 正三角形のプリズム頂点を返す
 * @param {number} cx
 * @param {number} cy
 * @param {number} size 一辺
 * @param {number} rot 回転角（ラジアン）
 */
function triangleVerts(cx, cy, rot) {
  const r = params.prismSize / Math.sqrt(3); // 外接円半径
  /** @type {[number, number][]} */
  const verts = [];
  for (let i = 0; i < 3; i++) {
    const a = rot + (i / 3) * Math.PI * 2 - Math.PI / 2;
    verts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return verts;
}

function drawPrism() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const rot = time * params.rotateSpeed * 0.3;
  const verts = triangleVerts(cx, cy, rot);
  // 入射光
  const angRad = (params.incidentAngle * Math.PI) / 180 + rot;
  const beamLen = Math.max(canvas.width, canvas.height);
  const ix = cx - Math.cos(angRad) * beamLen;
  const iy = cy - Math.sin(angRad) * beamLen;
  // 入射光グラデーション
  const beamGrad = ctx.createLinearGradient(ix, iy, cx, cy);
  beamGrad.addColorStop(0, `rgba(255, 255, 255, 0)`);
  beamGrad.addColorStop(1, `rgba(255, 255, 255, ${params.beamBright})`);
  ctx.strokeStyle = beamGrad;
  ctx.lineWidth = params.beamWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ix, iy);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  // スペクトル線（分散）
  const spreadRad = (params.spreadAngle * Math.PI) / 180;
  const nLines = Math.max(2, Math.round(params.spectrumCount));
  ctx.lineWidth = params.lineWidth;
  for (let i = 0; i < nLines; i++) {
    const t = i / (nLines - 1);
    // 可視光近似: 380(紫) -> 700(赤) を hue 270 -> 0 にマッピング
    const hue = 270 - t * 270;
    // 波長で屈折角が変わる（紫ほど曲がる）
    const refractAngle = angRad + Math.PI - spreadRad * (t - 0.5) * 2;
    const ox = cx + Math.cos(refractAngle) * beamLen;
    const oy = cy + Math.sin(refractAngle) * beamLen;
    ctx.strokeStyle = `hsla(${hue}, 95%, 65%, ${params.lineAlpha})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ox, oy);
    ctx.stroke();
  }

  // プリズム本体（半透明）
  ctx.fillStyle = `rgba(220, 230, 255, ${params.prismAlpha})`;
  ctx.strokeStyle = `rgba(220, 230, 255, 0.6)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(verts[0][0], verts[0][1]);
  ctx.lineTo(verts[1][0], verts[1][1]);
  ctx.lineTo(verts[2][0], verts[2][1]);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function draw() {
  time += 1 / 60;
  drawBackground();
  drawPrism();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Rainbow Prism',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'prismSize', 60, 400, 2);
gui.add(params, 'incidentAngle', 0, 180, 1);
gui.add(params, 'spectrumCount', 10, 240, 2);
gui.add(params, 'spreadAngle', 2, 90, 0.5);
gui.add(params, 'beamWidth', 1, 20, 0.5);
gui.add(params, 'beamBright', 0.2, 2, 0.05);
gui.add(params, 'lineAlpha', 0.05, 1, 0.01);
gui.add(params, 'lineWidth', 0.25, 4, 0.05);
gui.add(params, 'rotateSpeed', -2, 2, 0.05);
gui.add(params, 'backglow', 0, 0.8, 0.01);
gui.add(params, 'prismAlpha', 0, 0.6, 0.01);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.prismSize = rand(120, 300, 2);
  params.incidentAngle = rand(0, 180, 1);
  params.spectrumCount = rand(40, 160, 2);
  params.spreadAngle = rand(10, 50, 0.5);
  params.beamWidth = rand(3, 12, 0.5);
  params.rotateSpeed = rand(-0.8, 0.8, 0.05);
  params.lineAlpha = rand(0.2, 0.6, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
