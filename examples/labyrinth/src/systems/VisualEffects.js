import { VFX } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

/**
 * VisualEffects -- DOM-based screen effects: flash overlays, fade transitions.
 * Listens to EventBus for triggers. All timing values come from Constants.VFX.
 */
export class VisualEffects {
  constructor() {
    // Create a persistent flash overlay element
    this._flashEl = document.createElement('div');
    Object.assign(this._flashEl.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '15',
      opacity: '0',
      transition: 'none',
    });
    document.body.appendChild(this._flashEl);

    // Create a persistent fade overlay for level transitions
    this._fadeEl = document.createElement('div');
    Object.assign(this._fadeEl.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '18',
      background: VFX.FADE_COLOR,
      opacity: '0',
      transition: 'none',
    });
    document.body.appendChild(this._fadeEl);

    this._flashTimeout = null;

    // Listen for events
    eventBus.on(Events.VFX_SCREEN_FLASH, (data) => this._flash(data));
    eventBus.on(Events.VFX_LEVEL_FADE_OUT, (data) => this._fadeOut(data));
    eventBus.on(Events.VFX_LEVEL_FADE_IN, () => this._fadeIn());
    eventBus.on(Events.GEM_COLLECTED, () => this._flash({
      color: VFX.FLASH_GEM_COLOR,
      duration: VFX.FLASH_GEM_DURATION,
    }));
    eventBus.on(Events.BALL_FELL, () => this._flash({
      color: VFX.FLASH_FALL_COLOR,
      duration: VFX.FLASH_FALL_DURATION,
    }));
  }

  /**
   * Flash the screen with a color overlay that fades out.
   */
  _flash({ color, duration }) {
    if (this._flashTimeout) {
      clearTimeout(this._flashTimeout);
    }

    this._flashEl.style.transition = 'none';
    this._flashEl.style.background = color;
    this._flashEl.style.opacity = '1';

    // Force reflow so the transition applies from opacity 1
    void this._flashEl.offsetWidth;

    this._flashEl.style.transition = `opacity ${duration}ms ease-out`;
    this._flashEl.style.opacity = '0';

    this._flashTimeout = setTimeout(() => {
      this._flashTimeout = null;
    }, duration);
  }

  /**
   * Fade screen to black (level transition out).
   * Returns a promise that resolves when fade completes.
   */
  _fadeOut({ callback } = {}) {
    const dur = VFX.FADE_DURATION;
    this._fadeEl.style.transition = 'none';
    this._fadeEl.style.opacity = '0';

    void this._fadeEl.offsetWidth;

    this._fadeEl.style.transition = `opacity ${dur}ms ease-in`;
    this._fadeEl.style.opacity = '1';

    if (callback) {
      setTimeout(callback, dur);
    }
  }

  /**
   * Fade screen back in (level transition in).
   */
  _fadeIn() {
    const dur = VFX.FADE_DURATION;
    this._fadeEl.style.transition = `opacity ${dur}ms ease-out`;
    this._fadeEl.style.opacity = '0';
  }

  destroy() {
    if (this._flashEl && this._flashEl.parentNode) {
      this._flashEl.parentNode.removeChild(this._flashEl);
    }
    if (this._fadeEl && this._fadeEl.parentNode) {
      this._fadeEl.parentNode.removeChild(this._fadeEl);
    }
  }
}
