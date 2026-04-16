// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  starCount: 120, // 星の数
  connectionDist: 150, // 線を結ぶ最大距離
  starSize: 2, // 星の基本サイズ
  maxStarSize: 5, // 星の最大サイズ（ランダム）
  driftSpeed: 0.3, // 星の漂流速度
  twinkle: true, // 瞬き効果
  twinkleSpeed: 0.02, // 瞬きの速さ
  lineAlpha: 0.4, // 接続線の透明度
  lineWidth: 1, // 接続線の太さ
  baseHue: 220, // 基本色相（青系）
  hueRange: 40, // 色相のバリエーション幅
  bgColor: '#050510', // 背景色（深い夜空）
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

window.addEventListener('resize', () => {
  resize();
  initStars();
});
resize();

// --- 星の管理 ---

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   vx: number,
 *   vy: number,
 *   size: number,
 *   brightness: number,
 *   twinkleOffset: number,
 *   hue: number
 * }} Star
 */

/** @type {Star[]} */
let stars = [];

/** 星をランダム位置・ランダム速度で初期化する */
function initStars() {
  stars = [];
  for (let i = 0; i < params.starCount; i++) {
    stars.push(createStar());
  }
}

/**
 * 新しい星を生成する
 * @returns {Star}
 */
function createStar() {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * params.driftSpeed;
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size:
      params.starSize + Math.random() * (params.maxStarSize - params.starSize),
    brightness: 0.5 + Math.random() * 0.5,
    twinkleOffset: Math.random() * Math.PI * 2,
    hue: params.baseHue + (Math.random() - 0.5) * params.hueRange,
  };
}

initStars();

// --- 描画ループ ---

let frame = 0;

/**
 * 星を更新し、近い星同士を線で結んで描画する
 */
function draw() {
  // 背景クリア
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;
  const count = stars.length;
  const distSqMax = params.connectionDist * params.connectionDist;

  // --- 星の位置を更新 ---
  for (let i = 0; i < count; i++) {
    const star = stars[i];
    star.x += star.vx;
    star.y += star.vy;

    // トーラス境界
    if (star.x < 0) star.x += w;
    if (star.x > w) star.x -= w;
    if (star.y < 0) star.y += h;
    if (star.y > h) star.y -= h;
  }

  // --- 接続線を描画 ---
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      const a = stars[i];
      const b = stars[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < distSqMax) {
        // 距離が近いほど線を濃くする
        const dist = Math.sqrt(distSq);
        const alpha = (1 - dist / params.connectionDist) * params.lineAlpha;
        const hue = (a.hue + b.hue) / 2;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `hsla(${hue}, 60%, 70%, ${alpha})`;
        ctx.lineWidth = params.lineWidth;
        ctx.stroke();
      }
    }
  }

  // --- 星を描画 ---
  for (let i = 0; i < count; i++) {
    const star = stars[i];

    // 瞬き効果
    let alpha = star.brightness;
    if (params.twinkle) {
      const twinkleValue = Math.sin(
        frame * params.twinkleSpeed + star.twinkleOffset,
      );
      alpha = star.brightness * (0.6 + 0.4 * twinkleValue);
    }

    const hue = star.hue;
    const size = star.size;

    // グロー効果（大きめの薄い円）
    ctx.beginPath();
    ctx.arc(star.x, star.y, size * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 70%, 80%, ${alpha * 0.15})`;
    ctx.fill();

    // 本体の星
    ctx.beginPath();
    ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 60%, 85%, ${alpha})`;
    ctx.fill();
  }

  frame++;
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'Constellation',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

// 星の数（変更時に再生成）
gui.add(params, 'starCount', 20, 300, 10).onChange(() => {
  initStars();
});

// 接続距離
gui.add(params, 'connectionDist', 50, 400, 10);

// 星のサイズ
gui.add(params, 'starSize', 0.5, 5, 0.5);
gui.add(params, 'maxStarSize', 2, 10, 0.5);

// 漂流速度（変更時に再生成）
gui.add(params, 'driftSpeed', 0, 2, 0.1).onChange(() => {
  initStars();
});

// 瞬き
gui.addBoolean(params, 'twinkle');
gui.add(params, 'twinkleSpeed', 0.005, 0.1, 0.005);

// 接続線
gui.add(params, 'lineAlpha', 0.05, 1, 0.05);
gui.add(params, 'lineWidth', 0.5, 4, 0.5);

// カラー
gui.add(params, 'baseHue', 0, 360, 1).onChange(() => {
  initStars();
});
gui.add(params, 'hueRange', 0, 180, 5).onChange(() => {
  initStars();
});
gui.addColor(params, 'bgColor');

// ボタン
gui.addButton('Random', () => {
  params.starCount = 20 + Math.floor(Math.random() * 29) * 10;
  params.connectionDist = 50 + Math.floor(Math.random() * 36) * 10;
  params.starSize = Math.round((0.5 + Math.random() * 4.5) * 2) / 2;
  params.maxStarSize =
    Math.round((params.starSize + Math.random() * (10 - params.starSize)) * 2) /
    2;
  params.driftSpeed = Math.round(Math.random() * 20) / 10;
  params.twinkle = Math.random() > 0.3;
  params.twinkleSpeed =
    Math.round((0.005 + Math.random() * 0.095) * 1000) / 1000;
  params.lineAlpha = Math.round((0.05 + Math.random() * 0.95) * 20) / 20;
  params.lineWidth = Math.round((0.5 + Math.random() * 3.5) * 2) / 2;
  params.baseHue = Math.floor(Math.random() * 361);
  params.hueRange = Math.floor(Math.random() * 37) * 5;
  params.bgColor = `#${Math.floor(Math.random() * 0x1a1a2e)
    .toString(16)
    .padStart(6, '0')}`;
  initStars();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initStars();
  gui.updateDisplay();
});
