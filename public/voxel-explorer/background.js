// @ts-check

/**
 * 昼夜カラーテーマ（リロードごとにランダム、Canvas 2D 用）
 */

/**
 * HSL 値をオブジェクトとして保持
 * @typedef {{ h: number, s: number, l: number }} HSL
 */

const baseHue = Math.random();

export const theme = {
  /** 昼の空 */
  daySky: { h: baseHue, s: 0.5, l: 0.45 },
  /** 夜の空 */
  nightSky: {
    h: (baseHue + 0.4 + Math.random() * 0.2) % 1,
    s: 0.6,
    l: 0.15,
  },
  /** 昼の光 */
  dayLight: { h: (baseHue + 0.1) % 1, s: 0.5, l: 0.7 },
  /** 夜の光 */
  nightLight: { h: (baseHue + 0.5) % 1, s: 0.4, l: 0.4 },
};

/**
 * HSL を CSS 文字列に変換
 * @param {HSL} hsl
 * @returns {string}
 */
export function hslToString(hsl) {
  return `hsl(${Math.round(hsl.h * 360)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
}

/**
 * 2つの HSL を線形補間
 * @param {HSL} a
 * @param {HSL} b
 * @param {number} t
 * @returns {HSL}
 */
export function lerpHSL(a, b, t) {
  return {
    h: a.h + (b.h - a.h) * t,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
  };
}

/**
 * 昼夜係数（0=夜, 1=昼）
 * @param {number} hour
 * @returns {number}
 */
export function dayNightFactor(hour) {
  if (hour >= 6 && hour < 7) return hour - 6;
  if (hour >= 7 && hour < 17) return 1;
  if (hour >= 17 && hour < 18) return 1 - (hour - 17);
  return 0;
}

/**
 * 現在の背景色を取得
 * @param {number} localHour
 * @param {number} cloudCover
 * @returns {string}
 */
export function getBackgroundColor(localHour, cloudCover) {
  const dnFactor = dayNightFactor(localHour);
  const color = lerpHSL(theme.nightSky, theme.daySky, dnFactor);
  // 雲量で彩度を落とす
  const greyS = color.s * (1 - cloudCover * 0.003);
  return hslToString({ h: color.h, s: greyS, l: color.l });
}
