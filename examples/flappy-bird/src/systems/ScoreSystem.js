import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export default class ScoreSystem {
  constructor() {
    this.unsub = null;
  }

  start() {
    this.unsub = eventBus.on(Events.BIRD_PASSED_PIPE, () => {
      gameState.addScore();
      eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
    });
  }

  destroy() {
    if (this.unsub) this.unsub();
  }
}
