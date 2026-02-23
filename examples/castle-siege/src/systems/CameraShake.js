// =============================================================================
// CameraShake.js — Screen shake on impacts and castle hits
// Subscribes to camera:shake events, displaces camera with damped oscillation.
// =============================================================================

import * as THREE from 'three';
import { CAMERA } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class CameraShake {
  constructor(camera) {
    this.camera = camera;
    this.basePosition = new THREE.Vector3(
      CAMERA.POSITION_X,
      CAMERA.POSITION_Y,
      CAMERA.POSITION_Z
    );
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;

    eventBus.on(Events.CAMERA_SHAKE, (data) => this._onShake(data));
    eventBus.on(Events.GAME_RESTART, () => this._reset());
  }

  _onShake(data) {
    if (data.type === 'castle_hit') {
      // Larger shake for castle hits — override if already shaking
      this.shakeIntensity = CAMERA.SHAKE_CASTLE_HIT_INTENSITY;
      this.shakeDuration = CAMERA.SHAKE_CASTLE_HIT_DURATION;
      this.shakeTimer = CAMERA.SHAKE_CASTLE_HIT_DURATION;
    } else {
      // Only apply if not already doing a bigger shake
      if (this.shakeTimer <= 0 || this.shakeIntensity <= CAMERA.SHAKE_IMPACT_INTENSITY) {
        this.shakeIntensity = CAMERA.SHAKE_IMPACT_INTENSITY;
        this.shakeDuration = CAMERA.SHAKE_IMPACT_DURATION;
        this.shakeTimer = CAMERA.SHAKE_IMPACT_DURATION;
      }
    }
  }

  _reset() {
    this.shakeTimer = 0;
    this.camera.position.copy(this.basePosition);
  }

  update(delta) {
    if (this.shakeTimer <= 0) {
      return;
    }

    this.shakeTimer -= delta;

    if (this.shakeTimer <= 0) {
      // Restore camera to base position
      this.camera.position.copy(this.basePosition);
      return;
    }

    // Damped oscillation
    const t = this.shakeTimer / this.shakeDuration;
    const decay = Math.pow(t, CAMERA.SHAKE_DECAY);
    const amplitude = this.shakeIntensity * decay;
    const phase = this.shakeTimer * CAMERA.SHAKE_FREQUENCY;

    this.camera.position.set(
      this.basePosition.x + Math.sin(phase * 1.1) * amplitude,
      this.basePosition.y + Math.cos(phase * 1.3) * amplitude * 0.5,
      this.basePosition.z + Math.sin(phase * 0.9) * amplitude * 0.3
    );
  }
}
