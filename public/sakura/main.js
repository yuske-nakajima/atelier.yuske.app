// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  count: 150,
  speed: 1,
  wind: 0.5,
  size: 2,
  sway: 1,
  petalColor: '#f9a8d4',
  bgColor: '#e8f4f8',
  trail: false,
  visible: true,
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** Canvas をウィンドウサイズに合わせる */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- 花びらパーティクル ---

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   angle: number,
 *   rotSpeed: number,
 *   phase: number,
 *   drift: number,
 *   scaleX: number,
 *   scaleY: number,
 *   colorShift: number,
 *   alphaBase: number
 * }} Petal
 */

/** @type {Petal[]} */
let petals = [];

/**
 * 花びらを1つ生成する
 * @param {boolean} randomY - true なら画面内のランダムな y 位置で生成
 * @returns {Petal}
 */
function createPetal(randomY) {
  return {
    x: Math.random() * canvas.width,
    y: randomY
      ? Math.random() * canvas.height
      : -Math.random() * canvas.height * 0.3,
    angle: Math.random() * Math.PI * 2,
    rotSpeed: (0.5 + Math.random() * 1.5) * (Math.random() > 0.5 ? 1 : -1),
    phase: Math.random() * Math.PI * 2,
    drift: Math.random() * Math.PI * 2,
    scaleX: 0.6 + Math.random() * 0.8,
    scaleY: 0.3 + Math.random() * 0.4,
    colorShift: -15 + Math.random() * 30,
    alphaBase: 0.6 + Math.random() * 0.4,
  };
}

/** 全花びらを再生成する */
function createPetals() {
  petals = [];
  for (let i = 0; i < params.count; i++) {
    petals.push(createPetal(true));
  }
}

createPetals();

/**
 * hex → RGB 分解
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
function hexToRgb(hex) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

/**
 * 値をクランプする
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// --- 描画 ---

let time = 0;

/** メインの描画ループ */
function draw() {
  if (params.trail) {
    // 残像効果
    ctx.fillStyle = `${params.bgColor}33`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = params.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (!params.visible) {
    requestAnimationFrame(draw);
    return;
  }

  const { r, g, b } = hexToRgb(params.petalColor);

  for (const p of petals) {
    // 重力による落下
    p.y += params.speed * 0.8;

    // 風による横移動（全体的なsin波で変動）
    p.x += params.wind * 0.5 + Math.sin(time * 0.5) * params.wind * 0.3;

    // 個々の揺れ
    p.x += Math.sin(time * 1.5 + p.phase) * params.sway * 0.5;

    // 花びらの回転
    p.angle += p.rotSpeed * params.speed * 0.02;

    // 画面外に出た花びらを上に戻す
    if (p.y > canvas.height + 20) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
    }
    if (p.x > canvas.width + 20) {
      p.x = -10;
    }
    if (p.x < -20) {
      p.x = canvas.width + 10;
    }

    // 色のバリエーション
    const pr = clamp(r + p.colorShift, 0, 255);
    const pg = clamp(g + p.colorShift * 0.5, 0, 255);
    const pb = clamp(b + p.colorShift * 0.3, 0, 255);
    const alpha = p.alphaBase + Math.sin(time + p.phase) * 0.15;

    // 花びらの描画（楕円 + 回転）
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.scale(p.scaleX, p.scaleY);

    ctx.beginPath();
    ctx.ellipse(0, 0, params.size * 3, params.size * 1.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.round(pr)}, ${Math.round(pg)}, ${Math.round(pb)}, ${clamp(alpha, 0, 1)})`;
    ctx.fill();
    ctx.restore();
  }

  time += 0.016 * params.speed;

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI トグル（モバイル） ---

const guiWrapper = /** @type {HTMLElement} */ (
  document.getElementById('gui-wrapper')
);
const guiToggle = /** @type {HTMLButtonElement} */ (
  document.getElementById('gui-toggle')
);

// モバイルでは初期状態を閉じておく
const mql = window.matchMedia('(max-width: 48rem)');
if (mql.matches) {
  guiWrapper.classList.add('collapsed');
}
mql.addEventListener('change', (e) => {
  if (e.matches) {
    guiWrapper.classList.add('collapsed');
  } else {
    guiWrapper.classList.remove('collapsed');
  }
});

guiToggle.addEventListener('click', () => {
  guiWrapper.classList.toggle('collapsed');
});

// --- GUI セットアップ ---

const guiContainer = /** @type {HTMLElement} */ (
  document.getElementById('gui-container')
);
const gui = new TileUI({
  title: '桜吹雪',
  container: guiContainer,
});

gui.add(params, 'count', 10, 500, 10).onChange(() => {
  createPetals();
});
gui.add(params, 'speed', 0.1, 5, 0.1);
gui.add(params, 'wind', -3, 3, 0.1);
gui.add(params, 'size', 0.5, 5, 0.1);
gui.add(params, 'sway', 0, 3, 0.1);
gui.addBoolean(params, 'visible');

gui.addColor(params, 'petalColor');
gui.addColor(params, 'bgColor');
gui.addBoolean(params, 'trail');

gui.addButton('Random', () => {
  params.count = Math.round((10 + Math.random() * 490) / 10) * 10;
  params.speed = Math.round((0.1 + Math.random() * 4.9) * 10) / 10;
  params.wind = Math.round((-3 + Math.random() * 6) * 10) / 10;
  params.size = Math.round((0.5 + Math.random() * 4.5) * 10) / 10;
  params.sway = Math.round(Math.random() * 3 * 10) / 10;
  params.petalColor = `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
  params.trail = Math.random() > 0.5;
  createPetals();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  createPetals();
  time = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gui.updateDisplay();
});
