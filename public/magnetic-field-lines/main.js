// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  poleCount: 4, // 磁極の総数
  lineDensity: 40, // 各磁極から出る磁力線の本数
  stepSize: 4, // 積分ステップ長
  maxSteps: 500, // 磁力線の最大ステップ数
  fieldStrength: 1, // 磁場の強さ
  lineWidth: 1.2, // 線の太さ
  hueNorth: 0, // N 極側の色相
  hueSouth: 220, // S 極側の色相
  glow: 10, // グロー強度
  trailFade: 0.08, // 残像フェード（0 で軌跡残し）
  showPoles: true, // 磁極マーカー表示
  animate: true, // 磁極ゆらぎ
  driftSpeed: 0.2, // ゆらぎ速度
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** @type {{x: number, y: number, charge: number, baseX: number, baseY: number, phase: number}[]} */
let poles = [];

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clearCanvas();
}

function clearCanvas() {
  ctx.fillStyle = '#06060a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resize);
resize();

function initPoles() {
  const n = Math.max(2, Math.round(params.poleCount));
  poles = [];
  for (let i = 0; i < n; i++) {
    const bx = canvas.width * (0.2 + Math.random() * 0.6);
    const by = canvas.height * (0.2 + Math.random() * 0.6);
    poles.push({
      x: bx,
      y: by,
      baseX: bx,
      baseY: by,
      charge: i % 2 === 0 ? 1 : -1,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

initPoles();

// --- 磁場ベクトル ---

/**
 * 磁場ベクトルを計算
 * @param {number} x
 * @param {number} y
 */
function field(x, y) {
  let fx = 0;
  let fy = 0;
  for (const p of poles) {
    const dx = x - p.x;
    const dy = y - p.y;
    const r2 = dx * dx + dy * dy + 1;
    const r = Math.sqrt(r2);
    const k = (p.charge * params.fieldStrength * 8000) / (r2 * r);
    fx += dx * k;
    fy += dy * k;
  }
  return { fx, fy };
}

/**
 * 1 本の磁力線を N 極から追跡して描画
 * @param {{x: number, y: number, charge: number}} pole
 * @param {number} angle
 */
function traceLine(pole, angle) {
  const startR = 6;
  let x = pole.x + Math.cos(angle) * startR;
  let y = pole.y + Math.sin(angle) * startR;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < params.maxSteps; i++) {
    const { fx, fy } = field(x, y);
    const mag = Math.hypot(fx, fy) || 1;
    const nx = x + (fx / mag) * params.stepSize * pole.charge;
    const ny = y + (fy / mag) * params.stepSize * pole.charge;
    if (nx < 0 || nx > canvas.width || ny < 0 || ny > canvas.height) break;
    // 他極へ到達したら終了
    let hit = false;
    for (const p of poles) {
      if (p === pole) continue;
      if ((p.x - nx) ** 2 + (p.y - ny) ** 2 < 36) {
        hit = true;
        break;
      }
    }
    ctx.lineTo(nx, ny);
    x = nx;
    y = ny;
    if (hit) break;
  }
  ctx.stroke();
}

// --- 描画 ---

let time = 0;

function step() {
  time += 1 / 60;
  if (params.animate) {
    for (const p of poles) {
      p.x = p.baseX + Math.sin(time * params.driftSpeed + p.phase) * 60;
      p.y = p.baseY + Math.cos(time * params.driftSpeed * 0.8 + p.phase) * 60;
    }
  }
  ctx.fillStyle = `rgba(6, 6, 10, ${Math.max(0, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;
  const lines = Math.max(4, Math.round(params.lineDensity));
  for (const p of poles) {
    const hue = p.charge > 0 ? params.hueNorth : params.hueSouth;
    const stroke = `hsl(${hue}, 85%, 62%)`;
    ctx.strokeStyle = stroke;
    ctx.shadowColor = stroke;
    if (p.charge > 0) {
      for (let i = 0; i < lines; i++) {
        traceLine(p, (i / lines) * Math.PI * 2);
      }
    }
  }
  ctx.shadowBlur = 0;
  if (params.showPoles) drawPoles();
}

function drawPoles() {
  for (const p of poles) {
    const color =
      p.charge > 0
        ? `hsl(${params.hueNorth}, 90%, 60%)`
        : `hsl(${params.hueSouth}, 90%, 60%)`;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '0.75rem sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.charge > 0 ? 'N' : 'S', p.x, p.y);
  }
}

function tick() {
  step();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Magnetic Field Lines',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'poleCount', 2, 10, 1).onChange(initPoles);
gui.add(params, 'lineDensity', 4, 120, 1);
gui.add(params, 'stepSize', 1, 12, 0.5);
gui.add(params, 'maxSteps', 50, 1500, 10);
gui.add(params, 'fieldStrength', 0.2, 3, 0.05);
gui.add(params, 'lineWidth', 0.25, 4, 0.05);
gui.add(params, 'hueNorth', 0, 360, 1);
gui.add(params, 'hueSouth', 0, 360, 1);
gui.add(params, 'glow', 0, 30, 0.5);
gui.add(params, 'trailFade', 0, 0.5, 0.005);
gui.add(params, 'driftSpeed', 0, 1.5, 0.01);
gui.add(params, 'showPoles');
gui.add(params, 'animate');

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
  params.poleCount = rand(2, 8, 1);
  params.lineDensity = rand(20, 80, 1);
  params.fieldStrength = rand(0.5, 2, 0.05);
  params.hueNorth = rand(0, 360, 1);
  params.hueSouth = (params.hueNorth + 180) % 360;
  params.glow = rand(0, 20, 0.5);
  params.trailFade = rand(0.02, 0.2, 0.005);
  initPoles();
  gui.updateDisplay();
});

gui.addButton('Reposition', () => {
  initPoles();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initPoles();
  clearCanvas();
  gui.updateDisplay();
});
