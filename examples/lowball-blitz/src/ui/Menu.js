import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Menu {
  constructor() {
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.restartBtn = document.getElementById('restart-btn');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.housesHitEl = document.getElementById('houses-hit');
    this.bestComboEl = document.getElementById('best-combo');
    this.livesEl = document.getElementById('lives-display');

    this.restartBtn.addEventListener('click', () => {
      this.gameoverOverlay.classList.add('hidden');
      eventBus.emit(Events.GAME_RESTART);
    });

    eventBus.on(Events.GAME_OVER, ({ score, housesHit, bestCombo }) =>
      this.showGameOver(score, housesHit, bestCombo)
    );

    // Update lives HUD
    eventBus.on(Events.LIVES_CHANGED, ({ lives }) => this.updateLives(lives));

    // Initialize lives display
    this.updateLives(gameState.lives);
  }

  showGameOver(score, housesHit, bestCombo) {
    this.finalScoreEl.textContent = `Score: ${score}`;
    this.bestScoreEl.textContent = `Best: ${gameState.bestScore}`;
    if (this.housesHitEl) {
      this.housesHitEl.textContent = `Houses Hit: ${housesHit || 0}`;
    }
    if (this.bestComboEl) {
      this.bestComboEl.textContent = `Best Combo: ${bestCombo || 0}x`;
    }
    this.gameoverOverlay.classList.remove('hidden');
  }

  updateLives(lives) {
    if (this.livesEl) {
      // Show hearts for lives
      this.livesEl.textContent = '\u2764'.repeat(Math.max(0, lives));
    }
  }
}
