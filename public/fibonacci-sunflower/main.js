// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 黄金角 (2π * (1 - 1/φ)) で種を順に配置すると、ひまわりの螺旋配列が現れる。
// r = c * sqrt(n), θ = n * goldenAngle

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

const params = {
  count: 1500, // 種の数
  angle: GOLDEN * (180 / Math.PI), // 回転角（度、137.507... が黄金角）
  scale: 8, // 半径係数
  seedSize: 4, // 種の基本サイズ
  sizeGrow: 0.002, // 外側で大きくなる度合い
  hue: 40, // 色相
  hueShift: 0.15, // 位置による色相変化
  saturation: 70, // 彩度
  lightness: 62, // 明度
  bg: 6, // 背景明度
  rotation: 0, // 全体回転
  shape: 0, // 0: 円, 1: 四角
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

function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = `hsl(0, 0%, ${params.bg}%)`;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const angleRad = (params.angle * Math.PI) / 180;
  const rot = (params.rotation * Math.PI) / 180;
  const count = Math.floor(params.count);
  for (let n = 0; n < count; n++) {
    const r = params.scale * Math.sqrt(n);
    const theta = n * angleRad + rot;
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    const size = params.seedSize + n * params.sizeGrow;
    const hue = (params.hue + n * params.hueShift) % 360;
    ctx.fillStyle = `hsl(${hue}, ${params.saturation}%, ${params.lightness}%)`;
    if (params.shape === 0) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
  }
}
resize();

// --- GUI ---

const gui = new TileUI({
  title: 'Sunflower',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'count', 100, 6000, 10).onChange(draw);
gui.add(params, 'angle', 130, 145, 0.01).onChange(draw);
gui.add(params, 'scale', 2, 20, 0.1).onChange(draw);
gui.add(params, 'seedSize', 1, 12, 0.1).onChange(draw);
gui.add(params, 'sizeGrow', 0, 0.02, 0.0005).onChange(draw);
gui.add(params, 'hue', 0, 360, 1).onChange(draw);
gui.add(params, 'hueShift', 0, 1, 0.01).onChange(draw);
gui.add(params, 'saturation', 0, 100, 1).onChange(draw);
gui.add(params, 'lightness', 30, 90, 1).onChange(draw);
gui.add(params, 'rotation', 0, 360, 1).onChange(draw);
gui.add(params, 'shape', 0, 1, 1).onChange(draw);
gui.add(params, 'bg', 0, 20, 1).onChange(draw);

gui.addButton('Random', () => {
  params.angle = 136 + Math.random() * 3;
  params.hue = Math.floor(Math.random() * 360);
  params.scale = 4 + Math.random() * 12;
  params.hueShift = Math.random() * 0.5;
  gui.updateDisplay();
  draw();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
  draw();
});
