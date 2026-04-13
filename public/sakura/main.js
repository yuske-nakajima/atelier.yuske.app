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
  petalNoise: false,
  bgNoise: false,
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

// --- カラーノイズ（fBm 風の重ね合わせ） ---

/**
 * 複数の sin 波を重ねて滑らかなノイズを生成する（fBm 風）
 * @param {number} t - 時間
 * @param {number} seed - オフセット用シード
 * @returns {number} -1〜1 の値
 */
function fbmNoise(t, seed) {
  return (
    Math.sin(t * 0.7 + seed) * 0.5 +
    Math.sin(t * 1.3 + seed * 2.3) * 0.3 +
    Math.sin(t * 2.1 + seed * 0.7) * 0.2
  );
}

/**
 * RGB → HSL 変換
 * @param {number} r - 0-255
 * @param {number} g - 0-255
 * @param {number} b - 0-255
 * @returns {{ h: number, s: number, l: number }} h: 0-360, s/l: 0-1
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

/**
 * HSL → RGB 変換
 * @param {number} h - 0-360
 * @param {number} s - 0-1
 * @param {number} l - 0-1
 * @returns {{ r: number, g: number, b: number }} 0-255
 */
function hslToRgb(h, s, l) {
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  /** @param {number} t */
  const hue2rgb = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(hue2rgb(h + 1 / 3) * 255),
    g: Math.round(hue2rgb(h) * 255),
    b: Math.round(hue2rgb(h - 1 / 3) * 255),
  };
}

/**
 * hex カラーにノイズを適用して RGB を返す
 * @param {string} hex
 * @param {number} t - 時間
 * @param {number} seed - シード
 * @returns {{ r: number, g: number, b: number }}
 */
function applyColorNoise(hex, t, seed) {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  // 色相を ±30° ゆるやかに変動
  hsl.h = (hsl.h + fbmNoise(t * 0.3, seed) * 30 + 360) % 360;
  // 彩度を ±0.15 変動
  hsl.s = clamp(hsl.s + fbmNoise(t * 0.2, seed + 10) * 0.15, 0, 1);
  // 明度を ±0.08 変動
  hsl.l = clamp(hsl.l + fbmNoise(t * 0.25, seed + 20) * 0.08, 0, 1);
  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

// --- 描画 ---

let time = 0;

/** メインの描画ループ */
function draw() {
  // 背景色（ノイズ適用時は HSL 空間でゆるやかに変化）
  const bgRgb = params.bgNoise
    ? applyColorNoise(params.bgColor, time, 100)
    : hexToRgb(params.bgColor);
  const bgCss = `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`;

  if (params.trail) {
    // 残像効果
    ctx.fillStyle = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, 0.2)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgCss;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (!params.visible) {
    requestAnimationFrame(draw);
    return;
  }

  // 花びらのベース色（ノイズ適用時は全体が時間で変化）
  const petalBase = params.petalNoise
    ? applyColorNoise(params.petalColor, time, 0)
    : hexToRgb(params.petalColor);

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

    // 色のバリエーション（ベース色に個別シフトを加算）
    const pr = clamp(petalBase.r + p.colorShift, 0, 255);
    const pg = clamp(petalBase.g + p.colorShift * 0.5, 0, 255);
    const pb = clamp(petalBase.b + p.colorShift * 0.3, 0, 255);
    const alpha = p.alphaBase + Math.sin(time + p.phase) * 0.15;

    // 花びらの描画（ベジェ曲線で桜の花びら形状）
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.scale(p.scaleX, p.scaleY);

    const s = params.size * 2.5;
    ctx.beginPath();
    // 先端（上部）から開始
    ctx.moveTo(0, -s * 1.2);
    // 右側の膨らみ
    ctx.bezierCurveTo(s * 0.8, -s * 1.0, s * 1.0, -s * 0.2, s * 0.5, s * 0.3);
    // 右下から切れ込みへ
    ctx.quadraticCurveTo(s * 0.2, s * 0.6, 0, s * 0.4);
    // 切れ込みから左下へ
    ctx.quadraticCurveTo(-s * 0.2, s * 0.6, -s * 0.5, s * 0.3);
    // 左側の膨らみから先端へ
    ctx.bezierCurveTo(-s * 1.0, -s * 0.2, -s * 0.8, -s * 1.0, 0, -s * 1.2);
    ctx.closePath();

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
gui.addBoolean(params, 'petalNoise');
gui.addColor(params, 'bgColor');
gui.addBoolean(params, 'bgNoise');
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
