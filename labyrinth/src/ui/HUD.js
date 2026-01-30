import { eventBus, Events } from '../core/EventBus.js';

export class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    this.el.style.display = 'none';

    // Listen for updates
    eventBus.on(Events.HUD_UPDATE, (data) => this.updateDisplay(data));
    eventBus.on(Events.GAME_OVER, () => this.hide());
    eventBus.on(Events.GAME_RESTART, () => this.hide());
  }

  show() {
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }

  updateDisplay({ level, gems, totalGems, lives }) {
    // Build hearts string for lives
    const hearts = '\u2764'.repeat(lives);
    this.el.innerHTML =
      `<div>Level ${level}</div>` +
      `<div style="margin-top:6px;">Gems: ${gems} / ${totalGems}</div>` +
      `<div style="margin-top:6px; color:#ff6666;">${hearts}</div>`;
  }
}
