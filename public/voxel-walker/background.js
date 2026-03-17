// @ts-check

/**
 * 昼夜カラーテーマ（リロードごとにランダム）
 */

import * as THREE from 'https://esm.sh/three@0.172.0';

// リロードごとにランダムなカラーテーマを生成
const baseHue = Math.random();
const theme = {
  // 昼の空
  daySky: new THREE.Color().setHSL(baseHue, 0.5, 0.45),
  // 夜の空（補色 or 隣接色で鮮やかに）
  nightSky: new THREE.Color().setHSL(
    (baseHue + 0.4 + Math.random() * 0.2) % 1,
    0.6,
    0.15,
  ),
  // 日差し
  dayLight: new THREE.Color().setHSL((baseHue + 0.1) % 1, 0.5, 0.7),
  // 月明かり（夜も色を持つ）
  nightLight: new THREE.Color().setHSL((baseHue + 0.5) % 1, 0.4, 0.4),
};

/**
 * 昼夜係数（0=夜, 1=昼）
 * @param {number} hour
 * @returns {number}
 */
function dayNightFactor(hour) {
  if (hour >= 6 && hour < 7) return hour - 6;
  if (hour >= 7 && hour < 17) return 1;
  if (hour >= 17 && hour < 18) return 1 - (hour - 17);
  return 0;
}

/**
 * @param {THREE.Scene} scene
 * @param {import('./weather.js').WeatherData} weather
 * @param {number} localHour
 */
export function updateBackground(scene, weather, localHour) {
  const dnFactor = dayNightFactor(localHour);

  // 背景色: 昼テーマ ↔ 夜テーマをブレンド
  const color = theme.nightSky.clone().lerp(theme.daySky, dnFactor);
  // 雲量でわずかに彩度を落とす
  const grey = new THREE.Color(0x888888);
  color.lerp(grey, weather.cloudCover * 0.003);
  scene.background = color;

  // ライティング
  const ambient = scene.children.find((c) => c.type === 'AmbientLight');
  const directional = scene.children.find((c) => c.type === 'DirectionalLight');

  if (ambient) {
    const light = /** @type {THREE.AmbientLight} */ (ambient);
    light.intensity = 0.4 + dnFactor * 0.5;
    light.color.copy(theme.nightLight).lerp(theme.dayLight, dnFactor);
  }
  if (directional) {
    const light = /** @type {THREE.DirectionalLight} */ (directional);
    light.intensity = 0.2 + dnFactor * 0.9;
    light.color.copy(theme.nightLight).lerp(theme.dayLight, dnFactor);
  }
}

// カラーテーマをエクスポート（地面タイルでも使う）
export { theme };
