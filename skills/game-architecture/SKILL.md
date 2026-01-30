---
name: game-architecture
description: Game architecture patterns and best practices for browser games. Use when designing game systems, planning architecture, structuring a game project, or making architectural decisions about game code.
user-invocable: false
---

# Game Architecture Patterns

Reference knowledge for building well-structured browser games. These patterns apply to both Three.js (3D) and Phaser (2D) games.

## Core Principles

1. **Event-Driven Communication**: Modules never import each other for communication. All cross-module messaging goes through a singleton EventBus with predefined event constants.

2. **Centralized State**: A single GameState singleton holds all game state. Systems read state directly and modify it through events. No scattered state across modules.

3. **Configuration Centralization**: Every magic number, balance value, asset path, spawn point, and timing value goes in `Constants.js`. Game logic files contain zero hardcoded values.

4. **Orchestrator Pattern**: One `Game.js` class initializes all systems, manages game flow (menu -> loading -> gameplay -> death/win), and runs the main loop. Systems don't self-initialize.

5. **Clear Separation of Concerns**: Code is organized into functional layers:
   - `core/` - Foundation (Game, EventBus, GameState, Constants)
   - `systems/` - Engine-level systems (input, physics, audio, particles)
   - `gameplay/` - Game mechanics (player, enemies, weapons, scoring)
   - `level/` - World building (level construction, asset loading)
   - `ui/` - Interface (menus, HUD, overlays)

## Event System Design

### Event Naming Convention

Use `domain:action` format grouped by feature area:

```js
export const Events = {
  // Player
  PLAYER_DAMAGED: 'player:damaged',
  PLAYER_HEALED: 'player:healed',
  PLAYER_DIED: 'player:died',

  // Enemy
  ENEMY_SPAWNED: 'enemy:spawned',
  ENEMY_KILLED: 'enemy:killed',

  // Game flow
  GAME_STARTED: 'game:started',
  GAME_PAUSED: 'game:paused',
  GAME_OVER: 'game:over',

  // UI
  MENU_OPENED: 'menu:opened',
  SETTINGS_CHANGED: 'settings:changed',

  // System
  ASSETS_LOADED: 'assets:loaded',
  LOADING_PROGRESS: 'loading:progress'
};
```

### Event Data Contracts

Always pass structured data objects, never primitives:

```js
// Good
eventBus.emit(Events.PLAYER_DAMAGED, { amount: 10, source: 'enemy', damageType: 'melee' });

// Bad
eventBus.emit(Events.PLAYER_DAMAGED, 10);
```

## State Management

### GameState Structure

Organize state into clear domains:

```js
class GameState {
  constructor() {
    this.player = { health, maxHealth, speed, inventory, buffs };
    this.combat = { killCount, waveNumber, score };
    this.game = { started, paused, isPlaying, menuState };
  }
}
```

### Buff/Effect System

Use time-based buffs with multipliers:

```js
addBuff(stat, multiplier, durationSeconds) {
  this.player.buffs.push({
    stat, multiplier, duration: durationSeconds,
    endTime: Date.now() + durationSeconds * 1000
  });
}
updateBuffs() {
  this.player.buffs = this.player.buffs.filter(b => b.endTime > Date.now());
}
getBuffMultiplier(stat) {
  return this.player.buffs
    .filter(b => b.stat === stat || b.stat === 'all')
    .reduce((mult, b) => mult * b.multiplier, 1);
}
```

## Performance Patterns

### Object Pooling

Reuse temporary math objects in hot loops:

```js
// Module-level reusable objects
const _tempVec = new THREE.Vector3();
const _tempBox = new THREE.Box3();

update(delta) {
  // Reuse instead of creating new
  _tempVec.set(x, y, z);
}
```

For Phaser, use Group-based pooling:

```js
this.bulletPool = this.physics.add.group({
  classType: Bullet,
  maxSize: 50,
  runChildUpdate: true
});

fire() {
  const bullet = this.bulletPool.get(x, y);
  if (bullet) bullet.fire(direction);
}
```

### Delta Time

Always cap delta to prevent death spirals after tab-out:

```js
const delta = Math.min(clock.getDelta(), 0.1);
```

### Disposal

Clean up Three.js resources:

```js
// When removing objects
geometry.dispose();
material.dispose();
texture.dispose();
scene.remove(mesh);
```

Clean up Phaser event listeners:

```js
// Store unsubscribe functions
this.unsubs = [eventBus.on(Events.X, handler)];

// In shutdown
this.unsubs.forEach(fn => fn());
```

## Wave/Spawn System Pattern

For wave-based games, use configuration-driven scaling:

```js
export const WAVE_CONFIG = {
  initialSpawnInterval: 4,
  minSpawnInterval: 1.5,
  intervalReductionPerWave: 0.3,
  initialEnemiesPerWave: 6,
  enemiesIncreasePerWave: 2,
  maxEnemiesPerWave: 30,
  initialMaxConcurrent: 4,
  maxConcurrentPerWave: 1,
  maxConcurrentCap: 12
};
```

All wave difficulty math references these constants, never hardcoded numbers.

## Asset Management

- 3D models: GLB format (compact, single file)
- 2D sprites: Spritesheets or texture atlases
- Audio: MP3 for music, WAV/OGG for short SFX
- Put assets in `/public/` for Vite serving
- Show loading progress to the player
- Preload everything before gameplay starts

## Game Flow

Standard flow for both 2D and 3D games:

```
Boot/Load -> Main Menu -> Gameplay <-> Pause Menu
                                   -> Game Over -> Main Menu
```

Manage this through `gameState.game.menuState` which tracks the current flow state.

## Common Architecture Pitfalls

- **Unwired physics bodies** — Creating a static physics body (e.g., ground, wall) without wiring it to other bodies via `physics.add.collider()` or `physics.add.overlap()` has no gameplay effect. Every boundary or obstacle needs explicit collision wiring to the entities it should interact with. After creating any static body, immediately add the collider call.
- **Interactive elements blocked by overlapping display objects** — When building UI (buttons, menus), the topmost display object in the scene list receives pointer events. Never hide the interactive element behind a decorative layer. Either make the visual element itself interactive, or ensure nothing is rendered on top of the hit area.
