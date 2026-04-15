// @ts-check
import * as THREE from 'https://esm.sh/three@0.172.0';
import { activateRipple, createRipplePool, updateRipples } from './ripple.js';
import { createWater, updateWaterSurface } from './water.js';

// --- パラメータ ---

const params = {
  rainCount: 1000,
  rainSpeed: 2,
  wind: 0.3,
  fogDensity: 0.03,
  bgColor: '#0a0a1e',
  autoRotate: true,
  rippleColor: '#00ccff',
  rippleSpeed: 1,
  rippleCount: 20,
  waveHeight: 0.1,
};

// モバイル判定で雨粒数を制限
const isMobile = window.innerWidth < 768;
if (isMobile) {
  params.rainCount = 500;
}

// --- Three.js セットアップ ---

const container = /** @type {HTMLElement} */ (
  document.getElementById('canvas-container')
);

const scene = new THREE.Scene();
scene.background = new THREE.Color(params.bgColor);
scene.fog = new THREE.FogExp2(params.bgColor, params.fogDensity);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 8, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// --- リサイズ対応 ---

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// --- 雨粒パーティクル ---

/**
 * 雨粒のジオメトリとマテリアルを生成する（Line ベースのストリーク表現）
 * @param {number} count - 雨粒の数
 * @returns {{ lines: THREE.LineSegments, positions: Float32Array }}
 */
function createRainParticles(count) {
  const geometry = new THREE.BufferGeometry();
  // 各雨粒に始点と終点が必要なので count * 2 * 3
  const positions = new Float32Array(count * 2 * 3);

  for (let i = 0; i < count; i++) {
    const i6 = i * 6;
    const x = (Math.random() - 0.5) * 30;
    const y = Math.random() * 20;
    const z = (Math.random() - 0.5) * 30;
    // 始点
    positions[i6] = x;
    positions[i6 + 1] = y;
    positions[i6 + 2] = z;
    // 終点（下に少しずらす = ストリーク長）
    positions[i6 + 3] = x;
    positions[i6 + 4] = y - 0.3;
    positions[i6 + 5] = z;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: '#aaccff',
    transparent: true,
    opacity: 0.4,
  });

  const lines = new THREE.LineSegments(geometry, material);
  return { lines, positions };
}

const { lines: rainLines, positions: rainPositions } = createRainParticles(
  params.rainCount,
);
scene.add(rainLines);

// --- 水面 ---

const { geometry: waterGeometry, pointLight } = createWater(scene);

// --- 波紋プール ---

const ripplePool = createRipplePool(scene, params);

// --- アニメーションループ ---

let cameraAngle = 0;
const cameraRadius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
const cameraHeight = camera.position.y;
let time = 0;

// ライトフラッシュの強度（波紋発生時に増加、毎フレーム減衰）
let flashIntensity = 0;

/** メインのアニメーションループ */
function animate() {
  requestAnimationFrame(animate);
  time += 0.016;

  // --- 雨粒の更新（LineSegments: 始点・終点ペア） ---
  const count = params.rainCount;
  for (let i = 0; i < count; i++) {
    const i6 = i * 6;
    const speed = params.rainSpeed * 0.05;
    const windDrift = params.wind * 0.01;

    // 始点と終点の両方を更新
    rainPositions[i6 + 1] -= speed;
    rainPositions[i6 + 4] -= speed;
    rainPositions[i6] += windDrift;
    rainPositions[i6 + 3] += windDrift;

    // ストリーク長を速度に応じて伸縮
    const streakLength = 0.1 + params.rainSpeed * 0.15;
    rainPositions[i6 + 4] = rainPositions[i6 + 1] - streakLength;

    // 着水判定: y < 0 でリセット
    if (rainPositions[i6 + 1] < 0) {
      // 30% の確率で波紋を発生させる
      if (Math.random() < 0.3) {
        activateRipple(ripplePool, rainPositions[i6], rainPositions[i6 + 2]);
        flashIntensity = 2;
      }

      const newX = (Math.random() - 0.5) * 30;
      const newZ = (Math.random() - 0.5) * 30;
      rainPositions[i6] = newX;
      rainPositions[i6 + 1] = 20;
      rainPositions[i6 + 2] = newZ;
      rainPositions[i6 + 3] = newX;
      rainPositions[i6 + 4] = 20 - streakLength;
      rainPositions[i6 + 5] = newZ;
    }
  }

  const posAttr = rainLines.geometry.getAttribute('position');
  posAttr.needsUpdate = true;

  // --- フラッシュの減衰とライト更新 ---
  flashIntensity *= 0.95;
  pointLight.intensity = 1 + flashIntensity;

  // --- 波紋の更新 ---
  updateRipples(ripplePool, params);

  // --- 水面の頂点変位 ---
  updateWaterSurface(waterGeometry, time, ripplePool, params);

  // --- カメラ自動回転 ---
  if (params.autoRotate) {
    cameraAngle += 0.002;
    camera.position.x = Math.sin(cameraAngle) * cameraRadius;
    camera.position.z = Math.cos(cameraAngle) * cameraRadius;
    camera.position.y = cameraHeight;
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}

animate();

// --- GUI トグル（モバイル） ---

const guiWrapper = /** @type {HTMLElement} */ (
  document.getElementById('gui-wrapper')
);
const guiToggle = /** @type {HTMLButtonElement} */ (
  document.getElementById('gui-toggle')
);

const mql = window.matchMedia('(max-width: 48rem)');
if (mql.matches) {
  guiWrapper.classList.add('collapsed');
}
mql.addEventListener('change', (e) => {
  if (e.matches) {
    guiWrapper.classList.add('collapsed');
  } else {
    guiWrapper.classList.remove('collapsed');
  }
});

guiToggle.addEventListener('click', () => {
  guiWrapper.classList.toggle('collapsed');
});
