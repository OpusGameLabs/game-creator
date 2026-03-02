// =============================================================================
// ScreenEffects.js — Full-screen visual effects
// Flash overlay, camera FOV pulse, hit freeze, light pulse, screen shake.
// All effects are non-blocking and degrade gracefully.
// =============================================================================

import { EFFECTS, CAMERA, SPECTACLE } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class ScreenEffects {
  constructor(camera, dirLight) {
    this._camera = camera;
    this._dirLight = dirLight;

    // --- Flash overlay (HTML div) ---
    this._flashEl = document.createElement('div');
    this._flashEl.id = 'screen-flash';
    this._flashEl.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 11;
      opacity: 0;
      transition: none;
    `;
    document.body.appendChild(this._flashEl);

    // Flash state
    this._flashTimer = 0;
    this._flashDuration = 0;
    this._flashAlpha = 0;

    // --- FOV pulse state ---
    this._baseFOV = CAMERA.FOV;
    this._fovPulseTimer = 0;
    this._fovPulsePhase = 'none'; // 'in', 'out', 'none'

    // --- Light pulse state ---
    this._baseLightIntensity = dirLight ? dirLight.intensity : 0.9;
    this._lightPulseTimer = 0;

    // --- Hit freeze state ---
    this._freezeTimer = 0;
    this._isFrozen = false;

    // --- Enhanced screen shake state ---
    this._shakeTimer = 0;
    this._shakeIntensity = 0;

    // --- Wire events ---
    this._wireEvents();
  }

  _wireEvents() {
    // White flash on entrance (delayed to match landing)
    eventBus.on(Events.SPECTACLE_ENTRANCE, () => {
      setTimeout(() => {
        this._triggerFlash('#ffffff', EFFECTS.FLASH_WHITE_ALPHA, EFFECTS.FLASH_DURATION);
        this._triggerShake(0.012, 0.15);
      }, 1000);
    });

    // Color flash on weight catch + FOV pulse + light pulse
    eventBus.on(Events.WEIGHT_CAUGHT, (data) => {
      const combo = data.combo || 0;
      this._triggerFOVPulse();
      this._triggerLightPulse();

      // Subtle white flash on catch, increasing with combo
      if (combo >= 3) {
        const alpha = Math.min(0.15 + combo * 0.02, 0.35);
        this._triggerFlash('#ffffff', alpha, 0.15);
      }
    });

    // Red flash + stronger shake on miss
    eventBus.on(Events.WEIGHT_MISSED, () => {
      this._triggerFlash('#ff0000', EFFECTS.FLASH_RED_ALPHA, EFFECTS.FLASH_DURATION);
      this._triggerShake(SPECTACLE.SCREEN_SHAKE_INTENSITY, SPECTACLE.SCREEN_SHAKE_DURATION);
    });

    // Green flash on powerup collect
    eventBus.on(Events.POWERUP_COLLECTED, () => {
      this._triggerFlash('#00ff44', EFFECTS.FLASH_GREEN_ALPHA, EFFECTS.FLASH_DURATION * 1.2);
      this._triggerLightPulse();
    });

    // Hit freeze on player damage
    eventBus.on(Events.PLAYER_HIT, () => {
      this._triggerFreeze();
    });

    // Enhanced shake on streak
    eventBus.on(Events.SPECTACLE_STREAK, ({ combo }) => {
      const intensity = Math.min(0.15 + combo * 0.01, 0.4);
      this._triggerShake(intensity, 0.35);
      this._triggerFlash('#ffdd44', 0.3, 0.4);
      this._triggerLightPulse();
    });

    // Combo-scaled effects
    eventBus.on(Events.SPECTACLE_COMBO, ({ combo }) => {
      const shakeIntensity = Math.min(
        SPECTACLE.SCREEN_SHAKE_INTENSITY + combo * 0.03,
        0.5
      );
      this._triggerShake(shakeIntensity * 0.3, 0.1);
    });
  }

  // =========================================================================
  // Flash overlay
  // =========================================================================

  _triggerFlash(color, alpha, duration) {
    this._flashEl.style.background = color;
    this._flashEl.style.opacity = String(alpha);
    this._flashTimer = duration;
    this._flashDuration = duration;
    this._flashAlpha = alpha;
  }

  // =========================================================================
  // FOV pulse (camera zoom in/out)
  // =========================================================================

  _triggerFOVPulse() {
    this._fovPulsePhase = 'in';
    this._fovPulseTimer = 0;
  }

  // =========================================================================
  // Light pulse
  // =========================================================================

  _triggerLightPulse() {
    if (!this._dirLight) return;
    this._lightPulseTimer = EFFECTS.LIGHT_PULSE_DURATION;
  }

  // =========================================================================
  // Hit freeze
  // =========================================================================

  _triggerFreeze() {
    this._freezeTimer = EFFECTS.FREEZE_DURATION;
    this._isFrozen = true;
  }

  // =========================================================================
  // Screen shake (enhanced, combo-scaled)
  // =========================================================================

  _triggerShake(intensity, duration) {
    // Take the stronger shake if one is already active
    if (this._shakeTimer > 0 && this._shakeIntensity > intensity) return;
    this._shakeIntensity = intensity;
    this._shakeTimer = duration;
  }

  // =========================================================================
  // Update — called every frame from Game.js
  // Returns { frozen, shakeX, shakeY } for the game loop to apply
  // =========================================================================

  update(delta) {
    const result = {
      frozen: false,
      shakeX: 0,
      shakeY: 0,
    };

    // --- Hit freeze ---
    if (this._isFrozen) {
      this._freezeTimer -= delta;
      if (this._freezeTimer <= 0) {
        this._isFrozen = false;
      } else {
        result.frozen = true;
      }
    }

    // --- Flash overlay fade ---
    if (this._flashTimer > 0) {
      this._flashTimer -= delta;
      const t = Math.max(0, this._flashTimer / this._flashDuration);
      this._flashEl.style.opacity = String(this._flashAlpha * t);
      if (this._flashTimer <= 0) {
        this._flashEl.style.opacity = '0';
      }
    }

    // --- FOV pulse ---
    if (this._fovPulsePhase === 'in') {
      this._fovPulseTimer += delta;
      const t = Math.min(this._fovPulseTimer / EFFECTS.FOV_PULSE_IN, 1);
      this._camera.fov = this._baseFOV - EFFECTS.FOV_PULSE_AMOUNT * t;
      this._camera.updateProjectionMatrix();
      if (t >= 1) {
        this._fovPulsePhase = 'out';
        this._fovPulseTimer = 0;
      }
    } else if (this._fovPulsePhase === 'out') {
      this._fovPulseTimer += delta;
      const t = Math.min(this._fovPulseTimer / EFFECTS.FOV_PULSE_OUT, 1);
      // Ease out
      const eased = 1 - Math.pow(1 - t, 2);
      this._camera.fov = (this._baseFOV - EFFECTS.FOV_PULSE_AMOUNT) + EFFECTS.FOV_PULSE_AMOUNT * eased;
      this._camera.updateProjectionMatrix();
      if (t >= 1) {
        this._fovPulsePhase = 'none';
        this._camera.fov = this._baseFOV;
        this._camera.updateProjectionMatrix();
      }
    }

    // --- Light pulse ---
    if (this._lightPulseTimer > 0 && this._dirLight) {
      this._lightPulseTimer -= delta;
      const t = Math.max(0, this._lightPulseTimer / EFFECTS.LIGHT_PULSE_DURATION);
      this._dirLight.intensity = this._baseLightIntensity + EFFECTS.LIGHT_PULSE_AMOUNT * t;
      if (this._lightPulseTimer <= 0) {
        this._dirLight.intensity = this._baseLightIntensity;
      }
    }

    // --- Screen shake ---
    if (this._shakeTimer > 0) {
      this._shakeTimer -= delta;
      result.shakeX = (Math.random() - 0.5) * this._shakeIntensity * 2;
      result.shakeY = (Math.random() - 0.5) * this._shakeIntensity * 2;
    }

    return result;
  }

  destroy() {
    if (this._flashEl.parentNode) {
      this._flashEl.parentNode.removeChild(this._flashEl);
    }
    // Reset camera FOV
    this._camera.fov = this._baseFOV;
    this._camera.updateProjectionMatrix();
    // Reset light
    if (this._dirLight) {
      this._dirLight.intensity = this._baseLightIntensity;
    }
  }
}
