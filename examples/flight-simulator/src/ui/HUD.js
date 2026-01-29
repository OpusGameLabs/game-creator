import { eventBus, Events } from '../core/EventBus.js';
import { PLAYER } from '../core/Constants.js';

export class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    this.el.style.display = 'none';

    this.scoreEl = document.getElementById('hud-score');
    this.altEl = document.getElementById('hud-alt');
    this.speedEl = document.getElementById('hud-speed');

    eventBus.on(Events.SCORE_CHANGED, ({ score }) => this.updateScore(score));
    eventBus.on(Events.GAME_OVER, () => this.hide());
    eventBus.on(Events.GAME_RESTART, () => this.hide());
  }

  show() {
    this.el.style.display = 'flex';
    this.updateScore(0);
  }

  hide() {
    this.el.style.display = 'none';
  }

  updateScore(score) {
    if (this.scoreEl) {
      this.scoreEl.textContent = `RINGS: ${score}`;
      this.scoreEl.style.transform = 'scale(1.3)';
      setTimeout(() => {
        this.scoreEl.style.transform = 'scale(1)';
      }, 150);
    }
  }

  updateAltitude(alt) {
    if (this.altEl) {
      this.altEl.textContent = `ALT: ${Math.round(alt)}m`;
      // Warn when low altitude
      const lowThreshold = PLAYER.MIN_ALTITUDE + 10;
      if (alt < lowThreshold) {
        this.altEl.classList.add('warning');
      } else {
        this.altEl.classList.remove('warning');
      }
    }
  }

  updateSpeed(speed) {
    if (this.speedEl) {
      this.speedEl.textContent = `SPD: ${Math.round(speed)} km/h`;
    }
  }
}
