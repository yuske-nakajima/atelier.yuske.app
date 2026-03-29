// @ts-check

/**
 * SimpleGuiSheet 用スタイル注入モジュール
 */

const STYLE_ID = 'simple-gui-sheet-style';

/**
 * スタイルを注入する（一度だけ）
 */
export function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      --sgs-bg: rgba(255, 255, 255, 0.72);
      --sgs-bg-hover: rgba(240, 240, 245, 0.85);
      --sgs-border: rgba(200, 200, 210, 0.5);
      --sgs-text: #1c1c1e;
      --sgs-text-dim: #8e8e93;
      --sgs-accent: #007AFF;
      --sgs-accent-hover: #0066d6;
      --sgs-input-bg: rgba(240, 240, 245, 0.8);
      --sgs-folder-bg: rgba(245, 245, 250, 0.6);
      --sgs-radius: 0.75rem;
      --sgs-font-size: 0.8125rem;
      --sgs-row-height: 2.25rem;
      --sgs-padding: 0.75rem;
      --sgs-width: 20rem;
      --sgs-handle-height: 1.75rem;
      --sgs-shadow: 0 -0.25rem 1.5rem rgba(0, 0, 0, 0.12);
      --sgs-fab-size: 3rem;
      --sgs-transition: 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    }

    .sgs-sheet {
      position: fixed;
      width: var(--sgs-width);
      max-width: 90%;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: var(--sgs-font-size);
      color: var(--sgs-text);
      background: var(--sgs-bg);
      backdrop-filter: blur(1.5rem) saturate(180%);
      -webkit-backdrop-filter: blur(1.5rem) saturate(180%);
      border: 0.0625rem solid var(--sgs-border);
      border-radius: var(--sgs-radius) var(--sgs-radius) 0 0;
      z-index: 10000;
      user-select: none;
      box-shadow: var(--sgs-shadow);
      transition:
        transform var(--sgs-transition),
        left var(--sgs-transition),
        bottom var(--sgs-transition),
        top var(--sgs-transition),
        right var(--sgs-transition),
        width var(--sgs-transition),
        height var(--sgs-transition),
        border-radius var(--sgs-transition),
        opacity var(--sgs-transition);
      overflow: hidden;
    }

    .sgs-sheet.sgs-dragging {
      transition: none;
    }

    .sgs-sheet.sgs-bottom-right {
      bottom: 0;
      right: 1rem;
    }

    .sgs-sheet.sgs-bottom-left {
      bottom: 0;
      left: 1rem;
    }

    .sgs-sheet.sgs-top-right {
      top: 0;
      right: 1rem;
      border-radius: 0 0 var(--sgs-radius) var(--sgs-radius);
    }

    .sgs-sheet.sgs-top-left {
      top: 0;
      left: 1rem;
      border-radius: 0 0 var(--sgs-radius) var(--sgs-radius);
    }

    .sgs-sheet.sgs-state-collapsed {
      transform: translateY(calc(100% - var(--sgs-handle-height)));
    }

    .sgs-sheet.sgs-top-right.sgs-state-collapsed,
    .sgs-sheet.sgs-top-left.sgs-state-collapsed {
      transform: translateY(calc(-100% + var(--sgs-handle-height)));
    }

    .sgs-sheet.sgs-state-half {
      height: 40vh;
      transform: translateY(0);
    }

    .sgs-sheet.sgs-state-full {
      height: 80vh;
      transform: translateY(0);
    }

    .sgs-sheet.sgs-state-fab {
      width: var(--sgs-fab-size);
      height: var(--sgs-fab-size);
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 0.125rem 0.75rem rgba(0, 0, 0, 0.2);
    }

    .sgs-sheet.sgs-state-fab.sgs-bottom-right {
      bottom: 1rem;
      right: 1rem;
    }

    .sgs-sheet.sgs-state-fab.sgs-bottom-left {
      bottom: 1rem;
      left: 1rem;
    }

    .sgs-sheet.sgs-state-fab.sgs-top-right {
      top: 1rem;
      right: 1rem;
    }

    .sgs-sheet.sgs-state-fab.sgs-top-left {
      top: 1rem;
      left: 1rem;
    }

    .sgs-fab-icon {
      display: none;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
      background: var(--sgs-accent);
      color: #fff;
      font-size: 1.25rem;
      line-height: 1;
    }

    .sgs-state-fab .sgs-fab-icon {
      display: flex;
    }

    .sgs-state-fab .sgs-handle,
    .sgs-state-fab .sgs-title,
    .sgs-state-fab .sgs-body {
      display: none;
    }

    .sgs-handle {
      display: flex;
      align-items: center;
      justify-content: center;
      height: var(--sgs-handle-height);
      cursor: grab;
      touch-action: none;
    }

    .sgs-handle:active {
      cursor: grabbing;
    }

    .sgs-handle-bar {
      width: 2.25rem;
      height: 0.25rem;
      border-radius: 0.125rem;
      background: rgba(150, 150, 160, 0.5);
    }

    .sgs-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--sgs-padding) 0.375rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--sgs-text);
    }

    .sgs-minimize-btn {
      background: none;
      border: none;
      color: var(--sgs-accent);
      font-size: 1rem;
      cursor: pointer;
      padding: 0.125rem 0.25rem;
      line-height: 1;
      border-radius: 0.25rem;
    }

    .sgs-minimize-btn:hover {
      background: var(--sgs-bg-hover);
    }

    .sgs-body {
      overflow-y: auto;
      flex: 1;
    }

    .sgs-children {
      overflow: hidden;
    }

    .sgs-children.sgs-hidden {
      display: none;
    }

    .sgs-row {
      display: flex;
      align-items: center;
      padding: 0.25rem var(--sgs-padding);
      min-height: var(--sgs-row-height);
      border-bottom: 0.0625rem solid var(--sgs-border);
    }

    .sgs-row:hover {
      background: var(--sgs-bg-hover);
    }

    .sgs-label {
      flex: 0 0 40%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--sgs-text-dim);
    }

    .sgs-control {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .sgs-control input[type="range"] {
      flex: 1;
      height: 0.25rem;
      accent-color: var(--sgs-accent);
      cursor: pointer;
    }

    .sgs-control input[type="number"] {
      width: 3.75rem;
      background: var(--sgs-input-bg);
      border: 0.0625rem solid var(--sgs-border);
      border-radius: 0.375rem;
      color: var(--sgs-text);
      font-size: var(--sgs-font-size);
      padding: 0.25rem 0.375rem;
      text-align: right;
    }

    .sgs-control input[type="number"]:focus {
      outline: 0.125rem solid var(--sgs-accent);
      outline-offset: -0.0625rem;
    }

    .sgs-control input[type="checkbox"] {
      accent-color: var(--sgs-accent);
      cursor: pointer;
      width: 1rem;
      height: 1rem;
    }

    .sgs-control input[type="color"] {
      width: 100%;
      height: var(--sgs-row-height);
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
    }

    .sgs-control button {
      width: 100%;
      padding: 0.375rem 0.75rem;
      background: var(--sgs-accent);
      color: #fff;
      border: none;
      border-radius: 0.375rem;
      font-size: var(--sgs-font-size);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    }

    .sgs-control button:hover {
      background: var(--sgs-accent-hover);
    }

    .sgs-control button:active {
      transform: scale(0.98);
    }

    .sgs-folder-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.25rem var(--sgs-padding);
      min-height: var(--sgs-row-height);
      border-bottom: 0.0625rem solid var(--sgs-border);
      cursor: pointer;
      font-weight: 600;
      color: var(--sgs-accent);
    }

    .sgs-folder-title:hover {
      background: var(--sgs-bg-hover);
    }

    .sgs-folder-children {
      padding-left: 0.5rem;
      background: var(--sgs-folder-bg);
    }

    .sgs-folder-children.sgs-hidden {
      display: none;
    }

    .sgs-folder-toggle {
      transition: transform 0.2s;
      font-size: 0.625rem;
    }

    .sgs-folder-toggle.sgs-collapsed {
      transform: rotate(-90deg);
    }
  `;
  document.head.appendChild(style);
}

/**
 * スタイル要素を除去する
 */
export function removeStyles() {
  const styleEl = document.getElementById(STYLE_ID);
  if (styleEl) {
    styleEl.remove();
  }
}
