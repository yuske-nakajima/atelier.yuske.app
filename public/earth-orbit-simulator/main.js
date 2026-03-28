// @ts-check

import * as THREE from 'https://esm.sh/three@0.172.0';

import { createBodies, createUserMarker } from './bodies.js';
import { getUserLocation } from './geolocation.js';
import { AXIAL_TILT, getOrbitalPosition, getRotationAngle } from './orbit.js';
import { createScene } from './scene.js';
import { createTrail, updateTrail } from './trail.js';

/** 時間加速倍率（1秒 = 1日相当） */
const TIME_SCALE = 24 * 3600 * 1000;

/** 地球の半径（bodies.js の SphereGeometry と一致） */
const EARTH_RADIUS = 1;

/**
 * 緯度・経度から地球表面上のローカル座標を算出する（球面座標→直交座標）
 * @param {number} latitude - 緯度（度）
 * @param {number} longitude - 経度（度）
 * @param {number} radius - 球の半径
 * @returns {THREE.Vector3}
 */
function geoToLocalPosition(latitude, longitude, radius) {
  const latRad = (latitude * Math.PI) / 180;
  const lonRad = (longitude * Math.PI) / 180;

  // Three.js の座標系: Y が上、X-Z が水平面
  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);

  return new THREE.Vector3(x, y, z);
}

/**
 * ユーザーのローカル座標を地球の自転・地軸傾斜・公転位置を反映したワールド座標に変換する
 * @param {THREE.Vector3} localPos - 地球表面上のローカル座標
 * @param {number} rotationY - 地球の自転角度（ラジアン）
 * @param {number} axialTilt - 地軸傾斜角（ラジアン）
 * @param {{ x: number, z: number }} orbitalPos - 地球の公転位置
 * @returns {THREE.Vector3}
 */
function localToWorldPosition(localPos, rotationY, axialTilt, orbitalPos) {
  const pos = localPos.clone();

  // 自転（Y軸周り）を適用
  pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);

  // 地軸傾斜（Z軸周り）を適用
  pos.applyAxisAngle(new THREE.Vector3(0, 0, 1), axialTilt);

  // 公転位置を加算
  pos.x += orbitalPos.x;
  pos.z += orbitalPos.z;

  return pos;
}

/**
 * アプリケーションのエントリーポイント
 */
async function init() {
  const canvas = /** @type {HTMLCanvasElement | null} */ (
    document.getElementById('canvas')
  );
  if (!canvas) {
    throw new Error('canvas 要素が見つかりません');
  }

  // シーンセットアップ
  const { scene, camera, renderer, controls } = createScene(canvas);

  // 天体オブジェクト作成
  const { earth } = createBodies(scene);

  // 地軸傾斜を設定
  earth.rotation.z = AXIAL_TILT;

  // ユーザー位置を取得
  const userCoords = await getUserLocation();

  // ユーザーマーカーを作成
  const userMarker = createUserMarker(scene);

  // 軌跡を作成
  const trail = createTrail(scene);

  // ユーザーの地球表面上ローカル座標を事前計算
  const userLocalPos = geoToLocalPosition(
    userCoords.latitude,
    userCoords.longitude,
    EARTH_RADIUS,
  );

  // 開始時刻を記録（加速時間計算用）
  const startRealTime = Date.now();
  const startSimTime = Date.now();

  // レンダリングループ
  function animate() {
    requestAnimationFrame(animate);

    // 加速されたシミュレーション時刻を算出
    const elapsed = Date.now() - startRealTime;
    const simDate = new Date(startSimTime + elapsed * TIME_SCALE);

    // 公転位置を更新
    const pos = getOrbitalPosition(simDate);
    earth.position.x = pos.x;
    earth.position.z = pos.z;

    // 自転角度を更新
    const rotationY = getRotationAngle(simDate);
    earth.rotation.y = rotationY;

    // ユーザーマーカーのワールド座標を計算
    const worldPos = localToWorldPosition(
      userLocalPos,
      rotationY,
      AXIAL_TILT,
      pos,
    );
    userMarker.position.copy(worldPos);

    // 軌跡を更新
    updateTrail(trail, worldPos);

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init();
