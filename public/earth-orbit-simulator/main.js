// @ts-check

import * as THREE from 'https://esm.sh/three@0.172.0';

import { createBodies, createUserMarker } from './bodies.js';
import { getUserLocation } from './geolocation.js';
import { AXIAL_TILT, getOrbitalPosition, getRotationAngle } from './orbit.js';
import { createScene } from './scene.js';
import { createTrail, updateTrail } from './trail.js';
import { createUI } from './ui.js';

/** 1日のミリ秒数 */
const MS_PER_DAY = 24 * 3600 * 1000;

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

// UI コントロールを早期初期化（WebGL に依存しない）
const ui = createUI();

/** スライダーによるオフセット（日数） */
let sliderOffsetDays = 0;

// スライダー変更時の処理
ui.onSliderChange((offset) => {
  sliderOffsetDays = offset;
});

/**
 * 現在のシミュレーション日時を計算して返す
 * 現在時刻 + スライダーオフセット（日数）
 * @returns {Date}
 */
function getSimDate() {
  return new Date(Date.now() + sliderOffsetDays * MS_PER_DAY);
}

// UI の時刻表示を常に更新（WebGL に依存しない独立ループ）
function updateTimeDisplayLoop() {
  requestAnimationFrame(updateTimeDisplayLoop);
  ui.updateTimeDisplay(getSimDate());
}
updateTimeDisplayLoop();

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

  // ユーザー位置を取得（情報パネル表示にも使用）
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

  /** 前フレームのスライダーオフセット（変化検出用） */
  let prevSliderOffset = sliderOffsetDays;

  // レンダリングループ（3D 描画のみ担当）
  function animate() {
    requestAnimationFrame(animate);

    // 現在のシミュレーション日時を取得
    const simDate = getSimDate();

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

    // スライダーが動いたときのみ軌跡を更新
    if (sliderOffsetDays !== prevSliderOffset) {
      updateTrail(trail, worldPos);
      prevSliderOffset = sliderOffsetDays;
    }

    // 情報パネルを更新
    const orbitalAngleDeg = ((pos.angle * 180) / Math.PI) % 360;
    const rotationAngleDeg = ((rotationY * 180) / Math.PI) % 360;
    const sunDistance = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    ui.updateInfoPanel({
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
      simDate,
      orbitalAngleDeg,
      rotationAngleDeg,
      sunDistance,
    });

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init();
