// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const params = {
  starCount: 3000, // 星の数
  arms: 4, // 渦の腕の本数
  twist: 4.5, // 渦の巻き具合
  coreSize: 0.08, // コアの大きさ（0-1）
  discRadius: 0.45, // 円盤半径（0-1）
  armSpread: 0.25, // 腕の広がり（散乱度）
  rotationSpeed: 0.08, // 回転速度
  coreHue: 40, // コアの色相
  armHue: 210, // 腕の色相
  brightness: 80, // 明度
  starSize: 1.4, // 星の基本サイズ
  twinkle: 0.4, // 瞬きの強さ
  trailFade: 0.08, // 残像のフェード
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

// --- 星の生成 ---

/** @typedef {{r:number, theta0:number, arm:number, offset:number, size:number, phase:number, core:boolean}} Star */
/** @type {Star[]} */
let stars = [];

function generateStars() {
  const n = Math.round(params.starCount);
  stars = new Array(n);
  for (let i = 0; i < n; i++) {
    const core = Math.random() < 0.15;
    if (core) {
      // コアの星
      const r = Math.random() ** 2 * params.coreSize;
      stars[i] = {
        r,
        theta0: Math.random() * Math.PI * 2,
        arm: 0,
        offset: 0,
        size: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        core: true,
      };
    } else {
      const arm = Math.floor(Math.random() * Math.max(1, params.arms));
      const r =
        params.coreSize +
        Math.random() ** 0.5 * (params.discRadius - params.coreSize);
      const offset = (Math.random() - 0.5) * params.armSpread;
      stars[i] = {
        r,
        theta0: Math.random() * Math.PI * 2,
        arm,
        offset,
        size: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        core: false,
      };
    }
  }
}

generateStars();

// --- 描画 ---

let time = 0;

function tick() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(3, 3, 10, ${Math.max(0, Math.min(1, params.trailFade))})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const scale = Math.min(canvas.width, canvas.height);
  const armCount = Math.max(1, params.arms);

  for (const s of stars) {
    let theta;
    if (s.core) {
      theta = s.theta0 + time * params.rotationSpeed * 1.5;
    } else {
      const armAngle = (s.arm / armCount) * Math.PI * 2;
      const spiral =
        params.twist * Math.log(Math.max(0.001, s.r / params.coreSize));
      theta =
        armAngle +
        spiral +
        s.offset +
        (time * params.rotationSpeed) / Math.max(0.1, s.r);
    }
    const x = cx + Math.cos(theta) * s.r * scale;
    const y = cy + Math.sin(theta) * s.r * scale;

    const twinkle =
      1 -
      params.twinkle +
      params.twinkle * (0.5 + 0.5 * Math.sin(time * 3 + s.phase));
    const hue = s.core ? params.coreHue : params.armHue;
    const light = params.brightness * twinkle;
    ctx.fillStyle = `hsl(${hue}, 80%, ${Math.min(100, light)}%)`;
    const sz = s.size * params.starSize * (s.core ? 1.5 : 1);
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Galaxy Spiral',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'starCount', 100, 8000, 50).onChange(generateStars);
gui.add(params, 'arms', 1, 8, 1).onChange(generateStars);
gui.add(params, 'twist', 0, 12, 0.05);
gui.add(params, 'coreSize', 0.01, 0.3, 0.005).onChange(generateStars);
gui.add(params, 'discRadius', 0.2, 0.6, 0.005).onChange(generateStars);
gui.add(params, 'armSpread', 0, 1, 0.01).onChange(generateStars);
gui.add(params, 'rotationSpeed', -0.5, 0.5, 0.005);
gui.add(params, 'coreHue', 0, 360, 1);
gui.add(params, 'armHue', 0, 360, 1);
gui.add(params, 'brightness', 10, 100, 1);
gui.add(params, 'starSize', 0.3, 4, 0.05);
gui.add(params, 'twinkle', 0, 1, 0.01);
gui.add(params, 'trailFade', 0, 0.5, 0.005);

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function r(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.arms = r(2, 6, 1);
  params.twist = r(2, 8, 0.05);
  params.armSpread = r(0.1, 0.4, 0.01);
  params.coreHue = r(0, 360, 1);
  params.armHue = r(0, 360, 1);
  params.rotationSpeed = r(-0.2, 0.2, 0.005);
  params.starCount = r(1500, 5000, 50);
  generateStars();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  generateStars();
  gui.updateDisplay();
});
