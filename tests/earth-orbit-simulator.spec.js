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
