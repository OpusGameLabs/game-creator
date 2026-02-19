// =============================================================================
// TrailEffect.js — Fading speed trail behind the player
//
// Spawns small cyan/green quads at the player's feet that fade and disappear.
// Uses object pooling for performance.
// =============================================================================

import * as THREE from 'three';
import { EFFECTS } from '../core/Constants.js';

const POOL_SIZE = 60; // Enough for ~2 seconds of trail

export class TrailEffect {
  constructor(scene) {
    this.scene = scene;

    this._pool = [];
    this._active = [];
    this._spawnTimer = 0;

    this._geo = new THREE.PlaneGeometry(EFFECTS.TRAIL_SIZE, EFFECTS.TRAIL_SIZE);
    this._baseMat = new THREE.MeshBasicMaterial({
      color: EFFECTS.TRAIL_COLOR,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Pre-allocate trail meshes
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(this._geo, this._baseMat.clone());
      mesh.visible = false;
      // Lay flat on the ground
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
      this._pool.push(mesh);
    }
  }

  /** Update trail: spawn new particles at player feet, fade existing ones */
  update(delta, playerPos, isGameOver) {
    if (isGameOver) {
      // Just fade existing particles, don't spawn new ones
      this._fadeParticles(delta);
      return;
    }

    // Spawn timer
    this._spawnTimer -= delta;
    if (this._spawnTimer <= 0 && playerPos) {
      this._spawnTimer = EFFECTS.TRAIL_SPAWN_RATE;
      this._spawnParticle(playerPos);
    }

    this._fadeParticles(delta);
  }

  _spawnParticle(playerPos) {
    // Find a free mesh from the pool
    let mesh = null;
    for (const m of this._pool) {
      if (!m.visible) {
        mesh = m;
        break;
      }
    }
    if (!mesh) return; // Pool exhausted

    // Position at player feet with slight random offset
    mesh.position.set(
      playerPos.x + (Math.random() - 0.5) * 0.3,
      0.02, // just above ground
      playerPos.z + (Math.random() - 0.5) * 0.2
    );

    mesh.visible = true;
    mesh.material.opacity = 0.6;
    const scale = 0.8 + Math.random() * 0.4;
    mesh.scale.setScalar(scale);

    this._active.push({
      mesh,
      life: EFFECTS.TRAIL_LIFETIME,
      maxLife: EFFECTS.TRAIL_LIFETIME,
    });
  }

  _fadeParticles(delta) {
    for (let i = this._active.length - 1; i >= 0; i--) {
      const p = this._active[i];
      p.life -= delta;

      if (p.life <= 0) {
        p.mesh.visible = false;
        this._active.splice(i, 1);
        continue;
      }

      const t = p.life / p.maxLife;
      p.mesh.material.opacity = t * 0.6;
      // Slight shrink as it fades
      p.mesh.scale.setScalar(t * 0.8 + 0.2);
    }
  }

  /** Reset for game restart */
  reset() {
    for (const p of this._active) {
      p.mesh.visible = false;
    }
    this._active = [];
    this._spawnTimer = 0;
  }

  dispose() {
    for (const mesh of this._pool) {
      this.scene.remove(mesh);
      mesh.material.dispose();
    }
    this._geo.dispose();
    this._baseMat.dispose();
  }
}
