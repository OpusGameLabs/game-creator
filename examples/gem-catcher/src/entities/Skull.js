import Phaser from 'phaser';
import { SKULL } from '../core/Constants.js';
import { renderSpriteSheet } from '../core/PixelRenderer.js';
import { SKULL_FRAMES, SKULL_PALETTE } from '../sprites/skull.js';

export class Skull extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, fallSpeed) {
    const sheetKey = 'skull-sheet';
    const scale = SKULL.PIXEL_SCALE;

    // Render the spritesheet if not already cached
    renderSpriteSheet(scene, SKULL_FRAMES, SKULL_PALETTE, sheetKey, scale);

    // Create animation if not already cached
    if (!scene.anims.exists('skull-glow')) {
      scene.anims.create({
        key: 'skull-glow',
        frames: scene.anims.generateFrameNumbers(sheetKey, {
          start: 0,
          end: SKULL_FRAMES.length - 1,
        }),
        frameRate: 3,
        repeat: -1,
      });
    }

    super(scene, x, y, sheetKey, 0);
    scene.add.existing(this);

    // Scale sprite to match desired SKULL.SIZE
    const frameW = SKULL_FRAMES[0][0].length * scale;
    const displayScale = SKULL.SIZE / frameW;
    this.setScale(displayScale);

    // Play glow animation
    this.play('skull-glow');

    // Enable physics
    scene.physics.add.existing(this);
    const frameH = SKULL_FRAMES[0].length * scale;
    this.body.setSize(frameW * 0.75, frameH * 0.75);
    this.body.setOffset(frameW * 0.125, frameH * 0.125);
    this.body.setAllowGravity(false);
    this.body.setVelocityY(fallSpeed);

    // Add a sinister wobble tween
    scene.tweens.add({
      targets: this,
      angle: { from: -8, to: 8 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
