# Advanced Patterns

## ECS with bitECS

bitECS is a high-performance Entity Component System. Phaser 4 uses it internally.

```bash
npm install bitecs
```

```typescript
import { defineComponent, defineQuery, defineSystem, addEntity, addComponent, Types, createWorld } from 'bitecs';

// Components are pure data
const Position = defineComponent({ x: Types.f32, y: Types.f32 });
const Velocity = defineComponent({ x: Types.f32, y: Types.f32 });
const Health = defineComponent({ current: Types.ui16, max: Types.ui16 });

// Queries select entities with specific components
const movementQuery = defineQuery([Position, Velocity]);

// Systems operate on queried entities
const movementSystem = defineSystem((world) => {
    const entities = movementQuery(world);
    for (const eid of entities) {
        Position.x[eid] += Velocity.x[eid];
        Position.y[eid] += Velocity.y[eid];
    }
    return world;
});

// In your scene:
const world = createWorld();
const player = addEntity(world);
addComponent(world, Position, player);
addComponent(world, Velocity, player);
Position.x[player] = 400;
Position.y[player] = 300;

// In update:
movementSystem(world);
```

### Bridging bitECS with Phaser

Map ECS entities to Phaser sprites:

```typescript
const spriteMap = new Map<number, Phaser.GameObjects.Sprite>();

function createEnemy(world: any, scene: Phaser.Scene, x: number, y: number) {
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, Health, eid);

    Position.x[eid] = x;
    Position.y[eid] = y;
    Health.current[eid] = 100;
    Health.max[eid] = 100;

    const sprite = scene.add.sprite(x, y, 'sprites', 'enemy');
    spriteMap.set(eid, sprite);

    return eid;
}

// Render system syncs ECS data to Phaser sprites
const renderSystem = defineSystem((world) => {
    const entities = movementQuery(world);
    for (const eid of entities) {
        const sprite = spriteMap.get(eid);
        if (sprite) {
            sprite.setPosition(Position.x[eid], Position.y[eid]);
        }
    }
    return world;
});
```

## State Machine (Generic)

A reusable state machine for any entity:

```typescript
export class StateMachine<T> {
    private states = new Map<string, {
        enter?: (owner: T) => void;
        update?: (owner: T, delta: number) => void;
        exit?: (owner: T) => void;
    }>();
    private current?: string;
    private owner: T;

    constructor(owner: T) {
        this.owner = owner;
    }

    addState(name: string, config: {
        enter?: (owner: T) => void;
        update?: (owner: T, delta: number) => void;
        exit?: (owner: T) => void;
    }) {
        this.states.set(name, config);
        return this;
    }

    transition(name: string) {
        if (this.current === name) return;
        if (this.current) {
            this.states.get(this.current)?.exit?.(this.owner);
        }
        this.current = name;
        this.states.get(name)?.enter?.(this.owner);
    }

    update(delta: number) {
        if (this.current) {
            this.states.get(this.current)?.update?.(this.owner, delta);
        }
    }

    get currentState() { return this.current; }
}
```

Usage:

```typescript
const sm = new StateMachine(this.player);
sm.addState('idle', {
    enter: (p) => p.play('idle'),
    update: (p) => { if (p.cursors.left.isDown) sm.transition('walk'); },
})
.addState('walk', {
    enter: (p) => p.play('walk'),
    update: (p, delta) => { /* movement logic */ },
    exit: (p) => p.setVelocityX(0),
});
sm.transition('idle');
```

## Singleton Game Manager

For data that persists across scenes (settings, save data, analytics):

```typescript
export class GameManager {
    private static instance: GameManager;
    private game!: Phaser.Game;

    private constructor() {}

    static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    init(game: Phaser.Game) {
        this.game = game;
    }

    get registry() { return this.game.registry; }

    saveProgress(data: Record<string, unknown>) {
        localStorage.setItem('save', JSON.stringify(data));
    }

    loadProgress(): Record<string, unknown> | null {
        const raw = localStorage.getItem('save');
        return raw ? JSON.parse(raw) : null;
    }
}
```

Alternatively, use `this.game.registry` directly for simple cross-scene data — it's built in and doesn't need a custom class.

## Event Bus

Decouple systems with a shared event emitter:

```typescript
// src/systems/EventBus.ts
import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

// Producer (in any scene or object):
EventBus.emit('enemy-killed', { type: 'goblin', x: 100, y: 200 });

// Consumer (in another scene or system):
EventBus.on('enemy-killed', (data: { type: string; x: number; y: number }) => {
    spawnLoot(data.x, data.y);
    updateScore(data.type);
});

// Clean up in shutdown:
EventBus.off('enemy-killed', this.handler, this);
```

## Data-Driven Level Design

Use Tiled map editor for levels:

```typescript
// Load in Preloader
this.load.tilemapTiledJSON('level1', 'assets/tilemaps/level1.json');
this.load.image('tileset', 'assets/tilemaps/tileset.png');

// Create in Game scene
const map = this.make.tilemap({ key: 'level1' });
const tileset = map.addTilesetImage('tileset', 'tileset')!;
const ground = map.createLayer('Ground', tileset)!;
ground.setCollisionByProperty({ collides: true });

this.physics.add.collider(this.player, ground);

// Spawn objects from Tiled object layer
const spawnPoints = map.getObjectLayer('Spawns')!;
spawnPoints.objects.forEach(obj => {
    if (obj.type === 'enemy') {
        this.spawnEnemy(obj.x!, obj.y!);
    }
});
```

## Scene Plugin Pattern

For functionality shared across many scenes, create a Scene Plugin:

```typescript
export class AudioPlugin extends Phaser.Plugins.ScenePlugin {
    private music?: Phaser.Sound.BaseSound;

    boot() {
        this.systems!.events.on('shutdown', this.shutdown, this);
    }

    playMusic(key: string) {
        if (this.music) this.music.stop();
        this.music = this.scene!.sound.add(key, { loop: true });
        this.music.play();
    }

    shutdown() {
        this.music?.stop();
    }
}

// Register in game config:
plugins: {
    scene: [{ key: 'audio', plugin: AudioPlugin, mapping: 'audio' }],
}

// Use in any scene:
this.audio.playMusic('bgm');
```
