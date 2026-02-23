import { LIVES } from './Constants.js';

class GameState {
  constructor() {
    this.isMuted = false;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.bestScore = this.bestScore || 0;
    this.isNewBest = false;
    this.started = false;
    this.gameOver = false;
    this.lives = LIVES.STARTING;
    this.difficulty = 1;
  }

  addScore(points = 1) {
    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.isNewBest = true;
    }
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  }
}

export const gameState = new GameState();
