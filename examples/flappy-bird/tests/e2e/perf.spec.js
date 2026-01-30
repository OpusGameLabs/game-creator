import { expect } from '@playwright/test';
import { test, startPlaying } from '../fixtures/game-test.js';

test.describe('Flappy Bird — Performance', () => {
  test('game loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForFunction(() => {
      return window.__GAME__ && window.__GAME__.isBooted && window.__GAME__.canvas;
    }, { timeout: 5000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test('canvas has correct dimensions', async ({ gamePage: page }) => {
    const size = await page.evaluate(() => ({
      width: window.__GAME__.canvas.width,
      height: window.__GAME__.canvas.height,
    }));
    expect(size.width).toBe(400);
    expect(size.height).toBe(600);
  });

  test('maintains minimum FPS', async ({ gamePage: page }) => {
    await startPlaying(page);

    const fps = await page.evaluate(() => {
      return new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        function count() {
          frames++;
          if (performance.now() - start >= 1000) {
            resolve(frames);
          } else {
            requestAnimationFrame(count);
          }
        }
        requestAnimationFrame(count);
      });
    });

    // Headless Chromium reports low FPS (~7-9), threshold set to 5
    expect(fps).toBeGreaterThanOrEqual(5);
  });
});
