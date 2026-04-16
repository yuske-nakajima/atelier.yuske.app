// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  points: 120, // 円周上の点の数
  multiplier: 2, // 接続ルール（n番目の点を n*multiplier の点に接続）
  lineWidth: 0.5, // 線の太さ
  lineAlpha: 0.6, // 線の不透明度
  baseHue: 200, // 基本色相
  hueRange: 60, // 色相の変動幅
  saturation: 80, // 彩度（%）
  lightness: 60, // 明度（%）
  radius: 0.85, // 円の半径（画面短辺に対する比率）
  showDots: true, // 円周上の点を表示
  dotSize: 1.5, // 点のサイズ
  bgColor: '#0a0a0a', // 背景色
};

/** 初期値（リセット用） */
const defaults = { ...params };

// --- Canvas セットアップ ---

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

/** Canvas をウィンドウサイズに合わせる */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}

window.addEventListener('resize', resize);
resize();

// --- 描画 ---

/**
 * ストリングアートを描画する
 */
function draw() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = (Math.min(w, h) / 2) * params.radius;

  // 背景クリア
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, w, h);

  const n = params.points;
  const m = params.multiplier;

  // 円周上の各点の座標を計算
  /** @type {{ x: number, y: number }[]} */
  const positions = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    positions.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    });
  }

  // 糸を描画
  ctx.lineWidth = params.lineWidth;
  for (let i = 0; i < n; i++) {
    const from = positions[i];
    const to = positions[Math.round(i * m) % n];

    // 点のインデックスに応じて色相を変化させる
    const hue = params.baseHue + (i / n) * params.hueRange;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.lineAlpha})`;
    ctx.stroke();
  }

  // 円周上の点を描画
  if (params.showDots) {
    for (let i = 0; i < n; i++) {
      const pos = positions[i];
      const hue = params.baseHue + (i / n) * params.hueRange;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, params.dotSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness + 20}%)`;
      ctx.fill();
    }
  }
}

// --- GUI セットアップ ---

const gui = new TileUI({
  title: 'String Art',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'points', 10, 360, 1).onChange(() => draw());
gui.add(params, 'multiplier', 1, 100, 0.1).onChange(() => draw());
gui.add(params, 'lineWidth', 0.1, 3, 0.1).onChange(() => draw());
gui.add(params, 'lineAlpha', 0.05, 1, 0.05).onChange(() => draw());
gui.add(params, 'baseHue', 0, 360, 1).onChange(() => draw());
gui.add(params, 'hueRange', 0, 360, 1).onChange(() => draw());
gui.add(params, 'saturation', 0, 100, 1).onChange(() => draw());
gui.add(params, 'lightness', 0, 100, 1).onChange(() => draw());
gui.add(params, 'radius', 0.3, 0.95, 0.01).onChange(() => draw());
gui.addBoolean(params, 'showDots').onChange(() => draw());
gui.add(params, 'dotSize', 0.5, 5, 0.5).onChange(() => draw());
gui.addColor(params, 'bgColor').onChange(() => draw());

// Random ボタン: 全パラメータをランダムに設定
gui.addButton('Random', () => {
  params.points = 10 + Math.floor(Math.random() * 351);
  params.multiplier = Math.round((1 + Math.random() * 99) * 10) / 10;
  params.lineWidth = Math.round((0.1 + Math.random() * 2.9) * 10) / 10;
  params.lineAlpha = Math.round((0.05 + Math.random() * 0.95) * 20) / 20;
  params.baseHue = Math.floor(Math.random() * 361);
  params.hueRange = Math.floor(Math.random() * 361);
  params.saturation = Math.floor(Math.random() * 101);
  params.lightness = 20 + Math.floor(Math.random() * 61);
  params.radius = Math.round((0.3 + Math.random() * 0.65) * 100) / 100;
  params.showDots = Math.random() > 0.3;
  params.dotSize = Math.round((0.5 + Math.random() * 4.5) * 2) / 2;
  params.bgColor = `#${Math.floor(Math.random() * 0x333333)
    .toString(16)
    .padStart(6, '0')}`;
  gui.updateDisplay();
  draw();
});

// Reset ボタン: 初期値に戻す
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
