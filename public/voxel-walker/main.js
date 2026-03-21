// @ts-check

/**
 * Voxel Walker - エントリポイント
 *
 * リアルタイム天気データに反応するプロシージャルVoxelキャラクターが
 * 地球上を巨人のように歩き回るジェネラティブアート
 */

import { updateBackground } from './background.js';
import { GroundGrid } from './ground-grid.js';
import { MovementSystem } from './movement.js';
import { ParticleSystem } from './particles.js';
import { createScene } from './scene.js';
import { setupTrailMap } from './trail-map.js';
import { VoxelCharacter } from './voxel-character.js';
import { WeatherManager } from './weather.js';

/**
 * 都市データを読み込む
 * @returns {Promise<Array<{name: string, lat: number, lng: number, pop: number}>>}
 */
async function loadCities() {
  try {
    const res = await fetch('./cities.json');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * アプリ内の経過時間から昼夜サイクルを計算（約2分で1日）
 * 経度の移動も加味して、東に進むと朝、西に進むと夜になる感覚を出す
 * @param {number} elapsedSec - アプリ起動からの経過秒数
 * @param {number} lng - 現在の経度
 * @returns {number} 0〜24
 */
function calcLocalHour(elapsedSec, lng) {
  // 120秒で24時間（1日サイクル）
  const timeHour = (elapsedSec / 120) * 24;
  // 経度による時差も加味
  const lngOffset = lng / 15;
  return (((timeHour + lngOffset) % 24) + 24) % 24;
}

async function init() {
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('canvas')
  );
  if (!canvas) return;

  const cities = await loadCities();
  const { scene, camera, renderer } = createScene(canvas);
  const character = new VoxelCharacter(scene);
  const ground = new GroundGrid(scene, cities);
  const weather = new WeatherManager();
  const particles = new ParticleSystem(scene);
  const movement = new MovementSystem();

  let lastTime = performance.now();
  let prevLat = movement.lat;
  let prevLng = movement.lng;
  let smoothHeading = 0;

  // 初回天気データ取得
  weather.fetch(movement.lat, movement.lng);

  // 軌跡マップオーバーレイ
  setupTrailMap(ground.visited, movement);

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    const time = now / 1000;

    // 天気更新
    const w = weather.update(now, movement.lat, movement.lng);

    // 移動更新
    movement.update(w.windDirection, w.windSpeed, deltaTime);

    // 昼夜サイクル（約2分で1日）
    const localHour = calcLocalHour(time, movement.lng);

    // 背景色更新（昼夜対応）
    updateBackground(scene, w, localHour);

    // 実際の移動方向をグリッド座標系で計算
    const dlng = movement.lng - prevLng;
    const dlat = movement.lat - prevLat;
    prevLat = movement.lat;
    prevLng = movement.lng;

    if (Math.abs(dlng) > 0.0001 || Math.abs(dlat) > 0.0001) {
      smoothHeading = Math.atan2(dlng, -dlat);
    }

    // キャラクター更新
    character.update(
      deltaTime,
      time,
      w.weatherCode,
      w.windSpeed,
      smoothHeading,
    );

    // 地面更新
    ground.update(movement.lat, movement.lng, w.temperature, localHour);

    // パーティクル更新
    particles.update(deltaTime, w);

    renderer.render(scene, camera);
  }

  animate();
}

init();
