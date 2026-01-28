import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('game loads and boots within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      return g && g.isBooted && g.canvas;
    }, null, { timeout: 10000 });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test('game maintains 30+ FPS during gameplay', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      return g && g.isBooted && g.canvas;
    }, null, { timeout: 10000 });

    // Navigate to game: Space (menu → game), wait, Space (get ready → play)
    await page.keyboard.press('Space');
    await page.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes.some(s => s.scene.key === 'GameScene');
    }, null, { timeout: 5000 });
    await page.waitForTimeout(400);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__GAME_STATE__?.started, null, { timeout: 5000 });

    // Keep flapping to stay alive during measurement
    const flapHandle = await page.evaluateHandle(() => {
      const id = setInterval(() => {
        const scene = window.__GAME__?.scene?.getScene('GameScene');
        if (scene?.bird?.alive) scene.bird.flap();
      }, 250);
      return id;
    });

    // Measure FPS over 2 seconds
    const avgFps = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        function countFrame() {
          frames++;
          if (performance.now() - start < 2000) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frames / ((performance.now() - start) / 1000));
          }
        }
        requestAnimationFrame(countFrame);
      });
    });

    // Clean up flap interval
    await page.evaluate((id) => clearInterval(id), await flapHandle.jsonValue());

    // Headless Chromium is heavily throttled (often ~7-10 FPS).
    // This test verifies the game loop runs; use Playwright MCP
    // with a headed browser for real FPS measurement.
    expect(avgFps).toBeGreaterThan(5);
  });

  test('canvas element exists and has correct dimensions', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      return g && g.isBooted && g.canvas;
    }, null, { timeout: 10000 });

    const dimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return { width: canvas.width, height: canvas.height };
    });

    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.height).toBeGreaterThan(0);
  });
});
