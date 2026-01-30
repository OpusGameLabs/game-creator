import Phaser from 'phaser';
import { PARTICLES, ENEMY, XP } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    this.onEmit = ({ type, x, y, color }) => {
      switch (type) {
        case 'enemyDeath': this.burstEnemyDeath(x, y, color); break;
        case 'xpPickup': this.burstXpPickup(x, y); break;
        case 'playerHit': this.burstPlayerHit(x, y); break;
        case 'levelUp': this.burstLevelUp(x, y); break;
      }
    };

    eventBus.on(Events.PARTICLES_EMIT, this.onEmit);
  }

  burst(x, y, count, colors, speed, size) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = speed * (0.5 + Math.random() * 0.5);
      const c = Array.isArray(colors) ? Phaser.Utils.Array.GetRandom(colors) : colors;
      const s = size * (0.5 + Math.random());
      const particle = this.scene.add.circle(x, y, s, c, 1).setDepth(30);
      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * spd,
        y: y + Math.sin(angle) * spd,
        alpha: 0,
        scale: 0.1,
        duration: 300 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  burstEnemyDeath(x, y, color) {
    this.burst(x, y, PARTICLES.ENEMY_DEATH_COUNT, color || 0xff4444, 50, 3);
  }

  burstXpPickup(x, y) {
    this.burst(x, y, PARTICLES.XP_PICKUP_COUNT, [XP.GEM_COLOR, 0xffffff], 30, 2);
  }

  burstPlayerHit(x, y) {
    this.burst(x, y, PARTICLES.PLAYER_HIT_COUNT, [0xff4444, 0xff8888], 40, 3);
  }

  burstLevelUp(x, y) {
    this.burst(x, y, PARTICLES.LEVELUP_COUNT, [0x00ccff, 0x44ffff, 0xffffff], 80, 4);
  }

  destroy() {
    eventBus.off(Events.PARTICLES_EMIT, this.onEmit);
  }
}
