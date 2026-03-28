// @ts-check

/**
 * UI コントロールモジュール
 * タイムスライダーと日時表示を管理する
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
 * @property {number} sliderOffset - スライダーのオフセット（日数）
 * @property {(callback: (offset: number) => void) => void} onSliderChange - スライダー変更コールバック登録
 * @property {(date: Date) => void} updateTimeDisplay - 日時表示を更新する
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

  // 情報パネル要素
  const infoCoordsEl = document.getElementById('info-coords');
  const infoDatetimeEl = document.getElementById('info-datetime');
  const infoOrbitalEl = document.getElementById('info-orbital');
  const infoDistanceEl = document.getElementById('info-distance');

  /** @type {((offset: number) => void)[]} */
  const sliderCallbacks = [];

  /** @type {UIControls} */
  const controls = {
    sliderOffset: 0,
    onSliderChange(callback) {
      sliderCallbacks.push(callback);
    },
    updateTimeDisplay(date) {
      if (timeDisplay) {
        timeDisplay.textContent = formatDate(date);
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
