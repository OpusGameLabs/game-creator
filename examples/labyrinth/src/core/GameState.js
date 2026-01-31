import { LIVES } from './Constants.js';

class GameState {
  constructor() {
    this.bestScore = 0;
    this.bestLevel = 0;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.level = 1;
    this.gems = 0;
    this.totalGems = 0;
    this.lives = LIVES.STARTING;
    this.started = false;
    this.gameOver = false;
  }

  addScore(points) {
    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
  }

  collectGem() {
    this.gems += 1;
  }

  loseLife() {
    this.lives -= 1;
    return this.lives <= 0;
  }

  advanceLevel() {
    this.level += 1;
    this.gems = 0;
    if (this.level > this.bestLevel) {
      this.bestLevel = this.level;
    }
  }
}

export const gameState = new GameState();
