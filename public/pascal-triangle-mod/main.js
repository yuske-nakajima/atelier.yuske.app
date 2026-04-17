// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// パスカルの三角形 C(n,k) を mod m で色分け。m=2 でシェルピンスキー三角形が現れる。

const params = {
  rows: 128, // 行数
  modulus: 2, // mod の値
  hideZero: 1, // 0 を描画しない（1: 非表示）
  hueBase: 200, // 色相
  hueSpread: 40, // mod 値ごとの色相差
  saturation: 65, // 彩度
  lightness: 65, // 明度
  cellGap: 0, // セル間隔
  bg: 6, // 背景明度
  rotate: 0, // 回転（度）
  offsetY: 0.5, // 上下位置
  scale: 0.9, // 表示スケール
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}
window.addEventListener('resize', resize);

/**
 * 行 n までの C(n,k) mod m を計算する。
 * @param {number} n
 * @param {number} m
 */
function buildRows(n, m) {
  const rows = [/** @type {number[]} */ ([1])];
  for (let i = 1; i < n; i++) {
    const prev = rows[i - 1];
    const cur = [/** @type {number} */ (1)];
    for (let j = 1; j < i; j++) cur.push((prev[j - 1] + prev[j]) % m);
    cur.push(1);
    rows.push(cur);
  }
  return rows;
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);

  const n = Math.floor(params.rows);
  const m = Math.max(2, Math.floor(params.modulus));
  const rows = buildRows(n, m);

  const cx = w / 2;
  const cy = h * params.offsetY;
  const cellSize = ((Math.min(w, h) * params.scale) / n) * 1.0;
  ctx.translate(cx, cy);
  ctx.rotate((params.rotate * Math.PI) / 180);
  ctx.translate(0, -n * cellSize * 0.5);

  for (let i = 0; i < n; i++) {
    const row = rows[i];
    for (let j = 0; j <= i; j++) {
      const v = row[j];
      if (v === 0 && params.hideZero) continue;
      const hue = (params.hueBase + v * params.hueSpread) % 360;
      ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
      const x = (j - i / 2) * cellSize;
      const y = i * cellSize;
      ctx.fillRect(
        x + params.cellGap,
        y + params.cellGap,
        cellSize - params.cellGap * 2,
        cellSize - params.cellGap * 2,
      );
    }
  }
  ctx.restore();
}
resize();

// --- GUI ---

const gui = new TileUI({
  title: 'Pascal mod',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'rows', 16, 400, 1).onChange(draw);
gui.add(params, 'modulus', 2, 12, 1).onChange(draw);
gui.add(params, 'hideZero', 0, 1, 1).onChange(draw);
gui.add(params, 'hueBase', 0, 360, 1).onChange(draw);
gui.add(params, 'hueSpread', 0, 120, 1).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 20, 90, 1).onChange(draw);
gui.add(params, 'cellGap', 0, 2, 0.1).onChange(draw);
gui.add(params, 'rotate', 0, 360, 1).onChange(draw);
gui.add(params, 'offsetY', 0.1, 0.9, 0.01).onChange(draw);
gui.add(params, 'scale', 0.3, 1.2, 0.01).onChange(draw);
gui.add(params, 'bg', 0, 30, 1).onChange(draw);

gui.addButton('Random', () => {
  params.modulus = 2 + Math.floor(Math.random() * 8);
  params.rows = 32 + Math.floor(Math.random() * 200);
  params.hueBase = Math.floor(Math.random() * 360);
  params.hueSpread = Math.floor(Math.random() * 90);
  gui.updateDisplay();
  draw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
