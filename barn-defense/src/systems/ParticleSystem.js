// =============================================================================
// Barn Defense - ParticleSystem
// Listens to EventBus events and spawns visual particle effects.
// Uses simple tweened circles/rectangles for particles -- no direct calls
// from entities, everything flows through EventBus.
// =============================================================================

import { GAME, PARTICLES, EFFECTS, ENEMY_DEATH_COLORS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // --- Bind event listeners ---
    this.onEnemyDied = ({ enemy, reward, x, y }) => {
      this.emitEnemyDeath(x, y, enemy.config.key);
      this.emitCornEarned(x, y, reward);
    };
    eventBus.on(Events.ENEMY_DIED, this.onEnemyDied);

    this.onProjectileSplash = ({ x, y, radius }) => {
      this.emitSplashRing(x, y, radius);
    };
    eventBus.on(Events.PROJECTILE_SPLASH, this.onProjectileSplash);

    this.onProjectileHit = ({ x, y }) => {
      this.emitHitSpark(x, y);
    };
    eventBus.on(Events.PROJECTILE_HIT, this.onProjectileHit);

    this.onTowerPlaced = ({ col, row }) => {
      const px = col * GAME.TILE_SIZE + GAME.TILE_SIZE / 2;
      const py = row * GAME.TILE_SIZE + GAME.TILE_SIZE / 2;
      this.emitDustPuff(px, py);
    };
    eventBus.on(Events.TOWER_PLACED, this.onTowerPlaced);

    this.onBarnHit = () => {
      // Barn hit particles -- find barn position from map center-right area
      // We use a fixed barn area approximation
      this.emitBarnHit(GAME.WIDTH - 80, GAME.HEIGHT / 2);
    };
    eventBus.on(Events.BARN_HIT, this.onBarnHit);

    this.onTowerFired = ({ tower }) => {
      this.emitTowerRecoil(tower);
    };
    eventBus.on(Events.TOWER_FIRED, this.onTowerFired);

    this.onEnemyDamaged = ({ enemy }) => {
      this.emitDamageFlash(enemy);
    };
    eventBus.on(Events.ENEMY_DAMAGED, this.onEnemyDamaged);

    this.onEnemySlowed = ({ enemy }) => {
      this.emitSlowTint(enemy);
    };
    eventBus.on(Events.ENEMY_SLOWED, this.onEnemySlowed);

    this.onWaveStart = () => {
      this.emitWaveStartZoom();
    };
    eventBus.on(Events.WAVE_START, this.onWaveStart);
  }

  // =========================================================================
  // Enemy Death Burst
  // =========================================================================
  emitEnemyDeath(x, y, enemyKey) {
    const cfg = PARTICLES.ENEMY_DEATH;
    const colors = ENEMY_DEATH_COLORS[enemyKey] || [0xffffff, 0xdddddd];

    for (let i = 0; i < cfg.COUNT; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = cfg.MIN_SIZE + Math.random() * (cfg.MAX_SIZE - cfg.MIN_SIZE);
      const angle = Math.random() * Math.PI * 2;
      const speed = cfg.MIN_SPEED + Math.random() * (cfg.MAX_SPEED - cfg.MIN_SPEED);
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;

      const particle = this.scene.add.circle(x, y, size, color);
      particle.setDepth(100);

      this.scene.tweens.add({
        targets: particle,
        x: x + dx * (cfg.DURATION / 1000),
        y: y + dy * (cfg.DURATION / 1000) + cfg.GRAVITY * (cfg.DURATION / 1000),
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: cfg.DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  // =========================================================================
  // Corn Earned - floating "+X" text
  // =========================================================================
  emitCornEarned(x, y, amount) {
    const cfg = PARTICLES.CORN_EARNED;
    const text = this.scene.add.text(x, y - 10, `+${amount}`, {
      fontSize: cfg.FONT_SIZE,
      fontFamily: 'monospace',
      color: cfg.COLOR,
      fontStyle: 'bold',
      stroke: EFFECTS.TEXT_STROKE_COLOR,
      strokeThickness: EFFECTS.TEXT_STROKE_THICKNESS,
    }).setOrigin(0.5).setDepth(110);

    this.scene.tweens.add({
      targets: text,
      y: y - 10 - cfg.FLOAT_DISTANCE,
      alpha: 0,
      duration: cfg.DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  // =========================================================================
  // Projectile Splash Ring
  // =========================================================================
  emitSplashRing(x, y, radius) {
    const cfg = PARTICLES.PROJECTILE_SPLASH;

    // Expanding ring
    const ring = this.scene.add.circle(x, y, 5, cfg.COLOR, 0.4);
    ring.setStrokeStyle(2, cfg.COLOR, 0.6);
    ring.setDepth(90);

    this.scene.tweens.add({
      targets: ring,
      scaleX: radius / 5,
      scaleY: radius / 5,
      alpha: 0,
      duration: cfg.DURATION,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });

    // Small burst particles
    for (let i = 0; i < cfg.RING_COUNT; i++) {
      const angle = (i / cfg.RING_COUNT) * Math.PI * 2;
      const speed = cfg.MIN_SPEED + Math.random() * (cfg.MAX_SPEED - cfg.MIN_SPEED);
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;

      const p = this.scene.add.circle(x, y, cfg.SIZE, cfg.COLOR);
      p.setDepth(91);

      this.scene.tweens.add({
        targets: p,
        x: x + dx * (cfg.DURATION / 1000),
        y: y + dy * (cfg.DURATION / 1000),
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: cfg.DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  // =========================================================================
  // Hit Spark (small burst on any projectile hit)
  // =========================================================================
  emitHitSpark(x, y) {
    for (let i = 0; i < 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const p = this.scene.add.circle(x, y, 2, 0xffffff);
      p.setDepth(90);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed * 0.3,
        y: y + Math.sin(angle) * speed * 0.3,
        alpha: 0,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  // =========================================================================
  // Tower Placed - Dust Puff
  // =========================================================================
  emitDustPuff(x, y) {
    const cfg = PARTICLES.TOWER_PLACED;

    for (let i = 0; i < cfg.COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = cfg.MIN_SPEED + Math.random() * (cfg.MAX_SPEED - cfg.MIN_SPEED);
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;

      const p = this.scene.add.circle(x, y + 8, cfg.SIZE, cfg.COLOR, 0.7);
      p.setDepth(80);

      this.scene.tweens.add({
        targets: p,
        x: x + dx * (cfg.DURATION / 1000),
        y: y + 8 + dy * (cfg.DURATION / 1000) - 15,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: cfg.DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  // =========================================================================
  // Barn Hit - Red flash particles
  // =========================================================================
  emitBarnHit(x, y) {
    const cfg = PARTICLES.BARN_HIT;

    for (let i = 0; i < cfg.COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = cfg.MIN_SPEED + Math.random() * (cfg.MAX_SPEED - cfg.MIN_SPEED);
      const px = x + (Math.random() - 0.5) * 40;
      const py = y + (Math.random() - 0.5) * 40;

      const p = this.scene.add.circle(px, py, cfg.SIZE, cfg.COLOR, 0.8);
      p.setDepth(100);

      this.scene.tweens.add({
        targets: p,
        x: px + Math.cos(angle) * speed * (cfg.DURATION / 1000),
        y: py + Math.sin(angle) * speed * (cfg.DURATION / 1000),
        alpha: 0,
        duration: cfg.DURATION,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  // =========================================================================
  // Tower Fire Recoil
  // =========================================================================
  emitTowerRecoil(tower) {
    if (!tower.container) return;
    const cfg = EFFECTS.TOWER_RECOIL;

    this.scene.tweens.add({
      targets: tower.container,
      scaleX: cfg.SCALE,
      scaleY: cfg.SCALE,
      duration: cfg.DURATION,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  // =========================================================================
  // Enemy Damage Flash
  // =========================================================================
  emitDamageFlash(enemy) {
    if (!enemy.bodySprite) return;
    const cfg = EFFECTS.ENEMY_DAMAGE_FLASH;

    enemy.bodySprite.setTint(cfg.TINT);
    this.scene.time.delayedCall(cfg.DURATION, () => {
      if (enemy.bodySprite && enemy.alive) {
        // If slowed, apply slow tint, otherwise clear
        if (enemy.slowTimer > 0) {
          enemy.bodySprite.setTint(EFFECTS.ENEMY_SLOW_TINT);
        } else {
          enemy.bodySprite.clearTint();
        }
      }
    });
  }

  // =========================================================================
  // Enemy Slow Tint
  // =========================================================================
  emitSlowTint(enemy) {
    if (!enemy.bodySprite) return;
    enemy.bodySprite.setTint(EFFECTS.ENEMY_SLOW_TINT);

    // Clear tint when slow wears off (checked in enemy update, but add safety)
    this.scene.time.delayedCall(enemy.slowTimer || 2000, () => {
      if (enemy.bodySprite && enemy.alive && enemy.slowTimer <= 0) {
        enemy.bodySprite.clearTint();
      }
    });
  }

  // =========================================================================
  // Wave Start Camera Zoom Pulse
  // =========================================================================
  emitWaveStartZoom() {
    const cfg = EFFECTS.WAVE_START_ZOOM;
    const cam = this.scene.cameras.main;

    this.scene.tweens.add({
      targets: cam,
      zoom: cfg.SCALE,
      duration: cfg.DURATION / 2,
      yoyo: true,
      ease: cfg.EASE,
    });
  }

  // =========================================================================
  // Cleanup
  // =========================================================================
  destroy() {
    eventBus.off(Events.ENEMY_DIED, this.onEnemyDied);
    eventBus.off(Events.PROJECTILE_SPLASH, this.onProjectileSplash);
    eventBus.off(Events.PROJECTILE_HIT, this.onProjectileHit);
    eventBus.off(Events.TOWER_PLACED, this.onTowerPlaced);
    eventBus.off(Events.BARN_HIT, this.onBarnHit);
    eventBus.off(Events.TOWER_FIRED, this.onTowerFired);
    eventBus.off(Events.ENEMY_DAMAGED, this.onEnemyDamaged);
    eventBus.off(Events.ENEMY_SLOWED, this.onEnemySlowed);
    eventBus.off(Events.WAVE_START, this.onWaveStart);
  }
}
