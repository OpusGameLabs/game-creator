class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.bestScore = this.bestScore || 0;
    this.started = false;
    this.gameOver = false;
    this.currentLane = 0; // -1, 0, 1
    this.currentSpeed = 0;
    this.distanceTraveled = 0;
    this.isMuted = this.isMuted || false;
  }

  addScore(points = 1) {
    this.score += points;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
    }
  }
}

export const gameState = new GameState();
