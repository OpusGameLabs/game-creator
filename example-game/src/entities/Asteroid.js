import Phaser from 'phaser';
import { ASTEROID, GAME } from '../core/Constants.js';

/**
 * Individual asteroid object managed by the AsteroidPool.
 * Each asteroid is a physics sprite with a procedurally generated texture.
 */
export class Asteroid extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey) {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setActive(false);
    this.setVisible(false);

    // Track radius for collision sizing
    this.asteroidRadius = 0;
    // Track whether this asteroid has been scored (passed the bottom)
    this.scored = false;
  }

  launch(x, speed, radius) {
    this.asteroidRadius = radius;
    this.scored = false;

    this.setPosition(x, ASTEROID.SPAWN_Y);
    this.setActive(true);
    this.setVisible(true);

    // Scale the sprite to match the desired radius
    const baseSize = ASTEROID.MAX_RADIUS * 2;
    const scale = (radius * 2) / baseSize;
    this.setDisplaySize(radius * 2, radius * 2);

    // Set physics body to match visual size
    this.body.setCircle(this.width / 2);
    this.body.setOffset(0, 0);

    // Set downward velocity
    this.body.setVelocityY(speed);

    // Random slow rotation for visual variety
    this.rotationSpeed = Phaser.Math.FloatBetween(-0.02, 0.02);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (!this.active) return;

    // Rotate
    this.rotation += this.rotationSpeed * delta;

    // Check if asteroid has gone below the screen
    if (this.y > GAME.HEIGHT + this.asteroidRadius * 2) {
      this.deactivate();
    }
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.setVelocity(0, 0);
  }
}

/**
 * Generate a procedural asteroid texture.
 * Creates a jagged circular shape with some color variation.
 */
export function createAsteroidTexture(scene, key) {
  const size = Math.ceil(ASTEROID.MAX_RADIUS * 2);
  const cx = size / 2;
  const cy = size / 2;
  const baseR = size / 2 - 2;

  const g = scene.add.graphics();

  // Base color
  const color = Phaser.Utils.Array.GetRandom(ASTEROID.COLORS);
  g.fillStyle(color);

  // Draw jagged circle
  g.beginPath();
  const points = 12;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const jag = baseR * (0.75 + Math.random() * 0.25);
    const px = cx + Math.cos(angle) * jag;
    const py = cy + Math.sin(angle) * jag;
    if (i === 0) {
      g.moveTo(px, py);
    } else {
      g.lineTo(px, py);
    }
  }
  g.closePath();
  g.fillPath();

  // Add darker craters
  const darkerColor = Phaser.Display.Color.ValueToColor(color).darken(30).color;
  g.fillStyle(darkerColor, 0.6);
  const craters = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < craters; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * baseR * 0.5;
    const cr = baseR * (0.1 + Math.random() * 0.15);
    g.fillCircle(cx + Math.cos(a) * d, cy + Math.sin(a) * d, cr);
  }

  g.generateTexture(key, size, size);
  g.destroy();
}
