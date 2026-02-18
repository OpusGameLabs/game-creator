# Scenes & Lifecycle

## Scene Lifecycle

```
init(data?) → preload() → create() → update(time, delta) [loop]
                                      shutdown() [on scene stop/restart]
```

| Method | Purpose |
|--------|---------|
| `init(data?)` | Receive data from scene transitions. Reset state here. |
| `preload()` | Load assets (prefer a dedicated Preloader scene instead). |
| `create()` | Create game objects, set up physics, bind events. |
| `update(time, delta)` | Game loop. Use `delta` for time-based movement. |
| `shutdown()` | Clean up listeners, timers, tweens when scene stops. |

## Basic Scene Template

```typescript
import Phaser from 'phaser';

export class Game extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('Game');
    }

    init(data: { level: number }) {
        // Receive data from scene transition
    }

    create() {
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Clean up on shutdown
        this.events.on('shutdown', this.shutdown, this);
    }

    update(_time: number, delta: number) {
        // Delegate to player's own update
        this.handleInput(delta);
    }

    private handleInput(delta: number) {
        const speed = 200;
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }
    }

    shutdown() {
        // Remove event listeners to prevent memory leaks
        this.events.off('shutdown', this.shutdown, this);
    }
}
```

## Preloader Pattern

Load all assets in a single Preloader scene to avoid per-scene loading:

```typescript
export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        // Progress bar
        const bar = this.add.rectangle(400, 300, 0, 30, 0xffffff);
        this.load.on('progress', (value: number) => {
            bar.width = 400 * value;
        });

        // Load everything
        this.load.atlas('sprites', 'assets/atlases/sprites.png', 'assets/atlases/sprites.json');
        this.load.audio('bgm', ['assets/audio/bgm.ogg', 'assets/audio/bgm.mp3']);
        this.load.tilemapTiledJSON('level1', 'assets/tilemaps/level1.json');
    }

    create() {
        this.scene.start('Game');
    }
}
```

## Scene Transitions

```typescript
// Start a new scene (stops current)
this.scene.start('Game', { level: 1 });

// Launch a scene in parallel (overlay)
this.scene.launch('HUD');

// Pause/resume
this.scene.pause('Game');
this.scene.resume('Game');

// Stop a scene
this.scene.stop('HUD');

// Restart current scene
this.scene.restart({ level: 2 });
```

## Parallel Scenes (UI Overlay)

Run HUD as a separate scene on top of gameplay:

```typescript
// In Game scene's create():
this.scene.launch('HUD');

// HUD scene listens for game events:
export class HUD extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;

    constructor() {
        super('HUD');
    }

    create() {
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px' });

        // Listen for score updates from Game scene
        this.registry.events.on('changedata-score', (_: unknown, value: number) => {
            this.scoreText.setText(`Score: ${value}`);
        });
    }
}
```

## Cross-Scene Communication

### Registry (shared data store)

```typescript
// Set in Game scene
this.registry.set('score', 100);

// Read in any scene
const score = this.registry.get('score');

// Listen for changes
this.registry.events.on('changedata-score', (_: unknown, value: number) => { ... });
```

### Game-level events

```typescript
// Emit from any scene
this.game.events.emit('player-died', { lives: 2 });

// Listen in another scene
this.game.events.on('player-died', (data: { lives: number }) => { ... });
```

### Direct scene access (use sparingly)

```typescript
const gameScene = this.scene.get('Game') as Game;
```

## Scene Sleep vs Stop

- `scene.sleep('Game')` — Pauses update but keeps objects in memory. Fast resume.
- `scene.stop('Game')` — Destroys scene objects. Clean restart with `scene.start()`.
- Use sleep for scenes you'll return to frequently (e.g., pause menu).
