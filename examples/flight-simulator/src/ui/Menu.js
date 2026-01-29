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
    this.audioInitialized = false;

    this.playBtn.addEventListener('click', () => {
      // First click initializes audio (browser autoplay policy)
      if (!this.audioInitialized) {
        eventBus.emit(Events.AUDIO_INIT);
        this.audioInitialized = true;
      }
      eventBus.emit(Events.MUSIC_STOP);
      this.menuOverlay.classList.add('hidden');
      // Brief delay so music stop processes before gameplay music starts
      setTimeout(() => {
        eventBus.emit(Events.GAME_START);
        eventBus.emit(Events.MUSIC_GAMEPLAY);
      }, 120);
    });

    this.restartBtn.addEventListener('click', () => {
      eventBus.emit(Events.MUSIC_STOP);
      this.gameoverOverlay.classList.add('hidden');
      setTimeout(() => {
        eventBus.emit(Events.GAME_RESTART);
        eventBus.emit(Events.MUSIC_GAMEPLAY);
      }, 120);
    });

    eventBus.on(Events.GAME_OVER, ({ score }) => this.showGameOver(score));
  }

  showStart() {
    this.menuOverlay.classList.remove('hidden');
    this.gameoverOverlay.classList.add('hidden');
    if (this.audioInitialized) {
      eventBus.emit(Events.MUSIC_MENU);
    }
  }

  showGameOver(score) {
    this.finalScoreEl.textContent = `Rings: ${score}`;
    this.bestScoreEl.textContent = `Best: ${gameState.bestScore}`;
    this.gameoverOverlay.classList.remove('hidden');
    eventBus.emit(Events.MUSIC_STOP);
    setTimeout(() => {
      eventBus.emit(Events.MUSIC_GAMEOVER);
    }, 150);
  }
}
