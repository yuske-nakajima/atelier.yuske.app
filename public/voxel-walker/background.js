// @ts-check

/**
 * 天気データに基づく背景色の計算
 */

import * as THREE from 'https://esm.sh/three@0.172.0';

/**
 * 気温を色相にマッピング
 * -10° → 240°(青紫), 0° → 200°(水色), 20° → 80°(黄緑), 35° → 20°(オレンジ赤)
 * @param {number} temp - 気温（℃）
 * @returns {number} 色相（0-360）
 */
function temperatureToHue(temp) {
  const clamped = Math.max(-10, Math.min(35, temp));
  // -10→240, 0→200, 20→80, 35→20 の区間線形補間
  if (clamped <= 0) {
    const t = (clamped + 10) / 10;
    return 240 + (200 - 240) * t;
  }
  if (clamped <= 20) {
    const t = clamped / 20;
    return 200 + (80 - 200) * t;
  }
  const t = (clamped - 20) / 15;
  return 80 + (20 - 80) * t;
}

/**
 * 雲量から明度を計算
 * @param {number} cloudCover - 雲量（0-100%）
 * @returns {number} 明度（0-1）
 */
function cloudToLightness(cloudCover) {
  const c = Math.max(0, Math.min(100, cloudCover));
  return 0.5 - c * 0.002;
}

/**
 * 背景色を計算してシーンに適用
 * @param {THREE.Scene} scene
 * @param {import('./weather.js').WeatherData} weather
 */
export function updateBackground(scene, weather) {
  const hue = temperatureToHue(weather.temperature);
  const lightness = cloudToLightness(weather.cloudCover);
  const saturation = 0.4;

  const color = new THREE.Color();
  color.setHSL(hue / 360, saturation, lightness);
  scene.background = color;
}
