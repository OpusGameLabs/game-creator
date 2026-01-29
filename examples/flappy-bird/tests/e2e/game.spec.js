import { test, expect, startPlaying } from '../fixtures/game-test.js';

test.describe('Game Boot & Scene Flow', () => {
  test('game boots and shows menu scene', async ({ gamePage }) => {
    const sceneKey = await gamePage.evaluate(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes[0]?.scene?.key;
    });
    expect(sceneKey).toBe('MenuScene');
  });

  test('canvas is visible', async ({ gamePage }) => {
    const canvas = gamePage.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('menu transitions to game scene on space', async ({ gamePage }) => {
    // First press: init audio (browser autoplay policy)
    await gamePage.keyboard.press('Space');
    await gamePage.waitForTimeout(200);
    // Second press: start game
    await gamePage.keyboard.press('Space');

    await gamePage.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes.some(s => s.scene.key === 'GameScene');
    }, null, { timeout: 5000 });

    const activeScenes = await gamePage.evaluate(() => {
      return window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    });
    expect(activeScenes).toContain('GameScene');
  });

  test('menu transitions to game scene on click', async ({ gamePage }) => {
    const canvas = gamePage.locator('canvas');
    // First click: init audio (browser autoplay policy)
    await canvas.click({ position: { x: 200, y: 300 } });
    await gamePage.waitForTimeout(200);
    // Second click: start game
    await canvas.click({ position: { x: 200, y: 300 } });

    await gamePage.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes.some(s => s.scene.key === 'GameScene');
    }, null, { timeout: 5000 });

    const activeScenes = await gamePage.evaluate(() => {
      return window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    });
    expect(activeScenes).toContain('GameScene');
  });
});

test.describe('Gameplay', () => {
  test('game starts on input', async ({ gamePage }) => {
    await startPlaying(gamePage);

    const started = await gamePage.evaluate(() => window.__GAME_STATE__.started);
    expect(started).toBe(true);
  });

  test('bird flaps on space (moves upward)', async ({ gamePage }) => {
    await startPlaying(gamePage);
    await gamePage.waitForTimeout(300);

    // Get bird Y before flap
    const yBefore = await gamePage.evaluate(() => {
      return window.__GAME__.scene.getScene('GameScene').bird.y;
    });

    // Flap
    await gamePage.keyboard.press('Space');
    await gamePage.waitForTimeout(150);

    // Bird should move up (lower y value)
    const yAfter = await gamePage.evaluate(() => {
      return window.__GAME__.scene.getScene('GameScene').bird.y;
    });
    expect(yAfter).toBeLessThan(yBefore);
  });

  test('game over when bird hits ground', async ({ gamePage }) => {
    await startPlaying(gamePage);

    // Don't flap — let bird fall
    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver === true,
      null,
      { timeout: 10000 }
    );

    expect(await gamePage.evaluate(() => window.__GAME_STATE__.gameOver)).toBe(true);
  });

  test('game over transitions to GameOverScene', async ({ gamePage }) => {
    await startPlaying(gamePage);

    // Let bird die (may take a while in headless)
    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver === true,
      null,
      { timeout: 15000 }
    );

    // Wait for scene transition (death slow-mo + 800ms delay + fade)
    await gamePage.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes.some(s => s.scene.key === 'GameOverScene');
    }, null, { timeout: 15000 });

    const activeScenes = await gamePage.evaluate(() => {
      return window.__GAME__.scene.getScenes(true).map(s => s.scene.key);
    });
    expect(activeScenes).toContain('GameOverScene');
  });

  test('score starts at 0', async ({ gamePage }) => {
    await startPlaying(gamePage);

    const score = await gamePage.evaluate(() => window.__GAME_STATE__.score);
    expect(score).toBe(0);
  });
});

test.describe('Restart Flow', () => {
  test('can restart from game over with space', async ({ gamePage }) => {
    await startPlaying(gamePage);

    // Let bird die
    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver === true,
      null,
      { timeout: 10000 }
    );

    // Wait for GameOverScene (death slow-mo + 800ms delay + fade transition)
    await gamePage.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes.some(s => s.scene.key === 'GameOverScene');
    }, null, { timeout: 15000 });

    // Allow fade-in to complete
    await gamePage.waitForTimeout(800);

    // Press space to restart
    await gamePage.keyboard.press('Space');

    // Should go back to GameScene
    await gamePage.waitForFunction(() => {
      const scenes = window.__GAME__.scene.getScenes(true);
      return scenes.some(s => s.scene.key === 'GameScene');
    }, null, { timeout: 5000 });

    // State should be reset
    const gameOver = await gamePage.evaluate(() => window.__GAME_STATE__.gameOver);
    expect(gameOver).toBe(false);
  });
});
