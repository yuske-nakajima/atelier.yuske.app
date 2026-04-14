// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- カラーパレット ---

const palette = ['#A7D8F2', '#FFE58A', '#FF9AA2', '#A8E6E1'];

// --- パラメータ ---

const params = {
  divisions: 11,
  speed: 1,
  amplitude: 0.15,
  waveSpread: 0.005,
  ellipseRatio: 0.4,
  noiseOpacity: 0.1,
  shadow: true,
  bgColor: '#f5f1e6',
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

// --- ノイズテクスチャ用オフスクリーン canvas ---

const noiseCanvas = document.createElement('canvas');
const noiseCtx = /** @type {CanvasRenderingContext2D} */ (
  noiseCanvas.getContext('2d')
);

/** ランダム RGB ピクセルのノイズテクスチャを生成する */
function createNoiseTexture() {
  const w = canvas.width;
  const h = canvas.height;
  noiseCanvas.width = w;
  noiseCanvas.height = h;
  const imageData = noiseCtx.createImageData(w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.random() * 255;
    data[i + 1] = Math.random() * 255;
    data[i + 2] = Math.random() * 255;
    data[i + 3] = 25;
  }
  noiseCtx.putImageData(imageData, 0, 0);
}

/** Canvas をウィンドウサイズに合わせる */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createNoiseTexture();
}

window.addEventListener('resize', () => {
  resize();
  createTiles();
});
resize();

// --- 色変換ユーティリティ ---

/**
 * HEX を HSL に変換する
 * @param {string} hex - '#RRGGBB' 形式
 * @returns {{ h: number, s: number, l: number }}
 */
function hexToHsl(hex) {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

/**
 * HSL を HEX に変換する
 * @param {number} h - 0-360
 * @param {number} s - 0-1
 * @param {number} l - 0-1
 * @returns {string}
 */
function hslToHex(h, s, l) {
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    const hx = v.toString(16).padStart(2, '0');
    return `#${hx}${hx}${hx}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  /** @param {number} t */
  const hue2rgb = (t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const r = Math.round(hue2rgb(h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(h) * 255);
  const b = Math.round(hue2rgb(h - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 影色を生成する（色相-5 度、明度-15%）
 * @param {string} hex
 * @returns {string}
 */
function makeShadowColor(hex) {
  const hsl = hexToHsl(hex);
  const h = (hsl.h - 5 + 360) % 360;
  const l = Math.max(0, hsl.l - 0.15);
  return hslToHex(h, hsl.s, l);
}

// --- イージング関数 ---

/**
 * quintic ease in-out
 * @param {number} x - 0-1
 * @returns {number}
 */
function ease(x) {
  return x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2;
}

// --- タイルデータ ---

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   w: number,
 *   angle: number,
 *   isUp: boolean,
 *   prevSign: number,
 *   isEllipse: boolean,
 *   color1: string,
 *   color2: string,
 * }} Tile
 */

/** @type {Tile[]} */
let tiles = [];

/**
 * パレットからランダムに色を選ぶ
 * @param {string} [exclude] - 除外する色
 * @returns {string}
 */
function randomColor(exclude) {
  const candidates = exclude ? palette.filter((c) => c !== exclude) : palette;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** タイルを生成する */
function createTiles() {
  tiles = [];
  const dim = params.divisions;
  const canvasSize = Math.min(canvas.width, canvas.height) * 0.85;
  const cellSize = canvasSize / dim;
  const offsetX = (canvas.width - canvasSize) / 2;
  const offsetY = (canvas.height - canvasSize) / 2;

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      // チェッカーボードパターン: (i+j)%2===0 のセルのみ
      if ((i + j) % 2 !== 0) continue;
      const x = offsetX + (i + 0.5) * cellSize;
      const y = offsetY + (j + 0.5) * cellSize;
      const color1 = randomColor();
      const color2 = randomColor(color1);
      tiles.push({
        x,
        y,
        w: cellSize,
        angle: Math.random() > 0.5 ? 0 : Math.PI,
        isUp: false,
        prevSign: 1,
        isEllipse: Math.random() < 0.4,
        color1,
        color2,
      });
    }
  }
}

createTiles();

// --- 描画ヘルパー ---

/**
 * 楕円パスを作成する
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 */
function ellipsePath(cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
}

/**
 * 1つのタイルを描画する
 * @param {Tile} tile
 * @param {number} t - 現在の時間
 */
function drawTile(tile, t) {
  // 波の計算
  const dist = Math.sqrt(tile.x ** 2 + tile.y ** 2);
  const waveVal = Math.cos(t * params.speed - params.waveSpread * dist);

  // 方向反転の検出
  const sign = waveVal >= 0 ? 1 : -1;
  if (sign !== tile.prevSign) {
    tile.isUp = !tile.isUp;
  }
  tile.prevSign = sign;

  // イージング適用
  const raw = Math.abs(waveVal);
  const eased = ease(raw);
  const cellSize = tile.w;
  const offset = (tile.isUp ? 1 : -1) * eased * params.amplitude * cellSize;

  ctx.save();
  ctx.translate(tile.x, tile.y);
  ctx.rotate(tile.angle);

  const halfW = cellSize / 2;
  const ellipseW = halfW * params.ellipseRatio;
  const ellipseH = halfW * params.ellipseRatio * 0.7;

  // 背景矩形（color2）
  ctx.fillStyle = tile.color2;
  ctx.fillRect(-halfW, -halfW, cellSize, cellSize);

  if (tile.isEllipse) {
    // 楕円のみタイプ
    if (params.shadow) {
      ctx.fillStyle = makeShadowColor(tile.color2);
      ellipsePath(0, 0, ellipseW, ellipseH);
      ctx.fill();
    }
    ctx.fillStyle = tile.color1;
    ellipsePath(0, offset, ellipseW, ellipseH);
    ctx.fill();
  } else {
    // クリップ付きタイプ
    if (params.shadow) {
      ctx.fillStyle = makeShadowColor(tile.color2);
      ellipsePath(0, 0, ellipseW, ellipseH);
      ctx.fill();
    }
    ctx.fillStyle = tile.color1;
    ellipsePath(0, offset, ellipseW, ellipseH);
    ctx.fill();

    // クリップ内の重ね色
    ctx.save();
    ellipsePath(0, offset, ellipseW, ellipseH);
    ctx.clip();
    ctx.fillStyle = tile.color2;
    ellipsePath(0, offset + ellipseH * 0.5, ellipseW * 0.8, ellipseH * 0.6);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * 額縁ボーダーを描画する
 * @param {number} w - キャンバス幅
 * @param {number} h - キャンバス高さ
 * @param {number} gridSize - グリッド描画領域サイズ
 */
function drawBorder(w, h, gridSize) {
  const borderColor = '#555555';
  const offsetX = (w - gridSize) / 2;
  const offsetY = (h - gridSize) / 2;

  ctx.fillStyle = borderColor;
  // 上
  ctx.fillRect(0, 0, w, offsetY);
  // 下
  ctx.fillRect(0, h - offsetY, w, offsetY);
  // 左
  ctx.fillRect(0, 0, offsetX, h);
  // 右
  ctx.fillRect(w - offsetX, 0, offsetX, h);

  // 右下にカラースウォッチ
  const swatchSize = Math.min(offsetX, offsetY) * 0.3;
  if (swatchSize > 2) {
    const sx = w - offsetX + (offsetX - swatchSize * palette.length) / 2;
    const sy = h - offsetY + (offsetY - swatchSize) / 2;
    for (let i = 0; i < palette.length; i++) {
      ctx.fillStyle = palette[i];
      ctx.fillRect(sx + i * swatchSize, sy, swatchSize, swatchSize);
    }
  }
}

// --- 描画ループ ---

let time = 0;

/** メインの描画ループ */
function draw() {
  const w = canvas.width;
  const h = canvas.height;

  // 背景塗りつぶし
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, w, h);

  // グリッドサイズ計算
  const gridSize = Math.min(w, h) * 0.85;

  // タイル描画
  for (const tile of tiles) {
    drawTile(tile, time);
  }

  // 額縁ボーダー描画
  drawBorder(w, h, gridSize);

  // ノイズテクスチャオーバーレイ
  if (params.noiseOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = params.noiseOpacity;
    ctx.drawImage(noiseCanvas, 0, 0);
    ctx.restore();
  }

  time += 0.016;
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI トグル（モバイル） ---

const guiWrapper = /** @type {HTMLElement} */ (
  document.getElementById('gui-wrapper')
);
const guiToggle = /** @type {HTMLButtonElement} */ (
  document.getElementById('gui-toggle')
);

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

// --- GUI セットアップ ---

const guiContainer = /** @type {HTMLElement} */ (
  document.getElementById('gui-container')
);
const gui = new TileUI({
  title: 'タイル波紋',
  container: guiContainer,
});

gui.add(params, 'divisions', 5, 21, 2).onChange(() => {
  createTiles();
});
gui.add(params, 'speed', 0.1, 3, 0.1);
gui.add(params, 'amplitude', 0, 0.5, 0.01);
gui.add(params, 'waveSpread', 0, 0.02, 0.001);
gui.add(params, 'ellipseRatio', 0.2, 0.8, 0.05);
gui.add(params, 'noiseOpacity', 0, 0.3, 0.01);
gui.addBoolean(params, 'shadow');
gui.addColor(params, 'bgColor');

gui.addButton('Random', () => {
  const oddValues = [5, 7, 9, 11, 13, 15, 17, 19, 21];
  params.divisions = oddValues[Math.floor(Math.random() * oddValues.length)];
  params.speed = Math.round((0.1 + Math.random() * 2.9) * 10) / 10;
  params.amplitude = Math.round(Math.random() * 0.5 * 100) / 100;
  params.waveSpread = Math.round(Math.random() * 0.02 * 1000) / 1000;
  params.ellipseRatio = Math.round((0.2 + Math.random() * 0.6) * 20) / 20;
  params.noiseOpacity = Math.round(Math.random() * 0.3 * 100) / 100;
  params.shadow = Math.random() > 0.3;
  createTiles();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  createTiles();
  time = 0;
  gui.updateDisplay();
});
