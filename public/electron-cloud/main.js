// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 電子雲：水素原子の電子軌道（s, p, d 殻）の確率密度を
// パーティクルで可視化する量子力学的ビジュアル。

const params = {
  particleCount: 3000, // パーティクル数
  orbital: 0, // 軌道タイプ（0=1s, 1=2p, 2=3d）
  energy: 1.0, // エネルギー（軌道サイズ）
  rotSpeedX: 0.3, // X軸回転速度
  rotSpeedY: 0.5, // Y軸回転速度
  hueBase: 200, // 基本色相
  hueRange: 80, // 色相レンジ
  brightness: 70, // 明度
  fadeAlpha: 0.06, // フェード強度
  pointSize: 1.5, // 点のサイズ
};

const defaults = { ...params };

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

/** @typedef {{ r: number, theta: number, phi: number, prob: number }} ElectronPoint */
/** @type {ElectronPoint[]} */
let points = [];

let rotX = 0;
let rotY = 0;

/**
 * 1s軌道の確率密度（水素様）
 * @param {number} r 半径
 * @returns {number}
 */
function psi1s(r) {
  const a = 1;
  const rho = (2 * r) / a;
  return rho * rho * Math.exp(-rho);
}

/**
 * 2p軌道の確率密度
 * @param {number} r
 * @param {number} theta
 * @returns {number}
 */
function psi2p(r, theta) {
  const a = 1;
  const rho = r / a;
  const angular = Math.cos(theta) ** 2;
  return rho * rho * rho * rho * Math.exp(-rho) * angular;
}

/**
 * 3d軌道の確率密度
 * @param {number} r
 * @param {number} theta
 * @returns {number}
 */
function psi3d(r, theta) {
  const a = 1;
  const rho = (2 * r) / (3 * a);
  const angular = (3 * Math.cos(theta) ** 2 - 1) ** 2;
  return rho ** 4 * Math.exp(-rho) * angular;
}

/**
 * パーティクルをモンテカルロ法でサンプリングする
 */
function initParticles() {
  points = [];
  const n = params.particleCount;
  const scale = Math.min(canvas.width, canvas.height) * 0.35 * params.energy;
  let maxProb = 0;

  for (let i = 0; i < n * 3; i++) {
    const r = Math.random() * scale;
    const theta = Math.acos(1 - 2 * Math.random());
    const phi = Math.random() * Math.PI * 2;
    const rn = (r / scale) * 10;

    let prob = 0;
    if (params.orbital === 0) prob = psi1s(rn);
    else if (params.orbital === 1) prob = psi2p(rn, theta);
    else prob = psi3d(rn, theta);

    maxProb = Math.max(maxProb, prob);
    points.push({ r, theta, phi, prob });
  }

  // 棄却サンプリング
  points = points
    .filter((p) => Math.random() < p.prob / (maxProb + 1e-10))
    .slice(0, n);
}

initParticles();

/**
 * 3D球面座標を直交座標に変換してから投影する
 * @param {number} r
 * @param {number} theta
 * @param {number} phi
 * @returns {{sx: number, sy: number}}
 */
function project(r, theta, phi) {
  const x = r * Math.sin(theta) * Math.cos(phi);
  const y = r * Math.cos(theta);
  const z = r * Math.sin(theta) * Math.sin(phi);

  // 回転
  const y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
  const z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
  const x2 = x * Math.cos(rotY) + z1 * Math.sin(rotY);
  const z2 = -x * Math.sin(rotY) + z1 * Math.cos(rotY);

  const fov = 500;
  const depth = z2 + 600;
  const scale2 = fov / depth;
  return {
    sx: canvas.width / 2 + x2 * scale2,
    sy: canvas.height / 2 + y1 * scale2,
  };
}

function draw() {
  rotX += params.rotSpeedX * 0.003;
  rotY += params.rotSpeedY * 0.005;

  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = `rgba(5, 8, 15, ${params.fadeAlpha})`;
  ctx.fillRect(0, 0, w, h);

  // 中心（核）
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'hsl(60, 90%, 80%)';
  ctx.fill();

  // パーティクル
  for (const p of points) {
    const { sx, sy } = project(p.r, p.theta, p.phi);
    const hue = params.hueBase + (p.prob / 0.05) * params.hueRange;
    const alpha = Math.min(0.9, p.prob * 30 + 0.1);
    ctx.fillStyle = `hsla(${hue}, 80%, ${params.brightness}%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, params.pointSize, 0, Math.PI * 2);
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
  title: 'Electron Cloud',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'particleCount', 500, 8000, 250).onChange(initParticles);
gui.add(params, 'orbital', 0, 2, 1).onChange(initParticles);
gui.add(params, 'energy', 0.3, 3, 0.05).onChange(initParticles);
gui.add(params, 'rotSpeedX', 0, 2, 0.05);
gui.add(params, 'rotSpeedY', 0, 2, 0.05);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueRange', 0, 180, 1);
gui.add(params, 'brightness', 20, 100, 1);
gui.add(params, 'fadeAlpha', 0.01, 0.3, 0.005);
gui.add(params, 'pointSize', 0.5, 5, 0.1);

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
  params.orbital = rand(0, 2, 1);
  params.energy = rand(0.5, 2.5, 0.05);
  params.hueBase = rand(0, 360, 1);
  params.hueRange = rand(30, 150, 1);
  params.brightness = rand(40, 85, 1);
  initParticles();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initParticles();
  gui.updateDisplay();
});
