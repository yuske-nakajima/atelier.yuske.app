// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- プリセット ---

const presets = {
  1: { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25 }, // 木
  2: { axiom: 'F', rules: { F: 'FF+[+F-F-F]-[-F+F+F]' }, angle: 22.5 }, // 草
  3: { axiom: 'F', rules: { F: 'F[+F]F[-F]F' }, angle: 25.7 }, // シダ
  4: { axiom: 'F', rules: { F: 'F[+F]F[-F][F]' }, angle: 20 }, // 灌木
};

const params = {
  preset: 1,
  iterations: 5, // 展開回数
  angle: 25, // 回転角度（度）
  length: 8, // 1 セグメントの長さ
  lengthDecay: 1.0, // 深さごとの縮小率
  startAngle: -90, // 開始角度（上向き）
  lineWidth: 1.5, // 線幅
  hue: 120, // 色相
  hueDelta: 15, // 深さごとの色相変化
  saturation: 60, // 彩度
  brightness: 55, // 明度
  jitter: 0, // 角度ジッター
  bgAlpha: 1.0, // 背景クリア濃度
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

// --- L-System 展開 ---

/**
 * @param {string} axiom
 * @param {Record<string, string>} rules
 * @param {number} n
 */
function expand(axiom, rules, n) {
  let s = axiom;
  for (let i = 0; i < n; i++) {
    let next = '';
    for (const ch of s) {
      next += rules[ch] ?? ch;
    }
    s = next;
    // 安全装置: 長すぎる文字列を打ち切る
    if (s.length > 500000) break;
  }
  return s;
}

function draw() {
  ctx.fillStyle = `rgba(8, 8, 12, ${params.bgAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const preset = presets[/** @type {1|2|3|4} */ (params.preset)] ?? presets[1];
  const s = expand(preset.axiom, preset.rules, Math.round(params.iterations));

  const angleRad = (params.angle * Math.PI) / 180;
  const startRad = (params.startAngle * Math.PI) / 180;

  /** @type {{x:number, y:number, a:number, len:number, depth:number}[]} */
  const stack = [];
  let x = canvas.width / 2;
  let y = canvas.height * 0.95;
  let a = startRad;
  let len = params.length;
  let depth = 0;

  ctx.lineWidth = Math.max(0.0625, params.lineWidth);
  ctx.lineCap = 'round';

  for (const ch of s) {
    if (ch === 'F' || ch === 'G') {
      const jitter = (Math.random() - 0.5) * params.jitter * (Math.PI / 180);
      const nx = x + Math.cos(a + jitter) * len;
      const ny = y + Math.sin(a + jitter) * len;
      const hue = (params.hue + depth * params.hueDelta) % 360;
      ctx.strokeStyle = `hsl(${hue}, ${params.saturation}%, ${params.brightness}%)`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      x = nx;
      y = ny;
    } else if (ch === '+') {
      a += angleRad;
    } else if (ch === '-') {
      a -= angleRad;
    } else if (ch === '[') {
      stack.push({ x, y, a, len, depth });
      len *= params.lengthDecay;
      depth++;
    } else if (ch === ']') {
      const popped = stack.pop();
      if (popped) {
        x = popped.x;
        y = popped.y;
        a = popped.a;
        len = popped.len;
        depth = popped.depth;
      }
    }
  }
}

resize();

// --- GUI ---

const gui = new TileUI({
  title: 'L-System Garden',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

function onChange() {
  const preset = presets[/** @type {1|2|3|4} */ (params.preset)];
  if (preset) params.angle = preset.angle;
  draw();
}

gui.add(params, 'preset', 1, 4, 1).onChange(onChange);
gui.add(params, 'iterations', 1, 7, 1).onChange(() => draw());
gui.add(params, 'angle', 5, 90, 0.1).onChange(() => draw());
gui.add(params, 'length', 1, 30, 0.1).onChange(() => draw());
gui.add(params, 'lengthDecay', 0.5, 1.1, 0.01).onChange(() => draw());
gui.add(params, 'startAngle', -180, 180, 1).onChange(() => draw());
gui.add(params, 'lineWidth', 0.25, 6, 0.05).onChange(() => draw());
gui.add(params, 'hue', 0, 360, 1).onChange(() => draw());
gui.add(params, 'hueDelta', -30, 30, 0.5).onChange(() => draw());
gui.add(params, 'saturation', 0, 100, 1).onChange(() => draw());
gui.add(params, 'brightness', 0, 100, 1).onChange(() => draw());
gui.add(params, 'jitter', 0, 20, 0.1).onChange(() => draw());

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}

gui.addButton('Random', () => {
  params.preset = rand(1, 4, 1);
  const preset = presets[/** @type {1|2|3|4} */ (params.preset)];
  params.angle = preset.angle + rand(-5, 5, 0.1);
  params.iterations = rand(3, 5, 1);
  params.length = rand(4, 14, 0.5);
  params.lengthDecay = rand(0.85, 1.05, 0.01);
  params.hue = rand(60, 360, 1);
  params.hueDelta = rand(-15, 15, 0.5);
  params.jitter = rand(0, 6, 0.1);
  draw();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  draw();
  gui.updateDisplay();
});
