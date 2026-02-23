// =============================================================================
// HUD.js — Wave banner and castle health bar with juice
// Listens to events and updates DOM elements. Health bar pulses when low.
// Wave banner slides in/out. No in-game score display
// (Play.fun widget handles that).
// =============================================================================

import { UI_JUICE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class HUD {
  constructor() {
    this.waveBanner = document.getElementById('wave-banner');
    this.healthBarFill = document.getElementById('health-bar-fill');
    this.healthBarContainer = document.getElementById('health-bar-container');
    this.healthBarLabel = document.getElementById('health-bar-label');
    this.waveBannerTimeout = null;
    this.pulseInterval = null;

    // Wave start — show banner
    eventBus.on(Events.WAVE_START, ({ wave, count }) => {
      this.showWaveBanner(`Wave ${wave} — ${count} enemies!`);
    });

    // Wave complete — show banner
    eventBus.on(Events.WAVE_COMPLETE, ({ wave }) => {
      this.showWaveBanner(`Wave ${wave} Complete!`);
    });

    // Castle hit — update health bar
    eventBus.on(Events.CASTLE_HIT, ({ health }) => {
      this.updateHealthBar(health);
    });

    // Game over — hide HUD
    eventBus.on(Events.GAME_OVER, () => {
      this.hideHUD();
    });

    // Game start — show HUD
    eventBus.on(Events.GAME_START, () => {
      this.showHUD();
      this.updateHealthBar(gameState.castleHealth);
      this._stopPulse();
    });
  }

  showWaveBanner(text) {
    if (!this.waveBanner) return;
    this.waveBanner.textContent = text;

    // Slide in from left
    this.waveBanner.style.transform = 'translateX(-150%)';
    this.waveBanner.classList.add('visible');

    // Animate to center
    requestAnimationFrame(() => {
      this.waveBanner.style.transition = `transform ${UI_JUICE.BANNER_SLIDE_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s`;
      this.waveBanner.style.transform = 'translateX(-50%)';
    });

    if (this.waveBannerTimeout) clearTimeout(this.waveBannerTimeout);
    this.waveBannerTimeout = setTimeout(() => {
      // Slide out to right
      this.waveBanner.style.transform = 'translateX(150%)';
      setTimeout(() => {
        this.waveBanner.classList.remove('visible');
        this.waveBanner.style.transform = 'translateX(-50%)';
      }, UI_JUICE.BANNER_SLIDE_DURATION);
    }, 2500);
  }

  updateHealthBar(health) {
    if (!this.healthBarFill) return;
    const pct = Math.max(0, (health / gameState.maxCastleHealth) * 100);
    this.healthBarFill.style.width = pct + '%';

    // Color shifts as health drops
    if (pct > 50) {
      this.healthBarFill.style.background = 'linear-gradient(to right, #44cc44, #88ff88)';
      this._stopPulse();
    } else if (pct > 25) {
      this.healthBarFill.style.background = 'linear-gradient(to right, #ccaa00, #ffcc44)';
      this._stopPulse();
    } else {
      this.healthBarFill.style.background = 'linear-gradient(to right, #cc2222, #ff4444)';
      this._startPulse();
    }
  }

  _startPulse() {
    if (this.pulseInterval) return;
    if (!this.healthBarContainer) return;

    let growing = true;
    this.pulseInterval = setInterval(() => {
      if (!this.healthBarContainer) return;
      const scale = growing ? UI_JUICE.HEALTH_PULSE_SCALE : 1.0;
      this.healthBarContainer.style.transform = `translateX(-50%) scaleX(${scale})`;
      this.healthBarContainer.style.boxShadow = growing ?
        '0 0 12px rgba(255, 0, 0, 0.6)' : '0 0 4px rgba(255, 0, 0, 0.2)';
      growing = !growing;
    }, 1000 / UI_JUICE.HEALTH_PULSE_SPEED);
  }

  _stopPulse() {
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }
    if (this.healthBarContainer) {
      this.healthBarContainer.style.transform = 'translateX(-50%) scaleX(1)';
      this.healthBarContainer.style.boxShadow = '';
    }
  }

  hideHUD() {
    if (this.healthBarContainer) this.healthBarContainer.style.display = 'none';
    if (this.healthBarLabel) this.healthBarLabel.style.display = 'none';
    if (this.waveBanner) this.waveBanner.classList.remove('visible');
    this._stopPulse();
  }

  showHUD() {
    if (this.healthBarContainer) this.healthBarContainer.style.display = '';
    if (this.healthBarLabel) this.healthBarLabel.style.display = '';
  }
}
