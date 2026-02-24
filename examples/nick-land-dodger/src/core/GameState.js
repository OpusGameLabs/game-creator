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

    // Nick Land Dodger specific
    this.combo = 0;             // current dodge streak
    this.bestCombo = this.bestCombo || 0;
    this.survivalTime = 0;      // seconds survived
    this.currentSpeed = 1.0;    // acceleration multiplier
  }

  addScore(points = 1) {
    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
  }

  addCombo() {
    this.combo++;
    if (this.combo > this.bestCombo) {
      this.bestCombo = this.combo;
    }
  }

  resetCombo() {
    this.combo = 0;
  }
}

export const gameState = new GameState();
