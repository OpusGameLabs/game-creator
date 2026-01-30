import Phaser from 'phaser';
import { XP, PLAYER } from '../core/Constants.js';

export class XpGem {
  constructor(scene, x, y, amount) {
    this.scene = scene;
    this.amount = amount;
    this.collected = false;

    const isBig = amount >= 3;
    const color = isBig ? XP.GEM_COLOR_BIG : XP.GEM_COLOR;
    const size = isBig ? XP.GEM_SIZE + 2 : XP.GEM_SIZE;

    const texKey = `gem-${isBig ? 'big' : 'small'}`;
    if (!scene.textures.exists(texKey)) {
      const gfx = scene.add.graphics();
      // Diamond shape
      gfx.fillStyle(color, 1);
      gfx.fillRect(size, 0, size, size);
      gfx.fillRect(0, size, size, size);
      gfx.fillRect(size, size * 2, size, size);
      gfx.fillRect(size * 2, size, size, size);
      gfx.fillStyle(0xffffff, 0.4);
      gfx.fillRect(size, 0, size / 2, size / 2);
      gfx.generateTexture(texKey, size * 3, size * 3);
      gfx.destroy();
    }

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
