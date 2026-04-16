// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  mode: '2d',
  cellSize: 8,
  speed: 10,
  initialDensity: 0.3,
  ruleNumber: 30,
  initialMode1D: 'center',
  cellColor: '#00ff88',
  bgColor: '#0a0a0a',
  colorMode: 'solid',
  showGrid: false,
  trail: false,
  trailAlpha: 0.1,
  hueSpeed: 3,
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

// --- ユーティリティ ---

/**
 * 16進カラーコードを rgba 文字列に変換する
 * @param {string} hex - 16進カラーコード（例: '#ff0000'）
 * @param {number} alpha - 不透明度（0-1）
 * @returns {string} rgba 文字列
 */
function hexToRgba(hex, alpha) {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** 2D モードの世代カウンタ */
let generationCount = 0;

/**
 * カラーモードに応じてセルの色を決定する
 * @param {number} col - 列番号
 * @param {number} row - 行番号
 * @param {number} totalCols - 総列数
 * @param {number} totalRows - 総行数
 * @param {number} generation - 世代番号
 * @returns {string} CSS 色文字列
 */
function getCellColor(col, row, totalCols, totalRows, generation) {
  if (params.colorMode === 'generation') {
    // 世代数に応じて色相を変化（HSL の H をシフト）
    const hue = (generation * params.hueSpeed) % 360;
    return `hsl(${hue}, 80%, 55%)`;
  }
  if (params.colorMode === 'position') {
    // セルの座標位置に応じて色相を変化
    const hue = ((col + row) / (totalCols + totalRows)) * 360;
    return `hsl(${hue}, 80%, 55%)`;
  }
  // solid: cellColor 単色
  return params.cellColor;
}

// --- 2D モード: グリッド状態管理 ---

/** グリッドの列数 */
let cols = 0;
/** グリッドの行数 */
let rows = 0;
/** 現在の世代のセル状態（2D モード用） */
let current = new Uint8Array(0);
/** 次の世代のセル状態（2D モード用） */
let next = new Uint8Array(0);

/**
 * 2次元座標を1次元インデックスに変換する
 * @param {number} x - 列番号
 * @param {number} y - 行番号
 * @returns {number} 1次元インデックス
 */
function idx(x, y) {
  return y * cols + x;
}

/**
 * グリッドサイズを canvas サイズと cellSize から算出し、バッファを初期化する
 */
function initGrid() {
  cols = Math.floor(canvas.width / params.cellSize);
  rows = Math.floor(canvas.height / params.cellSize);
  const size = cols * rows;
  current = new Uint8Array(size);
  next = new Uint8Array(size);
}

/**
 * initialDensity に基づいてランダムにセルを配置する（2D モード）
 */
function initRandom2D() {
  initGrid();
  for (let i = 0; i < current.length; i++) {
    current[i] = Math.random() < params.initialDensity ? 1 : 0;
  }
}

/**
 * 8近傍の生存セル数をカウントする（トーラス境界）
 * @param {number} x - 列番号
 * @param {number} y - 行番号
 * @returns {number} 生存している隣接セルの数
 */
function countNeighbors(x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      // トーラス境界: 端を反対側に接続する
      const nx = (x + dx + cols) % cols;
      const ny = (y + dy + rows) % rows;
      count += current[idx(nx, ny)];
    }
  }
  return count;
}

/**
 * B3/S23 ルールで1世代を更新する（2D モード）
 * - 生存セル: 隣接2-3で生存、それ以外で死亡
 * - 死亡セル: 隣接3で誕生
 */
function step2D() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = idx(x, y);
      const neighbors = countNeighbors(x, y);
      const alive = current[i];

      if (alive) {
        // 生存ルール: 隣接2または3で生存
        next[i] = neighbors === 2 || neighbors === 3 ? 1 : 0;
      } else {
        // 誕生ルール: 隣接3で誕生
        next[i] = neighbors === 3 ? 1 : 0;
      }
    }
  }

  // ダブルバッファの入れ替え
  const tmp = current;
  current = next;
  next = tmp;

  // 世代カウンタを更新
  generationCount++;
}

/**
 * 全セルを描画する（2D モード）
 */
function render2D() {
  // 背景クリア（トレイル対応）
  if (params.trail) {
    // 半透明で上塗りして残像を残す
    ctx.fillStyle = hexToRgba(params.bgColor, params.trailAlpha);
  } else {
    ctx.fillStyle = params.bgColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 生存セルを描画（カラーモード対応）
  if (params.colorMode === 'solid') {
    // solid モード: 単色でまとめて描画（高速）
    ctx.fillStyle = params.cellColor;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (current[idx(x, y)]) {
          ctx.fillRect(
            x * params.cellSize,
            y * params.cellSize,
            params.cellSize,
            params.cellSize,
          );
        }
      }
    }
  } else {
    // generation / position モード: セルごとに色を決定
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (current[idx(x, y)]) {
          ctx.fillStyle = getCellColor(x, y, cols, rows, generationCount);
          ctx.fillRect(
            x * params.cellSize,
            y * params.cellSize,
            params.cellSize,
            params.cellSize,
          );
        }
      }
    }
  }

  // グリッド線の描画
  if (params.showGrid) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;

    // 縦線
    for (let x = 0; x <= cols; x++) {
      const px = x * params.cellSize;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, rows * params.cellSize);
      ctx.stroke();
    }

    // 横線
    for (let y = 0; y <= rows; y++) {
      const py = y * params.cellSize;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(cols * params.cellSize, py);
      ctx.stroke();
    }
  }
}

// --- 1D モード: セルオートマトン ---

/** 1D モードの列数 */
let cols1D = 0;
/** 1D モードの最大行数（canvas に表示可能な行数） */
let maxRows1D = 0;
/** 現在の1行のセル状態 */
let currentRow1D = new Uint8Array(0);
/** 世代履歴バッファ（各行のセル状態を保持） */
let history1D = /** @type {Uint8Array[]} */ ([]);

/**
 * ルール番号を8ビットに展開して遷移テーブルを生成する
 * 近傍パターン（左,中央,右）の3ビット = 0-7 の8パターン
 * @param {number} ruleNum - Wolfram ルール番号（0-255）
 * @returns {Uint8Array} 遷移テーブル（8要素、各パターンの次状態）
 */
function buildRuleTable(ruleNum) {
  const table = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    // ルール番号の各ビットが対応するパターンの次状態を定義
    table[i] = (ruleNum >> i) & 1;
  }
  return table;
}

/**
 * 1D セルオートマトンの初期状態を設定する
 */
function initRandom1D() {
  cols1D = Math.floor(canvas.width / params.cellSize);
  maxRows1D = Math.floor(canvas.height / params.cellSize);
  currentRow1D = new Uint8Array(cols1D);
  history1D = [];

  if (params.initialMode1D === 'center') {
    // 中央1セルのみ ON
    if (cols1D > 0) {
      currentRow1D[Math.floor(cols1D / 2)] = 1;
    }
  } else {
    // ランダム: initialDensity に基づく
    for (let i = 0; i < cols1D; i++) {
      currentRow1D[i] = Math.random() < params.initialDensity ? 1 : 0;
    }
  }

  // 初期状態を履歴に追加
  history1D.push(new Uint8Array(currentRow1D));
}

/**
 * 1D セルオートマトンの1世代を更新する
 * 周期境界条件（端を反対側に接続）を使用
 */
function step1D() {
  const table = buildRuleTable(params.ruleNumber);
  const nextRow = new Uint8Array(cols1D);

  for (let i = 0; i < cols1D; i++) {
    // 左・中央・右の3セルから近傍パターンを算出
    const left = currentRow1D[(i - 1 + cols1D) % cols1D];
    const center = currentRow1D[i];
    const right = currentRow1D[(i + 1) % cols1D];
    // 3ビットのパターンインデックス: 左=bit2, 中央=bit1, 右=bit0
    const pattern = (left << 2) | (center << 1) | right;
    nextRow[i] = table[pattern];
  }

  currentRow1D = nextRow;

  // 履歴に追加（最大行数を超えたら先頭を削除してスクロール）
  history1D.push(new Uint8Array(currentRow1D));
  if (history1D.length > maxRows1D) {
    history1D.shift();
  }
}

/**
 * 1D モードの世代履歴を描画する
 * 上から下へ世代を重ねて表示する
 */
function render1D() {
  // 背景クリア（トレイル対応）
  if (params.trail) {
    ctx.fillStyle = hexToRgba(params.bgColor, params.trailAlpha);
  } else {
    ctx.fillStyle = params.bgColor;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 各世代の行を描画（カラーモード対応）
  if (params.colorMode === 'solid') {
    // solid モード: 単色でまとめて描画
    ctx.fillStyle = params.cellColor;
    for (let row = 0; row < history1D.length; row++) {
      const rowData = history1D[row];
      for (let x = 0; x < cols1D; x++) {
        if (rowData[x]) {
          ctx.fillRect(
            x * params.cellSize,
            row * params.cellSize,
            params.cellSize,
            params.cellSize,
          );
        }
      }
    }
  } else {
    // generation / position モード: セルごとに色を決定
    for (let row = 0; row < history1D.length; row++) {
      const rowData = history1D[row];
      for (let x = 0; x < cols1D; x++) {
        if (rowData[x]) {
          ctx.fillStyle = getCellColor(x, row, cols1D, maxRows1D, row);
          ctx.fillRect(
            x * params.cellSize,
            row * params.cellSize,
            params.cellSize,
            params.cellSize,
          );
        }
      }
    }
  }

  // グリッド線の描画
  if (params.showGrid) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;

    // 縦線
    for (let x = 0; x <= cols1D; x++) {
      const px = x * params.cellSize;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, history1D.length * params.cellSize);
      ctx.stroke();
    }

    // 横線
    for (let y = 0; y <= history1D.length; y++) {
      const py = y * params.cellSize;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(cols1D * params.cellSize, py);
      ctx.stroke();
    }
  }
}

// --- モード共通: 初期化・更新・描画の分岐 ---

/**
 * 現在のモードに応じて初期化する
 */
function initCurrent() {
  generationCount = 0;
  if (params.mode === '1d') {
    initRandom1D();
  } else {
    initRandom2D();
  }
}

/**
 * 現在のモードに応じて1世代を更新する
 */
function step() {
  if (params.mode === '1d') {
    step1D();
  } else {
    step2D();
  }
}

/**
 * 現在のモードに応じて描画する
 */
function render() {
  if (params.mode === '1d') {
    render1D();
  } else {
    render2D();
  }
}

// --- 描画ループ ---

/** 前回の更新時刻（ミリ秒） */
let lastUpdateTime = 0;

/**
 * メインの描画ループ
 * speed パラメータに基づいて更新間隔を制御する
 * @param {number} timestamp - requestAnimationFrame から渡されるタイムスタンプ
 */
function loop(timestamp) {
  // speed: 1秒あたりの世代更新回数
  const interval = 1000 / params.speed;

  if (timestamp - lastUpdateTime >= interval) {
    step();
    lastUpdateTime = timestamp;
  }

  render();
  requestAnimationFrame(loop);
}

// --- リサイズ対応 ---

/** Canvas をウィンドウサイズに合わせてグリッドを再初期化する */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initCurrent();
}

window.addEventListener('resize', resize);
resize();

// 描画ループの開始
requestAnimationFrame(loop);

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'Cellular Automata',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

// モード切替ボタン（2D ↔ 1D をトグル）
gui.addButton(`Mode: ${params.mode.toUpperCase()}`, () => {
  params.mode = params.mode === '2d' ? '1d' : '2d';
  // ボタンラベルの更新（TileUI はボタンラベル動的変更未対応のため再初期化で対応）
  initCurrent();
  gui.updateDisplay();
});

// セルサイズ（変更時にグリッド再初期化）
gui.add(params, 'cellSize', 2, 32, 1).onChange(() => {
  initCurrent();
});

// 更新速度
gui.add(params, 'speed', 1, 60, 1);

// 初期密度
gui.add(params, 'initialDensity', 0.05, 0.95, 0.05);

// ルール番号（1D モード用、0-255）
gui.add(params, 'ruleNumber', 0, 255, 1).onChange(() => {
  // ルール変更時に1Dモードなら再初期化
  if (params.mode === '1d') {
    initRandom1D();
  }
});

// 1D 初期配置切替ボタン（center ↔ random をトグル）
gui.addButton(`1D Init: ${params.initialMode1D}`, () => {
  params.initialMode1D =
    params.initialMode1D === 'center' ? 'random' : 'center';
  if (params.mode === '1d') {
    initRandom1D();
  }
  gui.updateDisplay();
});

// セルの色
gui.addColor(params, 'cellColor');

// 背景色
gui.addColor(params, 'bgColor');

// カラーモード切替ボタン（solid → generation → position → solid ...）
const colorModes = /** @type {const} */ (['solid', 'generation', 'position']);
gui.addButton(`Color: ${params.colorMode}`, () => {
  const currentIdx = colorModes.indexOf(
    /** @type {'solid' | 'generation' | 'position'} */ (params.colorMode),
  );
  params.colorMode = colorModes[(currentIdx + 1) % colorModes.length];
  gui.updateDisplay();
});

// 色相変化速度（generation モードで使用）
gui.add(params, 'hueSpeed', 1, 10, 1);

// グリッド線表示
gui.addBoolean(params, 'showGrid');

// トレイル効果
gui.addBoolean(params, 'trail');

// トレイル透明度
gui.add(params, 'trailAlpha', 0.01, 0.5, 0.01);

// ランダム再初期化ボタン
gui.addButton('Random', () => {
  params.cellSize = 2 + Math.floor(Math.random() * 31);
  params.speed = 1 + Math.floor(Math.random() * 60);
  params.initialDensity = Math.round((0.05 + Math.random() * 0.9) * 20) / 20;
  params.cellColor = `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
  params.bgColor = `#${Math.floor(Math.random() * 0x333333)
    .toString(16)
    .padStart(6, '0')}`;
  params.showGrid = Math.random() > 0.7;

  // カラーモードのランダム化
  params.colorMode = colorModes[Math.floor(Math.random() * colorModes.length)];
  params.hueSpeed = 1 + Math.floor(Math.random() * 10);

  // トレイルのランダム化
  params.trail = Math.random() > 0.5;
  params.trailAlpha = Math.round((0.01 + Math.random() * 0.49) * 100) / 100;

  // モードに応じたランダム化
  if (params.mode === '1d') {
    params.ruleNumber = Math.floor(Math.random() * 256);
    params.initialMode1D = Math.random() > 0.5 ? 'center' : 'random';
  }

  initCurrent();
  gui.updateDisplay();
});

// リセットボタン（初期値に戻して再初期化）
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  initCurrent();
  gui.updateDisplay();
});
