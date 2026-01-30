import { eventBus, Events } from '../core/EventBus';
import { gameState } from '../core/GameState';

export default class ScoreSystem {
  private unsub: (() => void) | null;

  constructor() {
    this.unsub = null;
  }

  start(): void {
    this.unsub = eventBus.on(Events.BIRD_PASSED_PIPE, () => {
      gameState.addScore();
      eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });
    });
  }

  destroy(): void {
    if (this.unsub) this.unsub();
  }
}
