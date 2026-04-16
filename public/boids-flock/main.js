// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  boidCount: 200, // Boid の個体数
  maxSpeed: 4, // 最大速度
  separationDist: 25, // 分離ルールの感知距離
  separationForce: 1.5, // 分離ルールの力の強さ
  alignmentDist: 50, // 整列ルールの感知距離
  alignmentForce: 1.0, // 整列ルールの力の強さ
  cohesionDist: 80, // 結合ルールの感知距離
  cohesionForce: 1.0, // 結合ルールの力の強さ
  boidSize: 6, // Boid の大きさ
  trail: false, // 残像エフェクトの有無
  trailAlpha: 0.1, // 残像の透明度
  baseHue: 200, // 基本色相（HSL）
  bgColor: '#0a0a0a', // 背景色
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

// --- ユーティリティ ---

/**
 * hex カラーを rgba 文字列に変換する
 * @param {string} hex - '#rrggbb' 形式のカラーコード
 * @param {number} alpha - 不透明度（0〜1）
 * @returns {string} rgba 文字列
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- Boid 管理 ---

/**
 * @typedef {{ x: number, y: number, vx: number, vy: number }} Boid
 */

/** @type {Boid[]} */
let boids = [];

/** Boid 配列をランダム位置・ランダム速度で初期化する */
function initBoids() {
  boids = [];
  for (let i = 0; i < params.boidCount; i++) {
    // 速度の初期角度をランダムに設定
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * (params.maxSpeed - 1);
    boids.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
}

initBoids();

// --- 描画ループ ---

/**
 * 各 Boid に 3 ルール（分離・整列・結合）を適用し、速度・位置を更新して描画する
 */
function draw() {
  // --- 背景クリア（残像エフェクト対応） ---
  if (params.trail) {
    // 半透明で塗ることで前フレームの残像を残す
    ctx.fillStyle = hexToRgba(params.bgColor, params.trailAlpha);
  } else {
    ctx.fillStyle = params.bgColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;
  const count = boids.length;

  // 各 Boid の加速度を計算する
  for (let i = 0; i < count; i++) {
    const boid = boids[i];

    // 分離（Separation）: 近すぎる個体から離れる
    let sepX = 0;
    let sepY = 0;
    let sepCount = 0;

    // 整列（Alignment）: 近くの個体の平均速度に合わせる
    let aliVx = 0;
    let aliVy = 0;
    let aliCount = 0;

    // 結合（Cohesion）: 近くの個体の重心に向かう
    let cohX = 0;
    let cohY = 0;
    let cohCount = 0;

    for (let j = 0; j < count; j++) {
      if (i === j) continue;

      const other = boids[j];
      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const distSq = dx * dx + dy * dy;

      // --- 分離ルール ---
      const sepDistSq = params.separationDist * params.separationDist;
      if (distSq < sepDistSq && distSq > 0) {
        // 反発ベクトル（距離に反比例）
        const dist = Math.sqrt(distSq);
        sepX -= dx / dist;
        sepY -= dy / dist;
        sepCount++;
      }

      // --- 整列ルール ---
      const aliDistSq = params.alignmentDist * params.alignmentDist;
      if (distSq < aliDistSq) {
        aliVx += other.vx;
        aliVy += other.vy;
        aliCount++;
      }

      // --- 結合ルール ---
      const cohDistSq = params.cohesionDist * params.cohesionDist;
      if (distSq < cohDistSq) {
        cohX += other.x;
        cohY += other.y;
        cohCount++;
      }
    }

    // 分離の力を加速度に加算
    if (sepCount > 0) {
      boid.vx += (sepX / sepCount) * params.separationForce * 0.05;
      boid.vy += (sepY / sepCount) * params.separationForce * 0.05;
    }

    // 整列の力を加速度に加算
    if (aliCount > 0) {
      const avgVx = aliVx / aliCount;
      const avgVy = aliVy / aliCount;
      boid.vx += (avgVx - boid.vx) * params.alignmentForce * 0.05;
      boid.vy += (avgVy - boid.vy) * params.alignmentForce * 0.05;
    }

    // 結合の力を加速度に加算
    if (cohCount > 0) {
      const centerX = cohX / cohCount;
      const centerY = cohY / cohCount;
      boid.vx += (centerX - boid.x) * params.cohesionForce * 0.001;
      boid.vy += (centerY - boid.y) * params.cohesionForce * 0.001;
    }

    // --- 速度を maxSpeed でクランプ ---
    const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
    if (speed > params.maxSpeed) {
      boid.vx = (boid.vx / speed) * params.maxSpeed;
      boid.vy = (boid.vy / speed) * params.maxSpeed;
    }

    // --- 位置を更新 ---
    boid.x += boid.vx;
    boid.y += boid.vy;

    // --- トーラス境界（端に達したら反対側から出現） ---
    if (boid.x < 0) boid.x += w;
    if (boid.x > w) boid.x -= w;
    if (boid.y < 0) boid.y += h;
    if (boid.y > h) boid.y -= h;
  }

  // --- 各 Boid を三角形で描画 ---
  for (let i = 0; i < count; i++) {
    const boid = boids[i];
    const angle = Math.atan2(boid.vy, boid.vx);
    const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);

    // 速度に応じて色相を変化させる（基本色相 ± 速度依存オフセット）
    const hueOffset = (speed / params.maxSpeed) * 40;
    const hue = (params.baseHue + hueOffset) % 360;
    const color = `hsl(${hue}, 80%, 60%)`;

    const size = params.boidSize;

    // 進行方向を向いた三角形を描画する
    ctx.save();
    ctx.translate(boid.x, boid.y);
    ctx.rotate(angle);

    ctx.beginPath();
    // 先端（進行方向）
    ctx.moveTo(size, 0);
    // 左後方
    ctx.lineTo(-size * 0.6, -size * 0.45);
    // 右後方
    ctx.lineTo(-size * 0.6, size * 0.45);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'Boids Flock',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

// 個体数（変更時に全 Boid を再生成）
gui.add(params, 'boidCount', 50, 500, 10).onChange(() => {
  initBoids();
});

// 速度
gui.add(params, 'maxSpeed', 1, 10, 0.5);

// 分離ルール
gui.add(params, 'separationDist', 10, 100, 5);
gui.add(params, 'separationForce', 0.1, 5, 0.1);

// 整列ルール
gui.add(params, 'alignmentDist', 10, 150, 5);
gui.add(params, 'alignmentForce', 0.1, 5, 0.1);

// 結合ルール
gui.add(params, 'cohesionDist', 10, 200, 5);
gui.add(params, 'cohesionForce', 0.1, 5, 0.1);

// 描画スタイル
gui.add(params, 'boidSize', 2, 15, 1);

// 残像エフェクト
gui.addBoolean(params, 'trail');
gui.add(params, 'trailAlpha', 0.01, 0.5, 0.01);

// カラー
gui.add(params, 'baseHue', 0, 360, 1);
gui.addColor(params, 'bgColor');

// ボタン
gui.addButton('Random', () => {
  params.boidCount = 50 + Math.floor((Math.random() * 451) / 10) * 10;
  params.maxSpeed = Math.round((1 + Math.random() * 9) * 2) / 2;
  params.separationDist = 10 + Math.floor(Math.random() * 19) * 5;
  params.separationForce = Math.round((0.1 + Math.random() * 4.9) * 10) / 10;
  params.alignmentDist = 10 + Math.floor(Math.random() * 29) * 5;
  params.alignmentForce = Math.round((0.1 + Math.random() * 4.9) * 10) / 10;
  params.cohesionDist = 10 + Math.floor(Math.random() * 39) * 5;
  params.cohesionForce = Math.round((0.1 + Math.random() * 4.9) * 10) / 10;
  params.boidSize = 2 + Math.floor(Math.random() * 14);
  params.trail = Math.random() > 0.5;
  params.trailAlpha = Math.round((0.01 + Math.random() * 0.49) * 100) / 100;
  params.baseHue = Math.floor(Math.random() * 361);
  params.bgColor = `#${Math.floor(Math.random() * 0x333333)
    .toString(16)
    .padStart(6, '0')}`;
  initBoids();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initBoids();
  gui.updateDisplay();
});
