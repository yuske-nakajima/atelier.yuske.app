// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 鳥の群れの旋回（マーマレーション）：椋鳥の大群が夕暮れに旋回する現象。
// 3D空間でBoidルールを適用し、波のように変形する群れを表現する。

const params = {
  count: 300, // 鳥の数
  separateDist: 15, // 分離距離
  alignDist: 40, // 整列距離
  cohesionDist: 60, // 結合距離
  separateForce: 2.0, // 分離力
  alignForce: 1.2, // 整列力
  cohesionForce: 0.8, // 結合力
  maxSpeed: 4.0, // 最高速度
  birdHue: 220, // 鳥の色相
  trailFade: 0.2, // フェード強度
  rotSpeed: 0.2, // 視点回転速度
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

/** @typedef {{ x: number, y: number, z: number, vx: number, vy: number, vz: number }} Bird */

/** @type {Bird[]} */
let birds = [];

/**
 * 鳥の群れを初期化する
 */
function initBirds() {
  birds = [];
  const spread = 200;
  for (let i = 0; i < params.count; i++) {
    birds.push({
      x: (Math.random() - 0.5) * spread,
      y: (Math.random() - 0.5) * spread,
      z: (Math.random() - 0.5) * spread,
      vx: (Math.random() - 0.5) * params.maxSpeed,
      vy: (Math.random() - 0.5) * params.maxSpeed,
      vz: (Math.random() - 0.5) * params.maxSpeed,
    });
  }
}
initBirds();

let rotAngle = 0;

/**
 * Boidルールを適用して鳥の速度を更新する
 */
function updateBirds() {
  for (const bird of birds) {
    let sepX = 0,
      sepY = 0,
      sepZ = 0;
    let aliVx = 0,
      aliVy = 0,
      aliVz = 0;
    let cohX = 0,
      cohY = 0,
      cohZ = 0;
    let sepN = 0,
      aliN = 0,
      cohN = 0;

    for (const other of birds) {
      if (other === bird) continue;
      const d = Math.hypot(
        bird.x - other.x,
        bird.y - other.y,
        bird.z - other.z,
      );
      if (d < params.separateDist && d > 0) {
        sepX += (bird.x - other.x) / d;
        sepY += (bird.y - other.y) / d;
        sepZ += (bird.z - other.z) / d;
        sepN++;
      }
      if (d < params.alignDist) {
        aliVx += other.vx;
        aliVy += other.vy;
        aliVz += other.vz;
        aliN++;
      }
      if (d < params.cohesionDist) {
        cohX += other.x;
        cohY += other.y;
        cohZ += other.z;
        cohN++;
      }
    }

    if (sepN > 0) {
      bird.vx += (sepX / sepN) * params.separateForce * 0.05;
      bird.vy += (sepY / sepN) * params.separateForce * 0.05;
      bird.vz += (sepZ / sepN) * params.separateForce * 0.05;
    }
    if (aliN > 0) {
      bird.vx += (aliVx / aliN - bird.vx) * params.alignForce * 0.04;
      bird.vy += (aliVy / aliN - bird.vy) * params.alignForce * 0.04;
      bird.vz += (aliVz / aliN - bird.vz) * params.alignForce * 0.04;
    }
    if (cohN > 0) {
      bird.vx += (cohX / cohN - bird.x) * params.cohesionForce * 0.001;
      bird.vy += (cohY / cohN - bird.y) * params.cohesionForce * 0.001;
      bird.vz += (cohZ / cohN - bird.z) * params.cohesionForce * 0.001;
    }

    // 中心への引力（群れが離散しないよう）
    bird.vx -= bird.x * 0.002;
    bird.vy -= bird.y * 0.002;
    bird.vz -= bird.z * 0.002;

    const speed = Math.hypot(bird.vx, bird.vy, bird.vz);
    if (speed > params.maxSpeed) {
      bird.vx = (bird.vx / speed) * params.maxSpeed;
      bird.vy = (bird.vy / speed) * params.maxSpeed;
      bird.vz = (bird.vz / speed) * params.maxSpeed;
    }

    bird.x += bird.vx;
    bird.y += bird.vy;
    bird.z += bird.vz;
  }
}

/**
 * 3D点を2D投影する
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {{sx: number, sy: number, sz: number}}
 */
function project(x, y, z) {
  const cosA = Math.cos(rotAngle);
  const sinA = Math.sin(rotAngle);
  const x2 = x * cosA - z * sinA;
  const z2 = x * sinA + z * cosA;
  const fov = 600;
  const depth = z2 + 600;
  const scale = fov / depth;
  return {
    sx: canvas.width / 2 + x2 * scale,
    sy: canvas.height / 2 + y * scale,
    sz: z2,
  };
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  rotAngle += params.rotSpeed * 0.005;

  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, w, h);

  updateBirds();

  // 奥から手前の順にソートして描画
  const sorted = birds.slice().sort((a, b) => {
    const pa = project(a.x, a.y, a.z);
    const pb = project(b.x, b.y, b.z);
    return pb.sz - pa.sz;
  });

  for (const bird of sorted) {
    const { sx, sy, sz } = project(bird.x, bird.y, bird.z);
    const depth = (sz + 500) / 1000;
    const size = Math.max(0.5, depth * 5);
    const alpha = Math.max(0.2, depth);
    const hue = params.birdHue + (1 - depth) * 30;
    ctx.fillStyle = `hsla(${hue}, 65%, ${40 + depth * 30}%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
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
  title: 'Bird Murmuration',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 50, 600, 25).onChange(initBirds);
gui.add(params, 'separateDist', 5, 50, 1);
gui.add(params, 'alignDist', 15, 100, 1);
gui.add(params, 'cohesionDist', 20, 150, 1);
gui.add(params, 'separateForce', 0, 5, 0.1);
gui.add(params, 'alignForce', 0, 3, 0.05);
gui.add(params, 'cohesionForce', 0, 3, 0.05);
gui.add(params, 'maxSpeed', 1, 10, 0.1);
gui.add(params, 'birdHue', 0, 360, 1);
gui.add(params, 'rotSpeed', 0, 2, 0.05);

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
  params.separateDist = rand(5, 30, 1);
  params.alignDist = rand(20, 80, 1);
  params.cohesionDist = rand(30, 120, 1);
  params.separateForce = rand(0.5, 4, 0.1);
  params.alignForce = rand(0.3, 2.5, 0.05);
  params.cohesionForce = rand(0.2, 2, 0.05);
  params.maxSpeed = rand(2, 8, 0.1);
  params.birdHue = rand(0, 360, 1);
  initBirds();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initBirds();
  gui.updateDisplay();
});
