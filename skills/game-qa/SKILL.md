---
name: game-qa
description: Game QA testing with Playwright — visual regression, gameplay verification, performance, and accessibility for browser games
---

# Game QA with Playwright

You are an expert QA engineer for browser games. You use Playwright to write automated tests that verify visual correctness, gameplay behavior, performance, and accessibility.

## Tech Stack

- **Test Runner**: Playwright Test (`@playwright/test`)
- **Visual Regression**: Playwright built-in `toHaveScreenshot()`
- **Accessibility**: `@axe-core/playwright`
- **Build Tool Integration**: Vite dev server via `webServer` config
- **Language**: JavaScript ES modules

## Project Setup

When adding Playwright to a game project:

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install chromium
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "npx playwright test",
    "test:ui": "npx playwright test --ui",
    "test:headed": "npx playwright test --headed",
    "test:update-snapshots": "npx playwright test --update-snapshots"
  }
}
```

## Required Directory Structure

```
tests/
├── e2e/
│   ├── game.spec.js       # Core game tests (boot, scenes, input, score)
│   ├── visual.spec.js     # Visual regression screenshots
│   └── perf.spec.js       # Performance and FPS tests
├── fixtures/
│   ├── game-test.js       # Custom test fixture with game helpers
│   └── screenshot.css     # CSS to mask dynamic elements for visual tests
├── helpers/
│   └── seed-random.js     # Seeded PRNG for deterministic game behavior
playwright.config.js
```

## Playwright Config

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 200,
      threshold: 0.3,
    },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
```

Key points:
- `webServer` auto-starts Vite before tests
- `reuseExistingServer` reuses a running dev server locally
- `baseURL` matches the Vite port configured in `vite.config.js`
- Screenshot tolerance is generous (games have minor render variance)

## Testability Requirements

For Playwright to inspect game state, the game MUST expose these globals on `window` in `main.js`:

### 1. Core globals (required)

```js
// Expose for Playwright QA
window.__GAME__ = game;
window.__GAME_STATE__ = gameState;
window.__EVENT_BUS__ = eventBus;
window.__EVENTS__ = Events;
```

### 2. `render_game_to_text()` (required)

Returns a concise JSON string of the current game state for AI agents to reason about the game without interpreting pixels. Must include coordinate system, game mode, score, and player state.

```js
window.render_game_to_text = () => {
  if (!game || !gameState) return JSON.stringify({ error: 'not_ready' });

  const activeScenes = game.scene.getScenes(true).map(s => s.scene.key);
  const payload = {
    coords: 'origin:top-left x:right y:down',          // coordinate system
    mode: gameState.gameOver ? 'game_over' : gameState.started ? 'playing' : 'menu',
    scene: activeScenes[0] || null,
    score: gameState.score,
    bestScore: gameState.bestScore,
  };

  // Add player info when in gameplay
  const gameScene = game.scene.getScene('GameScene');
  if (gameState.started && gameScene?.player?.sprite) {
    const s = gameScene.player.sprite;
    const body = s.body;
    payload.player = {
      x: Math.round(s.x), y: Math.round(s.y),
      vx: Math.round(body.velocity.x), vy: Math.round(body.velocity.y),
      onGround: body.blocked.down,
    };
  }

  // Extend with visible entities as you add them:
  // payload.entities = obstacles.map(o => ({ x: o.x, y: o.y, type: o.type }));

  return JSON.stringify(payload);
};
```

Guidelines for `render_game_to_text()`:
- Keep the payload **succinct** — only current, visible, interactive elements
- Include **coordinate system note** (origin and axis directions)
- Include **player position/velocity**, active obstacles/enemies, collectibles, timers, score, and mode flags
- Avoid large histories; only include what's currently relevant
- The iterate client and AI agents use this to verify game behavior without screenshots

### 3. `advanceTime(ms)` (required)

Lets test scripts advance the game by a precise duration. The game loop runs normally via RAF; this waits for real time to elapse.

```js
window.advanceTime = (ms) => {
  return new Promise((resolve) => {
    const start = performance.now();
    function step() {
      if (performance.now() - start >= ms) return resolve();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
};
```

For frame-precise control in `@playwright/test`, prefer `page.clock.install()` + `page.clock.runFor()`. The `advanceTime` hook is primarily used by the standalone iterate client (`scripts/iterate-client.js`).

For Three.js games, expose the `Game` orchestrator instance similarly.

## Custom Test Fixture

Create a reusable fixture with game-specific helpers:

```js
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  gamePage: async ({ page }, use) => {
    await page.goto('/');
    // Wait for Phaser to boot and canvas to render
    await page.waitForFunction(() => {
      const g = window.__GAME__;
      return g && g.isBooted && g.canvas;
    }, null, { timeout: 10000 });
    await use(page);
  },
});

export { expect };
```

## Core Testing Patterns

### 1. Game Boot & Scene Flow

Test that the game initializes and scenes transition correctly.

```js
import { test, expect } from '../fixtures/game-test.js';

test('game boots to menu scene', async ({ gamePage }) => {
  const sceneKey = await gamePage.evaluate(() => {
    return window.__GAME__.scene.getScenes(true)[0]?.scene?.key;
  });
  expect(sceneKey).toBe('MenuScene');
});

test('menu transitions to game on input', async ({ gamePage }) => {
  await gamePage.keyboard.press('Space');
  await gamePage.waitForFunction(() => {
    const scenes = window.__GAME__.scene.getScenes(true);
    return scenes.some(s => s.scene.key === 'GameScene');
  });
  const sceneKey = await gamePage.evaluate(() => {
    return window.__GAME__.scene.getScenes(true)[0]?.scene?.key;
  });
  expect(sceneKey).toBe('GameScene');
});
```

### 2. Gameplay Verification

Test that game mechanics work — input affects state, scoring works, game over triggers.

```js
test('bird flaps on space press', async ({ gamePage }) => {
  // Start game
  await gamePage.keyboard.press('Space');
  await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

  // Record position before flap
  const yBefore = await gamePage.evaluate(() => {
    const scene = window.__GAME__.scene.getScene('GameScene');
    return scene.bird.y;
  });

  // Flap
  await gamePage.keyboard.press('Space');
  await gamePage.waitForTimeout(100);

  // Bird should have moved up (lower y)
  const yAfter = await gamePage.evaluate(() => {
    const scene = window.__GAME__.scene.getScene('GameScene');
    return scene.bird.y;
  });
  expect(yAfter).toBeLessThan(yBefore);
});

test('game over triggers on collision', async ({ gamePage }) => {
  await gamePage.keyboard.press('Space');
  await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

  // Don't flap — let bird fall to ground
  await gamePage.waitForFunction(
    () => window.__GAME_STATE__.gameOver,
    null,
    { timeout: 10000 }
  );

  expect(await gamePage.evaluate(() => window.__GAME_STATE__.gameOver)).toBe(true);
});
```

### 3. Scoring

```js
test('score increments when passing pipes', async ({ gamePage }) => {
  await gamePage.keyboard.press('Space');
  await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

  // Keep flapping to survive
  const flapInterval = setInterval(async () => {
    await gamePage.keyboard.press('Space').catch(() => {});
  }, 300);

  // Wait for at least 1 score
  await gamePage.waitForFunction(
    () => window.__GAME_STATE__.score > 0,
    null,
    { timeout: 15000 }
  );

  clearInterval(flapInterval);

  const score = await gamePage.evaluate(() => window.__GAME_STATE__.score);
  expect(score).toBeGreaterThan(0);
});
```

### 4. Visual Regression

Screenshot-based tests to catch unintended visual changes.

```js
test('menu scene renders correctly', async ({ gamePage }) => {
  // Wait a beat for animations to settle
  await gamePage.waitForTimeout(500);
  await expect(gamePage.locator('canvas')).toHaveScreenshot('menu-scene.png', {
    maxDiffPixels: 300,
  });
});

test('game over scene renders correctly', async ({ gamePage }) => {
  await gamePage.keyboard.press('Space');
  await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

  // Let bird die
  await gamePage.waitForFunction(
    () => window.__GAME_STATE__.gameOver,
    null,
    { timeout: 10000 }
  );

  // Wait for game over scene
  await gamePage.waitForFunction(() => {
    const scenes = window.__GAME__.scene.getScenes(true);
    return scenes.some(s => s.scene.key === 'GameOverScene');
  });
  await gamePage.waitForTimeout(600); // transitions

  await expect(gamePage.locator('canvas')).toHaveScreenshot('game-over-scene.png', {
    maxDiffPixels: 300,
  });
});
```

**Masking dynamic elements** — use `screenshot.css` to hide particles, clouds, or animated elements that cause non-deterministic screenshots:

```css
/* tests/fixtures/screenshot.css */
/* No CSS rules needed for canvas games — canvas is opaque to CSS.
   Instead, use window.__TEST_MODE__ flag in game code to freeze animations. */
```

### 5. Performance & FPS

```js
test('game loads within 3 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForFunction(() => {
    const g = window.__GAME__;
    return g && g.isBooted && g.canvas;
  });
  const loadTime = Date.now() - start;
  expect(loadTime).toBeLessThan(3000);
});

test('game maintains 30+ FPS during gameplay', async ({ gamePage }) => {
  await gamePage.keyboard.press('Space');
  await gamePage.waitForFunction(() => window.__GAME_STATE__.started);

  const avgFps = await gamePage.evaluate(() => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function countFrame() {
        frames++;
        if (performance.now() - start < 2000) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(frames / ((performance.now() - start) / 1000));
        }
      }
      requestAnimationFrame(countFrame);
    });
  });

  expect(avgFps).toBeGreaterThan(30);
});
```

### 6. Accessibility

Canvas games are inherently opaque to screen readers, but test the surrounding HTML:

```js
import AxeBuilder from '@axe-core/playwright';

test('page has no accessibility violations', async ({ gamePage }) => {
  const results = await new AxeBuilder({ page: gamePage })
    .exclude('canvas')
    .analyze();
  expect(results.violations).toEqual([]);
});
```

## Deterministic Testing

For reproducible tests, seed the game's RNG before page load:

```js
// tests/helpers/seed-random.js
// Mulberry32 seeded PRNG — inject via page.addInitScript()
(function() {
  let seed = 42;
  Math.random = function() {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
```

Use it in tests:

```js
test.beforeEach(async ({ page }) => {
  await page.addInitScript({ path: './tests/helpers/seed-random.js' });
});
```

Phaser also supports seeded RNG via config:

```js
const config = {
  seed: ['qa-test-seed'],
  // ...
};
```

## Clock Control for Frame-Precise Testing

Playwright's Clock API controls `requestAnimationFrame`, giving you frame-precise game control:

```js
test('bird falls after 1 second without input', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.waitForFunction(() => window.__GAME__?.isBooted);

  // Start game
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.__GAME_STATE__.started);

  const yBefore = await page.evaluate(() => {
    return window.__GAME__.scene.getScene('GameScene').bird.y;
  });

  // Advance exactly 1 second
  await page.clock.runFor(1000);

  const yAfter = await page.evaluate(() => {
    return window.__GAME__.scene.getScene('GameScene').bird.y;
  });

  expect(yAfter).toBeGreaterThan(yBefore); // bird fell
});
```

## When Adding QA to a Game

1. Install Playwright: `npm install -D @playwright/test @axe-core/playwright && npx playwright install chromium`
2. Create `playwright.config.js` with the game's dev server port
3. Expose `window.__GAME__`, `window.__GAME_STATE__`, `window.__EVENT_BUS__` in `main.js`
4. Create `tests/fixtures/game-test.js` with the `gamePage` fixture
5. Create `tests/helpers/seed-random.js` for deterministic behavior
6. Write tests in `tests/e2e/`:
   - `game.spec.js` — boot, scene flow, input, scoring, game over
   - `visual.spec.js` — screenshot regression for each scene
   - `perf.spec.js` — load time, FPS budget
7. Add npm scripts: `test`, `test:ui`, `test:headed`, `test:update-snapshots`
8. Generate initial baselines: `npm run test:update-snapshots`

## Playwright MCP — Interactive Visual QA

In addition to automated tests, use the **Playwright MCP** for interactive visual inspection. This gives Claude direct browser control via a visible Chrome window.

### Setup

```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

### When to Use MCP vs Automated Tests

| Task | Use |
|------|-----|
| "Does this look right?" | **MCP** — take a screenshot, analyze visually |
| "Did this change break boot flow?" | **Automated test** — assert scene transitions |
| "Are the colors cohesive?" | **MCP** — screenshot + visual judgment |
| "Does scoring still work?" | **Automated test** — assert gameState.score |
| "How does the death animation feel?" | **MCP** — navigate, die, watch in real-time |
| "Regression after refactor" | **Automated test** — run full suite |
| "Check FPS on real browser" | **MCP** — headed browser gives accurate FPS |
| "CI/CD gate" | **Automated test** — headless, pass/fail |
| "Evaluate visual polish" | **MCP** — designer uses screenshots to judge atmosphere |
| "Active gameplay screenshot" | **MCP** — animated scenes are unstable for automated screenshots |

### MCP Visual Inspection Flow

When using MCP for QA:

1. Navigate to the game URL with `browser_navigate`
2. Take a screenshot with `browser_take_screenshot` — analyze the menu scene
3. Click or press Space with `browser_click` or `browser_press_key` to start
4. Take screenshots during gameplay to check visuals
5. Let the bird die, take a screenshot of the game over screen
6. Report findings with specific visual observations

### MCP + Automated: Best of Both

The recommended workflow is:

1. **Write automated tests** for all objective checks (boot, scenes, input, scoring, game over, regression)
2. **Use MCP** for subjective visual evaluation (does it look good? feel right? color palette working?)
3. Run automated tests in CI; run MCP inspections during design passes

## Mobile Input & Responsive Layout Tests

Use the `mobile-chrome` project (Pixel 5 emulation) to test touch input and responsive layout:

```js
test('game canvas fills mobile viewport', async ({ gamePage }) => {
  const { width, height } = await gamePage.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return { width: canvas.clientWidth, height: canvas.clientHeight };
  });
  const viewport = gamePage.viewportSize();
  expect(width).toBeGreaterThanOrEqual(viewport.width * 0.9);
  expect(height).toBeGreaterThanOrEqual(viewport.height * 0.9);
});

test('virtual joystick appears on touch device', async ({ gamePage }) => {
  // Start the game
  await gamePage.tap('#play-btn');
  await gamePage.waitForTimeout(1000);
  // Joystick should be visible (if gyro is unavailable in emulation)
  const joystick = await gamePage.$('#virtual-joystick');
  // On emulated devices without gyro, joystick should appear
  if (joystick) {
    const visible = await joystick.isVisible();
    expect(visible).toBe(true);
  }
});

test('touch tap registers as input', async ({ gamePage }) => {
  await gamePage.tap('#play-btn');
  await gamePage.waitForFunction(() => window.__GAME_STATE__?.started);
  // Tap on the canvas
  const canvas = gamePage.locator('canvas');
  await canvas.tap();
  // Game should still be running (no crash from touch input)
  const running = await gamePage.evaluate(() => window.__GAME_STATE__?.started);
  expect(running).toBe(true);
});
```

## Iterate Client — Quick Feedback Loop

The standalone iterate client (`scripts/iterate-client.js`) is designed for tight implement→test cycles during development. Use it after **every meaningful code change** to catch issues immediately, rather than waiting for the full `@playwright/test` suite.

### When to Use

| Task | Tool |
|------|------|
| Verify a code change didn't break anything | **Iterate client** — fast, captures state + errors |
| Full regression suite for CI/CD | **`npm run test`** — comprehensive Playwright Test suite |
| Subjective visual evaluation | **Playwright MCP** — human judgment of aesthetics |
| During subagent implementation steps | **Iterate client** — run after each small change |

### Usage

```bash
# Basic: press space 3 times, capture screenshots each time
node scripts/iterate-client.js --url http://localhost:3000 \
  --actions-json '[{"buttons":["space"],"frames":4}]' \
  --iterations 3

# With action file
node scripts/iterate-client.js --url http://localhost:3000 \
  --actions-file scripts/example-actions.json --iterations 5

# Click a start button first, then perform actions
node scripts/iterate-client.js --url http://localhost:3000 \
  --click-selector "#play-btn" \
  --actions-json '[{"buttons":["right"],"frames":30},{"buttons":["space","right"],"frames":10}]'

# Debug: run headed (visible browser)
node scripts/iterate-client.js --url http://localhost:3000 \
  --actions-json '[{"buttons":["space"],"frames":4}]' \
  --headless false
```

### Action Format

```json
{
  "steps": [
    { "buttons": ["space"], "frames": 4 },
    { "buttons": [], "frames": 30 },
    { "buttons": ["right"], "frames": 30 },
    { "buttons": ["space", "right"], "frames": 10 },
    { "buttons": ["left_mouse_button"], "frames": 2, "mouse_x": 480, "mouse_y": 270 }
  ]
}
```

Supported buttons: `up`, `down`, `left`, `right`, `space`, `enter`, `escape`, `w`, `a`, `s`, `d`, `f`, `m`, `left_mouse_button`, `right_mouse_button`.

### Output

```
output/iterate/
├── shot-0.png          # Canvas screenshot after iteration 0
├── state-0.json        # render_game_to_text() output
├── shot-1.png
├── state-1.json
├── errors-0.json       # Console errors (only if errors occurred)
└── errors-boot.json    # Boot-time errors (only if errors occurred)
```

The client **breaks on the first new console error** — fix it before continuing.

### Integration with AI Agents

The iterate client is the primary feedback mechanism for AI agents during game development:

1. Agent makes a code change
2. Agent runs iterate client with relevant actions
3. Agent reads screenshots (visually) and state JSON (structurally) to verify the change
4. If errors detected, agent reads the error JSON and fixes
5. Repeat until stable

## What NOT to Test (Automated)

- **Exact pixel positions** of animated objects (non-deterministic without clock control)
- **Active gameplay screenshots** — moving objects make stable screenshots impossible; use MCP instead
- **Audio playback** (Playwright has no audio inspection; test that audio objects exist via evaluate)
- **External API calls** unless mocked (e.g., Play.fun SDK — mock with `page.route()`)
- **Subjective visual quality** — use MCP for "does this look good?" evaluations
