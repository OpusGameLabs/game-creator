# Game-Creator Conventions

These conventions are **mandatory** for all games built with the game-creator plugin. They ensure consistent architecture, clean restarts, and maintainability — especially important for beginners.

## Directory Structure

Every game MUST use a `core/` directory for foundational modules:

```
src/
├── core/
│   ├── EventBus.ts        # Singleton event bus (see below)
│   ├── GameState.ts       # Centralized state with reset()
│   └── Constants.ts       # ALL config values — zero hardcoded numbers
├── scenes/
│   ├── Boot.ts            # Minimal setup, start Game scene
│   ├── Preloader.ts       # Load all assets, show progress bar
│   ├── Game.ts            # Main gameplay (starts immediately, no title screen)
│   └── GameOver.ts        # End screen with restart
├── objects/               # Game entities (Player, Enemy, etc.)
├── systems/               # Managers and subsystems
├── ui/                    # UI components (buttons, bars, dialogs)
├── audio/                 # Audio manager, music patterns, SFX
├── config.ts              # Phaser.Types.Core.GameConfig
└── main.ts                # Entry point
```

## 1. EventBus Singleton (Non-Negotiable)

All cross-scene and cross-system communication goes through a single EventBus. Scenes and systems **never** import or reference each other directly.

```typescript
// src/core/EventBus.ts
import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

// Event name constants — use domain:action naming
export const Events = {
    // Player domain
    PLAYER_JUMP: 'player:jump',
    PLAYER_DIED: 'player:died',
    PLAYER_DAMAGED: 'player:damaged',

    // Score domain
    SCORE_CHANGED: 'score:changed',

    // Game domain
    GAME_START: 'game:start',
    GAME_OVER: 'game:over',
    GAME_RESTART: 'game:restart',

    // Audio domain
    AUDIO_INIT: 'audio:init',
    MUSIC_PLAY: 'music:play',
    MUSIC_STOP: 'music:stop',
    SFX_PLAY: 'sfx:play',
} as const;
```

**Rules:**
- Event names use `domain:action` format (e.g., `player:died`, `score:changed`)
- Define all events as constants in `Events` — never use string literals
- Always clean up listeners in scene `shutdown()`

```typescript
// Usage
import { EventBus, Events } from '../core/EventBus';

// Subscribe (store reference for cleanup)
const handler = (data: { score: number }) => { /* ... */ };
EventBus.on(Events.SCORE_CHANGED, handler, this);

// Emit
EventBus.emit(Events.SCORE_CHANGED, { score: 100 });

// Cleanup in shutdown
EventBus.off(Events.SCORE_CHANGED, handler, this);
```

## 2. GameState Singleton (Non-Negotiable)

A single centralized state object. Systems read from it. Events trigger mutations. Must have `reset()` for clean restarts.

```typescript
// src/core/GameState.ts
import { PLAYER, GAME_DEFAULTS } from './Constants';

class GameState {
    // Player state
    score = 0;
    bestScore = 0;
    health = PLAYER.MAX_HEALTH;
    lives = PLAYER.STARTING_LIVES;

    // Game state
    started = false;
    paused = false;
    gameOver = false;
    level = 1;

    reset() {
        this.score = 0;
        this.health = PLAYER.MAX_HEALTH;
        this.lives = PLAYER.STARTING_LIVES;
        this.started = false;
        this.paused = false;
        this.gameOver = false;
        this.level = 1;
        // Note: bestScore persists across resets
    }
}

export const gameState = new GameState();
```

**Rules:**
- One instance, exported as a singleton
- `reset()` restores defaults for a clean restart (preserve high scores / persistent data)
- State values come from Constants — no hardcoded defaults
- Systems read state directly but mutate via methods or events

## 3. Constants File (Non-Negotiable)

Every magic number, color, timing, speed, size, and config value lives here. **Zero hardcoded values in game logic.**

```typescript
// src/core/Constants.ts

// Game canvas
export const GAME = {
    WIDTH: 800,
    HEIGHT: 600,
    GRAVITY: 300,
    BACKGROUND_COLOR: '#1a1a2e',
};

// Player tuning
export const PLAYER = {
    SPEED: 200,
    JUMP_FORCE: -450,
    MAX_HEALTH: 100,
    STARTING_LIVES: 3,
    INVULNERABLE_MS: 500,
    SPRITE_KEY: 'player',
};

// Enemy tuning
export const ENEMY = {
    SPEED: 80,
    POOL_SIZE: 10,
    SCORE_VALUE: 100,
    SPRITE_KEY: 'enemy',
};

// UI
export const UI = {
    FONT_SIZE: '24px',
    FONT_COLOR: '#ffffff',
    PADDING: 16,
};

// Colors (hex numbers for Phaser tints/fills)
export const COLORS = {
    DAMAGE_TINT: 0xff0000,
    PLATFORM: 0x4a4a4a,
    HEALTH_BAR: 0x00ff00,
    HEALTH_BG: 0x333333,
};
```

**Rules:**
- Group by domain (PLAYER, ENEMY, GAME, UI, COLORS, AUDIO, etc.)
- Use SCREAMING_SNAKE for values, PascalCase for group names
- When tuning gameplay, you change ONE file — never hunt through game logic

## 4. When Adding Features (Checklist)

Follow this order every time you add a feature:

1. **Constants** — Add config values to `Constants.ts`
2. **Events** — Define new events in `EventBus.ts` using `domain:action` naming
3. **State** — Add fields to `GameState.ts` if the feature has persistent state
4. **Entity / System** — Create the implementation in `objects/` or `systems/`
5. **Scene wiring** — Connect it in the appropriate Scene
6. **Communication** — Talk to other systems ONLY through EventBus

Never skip steps 1-3. They keep the architecture clean as the game grows.

## 5. Scene Cleanup (Non-Negotiable)

Every scene that subscribes to EventBus events MUST clean up in `shutdown()`:

```typescript
export class Game extends Phaser.Scene {
    create() {
        EventBus.on(Events.PLAYER_DIED, this.onPlayerDied, this);
        this.events.on('shutdown', this.cleanup, this);
    }

    private cleanup() {
        EventBus.off(Events.PLAYER_DIED, this.onPlayerDied, this);
    }
}
```

Failing to clean up causes duplicate listeners on scene restart — a common source of bugs.

## 6. Restart Flow

Games must support clean restarts without page reload:

```typescript
// In GameOver scene
this.input.once('pointerdown', () => {
    gameState.reset();                    // Clean state
    EventBus.emit(Events.GAME_RESTART);   // Notify systems (audio, etc.)
    this.scene.start('Game');             // Restart
});
```

The `gameState.reset()` + EventBus notification pattern ensures all systems return to a clean state.
