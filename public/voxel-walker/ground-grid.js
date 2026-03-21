// @ts-check

/**
 * アイソメトリック地面グリッド（都市位置を色で表現）
 * ワールド整数座標に固定されたタイルが、キャラの下をスクロールする
 */

import * as THREE from 'https://esm.sh/three@0.172.0';
import { theme } from './background.js';

const TILE_COUNT = 41;
const TILE_SIZE = 3.0;
const HALF = Math.floor(TILE_COUNT / 2);

/**
 * テーマカラーベースのタイル色を計算
 * @param {number} dnFactor - 昼夜係数（0=夜, 1=昼）
 * @returns {THREE.Color}
 */
function tileBaseColor(dnFactor) {
  const dayTile = theme.daySky.clone();
  dayTile.offsetHSL(0.05, -0.1, -0.15);
  const nightTile = theme.nightSky.clone();
  nightTile.offsetHSL(0, -0.05, -0.03);
  return nightTile.lerp(dayTile, dnFactor);
}

/**
 * 人口から都市タイルの色を計算（コントラスト強め）
 * @param {number} pop
 * @returns {THREE.Color}
 */
function popToCityColor(pop) {
  const color = new THREE.Color();
  const t = Math.max(0, Math.min(1, Math.log10(pop / 100000) / 2.5));
  // 小都市→シアン(0.5), 大都市→オレンジ(0.06) 彩度・明度を大幅アップ
  const hue = 0.5 - t * 0.44;
  const lightness = 0.45 + t * 0.25;
  color.setHSL(hue, 0.9, lightness);
  return color;
}

export class GroundGrid {
  /**
   * @param {THREE.Scene} scene
   * @param {Array<{name: string, lat: number, lng: number, pop: number}>} cities
   */
  constructor(scene, cities) {
    this.group = new THREE.Group();
    this.cities = cities;
    this.dummy = new THREE.Object3D();

    const tileGeom = new THREE.PlaneGeometry(
      TILE_SIZE * 0.995,
      TILE_SIZE * 0.995,
    );
    const tileMat = new THREE.MeshLambertMaterial({
      color: 0x2a3a2a,
      side: THREE.DoubleSide,
    });

    this.tiles = new THREE.InstancedMesh(
      tileGeom,
      tileMat,
      TILE_COUNT * TILE_COUNT,
    );
    this.tiles.receiveShadow = true;

    // 初期配置
    let idx = 0;
    for (let row = -HALF; row <= HALF; row++) {
      for (let col = -HALF; col <= HALF; col++) {
        this.dummy.position.set(col * TILE_SIZE, -2, row * TILE_SIZE);
        this.dummy.rotation.x = -Math.PI / 2;
        this.dummy.updateMatrix();
        this.tiles.setMatrixAt(idx, this.dummy.matrix);
        this.tiles.setColorAt(idx, new THREE.Color(0x2a3a2a));
        idx++;
      }
    }

    this.group.add(this.tiles);
    scene.add(this.group);
  }

  /**
   * @param {number} lat
   * @param {number} lng
   * @param {number} temperature
   * @param {number} localHour - 現地時刻（0-24）
   */
  update(lat, lng, temperature, localHour) {
    const dnFactor =
      localHour >= 7 && localHour < 17
        ? 1
        : localHour >= 6 && localHour < 7
          ? localHour - 6
          : localHour >= 17 && localHour < 18
            ? 1 - (localHour - 17)
            : 0;
    const baseColor = tileBaseColor(dnFactor);

    // キャラの整数タイル座標と小数部
    const charTileRow = Math.floor(lat);
    const charTileCol = Math.floor(lng);
    const fracLat = lat - charTileRow;
    const fracLng = lng - charTileCol;

    // 近くの都市を取得
    const nearbyCities = this.cities.filter(
      (c) => Math.abs(c.lat - lat) < HALF && Math.abs(c.lng - lng) < HALF,
    );

    // 各タイルの位置と色を更新
    let idx = 0;
    for (let row = -HALF; row <= HALF; row++) {
      for (let col = -HALF; col <= HALF; col++) {
        // ワールド整数座標（固定）
        const worldRow = charTileRow + row;
        const worldCol = charTileCol + col;

        // タイル位置: 小数部オフセットでスムーズスクロール
        this.dummy.position.set(
          col * TILE_SIZE - fracLng * TILE_SIZE,
          -2,
          -row * TILE_SIZE + fracLat * TILE_SIZE,
        );
        this.dummy.rotation.x = -Math.PI / 2;
        this.dummy.updateMatrix();
        this.tiles.setMatrixAt(idx, this.dummy.matrix);

        // 都市の色判定
        let closestDist = Number.POSITIVE_INFINITY;
        let closestPop = 0;
        for (const city of nearbyCities) {
          const d =
            Math.abs(city.lat - worldRow) + Math.abs(city.lng - worldCol);
          if (d < closestDist) {
            closestDist = d;
            closestPop = city.pop;
          }
        }

        // 地形（都市）があればその色、なければベース一色
        // 影響範囲 3 タイル、近いほど都市色が強い
        const color =
          closestDist < 3
            ? popToCityColor(closestPop).lerp(baseColor, closestDist / 3)
            : baseColor.clone();

        this.tiles.setColorAt(idx, color);
        idx++;
      }
    }

    this.tiles.instanceMatrix.needsUpdate = true;
    if (this.tiles.instanceColor) {
      this.tiles.instanceColor.needsUpdate = true;
    }
  }
}
