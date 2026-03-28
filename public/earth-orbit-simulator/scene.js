// @ts-check

import * as THREE from 'https://esm.sh/three@0.172.0';
import { OrbitControls } from 'https://esm.sh/three@0.172.0/addons/controls/OrbitControls.js';

/**
 * @typedef {object} SceneContext
 * @property {THREE.Scene} scene
 * @property {THREE.PerspectiveCamera} camera
 * @property {THREE.WebGLRenderer} renderer
 * @property {OrbitControls} controls
 */

/**
 * Three.js のシーン・カメラ・レンダラー・コントロールをセットアップする
 * @param {HTMLCanvasElement} canvas - 描画先の canvas 要素
 * @returns {SceneContext}
 */
export function createScene(canvas) {
  // シーン
  const scene = new THREE.Scene();

  // カメラ（パースペクティブ）
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
  camera.position.set(0, 30, 60);
  camera.lookAt(0, 0, 0);

  // レンダラー
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 環境光（弱め）
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 500;

  // ウィンドウリサイズ対応
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  return { scene, camera, renderer, controls };
}
