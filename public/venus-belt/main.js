// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  windSpeed: 1,
  starCount: 200,
  dustCount: 80,
  beltIntensity: 0.7,
  beltColor: '#d4789c',
  skyDarkness: 0.8,
  horizonGlow: 0.6,
  twinkle: true,
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
  createStars();
  createDust();
}

window.addEventListener('resize', resize);
resize();

// --- ユーティリティ ---

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

/**
 * 2つの色を線形補間する
 * @param {{ r: number, g: number, b: number }} c1
 * @param {{ r: number, g: number, b: number }} c2
 * @param {number} t - 0〜1
 * @returns {{ r: number, g: number, b: number }}
 */
function lerpColor(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

// --- 星パーティクル ---

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   size: number,
 *   brightness: number,
 *   twinkleSpeed: number,
 *   twinklePhase: number
 * }} Star
 */

/** @type {Star[]} */
let stars = [];

/** 星を生成する */
function createStars() {
  stars = [];
  for (let i = 0; i < params.starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7,
      size: 0.5 + Math.random() * 1.5,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }
}

// --- 塵パーティクル ---

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   size: number,
 *   alpha: number,
 *   speed: number,
 *   drift: number
 * }} Dust
 */

/** @type {Dust[]} */
let dust = [];

/** 塵パーティクルを1つ生成する */
function createSingleDust() {
  // ビーナスベルト付近（画面の50%〜85%）に多く配置
  const yBase = canvas.height * (0.5 + Math.random() * 0.35);
  return {
    x: Math.random() * canvas.width,
    y: yBase + (Math.random() - 0.5) * canvas.height * 0.1,
    size: 0.5 + Math.random() * 2,
    alpha: 0.1 + Math.random() * 0.3,
    speed: 0.2 + Math.random() * 0.8,
    drift: Math.random() * Math.PI * 2,
  };
}

/** 塵パーティクルを全て生成する */
function createDust() {
  dust = [];
  for (let i = 0; i < params.dustCount; i++) {
    dust.push(createSingleDust());
  }
}

// --- 描画関数 ---

/**
 * 空のグラデーション背景を描画する
 * @param {number} time - 経過時間
 */
function drawSky(time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

  // skyDarkness で上部の暗さを調整
  const darkFactor = params.skyDarkness;
  const darkR = Math.round(10 * (1 - darkFactor * 0.5));
  const darkG = Math.round(10 * (1 - darkFactor * 0.5));
  const darkB = Math.round(30 * (1 - darkFactor * 0.3));

  // 上部: 深い暗青
  gradient.addColorStop(0, `rgb(${darkR}, ${darkG}, ${darkB})`);

  // 中央上部: 暗い青紫
  gradient.addColorStop(0.4, `rgba(20, 15, 50, ${0.7 + darkFactor * 0.3})`);

  // ビーナスベルト帯の色を計算
  const beltRgb = hexToRgb(params.beltColor);
  const beltAlpha = params.beltIntensity;

  // ビーナスベルト上端: 紫がかった色
  const beltUpper = lerpColor(
    { r: 30, g: 20, b: 60 },
    beltRgb,
    beltAlpha * 0.5,
  );
  gradient.addColorStop(
    0.55,
    `rgb(${beltUpper.r}, ${beltUpper.g}, ${beltUpper.b})`,
  );

  // ビーナスベルト中心: ピンク〜紫のメインカラー
  const beltCenter = lerpColor({ r: 40, g: 25, b: 60 }, beltRgb, beltAlpha);
  gradient.addColorStop(
    0.65,
    `rgb(${beltCenter.r}, ${beltCenter.g}, ${beltCenter.b})`,
  );

  // ビーナスベルト下端: オレンジへの遷移
  const glowFactor = params.horizonGlow;
  const beltLower = lerpColor(
    beltCenter,
    { r: 200, g: 120, b: 60 },
    glowFactor * 0.5,
  );
  gradient.addColorStop(
    0.75,
    `rgb(${beltLower.r}, ${beltLower.g}, ${beltLower.b})`,
  );

  // 地平線付近: オレンジ〜暖かい輝き
  const horizonR = Math.round(80 + glowFactor * 120);
  const horizonG = Math.round(40 + glowFactor * 60);
  const horizonB = Math.round(20 + glowFactor * 30);
  gradient.addColorStop(0.85, `rgb(${horizonR}, ${horizonG}, ${horizonB})`);

  // 最下部: 暗いシルエット（地面）
  gradient.addColorStop(1, '#050510');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ビーナスベルト帯に微かな光のゆらぎを追加
  const glowY = canvas.height * 0.65;
  const glowHeight = canvas.height * 0.15;
  const glowAlpha = 0.03 + Math.sin(time * 0.3) * 0.015;
  const glowGradient = ctx.createRadialGradient(
    canvas.width * 0.5,
    glowY,
    0,
    canvas.width * 0.5,
    glowY,
    canvas.width * 0.4,
  );
  glowGradient.addColorStop(
    0,
    `rgba(${beltRgb.r}, ${beltRgb.g}, ${beltRgb.b}, ${glowAlpha * beltAlpha})`,
  );
  glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGradient;
  ctx.fillRect(0, glowY - glowHeight, canvas.width, glowHeight * 2);
}

/** 地形シルエットを描画する */
function drawTerrain() {
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  for (let x = 0; x <= canvas.width; x += 2) {
    const y =
      canvas.height * 0.85 +
      Math.sin(x * 0.003) * canvas.height * 0.03 +
      Math.sin(x * 0.007 + 1) * canvas.height * 0.02 +
      Math.sin(x * 0.015 + 2) * canvas.height * 0.01;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fillStyle = '#050510';
  ctx.fill();
}

/**
 * 星を描画する
 * @param {number} time - 経過時間
 */
function drawStars(time) {
  for (const star of stars) {
    let alpha = star.brightness;

    // 瞬きエフェクト
    if (params.twinkle) {
      const twinkleValue = Math.sin(
        time * star.twinkleSpeed + star.twinklePhase,
      );
      alpha = star.brightness * (0.5 + twinkleValue * 0.5);
    }

    alpha = clamp(alpha, 0, 1);

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 240, ${alpha})`;
    ctx.fill();

    // 明るい星にはグロー効果
    if (star.brightness > 0.7 && star.size > 1) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 210, 255, ${alpha * 0.1})`;
      ctx.fill();
    }
  }
}

/**
 * 塵パーティクルを更新・描画する
 * @param {number} time - 経過時間
 */
function drawDust(time) {
  const windFactor = params.windSpeed;

  for (const d of dust) {
    // 風による横移動
    const windVariation = Math.sin(time * 0.5 + d.drift) * 0.5 + 0.5;
    d.x += d.speed * windFactor * (0.5 + windVariation);

    // 微かな縦の揺れ
    d.y += Math.sin(time * 0.8 + d.drift) * 0.3;

    // 画面外に出たらリサイクル
    if (d.x > canvas.width + 10) {
      d.x = -5;
      d.y =
        canvas.height * (0.5 + Math.random() * 0.35) +
        (Math.random() - 0.5) * canvas.height * 0.1;
    }
    if (d.y < 0 || d.y > canvas.height) {
      d.y = canvas.height * (0.5 + Math.random() * 0.35);
    }

    // ベルト色を取得して微かに光る塵を描画
    const beltRgb = hexToRgb(params.beltColor);
    const dustAlpha =
      d.alpha * (0.5 + Math.sin(time + d.drift) * 0.5) * params.beltIntensity;

    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${beltRgb.r}, ${beltRgb.g}, ${beltRgb.b}, ${clamp(dustAlpha, 0, 1)})`;
    ctx.fill();
  }
}

// --- メインループ ---

let time = 0;

/** メインの描画ループ */
function draw() {
  // 空のグラデーション背景
  drawSky(time);

  // 星
  drawStars(time);

  // 地形シルエット
  drawTerrain();

  // 塵パーティクル
  drawDust(time);

  time += 0.016;

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI セットアップ ---

const gui = new TileUI({
  title: '夜の風とビーナスベルト',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'windSpeed', 0, 5, 0.1);
gui.add(params, 'starCount', 50, 500, 10).onChange(() => {
  createStars();
});
gui.add(params, 'dustCount', 0, 200, 10).onChange(() => {
  createDust();
});
gui.add(params, 'beltIntensity', 0, 1, 0.05);
gui.addColor(params, 'beltColor');
gui.add(params, 'skyDarkness', 0, 1, 0.05);
gui.add(params, 'horizonGlow', 0, 1, 0.05);
gui.addBoolean(params, 'twinkle');

gui.addButton('Random', () => {
  params.windSpeed = Math.round(Math.random() * 5 * 10) / 10;
  params.starCount = Math.round((50 + Math.random() * 450) / 10) * 10;
  params.dustCount = Math.round((Math.random() * 200) / 10) * 10;
  params.beltIntensity = Math.round(Math.random() * 20) / 20;
  params.beltColor = `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
  params.skyDarkness = Math.round(Math.random() * 20) / 20;
  params.horizonGlow = Math.round(Math.random() * 20) / 20;
  params.twinkle = Math.random() > 0.5;
  createStars();
  createDust();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  createStars();
  createDust();
  time = 0;
  gui.updateDisplay();
});
