// =============================================================================
// InputSystem.js — Unified analog input (keyboard + mobile)
//
// Provides moveX / moveZ (-1..1) from whichever source is active.
// Game logic reads only moveX/moveZ and never knows the input source.
//
// Extension points for mobile:
// - GyroscopeInput: import and call requestPermission() from a user gesture,
//   read moveX/moveZ from DeviceOrientationEvent with deadzone + smoothing.
// - VirtualJoystick: DOM-based circle-in-circle touch joystick, outputs
//   moveX/moveZ from touch drag displacement.
//
// Priority: Keyboard always overrides. On mobile, gyro is tried first; if
// unavailable, virtual joystick is shown as fallback.
// =============================================================================

export class InputSystem {
  constructor() {
    this.keys = {};

    // Analog output (-1..1) consumed by gameplay code
    this.moveX = 0;
    this.moveZ = 0;

    // Mobile detection
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1);

    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  /**
   * Call from a user gesture handler to initialize mobile inputs.
   * Implement gyroscope permission request and joystick fallback here.
   */
  async initMobile() {
    if (!this.isMobile) return;
    // TODO: Request gyro permission, fall back to virtual joystick
  }

  /**
   * Call once per frame in the game loop.
   * Merges keyboard + mobile sources into moveX/moveZ.
   */
  update() {
    let mx = 0;
    let mz = 0;

    // Keyboard (always active, acts as override)
    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) mx -= 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) mx += 1;
    if (this.isDown('ArrowUp') || this.isDown('KeyW')) mz -= 1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) mz += 1;

    // If no keyboard input, read from mobile sources
    // const kbActive = mx !== 0 || mz !== 0;
    // if (!kbActive && this.gyro?.active) { mx = this.gyro.moveX; mz = this.gyro.moveZ; }
    // if (!kbActive && this.joystick?.active) { mx = this.joystick.moveX; mz = this.joystick.moveZ; }

    this.moveX = Math.max(-1, Math.min(1, mx));
    this.moveZ = Math.max(-1, Math.min(1, mz));
  }

  // Legacy boolean getters for backward compatibility
  get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); }
  get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
  get forward() { return this.isDown('ArrowUp') || this.isDown('KeyW'); }
  get backward() { return this.isDown('ArrowDown') || this.isDown('KeyS'); }
  get jump() { return this.isDown('Space'); }
}
