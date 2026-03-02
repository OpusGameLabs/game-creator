// =============================================================================
// Menu.js — Game over overlay and HUD elements
// No in-game score HUD (Play.fun widget handles it).
// Shows game over screen with score, best, combo stats.
// Shows lives and multiplier indicators in-game via HTML overlays.
// =============================================================================

import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';
import { GAME, COLORS, SAFE_ZONE } from '../core/Constants.js';

export class Menu {
  constructor() {
    this.gameoverOverlay = document.getElementById('gameover-overlay');
    this.restartBtn = document.getElementById('restart-btn');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.comboEl = document.getElementById('best-combo');

    // Create in-game HUD (lives + multiplier)
    this._createHUD();

    this.restartBtn.addEventListener('click', () => {
      this.gameoverOverlay.classList.add('hidden');
      eventBus.emit(Events.GAME_RESTART);
    });

    // Keyboard restart
    this._restartKeyHandler = (e) => {
      if (gameState.gameOver && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        this.gameoverOverlay.classList.add('hidden');
        eventBus.emit(Events.GAME_RESTART);
      }
    };
    window.addEventListener('keydown', this._restartKeyHandler);

    eventBus.on(Events.GAME_OVER, ({ score }) => this.showGameOver(score));
    eventBus.on(Events.PLAYER_HIT, () => this._updateLives());
    eventBus.on(Events.POWERUP_COLLECTED, () => this._showMultiplier());
    eventBus.on(Events.SCORE_CHANGED, () => this._updateMultiplierDisplay());
    eventBus.on(Events.SPECTACLE_COMBO, ({ combo }) => this._showComboText(combo));
    eventBus.on(Events.SPECTACLE_STREAK, ({ combo }) => this._showStreakText(combo));
  }

  _createHUD() {
    // Lives display (top-right, below safe zone)
    this.livesContainer = document.createElement('div');
    this.livesContainer.id = 'lives-hud';
    this.livesContainer.style.cssText = `
      position: fixed;
      top: max(${SAFE_ZONE.TOP_PX + 10}px, calc(${SAFE_ZONE.TOP_PERCENT}vh + 10px));
      right: 16px;
      display: flex;
      gap: 6px;
      z-index: 10;
    `;

    this.lifeIcons = [];
    for (let i = 0; i < GAME.LIVES; i++) {
      const icon = document.createElement('div');
      icon.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: ${COLORS.LIFE_FULL === 0xff4444 ? '#ff4444' : '#ff4444'};
        transition: background 0.3s, transform 0.3s;
      `;
      this.livesContainer.appendChild(icon);
      this.lifeIcons.push(icon);
    }

    document.body.appendChild(this.livesContainer);

    // Multiplier display
    this.multiplierEl = document.createElement('div');
    this.multiplierEl.id = 'multiplier-hud';
    this.multiplierEl.style.cssText = `
      position: fixed;
      top: max(${SAFE_ZONE.TOP_PX + 10}px, calc(${SAFE_ZONE.TOP_PERCENT}vh + 10px));
      left: 16px;
      font-family: system-ui, sans-serif;
      font-size: 20px;
      font-weight: bold;
      color: ${COLORS.MULTIPLIER_COLOR};
      z-index: 10;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(this.multiplierEl);

    // Floating combo text (appears briefly on combos)
    this.comboFloat = document.createElement('div');
    this.comboFloat.id = 'combo-float';
    this.comboFloat.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: system-ui, sans-serif;
      font-size: clamp(28px, 6vmin, 48px);
      font-weight: bold;
      color: ${COLORS.COMBO_COLOR};
      z-index: 10;
      opacity: 0;
      pointer-events: none;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      transition: opacity 0.3s, transform 0.3s;
    `;
    document.body.appendChild(this.comboFloat);
  }

  _updateLives() {
    for (let i = 0; i < this.lifeIcons.length; i++) {
      if (i < gameState.lives) {
        this.lifeIcons[i].style.background = '#ff4444';
        this.lifeIcons[i].style.transform = 'scale(1)';
      } else {
        this.lifeIcons[i].style.background = '#444444';
        this.lifeIcons[i].style.transform = 'scale(0.8)';
      }
    }
  }

  _showMultiplier() {
    this.multiplierEl.textContent = `${gameState.multiplier}x`;
    this.multiplierEl.style.opacity = '1';
  }

  _updateMultiplierDisplay() {
    if (gameState.multiplier > 1) {
      this.multiplierEl.textContent = `${gameState.multiplier}x`;
      this.multiplierEl.style.opacity = '1';
    } else {
      this.multiplierEl.style.opacity = '0';
    }
  }

  _showComboText(combo) {
    this.comboFloat.textContent = `${combo}x COMBO!`;
    this.comboFloat.style.opacity = '1';
    this.comboFloat.style.transform = 'translate(-50%, -50%) scale(1.2)';

    clearTimeout(this._comboTimeout);
    this._comboTimeout = setTimeout(() => {
      this.comboFloat.style.opacity = '0';
      this.comboFloat.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 800);
  }

  _showStreakText(combo) {
    this.comboFloat.textContent = `STREAK ${combo}!`;
    this.comboFloat.style.opacity = '1';
    this.comboFloat.style.color = '#ff8844';
    this.comboFloat.style.transform = 'translate(-50%, -50%) scale(1.5)';

    clearTimeout(this._comboTimeout);
    this._comboTimeout = setTimeout(() => {
      this.comboFloat.style.opacity = '0';
      this.comboFloat.style.color = COLORS.COMBO_COLOR;
      this.comboFloat.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 1200);
  }

  showGameOver(score) {
    this.finalScoreEl.textContent = `Score: ${score}`;
    this.bestScoreEl.textContent = `Best: ${gameState.bestScore}`;
    if (this.comboEl) {
      this.comboEl.textContent = `Best Combo: ${gameState.bestCombo}`;
    }
    this.gameoverOverlay.classList.remove('hidden');
  }

  resetHUD() {
    for (const icon of this.lifeIcons) {
      icon.style.background = '#ff4444';
      icon.style.transform = 'scale(1)';
    }
    this.multiplierEl.style.opacity = '0';
    this.comboFloat.style.opacity = '0';
    this.gameoverOverlay.classList.add('hidden');
  }
}
