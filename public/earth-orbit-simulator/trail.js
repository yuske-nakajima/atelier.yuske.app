// @ts-check

import * as THREE from 'https://esm.sh/three@0.172.0';

/**
 * 軌跡描画モジュール
 * ユーザーマーカーの移動軌跡をリングバッファ方式で描画する
 */

/** 軌跡の最大ポイント数 */
const MAX_POINTS = 2000;

/** 軌跡の色（オレンジ系） */
const TRAIL_COLOR = 0xff6633;

/**
 * @typedef {object} Trail
 * @property {THREE.Line} line - 軌跡のライン
 * @property {Float32Array} positions - 頂点座標バッファ
 * @property {number} head - リングバッファの先頭インデックス
 * @property {number} count - 有効なポイント数
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
  // 初期状態では何も描画しない
  geometry.setDrawRange(0, 0);

  const material = new THREE.LineBasicMaterial({
    color: TRAIL_COLOR,
    transparent: true,
    opacity: 0.7,
  });

  const line = new THREE.Line(geometry, material);
  scene.add(line);

  return { line, positions, head: 0, count: 0 };
}

/**
 * 軌跡に新しいポイントを追加する
 * リングバッファ方式で最大ポイント数を超えたら古いデータを上書きする
 * @param {Trail} trail
 * @param {THREE.Vector3} position - 追加するワールド座標
 */
export function updateTrail(trail, position) {
  const i = trail.head * 3;
  trail.positions[i] = position.x;
  trail.positions[i + 1] = position.y;
  trail.positions[i + 2] = position.z;

  trail.head = (trail.head + 1) % MAX_POINTS;
  if (trail.count < MAX_POINTS) {
    trail.count += 1;
  }

  // バッファ更新を通知
  const attr = trail.line.geometry.getAttribute('position');
  attr.needsUpdate = true;

  // 描画範囲を更新
  if (trail.count < MAX_POINTS) {
    // バッファが一周していない場合は先頭から順に描画
    trail.line.geometry.setDrawRange(0, trail.count);
  } else {
    // バッファが一周した場合は全ポイントを描画
    trail.line.geometry.setDrawRange(0, MAX_POINTS);
  }
}
