// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// Collatz: n が偶数なら n/2、奇数なら 3n+1。1 に至るまでの軌道を
// 終端から逆向きに枝として描くと有機的な樹形が現れる。

const params = {
  count: 2000, // 軌道を計算する起点の個数
  angleEven: 8, // 偶数ステップで曲げる角度（度）
  angleOdd: 16, // 奇数ステップで曲げる角度（度）
  stepLength: 4, // 1 ステップの長さ
  lineWidth: 0.8, // 線の太さ
  hue: 120, // 色相
  hueShift: 0.3, // 深さでの色相シフト
  saturation: 60, // 彩度
  lightness: 60, // 明度
  alpha: 0.18, // 線の透明度
  bg: 6, // 背景明度
  rootX: 0.5, // 根の x 位置
  rootY: 0.92, // 根の y 位置
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
 * n の Collatz 軌道を返す（1 に到達するまで）。
 * @param {number} n
 */
function trajectory(n) {
  const seq = [n];
  let x = n;
  while (x !== 1 && seq.length < 2000) {
    x = x % 2 === 0 ? x / 2 : 3 * x + 1;
    seq.push(x);
  }
  return seq;
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);
  const rx = params.rootX * w;
  const ry = params.rootY * h;
  const aE = (params.angleEven * Math.PI) / 180;
  const aO = (params.angleOdd * Math.PI) / 180;
  const step = params.stepLength;
  ctx.lineWidth = params.lineWidth;

  const count = Math.floor(params.count);
  for (let i = 2; i < count + 2; i++) {
    const seq = trajectory(i).reverse();
    let x = rx;
    let y = ry;
    let ang = -Math.PI / 2; // 上向きから始める
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 1; k < seq.length; k++) {
      const prev = seq[k - 1];
      ang += prev % 2 === 0 ? aE : -aO;
      x += Math.cos(ang) * step;
      y += Math.sin(ang) * step;
      ctx.lineTo(x, y);
    }
    const hue = (params.hue + seq.length * params.hueShift) % 360;
    ctx.strokeStyle = `hsla(${hue}, ${params.saturation}%, ${params.lightness}%, ${params.alpha})`;
    ctx.stroke();
  }
}
resize();

// --- GUI ---

const gui = new TileUI({
  title: 'Collatz',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 100, 8000, 50).onChange(draw);
gui.add(params, 'angleEven', 0, 30, 0.1).onChange(draw);
gui.add(params, 'angleOdd', 0, 30, 0.1).onChange(draw);
gui.add(params, 'stepLength', 1, 12, 0.1).onChange(draw);
gui.add(params, 'lineWidth', 0.3, 3, 0.1).onChange(draw);
gui.add(params, 'hue', 0, 360, 1).onChange(draw);
gui.add(params, 'hueShift', 0, 2, 0.01).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 30, 90, 1).onChange(draw);
gui.add(params, 'alpha', 0.02, 0.8, 0.01).onChange(draw);
gui.add(params, 'rootY', 0.3, 0.98, 0.01).onChange(draw);
gui.add(params, 'bg', 0, 20, 1).onChange(draw);

gui.addButton('Random', () => {
  params.angleEven = 4 + Math.random() * 14;
  params.angleOdd = 6 + Math.random() * 18;
  params.hue = Math.floor(Math.random() * 360);
  params.hueShift = Math.random() * 0.6;
  gui.updateDisplay();
  draw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
