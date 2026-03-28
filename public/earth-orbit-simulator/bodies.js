// @ts-check

import * as THREE from 'https://esm.sh/three@0.172.0';

/**
 * @typedef {object} Bodies
 * @property {THREE.Mesh} sun - 太陽メッシュ
 * @property {THREE.Mesh} earth - 地球メッシュ
 * @property {THREE.Points} starField - 星空パーティクル
 */

/**
 * 太陽を作成してシーンに追加する
 * @param {THREE.Scene} scene
 * @returns {THREE.Mesh}
 */
function createSun(scene) {
  const geometry = new THREE.SphereGeometry(3, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
  });
  const sun = new THREE.Mesh(geometry, material);
  sun.position.set(0, 0, 0);
  scene.add(sun);

  // 太陽からの光源
  const pointLight = new THREE.PointLight(0xffffff, 2, 300);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  return sun;
}

/**
 * 地球を作成してシーンに追加する
 * @param {THREE.Scene} scene
 * @returns {THREE.Mesh}
 */
function createEarth(scene) {
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    roughness: 0.7,
    metalness: 0.1,
  });
  const earth = new THREE.Mesh(geometry, material);
  earth.position.set(30, 0, 0);
  scene.add(earth);

  return earth;
}

/**
 * 星空パーティクルを作成してシーンに追加する
 * @param {THREE.Scene} scene
 * @returns {THREE.Points}
 */
function createStarField(scene) {
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    // 球状に分布させる（遠方）
    const radius = 500 + Math.random() * 500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.8,
    sizeAttenuation: true,
  });

  const starField = new THREE.Points(geometry, material);
  scene.add(starField);

  return starField;
}

/**
 * 全天体オブジェクトを作成してシーンに追加する
 * @param {THREE.Scene} scene
 * @returns {Bodies}
 */
export function createBodies(scene) {
  const sun = createSun(scene);
  const earth = createEarth(scene);
  const starField = createStarField(scene);

  return { sun, earth, starField };
}
