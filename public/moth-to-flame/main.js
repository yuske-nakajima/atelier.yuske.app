// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 蛾と炎：炎の光に引き寄せられる蛾と揺らめく炎のビジュアル。
// 蛾たちが螺旋を描きながら炎に近づく様子を描く。

const params = {
  mothCount: 40, // 蛾の数
  attractForce: 0.04, // 炎への引力
  orbitForce: 0.06, // 旋回力
  maxSpeed: 2.5, // 最高速度
  flameHeight: 0.35, // 炎の高さ比率
  flameWidth: 0.06, // 炎の幅比率
  mothHue: 40, // 蛾の色相
  fadeAlpha: 0.15, // フェード強度
  mothSize: 5, // 蛾のサイズ
  turbulence: 0.5, // 乱気流
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

/** @typedef {{ x: number, y: number, vx: number, vy: number, angle: number, dist: number }} Moth */
/** @type {Moth[]} */
let moths = [];

/**
 * 蛾を初期化する
 */
function initMoths() {
  moths = [];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < params.mothCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 100 + Math.random() * Math.min(w, h) * 0.4;
    moths.push({
      x: w / 2 + Math.cos(a) * r,
      y: h * 0.6 + Math.sin(a) * r * 0.5,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      angle: a,
      dist: r,
    });
  }
}
initMoths();

let time = 0;

/**
 * 炎パーティクルを生成・描画する
 * @param {number} fx 炎の中心X
 * @param {number} fy 炎の中心Y
 * @param {number} t 時間
 */
function drawFlame(fx, fy, t) {
  const w = canvas.width;
  const h = canvas.height;
  const fh = h * params.flameHeight;
  const fw = w * params.flameWidth;

  // 炎本体（複数層のグラデーション楕円）
  const layers = [
    { r: fw * 0.4, color: 'rgba(255, 255, 200, 0.9)' },
    { r: fw * 0.7, color: 'rgba(255, 160, 20, 0.7)' },
    { r: fw * 1.0, color: 'rgba(255, 60, 0, 0.5)' },
    { r: fw * 1.5, color: 'rgba(200, 20, 0, 0.2)' },
  ];

  for (const layer of layers) {
    const flicker = 1 + Math.sin(t * 8 + layer.r) * 0.1;
    const grd = ctx.createRadialGradient(
      fx,
      fy,
      0,
      fx,
      fy - fh * 0.6,
      fh * flicker,
    );
    grd.addColorStop(0, layer.color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(fx, fy, layer.r * flicker, fh * flicker, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 煙
  for (let i = 0; i < 3; i++) {
    const sx = fx + (Math.random() - 0.5) * fw * 2;
    const sy = fy - fh * (0.8 + Math.random() * 0.5);
    ctx.beginPath();
    ctx.arc(sx, sy, fw * 0.3 * Math.random(), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(50, 40, 30, 0.08)';
    ctx.fill();
  }
}

/**
 * 蛾を1ステップ更新する
 * @param {Moth} moth
 */
function updateMoth(moth) {
  const w = canvas.width;
  const h = canvas.height;
  const fx = w / 2;
  const fy = h * 0.62;

  const dx = fx - moth.x;
  const dy = fy - moth.y;
  const dist = Math.max(10, Math.hypot(dx, dy));

  // 炎への引力
  moth.vx += (dx / dist) * params.attractForce * (dist / 100);
  moth.vy += (dy / dist) * params.attractForce * (dist / 100);

  // 旋回力（接線方向）
  const nx = -dy / dist;
  const ny = dx / dist;
  moth.vx += nx * params.orbitForce;
  moth.vy += ny * params.orbitForce;

  // 乱気流
  moth.vx += (Math.random() - 0.5) * params.turbulence * 0.1;
  moth.vy += (Math.random() - 0.5) * params.turbulence * 0.1;

  const speed = Math.hypot(moth.vx, moth.vy);
  if (speed > params.maxSpeed) {
    moth.vx = (moth.vx / speed) * params.maxSpeed;
    moth.vy = (moth.vy / speed) * params.maxSpeed;
  }

  moth.x += moth.vx;
  moth.y += moth.vy;
  moth.angle = Math.atan2(moth.vy, moth.vx);
  moth.dist = dist;

  // 炎に近すぎたらリセット
  if (dist < 15) {
    const a = Math.random() * Math.PI * 2;
    const r = 150 + Math.random() * Math.min(w, h) * 0.3;
    moth.x = w / 2 + Math.cos(a) * r;
    moth.y = h * 0.6 + Math.sin(a) * r * 0.5;
    moth.vx = 0;
    moth.vy = 0;
  }

  if (moth.x < 0 || moth.x > w) moth.vx *= -0.5;
  if (moth.y < 0 || moth.y > h) moth.vy *= -0.5;
}

function draw() {
  time += 0.016;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(8, 5, 3, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  // 炎を描く
  drawFlame(w / 2, h * 0.62, time);

  // 蛾を更新・描画
  for (const moth of moths) {
    updateMoth(moth);
    const s = params.mothSize;
    const proximity = Math.max(0, 1 - moth.dist / 200);
    const hue = params.mothHue + proximity * 20;
    const lig = 45 + proximity * 25;

    ctx.save();
    ctx.translate(moth.x, moth.y);
    ctx.rotate(moth.angle);

    // 翅
    ctx.fillStyle = `hsla(${hue}, 50%, ${lig}%, 0.7)`;
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, -s * 0.4, s * 1.2, s * 0.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-s * 0.3, s * 0.4, s * 1.2, s * 0.5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // 胴体
    ctx.fillStyle = `hsl(${hue - 10}, 40%, 30%)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.4, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Moth to Flame',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'mothCount', 5, 150, 5).onChange(initMoths);
gui.add(params, 'attractForce', 0.005, 0.2, 0.005);
gui.add(params, 'orbitForce', 0, 0.3, 0.005);
gui.add(params, 'maxSpeed', 0.5, 6, 0.1);
gui.add(params, 'flameHeight', 0.1, 0.6, 0.01);
gui.add(params, 'flameWidth', 0.02, 0.15, 0.005);
gui.add(params, 'mothHue', 0, 360, 1);
gui.add(params, 'mothSize', 2, 15, 0.5);
gui.add(params, 'turbulence', 0, 2, 0.05);

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
  params.mothCount = rand(10, 100, 5);
  params.attractForce = rand(0.01, 0.15, 0.005);
  params.orbitForce = rand(0.01, 0.2, 0.005);
  params.maxSpeed = rand(1, 5, 0.1);
  params.mothHue = rand(0, 360, 1);
  params.turbulence = rand(0.1, 1.5, 0.05);
  initMoths();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initMoths();
  gui.updateDisplay();
});
