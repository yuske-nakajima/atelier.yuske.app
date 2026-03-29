// @ts-check

/**
 * SimpleGui - lil-gui 簡易版の GUI ライブラリ
 * フローティングパネルで数値・boolean・色・ボタンのコントロールを提供する
 */

// CSS 注入（一度だけ）
const STYLE_ID = 'simple-gui-style';

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
      --sg-bg: #1a1a2e;
      --sg-bg-hover: #252542;
      --sg-border: #333355;
      --sg-text: #e0e0e0;
      --sg-text-dim: #999;
      --sg-accent: #6c63ff;
      --sg-accent-hover: #857dff;
      --sg-input-bg: #0f0f1a;
      --sg-folder-bg: #15152a;
      --sg-radius: 0.25rem;
      --sg-font-size: 0.75rem;
      --sg-row-height: 1.75rem;
      --sg-padding: 0.5rem;
      --sg-width: 16rem;
    }

    .sg-panel {
      position: fixed;
      top: 0.5rem;
      right: 0.5rem;
      width: var(--sg-width);
      font-family: system-ui, -apple-system, sans-serif;
      font-size: var(--sg-font-size);
      color: var(--sg-text);
      background: var(--sg-bg);
      border: 0.0625rem solid var(--sg-border);
      border-radius: var(--sg-radius);
      z-index: 10000;
      user-select: none;
      box-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.4);
    }

    .sg-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sg-padding);
      background: var(--sg-bg);
      border-bottom: 0.0625rem solid var(--sg-border);
      border-radius: var(--sg-radius) var(--sg-radius) 0 0;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.8125rem;
    }

    .sg-title-toggle {
      transition: transform 0.2s;
    }

    .sg-title-toggle.sg-collapsed {
      transform: rotate(-90deg);
    }

    .sg-children {
      overflow: hidden;
    }

    .sg-children.sg-hidden {
      display: none;
    }

    .sg-row {
      display: flex;
      align-items: center;
      padding: 0.25rem var(--sg-padding);
      min-height: var(--sg-row-height);
      border-bottom: 0.0625rem solid var(--sg-border);
    }

    .sg-row:hover {
      background: var(--sg-bg-hover);
    }

    .sg-label {
      flex: 0 0 40%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--sg-text-dim);
    }

    .sg-control {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .sg-control input[type="range"] {
      flex: 1;
      height: 0.25rem;
      accent-color: var(--sg-accent);
      cursor: pointer;
    }

    .sg-control input[type="number"] {
      width: 3.5rem;
      background: var(--sg-input-bg);
      border: 0.0625rem solid var(--sg-border);
      border-radius: var(--sg-radius);
      color: var(--sg-text);
      font-size: var(--sg-font-size);
      padding: 0.125rem 0.25rem;
      text-align: right;
    }

    .sg-control input[type="number"]:focus {
      outline: 0.0625rem solid var(--sg-accent);
    }

    .sg-control input[type="checkbox"] {
      accent-color: var(--sg-accent);
      cursor: pointer;
      width: 0.875rem;
      height: 0.875rem;
    }

    .sg-control input[type="color"] {
      width: 100%;
      height: var(--sg-row-height);
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
    }

    .sg-control button {
      width: 100%;
      padding: 0.25rem 0.5rem;
      background: var(--sg-accent);
      color: #fff;
      border: none;
      border-radius: var(--sg-radius);
      font-size: var(--sg-font-size);
      cursor: pointer;
      transition: background 0.15s;
    }

    .sg-control button:hover {
      background: var(--sg-accent-hover);
    }

    .sg-folder-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.25rem var(--sg-padding);
      min-height: var(--sg-row-height);
      border-bottom: 0.0625rem solid var(--sg-border);
      cursor: pointer;
      font-weight: 600;
      color: var(--sg-accent);
    }

    .sg-folder-title:hover {
      background: var(--sg-bg-hover);
    }

    .sg-folder-children {
      padding-left: 0.5rem;
      background: var(--sg-folder-bg);
    }

    .sg-folder-children.sg-hidden {
      display: none;
    }

    .sg-folder-toggle {
      transition: transform 0.2s;
    }

    .sg-folder-toggle.sg-collapsed {
      transform: rotate(-90deg);
    }
  `;
  document.head.appendChild(style);
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
    this.domElement.classList.add('sg-row');
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
}

// --- NumberController ---

class NumberController extends Controller {
  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   * @param {number} [min]
   * @param {number} [max]
   * @param {number} [step]
   */
  constructor(obj, prop, min, max, step) {
    super(obj, prop);

    const label = document.createElement('span');
    label.classList.add('sg-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sg-control');

    const hasRange = min !== undefined && max !== undefined;

    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.value = String(obj[prop]);
    if (min !== undefined) numberInput.min = String(min);
    if (max !== undefined) numberInput.max = String(max);
    if (step !== undefined) numberInput.step = String(step);

    if (hasRange) {
      const rangeInput = document.createElement('input');
      rangeInput.type = 'range';
      rangeInput.min = String(min);
      rangeInput.max = String(max);
      rangeInput.step = String(step ?? 1);
      rangeInput.value = String(obj[prop]);

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
}

// --- BooleanController ---

class BooleanController extends Controller {
  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    const label = document.createElement('span');
    label.classList.add('sg-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sg-control');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = /** @type {boolean} */ (obj[prop]);

    checkbox.addEventListener('change', () => {
      this._setValue(checkbox.checked);
    });

    control.appendChild(checkbox);
    this.domElement.appendChild(label);
    this.domElement.appendChild(control);
  }
}

// --- ColorController ---

class ColorController extends Controller {
  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    const label = document.createElement('span');
    label.classList.add('sg-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sg-control');

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = /** @type {string} */ (obj[prop]);

    colorInput.addEventListener('input', () => {
      this._setValue(colorInput.value);
    });

    control.appendChild(colorInput);
    this.domElement.appendChild(label);
    this.domElement.appendChild(control);
  }
}

// --- ButtonController ---

class ButtonController {
  /** @type {HTMLElement} */
  domElement;

  /**
   * @param {string} label
   * @param {() => void} callback
   */
  constructor(label, callback) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('sg-row');

    const spacer = document.createElement('span');
    spacer.classList.add('sg-label');

    const control = document.createElement('div');
    control.classList.add('sg-control');

    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', callback);

    control.appendChild(button);
    this.domElement.appendChild(spacer);
    this.domElement.appendChild(control);
  }
}

// --- SimpleGui ---

class SimpleGui {
  /** @type {HTMLElement} */
  domElement;
  /** @type {HTMLElement} */
  _childrenEl;
  /** @type {boolean} */
  _isRoot;

  /**
   * @param {{ title?: string, parent?: HTMLElement }} [options]
   */
  constructor(options = {}) {
    const { title = 'Controls', parent } = options;

    injectStyles();

    this._isRoot = !parent;

    if (this._isRoot) {
      // ルートパネル
      this.domElement = document.createElement('div');
      this.domElement.classList.add('sg-panel');

      const titleBar = document.createElement('div');
      titleBar.classList.add('sg-title');

      const titleText = document.createElement('span');
      titleText.textContent = title;

      const toggle = document.createElement('span');
      toggle.classList.add('sg-title-toggle');
      toggle.textContent = '\u25BC';

      titleBar.appendChild(titleText);
      titleBar.appendChild(toggle);

      this._childrenEl = document.createElement('div');
      this._childrenEl.classList.add('sg-children');

      titleBar.addEventListener('click', () => {
        const isHidden = this._childrenEl.classList.toggle('sg-hidden');
        toggle.classList.toggle('sg-collapsed', isHidden);
      });

      this.domElement.appendChild(titleBar);
      this.domElement.appendChild(this._childrenEl);
      document.body.appendChild(this.domElement);
    } else {
      // フォルダ（子パネル）
      this.domElement = document.createElement('div');

      const folderTitle = document.createElement('div');
      folderTitle.classList.add('sg-folder-title');

      const folderText = document.createElement('span');
      folderText.textContent = title;

      const folderToggle = document.createElement('span');
      folderToggle.classList.add('sg-folder-toggle');
      folderToggle.textContent = '\u25BC';

      folderTitle.appendChild(folderText);
      folderTitle.appendChild(folderToggle);

      this._childrenEl = document.createElement('div');
      this._childrenEl.classList.add('sg-folder-children');

      folderTitle.addEventListener('click', () => {
        const isHidden = this._childrenEl.classList.toggle('sg-hidden');
        folderToggle.classList.toggle('sg-collapsed', isHidden);
      });

      this.domElement.appendChild(folderTitle);
      this.domElement.appendChild(this._childrenEl);
      /** @type {HTMLElement} */ (parent).appendChild(this.domElement);
    }
  }

  /**
   * 値の型に応じたコントローラーを追加する
   * - boolean: チェックボックス
   * - number: 数値スライダー
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
      this._childrenEl.appendChild(ctrl.domElement);
      return ctrl;
    }

    const ctrl = new NumberController(obj, prop, min, max, step);
    this._childrenEl.appendChild(ctrl.domElement);
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
   * @returns {SimpleGui}
   */
  addFolder(title) {
    return new SimpleGui({ title, parent: this._childrenEl });
  }
}

export default SimpleGui;
