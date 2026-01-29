import * as THREE from 'three';
import { RING } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';
import { gameState } from '../core/GameState.js';

export class RingSystem {
  constructor(scene) {
    this.scene = scene;
    this.rings = [];
    this.elapsed = 0;
    this.spawnRings();
  }

  spawnRings() {
    for (let i = 0; i < RING.COUNT; i++) {
      const geo = new THREE.TorusGeometry(RING.RADIUS, RING.TUBE, 8, 24);
      const mat = new THREE.MeshLambertMaterial({
        color: RING.COLOR,
        emissive: RING.GLOW_COLOR,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.position.set(
        (Math.random() - 0.5) * RING.SPREAD_XZ * 2,
        RING.MIN_Y + Math.random() * (RING.MAX_Y - RING.MIN_Y),
        (Math.random() - 0.5) * RING.SPREAD_XZ * 2
      );
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData.collected = false;
      ring.userData.baseY = ring.position.y;
      ring.userData.bobOffset = Math.random() * Math.PI * 2;

      this.scene.add(ring);
      this.rings.push(ring);
    }
  }

  update(delta, playerPosition) {
    this.elapsed += delta;

    for (const ring of this.rings) {
      if (ring.userData.collected) continue;

      // Spin uncollected rings
      ring.rotation.x += RING.ROTATION_SPEED * delta;

      // Bob up and down
      ring.position.y = ring.userData.baseY +
        Math.sin(this.elapsed * RING.BOB_SPEED + ring.userData.bobOffset) * RING.BOB_AMOUNT;

      // Pulse emissive
      ring.material.emissiveIntensity = 0.2 + Math.sin(this.elapsed * 3 + ring.userData.bobOffset) * 0.15;

      // Check distance to player
      const dist = ring.position.distanceTo(playerPosition);
      if (dist < RING.SCORE_DISTANCE) {
        ring.userData.collected = true;
        ring.material.color.setHex(RING.COLOR_PASSED);
        ring.material.emissive.setHex(0x000000);
        ring.material.transparent = true;
        ring.material.opacity = 0.2;

        gameState.addScore(1);
        eventBus.emit(Events.RING_COLLECTED, { ring });
        eventBus.emit(Events.SCORE_CHANGED, { score: gameState.score });

        // Check if all collected
        if (this.rings.every(r => r.userData.collected)) {
          this.respawnRings();
        }
      }
    }
  }

  respawnRings() {
    for (const ring of this.rings) {
      ring.position.set(
        (Math.random() - 0.5) * RING.SPREAD_XZ * 2,
        RING.MIN_Y + Math.random() * (RING.MAX_Y - RING.MIN_Y),
        (Math.random() - 0.5) * RING.SPREAD_XZ * 2
      );
      ring.userData.collected = false;
      ring.userData.baseY = ring.position.y;
      ring.userData.bobOffset = Math.random() * Math.PI * 2;
      ring.material.color.setHex(RING.COLOR);
      ring.material.emissive.setHex(RING.GLOW_COLOR);
      ring.material.transparent = false;
      ring.material.opacity = 1;
    }
  }

  destroy() {
    for (const ring of this.rings) {
      ring.geometry.dispose();
      ring.material.dispose();
      this.scene.remove(ring);
    }
    this.rings = [];
  }
}
