// @ts-check

import { createBodies } from './bodies.js';
import { createScene } from './scene.js';

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
  createBodies(scene);

  // レンダリングループ
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init();
