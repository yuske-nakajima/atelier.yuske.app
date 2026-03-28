// @ts-check

import * as THREE from 'https://esm.sh/three@0.172.0';

/**
 * 軌跡描画モジュール
 * スライダーの基準日（0日）から現在のオフセットまでの軌跡を描画する
 * プラス方向は青、マイナス方向は赤
 */

/** 1日あたりの軌跡ポイント数（滑らかさの調整） */
const POINTS_PER_DAY = 4;

/** 軌跡の最大ポイント数 */
const MAX_POINTS = 365 * POINTS_PER_DAY;

/** プラス方向（未来）の色: 青 */
const FUTURE_COLOR = 0x4488ff;

/** マイナス方向（過去）の色: 赤 */
const PAST_COLOR = 0xff4444;

/**
 * @typedef {object} Trail
 * @property {THREE.Line} line - 軌跡のライン
 * @property {THREE.BufferGeometry} geometry - ジオメトリ
 * @property {Float32Array} positions - 頂点座標バッファ
 * @property {THREE.LineBasicMaterial} material - マテリアル
 */

/**
 * 軌跡オブジェクトを作成してシーンに追加する
 * @param {THREE.Scene} scene
 * @returns {Trail}
 */
export function createTrail(scene) {
  const positions = new Float32Array(MAX_POINTS * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);

  const material = new THREE.LineBasicMaterial({
    color: FUTURE_COLOR,
    transparent: true,
    opacity: 0.7,
  });

  const line = new THREE.Line(geometry, material);
  scene.add(line);

  return { line, geometry, positions, material };
}

/**
 * 軌跡を再構築する
 * 基準日（オフセット0）から指定オフセットまでの全ポイントを計算して描画する
 * @param {Trail} trail
 * @param {number} offsetDays - スライダーのオフセット日数（正=未来、負=過去）
 * @param {(dayOffset: number) => THREE.Vector3} calcPosition - 日オフセットからワールド座標を計算する関数
 */
export function rebuildTrail(trail, offsetDays, calcPosition) {
  if (offsetDays === 0) {
    trail.geometry.setDrawRange(0, 0);
    return;
  }

  // 色を設定（プラス=青、マイナス=赤）
  trail.material.color.setHex(offsetDays > 0 ? FUTURE_COLOR : PAST_COLOR);

  const absDays = Math.abs(offsetDays);
  const totalPoints = Math.min(Math.ceil(absDays * POINTS_PER_DAY), MAX_POINTS);
  const step = offsetDays > 0 ? 1 / POINTS_PER_DAY : -1 / POINTS_PER_DAY;

  for (let i = 0; i < totalPoints; i++) {
    const dayOffset = step * (i + 1);
    const pos = calcPosition(dayOffset);
    const idx = i * 3;
    trail.positions[idx] = pos.x;
    trail.positions[idx + 1] = pos.y;
    trail.positions[idx + 2] = pos.z;
  }

  // バッファ更新を通知
  const attr = trail.geometry.getAttribute('position');
  attr.needsUpdate = true;
  trail.geometry.setDrawRange(0, totalPoints);
}
