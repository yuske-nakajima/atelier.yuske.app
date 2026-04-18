// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  sep: 120,
  wavelength: 9,
  resolution: 2,
  phaseSpeed: 1.2,
  sepOscillate: 0.3,
  sepFreq: 0.4,
  hueA: 200,
  hueB: 340,
  brightness: 1.5,
  contrast: 1.6,
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

function rand(min, max, step = 0.01) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

const off = document.createElement('canvas');
const offCtx = /** @type {CanvasRenderingContext2D} */ (off.getContext('2d'));
let time = 0;
function tick() {
  time += 1 / 60;
  const r = Math.max(1, params.resolution | 0);
  const w = Math.max(4, Math.floor(canvas.width / r));
  const h = Math.max(4, Math.floor(canvas.height / r));
  off.width = w;
  off.height = h;
  const img = offCtx.createImageData(w, h);
  const sep =
    (params.sep +
      Math.sin(time * params.sepFreq) * params.sepOscillate * params.sep) /
    r;
  const lam = params.wavelength / r;
  const k = (2 * Math.PI) / lam;
  const cx = w / 2,
    cy = h / 2;
  const s1 = { x: cx, y: cy - sep / 2 };
  const s2 = { x: cx, y: cy + sep / 2 };
  const phase = time * params.phaseSpeed * Math.PI;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r1 = Math.hypot(x - s1.x, y - s1.y);
      const r2 = Math.hypot(x - s2.x, y - s2.y);
      const e1 = Math.cos(k * r1 - phase);
      const e2 = Math.cos(k * r2 - phase);
      const interf = (e1 + e2) * 0.5;
      const I = interf * interf * params.brightness;
      const b = Math.min(1, I * params.contrast);
      // 色: 干渉の空間周波数に応じてA/Bを混ぜる
      const mix = 0.5 + 0.5 * (e1 * e2);
      const h1 = params.hueA / 360,
        h2 = params.hueB / 360;
      const hue = h1 * (1 - mix) + h2 * mix;
      const sat = 0.85;
      const idx = (y * w + x) * 4;
      img.data[idx] =
        b * 255 * (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * hue)));
      img.data[idx + 1] =
        b *
        255 *
        (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * (hue - 1 / 3))));
      img.data[idx + 2] =
        b *
        255 *
        (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * (hue - 2 / 3))));
      img.data[idx + 3] = 255;
    }
  }
  offCtx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Young Fringes',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'sep', 30, 400, 1);
gui.add(params, 'wavelength', 2, 30, 0.1);
gui.add(params, 'resolution', 1, 6, 1);
gui.add(params, 'phaseSpeed', 0, 4, 0.01);
gui.add(params, 'sepOscillate', 0, 0.8, 0.01);
gui.add(params, 'sepFreq', 0, 2, 0.01);
gui.add(params, 'hueA', 0, 360, 1);
gui.add(params, 'hueB', 0, 360, 1);
gui.add(params, 'brightness', 0.2, 3, 0.01);
gui.add(params, 'contrast', 0.3, 3, 0.01);
gui.addButton('Random', () => {
  params.sep = rand(60, 260, 1);
  params.wavelength = rand(4, 18, 0.1);
  params.hueA = rand(0, 360, 1);
  params.hueB = rand(0, 360, 1);
  params.sepOscillate = rand(0, 0.5, 0.01);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
