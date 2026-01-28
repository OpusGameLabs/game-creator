import Phaser from 'phaser';
import { eventBus, Events } from '../core/EventBus.js';
import { PARTICLES_CONFIG } from '../core/Constants.js';

/**
 * Tween-based particle system. Listens for particle events on EventBus
 * and creates burst effects at the given position.
 * Initialize in a scene's create() and call destroy() in shutdown().
 */
export default class Particles {
  constructor(scene) {
    this.scene = scene;
    this.unsubs = [];
  }

  start() {
    this.unsubs.push(
      eventBus.on(Events.PARTICLES_SCORE, ({ x, y }) => this.scoreBurst(x, y)),
      eventBus.on(Events.PARTICLES_FLAP, ({ x, y }) => this.flapDust(x, y)),
      eventBus.on(Events.PARTICLES_DEATH, ({ x, y }) => this.deathBurst(x, y)),
    );
  }

  scoreBurst(x, y) {
    const cfg = PARTICLES_CONFIG;
    for (let i = 0; i < cfg.scoreBurstCount; i++) {
      const angle = (Math.PI * 2 * i) / cfg.scoreBurstCount + (Math.random() - 0.5) * 0.4;
      const speed = cfg.scoreBurstSpeed * (0.6 + Math.random() * 0.4);
      const size = 2 + Math.random() * 3;
      const particle = this.scene.add.circle(x, y, size, cfg.scoreBurstColor, 1).setDepth(15);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed - 20,
        alpha: 0,
        scale: 0.2,
        duration: cfg.scoreBurstDuration + Math.random() * 150,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  flapDust(x, y) {
    const cfg = PARTICLES_CONFIG;
    for (let i = 0; i < cfg.flapDustCount; i++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.2; // downward spread
      const speed = cfg.flapDustSpeed * (0.5 + Math.random() * 0.5);
      const size = 2 + Math.random() * 2;
      const particle = this.scene.add.circle(x, y, size, cfg.flapDustColor, 0.5).setDepth(4);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed - 10,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.3,
        duration: cfg.flapDustDuration + Math.random() * 100,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  deathBurst(x, y) {
    const cfg = PARTICLES_CONFIG;
    for (let i = 0; i < cfg.deathBurstCount; i++) {
      const angle = (Math.PI * 2 * i) / cfg.deathBurstCount + (Math.random() - 0.5) * 0.3;
      const speed = cfg.deathBurstSpeed * (0.5 + Math.random() * 0.5);
      const size = 2 + Math.random() * 4;
      const color = Phaser.Utils.Array.GetRandom([cfg.deathBurstColor, 0xffcccc, 0xffe0a0]);
      const particle = this.scene.add.circle(x, y, size, color, 0.9).setDepth(15);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: cfg.deathBurstDuration + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  destroy() {
    this.unsubs.forEach(unsub => unsub());
    this.unsubs = [];
  }
}
