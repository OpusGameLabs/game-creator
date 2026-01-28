---
description: Add Playwright QA tests to a game — visual regression, gameplay verification, performance, and accessibility
disable-model-invocation: true
argument-hint: "[path-to-game]"
---

# QA Game

Add automated QA testing with Playwright to an existing game project.

## Instructions

Analyze the game at `$ARGUMENTS` (or the current directory if no path given).

First, load the game-qa skill to get the full testing patterns and fixtures.

### Step 1: Audit testability

- Read `package.json` to identify the engine and dev server port
- Read `vite.config.js` for the server port
- Read `src/main.js` to check if `window.__GAME__`, `window.__GAME_STATE__`, `window.__EVENT_BUS__` are exposed
- Read `src/core/GameState.js` to understand what state is available
- Read `src/core/EventBus.js` to understand what events exist
- Read all scene files to understand the game flow

### Step 2: Setup Playwright

1. Install dependencies: `npm install -D @playwright/test @axe-core/playwright && npx playwright install chromium`
2. Create `playwright.config.js` with the correct dev server port and webServer config
3. Expose `window.__GAME__`, `window.__GAME_STATE__`, `window.__EVENT_BUS__`, `window.__EVENTS__` in `src/main.js` if not already present
4. Create the test directory structure:
   ```
   tests/
   ├── e2e/
   │   ├── game.spec.js
   │   ├── visual.spec.js
   │   └── perf.spec.js
   ├── fixtures/
   │   └── game-test.js
   └── helpers/
       └── seed-random.js
   ```
5. Add npm scripts: `test`, `test:ui`, `test:headed`, `test:update-snapshots`

### Step 3: Generate tests

Write tests based on what the game actually does:

- **game.spec.js**: Boot test, scene transitions, input handling, scoring, game over
- **visual.spec.js**: Screenshot regression for each scene (menu, gameplay, game over)
- **perf.spec.js**: Load time budget, FPS during gameplay

Follow the game-qa skill patterns. Use `gamePage` fixture. Use `page.evaluate()` to read game state. Use `page.keyboard.press()` for input.

### Step 4: Run and verify

1. Run `npx playwright test` to execute all tests
2. If visual tests fail on first run, that's expected — generate baselines with `npx playwright test --update-snapshots`
3. Run again to verify all tests pass
4. Summarize results

### Step 5: Report

List:
- Every file created
- Every test and what it verifies
- How to run tests (`npm test`, `npm run test:ui`, `npm run test:headed`)
- How to update visual baselines (`npm run test:update-snapshots`)
