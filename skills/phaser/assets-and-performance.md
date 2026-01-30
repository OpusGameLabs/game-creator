# Assets & Performance

## Texture Atlases

Always pack sprites into atlases instead of loading individual images:

```typescript
// Bad: individual images (one draw call each)
this.load.image('player', 'assets/player.png');
this.load.image('enemy', 'assets/enemy.png');
this.load.image('coin', 'assets/coin.png');

// Good: single atlas (one draw call for all)
this.load.atlas('sprites', 'assets/atlases/sprites.png', 'assets/atlases/sprites.json');
```

Create atlases with TexturePacker or free-tex-packer. Export as **JSON Hash** format.

```typescript
// Using atlas frames
this.add.image(100, 100, 'sprites', 'player-idle');
this.add.sprite(200, 200, 'sprites', 'enemy-walk-01');
```

## Atlas Animations

```typescript
// In Preloader or Boot scene
this.anims.create({
    key: 'player-walk',
    frames: this.anims.generateFrameNames('sprites', {
        prefix: 'player-walk-',
        start: 1,
        end: 8,
        zeroPad: 2,
    }),
    frameRate: 12,
    repeat: -1,
});
```

## Object Pooling

Use Groups for anything created/destroyed frequently:

```typescript
const coins = this.physics.add.group({
    classType: Coin,
    maxSize: 20,
    runChildUpdate: true,
});

// Spawn
function spawnCoin(x: number, y: number) {
    const coin = coins.getFirstDead(false) as Coin | null;
    if (coin) {
        coin.activate(x, y);
    }
}

// Return to pool
function collectCoin(coin: Coin) {
    coin.setActive(false);
    coin.setVisible(false);
    coin.body!.enable = false;
}
```

## Update Loop Optimization

```typescript
// Bad: iterating all children
update() {
    this.enemies.getChildren().forEach(enemy => {
        (enemy as Enemy).update();
    });
}

// Good: only update active children
update() {
    this.enemies.getChildren()
        .filter(e => e.active)
        .forEach(enemy => (enemy as Enemy).update());
}

// Best: use runChildUpdate on the group and let Phaser handle it
// (automatically skips inactive children)
```

## Camera Culling

For large worlds, objects off-screen still render by default. Phaser automatically culls objects outside camera bounds for most game objects, but ensure it's working:

```typescript
// Set world bounds larger than camera
this.physics.world.setBounds(0, 0, 3200, 600);
this.cameras.main.setBounds(0, 0, 3200, 600);
this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
```

## Audio Best Practices

- Load `.ogg` with `.mp3` fallback: `this.load.audio('sfx', ['sfx.ogg', 'sfx.mp3'])`
- Use `this.sound.play('sfx', { volume: 0.5 })` for one-shots
- Use `this.sound.add('bgm', { loop: true })` for music
- Audio won't play until user interacts with the page (browser policy). Phaser handles this with its audio unlock system.

## BitmapText for Performance

`Phaser.GameObjects.Text` creates a canvas texture per instance. For frequently updated text (score, timers), use BitmapText:

```typescript
// In preload
this.load.bitmapFont('pixelfont', 'assets/fonts/pixel.png', 'assets/fonts/pixel.xml');

// In create
const score = this.add.bitmapText(16, 16, 'pixelfont', 'Score: 0', 24);
```

## Mobile Optimization

- Target 30fps if needed: `fps: { target: 30, forceSetTimeOut: true }` in game config
- Reduce particle counts by 50-75%
- Use simpler physics bodies (circles over polygons)
- Minimize texture swaps — pack everything into fewer atlases
- Use `Phaser.Scale.FIT` with `autoCenter` for responsive sizing
- Test on real devices, not just browser DevTools throttling

## Memory Management

- Remove event listeners in `shutdown()`:
  ```typescript
  this.events.on('shutdown', () => {
      this.game.events.off('custom-event', this.handler, this);
      this.registry.events.off('changedata-score', this.onScore, this);
  });
  ```
- Destroy objects you no longer need: `sprite.destroy()`
- Clear Groups: `group.clear(true, true)` (removes from scene and destroys)
- For scene restarts, Phaser automatically cleans up objects created via `this.add.*`

## Loading Screen

```typescript
export class Preloader extends Phaser.Scene {
    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.rectangle(width / 2, height / 2, 0, 30, 0xffffff);
        const progressBox = this.add.rectangle(width / 2, height / 2, 320, 30).setStrokeStyle(2, 0xffffff);

        this.load.on('progress', (value: number) => {
            progressBar.width = 300 * value;
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });

        // Load all game assets here...
    }
}
```
