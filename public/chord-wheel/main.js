// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 五度圏の上で和音構成音を結んで表示する。自動ルート遷移で和音が変化していく。
const params = {
  root: 0, // 0-11 (C,G,D,...の五度圏順)
  chordType: 0, // 0:major 1:minor 2:dim 3:aug 4:sus4 5:maj7 6:7 7:m7
  autoChange: true,
  speed: 0.4,
  radius: 280,
  hueStart: 0,
  hueRange: 360,
  lineAlpha: 0.8,
  fillAlpha: 0.18,
  lineWidth: 2.2,
  trailFade: 0.1,
  bloom: 0.7,
};
const defaults = { ...params };

const circleOfFifths = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'G#',
  'D#',
  'A#',
  'F',
];
const chordDefs = [
  { name: 'maj', intervals: [0, 4, 7] },
  { name: 'min', intervals: [0, 3, 7] },
  { name: 'dim', intervals: [0, 3, 6] },
  { name: 'aug', intervals: [0, 4, 8] },
  { name: 'sus4', intervals: [0, 5, 7] },
  { name: 'maj7', intervals: [0, 4, 7, 11] },
  { name: '7', intervals: [0, 4, 7, 10] },
  { name: 'm7', intervals: [0, 3, 7, 10] },
];

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

let time = 0;

function chromaticToFifthIndex(chromatic) {
  // 半音番号 0..11 を五度圏位置に変換
  return (chromatic * 7) % 12;
}

function draw() {
  time += 1 / 60;
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  if (params.autoChange) {
    const beat = Math.floor(time * params.speed);
    params.root = beat % 12;
    if (beat % 4 === 0)
      params.chordType = Math.floor(beat / 4) % chordDefs.length;
  }

  const root = Math.round(params.root);
  const cType = Math.round(params.chordType) % chordDefs.length;
  const chord = chordDefs[cType];

  // 五度圏 12 点
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
    const x = cx + Math.cos(a) * params.radius;
    const y = cy + Math.sin(a) * params.radius;
    const hue = params.hueStart + (i / 12) * params.hueRange;
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.6)`;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(230,230,230,0.9)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(circleOfFifths[i], x, y - 22);
  }

  // 和音構成音を結ぶ
  const notes = chord.intervals.map((iv) => (root + iv) % 12);
  const positions = notes.map((n) => {
    const fIdx = chromaticToFifthIndex(n);
    const a = -Math.PI / 2 + (fIdx / 12) * Math.PI * 2;
    return {
      x: cx + Math.cos(a) * params.radius,
      y: cy + Math.sin(a) * params.radius,
    };
  });

  // 塗り
  const rootHue =
    params.hueStart + (chromaticToFifthIndex(root) / 12) * params.hueRange;
  ctx.fillStyle = `hsla(${rootHue}, 80%, 55%, ${params.fillAlpha})`;
  ctx.beginPath();
  ctx.moveTo(positions[0].x, positions[0].y);
  for (let i = 1; i < positions.length; i++)
    ctx.lineTo(positions[i].x, positions[i].y);
  ctx.closePath();
  ctx.fill();

  // 線
  ctx.strokeStyle = `hsla(${rootHue}, 90%, 70%, ${params.lineAlpha})`;
  ctx.lineWidth = params.lineWidth;
  ctx.stroke();

  // 構成音マーク
  for (const p of positions) {
    ctx.fillStyle = `hsla(${rootHue}, 100%, 80%, ${params.bloom})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsla(${rootHue}, 100%, 90%, 1)`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ラベル
  ctx.fillStyle = 'rgba(230,230,230,0.9)';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rootName = circleOfFifths[chromaticToFifthIndex(root)];
  ctx.fillText(`${rootName}${chord.name}`, cx, cy);
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Chord Wheel',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'root', 0, 11, 1);
gui.add(params, 'chordType', 0, 7, 1);
gui.add(params, 'autoChange');
gui.add(params, 'speed', 0.1, 2, 0.01);
gui.add(params, 'radius', 150, 400, 1);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'lineAlpha', 0.1, 1, 0.01);
gui.add(params, 'fillAlpha', 0, 0.5, 0.01);
gui.add(params, 'lineWidth', 0.5, 5, 0.1);
gui.add(params, 'trailFade', 0.05, 0.4, 0.01);
gui.add(params, 'bloom', 0, 1, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.speed = rand(0.2, 1.2, 0.01);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(120, 360, 1);
  params.autoChange = true;
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  gui.updateDisplay();
});
