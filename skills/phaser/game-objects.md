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

### Mobile-Friendly Input Pattern

Instead of having the Player read keyboard input directly (via `this.cursors`), have the Scene build an `inputState` object from all sources (keyboard + touch + gamepad) and pass it to `player.update()`. This keeps Player input-source-agnostic:

```typescript
// In Scene update():
const inputState = {
  left: this.cursors.left.isDown || this.touchLeft,
  right: this.cursors.right.isDown || this.touchRight,
  jump: Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.touchJump,
};
this.player.update(time, delta, inputState);

// In Player.update():
update(_time: number, _delta: number, input: InputState) {
  if (input.left) {
    this.setVelocityX(-this.speed);
    this.setFlipX(true);
  } else if (input.right) {
    this.setVelocityX(this.speed);
    this.setFlipX(false);
  } else {
    this.setVelocityX(0);
  }
  if (input.jump && this.body!.blocked.down) {
    this.setVelocityY(-400);
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

## Button Pattern (Container + Graphics + Text)

Buttons require careful z-ordering. Use a Container holding Graphics (background) then Text (label) — in that order. The Container itself is interactive.

**ALWAYS use this exact pattern for clickable buttons.** Do not use Zone, do not draw Graphics on top of Text, and do not set interactivity on anything other than the Container.

```js
createButton(scene, x, y, label, callback) {
  const btnW = Math.max(GAME.WIDTH * UI.BTN_W_RATIO, 160);
  const btnH = Math.max(GAME.HEIGHT * UI.BTN_H_RATIO, UI.MIN_TOUCH);
  const radius = UI.BTN_RADIUS;

  const container = scene.add.container(x, y);

  // 1. Graphics background (added FIRST — renders behind text)
  const bg = scene.add.graphics();
  bg.fillStyle(COLORS.BTN_PRIMARY, 1);
  bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
  container.add(bg);

  // 2. Text label (added SECOND — renders on top of background)
  const fontSize = Math.round(GAME.HEIGHT * UI.BODY_RATIO);
  const text = scene.add.text(0, 0, label, {
    fontSize: fontSize + 'px',
    fontFamily: UI.FONT,
    color: COLORS.BTN_TEXT,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(text);

  // 3. Make the CONTAINER interactive (not the graphics or text)
  container.setSize(btnW, btnH);
  container.setInteractive({ useHandCursor: true });

  const fillBtn = (gfx, color) => {
    gfx.clear();
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, radius);
  };

  container.on('pointerover', () => {
    fillBtn(bg, COLORS.BTN_PRIMARY_HOVER);
    scene.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 });
  });
  container.on('pointerout', () => {
    fillBtn(bg, COLORS.BTN_PRIMARY);
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
  });
  container.on('pointerdown', () => {
    fillBtn(bg, COLORS.BTN_PRIMARY_PRESS);
    container.setScale(0.95);
  });
  container.on('pointerup', () => {
    container.setScale(1);
    callback();
  });

  return container;
}
```

**Broken patterns** (do NOT use):
- Drawing Graphics on top of Text (hides the label)
- Using a Zone for interactivity with Graphics drawn over it (Zone becomes unreachable)
- Setting `setAlpha(0)` on an interactive object and layering visuals over it
