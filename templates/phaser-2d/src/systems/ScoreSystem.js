import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class ScoreSystem {
  constructor() {
    this.onAddScore = this.onAddScore.bind(this);
    // Listen for score triggers — wire your own game events here
    // Example: eventBus.on(Events.SOME_ACTION, this.onAddScore);
  }

  onAddScore(points = 1) {
    gameState.addScore(points);
    eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
  }

  destroy() {
    // Clean up listeners here
  }
}
