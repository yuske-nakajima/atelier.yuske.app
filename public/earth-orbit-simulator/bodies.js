// @ts-check

import * as THREE from 'https://esm.sh/three@0.172.0';

import { ORBIT_RADIUS } from './orbit.js';

/**
 * @typedef {object} Bodies
 * @property {THREE.Mesh} sun - 太陽メッシュ
 * @property {THREE.Mesh} earth - 地球メッシュ
 * @property {THREE.Points} starField - 星空パーティクル
 * @property {THREE.Line} orbitLine - 公転軌道の線
 */

/** 地球の半径（SphereGeometry の第1引数と一致させる） */
const EARTH_RADIUS = 1;

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
 * 公転軌道を薄い線で描画してシーンに追加する
 * @param {THREE.Scene} scene
 * @returns {THREE.Line}
 */
function createOrbitLine(scene) {
  const segments = 128;
  const positions = new Float32Array((segments + 1) * 3);

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions[i * 3] = ORBIT_RADIUS * Math.cos(angle);
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = ORBIT_RADIUS * Math.sin(angle);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
  });

  const orbitLine = new THREE.Line(geometry, material);
  scene.add(orbitLine);

  return orbitLine;
}

/**
 * ユーザーマーカー（赤い小さな球体）を作成してシーンに追加する
 * @param {THREE.Scene} scene
 * @returns {THREE.Mesh}
 */
export function createUserMarker(scene) {
  const radius = EARTH_RADIUS * 0.07;
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xff3333 });
  const marker = new THREE.Mesh(geometry, material);
  scene.add(marker);
  return marker;
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
  const orbitLine = createOrbitLine(scene);

  return { sun, earth, starField, orbitLine };
}
