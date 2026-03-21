// @ts-check

/**
 * トップダウン タイルマップ地面（都市色・昼夜対応）
 * ワールド整数座標に固定されたタイルが、キャラの下をスクロールする
 * 通過したタイルに「済」を表示して軌跡を残す
 */

import { dayNightFactor, hslToString, lerpHSL, theme } from './background.js';

const TILE_PX = 48;

/**
 * 人口から都市タイル色を計算
 * @param {number} pop
 * @returns {import('./background.js').HSL}
 */
function popToCityHSL(pop) {
  const t = Math.max(0, Math.min(1, Math.log10(pop / 100000) / 2.5));
  return {
    h: 0.5 - t * 0.42,
    s: 0.6,
    l: 0.3 + t * 0.25,
  };
}

export class Ground {
  /**
   * @param {Array<{name: string, lat: number, lng: number, pop: number}>} cities
   */
  constructor(cities) {
    this.cities = cities;
    /** 通過済みタイルのセット（"row,col" 形式のキー） @type {Set<string>} */
    this.visited = new Set();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width - キャンバス幅
   * @param {number} height - キャンバス高さ
   * @param {number} lat
   * @param {number} lng
   * @param {number} localHour
   */
  draw(ctx, width, height, lat, lng, localHour) {
    const dnFactor = dayNightFactor(localHour);

    // タイルベース色（一色）
    const dayTile = {
      h: theme.daySky.h + 0.05,
      s: theme.daySky.s - 0.2,
      l: theme.daySky.l - 0.25,
    };
    const nightTile = {
      h: theme.nightSky.h,
      s: theme.nightSky.s - 0.1,
      l: theme.nightSky.l - 0.05,
    };
    const baseColor = lerpHSL(nightTile, dayTile, dnFactor);

    // キャラがいる整数タイル座標と小数部（サブタイル位置）
    const charTileRow = Math.floor(lat);
    const charTileCol = Math.floor(lng);
    const fracLat = lat - charTileRow;
    const fracLng = lng - charTileCol;

    // キャラの中心がいるタイルを通過済みに記録
    this.visited.add(`${charTileRow},${charTileCol}`);

    // 描画範囲のタイル数
    const cols = Math.ceil(width / TILE_PX) + 2;
    const rows = Math.ceil(height / TILE_PX) + 2;
    const halfCols = Math.floor(cols / 2);
    const halfRows = Math.floor(rows / 2);

    // 近くの都市
    const nearbyCities = this.cities.filter(
      (c) =>
        Math.abs(c.lat - lat) < halfRows && Math.abs(c.lng - lng) < halfCols,
    );

    // 画面中央からのピクセルオフセット（小数部でスムーズスクロール）
    const offsetX = -fracLng * TILE_PX;
    const offsetY = fracLat * TILE_PX;

    // テキスト設定（タイル目一杯に「済」を表示）
    const fontSize = TILE_PX * 0.8;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = -halfRows; row <= halfRows; row++) {
      for (let col = -halfCols; col <= halfCols; col++) {
        // このタイルのワールド整数座標（固定）
        const worldRow = charTileRow + row;
        const worldCol = charTileCol + col;

        // 画面位置（小数部オフセットでスムーズスクロール）
        const px = width / 2 + col * TILE_PX + offsetX - TILE_PX / 2;
        const py = height / 2 - row * TILE_PX + offsetY - TILE_PX / 2;

        // 都市色の判定
        let closestDist = Number.POSITIVE_INFINITY;
        let closestPop = 0;
        for (const city of nearbyCities) {
          const d =
            Math.abs(city.lat - worldRow) + Math.abs(city.lng - worldCol);
          if (d < closestDist) {
            closestDist = d;
            closestPop = city.pop;
          }
        }

        // 地形（都市）があればその色、なければベース一色
        const tileColor =
          closestDist < 2
            ? lerpHSL(popToCityHSL(closestPop), baseColor, closestDist / 2)
            : { ...baseColor };

        ctx.fillStyle = hslToString(tileColor);
        ctx.fillRect(px, py, TILE_PX - 1, TILE_PX - 1);

        // 通過済みタイルに「済」を表示
        const key = `${worldRow},${worldCol}`;
        if (this.visited.has(key)) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillText('◯', px + TILE_PX / 2, py + TILE_PX / 2);
        }
      }
    }
  }
}
