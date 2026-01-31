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
  }

  recalibrate() {
    this.calibBeta = this.beta;
    this.calibGamma = this.gamma;
  }

  update() {
    if (!this.active || this.calibBeta === null) return;

    // Compute tilt relative to calibration offset
    const rawX = this.gamma - this.calibGamma;
    const rawZ = this.beta - this.calibBeta;

    // Apply deadzone
    const dx = Math.abs(rawX) < GYRO.DEADZONE ? 0 : rawX;
    const dz = Math.abs(rawZ) < GYRO.DEADZONE ? 0 : rawZ;

    // Normalize to -1..1 based on max tilt angle
    const nx = Math.max(-1, Math.min(1, dx / GYRO.MAX_TILT));
    const nz = Math.max(-1, Math.min(1, dz / GYRO.MAX_TILT));

    // Smooth (exponential moving average)
    this.moveX = this.moveX + (nx - this.moveX) * GYRO.SMOOTHING;
    this.moveZ = this.moveZ + (nz - this.moveZ) * GYRO.SMOOTHING;
  }

  destroy() {
    window.removeEventListener('deviceorientation', this._onOrientation);
    this.active = false;
  }
}
