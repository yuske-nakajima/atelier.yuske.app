// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---

const GOLDEN = (1 + Math.sqrt(5)) / 2;

const params = {
  depth: 5, // 分割の再帰深さ
  size: 0.9, // 初期サイズ（画面に対する割合）
  thinHue: 210, // Thin ひし形の色相
  thickHue: 350, // Thick ひし形の色相
  saturation: 0.7, // 彩度
  lightness: 0.55, // 明度
  rotation: 0, // 全体回転（度）
  rotateSpeed: 0.25, // 自動回転速度（度/秒）
  stroke: 0.04, // ストローク幅（サイズに対する比）
  strokeAlpha: 0.7, // ストロークの不透明度
  pulse: 0.25, // 明滅の強さ
  pulseSpeed: 0.6, // 明滅の速さ
  bgColor: '#0a0912',
};

const defaults = { ...params };

// --- Canvas ---

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

// --- タイル生成（P3: Thin/Thick ひし形の分割） ---

/**
 * 1 枚のひし形を { type, a, b, c } で表現。a, b, c は頂点（複素数 [x,y]）。
 * 分割ルールは https://preshing.com/20110831/penrose-tiling-explained/ に準拠。
 * @typedef {{ type: 0 | 1, a: [number, number], b: [number, number], c: [number, number] }} Tri
 */

/**
 * @param {[number, number]} p
 * @param {[number, number]} q
 * @param {number} t
 * @returns {[number, number]}
 */
function lerp(p, q, t) {
  return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
}

/**
 * 初期図形：10 枚の細長い三角形で正十角形を構成する
 * @param {number} radius
 */
function seed(radius) {
  /** @type {Tri[]} */
  const tris = [];
  for (let i = 0; i < 10; i++) {
    /** @type {[number, number]} */
    const b = [
      radius * Math.cos(((2 * i - 1) * Math.PI) / 10),
      radius * Math.sin(((2 * i - 1) * Math.PI) / 10),
    ];
    /** @type {[number, number]} */
    const c = [
      radius * Math.cos(((2 * i + 1) * Math.PI) / 10),
      radius * Math.sin(((2 * i + 1) * Math.PI) / 10),
    ];
    if (i % 2 === 0) {
      tris.push({ type: 0, a: [0, 0], b: c, c: b });
    } else {
      tris.push({ type: 0, a: [0, 0], b, c });
    }
  }
  return tris;
}

/**
 * 1 ステップ分割
 * @param {Tri[]} tris
 */
function subdivide(tris) {
  /** @type {Tri[]} */
  const out = [];
  const inv = 1 / GOLDEN;
  for (const t of tris) {
    if (t.type === 0) {
      const p = lerp(t.a, t.b, inv);
      out.push({ type: 0, a: t.c, b: p, c: t.b });
      out.push({ type: 1, a: p, b: t.c, c: t.a });
    } else {
      const q = lerp(t.b, t.a, inv);
      const r = lerp(t.b, t.c, inv);
      out.push({ type: 1, a: r, b: t.c, c: t.a });
      out.push({ type: 1, a: q, b: r, c: t.b });
      out.push({ type: 0, a: r, b: q, c: t.a });
    }
  }
  return out;
}

/** @type {Tri[]} */
let tiles = [];

function rebuild() {
  const r = (Math.min(canvas.width, canvas.height) / 2) * params.size;
  let ts = seed(r);
  for (let i = 0; i < params.depth; i++) ts = subdivide(ts);
  tiles = ts;
}

rebuild();
window.addEventListener('resize', rebuild);

// --- 描画 ---

let time = 0;

/**
 * HSL → 文字列
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @param {number} a
 */
function hsla(h, s, l, a) {
  return `hsla(${((h % 360) + 360) % 360}, ${s * 100}%, ${l * 100}%, ${a})`;
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = params.bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  const rot =
    (params.rotation + time * params.rotateSpeed * 60) * (Math.PI / 180);
  ctx.rotate(rot);

  const lw = Math.max(
    0.0625,
    params.stroke * Math.min(canvas.width, canvas.height) * 0.01,
  );
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';

  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    const hueBase = t.type === 0 ? params.thinHue : params.thickHue;
    const pulseV = Math.sin(time * params.pulseSpeed * Math.PI * 2 + i * 0.013);
    const light = Math.max(
      0.05,
      Math.min(0.95, params.lightness + pulseV * params.pulse * 0.25),
    );
    ctx.fillStyle = hsla(hueBase, params.saturation, light, 1);
    // 反射（P3 は一対のひし形で埋めるため 2 枚目を鏡映）
    ctx.beginPath();
    ctx.moveTo(t.a[0], t.a[1]);
    ctx.lineTo(t.b[0], t.b[1]);
    // 4 つ目の頂点を a + (c-b)
    ctx.lineTo(t.a[0] + (t.c[0] - t.b[0]), t.a[1] + (t.c[1] - t.b[1]));
    ctx.lineTo(t.c[0], t.c[1]);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hsla(
      hueBase,
      params.saturation,
      0.15,
      params.strokeAlpha,
    );
    ctx.stroke();
  }
  ctx.restore();
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}

tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Penrose Tiling',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'depth', 1, 7, 1).onChange(rebuild);
gui.add(params, 'size', 0.3, 1.4, 0.01).onChange(rebuild);
gui.add(params, 'thinHue', 0, 360, 1);
gui.add(params, 'thickHue', 0, 360, 1);
gui.add(params, 'saturation', 0, 1, 0.01);
gui.add(params, 'lightness', 0.1, 0.9, 0.01);
gui.add(params, 'rotation', 0, 360, 1);
gui.add(params, 'rotateSpeed', -3, 3, 0.05);
gui.add(params, 'stroke', 0, 0.2, 0.005);
gui.add(params, 'strokeAlpha', 0, 1, 0.01);
gui.add(params, 'pulse', 0, 1, 0.01);
gui.add(params, 'pulseSpeed', 0, 3, 0.01);
gui.addColor(params, 'bgColor');

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
  params.thinHue = rand(0, 360, 1);
  params.thickHue = rand(0, 360, 1);
  params.saturation = rand(0.3, 1, 0.01);
  params.lightness = rand(0.35, 0.7, 0.01);
  params.rotateSpeed = rand(-1.5, 1.5, 0.05);
  params.stroke = rand(0.01, 0.08, 0.005);
  params.pulse = rand(0, 0.5, 0.01);
  params.pulseSpeed = rand(0.1, 1.5, 0.01);
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuild();
  gui.updateDisplay();
});
