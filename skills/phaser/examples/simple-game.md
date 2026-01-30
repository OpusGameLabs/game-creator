# Simple Game Example — Star Collector

A minimal complete Phaser game: collect falling stars, avoid bombs.

## src/main.ts

```typescript
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';

new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 300 } },
    },
    scene: [Preloader, Game, GameOver],
});
```

## src/scenes/Preloader.ts

```typescript
import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
    constructor() { super('Preloader'); }

    preload() {
        // In a real game, load an atlas. Here we create simple shapes.
        this.load.on('complete', () => this.createTextures());
    }

    private createTextures() {
        // Generate textures procedurally for this example
        const g = this.add.graphics();

        g.fillStyle(0x00ff00);
        g.fillRect(0, 0, 32, 48);
        g.generateTexture('player', 32, 48);

        g.clear().fillStyle(0xffff00);
        g.fillStar(16, 16, 5, 16, 8);
        g.generateTexture('star', 32, 32);

        g.clear().fillStyle(0xff0000);
        g.fillCircle(16, 16, 16);
        g.generateTexture('bomb', 32, 32);

        g.clear().fillStyle(0x4a4a4a);
        g.fillRect(0, 0, 800, 32);
        g.generateTexture('ground', 800, 32);

        g.destroy();
    }

    create() {
        this.scene.start('Game');
    }
}
```

## src/scenes/Game.ts

```typescript
import Phaser from 'phaser';

export class Game extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private stars!: Phaser.Physics.Arcade.Group;
    private bombs!: Phaser.Physics.Arcade.Group;
    private scoreText!: Phaser.GameObjects.Text;
    private score = 0;

    constructor() { super('Game'); }

    create() {
        this.score = 0;

        // Ground
        const ground = this.physics.add.staticImage(400, 584, 'ground');

        // Player
        this.player = this.physics.add.sprite(400, 450, 'player');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, ground);

        // Stars (pooled group)
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 65 },
        });
        this.stars.children.iterate((child) => {
            const star = child as Phaser.Physics.Arcade.Image;
            star.setBounceY(Phaser.Math.FloatBetween(0.2, 0.5));
            return true;
        });
        this.physics.add.collider(this.stars, ground);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);

        // Bombs
        this.bombs = this.physics.add.group();
        this.physics.add.collider(this.bombs, ground);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, undefined, this);

        // Input
        this.cursors = this.input.keyboard!.createCursorKeys();

        // UI
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '20px',
            color: '#ffffff',
        });
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body!.blocked.down) {
            this.player.setVelocityY(-400);
        }
    }

    private collectStar(
        _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
        star: Phaser.Types.Physics.Arcade.GameObjectWithBody
    ) {
        const s = star as Phaser.Physics.Arcade.Image;
        s.disableBody(true, true);

        this.score += 10;
        this.scoreText.setText(`Score: ${this.score}`);

        // All stars collected — spawn new wave + bomb
        if (this.stars.countActive(true) === 0) {
            this.stars.children.iterate((child) => {
                const c = child as Phaser.Physics.Arcade.Image;
                c.enableBody(true, c.x, 0, true, true);
                return true;
            });

            const x = Phaser.Math.Between(50, 750);
            const bomb = this.bombs.create(x, 16, 'bomb') as Phaser.Physics.Arcade.Image;
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }
    }

    private hitBomb() {
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.scene.start('GameOver', { score: this.score });
    }
}
```

## src/scenes/GameOver.ts

```typescript
import Phaser from 'phaser';

export class GameOver extends Phaser.Scene {
    constructor() { super('GameOver'); }

    create(data: { score: number }) {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        this.add.text(cx, cy - 50, 'GAME OVER', {
            fontSize: '48px',
            color: '#ff0000',
        }).setOrigin(0.5);

        this.add.text(cx, cy + 20, `Score: ${data.score}`, {
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);

        this.add.text(cx, cy + 80, 'Click to restart', {
            fontSize: '18px',
            color: '#aaaaaa',
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
```
