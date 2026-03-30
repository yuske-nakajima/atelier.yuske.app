// @ts-check

/**
 * SimpleGuiSheet - ボトムシート型 GUI ライブラリ
 * iOS/Android のボトムシートを模したスライドアップ UI
 * すりガラス風半透明背景、四隅スナップ、FAB 収納対応
 */

import {
  BooleanController,
  ButtonController,
  ColorController,
  Controller,
  NumberController,
} from './controllers.js';
import { injectStyles, removeStyles } from './styles.js';

/** シートの展開状態 */
const SheetState = /** @type {const} */ ({
  COLLAPSED: 'collapsed',
  HALF: 'half',
  FULL: 'full',
  FAB: 'fab',
});

/** スナップ位置 */
const SnapCorner = /** @type {const} */ ({
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
});

/** 歯車アイコンの SVG */
const GEAR_SVG =
  '<svg width="1.25em" height="1.25em" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 ' +
  '0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22' +
  '.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74' +
  'l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 ' +
  '0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2' +
  'v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73' +
  '-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0' +
  ' 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73' +
  'l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"' +
  '/><circle cx="12" cy="12" r="3"/></svg>';

/** ドラッグ判定の閾値 */
const DRAG_THRESHOLD = 5;

class SimpleGuiSheet {
  /** @type {HTMLElement} */
  domElement;
  /** @type {HTMLElement} */
  _childrenEl;
  /** @type {HTMLElement} */
  _bodyEl;
  /** @type {HTMLElement} */
  _handleEl;
  /** @type {HTMLElement} */
  _fabIconEl;
  /** @type {boolean} */
  _isRoot;
  /** @type {typeof SheetState[keyof typeof SheetState]} */
  _state;
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
  /** @type {SimpleGuiSheet[]} */
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
    this._state = SheetState.HALF;
    this._corner = SnapCorner.BOTTOM_RIGHT;
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._dragOffsetX = 0;
    this._dragOffsetY = 0;
    this._dragMoved = false;
    this._cleanupFns = [];
    this._bodyEl = document.createElement('div');
    this._handleEl = document.createElement('div');
    this._fabIconEl = document.createElement('div');
    this._childrenEl = document.createElement('div');

    if (this._isRoot) {
      this._buildRootPanel(title);
    } else {
      this._buildFolder(title, /** @type {HTMLElement} */ (parent));
    }
  }

  /**
   * ルートパネル（ボトムシート）を構築する
   * @param {string} title
   */
  _buildRootPanel(title) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('sgs-sheet', 'sgs-bottom-right');
    this._applyState(SheetState.HALF);

    this._buildFabIcon();
    this._buildHandle();
    this._buildTitleBar(title);
    this._buildBody();

    document.body.appendChild(this.domElement);
    this._setupDrag();
    this._setupHandleTap();
  }

  /** FAB アイコンを構築する */
  _buildFabIcon() {
    this._fabIconEl.classList.add('sgs-fab-icon');
    this._fabIconEl.innerHTML = GEAR_SVG;
    this.domElement.appendChild(this._fabIconEl);

    const onFabClick = () => {
      if (this._state === SheetState.FAB) {
        this._applyState(SheetState.HALF);
      }
    };
    this._fabIconEl.addEventListener('click', onFabClick);
    this._cleanupFns.push(() =>
      this._fabIconEl.removeEventListener('click', onFabClick),
    );
  }

  /** ハンドルバーを構築する */
  _buildHandle() {
    this._handleEl.classList.add('sgs-handle');
    const bar = document.createElement('div');
    bar.classList.add('sgs-handle-bar');
    this._handleEl.appendChild(bar);
    this.domElement.appendChild(this._handleEl);
  }

  /**
   * タイトルバーを構築する
   * @param {string} title
   */
  _buildTitleBar(title) {
    const titleBar = document.createElement('div');
    titleBar.classList.add('sgs-title');

    const titleText = document.createElement('span');
    titleText.textContent = title;

    const minimizeBtn = document.createElement('button');
    minimizeBtn.classList.add('sgs-minimize-btn');
    minimizeBtn.textContent = '\u2212';
    minimizeBtn.title = 'FAB\u306B\u53CE\u7D0D';
    const onMinimize = () => this._applyState(SheetState.FAB);
    minimizeBtn.addEventListener('click', onMinimize);
    this._cleanupFns.push(() =>
      minimizeBtn.removeEventListener('click', onMinimize),
    );

    titleBar.appendChild(titleText);
    titleBar.appendChild(minimizeBtn);
    this.domElement.appendChild(titleBar);
  }

  /** ボディ（スクロール領域）を構築する */
  _buildBody() {
    this._bodyEl.classList.add('sgs-body');
    this._childrenEl.classList.add('sgs-children');
    this._bodyEl.appendChild(this._childrenEl);
    this.domElement.appendChild(this._bodyEl);
  }

  /**
   * フォルダ（子パネル）を構築する
   * @param {string} title
   * @param {HTMLElement} parentEl
   */
  _buildFolder(title, parentEl) {
    this.domElement = document.createElement('div');

    const folderTitle = document.createElement('div');
    folderTitle.classList.add('sgs-folder-title');

    const folderText = document.createElement('span');
    folderText.textContent = title;

    const toggle = document.createElement('span');
    toggle.classList.add('sgs-folder-toggle');
    toggle.textContent = '\u25BC';

    folderTitle.appendChild(folderText);
    folderTitle.appendChild(toggle);

    this._childrenEl.classList.add('sgs-folder-children');

    folderTitle.addEventListener('click', () => {
      const hidden = this._childrenEl.classList.toggle('sgs-hidden');
      toggle.classList.toggle('sgs-collapsed', hidden);
    });

    this.domElement.appendChild(folderTitle);
    this.domElement.appendChild(this._childrenEl);
    parentEl.appendChild(this.domElement);
  }

  /**
   * シートの状態を適用する
   * @param {typeof SheetState[keyof typeof SheetState]} state
   */
  _applyState(state) {
    this._state = state;
    const el = this.domElement;
    el.classList.remove(
      'sgs-state-collapsed',
      'sgs-state-half',
      'sgs-state-full',
      'sgs-state-fab',
    );
    el.classList.add(`sgs-state-${state}`);

    if (state === SheetState.FAB) {
      el.style.removeProperty('transform');
    }
  }

  /** ハンドルバーのタップで展開状態を切り替える */
  _setupHandleTap() {
    const onClick = () => {
      if (this._dragMoved) {
        return;
      }
      if (this._state === SheetState.COLLAPSED) {
        this._applyState(SheetState.HALF);
      } else if (this._state === SheetState.HALF) {
        this._applyState(SheetState.FULL);
      } else if (this._state === SheetState.FULL) {
        this._applyState(SheetState.COLLAPSED);
      }
    };
    this._handleEl.addEventListener('click', onClick);
    this._cleanupFns.push(() =>
      this._handleEl.removeEventListener('click', onClick),
    );
  }

  /** ドラッグ＆四隅スナップを設定する */
  _setupDrag() {
    /** @type {(e: PointerEvent) => void} */
    const onDown = (e) => {
      if (!this._handleEl.contains(/** @type {Node} */ (e.target))) {
        return;
      }
      this._isDragging = true;
      this._dragMoved = false;
      const rect = this.domElement.getBoundingClientRect();
      this._dragStartX = e.clientX;
      this._dragStartY = e.clientY;
      this._dragOffsetX = e.clientX - rect.left;
      this._dragOffsetY = e.clientY - rect.top;
      this.domElement.classList.add('sgs-dragging');
      this._handleEl.setPointerCapture(e.pointerId);
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
      this.domElement.style.left = `${e.clientX - this._dragOffsetX}px`;
      this.domElement.style.top = `${e.clientY - this._dragOffsetY}px`;
      this.domElement.style.right = 'auto';
      this.domElement.style.bottom = 'auto';
    };

    /** @type {() => void} */
    const onUp = () => {
      if (!this._isDragging) {
        return;
      }
      this._isDragging = false;
      this.domElement.classList.remove('sgs-dragging');
      if (!this._dragMoved) {
        this._clearInlinePosition();
        return;
      }
      this._snapToNearestCorner();
    };

    this._handleEl.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    this._cleanupFns.push(() => {
      this._handleEl.removeEventListener('pointerdown', onDown);
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
      'sgs-bottom-right',
      'sgs-bottom-left',
      'sgs-top-right',
      'sgs-top-left',
    );
    this._clearInlinePosition();
    this.domElement.classList.add(`sgs-${corner}`);
    this._applyState(this._state);
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
   * @returns {SimpleGuiSheet}
   */
  addFolder(title) {
    const folder = new SimpleGuiSheet({ title, parent: this._childrenEl });
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

    // 他のインスタンスがなければスタイルも除去
    if (document.querySelectorAll('.sgs-sheet').length === 0) {
      removeStyles();
    }
  }
}

export default SimpleGuiSheet;
