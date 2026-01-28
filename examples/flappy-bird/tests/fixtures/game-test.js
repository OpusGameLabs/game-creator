import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // gamePage: boots game, lands on MenuScene
  gamePage: async ({ page }, use) => {
    await page.goto('/');
    // Wait for Phaser to boot and canvas to render
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      return g && g.isBooted && g.canvas;
    }, null, { timeout: 10000 });
    // Wait for MenuScene to be active
    await page.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes.some(s => s.scene.key === 'MenuScene');
    }, null, { timeout: 5000 });
    await page.waitForTimeout(400);
    await use(page);
  },
});

/**
 * Helper: navigate from MenuScene to active gameplay.
 * Press Space to leave menu (triggers fade), wait for GameScene,
 * then press Space again to dismiss "GET READY" and start playing.
 */
export async function startPlaying(page) {
  // Press Space to leave menu
  await page.keyboard.press('Space');

  // Wait for GameScene to be active (after fade transition)
  await page.waitForFunction(() => {
    const scenes = window.__GAME__.scene.getScenes(true);
    return scenes.some(s => s.scene.key === 'GameScene');
  }, null, { timeout: 5000 });
  await page.waitForTimeout(400);

  // Press Space again to dismiss GET READY and start playing
  await page.keyboard.press('Space');

  // Wait for started state
  await page.waitForFunction(
    () => window.__GAME_STATE__.started === true,
    null,
    { timeout: 5000 }
  );
}

export { expect };
