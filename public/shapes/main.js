// p5.js グローバルモード + p5.lerpShape
// @ts-check は使わない（p5 グローバル関数が型エラーになるため）

// --- パラメータ ---

const params = {
  cols: 4,
  rows: 4,
  speed: 0.5,
  colorful: true,
  bgColor: '#1a1a2e',
  shapeColor: '#e94560',
  strokeWt: 0,
  showStroke: false,
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- タイルデータ ---

/** @type {Array<{shapeIndex: number, nextShapeIndex: number, hueOffset: number, phase: number, prevT: number}>} */
let tiles = [];

// --- 図形描画関数 ---

/**
 * 正多角形を描画する汎用関数
 * @param {number} x - 中心 x
 * @param {number} y - 中心 y
 * @param {number} radius - 半径
 * @param {number} sides - 辺の数
 */
function drawPolygon(x, y, radius, sides) {
  beginShape();
  for (let i = 0; i < sides; i++) {
    const angle = (TWO_PI / sides) * i - HALF_PI;
    vertex(x + cos(angle) * radius, y + sin(angle) * radius);
  }
  endShape(CLOSE);
}

/**
 * 星形を描画する関数
 * @param {number} x - 中心 x
 * @param {number} y - 中心 y
 * @param {number} outerR - 外側半径
 * @param {number} innerR - 内側半径
 * @param {number} points - 頂点数
 */
function drawStar(x, y, outerR, innerR, points) {
  beginShape();
  for (let i = 0; i < points * 2; i++) {
    const angle = (TWO_PI / (points * 2)) * i - HALF_PI;
    const r = i % 2 === 0 ? outerR : innerR;
    vertex(x + cos(angle) * r, y + sin(angle) * r);
  }
  endShape(CLOSE);
}

/**
 * ハート形を描画する関数
 * @param {number} x - 中心 x
 * @param {number} y - 中心 y
 * @param {number} size - サイズ
 */
function drawHeart(x, y, size) {
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.1) {
    const r = size * (1 - sin(a)) * 0.5;
    vertex(x + r * cos(a), y - r * sin(a) + size * 0.3);
  }
  endShape(CLOSE);
}

/** 図形描画関数のリスト */
const shapeDrawers = [
  (x, y, r) => drawPolygon(x, y, r, 3), // 三角形
  (x, y, r) => drawPolygon(x, y, r, 4), // 四角形
  (x, y, r) => drawPolygon(x, y, r, 5), // 五角形
  (x, y, r) => drawPolygon(x, y, r, 6), // 六角形
  (x, y, r) => drawPolygon(x, y, r, 8), // 八角形
  (x, y, r) => circle(x, y, r * 2), // 円
  (x, y, r) => drawStar(x, y, r, r * 0.4, 5), // 五芒星
  (x, y, r) => drawStar(x, y, r, r * 0.5, 4), // 四芒星
  (x, y, r) => drawHeart(x, y, r), // ハート
  (x, y, r) => drawPolygon(x, y, r, 10), // 十角形
];

/**
 * 現在と異なるランダムな図形インデックスを返す
 * @param {number} currentIndex - 現在の図形インデックス
 * @returns {number}
 */
function randomShapeIndex(currentIndex) {
  let next = floor(random(shapeDrawers.length));
  while (next === currentIndex) {
    next = floor(random(shapeDrawers.length));
  }
  return next;
}

/** タイルデータを生成する */
function createTiles() {
  tiles = [];
  const total = params.cols * params.rows;
  for (let i = 0; i < total; i++) {
    const shapeIndex = floor(random(shapeDrawers.length));
    tiles.push({
      shapeIndex,
      nextShapeIndex: randomShapeIndex(shapeIndex),
      hueOffset: random(360),
      phase: random(1),
      prevT: 0,
    });
  }
}

// --- p5.js セットアップ ---

// biome-ignore lint/correctness/noUnusedVariables: p5.js グローバルモードが呼び出す
function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');
  colorMode(HSL, 360, 100, 100);
  createTiles();
  setupGUI();
  setupMobileToggle();
}

// --- 描画ループ ---

// biome-ignore lint/correctness/noUnusedVariables: p5.js グローバルモードが呼び出す
function draw() {
  background(params.bgColor);

  const margin = min(width, height) * 0.05;
  const cellW = (width - margin * 2) / params.cols;
  const cellH = (height - margin * 2) / params.rows;
  const r = min(cellW, cellH) * 0.35;

  for (let row = 0; row < params.rows; row++) {
    for (let col = 0; col < params.cols; col++) {
      const tile = tiles[row * params.cols + col];
      if (!tile) continue;

      const cx = margin + cellW * (col + 0.5);
      const cy = margin + cellH * (row + 0.5);

      // モーフィング進捗（各タイルに位相差を持たせる）
      const t = (frameCount * params.speed * 0.01 + tile.phase) % 1;

      // 色の設定
      if (params.colorful) {
        const hue = (tile.hueOffset + frameCount * 0.5) % 360;
        fill(hue, 70, 60);
      } else {
        fill(params.shapeColor);
      }

      if (params.showStroke) {
        stroke(255);
        strokeWeight(params.strokeWt);
      } else {
        noStroke();
      }

      // lerpShape でモーフィング
      withLerpShape(t, () => {
        shapeDrawers[tile.shapeIndex](cx, cy, r);
        shapeDrawers[tile.nextShapeIndex](cx, cy, r);
      });

      // モーフ完了時に次の図形を設定（t が 0 をまたいだら切り替え）
      if (t < tile.prevT) {
        tile.shapeIndex = tile.nextShapeIndex;
        tile.nextShapeIndex = randomShapeIndex(tile.shapeIndex);
      }
      tile.prevT = t;
    }
  }
}

// --- ウィンドウリサイズ ---

// biome-ignore lint/correctness/noUnusedVariables: p5.js グローバルモードが呼び出す
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// --- TileUI GUI セットアップ ---

function setupGUI() {
  import(
    'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js'
  ).then((module) => {
    const TileUI = module.default;
    const guiContainer = document.getElementById('gui-container');
    const gui = new TileUI({
      title: 'シェイプモーフ',
      container: guiContainer,
    });

    gui.add(params, 'cols', 2, 8, 1).onChange(() => createTiles());
    gui.add(params, 'rows', 2, 8, 1).onChange(() => createTiles());
    gui.add(params, 'speed', 0.1, 3, 0.1);
    gui.addBoolean(params, 'colorful');
    gui.addColor(params, 'shapeColor');
    gui.addColor(params, 'bgColor');
    gui.add(params, 'strokeWt', 0, 5, 0.5);
    gui.addBoolean(params, 'showStroke');

    gui.addButton('Random', () => {
      params.cols = floor(random(2, 9));
      params.rows = floor(random(2, 9));
      params.speed = round(random(0.1, 3) * 10) / 10;
      params.colorful = random() > 0.3;
      params.shapeColor = randomHexColor();
      createTiles();
      gui.updateDisplay();
    });

    gui.addButton('Reset', () => {
      Object.assign(params, { ...defaults });
      createTiles();
      gui.updateDisplay();
    });
  });
}

/**
 * ランダムな hex カラーを返す
 * @returns {string}
 */
function randomHexColor() {
  const r = floor(random(256));
  const g = floor(random(256));
  const b = floor(random(256));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// --- モバイル GUI トグル ---

function setupMobileToggle() {
  const guiWrapper = document.getElementById('gui-wrapper');
  const guiToggle = document.getElementById('gui-toggle');
  if (!guiWrapper || !guiToggle) return;

  // モバイルでは初期状態を閉じておく
  const mql = window.matchMedia('(max-width: 48rem)');
  if (mql.matches) {
    guiWrapper.classList.add('collapsed');
  }
  mql.addEventListener('change', (e) => {
    if (e.matches) {
      guiWrapper.classList.add('collapsed');
    } else {
      guiWrapper.classList.remove('collapsed');
    }
  });

  guiToggle.addEventListener('click', () => {
    guiWrapper.classList.toggle('collapsed');
  });
}

// p5.js グローバルモードのため setup / draw / windowResized を
// グローバルスコープに公開（上記の function 宣言で自動的にグローバル）
