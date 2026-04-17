// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  particleCount: 600, // 粒子の総数
  colorCount: 5, // 色の種類数
  maxRadius: 80, // 相互作用の最大半径
  minRadius: 12, // 斥力の範囲
  forceScale: 0.6, // 力の強さ
  friction: 0.08, // 摩擦（速度減衰）
  wrap: 1, // 画面端ラップ（0: 反射, 1: 巡回）
  particleSize: 2.6, // 粒子サイズ
  trailFade: 0.18, // 残像フェード
  hueShift: 0, // 全体の色相オフセット
  seed: 1, // 引力行列のシード
};

const defaults = { ...params };

const MAX_COLORS = 6;

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- 引力行列 ---

/**
 * @param {number} seed
 * @returns {() => number}
 */
function createRng(seed) {
  let s = Math.max(1, Math.floor(seed)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** @type {number[][]} */
let attraction = [];

function buildAttraction() {
  const n = Math.max(2, Math.min(MAX_COLORS, Math.round(params.colorCount)));
  const rng = createRng(params.seed);
  attraction = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      row.push(rng() * 2 - 1);
    }
    attraction.push(row);
  }
}

// --- 粒子 ---

/** @typedef {{x:number, y:number, vx:number, vy:number, c:number}} Particle */
/** @type {Particle[]} */
let particles = [];

function generateParticles() {
  const n = Math.round(params.particleCount);
  const colors = Math.max(
    2,
    Math.min(MAX_COLORS, Math.round(params.colorCount)),
  );
  particles = new Array(n);
  for (let i = 0; i < n; i++) {
    particles[i] = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0,
      c: Math.floor(Math.random() * colors),
    };
  }
}

buildAttraction();
generateParticles();

// --- シミュレーション ---

function step() {
  const maxR = params.maxRadius;
  const minR = Math.min(params.minRadius, maxR - 1);
  const fScale = params.forceScale;
  const friction = Math.max(0, Math.min(1, params.friction));
  const w = canvas.width;
  const h = canvas.height;
  const wrap = params.wrap >= 0.5;

  for (let i = 0; i < particles.length; i++) {
    const a = particles[i];
    let fx = 0;
    let fy = 0;
    for (let j = 0; j < particles.length; j++) {
      if (i === j) continue;
      const b = particles[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      if (wrap) {
        if (dx > w / 2) dx -= w;
        else if (dx < -w / 2) dx += w;
        if (dy > h / 2) dy -= h;
        else if (dy < -h / 2) dy += h;
      }
      const d2 = dx * dx + dy * dy;
      if (d2 > maxR * maxR || d2 < 0.0001) continue;
      const d = Math.sqrt(d2);
      let f;
      if (d < minR) {
        f = d / minR - 1;
      } else {
        const t = (d - minR) / (maxR - minR);
        const g = attraction[a.c]?.[b.c] ?? 0;
        f = g * (1 - Math.abs(2 * t - 1));
      }
      fx += (dx / d) * f;
      fy += (dy / d) * f;
    }
    a.vx = (a.vx + fx * fScale) * (1 - friction);
    a.vy = (a.vy + fy * fScale) * (1 - friction);
  }

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (wrap) {
      if (p.x < 0) p.x += w;
      else if (p.x >= w) p.x -= w;
      if (p.y < 0) p.y += h;
      else if (p.y >= h) p.y -= h;
    } else {
      if (p.x < 0) {
        p.x = 0;
        p.vx = -p.vx;
      } else if (p.x > w) {
        p.x = w;
        p.vx = -p.vx;
      }
      if (p.y < 0) {
        p.y = 0;
        p.vy = -p.vy;
      } else if (p.y > h) {
        p.y = h;
        p.vy = -p.vy;
      }
    }
  }
}

function draw() {
  ctx.fillStyle = `rgba(5, 5, 16, ${Math.max(0.02, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const colors = Math.max(
    2,
    Math.min(MAX_COLORS, Math.round(params.colorCount)),
  );
  for (const p of particles) {
    const hue = (p.c / colors) * 360 + params.hueShift;
    ctx.fillStyle = `hsl(${hue}, 85%, 62%)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, params.particleSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  step();
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Particle Life',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'particleCount', 100, 1200, 20).onChange(generateParticles);
gui.add(params, 'colorCount', 2, MAX_COLORS, 1).onChange(() => {
  buildAttraction();
  generateParticles();
});
gui.add(params, 'maxRadius', 20, 200, 1);
gui.add(params, 'minRadius', 4, 40, 1);
gui.add(params, 'forceScale', 0, 2, 0.01);
gui.add(params, 'friction', 0, 0.3, 0.005);
gui.add(params, 'wrap', 0, 1, 1);
gui.add(params, 'particleSize', 1, 6, 0.1);
gui.add(params, 'trailFade', 0.02, 0.6, 0.01);
gui.add(params, 'hueShift', 0, 360, 1);
gui.add(params, 'seed', 1, 9999, 1).onChange(buildAttraction);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.colorCount = r(3, MAX_COLORS, 1);
  params.maxRadius = r(50, 160, 1);
  params.minRadius = r(8, 24, 1);
  params.forceScale = r(0.3, 1.2, 0.01);
  params.friction = r(0.04, 0.15, 0.005);
  params.hueShift = r(0, 360, 1);
  params.seed = r(1, 9999, 1);
  buildAttraction();
  generateParticles();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  buildAttraction();
  generateParticles();
  gui.updateDisplay();
});
