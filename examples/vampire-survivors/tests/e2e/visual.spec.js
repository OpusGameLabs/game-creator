import { test, expect, startPlaying } from '../fixtures/game-test.js';

test.describe('Vampire Survivors — Visual Regression', () => {
  test('menu scene screenshot', async ({ page }) => {
    // Wait for menu particles to settle
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('menu-scene.png', {
      maxDiffPixels: 3000,
    });
  });

  test('game over scene screenshot', async ({ page }) => {
    await startPlaying(page);
    // Force game over
    await page.evaluate(() => {
      const gs = window.__GAME_STATE__;
      gs.hp = 0;
      gs.gameOver = true;
      gs.elapsedTime = 42;
      gs.kills = 10;
      gs.level = 3;
      window.__EVENT_BUS__.emit(window.__EVENTS__.GAME_OVER, { score: 10, kills: 10, time: 42 });
    });
    // Wait for scene transition
    await page.waitForTimeout(2000);
    // Navigate to game over via scene manager
    await page.evaluate(() => {
      const game = window.__GAME__;
      game.scene.stop('GameScene');
      game.scene.stop('UIScene');
      game.scene.start('GameOverScene');
    });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('game-over-scene.png', {
      maxDiffPixels: 3000,
    });
  });
});
