import Phaser from 'phaser';
import { ENEMY, WAVE, GAME } from '../core/Constants.js';
import { gameState } from '../core/GameState.js';
import { Enemy } from '../entities/Enemy.js';

export class EnemySpawner {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.spawnTimer = 0;
    this.spawnInterval = ENEMY.SPAWN_INTERVAL;
  }

  update(playerX, playerY, delta, elapsedSeconds) {
    // Ramp difficulty
    this.spawnInterval = Math.max(
      ENEMY.MIN_SPAWN_INTERVAL,
      this.spawnInterval * ENEMY.SPAWN_RAMP_RATE
    );

    // Spawn timer
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval && this.enemies.length < ENEMY.MAX_ENEMIES) {
      this.spawnTimer = 0;
      this.spawnEnemy(playerX, playerY, elapsedSeconds);
    }

    // HP scaling
    const hpScale = Math.pow(WAVE.HP_SCALE_FACTOR, Math.floor(elapsedSeconds / WAVE.HP_SCALE_INTERVAL));

    // Update all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.alive) {
        this.enemies.splice(i, 1);
        continue;
      }
      enemy.update(playerX, playerY, delta);
    }
  }

  spawnEnemy(playerX, playerY, elapsedSeconds) {
    // Determine available types based on elapsed time
    const available = [];
    if (elapsedSeconds >= WAVE.BAT_TIME) available.push('BAT');
    if (elapsedSeconds >= WAVE.ZOMBIE_TIME) available.push('ZOMBIE');
    if (elapsedSeconds >= WAVE.SKELETON_TIME) available.push('SKELETON');
    if (elapsedSeconds >= WAVE.GHOST_TIME) available.push('GHOST');
    if (elapsedSeconds >= WAVE.DEMON_TIME) available.push('DEMON');

    if (available.length === 0) return;

    const typeKey = Phaser.Utils.Array.GetRandom(available);
    const hpScale = Math.pow(WAVE.HP_SCALE_FACTOR, Math.floor(elapsedSeconds / WAVE.HP_SCALE_INTERVAL));

    // Spawn at random position around player, just off screen
    const angle = Math.random() * Math.PI * 2;
    const dist = ENEMY.SPAWN_RADIUS;
    let x = playerX + Math.cos(angle) * dist;
    let y = playerY + Math.sin(angle) * dist;

    // Clamp to world bounds
    x = Phaser.Math.Clamp(x, 20, GAME.WORLD_WIDTH - 20);
    y = Phaser.Math.Clamp(y, 20, GAME.WORLD_HEIGHT - 20);

    const enemy = new Enemy(this.scene, x, y, typeKey, hpScale);
    this.enemies.push(enemy);
  }

  getEnemies() {
    return this.enemies.filter(e => e.alive);
  }

  getAllSprites() {
    return this.enemies.filter(e => e.alive).map(e => e.sprite);
  }

  stopAll() {
    this.enemies.forEach(e => {
      if (e.alive && e.sprite.body) {
        e.sprite.body.setVelocity(0, 0);
      }
    });
  }

  destroy() {
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
  }
}
