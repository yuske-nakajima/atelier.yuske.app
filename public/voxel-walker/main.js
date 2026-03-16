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
import { VoxelCharacter } from './voxel-character.js';
import { WeatherManager } from './weather.js';

// UI要素
const cityNameEl = document.getElementById('city-name');
const temperatureEl = document.getElementById('temperature');
const weatherIconEl = document.getElementById('weather-icon');

/**
 * 天気コードから絵文字アイコンを返す
 * @param {number} code
 * @returns {string}
 */
function weatherCodeToIcon(code) {
  if (code <= 3) return '\u2600\uFE0F';
  if (code <= 48) return '\u2601\uFE0F';
  if (code <= 57) return '\uD83C\uDF27\uFE0F';
  if (code <= 67) return '\uD83C\uDF27\uFE0F';
  if (code <= 77) return '\uD83C\uDF28\uFE0F';
  if (code >= 95) return '\u26C8\uFE0F';
  return '\u2601\uFE0F';
}

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
 * 最寄りの都市名を取得
 * @param {Array<{name: string, lat: number, lng: number, pop: number}>} cities
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
function findNearestCity(cities, lat, lng) {
  if (cities.length === 0) return '';

  let nearest = cities[0];
  let minDist = Number.POSITIVE_INFINITY;

  for (const city of cities) {
    const d = Math.abs(city.lat - lat) + Math.abs(city.lng - lng);
    if (d < minDist) {
      minDist = d;
      nearest = city;
    }
  }

  return minDist < 5 ? nearest.name : '';
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

    // 背景色更新
    updateBackground(scene, w);

    // 実際の移動方向をグリッド座標系で計算
    // グリッド: X=-lng方向, Z=+lat方向
    const dlng = movement.lng - prevLng;
    const dlat = movement.lat - prevLat;
    prevLat = movement.lat;
    prevLng = movement.lng;

    if (Math.abs(dlng) > 0.0001 || Math.abs(dlat) > 0.0001) {
      // キャラの進行方向をグリッド座標系で計算
      // グリッドスクロール: X -= dlng, Z += dlat
      // キャラの見かけの進行方向はスクロールの逆: (+dlng, -dlat)
      // rotation.y=0 で -Z 方向が正面なので atan2(x, z)
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
    ground.update(movement.lat, movement.lng, w.temperature);

    // パーティクル更新
    particles.update(deltaTime, w);

    // UI更新
    if (cityNameEl) {
      const cityName = findNearestCity(cities, movement.lat, movement.lng);
      cityNameEl.textContent = cityName || '\u6D77\u4E0A';
    }
    if (temperatureEl) {
      temperatureEl.textContent = `${w.temperature.toFixed(1)}\u00B0C`;
    }
    if (weatherIconEl) {
      weatherIconEl.textContent = weatherCodeToIcon(w.weatherCode);
    }

    renderer.render(scene, camera);
  }

  animate();
}

init();
