---
description: Scaffold a new browser game project (Three.js 3D or Phaser 2D)
disable-model-invocation: true
argument-hint: "[3d|2d] [game-name]"
---

# New Game

Create a new browser game project from scratch.

## Instructions

Parse $ARGUMENTS to determine:
- **Engine**: First argument should be `3d` (Three.js) or `2d` (Phaser). If not specified, ask the user.
- **Name**: Second argument is the game name (kebab-case). If not specified, ask the user.

Then scaffold the project:

1. Create the project directory with the name provided
2. Initialize with `npm init -y`
3. Install dependencies:
   - 3D: `npm install three && npm install -D vite`
   - 2D: `npm install phaser && npm install -D vite`
4. Create `vite.config.js` per the engine skill
5. Update `package.json` with `"type": "module"` and dev/build/preview scripts
6. Create the full directory structure per the engine skill (core/, systems/, gameplay/ etc.)
7. Create starter files:
   - `core/EventBus.js` with singleton and Events enum
   - `core/GameState.js` with singleton
   - `core/Constants.js` with placeholder config
   - `core/Game.js` (3D) or `core/GameConfig.js` (2D) orchestrator
   - `main.js` entry point
   - `index.html` with game container div
8. Create `/public/` directory for assets

After scaffolding, tell the user:
- How to start the dev server (`cd <name> && npm run dev`)
- The architecture overview
- How to add new features (create module, add events, add constants, wire in Game.js)
- **Recommend running `/game-creator:design-game`** to do a visual design pass — the scaffolded game is functional but visually flat, and the designer will add atmosphere, polish, and game feel (sky gradients, clouds, particles, screen transitions, juice effects, etc.)
