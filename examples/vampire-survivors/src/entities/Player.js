import Phaser from 'phaser';
import { PLAYER, GAME } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.invulnerable = false;

    // Generate texture
    const gfx = scene.add.graphics();
    // Body circle
    gfx.fillStyle(PLAYER.COLOR, 1);
    gfx.fillCircle(PLAYER.SIZE, PLAYER.SIZE, PLAYER.SIZE);
    // Lighter inner
    gfx.fillStyle(PLAYER.COLOR_LIGHT, 1);
    gfx.fillCircle(PLAYER.SIZE - 3, PLAYER.SIZE - 3, PLAYER.SIZE * 0.5);
    gfx.generateTexture('player', PLAYER.SIZE * 2, PLAYER.SIZE * 2);
    gfx.destroy();

    this.sprite = scene.physics.add.sprite(GAME.WORLD_WIDTH / 2, GAME.WORLD_HEIGHT / 2, 'player');
    this.sprite.setCircle(PLAYER.SIZE);
    this.sprite.setDepth(10);
    this.sprite.body.setCollideWorldBounds(true);

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update() {
    const speed = PLAYER.SPEED;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const diag = Math.SQRT1_2;
      vx *= diag;
      vy *= diag;
    }

    this.sprite.setVelocity(vx * speed, vy * speed);

    // Flip sprite based on direction
    if (vx < 0) this.sprite.setFlipX(true);
    else if (vx > 0) this.sprite.setFlipX(false);
  }

  takeDamage(amount) {
    if (this.invulnerable || gameState.gameOver) return;

    this.invulnerable = true;
    const dead = gameState.takeDamage(amount);

    eventBus.emit(Events.PLAYER_DAMAGED, { hp: gameState.hp, maxHp: gameState.maxHp });
    eventBus.emit(Events.PARTICLES_EMIT, { type: 'playerHit', x: this.sprite.x, y: this.sprite.y });

    // Flash effect
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: PLAYER.INVULN_FLASH_RATE,
      yoyo: true,
      repeat: Math.floor(PLAYER.INVULN_DURATION / (PLAYER.INVULN_FLASH_RATE * 2)),
      onComplete: () => {
        this.sprite.setAlpha(1);
        this.invulnerable = false;
      },
    });

    if (dead) {
      eventBus.emit(Events.PLAYER_DIED);
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}
