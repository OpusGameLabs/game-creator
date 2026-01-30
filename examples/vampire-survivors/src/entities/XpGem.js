import Phaser from 'phaser';
import { XP, PLAYER } from '../core/Constants.js';
import { renderPixelArt } from '../core/PixelRenderer.js';
import { GEM_SMALL, GEM_BIG } from '../sprites/items.js';
import { PALETTE } from '../sprites/palette.js';

export class XpGem {
  constructor(scene, x, y, amount) {
    this.scene = scene;
    this.amount = amount;
    this.collected = false;

    const isBig = amount >= 3;
    const texKey = `gem-${isBig ? 'big' : 'small'}`;
    const pixels = isBig ? GEM_BIG : GEM_SMALL;
    renderPixelArt(scene, pixels, PALETTE, texKey, 2);

    this.sprite = scene.physics.add.sprite(x, y, texKey);
    this.sprite.body.setAllowGravity(false);
    this.sprite.setDepth(3);
    this.sprite.setData('gem', this);

    // Bob animation
    scene.tweens.add({
      targets: this.sprite,
      y: y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  magnetTo(playerX, playerY, delta) {
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < PLAYER.PICKUP_RADIUS) {
      const speed = XP.MAGNET_SPEED;
      this.sprite.setVelocity(
        (dx / dist) * speed,
        (dy / dist) * speed
      );
    }
  }

  collect() {
    this.collected = true;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 150,
      onComplete: () => this.sprite.destroy(),
    });
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
  }
}
