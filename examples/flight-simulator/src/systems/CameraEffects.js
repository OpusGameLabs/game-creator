import * as THREE from 'three';
import { CAMERA, TRANSITION } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class CameraEffects {
  constructor(camera) {
    this.camera = camera;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.originalPosition = new THREE.Vector3();
    this.shakeOffset = new THREE.Vector3();

    // Flash overlay
    this.flashEl = document.createElement('div');
    this.flashEl.style.cssText = `
      position: fixed; inset: 0; z-index: 15;
      background: white; opacity: 0; pointer-events: none;
      transition: opacity ${TRANSITION.CRASH_FLASH_DURATION}ms;
    `;
    document.body.appendChild(this.flashEl);

    eventBus.on(Events.CAMERA_SHAKE, ({ intensity, duration }) => {
      this.shakeIntensity = intensity || CAMERA.SHAKE_INTENSITY;
      this.shakeTime = duration || CAMERA.SHAKE_DURATION;
    });

    eventBus.on(Events.SCREEN_FLASH, ({ color }) => {
      this.flash(color);
    });
  }

  update(delta) {
    this.shakeOffset.set(0, 0, 0);

    if (this.shakeTime > 0) {
      this.shakeTime -= delta;
      const t = Math.max(0, this.shakeTime / CAMERA.SHAKE_DURATION);
      const intensity = this.shakeIntensity * t;
      this.shakeOffset.set(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity * 0.3
      );
      this.camera.position.add(this.shakeOffset);
    }
  }

  flash(color = 'white') {
    this.flashEl.style.background = color;
    this.flashEl.style.opacity = '0.8';
    setTimeout(() => {
      this.flashEl.style.opacity = '0';
    }, 50);
  }

  destroy() {
    this.flashEl.remove();
  }
}
