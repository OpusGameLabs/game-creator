import { test, expect } from '../fixtures/game-test.js';

test.describe('Flappy Bird 3D — Visual Regression', () => {
  test('menu scene screenshot', async ({ gamePage }) => {
    // Wait for render to settle
    await gamePage.waitForTimeout(500);
    await expect(gamePage).toHaveScreenshot('menu-scene.png');
  });

  test('game over scene screenshot', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Force game over
    await gamePage.evaluate(() => {
      window.__GAME__.gameOver();
    });
    await gamePage.waitForFunction(() => window.__GAME_STATE__.gameOver, null, { timeout: 5000 });

    // Wait for death delay + overlay
    await gamePage.waitForTimeout(1500);

    await expect(gamePage).toHaveScreenshot('game-over-scene.png');
  });
});
