// @ts-check

/**
 * Geolocation API ラッパーモジュール
 * ユーザーの現在位置を取得する
 */

/**
 * @typedef {object} GeoCoords
 * @property {number} latitude - 緯度（度）
 * @property {number} longitude - 経度（度）
 */

/** デフォルト座標（東京） */
const DEFAULT_COORDS = { latitude: 35.6762, longitude: 139.6503 };

/** タイムアウト（ミリ秒） */
const TIMEOUT_MS = 5000;

/**
 * ユーザーの現在位置を取得する
 * Geolocation API が使えない場合やエラー時はデフォルト座標（東京）を返す
 * @returns {Promise<GeoCoords>}
 */
export function getUserLocation() {
  if (!navigator.geolocation) {
    return Promise.resolve(DEFAULT_COORDS);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        // エラー時はデフォルト座標にフォールバック
        resolve(DEFAULT_COORDS);
      },
      {
        enableHighAccuracy: false,
        timeout: TIMEOUT_MS,
        maximumAge: 60000,
      },
    );
  });
}
