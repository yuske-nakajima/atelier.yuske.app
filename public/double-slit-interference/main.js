// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  slitWidth: 20,
  slitSep: 80,
  wavelength: 10,
  resolution: 2,
  intensity: 1.6,
  hue: 200,
  phaseDiff: 0,
  barX: 0.3,
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
  const slitX = w * params.barX;
  const cy = h / 2;
  const a = params.slitWidth / r;
  const d = params.slitSep / r;
  const lam = params.wavelength / r;
  const k = (2 * Math.PI) / lam;
  const s1y = cy - d / 2,
    s2y = cy + d / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let b = 0;
      if (x < slitX) {
        b = 0.3 + 0.3 * Math.cos(x * k - time * 3);
      } else if (x - slitX < params.barWidth / r) {
        const inS1 = Math.abs(y - s1y) < a / 2;
        const inS2 = Math.abs(y - s2y) < a / 2;
        b = inS1 || inS2 ? 0.6 : 0.05;
      } else {
        const dx = x - slitX;
        const r1 = Math.sqrt(dx * dx + (y - s1y) ** 2);
        const r2 = Math.sqrt(dx * dx + (y - s2y) ** 2);
        const e1 = Math.cos(k * r1 - time * 3);
        const e2 = Math.cos(k * r2 - time * 3 + params.phaseDiff);
        const amp = ((e1 + e2) / Math.sqrt(r1 + r2)) * Math.sqrt(lam * 10);
        b = amp * amp * params.intensity;
      }
      b = Math.min(1, b * params.contrast);
      const idx = (y * w + x) * 4;
      const sat = 0.75,
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
  title: 'Double Slit',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'slitWidth', 5, 80, 1);
gui.add(params, 'slitSep', 20, 300, 1);
gui.add(params, 'wavelength', 2, 30, 0.1);
gui.add(params, 'resolution', 1, 6, 1);
gui.add(params, 'intensity', 0.3, 3, 0.01);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'phaseDiff', -Math.PI, Math.PI, 0.01);
gui.add(params, 'barX', 0.1, 0.6, 0.01);
gui.add(params, 'barWidth', 40, 300, 1);
gui.add(params, 'contrast', 0.3, 3, 0.01);
gui.addButton('Random', () => {
  params.slitWidth = rand(8, 40, 1);
  params.slitSep = rand(40, 200, 1);
  params.wavelength = rand(4, 20, 0.1);
  params.hue = rand(0, 360, 1);
  params.phaseDiff = rand(-Math.PI, Math.PI, 0.01);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
