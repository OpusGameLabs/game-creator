import * as THREE from 'three';
import { SPEED_LINES } from '../core/Constants.js';

export class SpeedLines {
  constructor(scene) {
    this.scene = scene;
    this.lines = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);

    const mat = new THREE.LineBasicMaterial({
      color: SPEED_LINES.COLOR,
      transparent: true,
      opacity: 0,
      fog: false,
    });

    for (let i = 0; i < SPEED_LINES.COUNT; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, SPEED_LINES.LENGTH),
      ]);
      const line = new THREE.Line(geo, mat.clone());
      line.visible = false;
      this.group.add(line);
      this.lines.push({
        line,
        offset: new THREE.Vector3(
          (Math.random() - 0.5) * SPEED_LINES.SPREAD,
          (Math.random() - 0.5) * SPEED_LINES.SPREAD,
          -Math.random() * SPEED_LINES.SPREAD
        ),
      });
    }

    // Pre-allocate temp vector for update loop
    this._tempOffset = new THREE.Vector3();
  }

  update(delta, playerGroup, speed) {
    if (!playerGroup) return;

    const intensity = Math.max(0, (speed - SPEED_LINES.MIN_SPEED_THRESHOLD) / 20);
    const visible = intensity > 0;

    for (const entry of this.lines) {
      entry.line.visible = visible;
      if (!visible) continue;

      entry.line.material.opacity = Math.min(SPEED_LINES.OPACITY * intensity, 0.5);

      // Position lines around the player, aligned with forward direction
      entry.line.position.copy(playerGroup.position);
      this._tempOffset.copy(entry.offset).applyQuaternion(playerGroup.quaternion);
      entry.line.position.add(this._tempOffset);
      entry.line.quaternion.copy(playerGroup.quaternion);

      // Animate lines streaming backward
      entry.offset.z += speed * delta * 0.5;
      if (entry.offset.z > SPEED_LINES.SPREAD / 2) {
        entry.offset.z = -SPEED_LINES.SPREAD;
        entry.offset.x = (Math.random() - 0.5) * SPEED_LINES.SPREAD;
        entry.offset.y = (Math.random() - 0.5) * SPEED_LINES.SPREAD;
      }
    }
  }

  destroy() {
    for (const entry of this.lines) {
      entry.line.geometry.dispose();
      entry.line.material.dispose();
    }
    this.scene.remove(this.group);
  }
}
