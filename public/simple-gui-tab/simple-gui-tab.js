// @ts-check

/**
 * SimpleGuiTab - タブバー型 GUI ライブラリ
 * モバイルアプリの下部タブバー風 UI
 * addFolder() が新タブとして追加される
 * 四隅にドラッグでスナップ・収納対応
 *
 * 単一ファイル構成: CSS も JS から注入する
 */

// ========================================
// SVG アイコン定義
// ========================================

const ICONS = {
  general: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  sliders: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

/** アイコン名の一覧（タブに循環的に割り当てる） */
const ICON_KEYS = ['general', 'sliders', 'layers', 'eye', 'zap', 'star'];

// ========================================
// スタイル注入
// ========================================

const STYLE_ID = 'simple-gui-tab-style';

/** スタイルを注入する（一度だけ） */
function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --sgt-bg: #1c1c1e;
      --sgt-bg-panel: #2c2c2e;
      --sgt-bg-hover: #3a3a3c;
      --sgt-border: #38383a;
      --sgt-text: #ffffff;
      --sgt-text-dim: #98989d;
      --sgt-accent: #BF5AF2;
      --sgt-accent-hover: #c96ef5;
      --sgt-input-bg: #0a0a0a;
      --sgt-font-size: 0.75rem;
      --sgt-row-height: 1.75rem;
      --sgt-padding: 0.5rem;
      --sgt-width: 17rem;
      --sgt-tab-height: 2.75rem;
      --sgt-transition: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      --sgt-margin: 0.75rem;
      --sgt-radius: 0.75rem;
    }

    .sgt-container {
      position: fixed;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: var(--sgt-font-size);
      color: var(--sgt-text);
      user-select: none;
      touch-action: none;
      width: var(--sgt-width);
    }

    .sgt-container.sgt-top-right {
      top: var(--sgt-margin);
      right: var(--sgt-margin);
    }
    .sgt-container.sgt-top-left {
      top: var(--sgt-margin);
      left: var(--sgt-margin);
    }
    .sgt-container.sgt-bottom-right {
      bottom: var(--sgt-margin);
      right: var(--sgt-margin);
    }
    .sgt-container.sgt-bottom-left {
      bottom: var(--sgt-margin);
      left: var(--sgt-margin);
    }

    .sgt-shell {
      background: var(--sgt-bg);
      border-radius: var(--sgt-radius);
      box-shadow: 0 0.25rem 1.5rem rgba(0, 0, 0, 0.5),
                  0 0 0 0.0625rem rgba(255, 255, 255, 0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* 下隅スナップ時はタブを下に配置 */
    .sgt-container.sgt-bottom-right .sgt-shell,
    .sgt-container.sgt-bottom-left .sgt-shell {
      flex-direction: column-reverse;
    }

    .sgt-container.sgt-dragging .sgt-shell {
      opacity: 0.85;
    }

    /* タブバー */
    .sgt-tab-bar {
      display: flex;
      align-items: stretch;
      background: var(--sgt-bg);
      border-bottom: 0.0625rem solid var(--sgt-border);
      min-height: var(--sgt-tab-height);
      cursor: pointer;
      flex-shrink: 0;
    }

    .sgt-container.sgt-bottom-right .sgt-tab-bar,
    .sgt-container.sgt-bottom-left .sgt-tab-bar {
      border-bottom: none;
      border-top: 0.0625rem solid var(--sgt-border);
    }

    .sgt-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
      padding: 0.25rem 0.125rem;
      cursor: pointer;
      color: var(--sgt-text-dim);
      transition: color 0.2s, background 0.2s;
      border: none;
      background: none;
      font-family: inherit;
      font-size: 0.5625rem;
      min-width: 0;
    }

    .sgt-tab:hover {
      background: var(--sgt-bg-hover);
    }

    .sgt-tab.sgt-tab-active {
      color: var(--sgt-accent);
    }

    .sgt-tab-icon {
      width: 1.125rem;
      height: 1.125rem;
      flex-shrink: 0;
    }

    .sgt-tab-icon svg {
      width: 100%;
      height: 100%;
    }

    .sgt-tab-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    /* コンテンツエリア */
    .sgt-content-area {
      position: relative;
      overflow: hidden;
      transition: max-height var(--sgt-transition);
      max-height: 0;
    }

    .sgt-container.sgt-expanded .sgt-content-area {
      max-height: 60vh;
    }

    .sgt-tab-panel {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }

    .sgt-tab-panel.sgt-panel-active {
      position: relative;
      opacity: 1;
      pointer-events: auto;
    }

    .sgt-panel-scroll {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 55vh;
    }

    .sgt-children {
      padding: 0.25rem 0;
    }

    /* コントローラー行 */
    .sgt-row {
      display: flex;
      align-items: center;
      padding: 0.25rem var(--sgt-padding);
      min-height: var(--sgt-row-height);
      border-top: 0.0625rem solid var(--sgt-border);
    }

    .sgt-row:first-child {
      border-top: none;
    }

    .sgt-row:hover {
      background: var(--sgt-bg-hover);
    }

    .sgt-label {
      flex: 0 0 40%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--sgt-text-dim);
    }

    .sgt-control {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .sgt-control input[type="range"] {
      flex: 1;
      min-width: 0;
      height: 0.25rem;
      accent-color: var(--sgt-accent);
      cursor: pointer;
    }

    .sgt-control input[type="number"] {
      width: 27%;
      min-width: 2.5rem;
      flex-shrink: 0;
      background: var(--sgt-input-bg);
      border: 0.0625rem solid var(--sgt-border);
      border-radius: 0.25rem;
      color: var(--sgt-text);
      font-size: var(--sgt-font-size);
      padding: 0.125rem 0.25rem;
      text-align: right;
    }

    .sgt-control input[type="number"]:focus {
      outline: 0.0625rem solid var(--sgt-accent);
    }

    .sgt-control input[type="checkbox"] {
      accent-color: var(--sgt-accent);
      cursor: pointer;
      width: 0.875rem;
      height: 0.875rem;
    }

    .sgt-control input[type="color"] {
      width: 100%;
      height: var(--sgt-row-height);
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
    }

    .sgt-control button {
      width: 100%;
      padding: 0.25rem 0.5rem;
      background: var(--sgt-accent);
      color: #fff;
      border: none;
      border-radius: 0.25rem;
      font-size: var(--sgt-font-size);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .sgt-control button:hover {
      background: var(--sgt-accent-hover);
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
    this.domElement.classList.add('sgt-row');
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
    label.classList.add('sgt-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgt-control');

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
    label.classList.add('sgt-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgt-control');

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
    label.classList.add('sgt-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgt-control');

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
    this.domElement.classList.add('sgt-row');

    const spacer = document.createElement('span');
    spacer.classList.add('sgt-label');

    const control = document.createElement('div');
    control.classList.add('sgt-control');

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

/** ドラッグ判定の閾値 */
const DRAG_THRESHOLD = 5;

/** スナップ位置 */
const SnapCorner = /** @type {const} */ ({
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
});

// ========================================
// タブ情報
// ========================================

/**
 * @typedef {object} TabInfo
 * @property {string} name - タブ名
 * @property {string} iconKey - アイコンキー
 * @property {HTMLElement} panelEl - パネル要素
 * @property {HTMLElement} childrenEl - コントローラーの親要素
 * @property {HTMLButtonElement} tabBtn - タブボタン要素
 */

// ========================================
// SimpleGuiTab 本体
// ========================================

class SimpleGuiTab {
  /** @type {HTMLElement} */
  domElement;
  /** @type {HTMLElement} */
  _shellEl;
  /** @type {HTMLElement} */
  _tabBarEl;
  /** @type {HTMLElement} */
  _contentAreaEl;
  /** @type {TabInfo[]} */
  _tabs;
  /** @type {number} */
  _activeTabIndex;
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
  /** @type {number} */
  _iconCounter;
  /** @type {Controller[]} */
  _controllers;
  /** @type {SimpleGuiTabFolder[]} */
  _folders;

  /**
   * @param {{ title?: string }} [options]
   */
  constructor(options = {}) {
    const { title = 'General' } = options;

    injectStyles();

    this._tabs = [];
    this._controllers = [];
    this._folders = [];
    this._activeTabIndex = 0;
    this._expanded = false;
    this._corner = SnapCorner.TOP_RIGHT;
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;
    this._dragMoved = false;
    this._cleanupFns = [];
    this._iconCounter = 0;

    this.domElement = document.createElement('div');
    this._shellEl = document.createElement('div');
    this._tabBarEl = document.createElement('div');
    this._contentAreaEl = document.createElement('div');

    this._buildRoot(title);
  }

  /**
   * ルートコンテナを構築する
   * @param {string} title
   */
  _buildRoot(title) {
    this.domElement.classList.add('sgt-container', 'sgt-top-right');
    this._shellEl.classList.add('sgt-shell');
    this._tabBarEl.classList.add('sgt-tab-bar');
    this._contentAreaEl.classList.add('sgt-content-area');

    this._shellEl.appendChild(this._tabBarEl);
    this._shellEl.appendChild(this._contentAreaEl);
    this.domElement.appendChild(this._shellEl);
    document.body.appendChild(this.domElement);

    // デフォルトの General タブを作成
    this._createTab(title);
    this._activateTab(0);

    this._setupTabBarToggle();
    this._setupDrag();
  }

  /**
   * 新しいタブを作成する
   * @param {string} name
   * @returns {TabInfo}
   */
  _createTab(name) {
    const iconKey = ICON_KEYS[this._iconCounter % ICON_KEYS.length];
    this._iconCounter++;

    // タブボタン
    const tabBtn = /** @type {HTMLButtonElement} */ (
      document.createElement('button')
    );
    tabBtn.classList.add('sgt-tab');
    tabBtn.type = 'button';

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('sgt-tab-icon');
    iconSpan.innerHTML = ICONS[iconKey] || ICONS.general;

    const labelSpan = document.createElement('span');
    labelSpan.classList.add('sgt-tab-label');
    labelSpan.textContent = name;

    tabBtn.appendChild(iconSpan);
    tabBtn.appendChild(labelSpan);
    this._tabBarEl.appendChild(tabBtn);

    // パネル
    const panelEl = document.createElement('div');
    panelEl.classList.add('sgt-tab-panel');

    const scrollEl = document.createElement('div');
    scrollEl.classList.add('sgt-panel-scroll');

    const childrenEl = document.createElement('div');
    childrenEl.classList.add('sgt-children');

    scrollEl.appendChild(childrenEl);
    panelEl.appendChild(scrollEl);
    this._contentAreaEl.appendChild(panelEl);

    const index = this._tabs.length;

    const onClick = () => {
      if (this._dragMoved) {
        return;
      }
      if (!this._expanded) {
        this._expand();
      }
      this._activateTab(index);
    };
    tabBtn.addEventListener('click', onClick);
    this._cleanupFns.push(() => tabBtn.removeEventListener('click', onClick));

    /** @type {TabInfo} */
    const tab = { name, iconKey, panelEl, childrenEl, tabBtn };
    this._tabs.push(tab);

    return tab;
  }

  /**
   * 指定インデックスのタブをアクティブにする
   * @param {number} index
   */
  _activateTab(index) {
    this._activeTabIndex = index;

    for (let i = 0; i < this._tabs.length; i++) {
      const tab = this._tabs[i];
      const isActive = i === index;
      tab.tabBtn.classList.toggle('sgt-tab-active', isActive);
      tab.panelEl.classList.toggle('sgt-panel-active', isActive);
    }
  }

  /** タブバーのタップで展開/収納をトグルする */
  _setupTabBarToggle() {
    // タブバー領域のダブルクリックで収納
    const onDblClick = () => {
      if (this._expanded) {
        this._collapse();
      }
    };
    this._tabBarEl.addEventListener('dblclick', onDblClick);
    this._cleanupFns.push(() =>
      this._tabBarEl.removeEventListener('dblclick', onDblClick),
    );
  }

  /** コンテンツエリアを展開する */
  _expand() {
    this._expanded = true;
    this.domElement.classList.add('sgt-expanded');
  }

  /** コンテンツエリアを収納する */
  _collapse() {
    this._expanded = false;
    this.domElement.classList.remove('sgt-expanded');
  }

  /** ドラッグ＆四隅スナップを設定する */
  _setupDrag() {
    /** @type {(e: PointerEvent) => void} */
    const onDown = (e) => {
      if (!this._tabBarEl.contains(/** @type {Node} */ (e.target))) {
        return;
      }
      this._isDragging = true;
      this._dragMoved = false;
      const rect = this.domElement.getBoundingClientRect();
      this._dragStartX = e.clientX;
      this._dragStartY = e.clientY;
      this._dragOffsetX = e.clientX - rect.left;
      this._dragOffsetY = e.clientY - rect.top;
      this.domElement.classList.add('sgt-dragging');
      this._tabBarEl.setPointerCapture(e.pointerId);
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
      const left = ((e.clientX - this._dragOffsetX) / window.innerWidth) * 100;
      const top = ((e.clientY - this._dragOffsetY) / window.innerHeight) * 100;
      const s = this.domElement.style;
      s.left = `${left}vw`;
      s.top = `${top}vh`;
      s.right = 'auto';
      s.bottom = 'auto';
    };

    /** @type {(e: PointerEvent) => void} */
    const onUp = (e) => {
      if (!this._isDragging) {
        return;
      }
      this._isDragging = false;
      this.domElement.classList.remove('sgt-dragging');
      if (!this._dragMoved) {
        this._clearInlinePosition();
        // ドラッグなしのタップ — クリック先のタブを特定して展開
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target) {
          const tabBtn = target.closest('.sgt-tab');
          if (tabBtn) {
            const idx = this._tabs.findIndex((t) => t.tabBtn === tabBtn);
            if (idx >= 0) {
              if (!this._expanded) {
                this._expand();
              }
              this._activateTab(idx);
            }
          }
        }
        return;
      }
      this._snapToNearestCorner();
    };

    this._tabBarEl.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    this._cleanupFns.push(() => {
      this._tabBarEl.removeEventListener('pointerdown', onDown);
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
      'sgt-top-right',
      'sgt-top-left',
      'sgt-bottom-right',
      'sgt-bottom-left',
    );
    this._clearInlinePosition();
    this.domElement.classList.add(`sgt-${corner}`);
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
   * 現在のアクティブタブの children を取得する
   * @returns {HTMLElement}
   */
  _currentChildren() {
    return this._tabs[0].childrenEl;
  }

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
      this._currentChildren().appendChild(ctrl.domElement);
      this._controllers.push(ctrl);
      return ctrl;
    }
    const ctrl = new NumberController(obj, prop, min, max, step);
    this._currentChildren().appendChild(ctrl.domElement);
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
    this._currentChildren().appendChild(ctrl.domElement);
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
    this._currentChildren().appendChild(ctrl.domElement);
    return ctrl;
  }

  /**
   * フォルダ（= 新タブ）を追加する
   * @param {string} title
   * @returns {SimpleGuiTabFolder}
   */
  addFolder(title) {
    const tab = this._createTab(title);
    const folder = new SimpleGuiTabFolder(tab.childrenEl);
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

    if (this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }

    if (document.querySelectorAll('.sgt-container').length === 0) {
      removeStyles();
    }
  }
}

// ========================================
// フォルダ（タブのコンテンツ操作用プロキシ）
// ========================================

class SimpleGuiTabFolder {
  /** @type {HTMLElement} */
  _childrenEl;
  /** @type {Controller[]} */
  _controllers;

  /**
   * @param {HTMLElement} childrenEl
   */
  constructor(childrenEl) {
    this._childrenEl = childrenEl;
    this._controllers = [];
  }

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

  /** 全コントローラーの DOM 表示を現在の値に同期する */
  updateDisplay() {
    for (const ctrl of this._controllers) {
      ctrl.updateDisplay();
    }
  }
}

export default SimpleGuiTab;
