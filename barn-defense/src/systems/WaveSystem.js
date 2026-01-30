// =============================================================================
// Barn Defense - WaveSystem
// Manages spawning enemy waves. Each wave is composed of groups of enemies.
// Waves are triggered manually via "Start Wave" button.
// =============================================================================

import { WAVE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { Enemy } from '../entities/Enemy.js';

export class WaveSystem {
  constructor(scene, mapSystem) {
    this.scene = scene;
    this.mapSystem = mapSystem;
    this.enemies = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveActive = false;
    this.allWavesComplete = false;

    // Set total waves
    if (mapSystem.waves) {
      gameState.totalWaves = mapSystem.waves.length;
    }

    // Listen for wave start request
    this.onWaveStart = () => this.startNextWave();
    eventBus.on(Events.WAVE_START, this.onWaveStart);

    // Listen for enemies reaching barn
    this.onEnemyReachedBarn = ({ enemy }) => {
      gameState.enemiesAlive--;
      const isDead = gameState.loseLife(1);
      eventBus.emit(Events.LIVES_CHANGED, { lives: gameState.lives });
      eventBus.emit(Events.BARN_HIT, { lives: gameState.lives });

      if (isDead) {
        gameState.gameOver = true;
        eventBus.emit(Events.GAME_OVER, { level: gameState.currentLevel });
      }
      this.checkWaveComplete();
    };
    eventBus.on(Events.ENEMY_REACHED_BARN, this.onEnemyReachedBarn);

    // Listen for enemy death
    this.onEnemyDied = ({ reward }) => {
      gameState.enemiesAlive--;
      gameState.addCorn(reward);
      eventBus.emit(Events.CORN_CHANGED, { corn: gameState.corn });
      eventBus.emit(Events.CORN_EARNED, { amount: reward });
      this.checkWaveComplete();
    };
    eventBus.on(Events.ENEMY_DIED, this.onEnemyDied);
  }

  startNextWave() {
    if (this.waveActive || this.allWavesComplete) return;
    if (gameState.currentWave >= gameState.totalWaves) return;

    this.waveActive = true;
    gameState.waveInProgress = true;

    const waveData = this.mapSystem.waves[gameState.currentWave];
    this.buildSpawnQueue(waveData);

    gameState.currentWave++;
    eventBus.emit(Events.WAVE_UPDATED, {
      current: gameState.currentWave,
      total: gameState.totalWaves,
    });
  }

  buildSpawnQueue(waveData) {
    // waveData is an array of groups: { type, count, spawnDelay }
    // We flatten into a spawn queue with delays
    this.spawnQueue = [];
    let totalCount = 0;

    for (const group of waveData) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          type: group.type,
          delay: group.spawnDelay,
        });
        totalCount++;
      }
    }

    gameState.enemiesToSpawn = totalCount;
    gameState.enemiesAlive += totalCount;
    this.spawnTimer = 0;
  }

  update(delta) {
    // Process spawn queue
    if (this.spawnQueue.length > 0) {
      this.spawnTimer += delta * gameState.gameSpeed;
      const next = this.spawnQueue[0];

      if (this.spawnTimer >= next.delay) {
        this.spawnTimer -= next.delay;
        this.spawnQueue.shift();
        this.spawnEnemy(next.type);
        gameState.enemiesToSpawn--;
      }
    }

    // Update all alive enemies
    for (const enemy of this.enemies) {
      if (enemy.isAlive()) {
        enemy.update(delta);
      }
    }

    // Clean up dead enemies from array periodically
    this.enemies = this.enemies.filter(e => e.isAlive());
  }

  spawnEnemy(config) {
    const path = this.mapSystem.getRandomPath();
    const enemy = new Enemy(this.scene, config, path);
    this.enemies.push(enemy);
    eventBus.emit(Events.ENEMY_SPAWNED, { enemy });
  }

  checkWaveComplete() {
    if (!this.waveActive) return;

    // Wave is complete when no enemies alive and none left to spawn
    if (gameState.enemiesAlive <= 0 && this.spawnQueue.length === 0) {
      this.waveActive = false;
      gameState.waveInProgress = false;

      eventBus.emit(Events.WAVE_COMPLETE, {
        wave: gameState.currentWave,
        total: gameState.totalWaves,
      });

      // Check if all waves done
      if (gameState.currentWave >= gameState.totalWaves) {
        this.allWavesComplete = true;
        gameState.levelComplete = true;
        eventBus.emit(Events.WAVE_ALL_COMPLETE);
        eventBus.emit(Events.LEVEL_COMPLETE, {
          level: gameState.currentLevel,
        });
      }
    }
  }

  getAliveEnemies() {
    return this.enemies.filter(e => e.isAlive());
  }

  destroy() {
    eventBus.off(Events.WAVE_START, this.onWaveStart);
    eventBus.off(Events.ENEMY_REACHED_BARN, this.onEnemyReachedBarn);
    eventBus.off(Events.ENEMY_DIED, this.onEnemyDied);

    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
    this.spawnQueue = [];
  }
}
