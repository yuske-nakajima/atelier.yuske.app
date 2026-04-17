// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// --- パラメータ ---
// 粘菌ネットワーク：化学物質勾配に従って移動するエージェントが
// 粘菌のような自己組織化ネットワークを形成する。

const params = {
  agentCount: 1500, // エージェント数
  sensorAngle: 45, // センサー角度（度）
  sensorDist: 20, // センサー距離
  turnSpeed: 0.35, // 旋回速度
  trailDecay: 0.98, // トレイル減衰率
  depositRate: 0.8, // 化学物質放出量
  agentSpeed: 1.5, // エージェント速度
  hueBase: 150, // 基本色相
  hueVar: 80, // 色相ばらつき
  trailBrightness: 65, // トレイル輝度
};

const defaults = { ...params };

const canvas = /** @type {HTMLCanvasElement} */ (
  document.getElementById('canvas')
);
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

// 化学物質グリッド（低解像度）
const SCALE = 3;
let gridW = 0;
let gridH = 0;
/** @type {Float32Array} */
let trail = new Float32Array(1);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gridW = Math.ceil(canvas.width / SCALE);
  gridH = Math.ceil(canvas.height / SCALE);
  trail = new Float32Array(gridW * gridH);
  initAgents();
}
window.addEventListener('resize', resize);

/** @typedef {{ x: number, y: number, angle: number, hue: number }} Agent */
/** @type {Agent[]} */
let agents = [];

/**
 * エージェントを初期化する（中心付近に配置）
 */
function initAgents() {
  agents = [];
  const w = canvas.width;
  const h = canvas.height;
  for (let i = 0; i < params.agentCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * Math.min(w, h) * 0.3;
    agents.push({
      x: w / 2 + Math.cos(a) * r,
      y: h / 2 + Math.sin(a) * r,
      angle: a + Math.PI,
      hue: params.hueBase + (Math.random() - 0.5) * params.hueVar,
    });
  }
}

resize();

/**
 * グリッド座標の化学物質量を取得する
 * @param {number} gx
 * @param {number} gy
 * @returns {number}
 */
function sampleTrail(gx, gy) {
  const x = Math.max(0, Math.min(gridW - 1, Math.round(gx)));
  const y = Math.max(0, Math.min(gridH - 1, Math.round(gy)));
  return trail[y * gridW + x];
}

/**
 * エージェントを1ステップ更新する
 * @param {Agent} agent
 */
function updateAgent(agent) {
  const w = canvas.width;
  const h = canvas.height;
  const sa = (params.sensorAngle * Math.PI) / 180;
  const sd = params.sensorDist;

  // 前方・左・右のセンサー
  const fl = agent.angle - sa;
  const fr = agent.angle + sa;
  const fa = agent.angle;

  const sLeft = sampleTrail(
    (agent.x + Math.cos(fl) * sd) / SCALE,
    (agent.y + Math.sin(fl) * sd) / SCALE,
  );
  const sRight = sampleTrail(
    (agent.x + Math.cos(fr) * sd) / SCALE,
    (agent.y + Math.sin(fr) * sd) / SCALE,
  );
  const sForward = sampleTrail(
    (agent.x + Math.cos(fa) * sd) / SCALE,
    (agent.y + Math.sin(fa) * sd) / SCALE,
  );

  if (sForward > sLeft && sForward > sRight) {
    // 前方が最強 → 直進
  } else if (sLeft > sRight) {
    agent.angle -= params.turnSpeed;
  } else if (sRight > sLeft) {
    agent.angle += params.turnSpeed;
  } else {
    agent.angle += (Math.random() - 0.5) * params.turnSpeed;
  }

  agent.x += Math.cos(agent.angle) * params.agentSpeed;
  agent.y += Math.sin(agent.angle) * params.agentSpeed;

  // 壁反射
  if (agent.x < 0 || agent.x > w) {
    agent.angle = Math.PI - agent.angle;
    agent.x = Math.max(0, Math.min(w, agent.x));
  }
  if (agent.y < 0 || agent.y > h) {
    agent.angle = -agent.angle;
    agent.y = Math.max(0, Math.min(h, agent.y));
  }

  // 化学物質を放出
  const gx = Math.floor(agent.x / SCALE);
  const gy = Math.floor(agent.y / SCALE);
  if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
    trail[gy * gridW + gx] = Math.min(
      1,
      trail[gy * gridW + gx] + params.depositRate * 0.05,
    );
  }
}

function draw() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = 'rgba(11, 10, 7, 0.15)';
  ctx.fillRect(0, 0, w, h);

  // グリッドのトレイルを描画 & 減衰
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const v = trail[gy * gridW + gx];
      if (v > 0.02) {
        const hue = params.hueBase;
        ctx.fillStyle = `hsla(${hue}, 70%, ${params.trailBrightness}%, ${v * 0.8})`;
        ctx.fillRect(gx * SCALE, gy * SCALE, SCALE, SCALE);
        trail[gy * gridW + gx] *= params.trailDecay;
      }
    }
  }

  // エージェントを更新
  for (const agent of agents) {
    updateAgent(agent);
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

// --- GUI ---

const gui = new TileUI({
  title: 'Slime Mold',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'agentCount', 200, 5000, 100).onChange(initAgents);
gui.add(params, 'sensorAngle', 5, 90, 1);
gui.add(params, 'sensorDist', 5, 50, 1);
gui.add(params, 'turnSpeed', 0.05, 1.5, 0.01);
gui.add(params, 'trailDecay', 0.9, 0.9999, 0.001);
gui.add(params, 'depositRate', 0.1, 3, 0.05);
gui.add(params, 'agentSpeed', 0.5, 5, 0.1);
gui.add(params, 'hueBase', 0, 360, 1);
gui.add(params, 'trailBrightness', 20, 90, 1);

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
  params.sensorAngle = rand(10, 75, 1);
  params.sensorDist = rand(8, 35, 1);
  params.turnSpeed = rand(0.1, 1, 0.01);
  params.trailDecay = rand(0.93, 0.999, 0.001);
  params.depositRate = rand(0.2, 2, 0.05);
  params.agentSpeed = rand(0.8, 4, 0.1);
  params.hueBase = rand(0, 360, 1);
  trail.fill(0);
  initAgents();
  gui.updateDisplay();
});

gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  trail.fill(0);
  initAgents();
  gui.updateDisplay();
});
