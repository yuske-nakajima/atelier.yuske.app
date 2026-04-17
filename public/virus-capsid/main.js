// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';

// 20 面体ウイルスカプシド。icosahedron の頂点を球面上に配置し、面を三角形パッチで描く。
const params = {
  subdivisions: 1, // 1=icosa, 2=geodesic, 3=高解像度
  radius: 240,
  rotX: 0.01,
  rotY: 0.03,
  rotZ: 0.005,
  hueStart: 120,
  hueRange: 100,
  strokeAlpha: 0.7,
  fillAlpha: 0.6,
  spikeLength: 30,
  spikeCount: 20,
  trailFade: 0.15,
  pulse: 0.12,
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

// 正 20 面体の頂点・面を生成
function makeIcosahedron() {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, t, 0],
    [1, t, 0],
    [-1, -t, 0],
    [1, -t, 0],
    [0, -1, t],
    [0, 1, t],
    [0, -1, -t],
    [0, 1, -t],
    [t, 0, -1],
    [t, 0, 1],
    [-t, 0, -1],
    [-t, 0, 1],
  ].map((v) => {
    const len = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
  });
  const faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  return { verts, faces };
}

function subdivide(mesh, depth) {
  for (let d = 0; d < depth; d++) {
    const newFaces = [];
    for (const [a, b, c] of mesh.faces) {
      const ab = mid(mesh.verts[a], mesh.verts[b]);
      const bc = mid(mesh.verts[b], mesh.verts[c]);
      const ca = mid(mesh.verts[c], mesh.verts[a]);
      const iab = mesh.verts.push(ab) - 1;
      const ibc = mesh.verts.push(bc) - 1;
      const ica = mesh.verts.push(ca) - 1;
      newFaces.push([a, iab, ica]);
      newFaces.push([b, ibc, iab]);
      newFaces.push([c, ica, ibc]);
      newFaces.push([iab, ibc, ica]);
    }
    mesh.faces = newFaces;
  }
  return mesh;
}

function mid(a, b) {
  const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const len = Math.hypot(m[0], m[1], m[2]);
  return [m[0] / len, m[1] / len, m[2] / len];
}

let mesh = makeIcosahedron();
let currentSub = 1;

function rebuild() {
  mesh = makeIcosahedron();
  subdivide(mesh, Math.max(0, Math.round(params.subdivisions) - 1));
  currentSub = Math.round(params.subdivisions);
}
rebuild();

let rx = 0;
let ry = 0;
let rz = 0;
let time = 0;

function draw() {
  time += 1 / 60;
  if (currentSub !== Math.round(params.subdivisions)) rebuild();
  ctx.fillStyle = `rgba(11, 10, 7, ${params.trailFade})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  rx += params.rotX;
  ry += params.rotY;
  rz += params.rotZ;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R = params.radius * (1 + Math.sin(time * 2) * params.pulse);

  // 回転行列を適用しつつスクリーン座標算出
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const cosZ = Math.cos(rz);
  const sinZ = Math.sin(rz);
  const projected = mesh.verts.map((v) => {
    let [x, y, z] = v;
    // X
    let ny = y * cosX - z * sinX;
    let nz = y * sinX + z * cosX;
    y = ny;
    z = nz;
    // Y
    let nx = x * cosY + z * sinY;
    nz = -x * sinY + z * cosY;
    x = nx;
    z = nz;
    // Z
    nx = x * cosZ - y * sinZ;
    ny = x * sinZ + y * cosZ;
    x = nx;
    y = ny;
    const persp = 600 / (600 + z * R);
    return { x: cx + x * R * persp, y: cy + y * R * persp, z, depth: z };
  });

  // 面を z ソート
  const faceOrder = mesh.faces.map((f, idx) => ({
    f,
    idx,
    z: (projected[f[0]].z + projected[f[1]].z + projected[f[2]].z) / 3,
  }));
  faceOrder.sort((a, b) => a.z - b.z);

  for (const { f, z } of faceOrder) {
    const [a, b, c] = f;
    const p1 = projected[a];
    const p2 = projected[b];
    const p3 = projected[c];
    const light = (1 - z) * 0.5;
    const hue = params.hueStart + light * params.hueRange;
    ctx.fillStyle = `hsla(${hue}, 80%, ${30 + light * 40}%, ${params.fillAlpha})`;
    ctx.strokeStyle = `hsla(${hue}, 90%, 80%, ${params.strokeAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // スパイク（外側の棘）
  const spikeIndices = [];
  const sc = Math.round(params.spikeCount);
  for (let i = 0; i < sc; i++) {
    spikeIndices.push(Math.floor((i * mesh.verts.length) / sc));
  }
  for (const idx of spikeIndices) {
    const p = projected[idx];
    const outer = {
      x: cx + ((p.x - cx) / R) * (R + params.spikeLength),
      y: cy + ((p.y - cy) / R) * (R + params.spikeLength),
    };
    const hue = params.hueStart + params.hueRange * 0.5;
    ctx.strokeStyle = `hsla(${hue}, 90%, 70%, 0.8)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(outer.x, outer.y);
    ctx.stroke();
    ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.9)`;
    ctx.beginPath();
    ctx.arc(outer.x, outer.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  draw();
  requestAnimationFrame(tick);
}
tick();

const gui = new TileUI({
  title: 'Virus Capsid',
  container: /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  ),
  columns: 3,
  dock: 'right',
  collapsible: true,
  overlay: true,
  toggleKey: 'g',
});

gui.add(params, 'subdivisions', 1, 4, 1);
gui.add(params, 'radius', 120, 400, 1);
gui.add(params, 'rotX', -0.05, 0.05, 0.001);
gui.add(params, 'rotY', -0.05, 0.05, 0.001);
gui.add(params, 'rotZ', -0.05, 0.05, 0.001);
gui.add(params, 'hueStart', 0, 360, 1);
gui.add(params, 'hueRange', 0, 360, 1);
gui.add(params, 'strokeAlpha', 0.1, 1, 0.01);
gui.add(params, 'fillAlpha', 0.1, 1, 0.01);
gui.add(params, 'spikeLength', 0, 60, 1);
gui.add(params, 'spikeCount', 0, 40, 1);
gui.add(params, 'trailFade', 0.05, 0.4, 0.01);
gui.add(params, 'pulse', 0, 0.3, 0.01);

function rand(min, max, step = 1) {
  const v = min + Math.random() * (max - min);
  return Math.round(v / step) * step;
}
gui.addButton('Random', () => {
  params.subdivisions = rand(1, 3, 1);
  params.hueStart = rand(0, 360, 1);
  params.hueRange = rand(30, 200, 1);
  params.rotX = rand(-0.03, 0.03, 0.001);
  params.rotY = rand(-0.03, 0.03, 0.001);
  params.rotZ = rand(-0.03, 0.03, 0.001);
  params.spikeLength = rand(15, 45, 1);
  rebuild();
  gui.updateDisplay();
});
gui.addButton('Reset', () => {
  Object.assign(params, { ...defaults });
  rebuild();
  gui.updateDisplay();
});
