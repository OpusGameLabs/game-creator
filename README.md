# game-creator

The game studio for the agent internet. Build, monetize, and ship 2D (Phaser) and 3D (Three.js) browser games with one command. Monetize with [Play.fun](https://play.fun) (OpenGameProtocol). Works with **OpenClaw** and **Claude Code**. Share your games on [Moltbook](https://www.moltbook.com/).

**Owner**: [OpusGameLabs](https://github.com/OpusGameLabs)

## Install

### OpenClaw (recommended)

```bash
# Via ClawHub
npx clawhub@latest install game-creator

# Or paste this repo URL in your OpenClaw chat
# github.com/OpusGameLabs/game-creator

# Or copy skills manually
git clone https://github.com/OpusGameLabs/game-creator.git
cp -r game-creator/skills/* ~/.openclaw/skills/
```

### Claude Code

```bash
/plugin marketplace add OpusGameLabs/game-creator
```

## Quick Start

```bash
# Build a complete 2D game (scaffold → design → audio → test → review → deploy → monetize)
/game-creator:make-game 2d my-game

# Or run individual steps:
/game-creator:design-game

# Add chiptune music and sound effects
/game-creator:add-audio

# Monetize with Play.fun (OpenGameProtocol)
/game-creator:monetize-game

# Add Playwright tests
/game-creator:qa-game

# Review architecture compliance
/game-creator:review-game
```

## Architecture

Every game scaffolded by this plugin follows the same architecture, whether 2D or 3D:

```
src/
├── core/
│   ├── EventBus.js       # Singleton pub/sub — all cross-module communication
│   ├── GameState.js      # Centralized state singleton
│   ├── Constants.js      # Every magic number, color, timing, speed
│   └── GameConfig.js     # Engine config (Phaser or Three.js)
├── scenes/               # Scene lifecycle (Phaser) or states (Three.js)
├── entities/             # Game objects (player, enemies, obstacles)
├── systems/              # Engine systems (background, particles, spawners)
├── audio/                # Strudel.cc procedural audio
│   ├── AudioManager.js   # Init, play, stop wrapper
│   ├── AudioBridge.js    # Wires EventBus to AudioManager
│   ├── music.js          # Background music patterns
│   └── sfx.js            # Sound effect patterns
└── main.js               # Entry point
```

### Core Patterns

**EventBus** — Modules never import each other. All communication flows through a singleton EventBus with predefined event constants:

```js
eventBus.emit(Events.BIRD_FLAP);
eventBus.on(Events.SCORE_CHANGED, ({ score }) => { ... });
```

**GameState** — Single source of truth. Systems read from it, events mutate it:

```js
gameState.addScore();     // increments score, updates bestScore
gameState.reset();        // clean slate for restart
```

**Constants** — Zero hardcoded values in game logic. Every tunable lives here:

```js
export const BIRD_CONFIG = { flapVelocity: -380, maxVelocity: 600, ... };
export const PIPE_CONFIG = { speed: 180, gapSize: 150, ... };
export const COLORS = { sky: 0x4ec0ca, bird: 0xf5d742, ... };
```

## Skills

| Skill | Purpose |
|-------|---------|
| `phaser` | 2D game architecture with Phaser 3 (scene-based, arcade physics, TypeScript) |
| `threejs-game` | 3D game architecture with Three.js (event-driven, modular systems) |
| `game-designer` | Visual polish — sky gradients, particles, screen shake, transitions, juice |
| `game-audio` | Procedural audio with Strudel.cc — chiptune BGM, retro SFX |
| `game-qa` | Playwright testing — gameplay verification, visual regression, performance |
| `game-architecture` | Reference patterns for event-driven game architecture |
| `game-deploy` | Deployment to GitHub Pages, Vercel, Netlify, itch.io |
| `playdotfun` | Play.fun (OpenGameProtocol) monetization — SDK, API, auth, leaderboards |

## Commands

| Command | Description |
|---------|-------------|
| `/game-creator:make-game [2d\|3d] [name]` | Full pipeline: scaffold, design, audio, test, review, deploy, monetize |
| `/game-creator:improve-game [focus]` | Deep audit + implement highest-impact improvements |
| `/game-creator:design-game [path]` | Audit and improve visual polish |
| `/game-creator:add-feature [description]` | Add a feature following architecture patterns |
| `/game-creator:add-audio [path]` | Add Strudel.cc music and sound effects |
| `/game-creator:qa-game [path]` | Add Playwright automated tests |
| `/game-creator:monetize-game [path]` | Register on Play.fun, add SDK, get monetized URL |
| `/game-creator:review-game [path]` | Review architecture, performance, code quality |

## Agents

| Agent | Description |
|-------|-------------|
| `game-reviewer` | Reviews codebases for architecture compliance, performance, and monetization readiness |
| `game-creator` | Autonomous end-to-end game creation pipeline with build/test gates |
| `game-qa-runner` | Runs tests, diagnoses failures, fixes game code, and re-runs until green |
| `game-deploy` | Deploys games to GitHub Pages, Vercel, or itch.io with pre/post validation |

## Example: Flappy Bird

A complete 2D game in `examples/flappy-bird/` demonstrating every pattern:

- **5 scenes**: Boot, Menu, Game, UI (parallel overlay), Game Over
- **2 entities**: Bird (composite graphics, wing animation, tilt) and Pipe (random gaps, collision zones)
- **4 systems**: Background (sky gradient, parallax clouds, grass), PipeSpawner, ScoreSystem, Particles (tween-based bursts)
- **Procedural audio**: Chiptune menu theme, gameplay BGM, game over theme, flap/score/death SFX
- **15 Playwright tests**: Boot flow, scene transitions, input, scoring, restart, visual regression, performance
- **All procedural graphics** — no image assets, no external audio files

```bash
cd examples/flappy-bird
npm install
npm run dev        # http://localhost:3000
npm run test       # run all 15 Playwright tests
npm run build      # production build
```

## Templates

The `/make-game` command copies a runnable starter project from `templates/` instead of generating files from scratch. Both templates include all dependencies pre-configured, EventBus/GameState/Constants architecture, and procedural graphics (no asset files needed).

| Template | Engine | Contents |
|----------|--------|----------|
| `phaser-2d` | Phaser 3 | 5 scenes (Boot, Menu, Game, UI, GameOver), Player entity, ScoreSystem, arcade physics |
| `threejs-3d` | Three.js | Game orchestrator, Player mesh, LevelBuilder (ground + fog + lighting), HTML overlays for menus, InputSystem |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 2D Engine | Phaser 3 |
| 3D Engine | Three.js |
| Audio | Strudel.cc (`@strudel/web`) |
| Build | Vite |
| Testing | Playwright + axe-core |
| Monetization | [Play.fun](https://play.fun) (OpenGameProtocol) |
| Language | JavaScript ES modules |

## Audio

Background music and sound effects are procedurally generated using [Strudel.cc](https://strudel.cc/), a browser-based live coding music tool. No audio files needed.

```js
// Chiptune gameplay BGM
stack(
  note("e4 g4 a4 g4 e4 d4 e4 c4").s("square").gain(0.22).lpf(2200),
  note("c2 c2 g2 g2 a2 a2 g2 g2").s("triangle").gain(0.3).lpf(500),
  s("bd ~ sd ~, hh*8").gain(0.35)
).cpm(130).play();
```

Strudel is AGPL-3.0 licensed. Projects using `@strudel/web` must be open source under a compatible license.

## Testing

Automated QA uses Playwright for canvas game testing:

- **Gameplay verification**: Boot flow, scene transitions, input handling, scoring, game over, restart
- **Visual regression**: Screenshot comparison per scene (with tolerance for animated elements)
- **Performance**: Load time budgets, FPS measurement, canvas dimensions
- **Accessibility**: axe-core HTML audits

For interactive visual QA, use [Playwright MCP](https://github.com/anthropics/claude-code/blob/main/docs/mcp.md):

```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

## License

MIT
