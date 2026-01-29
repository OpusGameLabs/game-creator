import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { buttonClickSfx } from '../audio/sfx.js';

export class Menu {
  constructor() {
    this.menuOverlay = document.getElementById('menu-overlay');
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.playBtn = document.getElementById('play-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');

    this.playBtn.addEventListener('click', () => {
      buttonClickSfx();
      this.menuOverlay.classList.add('hidden');
      eventBus.emit(Events.AUDIO_INIT);
      eventBus.emit(Events.GAME_START);
    });

    this.restartBtn.addEventListener('click', () => {
      buttonClickSfx();
      this.gameoverOverlay.classList.add('hidden');
      eventBus.emit(Events.MUSIC_STOP);
      eventBus.emit(Events.GAME_RESTART);
    });

    eventBus.on(Events.GAME_OVER, ({ score }) => this.showGameOver(score));
  }

  showStart() {
    this.menuOverlay.classList.remove('hidden');
    this.gameoverOverlay.classList.add('hidden');
  }

  showGameOver(score) {
    this.finalScoreEl.textContent = `Score: ${score}`;
    this.bestScoreEl.textContent = `Best: ${gameState.bestScore}`;
    this.gameoverOverlay.classList.remove('hidden');
  }
}
