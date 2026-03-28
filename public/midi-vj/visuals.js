// @ts-check

import {
  LIFE_MAX,
  LIFE_MIN,
  MAX_PARTICLES,
  noteToHue,
  noteToShape,
  velocityToAlpha,
  velocityToSize,
} from './config.js';

/**
 * @typedef {object} Particle
 * @property {number} x - X 座標
 * @property {number} y - Y 座標
 * @property {number} vx - X 方向速度
 * @property {number} vy - Y 方向速度
 * @property {number} size - サイズ（半径）
 * @property {number} hue - HSL 色相
 * @property {number} alpha - 現在の透明度
 * @property {number} initialAlpha - 初期透明度
 * @property {'circle' | 'rect' | 'star'} shape - 形状
 * @property {number} life - 残り寿命（秒）
 * @property {number} maxLife - 最大寿命（秒）
 */

/**
 * パーティクルを生成する
 * @param {number} note - MIDI ノート番号
 * @param {number} velocity - MIDI ベロシティ
 * @param {number} canvasWidth - Canvas 幅
 * @param {number} canvasHeight - Canvas 高さ
 * @returns {Particle}
 */
export function createParticle(note, velocity, canvasWidth, canvasHeight) {
  const life = LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN);
  const initialAlpha = velocityToAlpha(velocity);

  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: (Math.random() - 0.5) * 30,
    vy: -(20 + Math.random() * 40),
    size: velocityToSize(velocity),
    hue: noteToHue(note),
    alpha: initialAlpha,
    initialAlpha,
    shape: noteToShape(note),
    life,
    maxLife: life,
  };
}

/**
 * パーティクル配列を更新し、生存中のものだけ返す
 * @param {Particle[]} particles - パーティクル配列
 * @param {number} dt - 経過時間（秒）
 * @returns {Particle[]} 生存パーティクル
 */
export function updateParticles(particles, dt) {
  const alive = [];

  for (const p of particles) {
    p.life -= dt;
    if (p.life <= 0) continue;

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const lifeRatio = p.life / p.maxLife;
    p.alpha = p.initialAlpha * lifeRatio;

    alive.push(p);
  }

  return alive;
}

/**
 * パーティクルを配列に追加する（上限を超えたら古いものから削除）
 * @param {Particle[]} particles - パーティクル配列
 * @param {Particle} particle - 追加するパーティクル
 * @returns {Particle[]} 更新後の配列
 */
export function addParticle(particles, particle) {
  const next = [...particles, particle];
  if (next.length > MAX_PARTICLES) {
    return next.slice(next.length - MAX_PARTICLES);
  }
  return next;
}

/**
 * 星形のパスを描く
 * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} size - 外径
 */
function drawStar(ctx, cx, cy, size) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

/**
 * パーティクルを Canvas に描画する
 * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
 * @param {Particle[]} particles - パーティクル配列
 */
export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const color = `hsla(${p.hue}, 80%, 60%, ${p.alpha})`;
    ctx.fillStyle = color;

    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    if (p.shape === 'rect') {
      ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      continue;
    }

    drawStar(ctx, p.x, p.y, p.size);
    ctx.fill();
  }
}

/**
 * 半透明黒で残像効果を描く
 * @param {CanvasRenderingContext2D} ctx - Canvas コンテキスト
 * @param {number} fadeAmount - 不透明度 (0-1)
 * @param {number} width - Canvas 幅
 * @param {number} height - Canvas 高さ
 */
export function drawBackground(ctx, fadeAmount, width, height) {
  ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmount})`;
  ctx.fillRect(0, 0, width, height);
}
