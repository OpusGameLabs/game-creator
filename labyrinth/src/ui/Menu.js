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
      this.menuOverlay.classList.add('hidden');
      eventBus.emit(Events.GAME_START);
    });

    this.restartBtn.addEventListener('click', () => {
      this.gameoverOverlay.classList.add('hidden');
      eventBus.emit(Events.GAME_RESTART);
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
  }
}
