import * as THREE from 'three';
import { PANIC_POINT } from '../core/Constants.js';

const _ppGeo = new THREE.SphereGeometry(PANIC_POINT.RADIUS, 8, 6);

export class PanicPoint {
  constructor(x, z) {
    this.alive = true;
    this.collected = false;
    this.timeAlive = 0;
    this._flashTimer = 0;

    // Green glowing sphere
    const mat = new THREE.MeshLambertMaterial({
      color: PANIC_POINT.COLOR,
      emissive: PANIC_POINT.GLOW_COLOR,
      emissiveIntensity: 0.3,
    });
    this.mesh = new THREE.Mesh(_ppGeo, mat);
    this.mesh.position.set(x, PANIC_POINT.FLOAT_HEIGHT, z);
    this.baseY = PANIC_POINT.FLOAT_HEIGHT;

    // Add a small inner ring for a $ sign effect
    const ringGeo = new THREE.TorusGeometry(PANIC_POINT.RADIUS * 0.6, 0.02, 4, 8);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.mesh.add(this.ring);
  }

  update(delta) {
    if (!this.alive) return;

    this.timeAlive += delta;

    // Bobbing animation
    this.mesh.position.y = this.baseY +
      Math.sin(this.timeAlive * PANIC_POINT.BOB_SPEED) * PANIC_POINT.BOB_AMPLITUDE;

    // Spinning
    this.mesh.rotation.y += PANIC_POINT.SPIN_SPEED * delta;

    // Flash on collect
    if (this._flashTimer > 0) {
      this._flashTimer -= delta;
      const scale = 1 + (1 - this._flashTimer / PANIC_POINT.FLASH_DURATION) * 2;
      this.mesh.scale.setScalar(scale);
      this.mesh.material.opacity = this._flashTimer / PANIC_POINT.FLASH_DURATION;
      if (this._flashTimer <= 0) {
        this.alive = false;
      }
      return;
    }

    // Auto-despawn after lifetime
    if (this.timeAlive >= PANIC_POINT.LIFETIME) {
      this.alive = false;
    }
  }

  collect() {
    if (this.collected) return false;
    this.collected = true;
    this._flashTimer = PANIC_POINT.FLASH_DURATION;
    this.mesh.material.transparent = true;
    return true;
  }

  checkPlayer(playerPos) {
    if (this.collected || !this.alive) return false;
    const dx = this.mesh.position.x - playerPos.x;
    const dz = this.mesh.position.z - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    return dist < PANIC_POINT.COLLECT_RADIUS;
  }

  dispose(scene) {
    scene.remove(this.mesh);
    this.mesh.material.dispose();
    if (this.ring) {
      this.ring.geometry.dispose();
      this.ring.material.dispose();
    }
  }
}
