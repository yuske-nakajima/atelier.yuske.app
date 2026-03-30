// @ts-check

/**
 * SimpleGuiGrid - グリッドタイル型 + ノブデザインの GUI ライブラリ
 * 画面下端に固定されるバー型パネルで、正方形タイルを CSS Grid で配置する
 */

// CSS 注入（一度だけ）
const STYLE_ID = 'simple-gui-grid-style';

/**
 * スタイルを注入する
 */
function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --sgg-bg: #1a1a2e;
      --sgg-tile-bg: #252542;
      --sgg-border: #333355;
      --sgg-text: #e0e0e0;
      --sgg-text-dim: #999;
      --sgg-accent: #ff6b6b;
      --sgg-accent-hover: #ff8787;
      --sgg-input-bg: #0f0f1a;
      --sgg-knob-bg: #2a2a4a;
      --sgg-knob-track: #333355;
      --sgg-radius: 0.5rem;
      --sgg-font-size: 0.7rem;
      --sgg-tile-size: 5rem;
      --sgg-gap: 0.25rem;
      --sgg-padding: 0.5rem;
    }

    .sgg-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: var(--sgg-font-size);
      color: var(--sgg-text);
      background: var(--sgg-bg);
      border-top: 0.0625rem solid var(--sgg-border);
      z-index: 10000;
      user-select: none;
      box-shadow: 0 -0.25rem 1rem rgba(0, 0, 0, 0.4);
    }

    .sgg-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sgg-padding);
      background: var(--sgg-bg);
      border-bottom: 0.0625rem solid var(--sgg-border);
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
    }

    .sgg-title-toggle {
      transition: transform 0.2s;
    }

    .sgg-title-toggle.sgg-collapsed {
      transform: rotate(180deg);
    }

    .sgg-children {
      overflow: hidden;
    }

    .sgg-children.sgg-hidden {
      display: none;
    }

    .sgg-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--sgg-tile-size), 1fr));
      gap: var(--sgg-gap);
      padding: var(--sgg-gap);
    }

    .sgg-tile {
      aspect-ratio: 1;
      background: var(--sgg-tile-bg);
      border: 0.0625rem solid var(--sgg-border);
      border-radius: var(--sgg-radius);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
      overflow: hidden;
      position: relative;
    }

    .sgg-tile-label {
      font-size: 0.6rem;
      color: var(--sgg-text-dim);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      position: absolute;
      top: 0.2rem;
      left: 0;
      padding: 0 0.15rem;
      box-sizing: border-box;
    }

    /* ノブ（SVG 回転式） */
    .sgg-knob-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      cursor: grab;
      touch-action: none;
      margin-top: 0.6rem;
    }

    .sgg-knob-wrap:active {
      cursor: grabbing;
    }

    .sgg-knob-svg {
      width: 80%;
      height: 80%;
    }

    .sgg-knob-value {
      font-size: 0.55rem;
      fill: var(--sgg-text);
      text-anchor: middle;
      dominant-baseline: central;
      pointer-events: none;
    }

    .sgg-knob-track {
      fill: none;
      stroke: var(--sgg-knob-track);
      stroke-linecap: round;
    }

    .sgg-knob-arc {
      fill: none;
      stroke: var(--sgg-accent);
      stroke-linecap: round;
      transition: stroke-dashoffset 0.05s;
    }

    .sgg-knob-dot {
      fill: var(--sgg-text);
    }

    /* 数値入力タイル */
    .sgg-number-input {
      width: 80%;
      background: var(--sgg-input-bg);
      border: 0.0625rem solid var(--sgg-border);
      border-radius: var(--sgg-radius);
      color: var(--sgg-text);
      font-size: var(--sgg-font-size);
      padding: 0.2rem;
      text-align: center;
      margin-top: 0.5rem;
    }

    .sgg-number-input:focus {
      outline: 0.0625rem solid var(--sgg-accent);
    }

    /* トグルスイッチ */
    .sgg-toggle-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .sgg-toggle-track {
      width: 2.2rem;
      height: 1.1rem;
      background: var(--sgg-knob-track);
      border-radius: 0.55rem;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }

    .sgg-toggle-track.sgg-active {
      background: var(--sgg-accent);
    }

    .sgg-toggle-thumb {
      position: absolute;
      top: 0.1rem;
      left: 0.1rem;
      width: 0.9rem;
      height: 0.9rem;
      background: var(--sgg-text);
      border-radius: 50%;
      transition: left 0.2s;
    }

    .sgg-toggle-track.sgg-active .sgg-toggle-thumb {
      left: 1.2rem;
    }

    /* カラーサークル */
    .sgg-color-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .sgg-color-circle {
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 50%;
      border: 0.125rem solid var(--sgg-border);
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .sgg-color-circle:hover {
      border-color: var(--sgg-accent);
    }

    .sgg-color-hidden {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
    }

    /* ボタンタイル */
    .sgg-tile-button {
      cursor: pointer;
      transition: background 0.15s;
    }

    .sgg-tile-button:hover {
      background: var(--sgg-accent);
    }

    .sgg-tile-button:active {
      background: var(--sgg-accent-hover);
    }

    .sgg-button-label {
      font-size: var(--sgg-font-size);
      font-weight: 600;
      color: var(--sgg-text);
      text-align: center;
    }

    /* フォルダタイル */
    .sgg-folder-tile {
      cursor: pointer;
      transition: background 0.15s;
    }

    .sgg-folder-tile:hover {
      background: var(--sgg-knob-bg);
    }

    .sgg-folder-icon {
      font-size: 1.2rem;
      margin-bottom: 0.15rem;
    }

    .sgg-folder-label {
      font-size: var(--sgg-font-size);
      font-weight: 600;
      color: var(--sgg-accent);
      text-align: center;
    }

    .sgg-folder-children {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(var(--sgg-tile-size), 1fr));
      gap: var(--sgg-gap);
      padding: var(--sgg-gap);
      background: rgba(0, 0, 0, 0.15);
      border-radius: var(--sgg-radius);
    }

    .sgg-folder-children.sgg-hidden {
      display: none;
    }
  `;
  document.head.appendChild(style);
}

// --- SVG ノブのユーティリティ ---

/** ノブの可動範囲（度）。下部中央 90 度が空き */
const KNOB_RANGE_DEG = 270;
/** 開始角度（度）。12 時を 0 として時計回りに 135 度 = 左下 */
const KNOB_START_DEG = 135;

/**
 * 角度（度）からアーク上の座標を返す
 * @param {number} cx - 中心 X
 * @param {number} cy - 中心 Y
 * @param {number} r - 半径
 * @param {number} deg - 角度（度、12 時が 0、時計回り）
 * @returns {{ x: number, y: number }}
 */
function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/**
 * SVG アーク（弧）パスを生成する
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} startDeg
 * @param {number} endDeg
 * @returns {string}
 */
function describeArc(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const sweep = endDeg - startDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// --- コントローラー基底クラス ---

class Controller {
  /** @type {Record<string, unknown>} */
  _obj;
  /** @type {string} */
  _prop;
  /** @type {((value: unknown) => void) | null} */
  _onChangeCallback;
  /** @type {HTMLElement} */
  domElement;

  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    this._obj = obj;
    this._prop = prop;
    this._onChangeCallback = null;
    this.domElement = document.createElement('div');
    this.domElement.classList.add('sgg-tile');
  }

  /**
   * onChange コールバックを設定する
   * @param {(value: unknown) => void} callback
   * @returns {this}
   */
  onChange(callback) {
    this._onChangeCallback = callback;
    return this;
  }

  /**
   * 値を更新してコールバックを発火する
   * @param {unknown} value
   */
  _setValue(value) {
    this._obj[this._prop] = value;
    if (this._onChangeCallback) {
      this._onChangeCallback(value);
    }
  }

  /** DOM 表示を現在の値に同期する（サブクラスでオーバーライド） */
  updateDisplay() {}

  /**
   * ラベル要素を作成して返す
   * @param {string} text
   * @returns {HTMLElement}
   */
  _createLabel(text) {
    const label = document.createElement('div');
    label.classList.add('sgg-tile-label');
    label.textContent = text;
    label.title = text;
    return label;
  }
}

// --- KnobController（SVG 回転式ノブ） ---

class KnobController extends Controller {
  /** @type {number} */
  _min;
  /** @type {number} */
  _max;
  /** @type {number} */
  _step;
  /** @type {SVGPathElement} */
  _arcEl;
  /** @type {SVGCircleElement} */
  _dotEl;
  /** @type {SVGTextElement} */
  _valueText;

  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   * @param {number} min
   * @param {number} max
   * @param {number} step
   */
  constructor(obj, prop, min, max, step) {
    super(obj, prop);
    this._min = min;
    this._max = max;
    this._step = step;

    this.domElement.appendChild(this._createLabel(prop));

    const wrap = document.createElement('div');
    wrap.classList.add('sgg-knob-wrap');

    // SVG 構築
    const size = 100;
    const cx = 50;
    const cy = 50;
    const r = 38;
    const strokeWidth = 6;

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.classList.add('sgg-knob-svg');

    // トラック（背景弧）
    const trackPath = document.createElementNS(ns, 'path');
    trackPath.setAttribute(
      'd',
      describeArc(cx, cy, r, KNOB_START_DEG, KNOB_START_DEG + KNOB_RANGE_DEG),
    );
    trackPath.setAttribute('stroke-width', String(strokeWidth));
    trackPath.classList.add('sgg-knob-track');
    svg.appendChild(trackPath);

    // アクティブ弧（現在値）
    const arcPath = document.createElementNS(ns, 'path');
    arcPath.setAttribute('stroke-width', String(strokeWidth));
    arcPath.classList.add('sgg-knob-arc');
    svg.appendChild(arcPath);
    this._arcEl = arcPath;

    // つまみドット
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', '4');
    dot.classList.add('sgg-knob-dot');
    svg.appendChild(dot);
    this._dotEl = dot;

    // 中央値テキスト
    const valueText = document.createElementNS(ns, 'text');
    valueText.setAttribute('x', String(cx));
    valueText.setAttribute('y', String(cy));
    valueText.classList.add('sgg-knob-value');
    svg.appendChild(valueText);
    this._valueText = valueText;

    wrap.appendChild(svg);
    this.domElement.appendChild(wrap);

    // 初期描画
    this._updateKnob();

    // ドラッグ操作（上下方向で値変更）
    this._setupDrag(wrap);
  }

  /**
   * ドラッグ操作をセットアップする
   * @param {HTMLElement} el
   */
  _setupDrag(el) {
    let dragging = false;
    let startY = 0;
    let startValue = 0;

    const range = this._max - this._min;

    /** @param {PointerEvent} e */
    const onPointerDown = (e) => {
      dragging = true;
      startY = e.clientY;
      startValue = /** @type {number} */ (this._obj[this._prop]);
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    /** @param {PointerEvent} e */
    const onPointerMove = (e) => {
      if (!dragging) return;
      // 上にドラッグ = 値増加
      const dy = startY - e.clientY;
      const sensitivity = range / 150;
      let newVal = startValue + dy * sensitivity;
      // ステップにスナップ
      newVal = Math.round(newVal / this._step) * this._step;
      newVal = Math.max(this._min, Math.min(this._max, newVal));
      this._setValue(newVal);
      this._updateKnob();
    };

    const onPointerUp = () => {
      dragging = false;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
  }

  /** ノブの SVG 表示を更新する */
  _updateKnob() {
    const val = /** @type {number} */ (this._obj[this._prop]);
    const ratio = (val - this._min) / (this._max - this._min);
    const angleDeg = KNOB_START_DEG + ratio * KNOB_RANGE_DEG;

    const cx = 50;
    const cy = 50;
    const r = 38;

    // アクティブ弧の更新
    if (ratio > 0.001) {
      this._arcEl.setAttribute(
        'd',
        describeArc(cx, cy, r, KNOB_START_DEG, angleDeg),
      );
      this._arcEl.style.display = '';
    } else {
      this._arcEl.style.display = 'none';
    }

    // つまみドットの位置
    const dotPos = polarToCartesian(cx, cy, r, angleDeg);
    this._dotEl.setAttribute('cx', String(dotPos.x));
    this._dotEl.setAttribute('cy', String(dotPos.y));

    // 値テキスト
    const displayVal =
      this._step < 1
        ? val.toFixed(String(this._step).split('.')[1]?.length ?? 2)
        : String(Math.round(val));
    this._valueText.textContent = displayVal;
  }

  /** DOM 表示を現在の値に同期する */
  updateDisplay() {
    this._updateKnob();
  }
}

// --- NumberInputController（range なし） ---

class NumberInputController extends Controller {
  /** @type {HTMLInputElement} */
  _input;

  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    this.domElement.appendChild(this._createLabel(prop));

    const input = document.createElement('input');
    input.type = 'number';
    input.classList.add('sgg-number-input');
    input.value = String(obj[prop]);
    this._input = input;

    input.addEventListener('input', () => {
      this._setValue(Number(input.value));
    });

    this.domElement.appendChild(input);
  }

  /** DOM 表示を現在の値に同期する */
  updateDisplay() {
    this._input.value = String(this._obj[this._prop]);
  }
}

// --- BooleanController（トグルスイッチ） ---

class BooleanController extends Controller {
  /** @type {HTMLElement} */
  _trackEl;

  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    this.domElement.appendChild(this._createLabel(prop));

    const wrap = document.createElement('div');
    wrap.classList.add('sgg-toggle-wrap');

    const track = document.createElement('div');
    track.classList.add('sgg-toggle-track');
    if (obj[prop]) {
      track.classList.add('sgg-active');
    }
    this._trackEl = track;

    const thumb = document.createElement('div');
    thumb.classList.add('sgg-toggle-thumb');
    track.appendChild(thumb);

    track.addEventListener('click', () => {
      const newVal = !this._obj[this._prop];
      this._setValue(newVal);
      this._trackEl.classList.toggle(
        'sgg-active',
        /** @type {boolean} */ (newVal),
      );
    });

    wrap.appendChild(track);
    this.domElement.appendChild(wrap);
  }

  /** DOM 表示を現在の値に同期する */
  updateDisplay() {
    this._trackEl.classList.toggle(
      'sgg-active',
      /** @type {boolean} */ (this._obj[this._prop]),
    );
  }
}

// --- ColorController（カラーサークル） ---

class ColorController extends Controller {
  /** @type {HTMLInputElement} */
  _colorInput;
  /** @type {HTMLElement} */
  _circle;

  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    this.domElement.appendChild(this._createLabel(prop));

    const wrap = document.createElement('div');
    wrap.classList.add('sgg-color-wrap');

    const circle = document.createElement('div');
    circle.classList.add('sgg-color-circle');
    circle.style.backgroundColor = /** @type {string} */ (obj[prop]);
    this._circle = circle;

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'color';
    hiddenInput.classList.add('sgg-color-hidden');
    hiddenInput.value = /** @type {string} */ (obj[prop]);
    this._colorInput = hiddenInput;

    circle.addEventListener('click', () => {
      hiddenInput.click();
    });

    hiddenInput.addEventListener('input', () => {
      this._setValue(hiddenInput.value);
      circle.style.backgroundColor = hiddenInput.value;
    });

    wrap.appendChild(circle);
    wrap.appendChild(hiddenInput);
    this.domElement.appendChild(wrap);
  }

  /** DOM 表示を現在の値に同期する */
  updateDisplay() {
    const val = /** @type {string} */ (this._obj[this._prop]);
    this._colorInput.value = val;
    this._circle.style.backgroundColor = val;
  }
}

// --- ButtonController（ボタンタイル） ---

class ButtonController {
  /** @type {HTMLElement} */
  domElement;

  /**
   * @param {string} label
   * @param {() => void} callback
   */
  constructor(label, callback) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('sgg-tile', 'sgg-tile-button');

    const btnLabel = document.createElement('div');
    btnLabel.classList.add('sgg-button-label');
    btnLabel.textContent = label;

    this.domElement.appendChild(btnLabel);
    this.domElement.addEventListener('click', callback);
  }
}

// --- SimpleGuiGrid ---

class SimpleGuiGrid {
  /** @type {HTMLElement} */
  domElement;
  /** @type {HTMLElement} */
  _gridEl;
  /** @type {boolean} */
  _isRoot;
  /** @type {Controller[]} */
  _controllers;
  /** @type {SimpleGuiGrid[]} */
  _folders;

  /**
   * @param {{ title?: string, _parentGrid?: HTMLElement }} [options]
   */
  constructor(options = {}) {
    const { title = 'Controls', _parentGrid } = options;

    injectStyles();

    this._isRoot = !_parentGrid;
    this._controllers = [];
    this._folders = [];

    if (this._isRoot) {
      // ルートパネル（画面下端固定）
      this.domElement = document.createElement('div');
      this.domElement.classList.add('sgg-panel');

      const titleBar = document.createElement('div');
      titleBar.classList.add('sgg-title');

      const titleText = document.createElement('span');
      titleText.textContent = title;

      const toggle = document.createElement('span');
      toggle.classList.add('sgg-title-toggle');
      toggle.textContent = '\u25B2';

      titleBar.appendChild(titleText);
      titleBar.appendChild(toggle);

      const childrenWrap = document.createElement('div');
      childrenWrap.classList.add('sgg-children');

      this._gridEl = document.createElement('div');
      this._gridEl.classList.add('sgg-grid');

      childrenWrap.appendChild(this._gridEl);

      titleBar.addEventListener('click', () => {
        const isHidden = childrenWrap.classList.toggle('sgg-hidden');
        toggle.classList.toggle('sgg-collapsed', isHidden);
      });

      this.domElement.appendChild(titleBar);
      this.domElement.appendChild(childrenWrap);
      document.body.appendChild(this.domElement);
    } else {
      // フォルダ（子グリッド）
      this._gridEl = document.createElement('div');
      this._gridEl.classList.add('sgg-folder-children');
      this.domElement = this._gridEl;
      _parentGrid.appendChild(this._gridEl);
    }
  }

  /**
   * 値の型に応じたコントローラーを追加する
   * - boolean: トグルスイッチ
   * - number (min/max あり): SVG ノブ
   * - number (min/max なし): 数値入力
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   * @param {number} [min]
   * @param {number} [max]
   * @param {number} [step]
   * @returns {Controller}
   */
  add(obj, prop, min, max, step) {
    const value = obj[prop];

    if (typeof value === 'boolean') {
      const ctrl = new BooleanController(obj, prop);
      this._gridEl.appendChild(ctrl.domElement);
      this._controllers.push(ctrl);
      return ctrl;
    }

    const hasRange = min !== undefined && max !== undefined;

    if (hasRange) {
      const ctrl = new KnobController(obj, prop, min, max, step ?? 1);
      this._gridEl.appendChild(ctrl.domElement);
      this._controllers.push(ctrl);
      return ctrl;
    }

    const ctrl = new NumberInputController(obj, prop);
    this._gridEl.appendChild(ctrl.domElement);
    this._controllers.push(ctrl);
    return ctrl;
  }

  /**
   * カラーピッカーを追加する
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   * @returns {Controller}
   */
  addColor(obj, prop) {
    const ctrl = new ColorController(obj, prop);
    this._gridEl.appendChild(ctrl.domElement);
    this._controllers.push(ctrl);
    return ctrl;
  }

  /**
   * ボタンを追加する
   * @param {string} label
   * @param {() => void} callback
   * @returns {ButtonController}
   */
  addButton(label, callback) {
    const ctrl = new ButtonController(label, callback);
    this._gridEl.appendChild(ctrl.domElement);
    return ctrl;
  }

  /**
   * 折りたたみフォルダを追加する
   * @param {string} title
   * @returns {SimpleGuiGrid}
   */
  addFolder(title) {
    // フォルダタイル（クリックで子タイルの表示/非表示）
    const folderTile = document.createElement('div');
    folderTile.classList.add('sgg-tile', 'sgg-folder-tile');

    const icon = document.createElement('div');
    icon.classList.add('sgg-folder-icon');
    icon.textContent = '\u25BC';

    const label = document.createElement('div');
    label.classList.add('sgg-folder-label');
    label.textContent = title;

    folderTile.appendChild(icon);
    folderTile.appendChild(label);
    this._gridEl.appendChild(folderTile);

    // 子フォルダ
    const folder = new SimpleGuiGrid({ title, _parentGrid: this._gridEl });
    this._folders.push(folder);

    // クリックで表示/非表示切り替え
    folderTile.addEventListener('click', () => {
      const isHidden = folder._gridEl.classList.toggle('sgg-hidden');
      icon.textContent = isHidden ? '\u25B6' : '\u25BC';
    });

    return folder;
  }

  /** 全コントローラーとフォルダの DOM 表示を現在の値に同期する */
  updateDisplay() {
    for (const ctrl of this._controllers) {
      ctrl.updateDisplay();
    }
    for (const folder of this._folders) {
      folder.updateDisplay();
    }
  }
}

export default SimpleGuiGrid;
