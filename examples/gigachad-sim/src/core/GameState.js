// =============================================================================
// GameState.js — Centralized state singleton
// Systems read from it. Events trigger mutations. reset() = clean slate.
// =============================================================================

import { GAME, POWERUP } from './Constants.js';
import { eventBus, Events } from './EventBus.js';

class GameState {
  constructor() {
    this.bestScore = 0;
    this.bestCombo = 0;
    this.isMuted = false;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.lives = GAME.LIVES;
    this.combo = 0;
    this.multiplier = 1;
    this.multiplierTimer = 0;
    this.started = false;
    this.gameOver = false;
    this.difficulty = 0;
    this.totalLifts = 0;
    this.difficultyTimer = 0;
    this.spawnTimer = 0;
    this.powerupCooldown = 0;
    this.isFlexing = false;
    this.flexTimer = 0;
    this.entranceDone = false;
  }

  addScore(points) {
    const earned = points * this.multiplier;
    this.score += earned;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
    eventBus.emit(Events.SCORE_CHANGED, { score: this.score, earned });
  }

  incrementCombo() {
    this.combo++;
    if (this.combo > this.bestCombo) {
      this.bestCombo = this.combo;
    }
  }

  resetCombo() {
    this.combo = 0;
  }

  activateMultiplier() {
    this.multiplier = POWERUP.MULTIPLIER;
    this.multiplierTimer = POWERUP.DURATION;
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    if (this.lives <= 0) {
      this.gameOver = true;
      eventBus.emit(Events.GAME_OVER, { score: this.score });
    }
  }
}

export const gameState = new GameState();
