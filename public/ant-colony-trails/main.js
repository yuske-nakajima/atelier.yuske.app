// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

const params = {
  ants: 300,
  speed: 1.4,
  turnSpeed: 0.3,
  sensorDist: 14,
  sensorAngle: 0.5,
  fade: 0.02,
  deposit: 0.4,
  hue: 30,
  saturation: 80,
  lightness: 60,
  bgHue: 210,
  bgLight: 8,
};
const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
const tctx = /** @type {CanvasRenderingContext2D} */ (
  document.createElement('canvas').getContext('2d')
);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  tctx.canvas.width = canvas.width;
  tctx.canvas.height = canvas.height;
  tctx.fillStyle = '#000';
  tctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

/** @type {Array<{x:number,y:number,a:number}>} */
let ants = [];

function reset() {
  ants = [];
  const n = Math.round(params.ants);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  for (let i = 0; i < n; i++) {
    ants.push({
      x: cx,
      y: cy,
      a: (i / n) * Math.PI * 2,
    });
  }
  tctx.fillStyle = '#000';
  tctx.fillRect(0, 0, canvas.width, canvas.height);
}
reset();

/** @param {number} x @param {number} y */
function sense(x, y) {
  x = ((x % canvas.width) + canvas.width) % canvas.width;
  y = ((y % canvas.height) + canvas.height) % canvas.height;
  const data = tctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
  return data[0];
}

function step() {
  // フェード
  tctx.fillStyle = `rgba(0,0,0,${params.fade})`;
  tctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const ant of ants) {
    // 3センサー
    const d = params.sensorDist;
    const sa = params.sensorAngle;
    const cF = sense(ant.x + Math.cos(ant.a) * d, ant.y + Math.sin(ant.a) * d);
    const cL = sense(
      ant.x + Math.cos(ant.a - sa) * d,
      ant.y + Math.sin(ant.a - sa) * d,
    );
    const cR = sense(
      ant.x + Math.cos(ant.a + sa) * d,
      ant.y + Math.sin(ant.a + sa) * d,
    );
    if (cF > cL && cF > cR) {
      // そのまま
    } else if (cL > cR) ant.a -= params.turnSpeed;
    else if (cR > cL) ant.a += params.turnSpeed;
    else ant.a += (Math.random() - 0.5) * params.turnSpeed;
    ant.x += Math.cos(ant.a) * params.speed;
    ant.y += Math.sin(ant.a) * params.speed;
    ant.x = ((ant.x % canvas.width) + canvas.width) % canvas.width;
    ant.y = ((ant.y % canvas.height) + canvas.height) % canvas.height;
    // 蓄積
    tctx.fillStyle = `rgba(255,255,255,${params.deposit})`;
    tctx.fillRect(ant.x, ant.y, 1.5, 1.5);
  }
  // 出力
  ctx.fillStyle = `hsl(${params.bgHue}, 30%, ${params.bgLight}%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = `hsl(${params.hue}, ${params.saturation}%, ${params.lightness}%)`;
  ctx.drawImage(tctx.canvas, 0, 0);
  // 色を適用
  ctx.globalCompositeOperation = 'source-over';
  requestAnimationFrame(step);
}
step();

const gui = new TileUI({
  title: 'Ant Colony Trails',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

/** @type {Array<[keyof typeof params, number, number, number]>} */
const ctrls = [
  ['ants', 20, 1500, 10],
  ['speed', 0.3, 4, 0.05],
  ['turnSpeed', 0.05, 1, 0.01],
  ['sensorDist', 4, 40, 0.5],
  ['sensorAngle', 0.1, 1.5, 0.02],
  ['fade', 0, 0.2, 0.005],
  ['deposit', 0.05, 1, 0.01],
  ['hue', 0, 360, 1],
  ['saturation', 0, 100, 1],
  ['lightness', 30, 80, 1],
  ['bgHue', 0, 360, 1],
  ['bgLight', 0, 30, 1],
];
for (const [k, a, b, s] of ctrls) {
  gui.add(params, k, a, b, s).onChange(() => {
    if (k === 'ants') reset();
  });
}

/**
 * @param {number} min
 * @param {number} max
 * @param {number} step
 */
function rand(min, max, step = 1) {
  return Math.round((min + Math.random() * (max - min)) / step) * step;
}

gui.addButton('Random', () => {
  params.ants = rand(100, 800, 10);
  params.speed = rand(0.8, 2.5, 0.05);
  params.sensorDist = rand(6, 25, 0.5);
  params.sensorAngle = rand(0.3, 0.9, 0.02);
  params.hue = rand(0, 360, 1);
  reset();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  gui.updateDisplay();
});
