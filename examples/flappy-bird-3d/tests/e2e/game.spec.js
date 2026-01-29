import { test, expect } from '../fixtures/game-test.js';

test.describe('Flappy Bird 3D — Core Game', () => {
  test('game boots and renders canvas', async ({ gamePage }) => {
    const canvas = gamePage.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('menu overlay is visible on load', async ({ gamePage }) => {
    const menu = gamePage.locator('#menu-overlay');
    await expect(menu).toBeVisible();
    await expect(gamePage.locator('#play-btn')).toHaveText('PLAY');
  });

  test('clicking PLAY starts the game', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();

    await gamePage.waitForFunction(() => window.__GAME_STATE__.started, null, { timeout: 5000 });

    const started = await gamePage.evaluate(() => window.__GAME_STATE__.started);
    expect(started).toBe(true);

    // Menu should be hidden
    const menuHidden = await gamePage.locator('#menu-overlay').evaluate(el => {
      return el.classList.contains('hidden');
    });
    expect(menuHidden).toBe(true);
  });

  test('HUD is visible during gameplay', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    const hudDisplay = await gamePage.locator('#hud').evaluate(el => el.style.display);
    expect(hudDisplay).toBe('block');
  });

  test('bird exists after game starts', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    const hasBird = await gamePage.evaluate(() => {
      return window.__GAME__.bird !== null;
    });
    expect(hasBird).toBe(true);
  });

  test('bird falls due to gravity', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    const yBefore = await gamePage.evaluate(() => {
      return window.__GAME__.bird.getPosition().y;
    });

    await gamePage.waitForTimeout(500);

    const yAfter = await gamePage.evaluate(() => {
      return window.__GAME__.bird.getPosition().y;
    });

    // Bird should have fallen (y decreased)
    expect(yAfter).toBeLessThan(yBefore);
  });

  test('space key triggers flap', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Wait for bird to fall a bit
    await gamePage.waitForTimeout(300);

    const yBeforeFlap = await gamePage.evaluate(() => {
      return window.__GAME__.bird.getPosition().y;
    });

    // Flap
    await gamePage.keyboard.press('Space');
    await gamePage.waitForTimeout(200);

    const yAfterFlap = await gamePage.evaluate(() => {
      return window.__GAME__.bird.getPosition().y;
    });

    // Bird should have moved upward or at least slowed its fall
    expect(yAfterFlap).toBeGreaterThan(yBeforeFlap);
  });

  test('game over triggers on ground collision', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Force bird to ground via event
    await gamePage.evaluate(() => {
      window.__GAME__.bird.group.position.y = -0.5;
      window.__GAME__.bird.velocity = -10;
    });

    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver,
      null,
      { timeout: 5000 }
    );

    const gameOver = await gamePage.evaluate(() => window.__GAME_STATE__.gameOver);
    expect(gameOver).toBe(true);
  });

  test('game over shows overlay after delay', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Force game over
    await gamePage.evaluate(() => {
      window.__GAME__.gameOver();
    });

    await gamePage.waitForFunction(
      () => window.__GAME_STATE__.gameOver,
      null,
      { timeout: 5000 }
    );

    // Wait for game over overlay to appear (headless runs at low FPS so timing varies)
    await gamePage.waitForFunction(
      () => !document.getElementById('gameover-overlay').classList.contains('hidden'),
      null,
      { timeout: 8000 }
    );

    await expect(gamePage.locator('#gameover-overlay h1')).toHaveText('GAME OVER');
    await expect(gamePage.locator('#restart-btn')).toHaveText('RESTART');
  });

  test('restart works from game over screen', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Force game over
    await gamePage.evaluate(() => {
      window.__GAME__.gameOver();
    });
    await gamePage.waitForFunction(() => window.__GAME_STATE__.gameOver, null, { timeout: 5000 });
    await gamePage.waitForTimeout(1500);

    // Click RESTART
    await gamePage.locator('#restart-btn').click();
    await gamePage.waitForTimeout(500);

    // Game should be restarted and playing
    const state = await gamePage.evaluate(() => ({
      started: window.__GAME_STATE__.started,
      gameOver: window.__GAME_STATE__.gameOver,
      score: window.__GAME_STATE__.score,
    }));
    expect(state.started).toBe(true);
    expect(state.gameOver).toBe(false);
    expect(state.score).toBe(0);
  });

  test('score increments via pipe pass event', async ({ gamePage }) => {
    await gamePage.locator('#play-btn').click();
    await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

    // Simulate pipe pass
    await gamePage.evaluate(() => {
      window.__GAME_STATE__.addScore(1);
      window.__EVENT_BUS__.emit(window.__EVENTS__.SCORE_CHANGED, { score: window.__GAME_STATE__.score });
    });

    const score = await gamePage.evaluate(() => window.__GAME_STATE__.score);
    expect(score).toBe(1);

    // HUD should reflect score
    await expect(gamePage.locator('#hud')).toContainText('1');
  });
});
