import { GYRO } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class GyroscopeInput {
  constructor() {
    this.available = false;
    this.permitted = false;
    this.active = false;

    // Raw device orientation values
    this.beta = 0;   // front-back tilt (-180..180)
    this.gamma = 0;  // left-right tilt (-90..90)
    this.alpha = 0;  // compass heading

    // Calibration offset (captured on first valid reading)
    this.calibBeta = null;
    this.calibGamma = null;

    // Smoothed output (-1..1)
    this.moveX = 0;
    this.moveZ = 0;

    this._onOrientation = this._onOrientation.bind(this);
  }

  async requestPermission() {
    // iOS 13+ requires explicit permission
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result === 'granted') {
          this.permitted = true;
          this._startListening();
          return true;
        }
        eventBus.emit(Events.INPUT_GYRO_PERMISSION, { granted: false });
        return false;
      } catch {
        eventBus.emit(Events.INPUT_GYRO_PERMISSION, { granted: false });
        return false;
      }
    }

    // Non-iOS: check if DeviceOrientationEvent fires at all
    if (typeof DeviceOrientationEvent !== 'undefined') {
      this.permitted = true;
      this._startListening();
      return true;
    }

    return false;
  }

  _startListening() {
    window.addEventListener('deviceorientation', this._onOrientation);
  }

  _onOrientation(e) {
    if (e.beta === null || e.gamma === null) return;

    // Mark as available on first valid reading
    if (!this.available) {
      this.available = true;
      this.active = true;
    }

    // Auto-calibrate on first reading
    if (this.calibBeta === null) {
      this.calibBeta = e.beta;
      this.calibGamma = e.gamma;
    }

    this.beta = e.beta;
    this.gamma = e.gamma;
    this.alpha = e.alpha || 0;
  }

  recalibrate() {
    this.calibBeta = this.beta;
    this.calibGamma = this.gamma;
    // Reset smoothed output so there's no lurch after recalibration
    this.moveX = 0;
    this.moveZ = 0;
  }

  /**
   * Get the current screen orientation angle.
   * 0 = portrait, 90 = landscape-left, -90/270 = landscape-right, 180 = upside-down
   */
  _getScreenAngle() {
    if (screen.orientation && screen.orientation.angle !== undefined) {
      return screen.orientation.angle;
    }
    // Fallback for older browsers
    return window.orientation || 0;
  }

  update() {
    if (!this.active || this.calibBeta === null) return;

    // Compute tilt relative to calibration offset
    let rawX = this.gamma - this.calibGamma;
    let rawZ = this.beta - this.calibBeta;

    // Handle screen orientation — remap axes if device is rotated
    const angle = this._getScreenAngle();
    if (angle === 90) {
      // Landscape left: swap and invert
      const tmp = rawX;
      rawX = -rawZ;
      rawZ = tmp;
    } else if (angle === -90 || angle === 270) {
      // Landscape right: swap and invert other way
      const tmp = rawX;
      rawX = rawZ;
      rawZ = -tmp;
    } else if (angle === 180) {
      // Upside-down portrait: invert both
      rawX = -rawX;
      rawZ = -rawZ;
    }

    // Apply deadzone (subtract deadzone from magnitude, not threshold)
    const dxSign = rawX >= 0 ? 1 : -1;
    const dzSign = rawZ >= 0 ? 1 : -1;
    const dxAbs = Math.max(0, Math.abs(rawX) - GYRO.DEADZONE);
    const dzAbs = Math.max(0, Math.abs(rawZ) - GYRO.DEADZONE);

    // Normalize to -1..1 based on max tilt angle (adjusted for deadzone)
    const range = GYRO.MAX_TILT - GYRO.DEADZONE;
    const nx = Math.max(-1, Math.min(1, (dxAbs / range) * dxSign));
    // INVERT Z: tilting forward (positive beta delta) should move ball
    // away from camera (-Z in Three.js), so negate
    const nz = Math.max(-1, Math.min(1, -(dzAbs / range) * dzSign));

    // Smooth (exponential moving average)
    this.moveX = this.moveX + (nx - this.moveX) * GYRO.SMOOTHING;
    this.moveZ = this.moveZ + (nz - this.moveZ) * GYRO.SMOOTHING;
  }

  destroy() {
    window.removeEventListener('deviceorientation', this._onOrientation);
    this.active = false;
  }
}
