// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  bpm: 120,
  cols: 6,
  rows: 6,
  scale: 1.0,
  pulseAmount: 0.5,
  rotationSpeed: 1.0,
  hueSpeed: 1.0,
  baseHue: 0,
  saturation: 80,
  lightness: 60,
  bgColor: '#0a0a0a',
  strokeOnly: false,
  strokeWidth: 2,
  trail: true,
  trailAlpha: 0.1,
  strobe: false,
  strobeInterval: 4,
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

// --- 図形描画関数 ---

/**
 * 正三角形を描画する
 * @param {CanvasRenderingContext2D} c
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} size - 半径
 */
function drawTriangle(c, cx, cy, size) {
  c.beginPath();
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
    const x = cx + Math.cos(angle) * size;
    const y = cy + Math.sin(angle) * size;
    if (i === 0) {
      c.moveTo(x, y);
    } else {
      c.lineTo(x, y);
    }
  }
  c.closePath();
}

/**
 * 正六角形を描画する
 * @param {CanvasRenderingContext2D} c
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} size - 半径
 */
function drawHexagon(c, cx, cy, size) {
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 6;
    const x = cx + Math.cos(angle) * size;
    const y = cy + Math.sin(angle) * size;
    if (i === 0) {
      c.moveTo(x, y);
    } else {
      c.lineTo(x, y);
    }
  }
  c.closePath();
}

/**
 * 五芒星を描画する
 * @param {CanvasRenderingContext2D} c
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} size - 半径
 */
function drawStar(c, cx, cy, size) {
  const innerRadius = size * 0.4;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const r = i % 2 === 0 ? size : innerRadius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) {
      c.moveTo(x, y);
    } else {
      c.lineTo(x, y);
    }
  }
  c.closePath();
}

/**
 * 円を描画する
 * @param {CanvasRenderingContext2D} c
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} size - 半径
 */
function drawCircle(c, cx, cy, size) {
  c.beginPath();
  c.arc(cx, cy, size, 0, Math.PI * 2);
  c.closePath();
}

/**
 * 菱形を描画する
 * @param {CanvasRenderingContext2D} c
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} size - 半径
 */
function drawDiamond(c, cx, cy, size) {
  c.beginPath();
  c.moveTo(cx, cy - size);
  c.lineTo(cx + size * 0.6, cy);
  c.lineTo(cx, cy + size);
  c.lineTo(cx - size * 0.6, cy);
  c.closePath();
}

/**
 * 波形リングを描画する（sin 波で歪ませた円）
 * @param {CanvasRenderingContext2D} c
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} size - 半径
 */
function drawWaveRing(c, cx, cy, size) {
  const segments = 60;
  const waves = 6;
  const waveDepth = size * 0.2;
  c.beginPath();
  for (let i = 0; i <= segments; i++) {
    const angle = (Math.PI * 2 * i) / segments;
    const r = size + Math.sin(angle * waves) * waveDepth;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) {
      c.moveTo(x, y);
    } else {
      c.lineTo(x, y);
    }
  }
  c.closePath();
}

/**
 * 十字を描画する
 * @param {CanvasRenderingContext2D} c
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} size - 半径
 */
function drawCross(c, cx, cy, size) {
  const arm = size * 0.3;
  c.beginPath();
  c.moveTo(cx - arm, cy - size);
  c.lineTo(cx + arm, cy - size);
  c.lineTo(cx + arm, cy - arm);
  c.lineTo(cx + size, cy - arm);
  c.lineTo(cx + size, cy + arm);
  c.lineTo(cx + arm, cy + arm);
  c.lineTo(cx + arm, cy + size);
  c.lineTo(cx - arm, cy + size);
  c.lineTo(cx - arm, cy + arm);
  c.lineTo(cx - size, cy + arm);
  c.lineTo(cx - size, cy - arm);
  c.lineTo(cx - arm, cy - arm);
  c.closePath();
}

// --- ユーティリティ ---

/**
 * hex カラーを rgba 文字列に変換する
 * @param {string} hex - '#rrggbb' 形式のカラーコード
 * @param {number} alpha - 不透明度（0〜1）
 * @returns {string} rgba 文字列
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 全図形描画関数の配列 */
const shapeFunctions = [
  drawTriangle,
  drawHexagon,
  drawStar,
  drawCircle,
  drawDiamond,
  drawWaveRing,
  drawCross,
];

// --- グリッド管理 ---

/** @type {number[]} 各セルに割り当てられた図形のインデックス */
let shapeGrid = [];

/** グリッドを生成し、各セルにランダムな図形を割り当てる */
function createGrid() {
  const total = params.cols * params.rows;
  shapeGrid = [];
  for (let i = 0; i < total; i++) {
    shapeGrid.push(Math.floor(Math.random() * shapeFunctions.length));
  }
}

// --- リサイズ ---

/** Canvas をウィンドウサイズに合わせる */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- 初期化 ---

/** 前回の cols / rows を記録（変更検知用） */
let prevCols = params.cols;
let prevRows = params.rows;

createGrid();

// --- 描画ループ ---

/** メインの描画ループ */
function draw() {
  // cols / rows が変わったらグリッドを再生成
  if (params.cols !== prevCols || params.rows !== prevRows) {
    prevCols = params.cols;
    prevRows = params.rows;
    createGrid();
  }

  // --- 時間・BPM 計算 ---
  const now = performance.now();
  const time = now / 1000;
  const msPerBeat = 60000 / params.bpm;
  const beatProgress = (now / msPerBeat) % 1;
  const beatCount = Math.floor(now / msPerBeat);

  // --- 背景クリア（トレイル対応） ---
  if (params.trail) {
    // 半透明で塗ることで前フレームの残像を残す
    ctx.fillStyle = hexToRgba(params.bgColor, params.trailAlpha);
  } else {
    ctx.fillStyle = params.bgColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- パルス係数（BPM 同期） ---
  const pulse = 1 + Math.sin(beatProgress * Math.PI * 2) * params.pulseAmount;

  // --- 色相シフト（時間経過） ---
  const hueShift = time * params.hueSpeed * 30;

  // --- グリッド計算 ---
  const cellW = canvas.width / params.cols;
  const cellH = canvas.height / params.rows;
  const cellSize = Math.min(cellW, cellH);
  const baseShapeSize = cellSize * 0.35 * params.scale;
  const shapeSize = baseShapeSize * pulse;

  // --- 各セルに図形を描画 ---
  ctx.lineWidth = params.strokeWidth;

  for (let row = 0; row < params.rows; row++) {
    for (let col = 0; col < params.cols; col++) {
      const index = row * params.cols + col;
      const cx = cellW * col + cellW / 2;
      const cy = cellH * row + cellH / 2;

      // セル位置に応じて色相をずらす + 時間による色相シフト
      const hueOffset = ((col + row) / (params.cols + params.rows)) * 360;
      const hue = (params.baseHue + hueOffset + hueShift) % 360;
      const color = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;

      // 回転角度（セルごとに位相をずらす）
      const phaseOffset = (index / (params.cols * params.rows)) * Math.PI * 2;
      const angle = time * params.rotationSpeed + phaseOffset;

      // 回転を適用して描画
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // 図形のパスを作成（原点中心で描画）
      const shapeIndex = shapeGrid[index];
      const drawFn = shapeFunctions[shapeIndex];
      drawFn(ctx, 0, 0, shapeSize);

      // 塗りまたは線で描画
      if (params.strokeOnly) {
        ctx.strokeStyle = color;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --- ストロボエフェクト ---
  if (
    params.strobe &&
    beatCount % params.strobeInterval === 0 &&
    beatProgress < 0.1
  ) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'SVG ベクター VJ',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

// BPM・レイアウト
gui.add(params, 'bpm', 60, 200, 1);
gui.add(params, 'cols', 2, 12, 1).onChange(() => {
  prevCols = params.cols;
  prevRows = params.rows;
  createGrid();
});
gui.add(params, 'rows', 2, 12, 1).onChange(() => {
  prevCols = params.cols;
  prevRows = params.rows;
  createGrid();
});
gui.add(params, 'scale', 0.1, 3.0, 0.1);

// アニメーション
gui.add(params, 'pulseAmount', 0, 1, 0.05);
gui.add(params, 'rotationSpeed', 0, 4, 0.1);
gui.add(params, 'hueSpeed', 0, 5, 0.1);

// カラー
gui.add(params, 'baseHue', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 10, 90, 1);
gui.addColor(params, 'bgColor');

// 描画スタイル
gui.addBoolean(params, 'strokeOnly');
gui.add(params, 'strokeWidth', 0.5, 5, 0.5);

// エフェクト
gui.addBoolean(params, 'trail');
gui.add(params, 'trailAlpha', 0.01, 0.5, 0.01);
gui.addBoolean(params, 'strobe');
gui.add(params, 'strobeInterval', 1, 8, 1);

// ボタン
gui.addButton('Random', () => {
  params.bpm = 60 + Math.floor(Math.random() * 141);
  params.cols = 2 + Math.floor(Math.random() * 11);
  params.rows = 2 + Math.floor(Math.random() * 11);
  params.scale = Math.round((0.1 + Math.random() * 2.9) * 10) / 10;
  params.pulseAmount = Math.round(Math.random() * 20) / 20;
  params.rotationSpeed = Math.round(Math.random() * 40) / 10;
  params.hueSpeed = Math.round(Math.random() * 50) / 10;
  params.baseHue = Math.floor(Math.random() * 361);
  params.saturation = Math.floor(Math.random() * 101);
  params.lightness = 10 + Math.floor(Math.random() * 81);
  params.bgColor = `#${Math.floor(Math.random() * 0x333333)
    .toString(16)
    .padStart(6, '0')}`;
  params.strokeOnly = Math.random() > 0.5;
  params.strokeWidth = Math.round((0.5 + Math.random() * 4.5) * 2) / 2;
  params.trail = Math.random() > 0.3;
  params.trailAlpha = Math.round((0.01 + Math.random() * 0.49) * 100) / 100;
  params.strobe = Math.random() > 0.7;
  params.strobeInterval = 1 + Math.floor(Math.random() * 8);
  createGrid();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  createGrid();
  gui.updateDisplay();
});
