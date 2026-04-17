// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// サンゴが上へ成長する DLA 風ジェネレーティブ。粒子が下から漂い、最上の枝に付着して固まっていく。
const params = {
  particlesPerFrame: 15,
  particleSpeed: 1.4,
  attachRadius: 7,
  branchWidth: 5,
  hueStart: 330,
  hueEnd: 20,
  darkFloor: 40, // 海底の色
  drift: 0.5,
  backgroundFade: 0.04,
  maxNodes: 1500,
  autoRegrow: true,
  regrowInterval: 12,
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

/** @type {{x:number,y:number,depth:number}[]} */
let nodes = [];
/** @type {{x:number,y:number,vx:number,vy:number}[]} */
let particles = [];
let time = 0;
let lastRegrow = 0;

function reset() {
  nodes = [];
  particles = [];
  ctx.fillStyle = '#04070d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // 海底
  const grad = ctx.createLinearGradient(
    0,
    canvas.height,
    0,
    canvas.height - 80,
  );
  grad.addColorStop(0, 'rgba(30, 40, 55, 0.9)');
  grad.addColorStop(1, 'rgba(4, 7, 13, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
  // シード
  const seeds = 5;
  for (let i = 0; i < seeds; i++) {
    nodes.push({
      x: canvas.width * ((i + 1) / (seeds + 1)),
      y: canvas.height - 20,
      depth: 0,
    });
  }
  for (const s of nodes) {
    ctx.fillStyle = `hsla(${params.hueStart}, 80%, 60%, 0.9)`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, params.branchWidth, 0, Math.PI * 2);
    ctx.fill();
  }
}
reset();

function spawnParticle() {
  particles.push({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * params.drift,
    vy: params.particleSpeed,
  });
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(4, 7, 13, ${params.backgroundFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (
    params.autoRegrow &&
    time - lastRegrow > params.regrowInterval &&
    nodes.length > params.maxNodes
  ) {
    lastRegrow = time;
    reset();
  }

  for (let i = 0; i < params.particlesPerFrame; i++) spawnParticle();

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vx += (Math.random() - 0.5) * 0.3;
    p.x += p.vx;
    p.y += p.vy;
    if (p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
      particles.splice(i, 1);
      continue;
    }
    // ヒット判定（近傍ノードを検索：単純 O(N)）
    if (nodes.length > params.maxNodes) {
      particles.splice(i, 1);
      continue;
    }
    let attached = false;
    for (let j = nodes.length - 1; j >= Math.max(0, nodes.length - 80); j--) {
      const n = nodes[j];
      if (Math.hypot(p.x - n.x, p.y - n.y) < params.attachRadius) {
        nodes.push({ x: p.x, y: p.y, depth: n.depth + 1 });
        const k = Math.min(1, n.depth / 150);
        const hue = params.hueStart + (params.hueEnd - params.hueStart) * k;
        const sat = 80 - k * 20;
        const light = 60 - k * 20;
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, 0.9)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, params.branchWidth, 0, Math.PI * 2);
        ctx.fill();
        // 結線
        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.6)`;
        ctx.lineWidth = params.branchWidth * 0.6;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        attached = true;
        break;
      }
    }
    if (attached) {
      particles.splice(i, 1);
    } else {
      ctx.fillStyle = 'rgba(180, 220, 230, 0.3)';
      ctx.fillRect(p.x, p.y, 1, 1);
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Coral Growth',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'particlesPerFrame', 2, 40, 1);
gui.add(params, 'particleSpeed', 0.3, 4, 0.1);
gui.add(params, 'attachRadius', 3, 15, 0.5);
gui.add(params, 'branchWidth', 2, 12, 0.5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueEnd', 0, 360, 1);
gui.add(params, 'drift', 0, 3, 0.05);
gui.add(params, 'backgroundFade', 0, 0.2, 0.005);
gui.add(params, 'maxNodes', 300, 3000, 50);
gui.add(params, 'autoRegrow');
gui.add(params, 'regrowInterval', 5, 40, 0.5);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.hueStart = rand(0, 360, 1);
  params.hueEnd = rand(0, 360, 1);
  params.particlesPerFrame = rand(8, 25, 1);
  params.drift = rand(0.1, 1.2, 0.05);
  reset();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  gui.updateDisplay();
});
