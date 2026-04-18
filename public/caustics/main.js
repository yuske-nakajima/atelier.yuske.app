// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  waves: 6,
  freq: 6,
  speed: 0.8,
  depth: 0.4,
  brightness: 1.4,
  tint: 200,
  gain: 2.2,
  blur: 0.6,
  resolution: 3,
  jitter: 0.3,
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

let waves = [];
function reseed() {
  waves = [];
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    waves.push({
      kx: Math.cos(a),
      ky: Math.sin(a),
      phase: Math.random() * Math.PI * 2,
    });
  }
}
reseed();

function rand(min, max, step = 0.01) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

let time = 0;
const off = document.createElement('canvas');
const offCtx = /** @type {CanvasRenderingContext2D} */ (off.getContext('2d'));

function tick() {
  time += 1 / 60;
  const r = Math.max(1, params.resolution | 0);
  const w = Math.max(4, Math.floor(canvas.width / r));
  const h = Math.max(4, Math.floor(canvas.height / r));
  off.width = w;
  off.height = h;
  const img = offCtx.createImageData(w, h);
  const n = Math.max(1, params.waves | 0);
  const t = time * params.speed;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x / w) * 2 - 1;
      const v = (y / h) * 2 - 1;
      let hx = 0,
        hy = 0;
      for (let i = 0; i < n; i++) {
        const wv = waves[i];
        const k = params.freq;
        const phase =
          k * (wv.kx * u + wv.ky * v) +
          t * (1 + params.jitter * wv.phase) +
          wv.phase;
        const amp = params.depth / n;
        hx += -wv.kx * k * Math.sin(phase) * amp;
        hy += -wv.ky * k * Math.sin(phase) * amp;
      }
      const det = (1 + hx) * (1 + hy) - hx * hy;
      const focus = 1 / Math.max(0.01, Math.abs(det));
      const b = Math.min(1, focus * params.gain * 0.05) * params.brightness;
      const sat = 0.5;
      const hue = params.tint / 360;
      const rr =
        b * (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * hue)));
      const gg =
        b *
        (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * (hue - 1 / 3))));
      const bb =
        b *
        (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * (hue - 2 / 3))));
      const idx = (y * w + x) * 4;
      img.data[idx] = Math.min(255, rr * 255);
      img.data[idx + 1] = Math.min(255, gg * 255);
      img.data[idx + 2] = Math.min(255, bb * 255);
      img.data[idx + 3] = 255;
    }
  }
  offCtx.putImageData(img, 0, 0);
  ctx.filter = `blur(${params.blur}px)`;
  ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
  ctx.filter = 'none';
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Caustics',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'waves', 1, 16, 1);
gui.add(params, 'freq', 1, 20, 0.1);
gui.add(params, 'speed', 0, 3, 0.01);
gui.add(params, 'depth', 0, 1.2, 0.01);
gui.add(params, 'brightness', 0, 3, 0.01);
gui.add(params, 'tint', 0, 360, 1);
gui.add(params, 'gain', 0.1, 6, 0.01);
gui.add(params, 'blur', 0, 4, 0.1);
gui.add(params, 'resolution', 1, 8, 1);
gui.add(params, 'jitter', 0, 1, 0.01);
gui.addButton('Random', () => {
  params.waves = rand(3, 12, 1);
  params.freq = rand(2, 14, 0.1);
  params.speed = rand(0.2, 2, 0.01);
  params.depth = rand(0.2, 0.8, 0.01);
  params.brightness = rand(0.8, 2, 0.01);
  params.tint = rand(0, 360, 1);
  params.gain = rand(1, 4, 0.01);
  params.jitter = rand(0, 0.6, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
