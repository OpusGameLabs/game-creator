# Game Objects

## Custom Game Objects

Extend Phaser's built-in classes to encapsulate behavior:

```typescript
import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
    private speed = 200;
    private health = 100;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprites', 'player-idle');

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.cursors = scene.input.keyboard!.createCursorKeys();
    }

    update(_time: number, _delta: number) {
        if (this.cursors.left.isDown) {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.body!.blocked.down) {
            this.setVelocityY(-400);
        }
    }

    takeDamage(amount: number) {
        this.health -= amount;
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.health <= 0) {
            this.emit('died');
            this.destroy();
        }
    }
}
```

## Registering with GameObjectFactory

Register custom objects so they can be created with `this.add.player(...)`:

```typescript
// At the bottom of Player.ts
Phaser.GameObjects.GameObjectFactory.register('player',
    function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number) {
        const player = new Player(this.scene, x, y);
        this.displayList.add(player);
        this.updateList.add(player);
        return player;
    }
);

// Usage in scene:
// this.add.player(400, 300);
```

## Groups (Object Pooling)

Use Groups to pool frequently created/destroyed objects:

```typescript
export class BulletGroup extends Phaser.Physics.Arcade.Group {
    constructor(scene: Phaser.Scene) {
        super(scene.physics.world, scene, {
            classType: Bullet,
            maxSize: 30,
            runChildUpdate: true,  // Calls update() on active children
            createCallback: (obj) => {
                const bullet = obj as Bullet;
                bullet.setActive(false);
                bullet.setVisible(false);
            },
        });
    }

    fire(x: number, y: number, direction: number) {
        const bullet = this.getFirstDead(false) as Bullet | null;
        if (bullet) {
            bullet.fire(x, y, direction);
        }
    }
}

class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprites', 'bullet');
    }

    fire(x: number, y: number, direction: number) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        this.body!.enable = true;
        this.setVelocityX(direction * 500);
    }

    update() {
        // Deactivate when off-screen
        if (this.x < -50 || this.x > 850) {
            this.setActive(false);
            this.setVisible(false);
            this.body!.enable = false;
        }
    }
}
```

## Containers

Use Containers to group related objects that move together:

```typescript
export class HealthBar extends Phaser.GameObjects.Container {
    private bar: Phaser.GameObjects.Rectangle;
    private bg: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.bg = scene.add.rectangle(0, 0, 50, 6, 0x333333);
        this.bar = scene.add.rectangle(0, 0, 50, 6, 0x00ff00);

        this.add([this.bg, this.bar]);
        scene.add.existing(this);
    }

    setPercent(value: number) {
        this.bar.width = 50 * Math.max(0, Math.min(1, value));
    }
}
```

**Container caveats:**
- Children of containers are not individually batched — this breaks WebGL batching
- Avoid nesting containers more than 1 level deep
- For large numbers of similar objects, use Groups instead
- Containers don't have physics bodies; add physics to children individually

## Choosing the Right Base Class

| Need | Use |
|------|-----|
| Static image | `Phaser.GameObjects.Image` |
| Animated sprite | `Phaser.GameObjects.Sprite` |
| Sprite with physics | `Phaser.Physics.Arcade.Sprite` |
| Group of related visuals | `Phaser.GameObjects.Container` |
| Many similar objects (pooling) | `Phaser.Physics.Arcade.Group` |
| Tilemap layer | `Phaser.Tilemaps.TilemapLayer` |
| Text | `Phaser.GameObjects.Text` (or BitmapText for performance) |
| Shapes | `Phaser.GameObjects.Rectangle`, `Circle`, etc. |

## Update Pattern

Game objects with custom `update()` methods need to be called explicitly unless they're in a Group with `runChildUpdate: true`:

```typescript
// Option 1: Call manually in scene update
update(time: number, delta: number) {
    this.player.update(time, delta);
}

// Option 2: Add to update list
this.sys.updateList.add(this.player);

// Option 3: Use Group with runChildUpdate
const enemies = this.add.group({ runChildUpdate: true });
```
