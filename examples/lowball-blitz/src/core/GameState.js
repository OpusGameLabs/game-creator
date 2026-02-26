import { GAMEPLAY, COMBO } from './Constants.js';

class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.bestScore = this.bestScore || 0;
    this.started = false;
    this.gameOver = false;

    // Lives
    this.lives = GAMEPLAY.LIVES;

    // Combo system
    this.combo = 0;
    this.bestCombo = this.bestCombo || 0;

    // Speed
    this.currentSpeed = GAMEPLAY.AUTO_SPEED;

    // Stats
    this.housesHit = 0;
    this.totalThrown = 0;

    // Audio
    this.isMuted = false;

    // Combo timer
    this._comboTimer = 0;
  }

  addScore(points = 1) {
    const multiplier = Math.min(this.combo, COMBO.MULTIPLIER_CAP);
    const finalPoints = points * Math.max(1, multiplier);
    this.score += finalPoints;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    return finalPoints;
  }

  incrementCombo() {
    this.combo++;
    if (this.combo > this.bestCombo) {
      this.bestCombo = this.combo;
    }
    this._comboTimer = COMBO.TIMEOUT_MS;
  }

  resetCombo() {
    this.combo = 0;
    this._comboTimer = 0;
  }

  updateComboTimer(deltaMs) {
    if (this.combo > 0 && this._comboTimer > 0) {
      this._comboTimer -= deltaMs;
      if (this._comboTimer <= 0) {
        this.resetCombo();
        return true; // combo expired
      }
    }
    return false;
  }

  loseLife() {
    this.lives--;
    return this.lives <= 0;
  }
}

export const gameState = new GameState();
