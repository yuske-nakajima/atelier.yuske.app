// @ts-check

/** ノート番号の範囲（microKEY25 の中心帯域） */
export const NOTE_MIN = 48;
export const NOTE_MAX = 72;

/** パーティクル上限 */
export const MAX_PARTICLES = 200;

/** パーティクル寿命（秒） */
export const LIFE_MIN = 2;
export const LIFE_MAX = 4;

/** サイズ範囲（Canvas ピクセル） */
export const SIZE_MIN = 8;
export const SIZE_MAX = 48;

/** 残像の強さ範囲（モジュレーションホイール CC#1 で制御） */
export const FADE_MIN = 0.01;
export const FADE_MAX = 0.3;

/** 残像の初期値 */
export const FADE_DEFAULT = 0.1;

/** モジュレーションホイールの CC 番号 */
export const CC_MODULATION = 1;

/**
 * ノート番号から HSL 色相（0-360）を計算する
 * @param {number} note - MIDI ノート番号
 * @returns {number} 色相（0-360）
 */
export function noteToHue(note) {
  const clamped = Math.max(NOTE_MIN, Math.min(NOTE_MAX, note));
  const ratio = (clamped - NOTE_MIN) / (NOTE_MAX - NOTE_MIN);
  return ratio * 360;
}

/**
 * ノート番号からオクターブに基づく形状を返す
 * @param {number} note - MIDI ノート番号
 * @returns {'circle' | 'rect' | 'star'} 形状
 */
export function noteToShape(note) {
  const octave = Math.floor(note / 12);
  if (octave <= 3) return 'circle';
  if (octave === 4) return 'rect';
  return 'star';
}

/**
 * ベロシティからサイズを計算する
 * @param {number} velocity - MIDI ベロシティ (0-127)
 * @returns {number} サイズ（ピクセル）
 */
export function velocityToSize(velocity) {
  const ratio = velocity / 127;
  return SIZE_MIN + ratio * (SIZE_MAX - SIZE_MIN);
}

/**
 * ベロシティから初期透明度を計算する
 * @param {number} velocity - MIDI ベロシティ (0-127)
 * @returns {number} 透明度 (0.3-1.0)
 */
export function velocityToAlpha(velocity) {
  const ratio = velocity / 127;
  return 0.3 + ratio * 0.7;
}

/**
 * CC 値から残像の強さを計算する
 * @param {number} value - CC 値 (0-127)
 * @returns {number} フェード量
 */
export function ccToFade(value) {
  const ratio = value / 127;
  return FADE_MIN + ratio * (FADE_MAX - FADE_MIN);
}
