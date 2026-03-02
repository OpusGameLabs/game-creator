class GameState {
  constructor() {
    this.isMuted = localStorage.getItem('muted') === 'true';
    this.reset();
  }

  reset() {
    this.score = 0;
    this.bestScore = this.bestScore || 0;
    this.started = false;
    this.gameOver = false;
    this.lives = 3;
    this.combo = 0;
    this.bestCombo = this.bestCombo || 0;
    this.chadLevel = 0;
    this.elapsedTime = 0; // Seconds of gameplay for difficulty scaling
  }

  addScore(points = 1) {
    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
  }

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  }

  setCombo(value) {
    this.combo = value;
    if (this.combo > this.bestCombo) {
      this.bestCombo = this.combo;
    }
  }
}

export const gameState = new GameState();
