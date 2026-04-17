// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 全結合多層ニューラルネットの活性伝播を可視化する。重みと活性を変化させながら描画。
const params = {
  inputs: 5,
  hidden: 8,
  hidden2: 6,
  outputs: 4,
  waveSpeed: 1.3,
  weightPulse: 0.6,
  lineAlpha: 0.5,
  nodeSize: 14,
  hueStart: 180,
  hueRange: 180,
  pulseSpeed: 2,
  trailFade: 0.1,
  thickness: 1.2,
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

/** @type {Float32Array[][]} */
let weights = [];
/** @type {number[][]} */
let activations = [];

function rebuild() {
  const layers = [
    Math.round(params.inputs),
    Math.round(params.hidden),
    Math.round(params.hidden2),
    Math.round(params.outputs),
  ];
  weights = [];
  activations = layers.map((n) => new Array(n).fill(0));
  for (let i = 0; i < layers.length - 1; i++) {
    const w = [];
    for (let j = 0; j < layers[i]; j++) {
      const row = new Float32Array(layers[i + 1]);
      for (let k = 0; k < layers[i + 1]; k++) row[k] = Math.random() * 2 - 1;
      w.push(row);
    }
    weights.push(w);
  }
}
rebuild();

let time = 0;

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function step() {
  const inputLen = activations[0].length;
  for (let i = 0; i < inputLen; i++) {
    activations[0][i] = (Math.sin(time * params.waveSpeed + i * 1.3) + 1) * 0.5;
  }
  for (let l = 1; l < activations.length; l++) {
    for (let k = 0; k < activations[l].length; k++) {
      let sum = 0;
      for (let j = 0; j < activations[l - 1].length; j++) {
        sum += activations[l - 1][j] * weights[l - 1][j][k];
      }
      activations[l][k] = sigmoid(sum);
    }
  }
}

function draw() {
  time += 1 / 60;
  step();
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const L = activations.length;
  const margin = 80;
  const usableW = canvas.width - margin * 2;
  for (let l = 0; l < L; l++) {
    const x = margin + (usableW * l) / Math.max(1, L - 1);
    const n = activations[l].length;
    const totalH = 500;
    const startY = canvas.height / 2 - totalH / 2;
    for (let i = 0; i < n; i++) {
      const y = startY + (totalH * i) / Math.max(1, n - 1);
      // 結線
      if (l < L - 1) {
        const nNext = activations[l + 1].length;
        const xNext = margin + (usableW * (l + 1)) / Math.max(1, L - 1);
        for (let k = 0; k < nNext; k++) {
          const yNext = startY + (totalH * k) / Math.max(1, nNext - 1);
          const w = weights[l][i][k];
          const pulse =
            0.5 +
            0.5 *
              Math.sin(
                time * params.pulseSpeed * 2 * Math.PI + (l + i + k) * 0.3,
              );
          const act = activations[l][i] * Math.abs(w);
          const alpha =
            params.lineAlpha *
            Math.min(1, act + 0.1) *
            (0.5 + params.weightPulse * pulse);
          const hue = params.hueStart + (w > 0 ? 40 : 280);
          ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
          ctx.lineWidth = params.thickness * (0.5 + Math.abs(w));
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(xNext, yNext);
          ctx.stroke();
        }
      }
    }
  }

  // ノード（重ねて描画）
  for (let l = 0; l < L; l++) {
    const x = margin + (usableW * l) / Math.max(1, L - 1);
    const n = activations[l].length;
    const totalH = 500;
    const startY = canvas.height / 2 - totalH / 2;
    for (let i = 0; i < n; i++) {
      const y = startY + (totalH * i) / Math.max(1, n - 1);
      const a = activations[l][i];
      const hue = params.hueStart + (l / Math.max(1, L - 1)) * params.hueRange;
      ctx.fillStyle = `hsla(${hue}, 85%, ${30 + a * 50}%, 0.95)`;
      ctx.beginPath();
      ctx.arc(x, y, params.nodeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 90%, 80%, 0.9)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Neural Network Viz',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'inputs', 2, 12, 1);
gui.add(params, 'hidden', 2, 16, 1);
gui.add(params, 'hidden2', 2, 16, 1);
gui.add(params, 'outputs', 2, 10, 1);
gui.add(params, 'waveSpeed', 0.1, 4, 0.05);
gui.add(params, 'weightPulse', 0, 1, 0.01);
gui.add(params, 'lineAlpha', 0.1, 1, 0.01);
gui.add(params, 'nodeSize', 6, 25, 0.5);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'pulseSpeed', 0.1, 5, 0.05);
gui.add(params, 'trailFade', 0.05, 0.3, 0.01);
gui.add(params, 'thickness', 0.3, 3, 0.1);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.inputs = rand(3, 8, 1);
  params.hidden = rand(5, 12, 1);
  params.hidden2 = rand(4, 10, 1);
  params.outputs = rand(3, 6, 1);
  params.hueStart = rand(0, 360, 1);
  rebuild();
  gui.updateDisplay();
});
gui.addButton('Reseed', () => rebuild());
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuild();
  gui.updateDisplay();
});
