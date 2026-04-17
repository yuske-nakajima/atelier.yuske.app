// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// Ulam / Sacks Spiral: 整数を螺旋に並べ、素数だけを点として描くと
// 直線状の配列（素数多項式の軌跡）が浮かび上がる。

const params = {
  count: 8000, // 描画する整数の個数
  mode: 0, // 0: Ulam (正方形螺旋), 1: Sacks (極螺旋)
  scale: 6, // マス目 / 半径係数
  dotSize: 2.0, // 点サイズ
  hue: 200, // 素数の色相
  saturation: 70, // 彩度
  lightness: 70, // 明度
  nonPrimeAlpha: 0.03, // 非素数の透明度（0 で非表示）
  highlightTwins: 0, // 双子素数を強調
  bg: 4, // 背景明度
  offset: 0, // 開始値
  rotation: 0, // 回転（度）
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
 * エラトステネスの篩で n 以下の素数を列挙する。
 * @param {number} n
 */
function sieve(n) {
  const arr = new Uint8Array(n + 1);
  for (let i = 2; i * i <= n; i++) {
    if (!arr[i]) {
      for (let j = i * i; j <= n; j += i) arr[j] = 1;
    }
  }
  return arr;
}

/**
 * Ulam 螺旋の座標を返す。
 * @param {number} k
 * @returns {[number, number]}
 */
function ulam(k) {
  if (k === 0) return [0, 0];
  const r = Math.ceil((Math.sqrt(k + 1) - 1) / 2);
  const prev = (2 * r - 1) * (2 * r - 1);
  const d = k - prev;
  const side = 2 * r;
  if (d <= side) return [r, -r + d];
  if (d <= side * 2) return [r - (d - side), r];
  if (d <= side * 3) return [-r, r - (d - side * 2)];
  return [-r + (d - side * 3), -r];
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);

  const n = Math.floor(params.count);
  const offset = Math.floor(params.offset);
  const primes = sieve(n + offset + 2);
  const ox = w / 2;
  const oy = h / 2;
  const s = params.scale;
  const rot = (params.rotation * Math.PI) / 180;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  for (let k = 1; k <= n; k++) {
    const v = k + offset;
    const isPrime = primes[v] === 0 && v >= 2;
    let px;
    let py;
    if (params.mode === 0) {
      const [x, y] = ulam(k - 1);
      px = x * s;
      py = y * s;
    } else {
      const r = Math.sqrt(v) * s * 0.7;
      const ang = Math.sqrt(v) * Math.PI * 2;
      px = Math.cos(ang) * r;
      py = Math.sin(ang) * r;
    }
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;

    if (isPrime) {
      const isTwin =
        params.highlightTwins !== 0 &&
        (primes[v - 2] === 0 || primes[v + 2] === 0);
      ctx.fillStyle = isTwin
        ? `hsl(${(params.hue + 180) % 360}, 80%, 70%)`
        : `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
      ctx.fillRect(
        ox + rx - params.dotSize / 2,
        oy + ry - params.dotSize / 2,
        params.dotSize,
        params.dotSize,
      );
    } else if (params.nonPrimeAlpha > 0) {
      ctx.fillStyle = `hsla(0, 0%, 50%, ${params.nonPrimeAlpha})`;
      ctx.fillRect(ox + rx - 0.5, oy + ry - 0.5, 1, 1);
    }
  }
}
resize();

// --- GUI ---

const gui = new TileUI({
  title: 'Prime Spiral',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 500, 40000, 100).onChange(draw);
gui.add(params, 'mode', 0, 1, 1).onChange(draw);
gui.add(params, 'scale', 2, 16, 0.5).onChange(draw);
gui.add(params, 'dotSize', 1, 6, 0.1).onChange(draw);
gui.add(params, 'hue', 0, 360, 1).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 30, 90, 1).onChange(draw);
gui.add(params, 'nonPrimeAlpha', 0, 0.2, 0.005).onChange(draw);
gui.add(params, 'highlightTwins', 0, 1, 1).onChange(draw);
gui.add(params, 'bg', 0, 30, 1).onChange(draw);
gui.add(params, 'offset', 0, 1000, 1).onChange(draw);
gui.add(params, 'rotation', 0, 360, 1).onChange(draw);

gui.addButton('Random', () => {
  params.hue = Math.floor(Math.random() * 360);
  params.rotation = Math.floor(Math.random() * 360);
  params.mode = Math.random() < 0.5 ? 0 : 1;
  params.offset = Math.floor(Math.random() * 500);
  params.highlightTwins = Math.random() < 0.5 ? 0 : 1;
  gui.updateDisplay();
  draw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
