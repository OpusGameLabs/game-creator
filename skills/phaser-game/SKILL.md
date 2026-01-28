---
name: phaser-game
description: Build 2D browser games with Phaser using scene-based architecture and centralized state. Use when creating a new 2D game, adding 2D game features, working with Phaser, or building sprite-based games.
---

# Phaser Game Development

You are an expert Phaser game developer. Follow these opinionated patterns when building 2D browser games.

## Tech Stack

- **Engine**: Phaser 3 (latest stable)
- **Build Tool**: Vite
- **Language**: JavaScript ES modules (no TypeScript unless requested)
- **Package Manager**: npm

## Project Setup

When scaffolding a new Phaser game:

```bash
mkdir <game-name> && cd <game-name>
npm init -y
npm install phaser
npm install -D vite
```

Create `vite.config.js`:

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { port: 3000, open: true },
  build: { outDir: 'dist' }
});
```

Add to `package.json` scripts:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Required Architecture

Every Phaser game MUST use this directory structure:

```
src/
├── core/
│   ├── GameConfig.js    # Phaser config object + game creation
│   ├── EventBus.js      # Singleton pub/sub (same pattern as 3D games)
│   ├── GameState.js     # Centralized state singleton
│   └── Constants.js     # ALL config values, balance numbers, asset paths
├── scenes/              # Phaser scenes
│   ├── BootScene.js     # Asset loading, progress bar
│   ├── MenuScene.js     # Main menu
│   ├── GameScene.js     # Main gameplay
│   ├── UIScene.js       # HUD overlay scene (runs parallel to GameScene)
│   └── GameOverScene.js # End screen
├── entities/            # Game objects
│   ├── Player.js        # Player sprite/physics
│   └── ...              # Enemies, projectiles, items, etc.
├── systems/             # Game systems
│   └── ...              # Spawning, scoring, waves, etc.
├── ui/                  # UI components
│   └── ...              # Buttons, health bars, dialogs
└── main.js              # Entry point
```

## Core Patterns (Non-Negotiable)

### 1. EventBus Singleton

Same EventBus pattern as Three.js games. ALL cross-scene and cross-system communication goes through EventBus. Scenes never reference each other directly.

```js
class EventBus {
  constructor() { this.listeners = new Map(); }
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }
  emit(event, data) {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach(cb => { try { cb(data); } catch (e) { console.error(`EventBus error [${event}]:`, e); } });
  }
  off(event, callback) {
    const cbs = this.listeners.get(event);
    if (cbs) { cbs.delete(callback); if (cbs.size === 0) this.listeners.delete(event); }
  }
  clear(event) { event ? this.listeners.delete(event) : this.listeners.clear(); }
}
export const eventBus = new EventBus();
export const Events = { /* domain:action constants */ };
```

### 2. Centralized GameState

```js
import { PLAYER_CONFIG } from './Constants.js';

class GameState {
  constructor() {
    this.player = { health: PLAYER_CONFIG.health, score: 0 };
    this.game = { started: false, paused: false, level: 1 };
  }
  reset() { /* restore defaults */ }
}
export const gameState = new GameState();
```

### 3. Constants File

```js
export const PLAYER_CONFIG = { health: 100, speed: 200, jumpForce: -400 };
export const ENEMY_CONFIG = { /* ... */ };
export const GAME_CONFIG = { width: 800, height: 600, gravity: 800 };
export const ASSET_KEYS = { /* sprite keys, audio keys */ };
```

### 4. Phaser Config

```js
import Phaser from 'phaser';
import { GAME_CONFIG } from './Constants.js';
import BootScene from '../scenes/BootScene.js';
import MenuScene from '../scenes/MenuScene.js';
import GameScene from '../scenes/GameScene.js';
import UIScene from '../scenes/UIScene.js';
import GameOverScene from '../scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  pixelArt: true,  // Enable for pixel art games (nearest-neighbor scaling)
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME_CONFIG.gravity },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

export default config;
```

## Scene Patterns

### Boot Scene (Asset Loading)

```js
export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  preload() {
    // Progress bar
    const bar = this.add.graphics();
    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0xffffff, 1);
      bar.fillRect(100, 290, 600 * value, 20);
    });
    // Load all assets here
    this.load.image('player', 'assets/player.png');
    this.load.spritesheet('player-run', 'assets/player-run.png', { frameWidth: 32, frameHeight: 32 });
    this.load.audio('bgm', 'assets/music.mp3');
  }
  create() { this.scene.start('MenuScene'); }
}
```

### Game Scene

```js
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  create() {
    this.player = new Player(this, 400, 300);
    // Launch UI scene in parallel
    this.scene.launch('UIScene');
    // Listen for events
    this.unsubscribers = [
      eventBus.on(Events.PLAYER_DIED, () => this.handleGameOver())
    ];
    gameState.game.started = true;
    gameState.game.paused = false;
  }
  update(time, delta) {
    if (gameState.game.paused) return;
    this.player.update(delta);
  }
  handleGameOver() {
    this.scene.stop('UIScene');
    this.scene.start('GameOverScene');
  }
  shutdown() {
    // Clean up event listeners
    this.unsubscribers.forEach(unsub => unsub());
  }
}
```

### UI Scene (Parallel Overlay)

Run the UI as a separate parallel scene so it overlays the game and has its own update loop:

```js
export default class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }
  create() {
    this.healthText = this.add.text(16, 16, '', { fontSize: '18px', fill: '#fff' });
    this.unsubscribers = [
      eventBus.on(Events.PLAYER_DAMAGED, () => this.updateHealth()),
      eventBus.on(Events.PLAYER_HEALED, () => this.updateHealth())
    ];
    this.updateHealth();
  }
  updateHealth() {
    this.healthText.setText(`HP: ${gameState.player.health}`);
  }
  shutdown() { this.unsubscribers.forEach(unsub => unsub()); }
}
```

## Entity Pattern

Extend `Phaser.GameObjects.Sprite` or `Phaser.Physics.Arcade.Sprite`:

```js
export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.cursors = scene.input.keyboard.createCursorKeys();
  }
  update(delta) {
    const speed = PLAYER_CONFIG.speed;
    this.setVelocityX(0);
    if (this.cursors.left.isDown) this.setVelocityX(-speed);
    else if (this.cursors.right.isDown) this.setVelocityX(speed);
    if (this.cursors.up.isDown && this.body.touching.down) {
      this.setVelocityY(PLAYER_CONFIG.jumpForce);
    }
  }
}
```

## Performance Rules

- **Use object pooling** via `Phaser.GameObjects.Group` for bullets, enemies, particles
- **Prefer spritesheets** over individual images
- **Use texture atlases** for complex sprite collections
- **Clean up event listeners** in scene `shutdown()`
- **Use Arcade physics** unless you specifically need Matter.js complexity
- **Set `pixelArt: true`** for pixel art games to avoid blurry scaling

## When Adding Features

1. Create entity in `entities/` or system in `systems/`
2. Define new events in `EventBus.js` Events enum
3. Add configuration to `Constants.js`
4. Add state to `GameState.js` if needed
5. Wire up in the appropriate Scene
6. Communicate with other systems ONLY through EventBus
