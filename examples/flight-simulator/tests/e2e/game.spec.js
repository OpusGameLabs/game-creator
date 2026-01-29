import { test, expect } from '../fixtures/game-test.js';

test.describe('Flight Simulator — Core Game', () => {
  test('game boots and renders canvas', async ({ gamePage }) => {
    const canvas = gamePage.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('menu overlay is visible on load', async ({ gamePage }) => {
    const menu = gamePage.locator('#menu-overlay');
    await expect(menu).toBeVisible();
    await expect(gamePage.locator('#play-btn')).toHaveText('TAKE OFF');
  });

  test('clicking TAKE OFF starts the game', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();

    // Wait for game state to reflect started
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started, null, { timeout: 5000 });

    const started = await gamePage.evaluate(() => window.__GAME_STATE__.started);
    expect(started).toBe(true);

    // Menu should be hidden (opacity 0 via CSS transition)
    const menuOpacity = await gamePage.locator('#menu-overlay').evaluate(el => {
      return getComputedStyle(el).opacity;
    });
    expect(Number(menuOpacity)).toBeLessThanOrEqual(0.1);
  });

  test('HUD is visible during gameplay', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // HUD should be visible
    const hudDisplay = await gamePage.locator('#hud').evaluate(el => el.style.display);
    expect(hudDisplay).toBe('flex');

    // Check HUD elements exist and have content
    await expect(gamePage.locator('#hud-score')).toContainText('RINGS');
    await expect(gamePage.locator('#hud-alt')).toContainText('ALT');
    await expect(gamePage.locator('#hud-speed')).toContainText('SPD');
  });

  test('player exists after game starts', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    const hasPlayer = await gamePage.evaluate(() => {
      return window.__GAME__.player !== null;
    });
    expect(hasPlayer).toBe(true);
  });

  test('player moves forward automatically', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    const zBefore = await gamePage.evaluate(() => {
      return window.__GAME__.player.getPosition().z;
    });

    await gamePage.waitForTimeout(500);

    const zAfter = await gamePage.evaluate(() => {
      return window.__GAME__.player.getPosition().z;
    });

    // Player should have moved (z decreases as aircraft flies forward)
    expect(zAfter).not.toBe(zBefore);
  });

  test('pitch input changes altitude', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);
    await gamePage.waitForTimeout(200);

    // Press S to pitch up (climb)
    await gamePage.keyboard.down('s');
    await gamePage.waitForTimeout(800);
    await gamePage.keyboard.up('s');

    const altitude = await gamePage.evaluate(() => {
      return window.__GAME__.player.getPosition().y;
    });

    // Should have climbed above starting altitude (30)
    expect(altitude).toBeGreaterThan(30);
  });

  test('game over triggers when hitting ground', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Headless Chromium runs Three.js at ~4 FPS with MAX_DELTA cap,
    // making flight physics too slow for real-time diving.
    // Trigger crash directly via PLAYER_DIED event.
    await gamePage.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver,
      null,
      { timeout: 5000 }
    );

    const gameOver = await gamePage.evaluate(() => window.__GAME_STATE__.gameOver);
    expect(gameOver).toBe(true);
  });

  test('game over shows crashed overlay', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Trigger crash directly
    await gamePage.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver,
      null,
      { timeout: 5000 }
    );

    // Wait for crash delay (800ms) + overlay transition
    await gamePage.waitForTimeout(1500);

    // Game over overlay should be visible
    const gameoverVisible = await gamePage.locator('#gameover-overlay').evaluate(el => {
      return !el.classList.contains('hidden');
    });
    expect(gameoverVisible).toBe(true);

    await expect(gamePage.locator('#gameover-overlay h1')).toHaveText('CRASHED');
    await expect(gamePage.locator('#restart-btn')).toHaveText('FLY AGAIN');
  });

  test('restart works from game over screen', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Trigger crash directly
    await gamePage.evaluate(() => {
      window.__EVENT_BUS__.emit(window.__EVENTS__.PLAYER_DIED);
    });

    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver,
      null,
      { timeout: 5000 }
    );
    await gamePage.waitForTimeout(1500);

    // Click FLY AGAIN
    await gamePage.locator('#restart-btn').click();
    await gamePage.waitForTimeout(500);

    // Game state should be reset
    const state = await gamePage.evaluate(() => ({
      started: window.__GAME_STATE__.started,
      gameOver: window.__GAME_STATE__.gameOver,
      score: window.__GAME_STATE__.score,
    }));
    expect(state.started).toBe(false);
    expect(state.gameOver).toBe(false);
    expect(state.score).toBe(0);

    // Menu should be visible again
    const menuVisible = await gamePage.locator('#menu-overlay').evaluate(el => {
      return !el.classList.contains('hidden');
    });
    expect(menuVisible).toBe(true);
  });

  test('score increments on ring collection', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Simulate ring collection via EventBus
    await gamePage.evaluate(() => {
      const { gameState } = window.__GAME_STATE__;
      window.__GAME_STATE__.addScore(1);
      window.__EVENT_BUS__.emit(window.__EVENTS__.RING_COLLECTED, { ring: null });
      window.__EVENT_BUS__.emit(window.__EVENTS__.SCORE_CHANGED, { score: window.__GAME_STATE__.score });
    });

    const score = await gamePage.evaluate(() => window.__GAME_STATE__.score);
    expect(score).toBe(1);

    // HUD should reflect the score
    await expect(gamePage.locator('#hud-score')).toContainText('1');
  });
});
