import Phaser from 'phaser';
import { BIRD_CONFIG, COLORS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export default class Bird extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.createGraphics();

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(BIRD_CONFIG.size * 2, BIRD_CONFIG.size * 1.6);
    this.body.setOffset(-BIRD_CONFIG.size, -BIRD_CONFIG.size * 0.8);
    this.body.setMaxVelocity(0, BIRD_CONFIG.maxVelocity);
    this.body.allowGravity = false;

    this.alive = true;
    this.wingTimer = 0;
    this.wingUp = true;
  }

  createGraphics() {
    const s = BIRD_CONFIG.size;

    // Body
    this.bodyGfx = this.scene.add.graphics();
    this.bodyGfx.fillStyle(COLORS.bird, 1);
    this.bodyGfx.fillEllipse(0, 0, s * 2, s * 1.6);
    this.add(this.bodyGfx);

    // Wing
    this.wingGfx = this.scene.add.graphics();
    this.wingGfx.fillStyle(COLORS.birdWing, 1);
    this.wingGfx.fillEllipse(-2, 2, s * 1.0, s * 0.7);
    this.add(this.wingGfx);

    // Eye
    const eyeGfx = this.scene.add.graphics();
    eyeGfx.fillStyle(COLORS.birdEye, 1);
    eyeGfx.fillCircle(s * 0.4, -s * 0.2, s * 0.3);
    eyeGfx.fillStyle(COLORS.birdPupil, 1);
    eyeGfx.fillCircle(s * 0.5, -s * 0.2, s * 0.15);
    this.add(eyeGfx);

    // Beak
    const beakGfx = this.scene.add.graphics();
    beakGfx.fillStyle(COLORS.birdBeak, 1);
    beakGfx.fillTriangle(s * 0.6, 0, s * 1.2, s * 0.15, s * 0.6, s * 0.3);
    this.add(beakGfx);
  }

  enableGravity() {
    this.body.allowGravity = true;
  }

  flap() {
    if (!this.alive) return;
    this.body.setVelocityY(BIRD_CONFIG.flapVelocity);
    eventBus.emit(Events.BIRD_FLAP);
  }

  die() {
    this.alive = false;
  }

  update(time, delta) {
    if (!this.alive) {
      this.angle = BIRD_CONFIG.tiltDownAngle;
      return;
    }

    // Tilt based on velocity
    const vy = this.body.velocity.y;
    if (vy <= 0) {
      this.angle = BIRD_CONFIG.tiltUpAngle;
    } else {
      const tilt = Phaser.Math.Clamp(
        (vy / BIRD_CONFIG.maxVelocity) * BIRD_CONFIG.tiltDownAngle,
        0,
        BIRD_CONFIG.tiltDownAngle
      );
      this.angle = tilt;
    }

    // Wing flap animation
    this.wingTimer += delta;
    if (this.wingTimer > 120) {
      this.wingTimer = 0;
      this.wingUp = !this.wingUp;
      this.wingGfx.clear();
      this.wingGfx.fillStyle(COLORS.birdWing, 1);
      const yOff = this.wingUp ? -2 : 4;
      this.wingGfx.fillEllipse(-2, yOff, BIRD_CONFIG.size * 1.0, BIRD_CONFIG.size * 0.7);
    }
  }
}
