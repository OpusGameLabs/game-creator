import Phaser from 'phaser';
import { PLAYER, GAME } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { renderSpriteSheet } from '../core/PixelRenderer.js';
import { BASKET_FRAMES, BASKET_PALETTE } from '../sprites/player.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    const texKey = 'basket-sheet';
    const scale = PLAYER.PIXEL_SCALE;

    // Render the basket spritesheet (idle, left-tilt, idle, right-tilt)
    renderSpriteSheet(scene, BASKET_FRAMES, BASKET_PALETTE, texKey, scale);

    // Create animations
    if (!scene.anims.exists('basket-idle')) {
      scene.anims.create({
        key: 'basket-idle',
        frames: [{ key: texKey, frame: 0 }],
        frameRate: 1,
        repeat: 0,
      });
    }
    if (!scene.anims.exists('basket-left')) {
      scene.anims.create({
        key: 'basket-left',
        frames: [{ key: texKey, frame: 1 }],
        frameRate: 1,
        repeat: 0,
      });
    }
    if (!scene.anims.exists('basket-right')) {
      scene.anims.create({
        key: 'basket-right',
        frames: [{ key: texKey, frame: 3 }],
        frameRate: 1,
        repeat: 0,
      });
    }

    // Create physics-enabled sprite
    this.sprite = scene.physics.add.sprite(PLAYER.START_X, PLAYER.START_Y, texKey, 0);

    // Scale the sprite to match the desired PLAYER.WIDTH
    const frameW = BASKET_FRAMES[0][0].length * scale;
    const frameH = BASKET_FRAMES[0].length * scale;
    const displayScale = PLAYER.WIDTH / frameW;
    this.sprite.setScale(displayScale);

    // Adjust physics body to match the visible basket area
    const bodyW = PLAYER.WIDTH;
    const bodyH = frameH * displayScale * 0.65; // tighter body for the basket opening
    this.sprite.body.setSize(frameW * 0.85, frameH * 0.65);
    this.sprite.body.setOffset(frameW * 0.075, frameH * 0.2);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setCollideWorldBounds(true);

    this._lastDir = 'idle';
  }

  update(left, right) {
    const body = this.sprite.body;

    // Horizontal-only movement
    if (left) {
      body.setVelocityX(-PLAYER.SPEED);
      if (this._lastDir !== 'left') {
        this.sprite.play('basket-left');
        this._lastDir = 'left';
      }
    } else if (right) {
      body.setVelocityX(PLAYER.SPEED);
      if (this._lastDir !== 'right') {
        this.sprite.play('basket-right');
        this._lastDir = 'right';
      }
    } else {
      body.setVelocityX(0);
      if (this._lastDir !== 'idle') {
        this.sprite.play('basket-idle');
        this._lastDir = 'idle';
      }
    }

    // No vertical movement at all
    body.setVelocityY(0);
  }

  reset() {
    this.sprite.setPosition(PLAYER.START_X, PLAYER.START_Y);
    this.sprite.body.setVelocity(0, 0);
    this._lastDir = 'idle';
    this.sprite.play('basket-idle');
  }

  destroy() {
    this.sprite.destroy();
  }
}
