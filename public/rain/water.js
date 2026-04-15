// @ts-check
import * as THREE from 'https://esm.sh/three@0.172.0';

/**
 * 水面メッシュを作成してシーンに追加する
 * @param {THREE.Scene} scene - シーン
 * @returns {{ mesh: THREE.Mesh, geometry: THREE.PlaneGeometry, pointLight: THREE.PointLight }}
 */
export function createWater(scene) {
  const geometry = new THREE.PlaneGeometry(30, 30, 50, 50);
  const material = new THREE.MeshStandardMaterial({
    color: '#0a1628',
    transparent: true,
    opacity: 0.7,
    roughness: 0.2,
    metalness: 0.6,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  // 水面を照らす環境光
  const ambientLight = new THREE.AmbientLight('#1a1a3e', 0.5);
  scene.add(ambientLight);

  // 水面を上から照らすポイントライト（ネオンカラー反射用）
  const pointLight = new THREE.PointLight('#00ccff', 1, 30);
  pointLight.position.set(0, 5, 0);
  scene.add(pointLight);

  return { mesh, geometry, pointLight };
}

/**
 * @typedef {import('./ripple.js').Ripple} Ripple
 */

/**
 * 水面の頂点を sin 波で変位させる
 * @param {THREE.PlaneGeometry} geometry - 水面のジオメトリ
 * @param {number} time - 経過時間
 * @param {Ripple[]} ripplePool - 波紋プール
 * @param {{ waveHeight: number }} params - パラメータ
 */
export function updateWaterSurface(geometry, time, ripplePool, params) {
  const posAttr = geometry.getAttribute('position');
  const count = posAttr.count;

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);

    // 基本の sin 波
    let y =
      Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * params.waveHeight;

    // アクティブな波紋の影響を加算
    for (const ripple of ripplePool) {
      if (!ripple.active) continue;
      const dx = x - ripple.x;
      const dz = z - ripple.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const progress = ripple.age / ripple.maxAge;
      const rippleRadius = ripple.maxRadius * progress;
      const influence = Math.max(0, 1 - dist / (rippleRadius + 0.1));
      y += Math.sin(dist * 4 - time * 3) * influence * params.waveHeight * 0.5;
    }

    posAttr.setY(i, y);
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}
