// =============================================================================
// Barn Defense - GameState
// Single centralized state object. Systems read from it.
// Events trigger mutations. Has reset() for clean restarts.
// =============================================================================

import { LEVEL_STARTING_CORN, LEVEL_STARTING_LIVES } from './Constants.js';

class GameState {
  constructor() {
    this.levelsUnlocked = 1;
    this.reset();
  }

  reset() {
    this.currentLevel = 0; // 0-indexed
    this.corn = LEVEL_STARTING_CORN[0];
    this.lives = LEVEL_STARTING_LIVES[0];
    this.currentWave = 0;
    this.totalWaves = 0;
    this.waveInProgress = false;
    this.enemiesAlive = 0;
    this.enemiesToSpawn = 0;
    this.started = false;
    this.gameOver = false;
    this.levelComplete = false;
    this.gameSpeed = 1;
    this.towersPlaced = [];
    this.selectedTowerType = null;
    this.selectedPlacedTower = null;
  }

  setLevel(levelIndex) {
    this.currentLevel = levelIndex;
    this.corn = LEVEL_STARTING_CORN[levelIndex] || LEVEL_STARTING_CORN[0];
    this.lives = LEVEL_STARTING_LIVES[levelIndex] || LEVEL_STARTING_LIVES[0];
    this.currentWave = 0;
    this.waveInProgress = false;
    this.enemiesAlive = 0;
    this.enemiesToSpawn = 0;
    this.started = false;
    this.gameOver = false;
    this.levelComplete = false;
    this.gameSpeed = 1;
    this.towersPlaced = [];
    this.selectedTowerType = null;
    this.selectedPlacedTower = null;
  }

  addCorn(amount) {
    this.corn += amount;
  }

  spendCorn(amount) {
    if (this.corn >= amount) {
      this.corn -= amount;
      return true;
    }
    return false;
  }

  loseLife(amount = 1) {
    this.lives = Math.max(0, this.lives - amount);
    return this.lives <= 0;
  }

  unlockNextLevel() {
    if (this.currentLevel + 1 >= this.levelsUnlocked) {
      this.levelsUnlocked = Math.min(this.currentLevel + 2, 5);
    }
  }
}

export const gameState = new GameState();
