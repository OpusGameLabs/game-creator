// =============================================================================
// Barn Defense - Enemy Entity
// Enemies walk along a predefined path of waypoints.
// They have HP, speed, and reward values defined in Constants.
// Uses pixel art sprite sheets for visuals.
// =============================================================================

import { HEALTH_BAR, COLORS, GAME } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Enemy {
  constructor(scene, config, path) {
    this.scene = scene;
    this.config = config;
    this.path = path;
    this.waypointIndex = 0;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.baseSpeed = config.speed;
    this.reward = config.reward;
    this.alive = true;
    this.reachedEnd = false;

    // Slow effect tracking
    this.slowTimer = 0;
    this.slowAmount = 1;

    // Position
    const start = path[0];
    this.x = start.x;
    this.y = start.y;

    // Create graphics
    this.container = scene.add.container(this.x, this.y);

    // Enemy sprite (pixel art)
    const texKey = `enemy-${config.key}`;
    this.bodySprite = scene.add.sprite(0, 0, texKey);
    this.bodySprite.play(`${texKey}-walk`);
    this.container.add(this.bodySprite);

    // Health bar background
    this.healthBg = scene.add.rectangle(
      0, HEALTH_BAR.OFFSET_Y,
      HEALTH_BAR.WIDTH, HEALTH_BAR.HEIGHT,
      COLORS.HEALTH_BG
    );
    this.container.add(this.healthBg);

    // Health bar fill
    this.healthFill = scene.add.rectangle(
      0, HEALTH_BAR.OFFSET_Y,
      HEALTH_BAR.WIDTH, HEALTH_BAR.HEIGHT,
      COLORS.HEALTH_HIGH
    );
    this.container.add(this.healthFill);

    // Start moving to waypoint 1
    this.waypointIndex = 1;
  }

  update(delta) {
    if (!this.alive || this.reachedEnd) return;

    // Apply game speed
    const speedMultiplier = gameState.gameSpeed;

    // Update slow timer
    if (this.slowTimer > 0) {
      this.slowTimer -= delta * speedMultiplier;
      if (this.slowTimer <= 0) {
        this.slowAmount = 1;
        this.slowTimer = 0;
      }
    }

    const effectiveSpeed = this.baseSpeed * this.slowAmount * speedMultiplier;

    // Move towards current waypoint
    if (this.waypointIndex >= this.path.length) {
      this.reachEnd();
      return;
    }

    const target = this.path[this.waypointIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      // Reached waypoint
      this.x = target.x;
      this.y = target.y;

      // Goat jump logic
      if (this.config.canJump && Math.random() < this.config.jumpChance) {
        this.waypointIndex = Math.min(
          this.waypointIndex + this.config.jumpDistance,
          this.path.length - 1
        );
      }

      this.waypointIndex++;
      if (this.waypointIndex >= this.path.length) {
        this.reachEnd();
        return;
      }
    } else {
      const moveAmount = (effectiveSpeed * delta) / 1000;
      const moveX = (dx / dist) * moveAmount;
      const moveY = (dy / dist) * moveAmount;
      this.x += moveX;
      this.y += moveY;

      // Flip sprite based on movement direction
      if (this.bodySprite) {
        this.bodySprite.setFlipX(dx < 0);
      }
    }

    // Update container position
    this.container.setPosition(this.x, this.y);
  }

  takeDamage(amount) {
    if (!this.alive) return;

    this.hp -= amount;
    this.updateHealthBar();

    eventBus.emit(Events.ENEMY_DAMAGED, { enemy: this, damage: amount });

    if (this.hp <= 0) {
      this.die();
    }
  }

  applySlow(amount, duration) {
    this.slowAmount = Math.min(this.slowAmount, amount);
    this.slowTimer = Math.max(this.slowTimer, duration);
    eventBus.emit(Events.ENEMY_SLOWED, { enemy: this });
  }

  updateHealthBar() {
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.healthFill.setScale(ratio, 1);
    // Shift to keep left-aligned
    this.healthFill.setX(-HEALTH_BAR.WIDTH * (1 - ratio) / 2);

    // Color based on health
    let color = COLORS.HEALTH_HIGH;
    if (ratio < HEALTH_BAR.MED_THRESHOLD) {
      color = COLORS.HEALTH_LOW;
    } else if (ratio < HEALTH_BAR.HIGH_THRESHOLD) {
      color = COLORS.HEALTH_MED;
    }
    this.healthFill.setFillStyle(color);
  }

  die() {
    if (!this.alive) return;
    this.alive = false;

    eventBus.emit(Events.ENEMY_DIED, {
      enemy: this,
      reward: this.reward,
      x: this.x,
      y: this.y,
    });

    // Death animation - flash and shrink
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  reachEnd() {
    if (!this.alive || this.reachedEnd) return;
    this.reachedEnd = true;
    this.alive = false;

    eventBus.emit(Events.ENEMY_REACHED_BARN, { enemy: this });

    // Fade out
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  isAlive() {
    return this.alive && !this.reachedEnd;
  }
}
