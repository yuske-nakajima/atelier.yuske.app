// @ts-check

/**
 * three.js シーン管理（OrthographicCamera でアイソメトリック投影）
 */

import * as THREE from 'https://esm.sh/three@0.172.0';

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{ scene: THREE.Scene, camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer }}
 */
export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // OrthographicCamera でアイソメトリック投影
  const aspect = window.innerWidth / window.innerHeight;
  const frustumSize = 8;
  const camera = new THREE.OrthographicCamera(
    (frustumSize * aspect) / -2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    frustumSize / -2,
    -100,
    100,
  );

  // アイソメトリック角度
  camera.position.set(10, 10, 10);
  camera.lookAt(0, 0, 0);

  // レンダラー
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // ライティング
  const ambientLight = new THREE.AmbientLight(0x666688, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.0);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // リサイズ対応
  window.addEventListener('resize', () => {
    const newAspect = window.innerWidth / window.innerHeight;
    camera.left = (frustumSize * newAspect) / -2;
    camera.right = (frustumSize * newAspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
