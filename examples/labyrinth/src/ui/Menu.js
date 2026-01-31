import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class Menu {
  constructor() {
    this.menuOverlay = document.getElementById('menu-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.playBtn = document.getElementById('play-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');

    this.playBtn.addEventListener('click', () => {
      // Button press animation before hiding
      this.playBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.menuOverlay.classList.add('hidden');
        this.playBtn.style.transform = '';
        eventBus.emit(Events.GAME_START);
      }, 100);
    });

    this.restartBtn.addEventListener('click', () => {
      this.restartBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.gameoverOverlay.classList.add('hidden');
        this.restartBtn.style.transform = '';
        eventBus.emit(Events.GAME_RESTART);
      }, 100);
    });

    eventBus.on(Events.GAME_OVER, ({ score, level, gems }) => this.showGameOver(score, level, gems));
  }

  showStart() {
    this.menuOverlay.classList.remove('hidden');
    this.gameoverOverlay.classList.add('hidden');
  }

  showGameOver(score, level, gems) {
    this.finalScoreEl.innerHTML =
      `Level Reached: ${level}<br>` +
      `Score: ${score}<br>` +
      `Gems Collected: ${gems}`;
    this.bestScoreEl.textContent = `Best Score: ${gameState.bestScore}`;
    this.gameoverOverlay.classList.remove('hidden');

    // Animate game over overlay entrance
    this.gameoverOverlay.style.opacity = '0';
    this.gameoverOverlay.style.transition = 'none';
    void this.gameoverOverlay.offsetWidth;
    this.gameoverOverlay.style.transition = 'opacity 0.5s ease-in';
    this.gameoverOverlay.style.opacity = '1';
  }
}
