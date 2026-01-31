import { eventBus, Events } from '../core/EventBus.js';

export class HUD {
  constructor() {
    this.el = document.getElementById('hud');
    this.el.style.display = 'none';

    // Persistent inner elements for targeted animations
    this._levelEl = null;
    this._gemsEl = null;
    this._livesEl = null;
    this._buildInnerElements();

    // Level banner element (shows "Level X" on level start)
    this._bannerEl = document.createElement('div');
    Object.assign(this._bannerEl.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '48px',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      color: '#ffcc00',
      textShadow: '0 0 30px rgba(255,204,0,0.6), 0 0 60px rgba(255,204,0,0.3)',
      letterSpacing: '6px',
      opacity: '0',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      pointerEvents: 'none',
      zIndex: '16',
    });
    document.body.appendChild(this._bannerEl);

    // Listen for updates
    eventBus.on(Events.HUD_UPDATE, (data) => this.updateDisplay(data));
    eventBus.on(Events.GAME_OVER, () => this.hide());
    eventBus.on(Events.GAME_RESTART, () => this.hide());
    eventBus.on(Events.LEVEL_START, ({ level }) => this._showLevelBanner(level));
    eventBus.on(Events.GEM_COLLECTED, () => this._pulseGems());
  }

  _buildInnerElements() {
    this._levelEl = document.createElement('div');
    this._gemsEl = document.createElement('div');
    this._gemsEl.style.marginTop = '6px';
    this._livesEl = document.createElement('div');
    this._livesEl.style.marginTop = '6px';
    this._livesEl.style.color = '#ff6666';

    this.el.appendChild(this._levelEl);
    this.el.appendChild(this._gemsEl);
    this.el.appendChild(this._livesEl);
  }

  show() {
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }

  updateDisplay({ level, gems, totalGems, lives }) {
    this._levelEl.textContent = `Level ${level}`;
    this._gemsEl.textContent = `Gems: ${gems} / ${totalGems}`;
    this._livesEl.textContent = '\u2764'.repeat(lives);
  }

  /**
   * Show a large level banner that fades in and out.
   */
  _showLevelBanner(level) {
    this._bannerEl.textContent = `LEVEL ${level}`;
    this._bannerEl.style.transition = 'none';
    this._bannerEl.style.opacity = '0';
    this._bannerEl.style.transform = 'translate(-50%, -50%) scale(0.7)';

    void this._bannerEl.offsetWidth; // force reflow

    this._bannerEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    this._bannerEl.style.opacity = '1';
    this._bannerEl.style.transform = 'translate(-50%, -50%) scale(1)';

    setTimeout(() => {
      this._bannerEl.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      this._bannerEl.style.opacity = '0';
      this._bannerEl.style.transform = 'translate(-50%, -50%) scale(1.1)';
    }, 1500);
  }

  /**
   * Pulse the gem counter on collection.
   */
  _pulseGems() {
    this._gemsEl.style.transition = 'none';
    this._gemsEl.style.transform = 'scale(1.3)';
    this._gemsEl.style.color = '#44ff88';

    void this._gemsEl.offsetWidth;

    this._gemsEl.style.transition = 'transform 0.3s ease-out, color 0.3s ease-out';
    this._gemsEl.style.transform = 'scale(1)';
    this._gemsEl.style.color = '#ffffff';
  }
}
