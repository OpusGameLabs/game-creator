import Phaser from 'phaser';
import { GEM } from '../core/Constants.js';
import { renderSpriteSheet } from '../core/PixelRenderer.js';
import { GEM_TYPES, GEM_TYPE_KEYS, GEM_PALETTE } from '../sprites/gems.js';

export class Gem extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, fallSpeed) {
    // Pick a random gem type
    const typeKey = Phaser.Utils.Array.GetRandom(GEM_TYPE_KEYS);
    const gemData = GEM_TYPES[typeKey];
    const texKey = gemData.key;
    const sheetKey = texKey + '-sheet';
    const scale = GEM.PIXEL_SCALE;

    // Render the spritesheet if not already cached
    renderSpriteSheet(scene, gemData.frames, GEM_PALETTE, sheetKey, scale);

    // Create animation if not already cached
    const animKey = typeKey + '-sparkle';
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(sheetKey, {
          start: 0,
          end: gemData.frames.length - 1,
        }),
        frameRate: gemData.animRate,
        repeat: -1,
      });
    }

    super(scene, x, y, sheetKey, 0);
    scene.add.existing(this);

    // Scale sprite to match desired GEM.SIZE
    const frameW = gemData.frames[0][0].length * scale;
    const displayScale = GEM.SIZE / frameW;
    this.setScale(displayScale);

    // Play sparkle animation
    this.play(animKey);

    // Enable physics
    scene.physics.add.existing(this);
    const frameH = gemData.frames[0].length * scale;
    this.body.setSize(frameW * 0.8, frameH * 0.8);
    this.body.setOffset(frameW * 0.1, frameH * 0.1);
    this.body.setAllowGravity(false);
    this.body.setVelocityY(fallSpeed);

    // Add a gentle bob tween for liveliness
    scene.tweens.add({
      targets: this,
      angle: { from: -5, to: 5 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
