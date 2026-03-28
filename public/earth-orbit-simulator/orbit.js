// @ts-check

/**
 * 天文計算モジュール
 * 地球の公転・自転に関する計算を提供する
 */

/** 地軸傾斜角（23.4度をラジアンに変換） */
export const AXIAL_TILT = (23.4 * Math.PI) / 180;

/** 公転軌道半径（Three.js のシーン単位、bodies.js の地球初期位置と一致） */
export const ORBIT_RADIUS = 30;

/** 公転周期（日） */
const ORBITAL_PERIOD_DAYS = 365.25;

/** 自転周期（ミリ秒、恒星日 = 約23時間56分4秒） */
const SIDEREAL_DAY_MS = 23 * 3600 * 1000 + 56 * 60 * 1000 + 4 * 1000;

/** 基準日: 2024年春分（UTC） */
const VERNAL_EQUINOX = new Date('2024-03-20T03:06:00Z');

/** 1日のミリ秒数 */
const MS_PER_DAY = 24 * 3600 * 1000;

/**
 * @typedef {object} OrbitalPosition
 * @property {number} x - X座標
 * @property {number} z - Z座標
 * @property {number} angle - 公転角度（ラジアン）
 */

/**
 * 現在日時から地球の公転位置を計算する
 * 春分を基準に、経過日数から角度を算出して太陽中心の位置を返す
 * @param {Date} date - 計算対象の日時
 * @returns {OrbitalPosition}
 */
export function getOrbitalPosition(date) {
  const elapsedMs = date.getTime() - VERNAL_EQUINOX.getTime();
  const elapsedDays = elapsedMs / MS_PER_DAY;
  const angle =
    ((2 * Math.PI * elapsedDays) / ORBITAL_PERIOD_DAYS) % (2 * Math.PI);

  return {
    x: ORBIT_RADIUS * Math.cos(angle),
    z: ORBIT_RADIUS * Math.sin(angle),
    angle,
  };
}

/**
 * 現在日時から地球の自転角度を計算する
 * @param {Date} date - 計算対象の日時
 * @returns {number} 自転角度（ラジアン）
 */
export function getRotationAngle(date) {
  const elapsedMs = date.getTime() - VERNAL_EQUINOX.getTime();
  return ((2 * Math.PI * elapsedMs) / SIDEREAL_DAY_MS) % (2 * Math.PI);
}
