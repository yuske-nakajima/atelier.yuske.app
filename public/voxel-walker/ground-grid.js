// @ts-check

/**
 * アイソメトリック地面グリッド（都市位置を色で表現）
 */

import * as THREE from 'https://esm.sh/three@0.172.0';
import { theme } from './background.js';

const TILE_COUNT = 21;
const TILE_SIZE = 6.0;
const HALF = Math.floor(TILE_COUNT / 2);

/**
 * テーマカラーベースのタイル色を計算
 * @param {number} dnFactor - 昼夜係数（0=夜, 1=昼）
 * @returns {THREE.Color}
 */
function tileBaseColor(dnFactor) {
  const dayTile = theme.daySky.clone();
  dayTile.offsetHSL(0.05, -0.2, -0.25);
  const nightTile = theme.nightSky.clone();
  nightTile.offsetHSL(0, -0.1, -0.05);
  return nightTile.lerp(dayTile, dnFactor);
}

/**
 * 人口から都市タイルの色を計算（人口が多いほど明るく暖色に）
 * @param {number} pop
 * @returns {THREE.Color}
 */
function popToCityColor(pop) {
  const color = new THREE.Color();
  // 人口 10万〜3000万 を 0〜1 にマッピング
  const t = Math.max(0, Math.min(1, Math.log10(pop / 100000) / 2.5));
  // 小都市→青緑(0.5), 大都市→オレンジ(0.08)
  const hue = 0.5 - t * 0.42;
  const lightness = 0.3 + t * 0.25;
  color.setHSL(hue, 0.6, lightness);
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

    const dummy = new THREE.Object3D();
    let idx = 0;

    for (let row = -HALF; row <= HALF; row++) {
      for (let col = -HALF; col <= HALF; col++) {
        dummy.position.set(col * TILE_SIZE, -2, row * TILE_SIZE);
        dummy.rotation.x = -Math.PI / 2;
        dummy.updateMatrix();
        this.tiles.setMatrixAt(idx, dummy.matrix);
        this.tiles.setColorAt(idx, new THREE.Color(0x2a3a2a));
        idx++;
      }
    }

    this.group.add(this.tiles);
    scene.add(this.group);

    this.scrollX = 0;
    this.scrollZ = 0;
    /** @type {number|undefined} */
    this.prevLat = undefined;
    /** @type {number|undefined} */
    this.prevLng = undefined;
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

    // 近くの都市を取得
    const nearbyCities = this.cities.filter(
      (c) => Math.abs(c.lat - lat) < HALF && Math.abs(c.lng - lng) < HALF,
    );

    // 足跡の色（テーマの補色で光る）
    const footprintColor = theme.dayLight.clone();
    footprintColor.offsetHSL(0.3, 0.1, 0.1);

    // 各タイルの色を決定
    let idx = 0;
    for (let row = -HALF; row <= HALF; row++) {
      for (let col = -HALF; col <= HALF; col++) {
        const tileLat = lat + row;
        const tileLng = lng + col;

        // 都市の色
        let closestDist = Number.POSITIVE_INFINITY;
        let closestPop = 0;
        for (const city of nearbyCities) {
          const d = Math.abs(city.lat - tileLat) + Math.abs(city.lng - tileLng);
          if (d < closestDist) {
            closestDist = d;
            closestPop = city.pop;
          }
        }

        const color =
          closestDist < 2
            ? popToCityColor(closestPop).lerp(baseColor, closestDist / 2)
            : baseColor.clone();

        // 足跡エフェクト: 中心からの距離で明るさを変える
        const distFromCenter = Math.sqrt(row * row + col * col);
        if (distFromCenter < 4) {
          const glow = 1 - distFromCenter / 4;
          color.lerp(footprintColor, glow);
        }

        this.tiles.setColorAt(idx, color);
        idx++;
      }
    }

    if (this.tiles.instanceColor) {
      this.tiles.instanceColor.needsUpdate = true;
    }

    // グリッドスクロール（差分累積で滑らかに移動）
    if (this.prevLat === undefined) {
      this.prevLat = lat;
      this.prevLng = lng;
    }
    const dlat = lat - this.prevLat;
    const dlng = lng - this.prevLng;
    this.prevLat = lat;
    this.prevLng = lng;

    this.scrollX -= dlng * TILE_SIZE;
    this.scrollZ += dlat * TILE_SIZE;

    // タイル1つ分を超えたら巻き戻し（均一グリッドなので見た目は変わらない）
    // 正負どちらでも正しく動くよう、加算してから modulo
    const half = TILE_SIZE / 2;
    this.scrollX =
      ((((this.scrollX + half) % TILE_SIZE) + TILE_SIZE) % TILE_SIZE) - half;
    this.scrollZ =
      ((((this.scrollZ + half) % TILE_SIZE) + TILE_SIZE) % TILE_SIZE) - half;

    this.group.position.x = this.scrollX;
    this.group.position.z = this.scrollZ;
  }
}
