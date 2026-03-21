// @ts-check

/**
 * 軌跡マップオーバーレイ
 * ボタン押下で全画面に通過タイルの◯を2Dマップとして表示
 */

/**
 * 軌跡マップを初期化
 * @param {Set<string>} visited - "row,col" 形式の通過済みタイルセット
 * @param {{ lat: number, lng: number }} position - 現在位置への参照
 */
export function setupTrailMap(visited, position) {
  // オーバーレイ canvas を作成
  const overlay = document.createElement('canvas');
  overlay.id = 'trail-map';
  overlay.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 50',
    'width: 100dvw',
    'height: 100dvh',
    'cursor: pointer',
    'display: none',
  ].join(';');
  document.body.appendChild(overlay);

  // ボタンを作成
  const btn = document.createElement('button');
  btn.textContent = '🗺';
  btn.type = 'button';
  btn.ariaLabel = '軌跡マップを表示';
  btn.style.cssText = [
    'position: fixed',
    'bottom: 1rem',
    'right: 1rem',
    'z-index: 30',
    'width: 2.5rem',
    'height: 2.5rem',
    'border: none',
    'border-radius: 50%',
    'background: rgba(255, 255, 255, 0.15)',
    'color: white',
    'font-size: 1.2rem',
    'cursor: pointer',
    'backdrop-filter: blur(0.25rem)',
    'transition: background 0.2s',
  ].join(';');
  document.body.appendChild(btn);

  let visible = false;
  let rafId = 0;

  /** リアルタイム更新ループ */
  function loop() {
    draw();
    rafId = requestAnimationFrame(loop);
  }

  /** オーバーレイの表示を切り替え */
  function toggle() {
    visible = !visible;
    overlay.style.display = visible ? 'block' : 'none';
    if (visible) {
      loop();
    } else {
      cancelAnimationFrame(rafId);
    }
  }

  /** 軌跡マップを描画 */
  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    overlay.width = w;
    overlay.height = h;

    const ctx = /** @type {CanvasRenderingContext2D} */ (
      overlay.getContext('2d')
    );

    // 背景（半透明ダーク）
    ctx.fillStyle = 'rgba(10, 10, 20, 0.92)';
    ctx.fillRect(0, 0, w, h);

    if (visited.size === 0) return;

    // 通過タイルの範囲を計算
    let minRow = Number.POSITIVE_INFINITY;
    let maxRow = Number.NEGATIVE_INFINITY;
    let minCol = Number.POSITIVE_INFINITY;
    let maxCol = Number.NEGATIVE_INFINITY;

    for (const key of visited) {
      const [r, c] = key.split(',').map(Number);
      if (r < minRow) minRow = r;
      if (r > maxRow) maxRow = r;
      if (c < minCol) minCol = c;
      if (c > maxCol) maxCol = c;
    }

    // マージンを追加
    const margin = 3;
    minRow -= margin;
    maxRow += margin;
    minCol -= margin;
    maxCol += margin;

    const rangeRow = maxRow - minRow + 1;
    const rangeCol = maxCol - minCol + 1;

    // 画面に収まるようスケール計算（パディング付き）
    const pad = 60;
    const cellSize = Math.min(
      (w - pad * 2) / rangeCol,
      (h - pad * 2) / rangeRow,
    );
    const offsetX = (w - rangeCol * cellSize) / 2;
    const offsetY = (h - rangeRow * cellSize) / 2;

    // ◯を描画
    ctx.font = `${cellSize * 0.85}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

    for (const key of visited) {
      const [r, c] = key.split(',').map(Number);
      const x = offsetX + (c - minCol) * cellSize + cellSize / 2;
      // 行は上が北（大きい lat）なので反転
      const y = offsetY + (maxRow - r) * cellSize + cellSize / 2;
      ctx.fillText('◯', x, y);
    }

    // 現在位置マーカー
    const curX =
      offsetX + (Math.floor(position.lng) - minCol) * cellSize + cellSize / 2;
    const curY =
      offsetY + (maxRow - Math.floor(position.lat)) * cellSize + cellSize / 2;
    ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
    ctx.beginPath();
    ctx.arc(curX, curY, cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  btn.addEventListener('click', toggle);
  overlay.addEventListener('click', toggle);
}
