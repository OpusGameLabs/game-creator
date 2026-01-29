import Phaser from 'phaser';
import { PLAYER, GAME } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    // Create a colored rectangle as the player sprite
    const rect = scene.add.rectangle(0, 0, PLAYER.WIDTH, PLAYER.HEIGHT, PLAYER.COLOR);
    this.sprite = scene.physics.add.existing(
      scene.add.container(PLAYER.START_X, PLAYER.START_Y, [rect])
    );

    this.sprite.body.setSize(PLAYER.WIDTH, PLAYER.HEIGHT);
    this.sprite.body.setCollideWorldBounds(true);
  }

  update(left, right, jump) {
    const body = this.sprite.body;

    // Horizontal movement
    if (left) {
      body.setVelocityX(-PLAYER.SPEED);
    } else if (right) {
      body.setVelocityX(PLAYER.SPEED);
    } else {
      body.setVelocityX(0);
    }

    // Jump
    if (jump && body.blocked.down) {
      body.setVelocityY(PLAYER.JUMP_VELOCITY);
      eventBus.emit(Events.PLAYER_JUMP);
    }
  }

  reset() {
    this.sprite.setPosition(PLAYER.START_X, PLAYER.START_Y);
    this.sprite.body.setVelocity(0, 0);
  }

  destroy() {
    this.sprite.destroy();
  }
}
