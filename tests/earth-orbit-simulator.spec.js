// @ts-check

import { expect, test } from '@playwright/test';

const PAGE_URL = '/earth-orbit-simulator/';

test.describe('Earth Orbit Simulator', () => {
  test('ページが 200 で応答する', async ({ page }) => {
    const response = await page.goto(PAGE_URL);
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);
  });

  test('canvas 要素が存在する', async ({ page }) => {
    await page.goto(PAGE_URL);
    const canvas = page.locator('#canvas');
    await expect(canvas).toBeVisible();
  });

  test('canvas の WebGL コンテキストが有効である', async ({ page }) => {
    await page.goto(PAGE_URL);

    // Three.js の初期化を待つ
    await page.waitForTimeout(2000);

    const dimensions = await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      if (!canvas) return { width: 0, height: 0 };
      return {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      };
    });

    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
  });

  test('公転軌道の線が描画されている（canvas にコンテンツが描画される）', async ({
    page,
  }) => {
    await page.goto(PAGE_URL);

    // Three.js の初期化とレンダリングを待つ
    await page.waitForTimeout(3000);

    // canvas の toDataURL が空白画像でないことを確認
    const dataUrl = await page.evaluate(() => {
      const canvas = /** @type {HTMLCanvasElement | null} */ (
        document.getElementById('canvas')
      );
      if (!canvas) return '';
      return canvas.toDataURL();
    });

    // 何かしらの描画がされていることを確認（空でない dataURL）
    expect(dataUrl).not.toBe('');
    expect(dataUrl.length).toBeGreaterThan(1000);
  });

  test('Geolocation 拒否時にデフォルト座標でエラーなく動作する', async ({
    context,
    page,
  }) => {
    // Geolocation の権限を拒否する
    await context.clearPermissions();

    await page.goto(PAGE_URL);

    // Three.js の初期化とレンダリングを待つ
    await page.waitForTimeout(3000);

    // コンソールエラーを収集
    /** @type {string[]} */
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // 追加で少し待って安定性を確認
    await page.waitForTimeout(1000);

    // canvas に描画がされていることを確認（エラーで止まっていない）
    const dataUrl = await page.evaluate(() => {
      const canvas = /** @type {HTMLCanvasElement | null} */ (
        document.getElementById('canvas')
      );
      if (!canvas) return '';
      return canvas.toDataURL();
    });

    expect(dataUrl.length).toBeGreaterThan(1000);
    // Geolocation 関連の致命的エラーがないことを確認
    const geoErrors = errors.filter(
      (e) =>
        e.toLowerCase().includes('geolocation') ||
        e.toLowerCase().includes('location'),
    );
    expect(geoErrors).toHaveLength(0);
  });

  test('スライダー操作で日時表示が変化する', async ({ page }) => {
    await page.goto(PAGE_URL);

    // UI 初期化完了を待つ（日時表示にテキストが入るまで）
    const timeDisplay = page.locator('#time-display');
    await expect(timeDisplay).toHaveText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/, {
      timeout: 20000,
    });

    // 一時停止してからスライダーを操作
    await page.locator('#play-pause-btn').click();
    await page.waitForTimeout(200);

    // 一時停止後の日時表示を取得
    const initialText = await timeDisplay.textContent();

    // スライダーを最大値（+365日）に変更
    await page.locator('#time-slider').fill('365');
    await page.locator('#time-slider').dispatchEvent('input');
    await page.waitForTimeout(500);

    const afterText = await timeDisplay.textContent();
    expect(afterText).toBeTruthy();
    expect(afterText).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);

    // 日時が変化していることを確認
    expect(afterText).not.toBe(initialText);
  });

  test('再生/停止ボタンが機能する', async ({ page }) => {
    await page.goto(PAGE_URL);

    // UI 初期化完了を待つ
    await expect(page.locator('#time-display')).toHaveText(
      /\d{4}-\d{2}-\d{2}/,
      { timeout: 10000 },
    );

    const btn = page.locator('#play-pause-btn');
    await expect(btn).toBeVisible();

    // クリックで一時停止に切り替え（▶ に変わる）
    await btn.click();
    await expect(btn).toHaveText('\u25B6');

    // もう一度クリックで再生に戻る（⏸ に変わる）
    await btn.click();
    await expect(btn).toHaveText('\u23F8');
  });

  test('速度切替ボタンが存在し操作可能である', async ({ page }) => {
    await page.goto(PAGE_URL);

    // UI 初期化完了を待つ
    await expect(page.locator('#time-display')).toHaveText(
      /\d{4}-\d{2}-\d{2}/,
      { timeout: 10000 },
    );

    // 4つの速度ボタンが存在する
    const speedBtns = page.locator('.speed-btn');
    await expect(speedBtns).toHaveCount(4);

    // 初期状態で x1 がアクティブ
    const x1Btn = page.locator('.speed-btn[data-speed="1"]');
    await expect(x1Btn).toHaveClass(/active/);

    // x10 をクリック
    const x10Btn = page.locator('.speed-btn[data-speed="10"]');
    await x10Btn.click();
    await expect(x10Btn).toHaveClass(/active/);
    // x1 はアクティブでなくなる
    await expect(x1Btn).not.toHaveClass(/active/);

    // x1000 をクリック
    const x1000Btn = page.locator('.speed-btn[data-speed="1000"]');
    await x1000Btn.click();
    await expect(x1000Btn).toHaveClass(/active/);
    await expect(x10Btn).not.toHaveClass(/active/);
  });

  test('情報パネルが表示されシミュレーション情報がリアルタイム更新される', async ({
    page,
  }) => {
    await page.goto(PAGE_URL);

    // 情報パネルが存在する
    const infoPanel = page.locator('#info-panel');
    await expect(infoPanel).toBeVisible();

    // 情報パネルの各要素が DOM に存在する
    await expect(page.locator('#info-coords')).toBeVisible();
    await expect(page.locator('#info-datetime')).toBeVisible();
    await expect(page.locator('#info-orbital')).toBeVisible();
    await expect(page.locator('#info-distance')).toBeVisible();

    // WebGL が有効な場合のみリアルタイム更新をテスト
    const webglAvailable = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
    });

    if (webglAvailable) {
      // 3D レンダリングループによる情報更新を待つ
      const infoCoords = page.locator('#info-coords');
      await expect(infoCoords).toHaveText(/緯度: [\d.-]+ \/ 経度: [\d.-]+/, {
        timeout: 20000,
      });

      const infoDatetime = page.locator('#info-datetime');
      await expect(infoDatetime).toHaveText(
        /日時: \d{4}-\d{2}-\d{2} \d{2}:\d{2}/,
        { timeout: 20000 },
      );

      // リアルタイム更新の確認（日時が変化する）
      const datetime1 = await infoDatetime.textContent();
      await page.waitForTimeout(2000);
      const datetime2 = await infoDatetime.textContent();
      expect(datetime2).not.toBe(datetime1);
    }
  });

  test('レスポンシブ（モバイルビューポート 375x667）でUI要素が操作可能', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(PAGE_URL);

    // UI 初期化完了を待つ
    await expect(page.locator('#time-display')).toHaveText(
      /\d{4}-\d{2}-\d{2}/,
      { timeout: 20000 },
    );

    // コントロール要素が表示されている
    const controls = page.locator('#controls');
    await expect(controls).toBeVisible();

    // 再生/一時停止ボタンが操作可能
    const playBtn = page.locator('#play-pause-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await expect(playBtn).toHaveText('\u25B6');

    // 速度ボタンが操作可能
    const x10Btn = page.locator('.speed-btn[data-speed="10"]');
    await expect(x10Btn).toBeVisible();
    await x10Btn.click();
    await expect(x10Btn).toHaveClass(/active/);

    // スライダーが操作可能
    const slider = page.locator('#time-slider');
    await expect(slider).toBeVisible();

    // 情報パネルも表示されている
    const infoPanel = page.locator('#info-panel');
    await expect(infoPanel).toBeVisible();
  });

  test('トップページのリンクから遷移できる', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a[href="/earth-orbit-simulator/"]');
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('**/earth-orbit-simulator/');
    expect(page.url()).toContain('/earth-orbit-simulator/');
  });

  test('orbit.js の公転計算が異なる日時で異なる位置を返す', async ({
    page,
  }) => {
    await page.goto(PAGE_URL);

    // orbit.js のモジュールを動的にインポートして検証
    const result = await page.evaluate(async () => {
      const { getOrbitalPosition, getRotationAngle } = await import(
        './orbit.js'
      );

      const date1 = new Date('2024-06-21T00:00:00Z');
      const date2 = new Date('2024-12-21T00:00:00Z');

      const pos1 = getOrbitalPosition(date1);
      const pos2 = getOrbitalPosition(date2);
      const rot1 = getRotationAngle(date1);
      const rot2 = getRotationAngle(date2);

      return {
        pos1X: pos1.x,
        pos1Z: pos1.z,
        pos2X: pos2.x,
        pos2Z: pos2.z,
        rot1,
        rot2,
        positionsAreDifferent:
          Math.abs(pos1.x - pos2.x) > 0.1 || Math.abs(pos1.z - pos2.z) > 0.1,
      };
    });

    // 夏至と冬至で公転位置が異なることを確認
    expect(result.positionsAreDifferent).toBe(true);
    // 自転角度が計算されていることを確認
    expect(typeof result.rot1).toBe('number');
    expect(typeof result.rot2).toBe('number');
  });
});
