// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// Floyd-Steinberg 誤差拡散ディザで動く階調画像を二値/量子化する。

const params = {
  levels: 2, // 量子化段階
  cell: 4, // 1 ピクセルあたりの表示サイズ
  speed: 0.3, // アニメ速度
  pattern: 0, // 0: ストライプ / 1: 円 / 2: プラズマ
  scale: 1.5, // パターン縮尺
  hue: 200, // 色相
  saturation: 60,
  strength: 1, // 誤差拡散強度
  serpentine: 1, // 蛇行スキャン（0/1）
  contrast: 1, // コントラスト
  brightness: 0, // 明度オフセット
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

const start = performance.now();

/**
 * パターンの濃淡（0..1）
 * @param {number} x
 * @param {number} y
 * @param {number} t
 */
function source(x, y, t) {
  const s = params.scale;
  if (params.pattern === 0) {
    return 0.5 + 0.5 * Math.sin((x * s) / 20 + t);
  }
  if (params.pattern === 1) {
    const dx = x - 0.5;
    const dy = y - 0.5;
    return 0.5 + 0.5 * Math.sin(Math.sqrt(dx * dx + dy * dy) * 20 * s - t * 3);
  }
  return (
    (0.5 +
      0.25 * Math.sin(x * 10 * s + t) +
      0.25 * Math.sin(y * 10 * s + t * 1.3) +
      0.25 * Math.sin((x + y) * 8 * s - t * 0.7)) /
    1.5
  );
}

function frame() {
  const W = canvas.width;
  const H = canvas.height;
  const cell = Math.max(1, Math.floor(params.cell));
  const w = Math.floor(W / cell);
  const h = Math.floor(H / cell);
  const t = ((performance.now() - start) / 1000) * params.speed;

  // グレースケール生成
  const buf = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = source(x / w, y / h, t);
      v = (v - 0.5) * params.contrast + 0.5 + params.brightness;
      buf[y * w + x] = Math.max(0, Math.min(1, v));
    }
  }

  // 誤差拡散
  const levels = Math.max(2, Math.floor(params.levels));
  const out = new Uint8Array(w * h);
  const serp = params.serpentine >= 0.5;
  const str = params.strength;
  for (let y = 0; y < h; y++) {
    const leftToRight = !serp || y % 2 === 0;
    const xs = leftToRight ? 0 : w - 1;
    const xe = leftToRight ? w : -1;
    const dx = leftToRight ? 1 : -1;
    for (let x = xs; x !== xe; x += dx) {
      const i = y * w + x;
      const old = buf[i];
      const q = Math.round(old * (levels - 1)) / (levels - 1);
      out[i] = Math.round(q * 255);
      const err = (old - q) * str;
      if (x + dx >= 0 && x + dx < w) buf[i + dx] += (err * 7) / 16;
      if (y + 1 < h) {
        if (x - dx >= 0 && x - dx < w) buf[i + w - dx] += (err * 3) / 16;
        buf[i + w] += (err * 5) / 16;
        if (x + dx >= 0 && x + dx < w) buf[i + w + dx] += (err * 1) / 16;
      }
    }
  }

  // 描画
  ctx.fillStyle = `hsl(${params.hue}, ${params.saturation}%, 5%)`;
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = out[y * w + x] / 255;
      if (v <= 0) continue;
      const L = 10 + v * 70;
      ctx.fillStyle = `hsl(${params.hue}, ${params.saturation}%, ${L}%)`;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// --- GUI ---

const gui = new TileUI({
  title: 'Error Diffusion',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'levels', 2, 8, 1);
gui.add(params, 'cell', 1, 16, 1);
gui.add(params, 'speed', 0, 2, 0.01);
gui.add(params, 'pattern', 0, 2, 1);
gui.add(params, 'scale', 0.2, 5, 0.1);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'strength', 0, 1.2, 0.01);
gui.add(params, 'serpentine', 0, 1, 1);
gui.add(params, 'contrast', 0.2, 3, 0.05);
gui.add(params, 'brightness', -0.5, 0.5, 0.01);

gui.addButton('Random', () => {
  params.levels = 2 + Math.floor(Math.random() * 6);
  params.pattern = Math.floor(Math.random() * 3);
  params.hue = Math.floor(Math.random() * 360);
  params.scale = 0.5 + Math.random() * 3;
  params.contrast = 0.5 + Math.random() * 2;
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
