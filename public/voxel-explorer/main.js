// @ts-check

/**
 * Voxel Explorer - エントリポイント
 *
 * voxel-walker の俯瞰版。ドラクエ風トップダウン視点で
 * 天気連動ボクセルキャラが地球上を歩き回る。
 */

import { getBackgroundColor } from './background.js';
import { TopDownCharacter } from './character.js';
import { Ground } from './ground.js';
import { MovementSystem } from './movement.js';
import { Particles } from './particles.js';
import { setupTrailMap } from './trail-map.js';
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
 * 経過時間と経度から現地時刻を計算（120秒で1日サイクル）
 * @param {number} elapsedSec
 * @param {number} lng
 * @returns {number} 0〜24
 */
function calcLocalHour(elapsedSec, lng) {
  const timeHour = (elapsedSec / 120) * 24;
  const lngOffset = lng / 15;
  return (((timeHour + lngOffset) % 24) + 24) % 24;
}

/**
 * 移動角度（ラジアン）をドラクエ風 8方向の度数に変換
 * @param {number} dlng - 経度の変化
 * @param {number} dlat - 緯度の変化
 * @returns {number} 度（北=0、時計回り）
 */
function calcHeadingDeg(dlng, dlat) {
  if (Math.abs(dlng) < 0.0001 && Math.abs(dlat) < 0.0001) return -1;
  // atan2: 北(+lat)=0度、東(+lng)=90度
  const rad = Math.atan2(dlng, dlat);
  return ((rad * 180) / Math.PI + 360) % 360;
}

async function init() {
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('canvas')
  );
  if (!canvas) return;

  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

  const cities = await loadCities();
  const character = new TopDownCharacter();
  const ground = new Ground(cities);
  const weather = new WeatherManager();
  const particles = new Particles();
  const movement = new MovementSystem();

  let lastTime = performance.now();
  let prevLat = movement.lat;
  let prevLng = movement.lng;
  let currentHeadingDeg = 0;

  // 初回天気データ取得
  weather.fetch(movement.lat, movement.lng);

  // 軌跡マップオーバーレイ
  setupTrailMap(ground.visited, movement);

  /** キャンバスサイズをウィンドウに合わせる */
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

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

    // 昼夜サイクル
    const localHour = calcLocalHour(time, movement.lng);

    // 移動方向の計算
    const dlng = movement.lng - prevLng;
    const dlat = movement.lat - prevLat;
    prevLat = movement.lat;
    prevLng = movement.lng;

    const newHeading = calcHeadingDeg(dlng, dlat);
    if (newHeading >= 0) {
      currentHeadingDeg = newHeading;
    }

    // キャラクター更新
    character.update(deltaTime, currentHeadingDeg);

    // --- 描画 ---
    const { width, height } = canvas;

    // 背景
    ctx.fillStyle = getBackgroundColor(localHour, w.cloudCover);
    ctx.fillRect(0, 0, width, height);

    // 地面
    ground.draw(ctx, width, height, movement.lat, movement.lng, localHour);

    // キャラクター（画面中央）
    character.draw(ctx, width / 2, height / 2, 1);

    // パーティクル
    particles.draw(ctx, width, height, deltaTime, w);
  }

  animate();
}

init();
