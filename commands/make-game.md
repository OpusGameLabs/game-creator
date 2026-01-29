---
description: Full guided pipeline — scaffold, design, add audio, test, and review a game from scratch
disable-model-invocation: true
argument-hint: "[2d|3d] [game-name]"
---

# Make Game (Full Pipeline)

Build a complete browser game from scratch, step by step. This command walks you through the entire pipeline — from an empty folder to a polished, tested, reviewed game. No game development experience needed.

**What you'll get:**
1. A fully scaffolded game project with clean architecture
2. Visual polish — gradients, particles, transitions, juice
3. Chiptune music and retro sound effects (no audio files needed)
4. Automated tests that catch bugs when you make changes
5. An architecture review with a quality score and improvement tips

## Instructions

This command orchestrates the full game creation pipeline. Run each step in order, confirming with the user between steps.

### Step 1: Scaffold the game from template

Parse $ARGUMENTS to determine:
- **Engine**: `2d` (Phaser — side-scrollers, platformers, arcade) or `3d` (Three.js — first-person, third-person, open world). If not specified, ask the user.
- **Name**: The game name in kebab-case. If not specified, ask the user what kind of game they want and suggest a name.

Then scaffold the project by copying the starter template:

1. Locate the plugin's template directory. Check these paths in order until found:
   - `~/.claude/plugins/cache/local-plugins/game-creator/1.0.0/templates/`
   - The `templates/` directory relative to this plugin's install location
2. Copy the entire template directory to the target project name:
   - 2D: copy `templates/phaser-2d/` → `<game-name>/`
   - 3D: copy `templates/threejs-3d/` → `<game-name>/`
3. Update `package.json` — set `"name"` to the game name
4. Update `<title>` in `index.html` to a human-readable version of the game name
5. Run `npm install` in the new project directory
6. Start the dev server with `npm run dev` and confirm it works

**Tell the user:**
> Your game is scaffolded and running! Here's how it's organized:
> - `src/core/Constants.js` — all game settings (speed, colors, sizes)
> - `src/core/EventBus.js` — how parts of the game talk to each other
> - `src/core/GameState.js` — tracks score, lives, etc.
>
> **Next up: visual polish.** I'll add gradients, particles, screen transitions, and effects that make the game feel alive. Ready?

**Wait for user confirmation before proceeding.**

### Step 2: Design the visuals (`/design-game`)

Load the game-designer skill. Then:

1. Audit the current visuals — read Constants.js, all scenes, entities, EventBus
2. Score each visual area (background, palette, animations, particles, transitions, typography, game feel, menus) on a 1-5 scale
3. Present the top improvements ranked by visual impact, explained in plain English
4. Ask the user which improvements they want, or implement all
5. All new values go in Constants.js, use EventBus for triggering effects, don't alter gameplay
6. Run `npm run build` to confirm no errors

**Tell the user:**
> Your game looks much better now! Here's what changed: [summarize changes]
>
> **Next up: music and sound effects.** I'll add chiptune background music and retro sound effects — all generated in the browser, no audio files needed. Ready?

**Wait for user confirmation before proceeding.**

### Step 3: Add audio (`/add-audio`)

Load the game-audio skill. Then:

1. Audit the game: check for `@strudel/web`, read EventBus events, read all scenes
2. Present a table of planned audio (BGM for each scene, SFX for each action)
3. Install `@strudel/web` if needed
4. Create `src/audio/AudioManager.js`, `music.js`, `sfx.js`, `AudioBridge.js`
5. Add audio events to EventBus.js
6. Wire audio into main.js and all scenes
7. **Important**: Use explicit imports from `@strudel/web` (`import { stack, note, s } from '@strudel/web'`) — do NOT rely on global registration
8. Run `npm run build` to confirm no errors

**Tell the user:**
> Your game now has music and sound effects! Click/tap once to activate audio, then you'll hear the music.
> Note: Strudel is AGPL-3.0, so your project needs a compatible open source license.
>
> **Next up: automated tests.** I'll add Playwright tests that verify your game boots, scenes work, and scoring functions — like a safety net for future changes. Ready?

**Wait for user confirmation before proceeding.**

### Step 4: Add QA tests (`/qa-game`)

Load the game-qa skill. Then:

1. Audit testability: check for `window.__GAME__`, `window.__GAME_STATE__`, `window.__EVENT_BUS__` exposure
2. Install Playwright: `npm install -D @playwright/test @axe-core/playwright && npx playwright install chromium`
3. Create `playwright.config.js` with the correct dev server port
4. Expose game internals on window if not already done
5. Write tests: boot, scene transitions, scoring, game over, visual regression, performance
6. Run `npx playwright test` and handle first-run snapshot generation
7. Add npm scripts: `test`, `test:ui`, `test:headed`, `test:update-snapshots`

**Tell the user:**
> Your game now has automated tests! Here's how to run them:
> - `npm test` — headless (fast, for CI)
> - `npm run test:headed` — watch the browser run the tests
> - `npm run test:ui` — interactive dashboard
>
> **Final step: architecture review.** I'll check your code structure, performance patterns, and give you a quality score with specific improvements. Ready?

**Wait for user confirmation before proceeding.**

### Step 5: Review the game (`/review-game`)

1. Identify the engine, read package.json, main entry, index.html
2. Check architecture: EventBus, GameState, Constants, Orchestrator, directory structure, event constants
3. Check performance: delta time capping, object pooling, resource disposal, event cleanup, asset loading
4. Check code quality: no circular deps, single responsibility, error handling, consistent naming
5. Check monetization readiness: scoring, session tracking, anti-cheat potential, Play.fun integration

**Provide the structured report:**
1. Game Overview
2. Architecture Score (out of 6)
3. Performance Score (out of 5)
4. Code Quality Score (out of 4)
5. Monetization Readiness (out of 4)
6. Top Recommendations (plain English)
7. What's Working Well

### Pipeline Complete!

Tell the user:

> Your game has been through the full pipeline! Here's what you have:
> - **Scaffolded architecture** — clean, modular code structure
> - **Visual polish** — gradients, particles, transitions, juice
> - **Music and SFX** — chiptune background music and retro sound effects
> - **Automated tests** — safety net for future changes
> - **Quality review** — scored and prioritized improvements
>
> **What's next?**
> - Add new gameplay features: `/game-creator:add-feature [describe what you want]`
> - Deploy to the web: `npm run build` then host `dist/` on GitHub Pages, Vercel, Netlify, or itch.io
> - Keep iterating! Run any step again anytime: `/design-game`, `/add-audio`, `/qa-game`, `/review-game`
