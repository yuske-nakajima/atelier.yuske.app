// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  zones: 40,
  f: 200,
  wavelength: 8,
  resolution: 2,
  brightness: 1.4,
  hue: 200,
  twist: 0.0,
  phase: 0.0,
  contrast: 1.5,
  animate: 0.3,
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
  const cx = w / 2,
    cy = h / 2;
  const lam = params.wavelength;
  const f = params.f;
  const anim = time * params.animate * 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx,
        dy = y - cy;
      const R = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx);
      // フレネル帯: 位相 = π r² / (f λ)
      const phaseVal =
        (Math.PI * R * R) / (f * lam) +
        params.phase +
        anim +
        params.twist * theta;
      const v = 0.5 + 0.5 * Math.cos(phaseVal);
      const zoneIdx = Math.floor((R * R) / (f * lam));
      const mask = zoneIdx < params.zones ? 1 : 0.3;
      const b = v * params.contrast * params.brightness * mask;
      const idx = (y * w + x) * 4;
      const sat = 0.7;
      const hue = params.hue / 360;
      const rr =
        b * (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * hue)));
      const gg =
        b *
        (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * (hue - 1 / 3))));
      const bb =
        b *
        (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * (hue - 2 / 3))));
      img.data[idx] = Math.min(255, rr * 255);
      img.data[idx + 1] = Math.min(255, gg * 255);
      img.data[idx + 2] = Math.min(255, bb * 255);
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
  title: 'Fresnel Zone',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'zones', 2, 120, 1);
gui.add(params, 'f', 30, 600, 1);
gui.add(params, 'wavelength', 1, 30, 0.1);
gui.add(params, 'resolution', 1, 6, 1);
gui.add(params, 'brightness', 0.2, 3, 0.01);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'twist', 0, 10, 0.01);
gui.add(params, 'phase', 0, Math.PI * 2, 0.01);
gui.add(params, 'contrast', 0.3, 3, 0.01);
gui.add(params, 'animate', 0, 2, 0.01);
gui.addButton('Random', () => {
  params.zones = rand(10, 80, 1);
  params.f = rand(80, 400, 1);
  params.wavelength = rand(2, 20, 0.1);
  params.hue = rand(0, 360, 1);
  params.twist = rand(0, 6, 0.01);
  params.animate = rand(0, 1, 0.01);
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
