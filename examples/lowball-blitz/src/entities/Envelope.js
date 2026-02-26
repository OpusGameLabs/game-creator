import * as THREE from 'three';
import { ENVELOPE } from '../core/Constants.js';

const _envelopeGeo = new THREE.BoxGeometry(ENVELOPE.WIDTH, ENVELOPE.HEIGHT, ENVELOPE.DEPTH);
const _envelopeMat = new THREE.MeshLambertMaterial({ color: ENVELOPE.COLOR });

export class Envelope {
  constructor(startPos, direction) {
    this.mesh = new THREE.Mesh(_envelopeGeo, _envelopeMat.clone());
    this.mesh.position.copy(startPos);
    this.mesh.position.y += 1; // launch from player chest height

    this.direction = direction.clone().normalize();
    this.startZ = startPos.z;
    this.alive = true;
    this.distanceTraveled = 0;
  }

  update(delta) {
    if (!this.alive) return;

    // Move forward
    const moveAmount = ENVELOPE.SPEED * delta;
    this.mesh.position.addScaledVector(this.direction, moveAmount);
    this.distanceTraveled += moveAmount;

    // Spin for visual flair
    this.mesh.rotation.y += ENVELOPE.SPIN_SPEED * delta;
    this.mesh.rotation.x += ENVELOPE.SPIN_SPEED * 0.5 * delta;

    // Auto-destroy after max distance
    if (this.distanceTraveled >= ENVELOPE.MAX_DISTANCE) {
      this.alive = false;
    }
  }

  checkHouse(house) {
    if (!this.alive || house.isHit) return false;

    const dx = this.mesh.position.x - house.mesh.position.x;
    const dz = this.mesh.position.z - house.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Use half-house width + envelope width as collision threshold
    const threshold = (house.width * 0.5) + ENVELOPE.WIDTH;
    return dist < threshold;
  }

  dispose(scene) {
    scene.remove(this.mesh);
    this.mesh.material.dispose();
  }
}
