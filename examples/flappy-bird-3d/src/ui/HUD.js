import { eventBus, Events } from '../core/EventBus.js';

export class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    this.el.style.display = 'none';

    eventBus.on(Events.SCORE_CHANGED, ({ score }) => this.updateScore(score));
    eventBus.on(Events.GAME_OVER, () => this.hide());
    eventBus.on(Events.GAME_RESTART, () => this.hide());
  }

  show() {
    this.el.style.display = 'block';
    this.updateScore(0);
  }

  hide() {
    this.el.style.display = 'none';
  }

  updateScore(score) {
    this.el.textContent = score;
    this.el.style.transform = 'translateX(-50%) scale(1.3)';
    setTimeout(() => {
      this.el.style.transform = 'translateX(-50%) scale(1)';
    }, 150);
  }
}
