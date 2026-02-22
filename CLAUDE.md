# CLAUDE.md

## Project Overview

This is **game-creator**, the game studio for the agent internet. It provides skills, commands, and agents for scaffolding, designing, deploying, and monetizing 2D (Phaser 3) and 3D (Three.js) browser games. QA (build, runtime, visual review, autofix) runs at every step. Monetize with [Play.fun](https://play.fun) (OpenGameProtocol). Works with **40+ AI coding agents** (via `npx skills add`). Share your play.fun URL on [Moltbook](https://www.moltbook.com/).

## Repository Structure

```
.claude-plugin/
  plugin.json              # Plugin manifest (name, version, author)
  marketplace.json         # Marketplace metadata (owner: OpusGameLabs)
skills/
  phaser/SKILL.md          # 2D game patterns (Phaser 3, scene-based, multi-file)
  threejs-game/SKILL.md    # 3D game patterns (Three.js, event-driven)
  game-assets/SKILL.md     # Pixel art sprites (code-only, no external files)
  game-designer/SKILL.md   # Visual polish (gradients, particles, juice, transitions)
  game-audio/SKILL.md      # Procedural audio (Strudel.cc BGM + SFX)
  game-qa/SKILL.md         # Playwright testing (gameplay, visual, perf)
  game-architecture/SKILL.md  # Reference architecture patterns
  game-deploy/SKILL.md     # Deployment (GitHub Pages, Vercel, etc.)
  playdotfun/SKILL.md      # Play.fun monetization (git submodule → submodules/playdotfun)
templates/
  phaser-2d/               # Runnable 2D starter project (Phaser 3)
  threejs-3d/              # Runnable 3D starter project (Three.js)
commands/
  make-game.md             # Full pipeline: scaffold → assets → design → audio → deploy → monetize (QA at every step)
  improve-game.md          # Holistic audit + implement highest-impact improvements
  design-game.md           # Visual design audit + improvements
  add-feature.md           # Add feature following patterns
  add-assets.md            # Replace shapes with pixel art sprites
  add-audio.md             # Add Strudel.cc audio
  monetize-game.md         # Play.fun monetization (register, SDK, redeploy)
scripts/
  iterate-client.js        # Standalone Playwright iterate loop (action → screenshot → state → errors)
  example-actions.json     # Example action payloads for iterate-client.js
submodules/
  playdotfun/              # Git submodule: github.com/OpusGameLabs/skills
agents/
  game-reviewer.md         # Code review agent
  game-creator.md          # Autonomous game creation pipeline with build/visual gates
  game-deploy.md           # Deployment automation
examples/
  flappy-bird/             # Complete example game (see below)
```

## Architecture Rules

All games built with this plugin follow these mandatory patterns:

1. **EventBus singleton** — All cross-module communication via pub/sub. Modules never import each other directly. Events use `domain:action` naming (e.g., `bird:flap`, `game:over`).

2. **GameState singleton** — Single centralized state object. Systems read from it. Events trigger mutations. Has `reset()` for clean restarts.

3. **Constants.js** — Every magic number, color, timing, speed, and config value. Zero hardcoded values in game logic.

4. **Orchestrator** — One entry point (Game.js or GameConfig.js) initializes all systems and manages the game lifecycle.

5. **Directory structure** — `core/` (EventBus, GameState, Constants), `scenes/` or `systems/`, `entities/`, `ui/`, `audio/`.

6. **`render_game_to_text()`** — Every game exposes `window.render_game_to_text()` in `main.js`. Returns a concise JSON string of the current game state for AI agents to read without interpreting pixels. Must include: coordinate system note, game mode (`playing`/`game_over`), score, player position/velocity, and visible entities. Keep it succinct — only current, on-screen state. Games boot directly into gameplay (no title screen by default), so `playing` is the initial mode.

7. **`advanceTime(ms)`** — Every game exposes `window.advanceTime(ms)` in `main.js`. Returns a Promise that resolves after `ms` milliseconds of real time, allowing test scripts to advance the game in controlled increments. For frame-precise control in `@playwright/test`, prefer `page.clock.install()` + `runFor()`.

8. **`progress.md`** — Created at the project root by the game-creator agent. Records the original user prompt, TODOs, decisions, gotchas, and loose ends after each pipeline step. Enables multi-session continuity and agent handoff.

## Example Game: Flappy Bird

Located at `examples/flappy-bird/`. Demonstrates all patterns.

### Key files

- `src/main.js` — Entry point. Inits audio bridge, creates Phaser game, exposes test globals.
- `src/core/EventBus.js` — 13 events across bird, score, game, particles, and audio domains.
- `src/core/Constants.js` — All config: game dimensions, bird physics, pipe settings, colors, particles, transitions.
- `src/core/GameState.js` — score, bestScore, started, gameOver.
- `src/scenes/GameScene.js` — Main gameplay. Two-stage start (GET READY → playing). AABB collision. Death slow-mo.
- `src/scenes/UIScene.js` — Parallel overlay scene for HUD score display.
- `src/audio/AudioManager.js` — Wraps Strudel `initStrudel()`, `hush()`, `.play()`. Uses explicit imports from `@strudel/web`.
- `src/audio/music.js` — Three BGM patterns: menu (100 cpm), gameplay (130 cpm), game over (60 cpm).
- `src/audio/sfx.js` — Four SFX: flap, score, death, button click.

### Running

```bash
cd examples/flappy-bird
npm install
npm run dev          # Vite dev server on port 3000
npm run test         # 15 Playwright tests
npm run build        # Production build to dist/
```

### Test structure

```
tests/
  fixtures/game-test.js      # Custom fixture: waits for boot, provides startPlaying()
  helpers/seed-random.js     # Mulberry32 seeded PRNG for deterministic tests
  e2e/game.spec.js           # 10 tests: boot, scenes, input, scoring, restart
  e2e/visual.spec.js         # 2 tests: initial gameplay + game over screenshots (3000px tolerance)
  e2e/perf.spec.js           # 3 tests: load time, FPS, canvas dimensions
```

### Audio integration

Strudel audio requires user interaction to start (browser autoplay policy). The flow:
1. GameScene first input → `AUDIO_INIT` event → `initStrudel()` called
2. GameScene `startPlaying()` → `MUSIC_GAMEPLAY` → gameplay BGM
3. Bird dies → `BIRD_DIED` (death SFX) + `MUSIC_STOP`
4. GameOverScene create → `MUSIC_GAMEOVER` → somber theme

SFX fires on `BIRD_FLAP`, `SCORE_CHANGED`, `BIRD_DIED` via AudioBridge listeners.

`hush()` stops ALL patterns globally. BGM uses a 100ms `setTimeout` between `hush()` and `.play()` to let Strudel's scheduler process the stop.

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| phaser | ^3.90.0 | 2D game engine (Phaser template) |
| three | ^0.183.0 | 3D game engine (Three.js template) |
| @strudel/web | ^1.3.0 | Procedural audio (AGPL-3.0) |
| @playwright/test | ^1.58.0 | Automated QA (dev) |
| @axe-core/playwright | ^4.11.0 | Accessibility testing (dev) |
| vite | ^7.3.1 | Build tool (dev) |

## Common Tasks

**Add a new skill**: Create `skills/<name>/SKILL.md`. Follow existing skill format with tech stack, architecture, code examples, and checklist.

**Add a new command**: Create `commands/<name>.md` with YAML frontmatter (`description`, `argument-hint`, `allowed-tools`, `disable-model-invocation`). Body contains the prompt instructions.

**Sync to plugin cache**: After editing skill/command files, copy to your agent's plugin cache directory (e.g. `~/.claude/plugins/cache/local-plugins/game-creator/1.0.0/` for Claude Code).

**Run the example**: `cd examples/flappy-bird && npm run dev` starts on port 3000.

**Run tests**: `cd examples/flappy-bird && npm run test`. Tests auto-start the Vite dev server.

**Quick iterate loop**: `node scripts/iterate-client.js --url http://localhost:3000 --actions-json '[{"buttons":["space"],"frames":4}]'` — captures screenshots, text state, and console errors. Use after every meaningful code change for tight feedback.

## Notes

- Strudel.cc is AGPL-3.0. Games using `@strudel/web` must be open source.
- Playwright screenshot tests use high pixel tolerance (3000 maxDiffPixels) because parallax clouds scroll between captures.
- Headless Chromium reports low FPS (~7-9). FPS threshold in tests is set to 5. Use Playwright MCP for accurate FPS measurement.
- The `playdotfun` skill is a git submodule at `submodules/playdotfun` (repo: `github.com/playdotfun/skills`). The symlink `skills/playdotfun → ../submodules/playdotfun/skills` makes SKILL.md resolve correctly. After cloning, run `git submodule update --init` to pull the submodule.

## Play.fun (OpenGameProtocol) Integration

The `/monetize-game` command (and Step 5 of `/make-game`) registers games on [Play.fun](https://play.fun) and integrates the browser SDK.

**Flow**: Auth → Register game → Add SDK to `index.html` + create `src/playfun.js` → Rebuild → Redeploy → Share play.fun URL on Moltbook

**Auth**: Uses `skills/playdotfun/scripts/playfun-auth.js` for credential management. Supports web callback (localhost:9876) and manual paste.

**SDK**: CDN script (`https://sdk.play.fun/latest`) + `src/playfun.js` that wires EventBus events (score changes, game over) to Play.fun points tracking. Non-blocking — if SDK fails to load, game still works.

**Anti-cheat**: Games are registered with `maxScorePerSession`, `maxSessionsPerDay`, and `maxCumulativePointsPerDay` based on the game's scoring system.
