import Phaser from 'phaser';
import { PLAYER, GAME } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { renderSpriteSheet } from '../core/PixelRenderer.js';
import { PLAYER_FRAMES } from '../sprites/player.js';
import { PALETTE } from '../sprites/palette.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.invulnerable = false;

    // Generate pixel art spritesheet
    const scale = 2;
    renderSpriteSheet(scene, PLAYER_FRAMES, PALETTE, 'player-sheet', scale);

    if (!scene.anims.exists('player-walk')) {
      scene.anims.create({
        key: 'player-walk',
        frames: scene.anims.generateFrameNumbers('player-sheet', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    this.sprite = scene.physics.add.sprite(GAME.WORLD_WIDTH / 2, GAME.WORLD_HEIGHT / 2, 'player-sheet', 0);
    const bodySize = 16 * scale;
    this.sprite.body.setSize(bodySize, bodySize);
    this.sprite.body.setOffset((this.sprite.width - bodySize) / 2, (this.sprite.height - bodySize) / 2);
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

    // Play walk animation when moving, idle when still
    if (vx !== 0 || vy !== 0) {
      if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== 'player-walk') {
        this.sprite.play('player-walk');
      }
    } else {
      this.sprite.stop();
      this.sprite.setFrame(0);
    }
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
