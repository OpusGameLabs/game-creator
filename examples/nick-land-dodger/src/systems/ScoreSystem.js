import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

/**
 * ScoreSystem — time-based scoring (+1 per second survived).
 * Also emits SPECTACLE_HIT on score milestones (every 10 points).
 */
export class ScoreSystem {
  constructor() {
    this.scoreTimer = 0; // accumulates delta ms
    this.lastMilestone = 0;
  }

  /**
   * Called each frame with delta in ms.
   */
  update(delta) {
    if (gameState.gameOver) return;

    this.scoreTimer += delta;

    // Add 1 point per second survived
    if (this.scoreTimer >= 1000) {
      const seconds = Math.floor(this.scoreTimer / 1000);
      this.scoreTimer -= seconds * 1000;

      for (let i = 0; i < seconds; i++) {
        gameState.addScore(1);
        eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });

        // Emit spectacle hit on milestones (every 10 points)
        const currentMilestone = Math.floor(gameState.score / 10) * 10;
        if (currentMilestone > this.lastMilestone && currentMilestone > 0) {
          this.lastMilestone = currentMilestone;
          eventBus.emit(Events.SPECTACLE_HIT, {
            score: gameState.score,
            milestone: currentMilestone,
          });
        }
      }
    }
  }

  reset() {
    this.scoreTimer = 0;
    this.lastMilestone = 0;
  }

  destroy() {
    // No persistent listeners to clean up
  }
}
