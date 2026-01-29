import { DIFFICULTY_CONFIG } from './Constants.js';

class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.bestScore = this.bestScore || 0;
    this.started = false;
    this.gameOver = false;
  }

  addScore() {
    this.score += 1;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
  }

  /** Returns 0–1 difficulty progression based on current score */
  getDifficulty() {
    const t = Math.min(this.score, DIFFICULTY_CONFIG.maxScore) / DIFFICULTY_CONFIG.maxScore;
    return t;
  }

  /** Current gap size (shrinks with difficulty) */
  getCurrentGap() {
    const t = this.getDifficulty();
    return DIFFICULTY_CONFIG.gapStart + (DIFFICULTY_CONFIG.gapEnd - DIFFICULTY_CONFIG.gapStart) * t;
  }

  /** Current pipe speed (increases with difficulty) */
  getCurrentSpeed() {
    const t = this.getDifficulty();
    return DIFFICULTY_CONFIG.speedStart + (DIFFICULTY_CONFIG.speedEnd - DIFFICULTY_CONFIG.speedStart) * t;
  }

  /** Current spawn interval (decreases with difficulty) */
  getCurrentInterval() {
    const t = this.getDifficulty();
    return DIFFICULTY_CONFIG.intervalStart + (DIFFICULTY_CONFIG.intervalEnd - DIFFICULTY_CONFIG.intervalStart) * t;
  }
}

export const gameState = new GameState();
