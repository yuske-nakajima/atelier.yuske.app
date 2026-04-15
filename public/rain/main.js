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
 * 雨粒のジオメトリとマテリアルを生成する
 * @param {number} count - 雨粒の数
 * @returns {{ points: THREE.Points, positions: Float32Array }}
 */
function createRainParticles(count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 30;
    positions[i3 + 1] = Math.random() * 20;
    positions[i3 + 2] = (Math.random() - 0.5) * 30;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: '#aaccff',
    size: 0.05,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  return { points, positions };
}

const { points: rainPoints, positions: rainPositions } = createRainParticles(
  params.rainCount,
);
scene.add(rainPoints);

// --- 水面 ---

const { geometry: waterGeometry } = createWater(scene);

// --- 波紋プール ---

const ripplePool = createRipplePool(scene, params);

// --- アニメーションループ ---

let cameraAngle = 0;
const cameraRadius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
const cameraHeight = camera.position.y;
let time = 0;

/** メインのアニメーションループ */
function animate() {
  requestAnimationFrame(animate);
  time += 0.016;

  // --- 雨粒の更新 ---
  const count = params.rainCount;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    rainPositions[i3 + 1] -= params.rainSpeed * 0.05;
    rainPositions[i3] += params.wind * 0.01;

    // 着水判定: y < 0 でリセット
    if (rainPositions[i3 + 1] < 0) {
      // 30% の確率で波紋を発生させる
      if (Math.random() < 0.3) {
        activateRipple(ripplePool, rainPositions[i3], rainPositions[i3 + 2]);
      }

      rainPositions[i3 + 1] = 20;
      rainPositions[i3] = (Math.random() - 0.5) * 30;
      rainPositions[i3 + 2] = (Math.random() - 0.5) * 30;
    }
  }

  const posAttr = rainPoints.geometry.getAttribute('position');
  posAttr.needsUpdate = true;

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
