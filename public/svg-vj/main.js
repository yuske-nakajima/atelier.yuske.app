// @ts-check

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

/** 初期値（リセット用。Sprint 2 以降の GUI リセットで使用） */
// biome-ignore lint/correctness/noUnusedVariables: Sprint 2 の GUI リセットで使用予定
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

  // 背景クリア
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // グリッド計算
  const cellW = canvas.width / params.cols;
  const cellH = canvas.height / params.rows;
  const cellSize = Math.min(cellW, cellH);
  const shapeSize = cellSize * 0.35 * params.scale;

  // 各セルに図形を描画
  ctx.lineWidth = params.strokeWidth;

  for (let row = 0; row < params.rows; row++) {
    for (let col = 0; col < params.cols; col++) {
      const index = row * params.cols + col;
      const cx = cellW * col + cellW / 2;
      const cy = cellH * row + cellH / 2;

      // セル位置に応じて色相をずらす
      const hueOffset = ((col + row) / (params.cols + params.rows)) * 360;
      const hue = (params.baseHue + hueOffset) % 360;
      const color = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;

      // 図形のパスを作成
      const shapeIndex = shapeGrid[index];
      const drawFn = shapeFunctions[shapeIndex];
      drawFn(ctx, cx, cy, shapeSize);

      // 塗りまたは線で描画
      if (params.strokeOnly) {
        ctx.strokeStyle = color;
        ctx.stroke();
      } else {
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
