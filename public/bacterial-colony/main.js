// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// バクテリアコロニー：DLA（拡散律速凝集）+ 分裂で成長するコロニー。
// バクテリアがランダムウォークで集まり、接触すると固着・増殖する。

const params = {
  maxBacteria: 2000, // 最大バクテリア数
  spawnRate: 3, // 1フレームの新規発生数
  divisionRate: 0.003, // 分裂確率/フレーム
  walkSpeed: 2.0, // ランダムウォーク速度
  stickDist: 6, // 付着距離
  hueStart: 120, // コロニー色相（緑）
  hueEnd: 60, // 成長後の色相（黄）
  brightness: 55, // 明度
  fadeAlpha: 0.03, // フェード強度
  bacteriaSize: 3, // バクテリアサイズ
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initColony();
}
window.addEventListener('resize', resize);

/** @typedef {{ x: number, y: number, fixed: boolean, age: number }} Bacterium */

/** @type {Bacterium[]} */
let colony = [];
/** @type {Bacterium[]} */
let walkers = [];

/**
 * コロニーを初期化する（中心に核を配置）
 */
function initColony() {
  colony = [{ x: canvas.width / 2, y: canvas.height / 2, fixed: true, age: 0 }];
  walkers = [];
}

resize();

/**
 * 画面外からランダムウォーカーを発生させる
 */
function spawnWalker() {
  const w = canvas.width;
  const h = canvas.height;
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;
  if (side === 0) {
    x = Math.random() * w;
    y = 0;
  } else if (side === 1) {
    x = w;
    y = Math.random() * h;
  } else if (side === 2) {
    x = Math.random() * w;
    y = h;
  } else {
    x = 0;
    y = Math.random() * h;
  }
  walkers.push({ x, y, fixed: false, age: 0 });
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(11, 10, 7, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  // 新規ウォーカーを発生
  for (
    let i = 0;
    i < params.spawnRate && colony.length + walkers.length < params.maxBacteria;
    i++
  ) {
    spawnWalker();
  }

  // ウォーカーを更新
  const toFix = /** @type {Bacterium[]} */ ([]);
  walkers = walkers.filter((w2) => {
    w2.x += (Math.random() - 0.5) * params.walkSpeed * 2;
    w2.y += (Math.random() - 0.5) * params.walkSpeed * 2;
    w2.age++;

    // コロニーに近いか確認
    for (const c of colony) {
      const d = Math.hypot(w2.x - c.x, w2.y - c.y);
      if (d < params.stickDist) {
        w2.fixed = true;
        toFix.push(w2);
        return false;
      }
    }
    // 画面外チェック
    return w2.x >= -20 && w2.x <= w + 20 && w2.y >= -20 && w2.y <= h + 20;
  });

  for (const b of toFix) colony.push(b);

  // 分裂
  const newBacteria = /** @type {Bacterium[]} */ ([]);
  for (const b of colony) {
    b.age++;
    if (
      Math.random() < params.divisionRate &&
      colony.length + newBacteria.length < params.maxBacteria
    ) {
      newBacteria.push({
        x: b.x + (Math.random() - 0.5) * params.stickDist * 2,
        y: b.y + (Math.random() - 0.5) * params.stickDist * 2,
        fixed: true,
        age: 0,
      });
    }
  }
  for (const b of newBacteria) colony.push(b);

  // コロニーを描画
  const s = params.bacteriaSize;
  for (const b of colony) {
    const t = Math.min(1, b.age / 300);
    const hue = params.hueStart + (params.hueEnd - params.hueStart) * t;
    ctx.fillStyle = `hsl(${hue}, 70%, ${params.brightness}%)`;
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, s, s * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // ウォーカーを描画
  for (const w2 of walkers) {
    ctx.fillStyle = `hsla(${params.hueStart}, 50%, 70%, 0.5)`;
    ctx.beginPath();
    ctx.arc(w2.x, w2.y, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Bacterial Colony',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'spawnRate', 1, 15, 1);
gui.add(params, 'divisionRate', 0, 0.02, 0.001);
gui.add(params, 'walkSpeed', 0.5, 6, 0.1);
gui.add(params, 'stickDist', 2, 20, 0.5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'brightness', 20, 80, 1);
gui.add(params, 'fadeAlpha', 0.005, 0.3, 0.005);
gui.add(params, 'bacteriaSize', 1, 8, 0.5);

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
  params.spawnRate = rand(1, 10, 1);
  params.divisionRate = rand(0.001, 0.015, 0.001);
  params.walkSpeed = rand(0.5, 4, 0.1);
  params.stickDist = rand(3, 12, 0.5);
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.brightness = rand(30, 70, 1);
  initColony();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initColony();
  gui.updateDisplay();
});
