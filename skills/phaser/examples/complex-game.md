# Complex Game Example — Platformer with Advanced Patterns

A multi-scene platformer demonstrating state machines, object pooling, event bus, centralized state, and data-driven design — following all [game-creator conventions](../conventions.md).

## Architecture

```
src/
├── core/
│   ├── EventBus.ts
│   ├── GameState.ts
│   └── Constants.ts
├── scenes/
│   ├── Boot.ts
│   ├── Preloader.ts
│   ├── Game.ts
│   ├── HUD.ts
│   └── GameOver.ts
├── objects/
│   ├── Player.ts
│   └── EnemyGroup.ts
├── systems/
│   └── StateMachine.ts
├── config.ts
└── main.ts
```

## src/core/Constants.ts

```typescript
// Every tunable value lives here — zero hardcoded numbers in game logic

export const GAME = {
    WIDTH: 800,
    HEIGHT: 600,
    GRAVITY: 300,
    WORLD_WIDTH: 1600,
    BACKGROUND_COLOR: '#1a1a2e',
};

export const PLAYER = {
    SPEED: 200,
    JUMP_FORCE: 450,
    AIR_CONTROL: 0.8,
    MAX_HEALTH: 3,
    INVULNERABLE_MS: 500,
    HURT_BOUNCE_Y: -200,
    STOMP_BOUNCE_Y: -250,
    BODY_WIDTH: 20,
    BODY_HEIGHT: 40,
    SPAWN_X: 100,
    SPAWN_Y: 400,
};

export const ENEMY = {
    SPEED: 80,
    POOL_SIZE: 10,
    SCORE_VALUE: 100,
    STOMP_THRESHOLD: 20,
};

export const UI = {
    FONT_SIZE: '20px',
    FONT_COLOR: '#ffffff',
    HEALTH_COLOR: '#ff4444',
    PADDING: 16,
    LINE_HEIGHT: 28,
};

export const COLORS = {
    DAMAGE_TINT: 0xff0000,
    PLATFORM: 0x4a4a4a,
};

export const CAMERA = {
    LERP: 0.1,
};
```

## src/core/EventBus.ts

```typescript
import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

export const Events = {
    // Player domain
    PLAYER_HEALTH: 'player:health',
    PLAYER_DIED: 'player:died',

    // Enemy domain
    ENEMY_KILLED: 'enemy:killed',

    // Score domain
    SCORE_CHANGED: 'score:changed',

    // Game domain
    GAME_OVER: 'game:over',
    GAME_RESTART: 'game:restart',
} as const;
```

## src/core/GameState.ts

```typescript
import { PLAYER } from './Constants';

class GameState {
    score = 0;
    bestScore = 0;
    health = PLAYER.MAX_HEALTH;
    started = false;
    gameOver = false;

    reset() {
        this.score = 0;
        this.health = PLAYER.MAX_HEALTH;
        this.started = false;
        this.gameOver = false;
        // bestScore persists across resets
    }
}

export const gameState = new GameState();
```

## src/systems/StateMachine.ts

```typescript
interface StateConfig<T> {
    enter?: (owner: T) => void;
    update?: (owner: T, delta: number) => void;
    exit?: (owner: T) => void;
}

export class StateMachine<T> {
    private states = new Map<string, StateConfig<T>>();
    private current?: string;
    private owner: T;

    constructor(owner: T) {
        this.owner = owner;
    }

    addState(name: string, config: StateConfig<T>): this {
        this.states.set(name, config);
        return this;
    }

    transition(name: string) {
        if (this.current === name) return;
        if (this.current) this.states.get(this.current)?.exit?.(this.owner);
        this.current = name;
        this.states.get(name)?.enter?.(this.owner);
    }

    update(delta: number) {
        if (this.current) this.states.get(this.current)?.update?.(this.owner, delta);
    }

    get currentState() { return this.current; }
}
```

## src/objects/Player.ts

```typescript
import Phaser from 'phaser';
import { StateMachine } from '../systems/StateMachine';
import { EventBus, Events } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { PLAYER, COLORS } from '../core/Constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
    readonly sm: StateMachine<Player>;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private invulnerable = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprites', 'player-idle-01');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.body!.setSize(PLAYER.BODY_WIDTH, PLAYER.BODY_HEIGHT);
        this.cursors = scene.input.keyboard!.createCursorKeys();

        this.sm = new StateMachine<Player>(this);
        this.sm
            .addState('idle', {
                enter: (p) => p.play('player-idle'),
                update: (p) => {
                    if (p.cursors.left.isDown || p.cursors.right.isDown) p.sm.transition('walk');
                    if (p.cursors.up.isDown && p.isGrounded()) p.sm.transition('jump');
                },
            })
            .addState('walk', {
                enter: (p) => p.play('player-walk'),
                update: (p) => {
                    if (p.cursors.left.isDown) {
                        p.setVelocityX(-PLAYER.SPEED);
                        p.setFlipX(true);
                    } else if (p.cursors.right.isDown) {
                        p.setVelocityX(PLAYER.SPEED);
                        p.setFlipX(false);
                    } else {
                        p.sm.transition('idle');
                    }
                    if (p.cursors.up.isDown && p.isGrounded()) p.sm.transition('jump');
                },
                exit: (p) => p.setVelocityX(0),
            })
            .addState('jump', {
                enter: (p) => {
                    p.setVelocityY(-PLAYER.JUMP_FORCE);
                    p.play('player-jump');
                },
                update: (p) => {
                    if (p.cursors.left.isDown) p.setVelocityX(-PLAYER.SPEED * PLAYER.AIR_CONTROL);
                    else if (p.cursors.right.isDown) p.setVelocityX(PLAYER.SPEED * PLAYER.AIR_CONTROL);
                    if (p.isGrounded()) p.sm.transition('idle');
                },
            })
            .addState('hurt', {
                enter: (p) => {
                    p.invulnerable = true;
                    p.setTint(COLORS.DAMAGE_TINT);
                    p.setVelocityY(PLAYER.HURT_BOUNCE_Y);
                    p.scene.time.delayedCall(PLAYER.INVULNERABLE_MS, () => {
                        p.clearTint();
                        p.invulnerable = false;
                        p.sm.transition('idle');
                    });
                },
            });

        this.sm.transition('idle');
    }

    isGrounded(): boolean {
        return this.body!.blocked.down;
    }

    takeDamage() {
        if (this.invulnerable) return;
        gameState.health--;
        EventBus.emit(Events.PLAYER_HEALTH, gameState.health);

        if (gameState.health <= 0) {
            gameState.gameOver = true;
            EventBus.emit(Events.PLAYER_DIED);
            this.destroy();
        } else {
            this.sm.transition('hurt');
        }
    }

    update(_time: number, delta: number) {
        this.sm.update(delta);
    }
}
```

## src/objects/EnemyGroup.ts

```typescript
import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { ENEMY } from '../core/Constants';

class Enemy extends Phaser.Physics.Arcade.Sprite {
    private direction = 1;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprites', 'enemy-idle');
    }

    activate(x: number, y: number) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body!.enable = true;
        this.direction = Phaser.Math.Between(0, 1) ? 1 : -1;
        this.setVelocityX(ENEMY.SPEED * this.direction);
    }

    update() {
        if (!this.active) return;
        if (this.body!.blocked.left) this.direction = 1;
        if (this.body!.blocked.right) this.direction = -1;
        this.setVelocityX(ENEMY.SPEED * this.direction);
        this.setFlipX(this.direction < 0);
    }

    die() {
        this.setActive(false);
        this.setVisible(false);
        this.body!.enable = false;
        EventBus.emit(Events.ENEMY_KILLED, { x: this.x, y: this.y });
    }
}

export class EnemyGroup extends Phaser.Physics.Arcade.Group {
    constructor(scene: Phaser.Scene) {
        super(scene.physics.world, scene, {
            classType: Enemy,
            maxSize: ENEMY.POOL_SIZE,
            runChildUpdate: true,
        });
    }

    spawn(x: number, y: number) {
        const enemy = this.getFirstDead(true, x, y) as Enemy | null;
        if (enemy) enemy.activate(x, y);
    }
}
```

## src/scenes/Game.ts

```typescript
import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { EnemyGroup } from '../objects/EnemyGroup';
import { EventBus, Events } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { GAME, PLAYER, ENEMY, COLORS, CAMERA } from '../core/Constants';

export class Game extends Phaser.Scene {
    private player!: Player;
    private enemies!: EnemyGroup;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;

    constructor() { super('Game'); }

    create() {
        gameState.reset();
        gameState.started = true;

        // Launch HUD as parallel scene
        this.scene.launch('HUD');

        // Create level
        this.platforms = this.physics.add.staticGroup();
        this.createLevel();

        // Player
        this.player = new Player(this, PLAYER.SPAWN_X, PLAYER.SPAWN_Y);

        // Enemies (pooled)
        this.enemies = new EnemyGroup(this);
        this.spawnEnemies();

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemyContact, undefined, this);

        // Camera
        this.cameras.main.startFollow(this.player, true, CAMERA.LERP, CAMERA.LERP);
        this.cameras.main.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.HEIGHT);
        this.physics.world.setBounds(0, 0, GAME.WORLD_WIDTH, GAME.HEIGHT);

        // Events
        EventBus.on(Events.PLAYER_DIED, this.onPlayerDied, this);
        this.events.on('shutdown', this.cleanup, this);
    }

    private createLevel() {
        // Data-driven: in a real game, load from Tiled JSON
        const levelData = [
            { x: 400, y: 584, w: 800 },
            { x: 1200, y: 584, w: 800 },
            { x: 600, y: 450, w: 200 },
            { x: 300, y: 320, w: 150 },
            { x: 900, y: 380, w: 250 },
        ];

        levelData.forEach(p => {
            const platform = this.add.rectangle(p.x, p.y, p.w, 32, COLORS.PLATFORM);
            this.platforms.add(platform);
        });
    }

    private spawnEnemies() {
        const spawnPoints = [
            { x: 500, y: 400 },
            { x: 800, y: 540 },
            { x: 1100, y: 540 },
        ];
        spawnPoints.forEach(sp => this.enemies.spawn(sp.x, sp.y));
    }

    private onPlayerEnemyContact(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        const e = enemy as any;
        // Stomp from above
        if (this.player.body!.velocity.y > 0 && this.player.y < e.y - ENEMY.STOMP_THRESHOLD) {
            e.die();
            this.player.setVelocityY(PLAYER.STOMP_BOUNCE_Y);
            gameState.score += ENEMY.SCORE_VALUE;
            EventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
        } else {
            this.player.takeDamage();
        }
    }

    private onPlayerDied() {
        gameState.bestScore = Math.max(gameState.bestScore, gameState.score);
        this.scene.stop('HUD');
        this.scene.start('GameOver');
    }

    update(time: number, delta: number) {
        this.player.update(time, delta);
    }

    private cleanup() {
        EventBus.off(Events.PLAYER_DIED, this.onPlayerDied, this);
    }
}
```

## src/scenes/HUD.ts

```typescript
import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { UI } from '../core/Constants';

export class HUD extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private healthText!: Phaser.GameObjects.Text;

    constructor() { super('HUD'); }

    create() {
        this.scoreText = this.add.text(UI.PADDING, UI.PADDING, 'Score: 0', {
            fontSize: UI.FONT_SIZE, color: UI.FONT_COLOR,
        });
        this.healthText = this.add.text(UI.PADDING, UI.PADDING + UI.LINE_HEIGHT, `Health: ${gameState.health}`, {
            fontSize: UI.FONT_SIZE, color: UI.HEALTH_COLOR,
        });

        EventBus.on(Events.SCORE_CHANGED, this.onScoreChange, this);
        EventBus.on(Events.PLAYER_HEALTH, this.onHealthChange, this);
        this.events.on('shutdown', this.cleanup, this);
    }

    private onScoreChange(data: { score: number }) {
        this.scoreText.setText(`Score: ${data.score}`);
    }

    private onHealthChange(health: number) {
        this.healthText.setText(`Health: ${health}`);
    }

    private cleanup() {
        EventBus.off(Events.SCORE_CHANGED, this.onScoreChange, this);
        EventBus.off(Events.PLAYER_HEALTH, this.onHealthChange, this);
    }
}
```

## src/scenes/GameOver.ts

```typescript
import Phaser from 'phaser';
import { EventBus, Events } from '../core/EventBus';
import { gameState } from '../core/GameState';
import { UI } from '../core/Constants';

export class GameOver extends Phaser.Scene {
    constructor() { super('GameOver'); }

    create() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        this.add.text(cx, cy - 50, 'GAME OVER', {
            fontSize: '48px', color: '#ff0000',
        }).setOrigin(0.5);

        this.add.text(cx, cy + 20, `Score: ${gameState.score}`, {
            fontSize: UI.FONT_SIZE, color: UI.FONT_COLOR,
        }).setOrigin(0.5);

        if (gameState.bestScore > 0) {
            this.add.text(cx, cy + 60, `Best: ${gameState.bestScore}`, {
                fontSize: UI.FONT_SIZE, color: '#ffff00',
            }).setOrigin(0.5);
        }

        this.add.text(cx, cy + 110, 'Click to restart', {
            fontSize: '18px', color: '#aaaaaa',
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            EventBus.emit(Events.GAME_RESTART);
            this.scene.start('Game');
        });
    }
}
```

## Key Patterns Demonstrated

1. **Constants** — Every tunable value in `Constants.ts`, zero hardcoded numbers in logic
2. **GameState** — Centralized state with `reset()` for clean restarts, `bestScore` persistence
3. **EventBus** — `domain:action` naming, typed event constants, all communication decoupled
4. **State Machine** — Player movement uses `StateMachine<Player>` for clean state transitions
5. **Object Pooling** — `EnemyGroup` pools enemies with `maxSize` and `getFirstDead()`
6. **Parallel Scenes** — HUD runs alongside Game as a UI overlay
7. **Cleanup** — All scenes remove EventBus listeners in `shutdown()`
8. **Data-Driven** — Level layout defined as data (would be Tiled JSON in production)
