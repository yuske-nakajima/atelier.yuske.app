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
});
