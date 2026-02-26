// =============================================================================
// InputSystem.js -- Keyboard + touch input for auto-runner
//
// WASD / Arrow keys for left/right lane movement.
// Space / right-screen tap for throwing envelopes.
// =============================================================================

import { IS_MOBILE } from '../core/Constants.js';

export class InputSystem {
  constructor() {
    this.keys = {};
    this._throwJustPressed = false;
    this._throwConsumed = false;
    this._gameActive = false;

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
      if (e.code === 'Space' && !this._throwConsumed) {
        this._throwJustPressed = true;
        this._throwConsumed = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') {
        this._throwConsumed = false;
      }
    });

    // Touch input for mobile
    this._touchThrow = false;
    this._touchLeft = false;
    this._touchRight = false;
    this._activeTouches = new Map();

    if (IS_MOBILE) {
      this._setupTouch();
    }

    // Also support mouse clicks for throw (desktop testing)
    window.addEventListener('mousedown', (e) => {
      if (!this._gameActive) return;
      // Right half of screen = throw
      if (e.clientX > window.innerWidth / 2) {
        this._throwJustPressed = true;
      }
    });
  }

  _setupTouch() {
    const handler = (e) => {
      if (!this._gameActive) return;
      this._touchLeft = false;
      this._touchRight = false;
      this._touchThrow = false;

      for (const touch of e.touches) {
        const x = touch.clientX;
        const halfW = window.innerWidth / 2;

        if (x > halfW) {
          // Right half = throw
          this._touchThrow = true;
        } else {
          // Left half = dodge direction based on position within left half
          const quarterW = halfW / 2;
          if (x < quarterW) {
            this._touchLeft = true;
          } else {
            this._touchRight = true;
          }
        }
      }
    };

    window.addEventListener('touchstart', (e) => {
      handler(e);
      // Register throw press on touch start (right side)
      for (const touch of e.changedTouches) {
        if (touch.clientX > window.innerWidth / 2) {
          this._throwJustPressed = true;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', handler, { passive: true });
    window.addEventListener('touchend', (e) => {
      handler(e);
    }, { passive: true });
  }

  isDown(code) { return !!this.keys[code]; }

  setGameActive(active) {
    this._gameActive = active;
  }

  update() {
    // throwPressed is consumed once per frame
    // It will be true for exactly one frame after space/tap
  }

  /** Consume the throw input -- returns true only once per press */
  get throwPressed() {
    if (this._throwJustPressed) {
      this._throwJustPressed = false;
      return true;
    }
    return false;
  }

  get forward() { return false; } // no forward control in auto-runner
  get backward() { return false; } // no backward control in auto-runner
  get left() {
    return this.isDown('KeyA') || this.isDown('ArrowLeft') || this._touchLeft;
  }
  get right() {
    return this.isDown('KeyD') || this.isDown('ArrowRight') || this._touchRight;
  }
  get shift() { return this.isDown('ShiftLeft') || this.isDown('ShiftRight'); }
  get jump() { return this.isDown('Space'); }

  get moveX() { return (this.right ? 1 : 0) - (this.left ? 1 : 0); }
  get moveZ() { return 0; }
}
