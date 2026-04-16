// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';
import { createNoise3D } from 'https://cdn.jsdelivr.net/npm/simplex-noise/dist/esm/simplex-noise.js';

// --- パラメータ ---

const params = {
  baseAngle: 0,
  noiseScale: 0.003,
  noiseStrength: 1.0,
  speed: 2.0,
  timeSpeed: 0.5,
  turbulence: 0,
  curvature: 1.0,
  particleCount: 1000,
  lineWidth: 1.0,
  baseHue: 200,
  hueRange: 60,
  saturation: 70,
  lightness: 50,
  alpha: 0.3,
  bgColor: '#0a0a0a',
  trail: true,
  trailAlpha: 0.02,
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- ユーティリティ ---

/**
 * hex カラーを rgba 文字列に変換する
 * @param {string} hex - '#rrggbb' 形式のカラーコード
 * @param {number} alpha - 不透明度（0-1）
 * @returns {string} rgba 文字列
 */
function hexToRgba(hex, alpha) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

// --- ノイズ初期化 ---

const noise3D = createNoise3D();

// --- パーティクル管理 ---

/**
 * @typedef {{ x: number, y: number, prevX: number, prevY: number }} Particle
 */

/**
 * ランダムな位置にパーティクルを生成する
 * @returns {Particle}
 */
function createParticle() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  return { x, y, prevX: x, prevY: y };
}

/**
 * baseAngle の反対側の辺にパーティクルをリスポーンさせる
 * @param {Particle} p
 */
function respawnParticle(p) {
  const angleRad = (params.baseAngle * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  // 流れの方向の反対側の辺に配置する
  // cos > 0 なら右方向へ流れる → 左辺にリスポーン
  // cos < 0 なら左方向へ流れる → 右辺にリスポーン
  // sin > 0 なら下方向へ流れる → 上辺にリスポーン
  // sin < 0 なら上方向へ流れる → 下辺にリスポーン
  const absCos = Math.abs(cos);
  const absSin = Math.abs(sin);

  if (absCos > absSin) {
    // 横方向が主な流れ
    p.x = cos > 0 ? 0 : canvas.width;
    p.y = Math.random() * canvas.height;
  } else {
    // 縦方向が主な流れ
    p.x = Math.random() * canvas.width;
    p.y = sin > 0 ? 0 : canvas.height;
  }

  p.prevX = p.x;
  p.prevY = p.y;
}

/** @type {Particle[]} */
let particles = [];

/** パーティクル配列を初期化する */
function initParticles() {
  particles = [];
  for (let i = 0; i < params.particleCount; i++) {
    particles.push(createParticle());
  }
}

initParticles();

// --- 描画ループ ---

/** 経過時間の管理 */
let time = 0;

/** メインの描画ループ */
function draw() {
  time += 0.01;

  // --- 背景クリア（残像対応） ---
  if (params.trail) {
    ctx.fillStyle = hexToRgba(params.bgColor, params.trailAlpha);
  } else {
    ctx.fillStyle = params.bgColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- baseAngle をラジアンに変換 ---
  const baseAngleRad = (params.baseAngle * Math.PI) / 180;

  // --- パーティクル更新・描画 ---
  ctx.lineWidth = params.lineWidth;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // 前回位置を保存
    p.prevX = p.x;
    p.prevY = p.y;

    // ノイズ値から角度を計算
    const noiseValue = noise3D(
      p.x * params.noiseScale,
      p.y * params.noiseScale,
      time * params.timeSpeed,
    );

    let angle =
      baseAngleRad +
      noiseValue * Math.PI * params.noiseStrength * params.curvature;

    // 乱流（高周波ノイズ加算）
    if (params.turbulence > 0) {
      const turbNoise = noise3D(
        p.x * params.noiseScale * 4,
        p.y * params.noiseScale * 4,
        time * params.timeSpeed,
      );
      angle += turbNoise * params.turbulence * 0.5;
    }

    // 速度ベクトルで位置を更新
    p.x += Math.cos(angle) * params.speed;
    p.y += Math.sin(angle) * params.speed;

    // 線を描画（前回位置 → 現在位置）
    const hue = params.baseHue + (p.x / canvas.width) * params.hueRange;
    ctx.strokeStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.beginPath();
    ctx.moveTo(p.prevX, p.prevY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // 画面外チェック → リスポーン
    const margin = 10;
    if (
      p.x < -margin ||
      p.x > canvas.width + margin ||
      p.y < -margin ||
      p.y > canvas.height + margin
    ) {
      respawnParticle(p);
    }
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'Flow Field',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

// フロー制御
gui.add(params, 'baseAngle', 0, 360, 1);
gui.add(params, 'noiseScale', 0.001, 0.02, 0.001);
gui.add(params, 'noiseStrength', 0, 5, 0.1);
gui.add(params, 'speed', 0.1, 10, 0.1);
gui.add(params, 'timeSpeed', 0, 3, 0.1);
gui.add(params, 'turbulence', 0, 3, 0.1);
gui.add(params, 'curvature', 0.1, 5, 0.1);

// パーティクル
gui.add(params, 'particleCount', 100, 5000, 100).onChange(() => {
  initParticles();
});
gui.add(params, 'lineWidth', 0.1, 5, 0.1);

// カラー
gui.add(params, 'baseHue', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 10, 90, 1);
gui.add(params, 'alpha', 0.01, 1, 0.01);
gui.addColor(params, 'bgColor');

// エフェクト
gui.addBoolean(params, 'trail');
gui.add(params, 'trailAlpha', 0.005, 0.2, 0.005);

// ボタン
gui.addButton('Random', () => {
  params.baseAngle = Math.floor(Math.random() * 361);
  params.noiseScale = Math.round((0.001 + Math.random() * 0.019) * 1000) / 1000;
  params.noiseStrength = Math.round(Math.random() * 50) / 10;
  params.speed = Math.round((0.1 + Math.random() * 9.9) * 10) / 10;
  params.timeSpeed = Math.round(Math.random() * 30) / 10;
  params.turbulence = Math.round(Math.random() * 30) / 10;
  params.curvature = Math.round((0.1 + Math.random() * 4.9) * 10) / 10;
  params.particleCount = 100 + Math.floor(Math.random() * 50) * 100;
  params.lineWidth = Math.round((0.1 + Math.random() * 4.9) * 10) / 10;
  params.baseHue = Math.floor(Math.random() * 361);
  params.hueRange = Math.floor(Math.random() * 361);
  params.saturation = Math.floor(Math.random() * 101);
  params.lightness = 10 + Math.floor(Math.random() * 81);
  params.alpha = Math.round((0.01 + Math.random() * 0.99) * 100) / 100;
  params.bgColor = `#${Math.floor(Math.random() * 0x333333)
    .toString(16)
    .padStart(6, '0')}`;
  params.trail = Math.random() > 0.3;
  params.trailAlpha = Math.round((0.005 + Math.random() * 0.195) * 1000) / 1000;
  initParticles();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initParticles();
  gui.updateDisplay();
});
