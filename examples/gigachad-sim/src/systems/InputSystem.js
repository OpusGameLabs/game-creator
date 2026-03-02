// =============================================================================
// InputSystem.js — Unified keyboard + touch input
// Provides moveX (-1..1) for left/right and action buttons.
// Mobile: virtual joystick (left side) + flex button (right side)
// Desktop: A/D or Arrow keys + Space
// =============================================================================

import { IS_MOBILE, TOUCH } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class InputSystem {
  constructor() {
    this.keys = {};
    this.moveX = 0;
    this.flexPressed = false;
    this._flexConsumed = false;
    this.gameActive = false;

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch state
    this._joystickActive = false;
    this._joystickStartX = 0;
    this._joystickCurrentX = 0;
    this._joystickTouchId = null;

    // Setup mobile controls if needed
    if (IS_MOBILE) {
      this._setupTouch();
    }
  }

  _setupTouch() {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickThumb = document.getElementById('joystick-thumb');

    if (joystickZone) {
      joystickZone.style.display = 'block';
    }

    // Create flex button for right side
    this._createFlexButton();

    // Joystick touch handling
    if (joystickZone) {
      joystickZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this._joystickActive = true;
        this._joystickTouchId = touch.identifier;
        this._joystickStartX = touch.clientX;
        this._joystickCurrentX = touch.clientX;
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this._joystickTouchId) {
            this._joystickCurrentX = touch.clientX;
            this._updateJoystickVisual(joystickThumb, joystickZone);
          }
        }
      }, { passive: true });

      const endTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this._joystickTouchId) {
            this._joystickActive = false;
            this._joystickTouchId = null;
            this._joystickCurrentX = this._joystickStartX;
            if (joystickThumb) {
              joystickThumb.style.left = '50%';
            }
          }
        }
      };
      window.addEventListener('touchend', endTouch);
      window.addEventListener('touchcancel', endTouch);
    }
  }

  _createFlexButton() {
    const btn = document.createElement('div');
    btn.id = 'flex-button';
    btn.textContent = 'FLEX';
    btn.style.cssText = `
      position: fixed;
      bottom: max(20px, 3vh);
      right: max(${TOUCH.FLEX_BUTTON_MARGIN}px, 3vw);
      width: ${TOUCH.FLEX_BUTTON_SIZE}px;
      height: ${TOUCH.FLEX_BUTTON_SIZE}px;
      border-radius: 50%;
      background: rgba(255, 215, 0, 0.3);
      border: 2px solid rgba(255, 215, 0, 0.5);
      color: #ffd700;
      font-weight: bold;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 15;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    `;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.flexPressed = true;
      this._flexConsumed = false;
      btn.style.background = 'rgba(255, 215, 0, 0.6)';
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.flexPressed = false;
      btn.style.background = 'rgba(255, 215, 0, 0.3)';
    }, { passive: false });

    document.body.appendChild(btn);
  }

  _updateJoystickVisual(thumb, zone) {
    if (!thumb || !zone) return;
    const rect = zone.getBoundingClientRect();
    const halfWidth = rect.width / 2;
    const dx = this._joystickCurrentX - (rect.left + halfWidth);
    const clamped = Math.max(-halfWidth, Math.min(halfWidth, dx));
    const percent = 50 + (clamped / halfWidth) * 40;
    thumb.style.left = `${percent}%`;
  }

  setGameActive(active) {
    this.gameActive = active;
  }

  update() {
    // Reset analog
    let mx = 0;

    // Keyboard input (always active)
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) mx -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) mx += 1;

    // Space for flex (keyboard)
    if (this.keys['Space'] && !this._flexConsumed) {
      this.flexPressed = true;
    }
    if (!this.keys['Space']) {
      this._flexConsumed = false;
    }

    // Joystick input (mobile)
    if (this._joystickActive && mx === 0) {
      const dx = this._joystickCurrentX - this._joystickStartX;
      const maxDist = TOUCH.JOYSTICK_SIZE / 2;
      const normalized = dx / maxDist;
      if (Math.abs(normalized) > TOUCH.DEAD_ZONE) {
        mx = Math.max(-1, Math.min(1, normalized));
      }
    }

    this.moveX = mx;
  }

  /** Consume the flex press so it only fires once per press */
  consumeFlex() {
    this.flexPressed = false;
    this._flexConsumed = true;
  }

  // Legacy getters for compatibility
  get left() { return this.keys['KeyA'] || this.keys['ArrowLeft']; }
  get right() { return this.keys['KeyD'] || this.keys['ArrowRight']; }
  get forward() { return this.keys['KeyW'] || this.keys['ArrowUp']; }
  get backward() { return this.keys['KeyS'] || this.keys['ArrowDown']; }
  get shift() { return this.keys['ShiftLeft'] || this.keys['ShiftRight']; }
  get jump() { return this.keys['Space']; }
}
