// =============================================================================
// ParticleEffects.js — Collectible pickup burst + speed line effects
//
// Object-pooled particle system:
//   - Pickup burst: green spheres fly outward from collected item position
//   - Speed lines: elongated particles streaming past camera at high speeds
//
// Listens to COLLECTIBLE_PICKED via EventBus for pickup bursts.
// Speed lines are driven by update() based on current game speed.
// =============================================================================

import * as THREE from 'three';
import { EFFECTS } from '../core/Constants.js';
import { eventBus, Events } from '../core/EventBus.js';

export class ParticleEffects {
  constructor(scene) {
    this.scene = scene;

    // --- Pickup Burst Pool ---
    this._burstPool = [];
    this._activeBursts = [];
    this._burstGeo = new THREE.SphereGeometry(0.06, 4, 4);
    this._burstMat = new THREE.MeshBasicMaterial({
      color: 0x00ff44,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Pre-allocate burst particles (enough for ~3 simultaneous bursts)
    const poolSize = EFFECTS.PICKUP_PARTICLE_COUNT * 3;
    for (let i = 0; i < poolSize; i++) {
      const mesh = new THREE.Mesh(this._burstGeo, this._burstMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this._burstPool.push(mesh);
    }

    // --- Speed Lines ---
    this._speedLines = [];
    this._speedLineGeo = new THREE.PlaneGeometry(0.02, EFFECTS.SPEED_LINE_LENGTH);
    this._speedLineMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < EFFECTS.SPEED_LINE_COUNT; i++) {
      const mesh = new THREE.Mesh(this._speedLineGeo, this._speedLineMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this._speedLines.push({
        mesh,
        active: false,
        x: 0, y: 0, z: 0,
        life: 0,
      });
    }

    // --- Wire up EventBus ---
    this._onCollectiblePicked = (data) => {
      if (data && data.position) {
        this._emitBurst(data.position.x, data.position.y, data.position.z);
      }
    };
    eventBus.on(Events.COLLECTIBLE_PICKED, this._onCollectiblePicked);
  }

  /** Emit a burst of particles at a world position */
  _emitBurst(x, y, z) {
    for (let i = 0; i < EFFECTS.PICKUP_PARTICLE_COUNT; i++) {
      // Find a free particle from the pool
      const mesh = this._getFreeParticle();
      if (!mesh) break;

      // Random outward direction (sphere distribution)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const vx = Math.sin(phi) * Math.cos(theta) * EFFECTS.PICKUP_PARTICLE_SPEED;
      const vy = Math.sin(phi) * Math.sin(theta) * EFFECTS.PICKUP_PARTICLE_SPEED * 0.5 +
        EFFECTS.PICKUP_PARTICLE_SPEED * 0.3; // bias upward
      const vz = Math.cos(phi) * EFFECTS.PICKUP_PARTICLE_SPEED;

      mesh.position.set(x, y, z);
      mesh.visible = true;
      mesh.material.opacity = 1;
      mesh.scale.setScalar(1 + Math.random() * 0.5);

      this._activeBursts.push({
        mesh,
        vx, vy, vz,
        life: EFFECTS.PICKUP_PARTICLE_LIFE,
        maxLife: EFFECTS.PICKUP_PARTICLE_LIFE,
      });
    }
  }

  _getFreeParticle() {
    for (const mesh of this._burstPool) {
      if (!mesh.visible) return mesh;
    }
    return null;
  }

  /** Update all active particles and speed lines */
  update(delta, playerZ, cameraPos, currentSpeed) {
    // --- Update burst particles ---
    for (let i = this._activeBursts.length - 1; i >= 0; i--) {
      const p = this._activeBursts[i];
      p.life -= delta;

      if (p.life <= 0) {
        p.mesh.visible = false;
        this._activeBursts.splice(i, 1);
        continue;
      }

      // Move
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      // Gravity on burst particles (slight downward pull)
      p.vy -= 8 * delta;

      // Fade out
      const t = p.life / p.maxLife;
      p.mesh.material.opacity = t;
      p.mesh.scale.setScalar(t * (1 + Math.random() * 0.1));
    }

    // --- Update speed lines ---
    if (currentSpeed >= EFFECTS.SPEED_LINE_THRESHOLD && cameraPos) {
      // Calculate how many lines should be active based on speed
      const speedFactor = (currentSpeed - EFFECTS.SPEED_LINE_THRESHOLD) /
        (40 - EFFECTS.SPEED_LINE_THRESHOLD);
      const targetActive = Math.floor(speedFactor * EFFECTS.SPEED_LINE_COUNT);

      // Activate new lines as needed
      for (const line of this._speedLines) {
        if (!line.active && targetActive > this._countActiveLines()) {
          this._activateSpeedLine(line, cameraPos, playerZ);
        }

        if (line.active) {
          line.z += EFFECTS.SPEED_LINE_SPEED * delta;
          line.mesh.position.z = line.z;

          line.life -= delta;
          if (line.life <= 0 || line.z > cameraPos.z + 5) {
            line.active = false;
            line.mesh.visible = false;
          } else {
            const fadeT = line.life / line.maxLife;
            line.mesh.material.opacity = fadeT * 0.4;
          }
        }
      }
    } else {
      // Deactivate all speed lines below threshold
      for (const line of this._speedLines) {
        if (line.active) {
          line.life -= delta;
          if (line.life <= 0) {
            line.active = false;
            line.mesh.visible = false;
          } else {
            line.mesh.position.z = line.z += EFFECTS.SPEED_LINE_SPEED * delta;
            line.mesh.material.opacity = (line.life / line.maxLife) * 0.4;
          }
        }
      }
    }
  }

  _countActiveLines() {
    let count = 0;
    for (const l of this._speedLines) {
      if (l.active) count++;
    }
    return count;
  }

  _activateSpeedLine(line, cameraPos, playerZ) {
    // Position around the player, ahead and to the sides
    line.x = (Math.random() - 0.5) * 8;
    line.y = Math.random() * 4 + 0.5;
    line.z = playerZ - 20 - Math.random() * 40;
    line.life = 0.6 + Math.random() * 0.4;
    line.maxLife = line.life;
    line.active = true;

    line.mesh.position.set(line.x, line.y, line.z);
    line.mesh.visible = true;
    line.mesh.material.opacity = 0.4;

    // Orient lines along the Z axis (direction of motion)
    line.mesh.rotation.x = 0;
    line.mesh.rotation.y = 0;
    line.mesh.rotation.z = 0;
  }

  /** Reset all particles for game restart */
  reset() {
    for (const p of this._activeBursts) {
      p.mesh.visible = false;
    }
    this._activeBursts = [];

    for (const line of this._speedLines) {
      line.active = false;
      line.mesh.visible = false;
    }
  }

  dispose() {
    eventBus.off(Events.COLLECTIBLE_PICKED, this._onCollectiblePicked);

    for (const mesh of this._burstPool) {
      this.scene.remove(mesh);
      mesh.material.dispose();
    }
    this._burstGeo.dispose();
    this._burstMat.dispose();

    for (const line of this._speedLines) {
      this.scene.remove(line.mesh);
      line.mesh.material.dispose();
    }
    this._speedLineGeo.dispose();
    this._speedLineMat.dispose();
  }
}
