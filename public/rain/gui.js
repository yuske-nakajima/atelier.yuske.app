// @ts-check

import TileUI from 'https://cdn.jsdelivr.net/npm/@yuske-nakajima/tileui/dist/tileui.js';
import * as THREE from 'https://esm.sh/three@0.172.0';

/**
 * @typedef {import('./ripple.js').Ripple} Ripple
 */

/**
 * @typedef {{
 *   rainCount: number,
 *   rainSpeed: number,
 *   wind: number,
 *   fogDensity: number,
 *   bgColor: string,
 *   autoRotate: boolean,
 *   rippleColor: string,
 *   rippleSpeed: number,
 *   rippleCount: number,
 *   waveHeight: number,
 * }} RainParams
 */

/**
 * @typedef {{
 *   params: RainParams,
 *   defaults: RainParams,
 *   isMobile: boolean,
 *   scene: THREE.Scene,
 *   pointLight: THREE.PointLight,
 *   ripplePool: Ripple[],
 *   createRainParticles: (count: number) => { lines: THREE.LineSegments, positions: Float32Array },
 *   getRain: () => { rainLines: THREE.LineSegments, rainPositions: Float32Array },
 *   setRain: (lines: THREE.LineSegments, positions: Float32Array) => void,
 *   resetTime: () => void,
 * }} GuiContext
 */

/**
 * GUI をセットアップする
 * @param {GuiContext} ctx
 */
export function setupGui(ctx) {
  const {
    params,
    defaults,
    isMobile,
    scene,
    pointLight,
    ripplePool,
    createRainParticles,
    getRain,
    setRain,
    resetTime,
  } = ctx;

  const guiContainer = /** @type {HTMLElement} */ (
    document.getElementById('gui-container')
  );
  const gui = new TileUI({
    title: 'Neon Rain',
    container: guiContainer,
  });

  // 雨粒の数（モバイルは上限500）
  gui.add(params, 'rainCount', 100, isMobile ? 500 : 3000, 50).onChange(() => {
    const { rainLines } = getRain();
    scene.remove(rainLines);
    const result = createRainParticles(params.rainCount);
    setRain(result.lines, result.positions);
    scene.add(result.lines);
  });

  gui.add(params, 'rainSpeed', 0.5, 5, 0.1);
  gui.add(params, 'wind', -3, 3, 0.1);
  gui.add(params, 'rippleSpeed', 0.5, 3, 0.1);
  gui.add(params, 'waveHeight', 0, 0.5, 0.01);
  gui.add(params, 'fogDensity', 0, 0.1, 0.005).onChange(() => {
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = params.fogDensity;
    }
  });

  gui.addBoolean(params, 'autoRotate');

  gui.addColor(params, 'rippleColor').onChange(() => {
    syncRippleColor(ripplePool, pointLight, params.rippleColor);
  });

  gui.addColor(params, 'bgColor').onChange(() => {
    syncBgColor(scene, params.bgColor);
  });

  gui.addButton('Random', () => {
    randomizeParams(params);
    syncScene(scene, ripplePool, pointLight, params);
    gui.updateDisplay();
  });

  gui.addButton('Reset', () => {
    Object.assign(params, { ...defaults });
    syncScene(scene, ripplePool, pointLight, params);

    // 雨粒を再生成
    const { rainLines } = getRain();
    scene.remove(rainLines);
    const result = createRainParticles(params.rainCount);
    setRain(result.lines, result.positions);
    scene.add(result.lines);

    resetTime();
    gui.updateDisplay();
  });
}

/**
 * パラメータをランダム化する
 * @param {RainParams} params
 */
function randomizeParams(params) {
  params.rainSpeed = Math.round((0.5 + Math.random() * 4.5) * 10) / 10;
  params.wind = Math.round((-3 + Math.random() * 6) * 10) / 10;
  params.rippleSpeed = Math.round((0.5 + Math.random() * 2.5) * 10) / 10;
  params.waveHeight = Math.round(Math.random() * 0.5 * 100) / 100;
  params.fogDensity = Math.round(Math.random() * 0.1 * 1000) / 1000;

  // ランダムなネオンカラーを生成（HSL: H=ランダム, S=80-100%, L=50-60%）
  const h = Math.floor(Math.random() * 360);
  const s = 80 + Math.floor(Math.random() * 20);
  const l = 50 + Math.floor(Math.random() * 10);
  const c = new THREE.Color();
  c.setHSL(h / 360, s / 100, l / 100);
  params.rippleColor = `#${c.getHexString()}`;

  // 背景色はランダムな暗い色
  const bgC = new THREE.Color();
  bgC.setHSL(Math.random(), 0.3, 0.06);
  params.bgColor = `#${bgC.getHexString()}`;
}

/**
 * 波紋の色を同期する
 * @param {Ripple[]} ripplePool
 * @param {THREE.PointLight} pointLight
 * @param {string} color
 */
function syncRippleColor(ripplePool, pointLight, color) {
  for (const ripple of ripplePool) {
    const mat = /** @type {THREE.MeshBasicMaterial} */ (ripple.mesh.material);
    mat.color.set(color);
  }
  pointLight.color.set(color);
}

/**
 * 背景色を同期する
 * @param {THREE.Scene} scene
 * @param {string} color
 */
function syncBgColor(scene, color) {
  scene.background = new THREE.Color(color);
  if (scene.fog instanceof THREE.FogExp2) {
    scene.fog.color.set(color);
  }
}

/**
 * シーン全体を params に同期する
 * @param {THREE.Scene} scene
 * @param {Ripple[]} ripplePool
 * @param {THREE.PointLight} pointLight
 * @param {RainParams} params
 */
function syncScene(scene, ripplePool, pointLight, params) {
  scene.background = new THREE.Color(params.bgColor);
  if (scene.fog instanceof THREE.FogExp2) {
    scene.fog.color.set(params.bgColor);
    scene.fog.density = params.fogDensity;
  }
  syncRippleColor(ripplePool, pointLight, params.rippleColor);
}
