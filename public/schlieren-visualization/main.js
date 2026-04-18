// @ts-check
import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  sources: 5,
  speed: 0.8,
  freq: 3.5,
  amp: 0.6,
  knife: 0.5,
  contrast: 1.8,
  hue: 200,
  saturation: 50,
  resolution: 3,
  turbulence: 0.4,
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

let sPos = [];
function reseed() {
  sPos = [];
  for (let i = 0; i < 12; i++) {
    sPos.push({
      x: Math.random(),
      y: Math.random(),
      p: Math.random() * Math.PI * 2,
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
  const n = Math.max(1, params.sources | 0);
  const t = time * params.speed;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let dens = 0;
      const u = x / w;
      const v = y / h;
      for (let i = 0; i < n; i++) {
        const s = sPos[i];
        const dx = u - s.x;
        const dy = v - s.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        dens += (Math.sin(d * params.freq * 10 - t * 2 + s.p) / d) * 0.02;
      }
      dens +=
        params.turbulence *
        Math.sin((u + t * 0.1) * 20) *
        Math.cos((v - t * 0.07) * 18) *
        0.3;
      const grad = dens * params.amp;
      const b = Math.max(
        0,
        Math.min(1, 0.5 + (grad - (params.knife - 0.5)) * params.contrast),
      );
      const sat = params.saturation / 100;
      const hue = params.hue / 360;
      const rr =
        b * (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * hue)));
      const gg =
        b *
        (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * (hue - 1 / 3))));
      const bb =
        b *
        (1 - sat + sat * (0.5 + 0.5 * Math.cos(2 * Math.PI * (hue - 2 / 3))));
      const idx = (y * w + x) * 4;
      img.data[idx] = rr * 255;
      img.data[idx + 1] = gg * 255;
      img.data[idx + 2] = bb * 255;
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
  title: 'Schlieren',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});
gui.add(params, 'sources', 1, 12, 1);
gui.add(params, 'speed', 0, 3, 0.01);
gui.add(params, 'freq', 0.5, 10, 0.01);
gui.add(params, 'amp', 0, 2, 0.01);
gui.add(params, 'knife', 0, 1, 0.01);
gui.add(params, 'contrast', 0.2, 5, 0.01);
gui.add(params, 'hue', 0, 360, 1);
gui.add(params, 'saturation', 0, 100, 1);
gui.add(params, 'resolution', 1, 8, 1);
gui.add(params, 'turbulence', 0, 1, 0.01);
gui.addButton('Random', () => {
  params.sources = rand(2, 10, 1);
  params.speed = rand(0.3, 2, 0.01);
  params.freq = rand(1, 8, 0.01);
  params.amp = rand(0.3, 1.2, 0.01);
  params.knife = rand(0.2, 0.8, 0.01);
  params.contrast = rand(1, 3, 0.01);
  params.hue = rand(0, 360, 1);
  params.saturation = rand(20, 80, 1);
  params.turbulence = rand(0.1, 0.8, 0.01);
  reseed();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reseed();
  gui.updateDisplay();
});
