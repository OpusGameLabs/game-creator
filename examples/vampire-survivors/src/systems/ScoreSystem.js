import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class ScoreSystem {
  constructor() {
    this.onAddScore = this.onAddScore.bind(this);
  }

  onAddScore(points = 1) {
    gameState.addScore(points);
    eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
  }

  destroy() {}
}
