import Phaser from 'phaser';
import { SHIP, GAME, COLORS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Ship {
  constructor(scene) {
    this.scene = scene;

    // Draw the ship shape procedurally
    const gfx = scene.add.graphics();
    this.drawShip(gfx);
    gfx.generateTexture('ship_tex', Math.ceil(SHIP.WIDTH), Math.ceil(SHIP.HEIGHT));
    gfx.destroy();

    // Create sprite from generated texture
    this.sprite = scene.physics.add.sprite(SHIP.START_X, SHIP.START_Y, 'ship_tex');
    this.sprite.setDisplaySize(SHIP.WIDTH, SHIP.HEIGHT);
    this.sprite.body.setCollideWorldBounds(true);
    // No gravity for the ship — it stays at the bottom
    this.sprite.body.setAllowGravity(false);
    // Shrink hitbox slightly for forgiving collision
    this.sprite.body.setSize(
      this.sprite.width * 0.7,
      this.sprite.height * 0.7
    );
  }

  drawShip(g) {
    const w = Math.ceil(SHIP.WIDTH);
    const h = Math.ceil(SHIP.HEIGHT);
    const cx = w / 2;

    // Main body (triangle-ish shape)
    g.fillStyle(SHIP.COLOR);
    g.beginPath();
    g.moveTo(cx, 0);                    // nose
    g.lineTo(w * 0.15, h * 0.85);       // bottom-left
    g.lineTo(w * 0.35, h * 0.7);        // inner-left
    g.lineTo(w * 0.65, h * 0.7);        // inner-right
    g.lineTo(w * 0.85, h * 0.85);       // bottom-right
    g.closePath();
    g.fillPath();

    // Cockpit
    g.fillStyle(COLORS.SHIP_COCKPIT);
    g.fillCircle(cx, h * 0.35, w * 0.1);

    // Engine glow
    g.fillStyle(COLORS.SHIP_ENGINE);
    g.fillTriangle(
      cx - w * 0.1, h * 0.75,
      cx + w * 0.1, h * 0.75,
      cx, h
    );
  }

  update(left, right, delta) {
    const body = this.sprite.body;
    const speed = SHIP.SPEED;

    // Horizontal movement only
    if (left && !right) {
      body.setVelocityX(-speed);
    } else if (right && !left) {
      body.setVelocityX(speed);
    } else {
      body.setVelocityX(0);
    }

    // Clamp position within margins
    const minX = SHIP.MARGIN + SHIP.WIDTH / 2;
    const maxX = GAME.WIDTH - SHIP.MARGIN - SHIP.WIDTH / 2;
    if (this.sprite.x < minX) {
      this.sprite.x = minX;
      body.setVelocityX(0);
    } else if (this.sprite.x > maxX) {
      this.sprite.x = maxX;
      body.setVelocityX(0);
    }

    // No vertical velocity for ship
    body.setVelocityY(0);
  }

  getPosition() {
    return { x: Math.round(this.sprite.x), y: Math.round(this.sprite.y) };
  }

  reset() {
    this.sprite.setPosition(SHIP.START_X, SHIP.START_Y);
    this.sprite.body.setVelocity(0, 0);
    this.sprite.setActive(true);
    this.sprite.setVisible(true);
  }

  destroy() {
    this.sprite.destroy();
  }
}
