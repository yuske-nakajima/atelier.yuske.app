// @ts-check

import { CC_MODULATION, ccToFade, FADE_DEFAULT } from './config.js';
import { connectMidi } from './midi.js';
import {
  addParticle,
  createParticle,
  drawBackground,
  drawParticles,
  updateParticles,
} from './visuals.js';

/**
 * Canvas のサイズをウィンドウに合わせる
 * @param {HTMLCanvasElement} canvas
 */
function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * フォールバック画面にメッセージを表示する
 * @param {HTMLElement} fallback
 * @param {string} message
 */
function showFallback(fallback, message) {
  fallback.textContent = message;
  fallback.classList.add('visible');
}

/**
 * フォールバック画面を非表示にする
 * @param {HTMLElement} fallback
 */
function hideFallback(fallback) {
  fallback.classList.remove('visible');
}

/** アプリケーションの初期化 */
async function init() {
  const canvas = /** @type {HTMLCanvasElement | null} */ (
    document.getElementById('vj-canvas')
  );
  const fallback = document.getElementById('fallback');

  if (!canvas || !fallback) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

  /** @type {import('./visuals.js').Particle[]} */
  let particles = [];
  let fadeAmount = FADE_DEFAULT;
  let animationStarted = false;

  /** アニメーションループ */
  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    drawBackground(
      /** @type {CanvasRenderingContext2D} */ (ctx),
      fadeAmount,
      canvas.width,
      canvas.height,
    );
    particles = updateParticles(particles, dt);
    drawParticles(/** @type {CanvasRenderingContext2D} */ (ctx), particles);

    requestAnimationFrame(loop);
  }

  let lastTime = performance.now();

  /** アニメーションループを開始する（初回のみ） */
  function startAnimation() {
    if (animationStarted) return;
    animationStarted = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  const midiSupported = await connectMidi({
    onNoteOn(note, velocity) {
      const p = createParticle(note, velocity, canvas.width, canvas.height);
      particles = addParticle(particles, p);
    },
    onNoteOff() {
      // ノートオフ時は特に処理しない
    },
    onCC(cc, value) {
      if (cc === CC_MODULATION) {
        fadeAmount = ccToFade(value);
      }
    },
    onConnectionChange(hasDevice) {
      if (hasDevice) {
        hideFallback(fallback);
        startAnimation();
        return;
      }
      showFallback(fallback, 'MIDI デバイスを接続してください');
    },
  });

  if (!midiSupported) {
    showFallback(fallback, 'このブラウザは Web MIDI API に対応していません');
  }
}

document.addEventListener('DOMContentLoaded', init);
