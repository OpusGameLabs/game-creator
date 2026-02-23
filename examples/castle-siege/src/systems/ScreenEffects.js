// =============================================================================
// ScreenEffects.js — DOM-based screen overlays for damage vignette,
// health tint, victory glow, floating damage numbers, and kill combos.
// =============================================================================

import { UI_JUICE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class ScreenEffects {
  constructor() {
    // --- Vignette flash overlay ---
    this.vignette = document.createElement('div');
    this.vignette.id = 'damage-vignette';
    this.vignette.style.cssText = `
      position: fixed; inset: 0; z-index: 10; pointer-events: none;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.6) 100%);
      opacity: 0; transition: opacity 0.05s;
    `;
    document.body.appendChild(this.vignette);
    this.vignetteTimer = 0;

    // --- Health tint overlay ---
    this.healthTint = document.createElement('div');
    this.healthTint.id = 'health-tint';
    this.healthTint.style.cssText = `
      position: fixed; inset: 0; z-index: 9; pointer-events: none;
      background: rgba(180, 0, 0, 0.15);
      opacity: 0;
    `;
    document.body.appendChild(this.healthTint);

    // --- Victory glow overlay ---
    this.victoryGlow = document.createElement('div');
    this.victoryGlow.id = 'victory-glow';
    this.victoryGlow.style.cssText = `
      position: fixed; inset: 0; z-index: 10; pointer-events: none;
      background: radial-gradient(ellipse at center, ${UI_JUICE.VICTORY_GLOW_COLOR}88 0%, transparent 70%);
      opacity: 0;
    `;
    document.body.appendChild(this.victoryGlow);
    this.victoryTimer = 0;

    // --- Floating numbers container ---
    this.numbersContainer = document.createElement('div');
    this.numbersContainer.id = 'floating-numbers';
    this.numbersContainer.style.cssText = `
      position: fixed; inset: 0; z-index: 12; pointer-events: none; overflow: hidden;
    `;
    document.body.appendChild(this.numbersContainer);
    this.floatingNumbers = [];

    // --- Kill combo state ---
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboElement = null;

    // --- Subscribe to events ---
    eventBus.on(Events.CASTLE_HIT, (data) => this._onCastleHit(data));
    eventBus.on(Events.WAVE_COMPLETE, () => this._onWaveComplete());
    eventBus.on(Events.ENEMY_KILLED, () => this._onEnemyKilled());
    eventBus.on(Events.GAME_START, () => this._onGameStart());
    eventBus.on(Events.GAME_RESTART, () => this._onRestart());
  }

  _onCastleHit(data) {
    // Red vignette flash
    this.vignetteTimer = UI_JUICE.VIGNETTE_FLASH_DURATION;
    this.vignette.style.opacity = String(UI_JUICE.VIGNETTE_FLASH_OPACITY);

    // Update health tint
    this._updateHealthTint();

    // Floating damage number
    const damage = Math.abs(gameState.maxCastleHealth - data.health -
      (gameState.castleHealth || 0));
    this._spawnDamageNumber(data.health);
  }

  _updateHealthTint() {
    const healthPct = (gameState.castleHealth / gameState.maxCastleHealth) * 100;
    if (healthPct < UI_JUICE.SCREEN_TINT_START_HEALTH) {
      const intensity = 1 - (healthPct / UI_JUICE.SCREEN_TINT_START_HEALTH);
      this.healthTint.style.opacity = String(intensity * UI_JUICE.SCREEN_TINT_MAX_OPACITY);
    } else {
      this.healthTint.style.opacity = '0';
    }
  }

  _spawnDamageNumber(healthAfter) {
    const el = document.createElement('div');
    const damage = 10; // ENEMY.CASTLE_DAMAGE
    el.textContent = `-${damage}`;
    el.style.cssText = `
      position: absolute;
      left: ${40 + Math.random() * 20}%;
      bottom: ${10 + Math.random() * 5}%;
      color: ${UI_JUICE.DAMAGE_NUMBER_COLOR};
      font-size: ${UI_JUICE.DAMAGE_NUMBER_FONT_SIZE}px;
      font-weight: bold;
      font-family: system-ui, -apple-system, sans-serif;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
      pointer-events: none;
      opacity: 1;
      transition: none;
    `;
    this.numbersContainer.appendChild(el);
    this.floatingNumbers.push({
      el,
      lifetime: UI_JUICE.DAMAGE_NUMBER_LIFETIME,
      maxLifetime: UI_JUICE.DAMAGE_NUMBER_LIFETIME,
    });
  }

  _onWaveComplete() {
    // Victory glow
    this.victoryTimer = UI_JUICE.VICTORY_GLOW_DURATION;
    this.victoryGlow.style.opacity = String(UI_JUICE.VICTORY_GLOW_OPACITY);
  }

  _onEnemyKilled() {
    this.comboCount++;
    this.comboTimer = UI_JUICE.COMBO_WINDOW;

    if (this.comboCount >= UI_JUICE.COMBO_MIN_KILLS) {
      this._showCombo();
    }
  }

  _showCombo() {
    // Remove old combo element
    if (this.comboElement && this.comboElement.parentNode) {
      this.comboElement.parentNode.removeChild(this.comboElement);
    }

    const colorIndex = Math.min(this.comboCount - UI_JUICE.COMBO_MIN_KILLS,
      UI_JUICE.COMBO_COLORS.length - 1);
    const color = UI_JUICE.COMBO_COLORS[colorIndex];

    const el = document.createElement('div');
    let label = '';
    if (this.comboCount >= 5) {
      label = 'MEGA KILL!';
    } else if (this.comboCount >= 4) {
      label = 'QUAD KILL!';
    } else if (this.comboCount >= 3) {
      label = 'TRIPLE KILL!';
    } else {
      label = 'DOUBLE KILL!';
    }

    el.textContent = label;
    el.style.cssText = `
      position: fixed;
      top: max(100px, 12vh);
      left: 50%;
      transform: translateX(-50%) scale(1.5);
      color: ${color};
      font-size: ${UI_JUICE.COMBO_FONT_SIZE}px;
      font-weight: bold;
      font-family: system-ui, -apple-system, sans-serif;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 20px ${color}66;
      pointer-events: none;
      z-index: 16;
      opacity: 1;
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    `;
    document.body.appendChild(el);
    this.comboElement = el;

    // Animate in
    requestAnimationFrame(() => {
      el.style.transform = 'translateX(-50%) scale(1)';
    });

    // Auto-remove after lifetime
    setTimeout(() => {
      if (el.parentNode) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(-50%) scale(0.8) translateY(-20px)';
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
      }
    }, UI_JUICE.COMBO_LIFETIME * 1000);
  }

  _onGameStart() {
    this.healthTint.style.opacity = '0';
    this.vignette.style.opacity = '0';
    this.victoryGlow.style.opacity = '0';
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  _onRestart() {
    this._onGameStart();
    // Clean up floating numbers
    for (const fn of this.floatingNumbers) {
      if (fn.el.parentNode) fn.el.parentNode.removeChild(fn.el);
    }
    this.floatingNumbers = [];
    if (this.comboElement && this.comboElement.parentNode) {
      this.comboElement.parentNode.removeChild(this.comboElement);
    }
  }

  update(delta) {
    // Vignette fade
    if (this.vignetteTimer > 0) {
      this.vignetteTimer -= delta;
      if (this.vignetteTimer <= 0) {
        this.vignette.style.opacity = '0';
      } else {
        const t = this.vignetteTimer / UI_JUICE.VIGNETTE_FLASH_DURATION;
        this.vignette.style.opacity = String(t * UI_JUICE.VIGNETTE_FLASH_OPACITY);
      }
    }

    // Victory glow fade
    if (this.victoryTimer > 0) {
      this.victoryTimer -= delta;
      if (this.victoryTimer <= 0) {
        this.victoryGlow.style.opacity = '0';
      } else {
        const t = this.victoryTimer / UI_JUICE.VICTORY_GLOW_DURATION;
        this.victoryGlow.style.opacity = String(t * UI_JUICE.VICTORY_GLOW_OPACITY);
      }
    }

    // Floating damage numbers
    for (let i = this.floatingNumbers.length - 1; i >= 0; i--) {
      const fn = this.floatingNumbers[i];
      fn.lifetime -= delta;
      if (fn.lifetime <= 0) {
        if (fn.el.parentNode) fn.el.parentNode.removeChild(fn.el);
        this.floatingNumbers.splice(i, 1);
        continue;
      }
      const t = fn.lifetime / fn.maxLifetime;
      const rise = (1 - t) * UI_JUICE.DAMAGE_NUMBER_RISE_SPEED;
      fn.el.style.transform = `translateY(-${rise}px)`;
      fn.el.style.opacity = String(t);
    }

    // Kill combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }
  }
}
