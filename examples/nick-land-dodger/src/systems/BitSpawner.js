import Phaser from 'phaser';
import { BIT, GAME, ACCELERATION, SAFE_ZONE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Bit } from '../entities/Bit.js';

/**
 * BitSpawner — manages bit object pool, spawning, acceleration, and recycling.
 * Bits accelerate over time, mirroring Nick Land's accelerationism.
 */
export class BitSpawner {
  constructor(scene) {
    this.scene = scene;

    // Object pool
    this.pool = [];
    for (let i = 0; i < BIT.POOL_SIZE; i++) {
      this.pool.push(new Bit(scene));
    }

    // Timing
    this.spawnTimer = 0;
    this.currentSpawnInterval = BIT.INITIAL_SPAWN_INTERVAL;
    this.currentFallSpeed = BIT.INITIAL_FALL_SPEED;
    this.speedMultiplier = 1.0;
    this.elapsedTime = 0; // ms

    // Track which milestones have been emitted
    this.milestonesReached = new Set();

    // Phaser group for collision detection — holds all bit containers
    this.group = scene.physics.add.group({ allowGravity: false });
    for (const bit of this.pool) {
      this.group.add(bit.container);
    }
  }

  /**
   * Get an inactive bit from the pool.
   */
  getFromPool() {
    for (const bit of this.pool) {
      if (!bit.active) return bit;
    }
    return null; // Pool exhausted
  }

  /**
   * Spawn a new bit at a random x position above the screen.
   */
  spawn() {
    const bit = this.getFromPool();
    if (!bit) return;

    const margin = BIT.SPAWN_MARGIN;
    const x = Phaser.Math.Between(
      Math.round(margin),
      Math.round(GAME.WIDTH - margin)
    );
    // Spawn above visible area
    const y = -BIT.MAX_SIZE;

    const fallSpeed = this.currentFallSpeed * this.speedMultiplier;
    bit.activate(x, y, fallSpeed);

    eventBus.emit(Events.BIT_SPAWNED, { x, y, speed: fallSpeed });
  }

  /**
   * Update loop — handle spawning, acceleration, and recycling.
   * @param {number} delta - frame delta in ms
   */
  update(delta) {
    if (gameState.gameOver) return;

    this.elapsedTime += delta;
    this.spawnTimer += delta;

    // Update acceleration every second
    const seconds = this.elapsedTime / 1000;
    gameState.survivalTime = Math.floor(seconds);

    // Accelerate speed multiplier
    const newMultiplier = Math.min(
      1.0 + ACCELERATION.SPEED_INCREMENT * seconds,
      ACCELERATION.MAX_SPEED_MULTIPLIER
    );
    this.speedMultiplier = newMultiplier;
    gameState.currentSpeed = newMultiplier;

    // Decrease spawn interval over time
    // Recalculate from base rather than compound to avoid floating point drift
    const intervalDecayPower = Math.floor(seconds);
    this.currentSpawnInterval = Math.max(
      BIT.INITIAL_SPAWN_INTERVAL * Math.pow(ACCELERATION.SPAWN_RATE_DECAY, intervalDecayPower),
      BIT.MIN_SPAWN_INTERVAL
    );

    // Check speed milestones
    for (const milestone of ACCELERATION.MILESTONES) {
      if (newMultiplier >= milestone && !this.milestonesReached.has(milestone)) {
        this.milestonesReached.add(milestone);
        eventBus.emit(Events.SPEED_INCREASED, { multiplier: milestone });
      }
    }

    // Spawn bits at current interval
    if (this.spawnTimer >= this.currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawn();
    }

    // Update active bits — update speed and recycle off-screen ones
    const fallSpeed = this.currentFallSpeed * this.speedMultiplier;
    for (const bit of this.pool) {
      if (!bit.active) continue;

      // Update fall speed to match current acceleration
      bit.setFallSpeed(fallSpeed);

      // Recycle bits that have fallen off screen
      if (bit.container.y > GAME.HEIGHT + BIT.MAX_SIZE * 2) {
        bit.deactivate();
      }
    }
  }

  /**
   * Get all active bits for collision/dodge checking.
   */
  getActiveBits() {
    return this.pool.filter(bit => bit.active);
  }

  /**
   * Deactivate all bits (for game over/restart).
   */
  deactivateAll() {
    for (const bit of this.pool) {
      bit.deactivate();
    }
  }

  destroy() {
    this.deactivateAll();
    this.group.destroy(true);
  }
}
