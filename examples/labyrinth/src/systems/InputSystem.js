import { INPUT } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { GyroscopeInput } from './GyroscopeInput.js';
import { VirtualJoystick } from './VirtualJoystick.js';

export class InputSystem {
  constructor() {
    // Keyboard state
    this.keys = {};

    // Analog output consumed by Ball.js (-1..1)
    this.moveX = 0;
    this.moveZ = 0;

    // Mobile input sources
    this.gyro = new GyroscopeInput();
    this.joystick = new VirtualJoystick();
    this.mobileInitialized = false;

    // Detect mobile/tablet
    this.isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1);

    // Keyboard listeners (always active on every platform)
    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  /**
   * Call from a user-gesture handler (e.g. PLAY button tap) to initialize
   * mobile inputs. Must be called from a user gesture for iOS gyro permission.
   */
  async initMobile() {
    if (this.mobileInitialized || !this.isMobile) return;
    this.mobileInitialized = true;

    const gyroGranted = await this.gyro.requestPermission();

    if (gyroGranted && this.gyro.available) {
      // Gyro is working -- no joystick needed
      eventBus.emit(Events.INPUT_MODE_CHANGED, { mode: 'gyro' });
    } else {
      // Wait briefly for first deviceorientation event
      await new Promise(resolve => setTimeout(resolve, INPUT.GYRO_WAIT_MS));

      if (this.gyro.available) {
        eventBus.emit(Events.INPUT_MODE_CHANGED, { mode: 'gyro' });
      } else {
        // Gyro unavailable or denied -- fall back to virtual joystick
        this.gyro.destroy();
        this.joystick.show();
        eventBus.emit(Events.INPUT_MODE_CHANGED, { mode: 'joystick' });
      }
    }
  }

  /**
   * Call once per frame in the game loop.
   * Merges all input sources into moveX/moveZ.
   */
  update() {
    // Start with zero
    let mx = 0;
    let mz = 0;

    // --- Keyboard (always checked, acts as override) ---
    if (this.isDown('ArrowLeft') || this.isDown('KeyA')) mx -= 1;
    if (this.isDown('ArrowRight') || this.isDown('KeyD')) mx += 1;
    if (this.isDown('ArrowUp') || this.isDown('KeyW')) mz -= 1;
    if (this.isDown('ArrowDown') || this.isDown('KeyS')) mz += 1;

    const kbActive = mx !== 0 || mz !== 0;

    // --- Mobile sources (only if keyboard not active) ---
    if (!kbActive) {
      if (this.gyro.active) {
        this.gyro.update();
        mx = this.gyro.moveX;
        mz = this.gyro.moveZ;
      } else if (this.joystick.active) {
        mx = this.joystick.moveX;
        mz = this.joystick.moveZ;
      }
    }

    // Clamp final output
    this.moveX = Math.max(-1, Math.min(1, mx));
    this.moveZ = Math.max(-1, Math.min(1, mz));
  }

  // Legacy boolean getters (kept for backward compatibility during transition)
  get left() { return this.isDown('ArrowLeft') || this.isDown('KeyA'); }
  get right() { return this.isDown('ArrowRight') || this.isDown('KeyD'); }
  get forward() { return this.isDown('ArrowUp') || this.isDown('KeyW'); }
  get backward() { return this.isDown('ArrowDown') || this.isDown('KeyS'); }
  get jump() { return this.isDown('Space'); }
}
