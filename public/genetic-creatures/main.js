// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 遺伝的アルゴリズムで育つ生き物の群れ。遺伝子は形状（サイズ・色相・曲率）、速さ、振動数。
const params = {
  population: 40,
  mutationRate: 0.08,
  selectionPressure: 0.5,
  foodRate: 2.0,
  wiggleAmp: 1.2,
  generationSeconds: 6,
  hueStart: 120,
  hueRange: 200,
  trailFade: 0.1,
  bodyAlpha: 0.9,
  tailLength: 18,
  showFood: true,
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

/**
 * @typedef {object} Gene
 * @property {number} size
 * @property {number} hue
 * @property {number} speed
 * @property {number} wiggle
 * @property {number} curvature
 */
/**
 * @typedef {object} Creature
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} age
 * @property {number} fitness
 * @property {Gene} gene
 * @property {number[]} tail
 */

function randGene() {
  return {
    size: 4 + Math.random() * 14,
    hue: params.hueStart + Math.random() * params.hueRange,
    speed: 30 + Math.random() * 100,
    wiggle: 0.5 + Math.random() * 3,
    curvature: Math.random() * 2 - 1,
  };
}

/** @param {Gene} g */
function makeCreature(g) {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * g.speed,
    vy: (Math.random() - 0.5) * g.speed,
    age: 0,
    fitness: 0,
    gene: g,
    tail: [],
  };
}

/** @type {Creature[]} */
let creatures = [];
/** @type {{x:number,y:number}[]} */
let foods = [];
let time = 0;
let genTimer = 0;

function reset() {
  creatures = [];
  for (let i = 0; i < Math.round(params.population); i++) {
    creatures.push(makeCreature(randGene()));
  }
  foods = [];
}
reset();

function spawnFood() {
  foods.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
  });
  if (foods.length > 200) foods.shift();
}

function evolve() {
  creatures.sort((a, b) => b.fitness - a.fitness);
  const keep = Math.max(
    2,
    Math.round(creatures.length * (1 - params.selectionPressure)),
  );
  const elites = creatures.slice(0, keep);
  const next = [];
  while (next.length < creatures.length) {
    const p1 = elites[Math.floor(Math.random() * elites.length)];
    const p2 = elites[Math.floor(Math.random() * elites.length)];
    /** @type {Gene} */
    const child = {
      size: (p1.gene.size + p2.gene.size) / 2,
      hue: (p1.gene.hue + p2.gene.hue) / 2,
      speed: (p1.gene.speed + p2.gene.speed) / 2,
      wiggle: (p1.gene.wiggle + p2.gene.wiggle) / 2,
      curvature: (p1.gene.curvature + p2.gene.curvature) / 2,
    };
    if (Math.random() < params.mutationRate)
      child.size += (Math.random() - 0.5) * 4;
    if (Math.random() < params.mutationRate)
      child.hue += (Math.random() - 0.5) * 40;
    if (Math.random() < params.mutationRate)
      child.speed += (Math.random() - 0.5) * 30;
    if (Math.random() < params.mutationRate)
      child.wiggle += (Math.random() - 0.5) * 1;
    if (Math.random() < params.mutationRate)
      child.curvature += (Math.random() - 0.5) * 0.5;
    child.size = Math.max(3, Math.min(20, child.size));
    child.speed = Math.max(10, Math.min(180, child.speed));
    next.push(makeCreature(child));
  }
  creatures = next;
}

function draw() {
  const dt = 1 / 60;
  time += dt;
  genTimer += dt;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (Math.random() < params.foodRate * dt) spawnFood();
  if (genTimer > params.generationSeconds) {
    genTimer = 0;
    evolve();
  }

  if (params.showFood) {
    for (const f of foods) {
      ctx.fillStyle = 'rgba(250, 230, 120, 0.7)';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const c of creatures) {
    c.age += dt;
    // wiggle 付き移動
    const wig = Math.sin(time * c.gene.wiggle * 3 + c.age) * params.wiggleAmp;
    c.vx += (Math.cos(c.age * c.gene.curvature) * 10 + wig * 10) * dt;
    c.vy += (Math.sin(c.age * c.gene.curvature) * 10 + wig * 10) * dt;
    const sp = Math.hypot(c.vx, c.vy) || 1;
    c.vx = (c.vx / sp) * c.gene.speed;
    c.vy = (c.vy / sp) * c.gene.speed;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    if (c.x < 0) c.x += canvas.width;
    if (c.x > canvas.width) c.x -= canvas.width;
    if (c.y < 0) c.y += canvas.height;
    if (c.y > canvas.height) c.y -= canvas.height;
    c.tail.push(c.x, c.y);
    const maxPairs = params.tailLength * 2;
    while (c.tail.length > maxPairs) c.tail.shift();
    // 食べる
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      if (Math.hypot(f.x - c.x, f.y - c.y) < c.gene.size + 4) {
        foods.splice(i, 1);
        c.fitness += 1;
      }
    }
    // 描画: 尾
    ctx.strokeStyle = `hsla(${c.gene.hue}, 80%, 60%, 0.4)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < c.tail.length; i += 2) {
      const tx = c.tail[i];
      const ty = c.tail[i + 1];
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();
    // 本体
    ctx.fillStyle = `hsla(${c.gene.hue}, 85%, 65%, ${params.bodyAlpha})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.gene.size, 0, Math.PI * 2);
    ctx.fill();
    // 目
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(
      c.x + Math.cos(Math.atan2(c.vy, c.vx)) * c.gene.size * 0.4,
      c.y + Math.sin(Math.atan2(c.vy, c.vx)) * c.gene.size * 0.4,
      c.gene.size * 0.18,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Genetic Creatures',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'population', 10, 100, 1);
gui.add(params, 'mutationRate', 0, 0.3, 0.01);
gui.add(params, 'selectionPressure', 0.1, 0.9, 0.05);
gui.add(params, 'foodRate', 0.2, 8, 0.1);
gui.add(params, 'wiggleAmp', 0, 3, 0.05);
gui.add(params, 'generationSeconds', 2, 20, 0.5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'trailFade', 0.02, 0.3, 0.01);
gui.add(params, 'bodyAlpha', 0.3, 1, 0.01);
gui.add(params, 'tailLength', 4, 40, 1);
gui.add(params, 'showFood');

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.population = rand(20, 80, 1);
  params.mutationRate = rand(0.03, 0.2, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(60, 300, 1);
  reset();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  reset();
  gui.updateDisplay();
});
