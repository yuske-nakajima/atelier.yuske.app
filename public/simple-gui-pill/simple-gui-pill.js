// @ts-check

/**
 * SimpleGuiPill - ピル型（カプセル）GUI ライブラリ
 * iOS Dynamic Island 風のコンパクトなカプセル UI
 * 収納時は小さなピル形状、タップで滑らかにモーフィング展開
 * 四隅にドラッグでスナップ・収納対応
 *
 * 単一ファイル構成: CSS も JS から注入する
 */

// ========================================
// スタイル注入
// ========================================

const STYLE_ID = 'simple-gui-pill-style';

/** スタイルを注入する（一度だけ） */
function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --sgp-bg: #1c1c1e;
      --sgp-bg-hover: #2c2c2e;
      --sgp-border: #38383a;
      --sgp-text: #ffffff;
      --sgp-text-dim: #98989d;
      --sgp-accent: #30D158;
      --sgp-accent-hover: #34d65c;
      --sgp-input-bg: #0a0a0a;
      --sgp-folder-bg: #141416;
      --sgp-radius-pill: 100vmax;
      --sgp-radius-panel: 1rem;
      --sgp-font-size: 0.75rem;
      --sgp-row-height: 1.75rem;
      --sgp-padding: 0.5rem;
      --sgp-width: 16rem;
      --sgp-pill-height: 2rem;
      --sgp-transition: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      --sgp-margin: 0.75rem;
    }

    .sgp-container {
      position: fixed;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: var(--sgp-font-size);
      color: var(--sgp-text);
      user-select: none;
      touch-action: none;
    }

    .sgp-container.sgp-top-right {
      top: var(--sgp-margin);
      right: var(--sgp-margin);
    }
    .sgp-container.sgp-top-left {
      top: var(--sgp-margin);
      left: var(--sgp-margin);
    }
    .sgp-container.sgp-bottom-right {
      bottom: var(--sgp-margin);
      right: var(--sgp-margin);
    }
    .sgp-container.sgp-bottom-left {
      bottom: var(--sgp-margin);
      left: var(--sgp-margin);
    }

    .sgp-pill {
      background: var(--sgp-bg);
      box-shadow: 0 0.25rem 1.5rem rgba(0, 0, 0, 0.5),
                  0 0 0 0.0625rem rgba(255, 255, 255, 0.06);
      overflow: hidden;
      transition:
        width var(--sgp-transition),
        height var(--sgp-transition),
        border-radius var(--sgp-transition),
        max-height var(--sgp-transition);
    }

    .sgp-pill.sgp-collapsed {
      width: auto;
      min-width: 6rem;
      max-width: 10rem;
      height: var(--sgp-pill-height);
      border-radius: var(--sgp-radius-pill);
      cursor: pointer;
    }

    .sgp-pill.sgp-expanded {
      width: var(--sgp-width);
      border-radius: var(--sgp-radius-panel);
      max-height: 70vh;
      overflow: hidden;
    }

    .sgp-container.sgp-dragging .sgp-pill {
      transition: none;
      opacity: 0.85;
    }

    .sgp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      height: var(--sgp-pill-height);
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
    }

    .sgp-header-title {
      font-weight: 600;
      font-size: 0.8125rem;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sgp-header-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--sgp-accent);
      flex-shrink: 0;
      margin-left: 0.5rem;
      transition: transform 0.3s ease;
    }

    .sgp-pill.sgp-expanded .sgp-header-dot {
      transform: scale(0);
    }

    .sgp-header-close {
      display: none;
      width: 1.25rem;
      height: 1.25rem;
      border: none;
      background: var(--sgp-border);
      color: var(--sgp-text-dim);
      border-radius: 50%;
      font-size: 0.625rem;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: 0.5rem;
      transition: background 0.15s;
      padding: 0;
      line-height: 1;
    }

    .sgp-header-close:hover {
      background: var(--sgp-accent);
      color: #000;
    }

    .sgp-pill.sgp-expanded .sgp-header-close {
      display: flex;
    }

    .sgp-body {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 0;
      opacity: 0;
      transition:
        max-height var(--sgp-transition),
        opacity 0.3s ease;
    }

    .sgp-pill.sgp-expanded .sgp-body {
      max-height: 60vh;
      opacity: 1;
    }

    .sgp-children {
      padding: 0.25rem 0;
    }

    .sgp-row {
      display: flex;
      align-items: center;
      padding: 0.25rem var(--sgp-padding);
      min-height: var(--sgp-row-height);
      border-top: 0.0625rem solid var(--sgp-border);
    }

    .sgp-row:hover {
      background: var(--sgp-bg-hover);
    }

    .sgp-label {
      flex: 0 0 40%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--sgp-text-dim);
    }

    .sgp-control {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .sgp-control input[type="range"] {
      flex: 1;
      min-width: 0;
      height: 0.25rem;
      accent-color: var(--sgp-accent);
      cursor: pointer;
    }

    .sgp-control input[type="number"] {
      width: 27%;
      min-width: 2.5rem;
      flex-shrink: 0;
      background: var(--sgp-input-bg);
      border: 0.0625rem solid var(--sgp-border);
      border-radius: 0.25rem;
      color: var(--sgp-text);
      font-size: var(--sgp-font-size);
      padding: 0.125rem 0.25rem;
      text-align: right;
    }

    .sgp-control input[type="number"]:focus {
      outline: 0.0625rem solid var(--sgp-accent);
    }

    .sgp-control input[type="checkbox"] {
      accent-color: var(--sgp-accent);
      cursor: pointer;
      width: 0.875rem;
      height: 0.875rem;
    }

    .sgp-control input[type="color"] {
      width: 100%;
      height: var(--sgp-row-height);
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
    }

    .sgp-control button {
      width: 100%;
      padding: 0.25rem 0.5rem;
      background: var(--sgp-accent);
      color: #000;
      border: none;
      border-radius: 0.25rem;
      font-size: var(--sgp-font-size);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .sgp-control button:hover {
      background: var(--sgp-accent-hover);
    }

    .sgp-folder-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.25rem var(--sgp-padding);
      min-height: var(--sgp-row-height);
      border-top: 0.0625rem solid var(--sgp-border);
      cursor: pointer;
      font-weight: 600;
      color: var(--sgp-accent);
    }

    .sgp-folder-title:hover {
      background: var(--sgp-bg-hover);
    }

    .sgp-folder-children {
      padding-left: 0.5rem;
      background: var(--sgp-folder-bg);
    }

    .sgp-folder-children.sgp-hidden {
      display: none;
    }

    .sgp-folder-toggle {
      transition: transform 0.2s;
      font-size: 0.625rem;
    }

    .sgp-folder-toggle.sgp-collapsed {
      transform: rotate(-90deg);
    }

    /* 下隅スナップ時は上方向に展開 */
    .sgp-container.sgp-bottom-right .sgp-pill,
    .sgp-container.sgp-bottom-left .sgp-pill {
      display: flex;
      flex-direction: column-reverse;
    }

    .sgp-container.sgp-bottom-right .sgp-body,
    .sgp-container.sgp-bottom-left .sgp-body {
      display: flex;
      flex-direction: column-reverse;
    }
  `;
  document.head.appendChild(style);
}

/** スタイル要素を除去する */
function removeStyles() {
  const styleEl = document.getElementById(STYLE_ID);
  if (styleEl) {
    styleEl.remove();
  }
}

// ========================================
// コントローラー
// ========================================

/** コントローラー基底クラス */
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
    this.domElement.classList.add('sgp-row');
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
}

/** 数値コントローラー */
class NumberController extends Controller {
  /** @type {HTMLInputElement} */
  _numberInput;
  /** @type {HTMLInputElement | null} */
  _rangeInput;
  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   * @param {number} [min]
   * @param {number} [max]
   * @param {number} [step]
   */
  constructor(obj, prop, min, max, step) {
    super(obj, prop);

    this._rangeInput = null;

    const label = document.createElement('span');
    label.classList.add('sgp-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgp-control');

    const hasRange = min !== undefined && max !== undefined;

    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.value = String(obj[prop]);
    if (min !== undefined) numberInput.min = String(min);
    if (max !== undefined) numberInput.max = String(max);
    if (step !== undefined) numberInput.step = String(step);
    this._numberInput = numberInput;

    if (hasRange) {
      const rangeInput = document.createElement('input');
      rangeInput.type = 'range';
      rangeInput.min = String(min);
      rangeInput.max = String(max);
      rangeInput.step = String(step ?? 1);
      rangeInput.value = String(obj[prop]);
      this._rangeInput = rangeInput;

      rangeInput.addEventListener('input', () => {
        const val = Number(rangeInput.value);
        numberInput.value = String(val);
        this._setValue(val);
      });

      numberInput.addEventListener('input', () => {
        const val = Number(numberInput.value);
        rangeInput.value = String(val);
        this._setValue(val);
      });

      control.appendChild(rangeInput);
    } else {
      numberInput.addEventListener('input', () => {
        this._setValue(Number(numberInput.value));
      });
    }

    control.appendChild(numberInput);
    this.domElement.appendChild(label);
    this.domElement.appendChild(control);
  }

  /** DOM 表示を現在の値に同期する */
  updateDisplay() {
    const val = String(this._obj[this._prop]);
    this._numberInput.value = val;
    if (this._rangeInput) {
      this._rangeInput.value = val;
    }
  }
}

/** 真偽値コントローラー */
class BooleanController extends Controller {
  /** @type {HTMLInputElement} */
  _checkbox;

  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    const label = document.createElement('span');
    label.classList.add('sgp-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgp-control');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = /** @type {boolean} */ (obj[prop]);
    this._checkbox = checkbox;

    checkbox.addEventListener('change', () => {
      this._setValue(checkbox.checked);
    });

    control.appendChild(checkbox);
    this.domElement.appendChild(label);
    this.domElement.appendChild(control);
  }

  /** DOM 表示を現在の値に同期する */
  updateDisplay() {
    this._checkbox.checked = /** @type {boolean} */ (this._obj[this._prop]);
  }
}

/** カラーコントローラー */
class ColorController extends Controller {
  /** @type {HTMLInputElement} */
  _colorInput;

  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    const label = document.createElement('span');
    label.classList.add('sgp-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgp-control');

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = /** @type {string} */ (obj[prop]);
    this._colorInput = colorInput;

    colorInput.addEventListener('input', () => {
      this._setValue(colorInput.value);
    });

    control.appendChild(colorInput);
    this.domElement.appendChild(label);
    this.domElement.appendChild(control);
  }

  /** DOM 表示を現在の値に同期する */
  updateDisplay() {
    this._colorInput.value = /** @type {string} */ (this._obj[this._prop]);
  }
}

/** ボタンコントローラー */
class ButtonController {
  /** @type {HTMLElement} */
  domElement;

  /**
   * @param {string} label
   * @param {() => void} callback
   */
  constructor(label, callback) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('sgp-row');

    const spacer = document.createElement('span');
    spacer.classList.add('sgp-label');

    const control = document.createElement('div');
    control.classList.add('sgp-control');

    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', callback);

    control.appendChild(button);
    this.domElement.appendChild(spacer);
    this.domElement.appendChild(control);
  }
}

// ========================================
// ドラッグ＆スナップ
// ========================================

/** ドラッグ判定の閾値（ピクセル相当） */
const DRAG_THRESHOLD = 5;

/** スナップ位置 */
const SnapCorner = /** @type {const} */ ({
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
});

/**
 * clientX/Y を vw/vh 単位の文字列に変換する
 * @param {number} clientX
 * @param {number} clientY
 * @param {number} offsetX
 * @param {number} offsetY
 * @returns {{ left: string, top: string }}
 */
function toViewportUnits(clientX, clientY, offsetX, offsetY) {
  const left = ((clientX - offsetX) / window.innerWidth) * 100;
  const top = ((clientY - offsetY) / window.innerHeight) * 100;
  return { left: `${left}vw`, top: `${top}vh` };
}

// ========================================
// SimpleGuiPill 本体
// ========================================

class SimpleGuiPill {
  /** @type {HTMLElement} */
  domElement;
  /** @type {HTMLElement} */
  _pillEl;
  /** @type {HTMLElement} */
  _headerEl;
  /** @type {HTMLElement} */
  _bodyEl;
  /** @type {HTMLElement} */
  _childrenEl;
  /** @type {boolean} */
  _isRoot;
  /** @type {boolean} */
  _expanded;
  /** @type {typeof SnapCorner[keyof typeof SnapCorner]} */
  _corner;
  /** @type {boolean} */
  _isDragging;
  /** @type {number} */
  _dragStartX;
  /** @type {number} */
  _dragStartY;
  /** @type {number} */
  _dragOffsetX;
  /** @type {number} */
  _dragOffsetY;
  /** @type {boolean} */
  _dragMoved;
  /** @type {Array<() => void>} */
  _cleanupFns;
  /** @type {Controller[]} */
  _controllers;
  /** @type {SimpleGuiPill[]} */
  _folders;

  /**
   * @param {{ title?: string, parent?: HTMLElement }} [options]
   */
  constructor(options = {}) {
    const { title = 'Controls', parent } = options;

    injectStyles();

    this._isRoot = !parent;
    this._controllers = [];
    this._folders = [];
    this._expanded = false;
    this._corner = SnapCorner.TOP_RIGHT;
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;
    this._dragMoved = false;
    this._cleanupFns = [];

    this.domElement = document.createElement('div');
    this._pillEl = document.createElement('div');
    this._headerEl = document.createElement('div');
    this._bodyEl = document.createElement('div');
    this._childrenEl = document.createElement('div');

    if (this._isRoot) {
      this._buildRootPill(title);
    } else {
      this._buildFolder(title, /** @type {HTMLElement} */ (parent));
    }
  }

  /**
   * ルートのピル（カプセル）を構築する
   * @param {string} title
   */
  _buildRootPill(title) {
    this.domElement.classList.add('sgp-container', 'sgp-top-right');
    this._pillEl.classList.add('sgp-pill', 'sgp-collapsed');

    // ヘッダー
    this._headerEl.classList.add('sgp-header');

    const titleText = document.createElement('span');
    titleText.classList.add('sgp-header-title');
    titleText.textContent = title;

    const dot = document.createElement('span');
    dot.classList.add('sgp-header-dot');

    const closeBtn = document.createElement('button');
    closeBtn.classList.add('sgp-header-close');
    closeBtn.textContent = '\u2715';
    closeBtn.title = '\u53CE\u7D0D';

    this._headerEl.appendChild(titleText);
    this._headerEl.appendChild(dot);
    this._headerEl.appendChild(closeBtn);

    // ボディ
    this._bodyEl.classList.add('sgp-body');
    this._childrenEl.classList.add('sgp-children');
    this._bodyEl.appendChild(this._childrenEl);

    this._pillEl.appendChild(this._headerEl);
    this._pillEl.appendChild(this._bodyEl);
    this.domElement.appendChild(this._pillEl);
    document.body.appendChild(this.domElement);

    this._setupToggle(closeBtn);
    this._setupDrag();
  }

  /**
   * フォルダ（子パネル）を構築する
   * @param {string} title
   * @param {HTMLElement} parentEl
   */
  _buildFolder(title, parentEl) {
    const folderTitle = document.createElement('div');
    folderTitle.classList.add('sgp-folder-title');

    const folderText = document.createElement('span');
    folderText.textContent = title;

    const toggle = document.createElement('span');
    toggle.classList.add('sgp-folder-toggle');
    toggle.textContent = '\u25BC';

    folderTitle.appendChild(folderText);
    folderTitle.appendChild(toggle);

    this._childrenEl.classList.add('sgp-folder-children');

    folderTitle.addEventListener('click', () => {
      const hidden = this._childrenEl.classList.toggle('sgp-hidden');
      toggle.classList.toggle('sgp-collapsed', hidden);
    });

    this.domElement.appendChild(folderTitle);
    this.domElement.appendChild(this._childrenEl);
    parentEl.appendChild(this.domElement);
  }

  /**
   * トグル（展開/収納）イベントを設定する
   * @param {HTMLElement} closeBtn
   */
  _setupToggle(closeBtn) {
    const onHeaderClick = () => {
      if (this._dragMoved) {
        return;
      }
      if (!this._expanded) {
        this._expand();
      }
    };
    this._headerEl.addEventListener('click', onHeaderClick);
    this._cleanupFns.push(() =>
      this._headerEl.removeEventListener('click', onHeaderClick),
    );

    const onClose = (/** @type {Event} */ e) => {
      e.stopPropagation();
      this._collapse();
    };
    closeBtn.addEventListener('click', onClose);
    this._cleanupFns.push(() => closeBtn.removeEventListener('click', onClose));
  }

  /** パネルを展開する */
  _expand() {
    this._expanded = true;
    this._pillEl.classList.remove('sgp-collapsed');
    this._pillEl.classList.add('sgp-expanded');
  }

  /** パネルを収納する（ピルに戻す） */
  _collapse() {
    this._expanded = false;
    this._pillEl.classList.remove('sgp-expanded');
    this._pillEl.classList.add('sgp-collapsed');
  }

  /** ドラッグ＆四隅スナップを設定する */
  _setupDrag() {
    /** @type {(e: PointerEvent) => void} */
    const onDown = (e) => {
      if (!this._headerEl.contains(/** @type {Node} */ (e.target))) {
        return;
      }
      this._isDragging = true;
      this._dragMoved = false;
      const rect = this.domElement.getBoundingClientRect();
      this._dragStartX = e.clientX;
      this._dragStartY = e.clientY;
      this._dragOffsetX = e.clientX - rect.left;
      this._dragOffsetY = e.clientY - rect.top;
      this.domElement.classList.add('sgp-dragging');
      this._headerEl.setPointerCapture(e.pointerId);
    };

    /** @type {(e: PointerEvent) => void} */
    const onMove = (e) => {
      if (!this._isDragging) {
        return;
      }
      const dx = e.clientX - this._dragStartX;
      const dy = e.clientY - this._dragStartY;
      if (
        !this._dragMoved &&
        Math.abs(dx) < DRAG_THRESHOLD &&
        Math.abs(dy) < DRAG_THRESHOLD
      ) {
        return;
      }
      this._dragMoved = true;
      const pos = toViewportUnits(
        e.clientX,
        e.clientY,
        this._dragOffsetX,
        this._dragOffsetY,
      );
      const s = this.domElement.style;
      s.left = pos.left;
      s.top = pos.top;
      s.right = 'auto';
      s.bottom = 'auto';
    };

    /** @type {() => void} */
    const onUp = () => {
      if (!this._isDragging) {
        return;
      }
      this._isDragging = false;
      this.domElement.classList.remove('sgp-dragging');
      if (!this._dragMoved) {
        this._clearInlinePosition();
        return;
      }
      this._snapToNearestCorner();
    };

    this._headerEl.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    this._cleanupFns.push(() => {
      this._headerEl.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    });
  }

  /** 最も近い四隅にスナップする */
  _snapToNearestCorner() {
    const rect = this.domElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const isRight = cx > window.innerWidth / 2;
    const isBottom = cy > window.innerHeight / 2;

    /** @type {typeof SnapCorner[keyof typeof SnapCorner]} */
    let corner;
    if (isBottom && isRight) {
      corner = SnapCorner.BOTTOM_RIGHT;
    } else if (isBottom) {
      corner = SnapCorner.BOTTOM_LEFT;
    } else if (isRight) {
      corner = SnapCorner.TOP_RIGHT;
    } else {
      corner = SnapCorner.TOP_LEFT;
    }

    this._corner = corner;
    this.domElement.classList.remove(
      'sgp-top-right',
      'sgp-top-left',
      'sgp-bottom-right',
      'sgp-bottom-left',
    );
    this._clearInlinePosition();
    this.domElement.classList.add(`sgp-${corner}`);
  }

  /** インラインの位置スタイルをクリアする */
  _clearInlinePosition() {
    const s = this.domElement.style;
    s.removeProperty('left');
    s.removeProperty('top');
    s.removeProperty('right');
    s.removeProperty('bottom');
  }

  // --- パブリック API ---

  /**
   * 値の型に応じたコントローラーを追加する
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   * @param {number} [min]
   * @param {number} [max]
   * @param {number} [step]
   * @returns {Controller}
   */
  add(obj, prop, min, max, step) {
    if (typeof obj[prop] === 'boolean') {
      const ctrl = new BooleanController(obj, prop);
      this._childrenEl.appendChild(ctrl.domElement);
      this._controllers.push(ctrl);
      return ctrl;
    }
    const ctrl = new NumberController(obj, prop, min, max, step);
    this._childrenEl.appendChild(ctrl.domElement);
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
    this._childrenEl.appendChild(ctrl.domElement);
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
    this._childrenEl.appendChild(ctrl.domElement);
    return ctrl;
  }

  /**
   * 折りたたみフォルダを追加する
   * @param {string} title
   * @returns {SimpleGuiPill}
   */
  addFolder(title) {
    const folder = new SimpleGuiPill({ title, parent: this._childrenEl });
    this._folders.push(folder);
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

  /** DOM とイベントリスナーを完全に除去する */
  destroy() {
    for (const cleanup of this._cleanupFns) {
      cleanup();
    }
    this._cleanupFns = [];

    if (this._isRoot && this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }

    if (document.querySelectorAll('.sgp-container').length === 0) {
      removeStyles();
    }
  }
}

export default SimpleGuiPill;
