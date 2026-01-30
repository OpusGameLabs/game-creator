// =============================================================================
// Barn Defense - Projectile Entity
// Projectiles travel from towers to enemy targets, dealing damage on hit.
// Supports splash damage and slow effects.
// Uses pixel art textures for visuals.
// =============================================================================

import { PROJECTILE, PARTICLES } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Projectile {
  constructor(scene, fireData) {
    this.scene = scene;
    this.x = fireData.fromX;
    this.y = fireData.fromY;
    this.target = fireData.target;
    this.damage = fireData.damage;
    this.speed = fireData.speed;
    this.splash = fireData.splash;
    this.splashRadius = fireData.splashRadius;
    this.slowEffect = fireData.slowEffect;
    this.slowAmount = fireData.slowAmount;
    this.slowDuration = fireData.slowDuration;
    this.alive = true;
    this.lifetime = PROJECTILE.LIFETIME;

    // Remember target position in case target dies mid-flight
    this.targetX = this.target.x;
    this.targetY = this.target.y;

    // Trail timer
    this.trailTimer = 0;

    // Create graphic using pixel art texture
    const texKey = fireData.towerTypeKey ? `proj-${fireData.towerTypeKey}` : null;
    if (texKey && scene.textures.exists(texKey)) {
      this.graphic = scene.add.image(this.x, this.y, texKey);
    } else {
      // Fallback to circle if no texture found
      this.graphic = scene.add.circle(this.x, this.y, fireData.size, fireData.color);
    }
  }

  update(delta, enemies) {
    if (!this.alive) return;

    const speedMultiplier = gameState.gameSpeed;

    // Update target position if target is still alive
    if (this.target && this.target.isAlive()) {
      this.targetX = this.target.x;
      this.targetY = this.target.y;
    }

    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < PROJECTILE.HIT_DISTANCE) {
      this.hit(enemies);
      return;
    }

    const moveAmount = (this.speed * speedMultiplier * delta) / 1000;
    this.x += (dx / dist) * moveAmount;
    this.y += (dy / dist) * moveAmount;
    this.graphic.setPosition(this.x, this.y);

    // Rotate projectile to face direction of travel
    if (this.graphic.setRotation) {
      this.graphic.setRotation(Math.atan2(dy, dx));
    }

    // Trail effect: spawn fading dot behind projectile
    this.trailTimer += delta;
    if (this.trailTimer >= PARTICLES.TRAIL.INTERVAL) {
      this.trailTimer = 0;
      const trailDot = this.scene.add.circle(
        this.x, this.y,
        PARTICLES.TRAIL.SIZE,
        0xffffff,
        PARTICLES.TRAIL.ALPHA
      );
      trailDot.setDepth(50);
      this.scene.tweens.add({
        targets: trailDot,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: PARTICLES.TRAIL.DURATION,
        onComplete: () => trailDot.destroy(),
      });
    }

    // Lifetime check
    this.lifetime -= delta * speedMultiplier;
    if (this.lifetime <= 0) {
      this.destroy();
    }
  }

  hit(enemies) {
    if (!this.alive) return;
    this.alive = false;

    // Direct hit on target
    if (this.target && this.target.isAlive()) {
      this.target.takeDamage(this.damage);

      if (this.slowEffect) {
        this.target.applySlow(this.slowAmount, this.slowDuration);
      }
    }

    // Splash damage
    if (this.splash && this.splashRadius > 0 && enemies) {
      for (const enemy of enemies) {
        if (!enemy.isAlive()) continue;
        if (enemy === this.target) continue; // already hit
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.splashRadius) {
          // Splash damage falls off with distance
          const falloff = 1 - (dist / this.splashRadius) * 0.5;
          enemy.takeDamage(Math.floor(this.damage * falloff));

          if (this.slowEffect) {
            enemy.applySlow(this.slowAmount, this.slowDuration);
          }
        }
      }

      eventBus.emit(Events.PROJECTILE_SPLASH, {
        x: this.x,
        y: this.y,
        radius: this.splashRadius,
      });
    }

    eventBus.emit(Events.PROJECTILE_HIT, {
      x: this.x,
      y: this.y,
    });

    this.destroy();
  }

  destroy() {
    this.alive = false;
    if (this.graphic) {
      this.graphic.destroy();
      this.graphic = null;
    }
  }

  isAlive() {
    return this.alive;
  }
}
