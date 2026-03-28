// @ts-check

import { createBodies } from './bodies.js';
import { AXIAL_TILT, getOrbitalPosition, getRotationAngle } from './orbit.js';
import { createScene } from './scene.js';

/** 時間加速倍率（1秒 = 1日相当） */
const TIME_SCALE = 24 * 3600 * 1000;

/**
 * アプリケーションのエントリーポイント
 */
function init() {
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
    earth.rotation.y = getRotationAngle(simDate);

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init();
