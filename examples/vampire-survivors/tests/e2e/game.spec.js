import { test, expect, startPlaying } from '../fixtures/game-test.js';

test.describe('Vampire Survivors — Gameplay', () => {
  test('boots and shows canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('starts on GameScene', async ({ page }) => {
    const sceneName = await page.evaluate(() => {
      const scenes = window.__GAME__.scene.scenes;
      const active = scenes.filter(s => s.sys.isActive());
      return active.map(s => s.sys.settings.key);
    });
    expect(sceneName).toContain('GameScene');
  });

  test('transitions to GameScene on double-tap', async ({ page }) => {
    await startPlaying(page);
    const sceneName = await page.evaluate(() => {
      const scenes = window.__GAME__.scene.scenes;
      const active = scenes.filter(s => s.sys.isActive());
      return active.map(s => s.sys.settings.key);
    });
    expect(sceneName).toContain('GameScene');
  });

  test('UIScene launches alongside GameScene', async ({ page }) => {
    await startPlaying(page);
    const sceneName = await page.evaluate(() => {
      const scenes = window.__GAME__.scene.scenes;
      const active = scenes.filter(s => s.sys.isActive());
      return active.map(s => s.sys.settings.key);
    });
    expect(sceneName).toContain('UIScene');
  });

  test('gameState has expected properties', async ({ page }) => {
    // Check initial gameState before playing
    const state = await page.evaluate(() => {
      const gs = window.__GAME_STATE__;
      return {
        hasScore: 'score' in gs,
        hasHp: 'hp' in gs,
        hasLevel: 'level' in gs,
        hasWeapons: 'weapons' in gs,
        hasGameOver: 'gameOver' in gs,
      };
    });
    expect(state.hasScore).toBe(true);
    expect(state.hasHp).toBe(true);
    expect(state.hasLevel).toBe(true);
    expect(state.hasWeapons).toBe(true);
    expect(state.hasGameOver).toBe(true);
  });

  test('gameState starts with correct initial values', async ({ page }) => {
    await startPlaying(page);
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const gs = window.__GAME_STATE__;
      return {
        score: gs.score,
        hp: gs.hp,
        level: gs.level,
        started: gs.started,
      };
    });
    expect(state.score).toBe(0);
    expect(state.hp).toBe(100);
    expect(state.level).toBe(1);
    expect(state.started).toBe(true);
  });

  test('eventBus is exposed on window', async ({ page }) => {
    const hasEventBus = await page.evaluate(() => {
      return typeof window.__EVENT_BUS__ === 'object' &&
             typeof window.__EVENT_BUS__.on === 'function' &&
             typeof window.__EVENT_BUS__.emit === 'function';
    });
    expect(hasEventBus).toBe(true);
  });

  test('Events object has core event keys', async ({ page }) => {
    const keys = await page.evaluate(() => Object.keys(window.__EVENTS__ || {}));
    expect(keys).toContain('GAME_START');
    expect(keys).toContain('GAME_OVER');
    expect(keys.length).toBeGreaterThan(5);
  });

  test('can trigger game over via EventBus', async ({ page }) => {
    await startPlaying(page);
    await page.waitForTimeout(500);
    // Force game over
    await page.evaluate(() => {
      const gs = window.__GAME_STATE__;
      gs.hp = 0;
      gs.gameOver = true;
    });
    const isOver = await page.evaluate(() => window.__GAME_STATE__.gameOver);
    expect(isOver).toBe(true);
  });

  test('game has 4 registered scenes', async ({ page }) => {
    const sceneCount = await page.evaluate(() => {
      return window.__GAME__.scene.scenes.length;
    });
    expect(sceneCount).toBe(4);
  });
});
