// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 偏光板に挟まれた複屈折媒質の干渉色をシミュレーションする。
// 各セルごとに異なる厚み（位相差）を持たせ、波長ごとの透過率を合成して色を決める。

const params = {
  cellSize: 40, // セル1辺の大きさ（px）
  polarizerAngle: 0, // 入射偏光板の角度（度）
  analyzerAngle: 90, // 検光子の角度（度。90で直交ニコル）
  retardance: 550, // 基準位相差（nm）
  retardanceVar: 300, // セルごとの位相差ばらつき（nm）
  axisAngle: 45, // 光学軸の基準角度（度）
  axisVar: 20, // 光学軸のばらつき（度）
  noiseScale: 0.06, // 位相差ノイズのスケール
  animSpeed: 0.3, // 位相差アニメ速度
  brightness: 1.0, // 明度倍率
  shape: 0, // 0: 矩形タイル, 1: 六角形風, 2: 円タイル
  showGrid: false, // セル境界の表示
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// --- 波長→RGB（CIE 近似の簡易版） ---

/**
 * 波長 (nm) から近似 RGB を返す
 * @param {number} wl
 * @returns {[number, number, number]}
 */
function wavelengthToRGB(wl) {
  let r = 0;
  let g = 0;
  let b = 0;
  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / 60;
    b = 1;
  } else if (wl < 490) {
    g = (wl - 440) / 50;
    b = 1;
  } else if (wl < 510) {
    g = 1;
    b = -(wl - 510) / 20;
  } else if (wl < 580) {
    r = (wl - 510) / 70;
    g = 1;
  } else if (wl < 645) {
    r = 1;
    g = -(wl - 645) / 65;
  } else if (wl <= 780) {
    r = 1;
  }
  // 端の減衰
  let factor = 1;
  if (wl < 420) factor = 0.3 + (0.7 * (wl - 380)) / 40;
  else if (wl > 700) factor = 0.3 + (0.7 * (780 - wl)) / 80;
  return [r * factor, g * factor, b * factor];
}

// 可視光波長のサンプリング点（計算量と色の忠実さのバランス）
const wavelengths = [];
for (let wl = 400; wl <= 700; wl += 20) wavelengths.push(wl);

/**
 * 位相差 Γ と偏光板/光学軸角度から透過色（RGB 0..1）を計算する
 * @param {number} gamma 位相差 (nm)
 * @param {number} polDeg 偏光板角度（度）
 * @param {number} anaDeg 検光子角度（度）
 * @param {number} axisDeg 光学軸角度（度）
 * @returns {[number, number, number]}
 */
function interferenceColor(gamma, polDeg, anaDeg, axisDeg) {
  // 光学軸を基準に、入射偏光と検光子のなす角を計算
  const theta = ((polDeg - axisDeg) * Math.PI) / 180;
  const phi = ((anaDeg - axisDeg) * Math.PI) / 180;
  const sin2t = Math.sin(2 * theta);
  const sin2p = Math.sin(2 * phi);
  const cosPolAna = Math.cos(((polDeg - anaDeg) * Math.PI) / 180);

  let r = 0;
  let g = 0;
  let b = 0;
  for (const wl of wavelengths) {
    const delta = (2 * Math.PI * gamma) / wl;
    // 偏光干渉の一般式: I = cos²(P-A) − sin2θ·sin2φ·sin²(Γ/2·2π/λ)
    const intensity = Math.max(
      0,
      cosPolAna * cosPolAna - sin2t * sin2p * Math.sin(delta / 2) ** 2,
    );
    const [wr, wg, wb] = wavelengthToRGB(wl);
    r += wr * intensity;
    g += wg * intensity;
    b += wb * intensity;
  }
  // サンプル数で正規化
  const n = wavelengths.length;
  return [r / n, g / n, b / n];
}

// --- セル用の疑似ノイズ ---
/**
 * セル座標 + 時刻から 0..1 の疑似乱数を返す
 * @param {number} i
 * @param {number} j
 * @param {number} seed
 */
function cellHash(i, j, seed) {
  const s = Math.sin(i * 12.9898 + j * 78.233 + seed * 43.1234) * 43758.5453;
  return s - Math.floor(s);
}

// --- 描画 ---

let time = 0;

function draw() {
  time += 1 / 60;
  const cs = Math.max(4, params.cellSize);
  const cols = Math.ceil(canvas.width / cs) + 1;
  const rows = Math.ceil(canvas.height / cs) + 1;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const nx = i * params.noiseScale;
      const ny = j * params.noiseScale;
      const noise = cellHash(
        Math.floor(nx * 5),
        Math.floor(ny * 5),
        Math.floor(time * params.animSpeed),
      );
      const gamma =
        params.retardance + (noise - 0.5) * 2 * params.retardanceVar;
      const axisNoise = cellHash(i, j, 7);
      const axis = params.axisAngle + (axisNoise - 0.5) * 2 * params.axisVar;
      const [r, g, b] = interferenceColor(
        gamma,
        params.polarizerAngle,
        params.analyzerAngle,
        axis,
      );
      const br = params.brightness;
      const rr = Math.min(255, Math.max(0, r * 255 * br));
      const gg = Math.min(255, Math.max(0, g * 255 * br));
      const bb = Math.min(255, Math.max(0, b * 255 * br));
      ctx.fillStyle = `rgb(${rr | 0}, ${gg | 0}, ${bb | 0})`;

      const x = i * cs;
      const y = j * cs;
      if (params.shape === 2) {
        // 円タイル
        ctx.beginPath();
        ctx.arc(x + cs / 2, y + cs / 2, cs * 0.48, 0, Math.PI * 2);
        ctx.fill();
      } else if (params.shape === 1) {
        // 六角形風（行ごとにオフセット）
        const ox = (j % 2) * (cs / 2);
        ctx.fillRect(x + ox, y, cs, cs);
      } else {
        ctx.fillRect(x, y, cs, cs);
      }

      if (params.showGrid) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cs, cs);
      }
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Polarized Light',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'cellSize', 6, 120, 1);
gui.add(params, 'polarizerAngle', 0, 180, 1);
gui.add(params, 'analyzerAngle', 0, 180, 1);
gui.add(params, 'retardance', 0, 1500, 1);
gui.add(params, 'retardanceVar', 0, 1000, 1);
gui.add(params, 'axisAngle', 0, 180, 1);
gui.add(params, 'axisVar', 0, 90, 1);
gui.add(params, 'noiseScale', 0.005, 0.3, 0.005);
gui.add(params, 'animSpeed', 0, 3, 0.05);
gui.add(params, 'brightness', 0.3, 2.5, 0.05);
gui.add(params, 'shape', 0, 2, 1);
gui.add(params, 'showGrid');

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.cellSize = rand(16, 64, 1);
  params.polarizerAngle = rand(0, 180, 1);
  params.analyzerAngle = rand(0, 180, 1);
  params.retardance = rand(200, 900, 1);
  params.retardanceVar = rand(100, 600, 1);
  params.axisAngle = rand(0, 180, 1);
  params.axisVar = rand(0, 60, 1);
  params.noiseScale = rand(0.02, 0.15, 0.005);
  params.animSpeed = rand(0, 1.2, 0.05);
  params.brightness = rand(0.8, 1.6, 0.05);
  params.shape = rand(0, 2, 1);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
