// =============================================================================
// EnemyManager.js — Wave spawning, enemy pool management
// Manages all active enemies, handles wave progression, emits events.
// Enemies now have death animations (they linger while fading).
// =============================================================================

import { ENEMY, WAVE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Enemy } from './Enemy.js';

export class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesInWave = 0;
    this.enemiesDeadThisWave = 0;
    this.waveActive = false;
    this.betweenWaves = false;
    this.currentSpeed = ENEMY.BASE_SPEED;

    // Listen for enemy kills from projectile impacts
    eventBus.on(Events.ENEMY_KILLED, () => {
      gameState.enemiesKilled++;
      gameState.addScore(ENEMY.KILL_POINTS);
      eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
      this.enemiesDeadThisWave++;
      this._checkWaveComplete();
    });
  }

  startFirstWave() {
    this.startNextWave();
  }

  startNextWave() {
    gameState.wave++;
    this.enemiesInWave = WAVE.BASE_ENEMY_COUNT + (gameState.wave - 1) * WAVE.ENEMY_INCREMENT;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesDeadThisWave = 0;
    this.currentSpeed = ENEMY.BASE_SPEED * (1 + (gameState.wave - 1) * ENEMY.SPEED_INCREASE_PER_WAVE);
    this.spawnTimer = 0;
    this.waveActive = true;
    this.betweenWaves = false;

    eventBus.emit(Events.WAVE_START, { wave: gameState.wave, count: this.enemiesInWave });
  }

  update(delta) {
    if (gameState.gameOver) return;

    // Between-wave pause
    if (this.betweenWaves) {
      this.waveTimer -= delta;
      if (this.waveTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    // Spawn enemies for current wave
    if (this.waveActive && this.enemiesSpawnedThisWave < this.enemiesInWave) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this._spawnEnemy();
        this.spawnTimer = WAVE.SPAWN_INTERVAL;
      }
    }

    // Update all active enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(delta);

      if (!enemy.alive && !enemy.dying) {
        if (enemy.reachedCastle) {
          eventBus.emit(Events.ENEMY_REACHED_CASTLE);
          this.enemiesDeadThisWave++;
          this._checkWaveComplete();
        }
        enemy.destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  _spawnEnemy() {
    // Distribute enemies across lanes
    const laneIndex = this.enemiesSpawnedThisWave % ENEMY.LANE_COUNT;
    const laneWidth = (ENEMY.SPAWN_X_RANGE * 2) / ENEMY.LANE_COUNT;
    const x = -ENEMY.SPAWN_X_RANGE + laneWidth * laneIndex + laneWidth / 2;
    // Add small random offset within lane
    const jitter = (Math.random() - 0.5) * laneWidth * 0.6;

    const enemy = new Enemy(this.scene, x + jitter, this.currentSpeed, gameState.wave);
    this.enemies.push(enemy);
    this.enemiesSpawnedThisWave++;

    eventBus.emit(Events.ENEMY_SPAWNED, { count: this.enemies.length });
  }

  _checkWaveComplete() {
    if (this.enemiesDeadThisWave >= this.enemiesInWave && this.enemiesSpawnedThisWave >= this.enemiesInWave) {
      this.waveActive = false;
      this.betweenWaves = true;
      this.waveTimer = WAVE.PAUSE_BETWEEN_WAVES;

      // Bonus points for completing a wave
      gameState.addScore(WAVE.COMPLETION_BONUS);
      eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
      eventBus.emit(Events.WAVE_COMPLETE, { wave: gameState.wave });
    }
  }

  /** Get positions of all alive enemies (used by projectile splash and Space key) */
  getAliveEnemies() {
    return this.enemies.filter(e => e.alive && !e.dying);
  }

  destroyAll() {
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
  }
}
