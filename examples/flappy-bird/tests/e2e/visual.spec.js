import { test, expect, startPlaying } from '../fixtures/game-test.js';

test.describe('Visual Regression', () => {
  test('menu scene renders correctly', async ({ gamePage }) => {
    // Wait for fade-in and initial render to settle
    await gamePage.waitForTimeout(600);
    // Higher tolerance because scrolling clouds shift between captures
    await expect(gamePage.locator('canvas')).toHaveScreenshot('menu-scene.png', {
      maxDiffPixels: 3000,
    });
  });

  // Note: active gameplay screenshots are skipped because moving pipes,
  // scrolling clouds, and bird animation make the canvas inherently unstable.
  // Use the Playwright MCP for visual inspection of live gameplay instead.

  test('game over scene renders correctly', async ({ gamePage }) => {
    await startPlaying(gamePage);

    // Let bird die
    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver === true,
      null,
      { timeout: 10000 }
    );

    // Wait for GameOverScene to fully render
    await gamePage.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes.some(s => s.scene.key === 'GameOverScene');
    }, null, { timeout: 15000 });
    await gamePage.waitForTimeout(1000);

    // Higher tolerance for scrolling clouds
    await expect(gamePage.locator('canvas')).toHaveScreenshot('game-over-scene.png', {
      maxDiffPixels: 3000,
    });
  });
});
