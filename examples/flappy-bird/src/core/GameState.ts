import { DIFFICULTY_CONFIG } from './Constants';

class GameState {
  score: number;
  bestScore: number;
  started: boolean;
  gameOver: boolean;

  constructor() {
    this.score = 0;
    this.bestScore = 0;
    this.started = false;
    this.gameOver = false;
    this.reset();
  }

  reset(): void {
    this.score = 0;
    this.bestScore = this.bestScore || 0;
    this.started = false;
    this.gameOver = false;
  }

  addScore(): void {
    this.score += 1;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
  }

  /** Returns 0-1 difficulty progression based on current score */
  getDifficulty(): number {
    const t = Math.min(this.score, DIFFICULTY_CONFIG.maxScore) / DIFFICULTY_CONFIG.maxScore;
    return t;
  }

  /** Current gap size (shrinks with difficulty) */
  getCurrentGap(): number {
    const t = this.getDifficulty();
    return DIFFICULTY_CONFIG.gapStart + (DIFFICULTY_CONFIG.gapEnd - DIFFICULTY_CONFIG.gapStart) * t;
  }

  /** Current pipe speed (increases with difficulty) */
  getCurrentSpeed(): number {
    const t = this.getDifficulty();
    return DIFFICULTY_CONFIG.speedStart + (DIFFICULTY_CONFIG.speedEnd - DIFFICULTY_CONFIG.speedStart) * t;
  }

  /** Current spawn interval (decreases with difficulty) */
  getCurrentInterval(): number {
    const t = this.getDifficulty();
    return DIFFICULTY_CONFIG.intervalStart + (DIFFICULTY_CONFIG.intervalEnd - DIFFICULTY_CONFIG.intervalStart) * t;
  }
}

export const gameState = new GameState();
