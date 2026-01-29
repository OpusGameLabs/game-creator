import { TRANSITIONS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class CameraShake {
  constructor(camera) {
    this.camera = camera;
    this.shakeTime = 0;
    this.basePosition = { x: 0, y: 0, z: 0 };

    eventBus.on(Events.BIRD_DIED, () => {
      this.shakeTime = TRANSITIONS.SHAKE_DURATION;
    });
  }

  update(delta) {
    if (this.shakeTime > 0) {
      this.shakeTime -= delta;
      const intensity = TRANSITIONS.SHAKE_INTENSITY * (this.shakeTime / TRANSITIONS.SHAKE_DURATION);
      this.camera.position.x += (Math.random() - 0.5) * intensity;
      this.camera.position.y += (Math.random() - 0.5) * intensity;
    }
  }
}
