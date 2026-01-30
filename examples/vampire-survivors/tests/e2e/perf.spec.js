import { test, expect, startPlaying } from '../fixtures/game-test.js';

test.describe('Vampire Survivors — Performance', () => {
  test('loads within 10 seconds', async ({ page }) => {
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });
    expect(loadTime).toBeLessThan(10000);
  });

  test('maintains FPS above 5 (headless threshold)', async ({ page }) => {
    await startPlaying(page);
    // Let the game run with enemies for a bit
    await page.waitForTimeout(3000);
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
    expect(fps).toBeGreaterThan(5);
  });

  test('canvas exists and has correct aspect ratio', async ({ page }) => {
    const size = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return {
        width: canvas.width,
        height: canvas.height,
      };
    });
    // Canvas should exist with non-zero dimensions
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
    // Aspect ratio should be 4:3 (800x600)
    expect(size.width / size.height).toBeCloseTo(800 / 600, 1);
  });
});
