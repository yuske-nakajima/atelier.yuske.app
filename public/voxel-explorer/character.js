// @ts-check

/**
 * トップダウン ボクセルキャラクター（8方向対応）
 *
 * 10x10 グリッド、各セル 5px → 50x50px のスプライト
 * 上から見たシルエット（頭・肩・腕を表現）
 */

const GRID = 10;
const CELL = 5;
const SIZE = GRID * CELL;

/**
 * 8方向の定義（北=0、時計回り）
 * @type {ReadonlyArray<string>}
 */
const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/**
 * トップダウンのシルエットマスク（上から見た形）
 * 各行が Z 方向（上→下）、各値が X 方向の有効範囲
 * 左右対称
 * @type {ReadonlyArray<{minX: number, maxX: number}>}
 */
const TOP_SILHOUETTE = [
  // 行0 (後頭部上端)
  { minX: 3, maxX: 7 },
  // 行1 (後頭部)
  { minX: 2, maxX: 8 },
  // 行2 (頭)
  { minX: 2, maxX: 8 },
  // 行3 (頭下)
  { minX: 2, maxX: 8 },
  // 行4 (肩)
  { minX: 1, maxX: 9 },
  // 行5 (胴体上)
  { minX: 1, maxX: 9 },
  // 行6 (胴体中)
  { minX: 2, maxX: 8 },
  // 行7 (胴体下)
  { minX: 2, maxX: 8 },
  // 行8 (脚)
  { minX: 2, maxX: 5 },
  // 行9 (足先)
  { minX: 2, maxX: 5 },
];

/**
 * 歩行フレーム: 脚の開き具合を行8-9で変える
 * @type {ReadonlyArray<ReadonlyArray<{minX: number, maxX: number}>>}
 */
const WALK_FRAMES = [
  // フレーム0: 左足前
  [...TOP_SILHOUETTE.slice(0, 8), { minX: 1, maxX: 5 }, { minX: 1, maxX: 4 }],
  // フレーム1: 閉じ
  [...TOP_SILHOUETTE.slice(0, 8), { minX: 3, maxX: 7 }, { minX: 3, maxX: 7 }],
  // フレーム2: 右足前
  [...TOP_SILHOUETTE.slice(0, 8), { minX: 5, maxX: 9 }, { minX: 6, maxX: 9 }],
  // フレーム3: 閉じ
  [...TOP_SILHOUETTE.slice(0, 8), { minX: 3, maxX: 7 }, { minX: 3, maxX: 7 }],
];

/**
 * シード値から疑似乱数生成器を作成
 * @param {number} seed
 * @returns {() => number}
 */
function createRng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * ボクセルのピクセルデータを生成
 * @param {number} seed
 * @param {ReadonlyArray<{minX: number, maxX: number}>} silhouette
 * @returns {Array<Array<number>>} 10x10 の色インデックス配列（0=透明, 1=ベース色, 2=アクセント色）
 */
function generatePixels(seed, silhouette) {
  const rng = createRng(seed);
  /** @type {Array<Array<number>>} */
  const pixels = Array.from({ length: GRID }, () => Array(GRID).fill(0));

  for (let z = 0; z < GRID; z++) {
    const mask = silhouette[z];
    const center = 5;
    // 右半分を生成してミラー
    for (let x = center; x < mask.maxX; x++) {
      if (rng() > 0.3) {
        const colorIdx = rng() > 0.7 ? 2 : 1;
        pixels[z][x] = colorIdx;
        const mirror = GRID - 1 - x;
        if (mirror >= mask.minX) {
          pixels[z][mirror] = colorIdx;
        }
      }
    }
    // 中心列は常に埋める（胴体の連結保証）
    if (z >= 1 && z <= 7) {
      pixels[z][4] = 1;
      pixels[z][5] = 1;
    }
  }

  return pixels;
}

/**
 * 角度から8方向インデックスを取得
 * @param {number} angleDeg - 北=0、時計回りの角度
 * @returns {number} 0-7
 */
function angleToDirection(angleDeg) {
  const normalized = ((angleDeg % 360) + 360) % 360;
  return Math.round(normalized / 45) % 8;
}

export class TopDownCharacter {
  /**
   * @param {number} [seed]
   */
  constructor(seed) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
    const rng = createRng(this.seed);

    // 色の生成
    const hue = rng();
    this.baseHue = hue;
    this.baseColor = `hsl(${Math.round(hue * 360)}, 60%, 50%)`;
    const accentHue = (hue + 0.3 + rng() * 0.2) % 1;
    this.accentColor = `hsl(${Math.round(accentHue * 360)}, 70%, 60%)`;
    // 暗い輪郭色
    this.outlineColor = `hsl(${Math.round(hue * 360)}, 40%, 25%)`;

    // 各歩行フレームのピクセルデータを事前生成
    this.frames = WALK_FRAMES.map((sil) => generatePixels(this.seed, sil));

    this.walkFrame = 0;
    this.walkTimer = 0;
    this.directionIndex = 0;
  }

  /**
   * @param {number} deltaTime
   * @param {number} headingDeg - 移動方向（度、北=0、時計回り）
   */
  update(deltaTime, headingDeg) {
    this.directionIndex = angleToDirection(headingDeg);

    this.walkTimer += deltaTime;
    if (this.walkTimer > 0.15) {
      this.walkTimer = 0;
      this.walkFrame = (this.walkFrame + 1) % 4;
    }
  }

  /**
   * キャラクターを描画
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cx - 描画中心 X
   * @param {number} cy - 描画中心 Y
   * @param {number} scale - 拡大率
   */
  draw(ctx, cx, cy, scale) {
    const pixels = this.frames[this.walkFrame];
    const cellSize = CELL * scale;
    const halfSize = (SIZE * scale) / 2;
    const startX = cx - halfSize;
    const startY = cy - halfSize;

    // 8方向に応じた回転
    const dir = this.directionIndex;
    const rotationRad = (dir * 45 * Math.PI) / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationRad);
    ctx.translate(-cx, cy * -1);

    // 輪郭（1px 大きめに描画）
    const outline = cellSize * 0.2;
    for (let z = 0; z < GRID; z++) {
      for (let x = 0; x < GRID; x++) {
        if (pixels[z][x] === 0) continue;
        ctx.fillStyle = this.outlineColor;
        ctx.fillRect(
          startX + x * cellSize - outline,
          startY + z * cellSize - outline,
          cellSize + outline * 2,
          cellSize + outline * 2,
        );
      }
    }

    // 本体
    for (let z = 0; z < GRID; z++) {
      for (let x = 0; x < GRID; x++) {
        if (pixels[z][x] === 0) continue;
        ctx.fillStyle = pixels[z][x] === 2 ? this.accentColor : this.baseColor;
        ctx.fillRect(
          startX + x * cellSize,
          startY + z * cellSize,
          cellSize,
          cellSize,
        );
      }
    }

    ctx.restore();
  }
}

export { SIZE, DIRECTIONS };
