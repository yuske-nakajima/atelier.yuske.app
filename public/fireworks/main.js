// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  gravity: 0.08, // 重力
  launchSpeed: 12, // 打ち上げ速度
  particleCount: 80, // 爆発パーティクル数
  particleLife: 60, // パーティクル寿命（フレーム数）
  explosionRadius: 5, // 爆発半径（パーティクル初速係数）
  fadeSpeed: 0.02, // 速度減衰率
  trail: true, // 残像エフェクト
  trailAlpha: 0.15, // 残像の透明度
  autoLaunch: true, // 自動打ち上げ
  launchInterval: 40, // 打ち上げ間隔（フレーム数）
  baseHue: 0, // 基本色相（0=ランダム）
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

// --- 型定義 ---

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   vx: number,
 *   vy: number,
 *   hue: number
 * }} Rocket
 */

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   vx: number,
 *   vy: number,
 *   life: number,
 *   maxLife: number,
 *   hue: number,
 *   size: number
 * }} Particle
 */

// --- ロケット・パーティクル管理 ---

/** @type {Rocket[]} */
const rockets = [];

/** @type {Particle[]} */
const particles = [];

/** 自動打ち上げ用フレームカウンタ */
let frameCount = 0;

/**
 * 花火の色相を決定する
 * @returns {number} 色相値（0〜360）
 */
function pickHue() {
  if (params.baseHue === 0) {
    // ランダム色相
    return Math.random() * 360;
  }
  // 基本色相 ± 30 の範囲でランダム
  return (params.baseHue + (Math.random() * 60 - 30) + 360) % 360;
}

/**
 * ロケットを打ち上げる
 * @param {number} [targetX] - 打ち上げ位置の x 座標（省略時はランダム）
 */
function launch(targetX) {
  const w = canvas.width;
  const h = canvas.height;

  // x 座標: 指定があればその付近、なければ画面幅の 20%〜80% でランダム
  const x =
    targetX !== undefined
      ? targetX + (Math.random() * 20 - 10)
      : w * 0.2 + Math.random() * w * 0.6;

  /** @type {Rocket} */
  const rocket = {
    x,
    y: h, // 画面下端から打ち上げ
    vx: Math.random() * 2 - 1, // 微小な横方向の揺れ
    vy: -(params.launchSpeed + Math.random() * 2), // 上向き初速
    hue: pickHue(),
  };

  rockets.push(rocket);
}

/**
 * ロケットが頂点に達したとき、パーティクルを放出する
 * @param {Rocket} rocket - 爆発するロケット
 */
function explode(rocket) {
  const count = params.particleCount;
  const life = params.particleLife;

  for (let i = 0; i < count; i++) {
    // 全方位にランダムな角度・速度で散る
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * params.explosionRadius;

    /** @type {Particle} */
    const particle = {
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      hue: rocket.hue + (Math.random() * 20 - 10), // 色相に微小なばらつき
      size: 1.5 + Math.random() * 1.5,
    };

    particles.push(particle);
  }
}

// --- 描画ループ ---

/**
 * メインの描画ループ。ロケットとパーティクルを更新・描画する
 */
function draw() {
  // --- 背景クリア（残像エフェクト対応） ---
  if (params.trail) {
    ctx.fillStyle = hexToRgba(params.bgColor, params.trailAlpha);
  } else {
    ctx.fillStyle = params.bgColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- 自動打ち上げ ---
  frameCount++;
  if (params.autoLaunch && frameCount % params.launchInterval === 0) {
    launch();
  }

  // --- ロケットの更新・描画 ---
  for (let i = rockets.length - 1; i >= 0; i--) {
    const rocket = rockets[i];

    // 重力を適用
    rocket.vy += params.gravity;

    // 位置を更新
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;

    // 頂点に達したら爆発（上昇速度がゼロ以上になったとき）
    if (rocket.vy >= 0) {
      explode(rocket);
      // 配列から除去（末尾と swap して pop）
      rockets[i] = rockets[rockets.length - 1];
      rockets.pop();
      continue;
    }

    // ロケットを描画（小さな明るい丸）
    ctx.beginPath();
    ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${rocket.hue}, 50%, 90%)`;
    ctx.fill();
  }

  // --- パーティクルの更新・描画 ---
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // 重力（パーティクルには弱めに適用）
    p.vy += params.gravity * 0.5;

    // 速度減衰
    p.vx *= 1 - params.fadeSpeed;
    p.vy *= 1 - params.fadeSpeed;

    // 位置を更新
    p.x += p.vx;
    p.y += p.vy;

    // 寿命を減算
    p.life--;

    // 寿命が尽きたら除去（末尾と swap して pop）
    if (p.life <= 0) {
      particles[i] = particles[particles.length - 1];
      particles.pop();
      continue;
    }

    // 描画: 寿命に応じて透明度と明度を変化させる
    const lifeRatio = p.life / p.maxLife;
    const alpha = lifeRatio;
    const lightness = 40 + lifeRatio * 30; // 70% → 40% へ減衰

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * lifeRatio + 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 80%, ${lightness}%, ${alpha})`;
    ctx.fill();
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- クリックで手動打ち上げ ---

canvas.addEventListener('click', (e) => {
  launch(e.clientX);
});

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'Fireworks',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'gravity', 0.01, 0.3, 0.01);
gui.add(params, 'launchSpeed', 5, 20, 0.5);
gui.add(params, 'particleCount', 20, 200, 10);
gui.add(params, 'particleLife', 20, 120, 5);
gui.add(params, 'explosionRadius', 1, 12, 0.5);
gui.add(params, 'fadeSpeed', 0.005, 0.1, 0.005);
gui.addBoolean(params, 'trail');
gui.add(params, 'trailAlpha', 0.01, 0.5, 0.01);
gui.addBoolean(params, 'autoLaunch');
gui.add(params, 'launchInterval', 10, 120, 5);
gui.add(params, 'baseHue', 0, 360, 1);
gui.addColor(params, 'bgColor');

// Random ボタン: 全パラメータをランダムに設定
gui.addButton('Random', () => {
  params.gravity = Math.round((0.01 + Math.random() * 0.29) * 100) / 100;
  params.launchSpeed = Math.round((5 + Math.random() * 15) * 2) / 2;
  params.particleCount = 20 + Math.floor(Math.random() * 19) * 10;
  params.particleLife = 20 + Math.floor(Math.random() * 21) * 5;
  params.explosionRadius = Math.round((1 + Math.random() * 11) * 2) / 2;
  params.fadeSpeed = Math.round((0.005 + Math.random() * 0.095) * 1000) / 1000;
  params.trail = Math.random() > 0.3;
  params.trailAlpha = Math.round((0.01 + Math.random() * 0.49) * 100) / 100;
  params.autoLaunch = true;
  params.launchInterval = 10 + Math.floor(Math.random() * 23) * 5;
  params.baseHue = Math.floor(Math.random() * 361);
  params.bgColor = `#${Math.floor(Math.random() * 0x333333)
    .toString(16)
    .padStart(6, '0')}`;
  gui.updateDisplay();
});

// Reset ボタン: 初期値に戻す
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
