// @ts-check

/**
 * UI コントロールモジュール
 * タイムスライダー、再生/一時停止、速度コントロール、日時表示を管理する
 */

/**
 * @typedef {object} InfoPanelData
 * @property {number} latitude - 緯度（度）
 * @property {number} longitude - 経度（度）
 * @property {Date} simDate - シミュレーション日時
 * @property {number} orbitalAngleDeg - 公転角度（度）
 * @property {number} rotationAngleDeg - 自転角度（度）
 * @property {number} sunDistance - 太陽からの距離（スケール値）
 */

/**
 * @typedef {object} UIControls
 * @property {boolean} playing - 再生中かどうか
 * @property {number} speed - 再生速度倍率
 * @property {number} sliderOffset - スライダーのオフセット（日数）
 * @property {(callback: (offset: number) => void) => void} onSliderChange - スライダー変更コールバック登録
 * @property {(callback: (playing: boolean) => void) => void} onPlayPauseChange - 再生状態変更コールバック登録
 * @property {(callback: (speed: number) => void) => void} onSpeedChange - 速度変更コールバック登録
 * @property {(date: Date) => void} updateTimeDisplay - 日時表示を更新する
 * @property {(offset: number) => void} setSliderValue - スライダーの値を外部から設定する
 * @property {(data: InfoPanelData) => void} updateInfoPanel - 情報パネルを更新する
 */

/**
 * 日時を YYYY-MM-DD HH:mm 形式にフォーマットする
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

/**
 * UI コントロールを作成して初期化する
 * @returns {UIControls}
 */
export function createUI() {
  const timeDisplay = /** @type {HTMLElement | null} */ (
    document.getElementById('time-display')
  );
  const slider = /** @type {HTMLInputElement | null} */ (
    document.getElementById('time-slider')
  );
  const playPauseBtn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById('play-pause-btn')
  );
  const speedButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (
    document.querySelectorAll('.speed-btn')
  );

  // 情報パネル要素
  const infoCoordsEl = document.getElementById('info-coords');
  const infoDatetimeEl = document.getElementById('info-datetime');
  const infoOrbitalEl = document.getElementById('info-orbital');
  const infoDistanceEl = document.getElementById('info-distance');

  /** @type {((offset: number) => void)[]} */
  const sliderCallbacks = [];
  /** @type {((playing: boolean) => void)[]} */
  const playPauseCallbacks = [];
  /** @type {((speed: number) => void)[]} */
  const speedCallbacks = [];

  /** @type {UIControls} */
  const controls = {
    playing: true,
    speed: 1,
    sliderOffset: 0,
    onSliderChange(callback) {
      sliderCallbacks.push(callback);
    },
    onPlayPauseChange(callback) {
      playPauseCallbacks.push(callback);
    },
    onSpeedChange(callback) {
      speedCallbacks.push(callback);
    },
    updateTimeDisplay(date) {
      if (timeDisplay) {
        timeDisplay.textContent = formatDate(date);
      }
    },
    setSliderValue(offset) {
      if (slider) {
        slider.value = String(Math.round(offset));
      }
    },
    updateInfoPanel(data) {
      if (infoCoordsEl) {
        infoCoordsEl.textContent = `緯度: ${data.latitude.toFixed(2)} / 経度: ${data.longitude.toFixed(2)}`;
      }
      if (infoDatetimeEl) {
        infoDatetimeEl.textContent = `日時: ${formatDate(data.simDate)}`;
      }
      if (infoOrbitalEl) {
        infoOrbitalEl.textContent = `公転角: ${data.orbitalAngleDeg.toFixed(1)}\u00B0 / 自転角: ${data.rotationAngleDeg.toFixed(1)}\u00B0`;
      }
      if (infoDistanceEl) {
        infoDistanceEl.textContent = `太陽距離: ${data.sunDistance.toFixed(2)}`;
      }
    },
  };

  // スライダーのイベント
  if (slider) {
    slider.addEventListener('input', () => {
      const offset = Number(slider.value);
      controls.sliderOffset = offset;
      for (const cb of sliderCallbacks) {
        cb(offset);
      }
    });

    // スライダー操作中に OrbitControls が反応しないようにする
    slider.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
  }

  // 再生/一時停止ボタン
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      controls.playing = !controls.playing;
      playPauseBtn.textContent = controls.playing ? '\u23F8' : '\u25B6';
      for (const cb of playPauseCallbacks) {
        cb(controls.playing);
      }
    });
  }

  // 速度ボタン
  /** @param {number} speed */
  function setActiveSpeed(speed) {
    for (const btn of speedButtons) {
      const btnSpeed = Number(btn.dataset.speed);
      if (btnSpeed === speed) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  }

  // 初期状態で x1 をアクティブにする
  setActiveSpeed(1);

  for (const btn of speedButtons) {
    btn.addEventListener('click', () => {
      const speed = Number(btn.dataset.speed);
      controls.speed = speed;
      setActiveSpeed(speed);
      for (const cb of speedCallbacks) {
        cb(speed);
      }
    });
  }

  // コントロール内の全操作で OrbitControls を防止
  const controlsEl = document.getElementById('controls');
  if (controlsEl) {
    controlsEl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    controlsEl.addEventListener('pointermove', (e) => {
      e.stopPropagation();
    });
    controlsEl.addEventListener('wheel', (e) => {
      e.stopPropagation();
    });
  }

  return controls;
}
