// @ts-check

/**
 * SimpleGuiSheet 用コントローラーモジュール
 */

// --- コントローラー基底クラス ---

export class Controller {
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
    this.domElement.classList.add('sgs-row');
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

export class NumberController extends Controller {
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
    label.classList.add('sgs-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgs-control');

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

export class BooleanController extends Controller {
  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    const label = document.createElement('span');
    label.classList.add('sgs-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgs-control');

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

export class ColorController extends Controller {
  /**
   * @param {Record<string, unknown>} obj
   * @param {string} prop
   */
  constructor(obj, prop) {
    super(obj, prop);

    const label = document.createElement('span');
    label.classList.add('sgs-label');
    label.textContent = prop;

    const control = document.createElement('div');
    control.classList.add('sgs-control');

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

export class ButtonController {
  /** @type {HTMLElement} */
  domElement;

  /**
   * @param {string} label
   * @param {() => void} callback
   */
  constructor(label, callback) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('sgs-row');

    const spacer = document.createElement('span');
    spacer.classList.add('sgs-label');

    const control = document.createElement('div');
    control.classList.add('sgs-control');

    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', callback);

    control.appendChild(button);
    this.domElement.appendChild(spacer);
    this.domElement.appendChild(control);
  }
}
