// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  slitWidth: 30,
  wavelength: 10,
  distance: 400,
  resolution: 2,
  intensity: 1.5,
  hue: 40,
  angle: 0,
  phase: 0,
  barWidth: 140,
  contrast: 1.8,
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
  const slitX = w * 0.3;
  const cy = h / 2;
  const a = params.slitWidth / r;
  const lam = params.wavelength / r;
  const ang = (params.angle * Math.PI) / 180;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let b = 0;
      if (x < slitX) {
        // 入射側: 平面波
        const phase =
          ((x * Math.cos(ang) + (y - cy) * Math.sin(ang)) * (2 * Math.PI)) /
            lam +
          time * 3 +
          params.phase;
        b = 0.3 + 0.3 * Math.cos(phase);
      } else if (x - slitX < params.barWidth / r) {
        // バリア（スリットのみ通す）
        const inSlit = Math.abs(y - cy) < a / 2;
        b = inSlit ? 0.6 : 0.05;
      } else {
        // 回折: sinc パターン
        const dx = x - slitX;
        const dy = y - cy;
        const theta = Math.atan2(dy, dx);
        const k = (Math.PI * a * Math.sin(theta)) / lam;
        const sinc = Math.abs(k) < 1e-6 ? 1 : Math.sin(k) / k;
        const I = sinc * sinc;
        const r2 = Math.sqrt(dx * dx + dy * dy);
        const wave = Math.cos(
          (r2 * 2 * Math.PI) / lam - time * 3 + params.phase,
        );
        b = I * (0.5 + 0.5 * wave) * params.intensity;
      }
      b = Math.min(1, b * params.contrast);
      const idx = (y * w + x) * 4;
      const sat = 0.8,
        hue = params.hue / 360;
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
  title: 'Single Slit',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'slitWidth', 5, 120, 1);
gui.add(params, 'wavelength', 2, 30, 0.1);
gui.add(params, 'distance', 100, 900, 1);
gui.add(params, 'resolution', 1, 6, 1);
gui.add(params, 'intensity', 0.3, 3, 0.01);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'angle', -45, 45, 0.1);
gui.add(params, 'phase', 0, Math.PI * 2, 0.01);
gui.add(params, 'barWidth', 40, 300, 1);
gui.add(params, 'contrast', 0.3, 3, 0.01);
gui.addButton('Random', () => {
  params.slitWidth = rand(10, 80, 1);
  params.wavelength = rand(4, 20, 0.1);
  params.distance = rand(200, 700, 1);
  params.hue = rand(0, 360, 1);
  params.angle = rand(-20, 20, 0.1);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
