// @ts-check
import SimpleGuiGrid from '../simple-gui-grid/simple-gui-grid.js';

// --- パラメータ ---

const params = {
  sigma: 9.5,
  rho: 30,
  beta: 2.2,
  speed: 1.2,
  zoom: 8,
  autoRotate: 0.3,
  trailLength: 4000,
  thickness: 2,
  color: '#4ecdc4',
  glow: true,
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

// --- アトラクター状態 ---

/** @type {{ x: number, y: number, z: number }[]} */
let points = [];
let px = 0.1;
let py = 0;
let pz = 0;

// カメラ回転
let camX = 0.4;
let camY = -0.8;
let dragging = false;
let prevMx = 0;
let prevMy = 0;

canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  prevMx = e.clientX;
  prevMy = e.clientY;
});

window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  camY += (e.clientX - prevMx) * 0.005;
  camX += (e.clientY - prevMy) * 0.005;
  prevMx = e.clientX;
  prevMy = e.clientY;
});

window.addEventListener('pointerup', () => {
  dragging = false;
});

/**
 * 3D → 2D 投影
 * @param {number} ax
 * @param {number} ay
 * @param {number} az
 * @returns {{ x: number, y: number, depth: number }}
 */
function project(ax, ay, az) {
  const cy = Math.cos(camY);
  const sy = Math.sin(camY);
  const x1 = ax * cy - az * sy;
  const z1 = ax * sy + az * cy;

  const cx = Math.cos(camX);
  const sx = Math.sin(camX);
  const y1 = ay * cx - z1 * sx;
  const z2 = ay * sx + z1 * cx;

  return {
    x: canvas.width / 2 + x1 * params.zoom,
    y: canvas.height / 2 + y1 * params.zoom,
    depth: z2,
  };
}

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

/** メインの描画ループ */
function draw() {
  // 完全クリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!params.visible) {
    requestAnimationFrame(draw);
    return;
  }

  // 自動回転
  if (!dragging && params.autoRotate > 0) {
    camY += params.autoRotate * 0.002;
  }

  // Lorenz 方程式
  const dt = 0.004 * params.speed;
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const dx = params.sigma * (py - px) * dt;
    const dy = (px * (params.rho - pz) - py) * dt;
    const dz = (px * py - params.beta * pz) * dt;
    px += dx;
    py += dy;
    pz += dz;
    points.push({ x: px, y: py, z: pz });
  }

  // 長さ制限
  while (points.length > params.trailLength) {
    points.shift();
  }

  const { r, g, b } = hexToRgb(params.color);

  // グロー効果のレイヤー
  if (params.glow) {
    ctx.shadowColor = params.color;
    ctx.shadowBlur = 12;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  // 軌跡描画: 単色グラデーション（尾→先端で明るく・太く）
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 1; i < points.length; i++) {
    const ratio = i / points.length;
    const p0 = project(points[i - 1].x, points[i - 1].y, points[i - 1].z);
    const p1 = project(points[i].x, points[i].y, points[i].z);

    // 奥行きで明るさを変える
    const depthFade = Math.max(0.3, Math.min(1, 1 - p1.depth * 0.005));
    const alpha = ratio * ratio * depthFade * 0.9;
    const brightness = 0.4 + ratio * 0.6;

    ctx.beginPath();
    ctx.strokeStyle = `rgba(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)}, ${alpha})`;
    ctx.lineWidth = params.thickness * (0.3 + ratio * 0.7);
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }

  // グロー後クリア
  ctx.shadowBlur = 0;

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI セットアップ ---

const gui = new SimpleGuiGrid({ title: 'Attractor' });

gui.add(params, 'sigma', 1, 20, 0.1);
gui.add(params, 'rho', 1, 50, 0.1);
gui.add(params, 'beta', 0.1, 10, 0.1);
gui.add(params, 'speed', 0.1, 5, 0.1);
gui.add(params, 'zoom', 2, 20, 0.5);
gui.add(params, 'visible');

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  points = [];
  px = 0.1;
  py = 0;
  pz = 0;
  camX = 0.4;
  camY = -0.8;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gui.updateDisplay();
});

const folder = gui.addFolder('Style');
folder.addColor(params, 'color');
folder.add(params, 'autoRotate', 0, 2, 0.1);
folder.add(params, 'trailLength', 500, 10000, 100);
folder.add(params, 'thickness', 0.5, 5, 0.1);
folder.add(params, 'glow');
