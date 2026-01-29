import { test, expect } from '../fixtures/game-test.js';

test.describe('Flight Simulator — Visual Regression', () => {
  test('menu scene renders correctly', async ({ gamePage }) => {
    // Wait for scene to settle (sky dome, clouds, etc.)
    await gamePage.waitForTimeout(800);

    await expect(gamePage).toHaveScreenshot('menu-scene.png', {
      maxDiffPixels: 3000,
    });
  });

  test('game over scene renders correctly', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Dive to crash
    await gamePage.keyboard.down('w');
    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver,
      null,
      { timeout: 15000 }
    );
    await gamePage.keyboard.up('w');

    // Wait for crash delay + overlay fade in
    await gamePage.waitForTimeout(1500);

    await expect(gamePage).toHaveScreenshot('gameover-scene.png', {
      maxDiffPixels: 3000,
    });
  });
});
