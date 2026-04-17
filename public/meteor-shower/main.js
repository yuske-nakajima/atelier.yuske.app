// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  rate: 4, // 1 秒あたりの発生数
  speed: 900, // 落下速度（px/秒）
  angle: 210, // 進行方向（度, 画面座標系）
  angleJitter: 10, // 角度ゆらぎ
  length: 180, // 尾の長さ
  lineWidth: 1.8, // 線の太さ
  stars: 400, // 背景の星の数
  starSize: 1.1, // 星のサイズ
  hue: 195, // 流星の色相
  hueJitter: 40, // 色相ゆらぎ
  trailFade: 0.12, // 残像フェード
  glow: 10, // グロー
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  regenStars();
  clearCanvas();
}
function clearCanvas() {
  ctx.fillStyle = '#04040a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);

/** @type {{x:number, y:number, s:number}[]} */
let starField = [];
function regenStars() {
  starField = [];
  for (let i = 0; i < params.stars; i++) {
    starField.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      s: Math.random() * params.starSize + 0.2,
    });
  }
}

/** @type {{x:number, y:number, vx:number, vy:number, life:number, hue:number}[]} */
const meteors = [];

function spawn() {
  const a =
    ((params.angle + (Math.random() - 0.5) * params.angleJitter) * Math.PI) /
    180;
  const vx = Math.cos(a) * params.speed;
  const vy = Math.sin(a) * params.speed;
  // スポーンは画面外上 or 左
  const w = canvas.width;
  const x = Math.random() * w * 1.5 - w * 0.25;
  const y = -20;
  meteors.push({
    x,
    y,
    vx,
    vy,
    life: 0,
    hue: (params.hue + (Math.random() - 0.5) * params.hueJitter + 360) % 360,
  });
}

resize();

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // フェード
  ctx.fillStyle = `rgba(4, 4, 10, ${Math.max(0, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 星
  ctx.fillStyle = '#d0d8ff';
  for (const s of starField) {
    ctx.globalAlpha = 0.3 + 0.7 * Math.random();
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  ctx.globalAlpha = 1;

  // スポーン
  let spawnN = params.rate * dt;
  while (Math.random() < spawnN) {
    spawn();
    spawnN -= 1;
  }

  ctx.lineWidth = params.lineWidth;
  ctx.lineCap = 'round';
  ctx.shadowBlur = params.glow;

  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.life += dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    const len = params.length;
    const tailX = m.x - (m.vx / params.speed) * len;
    const tailY = m.y - (m.vy / params.speed) * len;
    const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
    const col = `hsl(${m.hue}, 90%, 70%)`;
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, col);
    ctx.strokeStyle = grad;
    ctx.shadowColor = col;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(m.x, m.y);
    ctx.stroke();
    if (
      m.x < -200 ||
      m.x > canvas.width + 200 ||
      m.y < -200 ||
      m.y > canvas.height + 200
    ) {
      meteors.splice(i, 1);
    }
  }
  ctx.shadowBlur = 0;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- GUI ---

const gui = new TileUI({
  title: 'Meteor Shower',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'rate', 0, 30, 0.1);
gui.add(params, 'speed', 100, 2000, 10);
gui.add(params, 'angle', 120, 300, 1);
gui.add(params, 'angleJitter', 0, 60, 1);
gui.add(params, 'length', 20, 400, 1);
gui.add(params, 'lineWidth', 0.5, 6, 0.1);
gui.add(params, 'stars', 0, 1500, 10).onChange(regenStars);
gui.add(params, 'starSize', 0.2, 3, 0.1).onChange(regenStars);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'hueJitter', 0, 180, 1);
gui.add(params, 'trailFade', 0, 0.5, 0.01);
gui.add(params, 'glow', 0, 30, 0.5);

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
  params.rate = rand(2, 12, 0.1);
  params.speed = rand(500, 1500, 10);
  params.angle = rand(180, 250, 1);
  params.angleJitter = rand(0, 30, 1);
  params.length = rand(100, 300, 1);
  params.hue = rand(0, 360, 1);
  params.hueJitter = rand(0, 80, 1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  meteors.length = 0;
  regenStars();
  clearCanvas();
  gui.updateDisplay();
});
