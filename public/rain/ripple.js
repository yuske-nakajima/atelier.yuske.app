// @ts-check
import * as THREE from 'https://esm.sh/three@0.172.0';

/**
 * @typedef {{
 *   mesh: THREE.Mesh,
 *   active: boolean,
 *   age: number,
 *   maxAge: number,
 *   x: number,
 *   z: number,
 *   maxRadius: number
 * }} Ripple
 */

/**
 * 波紋オブジェクトプールを作成する
 * @param {THREE.Scene} scene - シーン
 * @param {{ rippleCount: number, rippleColor: string }} params - パラメータ
 * @returns {Ripple[]}
 */
export function createRipplePool(scene, params) {
  /** @type {Ripple[]} */
  const pool = [];
  const geometry = new THREE.RingGeometry(0.1, 0.3, 32);

  for (let i = 0; i < params.rippleCount; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: params.rippleColor,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    scene.add(mesh);

    pool.push({
      mesh,
      active: false,
      age: 0,
      maxAge: 2,
      x: 0,
      z: 0,
      maxRadius: 2,
    });
  }

  return pool;
}

/**
 * 指定座標で波紋を発生させる
 * @param {Ripple[]} pool - 波紋プール
 * @param {number} x - 着水 x 座標
 * @param {number} z - 着水 z 座標
 */
export function activateRipple(pool, x, z) {
  const ripple = pool.find((r) => !r.active);
  if (!ripple) return;

  ripple.mesh.position.set(x, 0.01, z);
  ripple.mesh.scale.set(1, 1, 1);
  const mat = /** @type {THREE.MeshBasicMaterial} */ (ripple.mesh.material);
  mat.opacity = 0.8;
  ripple.active = true;
  ripple.age = 0;
  ripple.maxAge = 2;
  ripple.x = x;
  ripple.z = z;
  ripple.mesh.visible = true;
}

/**
 * 波紋プールを更新する
 * @param {Ripple[]} pool - 波紋プール
 * @param {{ rippleSpeed: number }} params - パラメータ
 */
export function updateRipples(pool, params) {
  for (const ripple of pool) {
    if (!ripple.active) continue;

    ripple.age += 0.016 * params.rippleSpeed;
    const progress = ripple.age / ripple.maxAge;

    // スケーリングでリングを拡大
    const scale = progress * 5;
    ripple.mesh.scale.set(scale, scale, 1);

    // フェードアウト
    const mat = /** @type {THREE.MeshBasicMaterial} */ (ripple.mesh.material);
    mat.opacity = 0.8 * (1 - progress);

    // 寿命が尽きたら非表示
    if (ripple.age >= ripple.maxAge) {
      ripple.active = false;
      ripple.mesh.visible = false;
    }
  }
}
