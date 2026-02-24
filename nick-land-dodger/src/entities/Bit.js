import Phaser from 'phaser';
import { BIT, COLORS, PX } from '../core/Constants.js';

/**
 * Bit entity — a falling text character with neon glow.
 * Renders as philosophical/binary characters (0, 1, infinity, Omega, etc.)
 * Used in an object pool by BitSpawner.
 */
export class Bit {
  constructor(scene) {
    this.scene = scene;
    this.active = false;

    // Pick a random character and color
    const char = Phaser.Utils.Array.GetRandom(BIT.CHARACTERS);
    const color = Phaser.Utils.Array.GetRandom(COLORS.NEON_COLORS);
    const size = Phaser.Math.Between(
      Math.round(BIT.MIN_SIZE),
      Math.round(BIT.MAX_SIZE)
    );

    // Create text display
    this.text = scene.add.text(0, 0, char, {
      fontSize: size + 'px',
      fontFamily: '"Courier New", Courier, monospace',
      color: color,
      fontStyle: 'bold',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: color,
        blur: 8 * PX,
        fill: true,
      },
    }).setOrigin(0.5);

    // Wrap in physics container
    this.container = scene.physics.add.existing(
      scene.add.container(0, -100, [this.text])
    );

    // Size the physics body to text bounds
    const bodySize = size * 0.8;
    this.container.body.setSize(bodySize, bodySize);
    this.container.body.setOffset(-bodySize / 2, -bodySize / 2);
    this.container.body.setAllowGravity(false);

    // Start inactive
    this.deactivate();
  }

  /**
   * Activate this bit at a position with a given fall speed.
   */
  activate(x, y, fallSpeed) {
    this.active = true;
    this._dodgeCounted = false; // Reset dodge tracking flag
    this._dissolvePlayed = false; // Reset dissolve effect flag
    this.container.setPosition(x, y);
    this.container.setVisible(true);
    this.container.body.enable = true;
    this.container.body.setVelocityY(fallSpeed);
    this.container.setAlpha(1);
    this.container.setScale(1);

    // Randomize character and color on reuse
    const char = Phaser.Utils.Array.GetRandom(BIT.CHARACTERS);
    const color = Phaser.Utils.Array.GetRandom(COLORS.NEON_COLORS);
    this.text.setText(char);
    this.text.setColor(color);
    this.text.setShadow(0, 0, color, 8 * PX, true);

    // Slight random rotation for visual variety
    this.container.setAngle(Phaser.Math.Between(-15, 15));
  }

  /**
   * Deactivate and return to pool.
   */
  deactivate() {
    this.active = false;
    this._dodgeCounted = false;
    this._dissolvePlayed = false;
    this.container.setVisible(false);
    this.container.body.enable = false;
    this.container.body.setVelocity(0, 0);
    this.container.setPosition(0, -200);
  }

  /**
   * Update fall speed (called when acceleration changes).
   */
  setFallSpeed(speed) {
    if (this.active) {
      this.container.body.setVelocityY(speed);
    }
  }
}
