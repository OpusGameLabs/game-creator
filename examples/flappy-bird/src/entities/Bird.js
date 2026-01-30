import Phaser from 'phaser';
import { BIRD, GAME, GROUND } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class Bird {
  constructor(scene) {
    this.scene = scene;
    this.alive = true;

    // Build the bird from graphics
    const gfx = scene.add.graphics();
    this.drawBird(gfx);
    gfx.generateTexture('bird', BIRD.WIDTH + 10, BIRD.HEIGHT + 10);
    gfx.destroy();

    this.sprite = scene.physics.add.sprite(BIRD.START_X, BIRD.START_Y, 'bird');
    this.sprite.setBodySize(BIRD.WIDTH - 4, BIRD.HEIGHT - 4);
    this.sprite.body.setAllowGravity(false);
    this.sprite.setDepth(10);
  }

  drawBird(gfx) {
    const cx = (BIRD.WIDTH + 10) / 2;
    const cy = (BIRD.HEIGHT + 10) / 2;

    // Body
    gfx.fillStyle(BIRD.BODY_COLOR, 1);
    gfx.fillEllipse(cx, cy, BIRD.WIDTH, BIRD.HEIGHT);

    // Belly highlight
    gfx.fillStyle(BIRD.BODY_LIGHT, 1);
    gfx.fillEllipse(cx + 2, cy + 3, BIRD.WIDTH * 0.6, BIRD.HEIGHT * 0.5);

    // Wing
    gfx.fillStyle(BIRD.WING_COLOR, 1);
    gfx.fillEllipse(cx - 4, cy - 1, 16, 10);

    // Eye (white)
    gfx.fillStyle(BIRD.EYE_COLOR, 1);
    gfx.fillCircle(cx + 8, cy - 4, 5);

    // Pupil
    gfx.fillStyle(BIRD.PUPIL_COLOR, 1);
    gfx.fillCircle(cx + 10, cy - 4, 2.5);

    // Beak
    gfx.fillStyle(BIRD.BEAK_COLOR, 1);
    gfx.fillTriangle(
      cx + 14, cy,
      cx + 22, cy + 3,
      cx + 14, cy + 6
    );
  }

  enableGravity() {
    this.sprite.body.setAllowGravity(true);
  }

  flap() {
    if (!this.alive) return;
    this.sprite.body.setVelocityY(BIRD.FLAP_VELOCITY);
    this.sprite.angle = BIRD.ROTATION_UP_DEG;
    eventBus.emit(Events.BIRD_FLAP);
  }

  update() {
    if (!this.alive) return;

    // Rotate bird based on velocity
    if (this.sprite.body.velocity.y > 0) {
      this.sprite.angle = Math.min(
        this.sprite.angle + BIRD.ROTATION_SPEED,
        BIRD.ROTATION_DOWN_DEG
      );
    }

    // Check floor/ceiling death
    if (this.sprite.y >= GROUND.Y - BIRD.HEIGHT / 2 || this.sprite.y <= 0) {
      this.die();
    }
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.sprite.body.setVelocityX(0);
    eventBus.emit(Events.BIRD_DIED, {
      x: this.sprite.x,
      y: this.sprite.y,
    });
  }

  destroy() {
    this.sprite.destroy();
  }
}
