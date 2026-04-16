// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  tiling: 1, // 1:三角, 2:四角, 3:六角, 4:三角+六角
  size: 54, // タイル辺長
  rotate: 0, // 全体回転（度）
  warp: 0, // 頂点ゆらぎ量
  warpSpeed: 0.4, // ゆらぎ速度
  lineWidth: 1.4, // 線の太さ
  hueBase: 200, // 基本色相
  hueSpread: 80, // 色相レンジ
  saturation: 65, // 彩度
  lightness: 52, // 明度
  fillAlpha: 0.8, // 塗り透明度
  strokeAlpha: 1, // 線透明度
  showStroke: true, // 線の有無
  pulse: 0.15, // 明滅強度
  pulseSpeed: 1, // 明滅速度
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

// --- 敷き詰め生成 ---

/**
 * @typedef {{points: [number, number][], seed: number}} Tile
 */

/**
 * @returns {Tile[]}
 */
function buildTiles() {
  const tiles = [];
  const s = params.size;
  const cw = canvas.width;
  const ch = canvas.height;
  if (params.tiling === 1) {
    // 正三角形タイリング
    const h = (s * Math.sqrt(3)) / 2;
    const cols = Math.ceil(cw / s) + 4;
    const rows = Math.ceil(ch / h) + 4;
    for (let r = -2; r < rows; r++) {
      for (let c = -2; c < cols; c++) {
        const x = c * s + (r % 2 ? s / 2 : 0);
        const y = r * h;
        tiles.push({
          points: [
            [x, y],
            [x + s, y],
            [x + s / 2, y + h],
          ],
          seed: r * 1000 + c,
        });
        tiles.push({
          points: [
            [x + s, y],
            [x + s + s / 2, y + h],
            [x + s / 2, y + h],
          ],
          seed: r * 1000 + c + 500,
        });
      }
    }
  } else if (params.tiling === 2) {
    // 正方形
    const cols = Math.ceil(cw / s) + 2;
    const rows = Math.ceil(ch / s) + 2;
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const x = c * s;
        const y = r * s;
        tiles.push({
          points: [
            [x, y],
            [x + s, y],
            [x + s, y + s],
            [x, y + s],
          ],
          seed: r * 1000 + c,
        });
      }
    }
  } else if (params.tiling === 3) {
    // 正六角形
    const w = s * Math.sqrt(3);
    const h = s * 1.5;
    const cols = Math.ceil(cw / w) + 2;
    const rows = Math.ceil(ch / h) + 2;
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const cx = c * w + (r % 2 ? w / 2 : 0);
        const cy = r * h;
        /** @type {[number, number][]} */
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          pts.push([cx + Math.cos(a) * s, cy + Math.sin(a) * s]);
        }
        tiles.push({ points: pts, seed: r * 1000 + c });
      }
    }
  } else {
    // 三角+六角（trihexagonal）
    const w = s * Math.sqrt(3);
    const h = s * Math.sqrt(3);
    const cols = Math.ceil(cw / w) + 2;
    const rows = Math.ceil(ch / h) + 2;
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const cx = c * w + (r % 2 ? w / 2 : 0);
        const cy = r * h;
        /** @type {[number, number][]} */
        const hex = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i;
          hex.push([cx + Math.cos(a) * s * 0.6, cy + Math.sin(a) * s * 0.6]);
        }
        tiles.push({ points: hex, seed: r * 1000 + c });
        // 周囲の三角
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i;
          const a2 = (Math.PI / 3) * (i + 1);
          tiles.push({
            points: [
              [cx, cy],
              [cx + Math.cos(a1) * s * 0.6, cy + Math.sin(a1) * s * 0.6],
              [cx + Math.cos(a2) * s * 0.6, cy + Math.sin(a2) * s * 0.6],
            ],
            seed: r * 1000 + c * 10 + i + 999,
          });
        }
      }
    }
  }
  return tiles;
}

/** @type {Tile[]} */
let tiles = buildTiles();

// --- 描画 ---

let time = 0;

function warpPoint(x, y, seed, t) {
  if (params.warp === 0) return [x, y];
  const ph = seed * 0.11;
  const dx = Math.sin(t * params.warpSpeed + ph) * params.warp;
  const dy = Math.cos(t * params.warpSpeed * 0.9 + ph * 1.3) * params.warp;
  return [x + dx, y + dy];
}

function render() {
  ctx.fillStyle = '#0a0a10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((params.rotate * Math.PI) / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  ctx.lineWidth = params.lineWidth;
  ctx.lineJoin = 'round';
  for (const t of tiles) {
    const h =
      (params.hueBase + ((t.seed * 37) % 360) * (params.hueSpread / 360)) % 360;
    const pulse =
      1 + Math.sin(time * params.pulseSpeed + t.seed) * params.pulse;
    const l = Math.max(0, Math.min(100, params.lightness * pulse));
    ctx.fillStyle = `hsla(${h}, ${params.saturation}%, ${l}%, ${params.fillAlpha})`;
    ctx.strokeStyle = `hsla(${h}, ${params.saturation}%, ${Math.min(100, l + 20)}%, ${params.strokeAlpha})`;
    ctx.beginPath();
    const [x0, y0] = warpPoint(t.points[0][0], t.points[0][1], t.seed, time);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < t.points.length; i++) {
      const [x, y] = warpPoint(
        t.points[i][0],
        t.points[i][1],
        t.seed + i,
        time,
      );
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    if (params.showStroke) ctx.stroke();
  }
  ctx.restore();
}

function loop(now) {
  time = now / 1000;
  render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

function rebuild() {
  tiles = buildTiles();
}

window.addEventListener('resize', rebuild);

// --- GUI ---

const gui = new TileUI({
  title: 'Tessellation Lab',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'tiling', 1, 4, 1).onChange(rebuild);
gui.add(params, 'size', 12, 160, 1).onChange(rebuild);
gui.add(params, 'rotate', 0, 360, 1);
gui.add(params, 'warp', 0, 30, 0.5);
gui.add(params, 'warpSpeed', 0, 3, 0.05);
gui.add(params, 'lineWidth', 0, 6, 0.1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'hueSpread', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'lightness', 10, 90, 1);
gui.add(params, 'fillAlpha', 0, 1, 0.01);
gui.add(params, 'strokeAlpha', 0, 1, 0.01);
gui.add(params, 'pulse', 0, 0.5, 0.01);
gui.add(params, 'pulseSpeed', 0, 5, 0.05);
gui.add(params, 'showStroke');

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
  params.tiling = rand(1, 4, 1);
  params.size = rand(24, 100, 1);
  params.rotate = rand(0, 360, 1);
  params.warp = rand(0, 15, 0.5);
  params.hueBase = rand(0, 360, 1);
  params.hueSpread = rand(30, 300, 1);
  params.saturation = rand(30, 90, 1);
  params.lightness = rand(35, 70, 1);
  params.pulse = rand(0, 0.3, 0.01);
  rebuild();
  gui.updateDisplay();
});

gui.addButton('Rebuild', () => rebuild());

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuild();
  gui.updateDisplay();
});
