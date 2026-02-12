// =============================================================================
// InputSystem.js — Unified analog input (keyboard + mobile virtual joystick)
//
// Provides moveX / moveZ (-1..1) from whichever source is active.
// Game logic reads only moveX/moveZ and never knows the input source.
//
// On mobile: a DOM-based virtual joystick appears at bottom-left.
// Keyboard always overrides joystick when keys are pressed.
// =============================================================================

import { IS_MOBILE } from '../core/Constants.js';

export class InputSystem {
  constructor() {
    this.keys = {};

    // Analog output (-1..1) consumed by gameplay code
    this.moveX = 0;
    this.moveZ = 0;

    // Joystick state
    this._joyX = 0;
    this._joyZ = 0;
    this._joyActive = false;
    this._joyZone = null;
    this._joyThumb = null;
    this._joyRadius = 0;

    // Keyboard
    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    // Initialize mobile joystick
    if (IS_MOBILE) {
      this._initJoystick();
    }
  }

  isDown(code) {
    return !!this.keys[code];
  }

  /** Show/hide the joystick when game starts/stops */
  setGameActive(active) {
    if (this._joyZone) {
      this._joyZone.style.display = active ? 'block' : 'none';
    }
    if (!active) {
      this._joyX = 0;
      this._joyZ = 0;
      this._joyActive = false;
      this._resetThumb();
    }
  }

  /** Call once per frame in the game loop. */
  update() {
    let mx = 0;
    let mz = 0;

    // Keyboard (always active, overrides joystick)
    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) mx -= 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) mx += 1;
    if (this.isDown('ArrowUp') || this.isDown('KeyW')) mz -= 1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) mz += 1;

    // If no keyboard input, use joystick
    const kbActive = mx !== 0 || mz !== 0;
    if (!kbActive && this._joyActive) {
      mx = this._joyX;
      mz = this._joyZ;
    }

    this.moveX = Math.max(-1, Math.min(1, mx));
    this.moveZ = Math.max(-1, Math.min(1, mz));
  }

  // --- Virtual Joystick ---

  _initJoystick() {
    this._joyZone = document.getElementById('joystick-zone');
    this._joyThumb = document.getElementById('joystick-thumb');
    const base = document.getElementById('joystick-base');
    if (!this._joyZone || !this._joyThumb || !base) return;

    this._joyZone.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    this._joyZone.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    this._joyZone.addEventListener('touchend', () => this._onTouchEnd());
    this._joyZone.addEventListener('touchcancel', () => this._onTouchEnd());
  }

  _onTouchStart(e) {
    e.preventDefault();
    this._joyActive = true;
    const rect = this._joyZone.getBoundingClientRect();
    this._joyRadius = rect.width / 2;
    this._joyCenterX = rect.left + this._joyRadius;
    this._joyCenterY = rect.top + this._joyRadius;
    this._updateJoystick(e.touches[0]);
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (!this._joyActive) return;
    this._updateJoystick(e.touches[0]);
  }

  _onTouchEnd() {
    this._joyActive = false;
    this._joyX = 0;
    this._joyZ = 0;
    this._resetThumb();
  }

  _updateJoystick(touch) {
    const dx = touch.clientX - this._joyCenterX;
    const dy = touch.clientY - this._joyCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this._joyRadius * 0.8;

    // Clamp to circle
    const clamped = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.cos(angle) * clamped;
    const clampedY = Math.sin(angle) * clamped;

    // Normalize to -1..1
    this._joyX = clampedX / maxDist;
    this._joyZ = clampedY / maxDist;

    // Move thumb visual
    if (this._joyThumb) {
      const pctX = 50 + (clampedX / this._joyRadius) * 50;
      const pctY = 50 + (clampedY / this._joyRadius) * 50;
      this._joyThumb.style.left = pctX + '%';
      this._joyThumb.style.top = pctY + '%';
    }
  }

  _resetThumb() {
    if (this._joyThumb) {
      this._joyThumb.style.left = '50%';
      this._joyThumb.style.top = '50%';
    }
  }

  // Legacy boolean getters for backward compatibility
  get left() { return this.moveX < -0.3; }
  get right() { return this.moveX > 0.3; }
  get forward() { return this.moveZ < -0.3; }
  get backward() { return this.moveZ > 0.3; }
  get jump() { return this.isDown('Space'); }
}
